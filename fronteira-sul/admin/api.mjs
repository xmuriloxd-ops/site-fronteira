/**
 * Endereços do painel do administrador:
 *
 *   /admin/                    a tela do painel (arquivos da pasta painel/)
 *   /admin/api/entrar          login; devolve o token da sessão
 *   /admin/api/...             o resto só responde com o token no cabeçalho
 *                              "Authorization: Bearer <token>"
 *
 * O token vai no cabeçalho, não em cookie: páginas de outros sites não
 * conseguem fazer o navegador do administrador enviar pedidos em nome dele.
 */
import path from 'node:path';
import { ErroDeAcesso } from './acesso.mjs';
import { ErroDeConteudo } from './conteudo.mjs';
import { analisarImagem } from './imagem.mjs';

const LIMITE_JSON = 4 * 1024 * 1024;
const LIMITE_IMAGEM = 8 * 1024 * 1024;

const PAINEL = {
  '/admin': 'index.html',
  '/admin/': 'index.html',
  '/admin/painel.css': 'painel.css',
  '/admin/painel.js': 'painel.js',
};

/** O painel só carrega arquivos deste servidor e não aparece em buscadores. */
const CABECALHOS_DO_PAINEL = {
  'Content-Security-Policy':
    "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; form-action 'self'; base-uri 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
};

class ErroHttp extends Error {
  constructor(status, mensagem, cabecalhos = {}) {
    super(mensagem);
    this.status = status;
    this.cabecalhos = cabecalhos;
  }
}

/**
 * Lê o corpo do pedido até `limite` bytes. Passou disso, o pedido é recusado na
 * hora, mas o resto do envio continua sendo recebido e jogado fora (até 8 vezes
 * o limite): se a conexão fosse cortada no meio, o navegador mostraria um erro
 * de rede em vez do motivo da recusa.
 */
function lerCorpo(req, limite, mensagem) {
  return new Promise((resolve, reject) => {
    const teto = limite * 8;
    const declarado = Number(req.headers['content-length']) || 0;
    if (declarado > teto) {
      reject(new ErroHttp(413, mensagem, { Connection: 'close' }));
      return;
    }
    const partes = [];
    let total = 0;
    let recusado = false;
    const recusar = () => {
      recusado = true;
      partes.length = 0;
      reject(new ErroHttp(413, mensagem));
    };
    if (declarado > limite) recusar();
    req.on('data', (parte) => {
      total += parte.length;
      if (recusado) {
        if (total > teto) req.destroy();
      } else if (total > limite) recusar();
      else partes.push(parte);
    });
    req.on('end', () => {
      if (!recusado) resolve(Buffer.concat(partes));
    });
    req.on('error', () => {
      if (!recusado) reject(new ErroHttp(400, 'O envio foi interrompido.'));
    });
  });
}

async function lerJson(req) {
  if (!/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) throw new ErroHttp(415, 'O pedido precisa ser JSON.');
  const corpo = await lerCorpo(req, LIMITE_JSON, 'O conteúdo enviado é grande demais.');
  let dados;
  try {
    dados = JSON.parse(corpo.toString('utf8'));
  } catch {
    throw new ErroHttp(400, 'JSON inválido.');
  }
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) throw new ErroHttp(400, 'Pedido inválido.');
  return dados;
}

function tokenDe(req) {
  const m = /^Bearer ([A-Za-z0-9_-]{20,200})$/.exec(String(req.headers.authorization || ''));
  return m ? m[1] : '';
}

export function criarAdmin({ acesso, conteudo, dirPainel, enviarArquivo, enderecoDe = (req) => req.socket.remoteAddress || 'desconhecido', registrar = () => {} }) {
  function json(req, res, status, dados, extras = {}) {
    const corpo = Buffer.from(JSON.stringify(dados), 'utf8');
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': corpo.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
      ...extras,
    });
    res.end(corpo);
    registrar(req, status);
  }

  /** Rotas da API. Devolve [status, dados] ou lança um erro com status. */
  async function rotear(req, rota) {
    const metodo = req.method;
    const endereco = enderecoDe(req);
    const so = (...aceitos) => {
      if (!aceitos.includes(metodo)) throw new ErroHttp(405, 'Método não aceito neste endereço.', { Allow: aceitos.join(', ') });
    };

    if (rota === 'entrar') {
      so('POST');
      const { usuario, senha } = await lerJson(req);
      return [200, await acesso.entrar(endereco, usuario, senha)];
    }

    // Daqui para baixo, só com sessão aberta.
    const token = tokenDe(req);
    if (!acesso.validar(token)) throw new ErroHttp(401, 'Entre de novo: a sessão expirou ou foi encerrada.');

    if (rota === 'sessao') {
      so('GET');
      return [200, acesso.info()];
    }
    if (rota === 'sair') {
      so('POST');
      acesso.sair(token);
      return [200, { ok: true }];
    }
    if (rota === 'conteudo') {
      so('GET', 'PUT');
      return [200, metodo === 'GET' ? conteudo.descrever() : conteudo.salvar(await lerJson(req))];
    }
    const imagem = /^imagens\/([a-z]{1,20})$/.exec(rota);
    if (imagem) {
      so('PUT', 'DELETE');
      if (metodo === 'DELETE') return [200, conteudo.removerImagem(imagem[1])];
      const corpo = await lerCorpo(req, LIMITE_IMAGEM, `A imagem passa de ${LIMITE_IMAGEM / 1024 / 1024} MB. Envie uma versão menor.`);
      const info = analisarImagem(corpo);
      if (!info) throw new ErroHttp(415, 'Esse arquivo não é uma imagem PNG, JPG, WebP ou GIF.');
      return [200, conteudo.trocarImagem(imagem[1], { corpo, ...info })];
    }
    if (rota === 'acesso') {
      so('POST');
      const { senhaAtual, novoUsuario, novaSenha } = await lerJson(req);
      return [200, await acesso.trocar({ endereco, token, senhaAtual, novoUsuario, novaSenha })];
    }
    const versao = /^historico\/(\d{1,9})\/restaurar$/.exec(rota);
    if (versao) {
      so('POST');
      return [200, conteudo.restaurarDoHistorico(versao[1])];
    }
    if (rota === 'restaurar-original') {
      so('POST');
      return [200, conteudo.restaurarOriginal()];
    }
    throw new ErroHttp(404, 'Endereço desconhecido.');
  }

  /** Atende qualquer endereço que comece com /admin. */
  return async function tratar(req, res, caminho) {
    if (caminho.startsWith('/admin/api/')) {
      try {
        const [status, dados] = await rotear(req, caminho.slice('/admin/api/'.length));
        json(req, res, status, dados);
      } catch (erro) {
        if (erro instanceof ErroHttp) json(req, res, erro.status, { erro: erro.message }, erro.cabecalhos);
        else if (erro instanceof ErroDeAcesso) json(req, res, erro.status, { erro: erro.message, ...(erro.esperar ? { esperar: erro.esperar } : {}) });
        else if (erro instanceof ErroDeConteudo) json(req, res, erro.status, { erro: erro.message });
        else {
          console.error(erro);
          json(req, res, 500, { erro: 'Erro inesperado no servidor.' });
        }
      }
      return;
    }

    const nome = PAINEL[caminho];
    if (!nome) {
      res.writeHead(404, { 'Content-Length': 0, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end();
      registrar(req, 404);
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Length': 0 });
      res.end();
      registrar(req, 405);
      return;
    }
    enviarArquivo(req, res, path.join(dirPainel, nome), CABECALHOS_DO_PAINEL);
  };
}
