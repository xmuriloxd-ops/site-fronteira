/**
 * Endereços do painel do administrador:
 *
 *   /admin/                    a tela do painel (arquivos da pasta painel/)
 *   /admin/api/entrar          login; devolve o token da sessão
 *   /admin/api/...             o resto só responde a quem manda esse token
 *
 * Todo pedido à API é um POST com o corpo em JSON, e o token da sessão vai
 * dentro do corpo, no campo "sessao".
 *
 * Não vai em cookie: páginas de outros sites não conseguem fazer o navegador
 * do administrador enviar pedidos em nome dele.
 *
 * E não vai em cabeçalho. Ia, em "Authorization", e o painel usava também GET,
 * PUT e DELETE. Só que entre o navegador e este servidor quase sempre há um
 * intermediário (o da hospedagem, o de uma tela de prévia), e nem todos
 * entregam esse cabeçalho: o login era aceito e o pedido seguinte chegava aqui
 * sem a sessão. Um POST com JSON é o que o próprio login usa; se o login
 * chega, o resto chega do mesmo jeito.
 *
 * Pelo mesmo motivo, a página do painel pede os arquivos dela (painel.css e
 * painel.js) com a versão no endereço, e ela mesma nunca é guardada: um
 * intermediário pode guardar arquivos por um tempo sem perguntar se mudaram,
 * e o navegador ficaria com um painel.js antigo falando com um servidor novo.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ErroDeAcesso } from './acesso.mjs';
import { ErroDeConteudo } from './conteudo.mjs';
import { analisarImagem } from './imagem.mjs';

const LIMITE_JSON = 4 * 1024 * 1024;
const LIMITE_IMAGEM = 8 * 1024 * 1024;
// A imagem vem dentro do JSON, em base64 (4 letras para cada 3 bytes), junto com a sessão.
const LIMITE_JSON_COM_IMAGEM = Math.ceil(LIMITE_IMAGEM / 3) * 4 + 1024;
const IMAGEM_GRANDE = `A imagem passa de ${LIMITE_IMAGEM / 1024 / 1024} MB. Envie uma versão menor.`;
const ROTA_DE_IMAGEM = /^imagens\/([a-z]{1,20})$/;

const PAINEL = {
  '/admin': 'index.html',
  '/admin/': 'index.html',
  '/admin/painel.css': 'painel.css',
  '/admin/painel.js': 'painel.js',
};
/** Os arquivos que a página do painel carrega; cada um é pedido com a versão dele no endereço. */
const ARQUIVOS_DA_TELA = ['painel.css', 'painel.js'];
/**
 * O que um painel aberto antes de uma atualização recebe quando faz um pedido
 * do jeito antigo (GET, PUT ou DELETE): ele mostra este texto na tela.
 */
const TELA_ANTIGA = 'O painel foi atualizado e esta tela ficou antiga: recarregue a página. (Este endereço só aceita pedidos POST.)';

/** O painel só carrega arquivos deste servidor e não aparece em buscadores. */
const CABECALHOS_DO_PAINEL = {
  'Content-Security-Policy':
    "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; form-action 'self'; base-uri 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
};

class ErroHttp extends Error {
  /** `nota` aparece só no registro do servidor, ao lado do pedido. */
  constructor(status, mensagem, cabecalhos = {}, nota = '') {
    super(mensagem);
    this.status = status;
    this.cabecalhos = cabecalhos;
    this.nota = nota;
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

async function lerJson(req, limite = LIMITE_JSON, grandeDemais = 'O conteúdo enviado é grande demais.') {
  if (!/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) throw new ErroHttp(415, 'O pedido precisa ser JSON.');
  const corpo = await lerCorpo(req, limite, grandeDemais);
  let dados;
  try {
    dados = JSON.parse(corpo.toString('utf8'));
  } catch {
    throw new ErroHttp(400, 'JSON inválido.');
  }
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) throw new ErroHttp(400, 'Pedido inválido.');
  return dados;
}

/** O token da sessão que veio no corpo do pedido, ou '' se não veio nenhum com cara de token. */
function sessaoDe(dados) {
  return typeof dados.sessao === 'string' && /^[A-Za-z0-9_-]{20,200}$/.test(dados.sessao) ? dados.sessao : '';
}

/** Os bytes da imagem que veio no campo "arquivo", em base64. */
function imagemDe(dados) {
  const texto = dados.arquivo;
  if (typeof texto !== 'string' || texto.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(texto)) throw new ErroHttp(400, 'A imagem não chegou inteira. Tente enviar de novo.');
  const corpo = Buffer.from(texto, 'base64');
  if (corpo.length > LIMITE_IMAGEM) throw new ErroHttp(413, IMAGEM_GRANDE);
  return corpo;
}

export function criarAdmin({ acesso, conteudo, dirPainel, enviarArquivo, enderecoDe = (req) => req.socket.remoteAddress || 'desconhecido', registrar = () => {} }) {
  function json(req, res, status, dados, extras = {}, nota = '') {
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
    registrar(req, status, nota ? `  (${nota})` : '');
  }

  /** Rotas da API. Devolve [status, dados] ou lança um erro com status. */
  async function rotear(req, rota) {
    if (req.method !== 'POST') throw new ErroHttp(405, TELA_ANTIGA, { Allow: 'POST' });
    const endereco = enderecoDe(req);
    const deImagem = ROTA_DE_IMAGEM.exec(rota);
    const dados = deImagem ? await lerJson(req, LIMITE_JSON_COM_IMAGEM, IMAGEM_GRANDE) : await lerJson(req);

    if (rota === 'entrar') return [200, await acesso.entrar(endereco, dados.usuario, dados.senha)];

    // Daqui para baixo, só com sessão aberta. (Quem não entrou não fica sabendo nem quais endereços existem.)
    const token = sessaoDe(dados);
    if (!acesso.validar(token)) {
      throw new ErroHttp(401, 'Entre de novo: a sessão expirou ou foi encerrada.', {}, token ? 'sessão desconhecida ou vencida' : 'pedido sem sessão');
    }

    if (rota === 'sessao') return [200, acesso.info()];
    if (rota === 'sair') {
      acesso.sair(token);
      return [200, { ok: true }];
    }
    if (rota === 'conteudo') return [200, conteudo.descrever()];
    if (rota === 'conteudo/salvar') {
      // (a sessão é do pedido, e não do conteúdo: fica de fora do que é entregue para guardar)
      const { sessao: _, ...envio } = dados;
      return [200, conteudo.salvar(envio)];
    }
    if (deImagem) {
      const corpo = imagemDe(dados);
      const info = analisarImagem(corpo);
      if (!info) throw new ErroHttp(415, 'Esse arquivo não é uma imagem PNG, JPG, WebP ou GIF.');
      return [200, conteudo.trocarImagem(deImagem[1], { corpo, ...info })];
    }
    const semImagem = /^imagens\/([a-z]{1,20})\/remover$/.exec(rota);
    if (semImagem) return [200, conteudo.removerImagem(semImagem[1])];
    if (rota === 'acesso') {
      const { senhaAtual, novoUsuario, novaSenha } = dados;
      return [200, await acesso.trocar({ endereco, token, senhaAtual, novoUsuario, novaSenha })];
    }
    const versao = /^historico\/(\d{1,9})\/restaurar$/.exec(rota);
    if (versao) return [200, conteudo.restaurarDoHistorico(versao[1])];
    if (rota === 'restaurar-original') return [200, conteudo.restaurarOriginal()];
    throw new ErroHttp(404, 'Endereço desconhecido.');
  }

  /**
   * A página do painel, com a versão de cada arquivo no endereço dele
   * ("/admin/painel.js?v=abc"). A versão é um resumo do conteúdo: quando o
   * arquivo muda, o endereço muda, e ninguém tem o endereço novo guardado.
   */
  function paginaDoPainel() {
    let html = fs.readFileSync(path.join(dirPainel, 'index.html'), 'utf8');
    for (const nome of ARQUIVOS_DA_TELA) {
      const versao = crypto.createHash('sha1').update(fs.readFileSync(path.join(dirPainel, nome))).digest('base64url').slice(0, 10);
      html = html.split(`"/admin/${nome}"`).join(`"/admin/${nome}?v=${versao}"`);
    }
    return Buffer.from(html, 'utf8');
  }

  /** Atende qualquer endereço que comece com /admin. */
  return async function tratar(req, res, caminho) {
    if (caminho.startsWith('/admin/api/')) {
      try {
        const [status, dados] = await rotear(req, caminho.slice('/admin/api/'.length));
        json(req, res, status, dados);
      } catch (erro) {
        if (erro instanceof ErroHttp) json(req, res, erro.status, { erro: erro.message }, erro.cabecalhos, erro.nota);
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
    if (nome === 'index.html') {
      let corpo;
      try {
        corpo = paginaDoPainel();
      } catch (erro) {
        console.error(erro);
        res.writeHead(500, { 'Content-Length': 0, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
        res.end();
        registrar(req, 500);
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': corpo.length,
        'X-Content-Type-Options': 'nosniff',
        ...CABECALHOS_DO_PAINEL,
        // A página é montada a cada pedido e nunca é guardada: é ela que diz qual é a versão dos arquivos.
        'Cache-Control': 'no-store',
      });
      res.end(req.method === 'HEAD' ? undefined : corpo);
      registrar(req, 200);
      return;
    }
    enviarArquivo(req, res, path.join(dirPainel, nome), CABECALHOS_DO_PAINEL);
  };
}
