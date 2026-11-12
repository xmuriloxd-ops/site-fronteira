#!/usr/bin/env node
/**
 * Servidor do site "Fronteira do Sul RP" (cópia), com o painel do administrador.
 *
 * Os arquivos de ./site são a cópia exata do site original e nunca são
 * reescritos. Tudo o que muda em relação a eles é aplicado na hora de responder:
 *
 *   - o que este projeto mudou no site copiado (admin/mapa.mjs e
 *     admin/convite-no-inicio.mjs): o site começa pelo convite, os créditos e
 *     a aba "Admin";
 *   - o que o administrador muda pelo painel (/admin/), guardado em ./dados.
 *
 * Os arquivos que nenhuma dessas mudanças toca saem exatamente como estão no
 * disco.
 *
 * O site começa pelo convite, e as regras ficam em outra página:
 *
 *   /                           -> o convite            (site/convite/index.html)
 *   /regras  e  /regras/        -> a página de regras   (site/index.html)
 *   /convite  e  /convite/      -> redireciona para /   (o endereço antigo do convite)
 *
 * Com essa opção desligada no painel, os endereços são os do site original:
 * / é a página de regras, /convite e /convite/ são o convite (sem
 * redirecionar), e /regras/ redireciona para /.
 *
 * O resto das respostas segue o servidor original (manus.space):
 *
 *   /qualquer-rota (sem ponto)  -> site/index.html         (rota do aplicativo)
 *   /404                        -> site/index.html com status 404 (a página
 *                                  "não encontrada" do aplicativo)
 *   /arquivo-que-nao-existe.png -> 404 sem corpo
 *   /api/qualquer-coisa         -> 500 sem corpo (no original a API não está no ar)
 *
 * E há os endereços do painel:
 *
 *   /admin/                     -> painel do administrador (pede usuário e senha)
 *   /admin/api/...              -> usado pelo painel
 *
 * Sem dependências: só precisa do Node 18 ou mais novo.
 *
 *   node fronteira-sul/servidor.mjs              # http://localhost:4173
 *   PORT=8080 node fronteira-sul/servidor.mjs    # outra porta
 *
 * Variáveis de ambiente (todas opcionais):
 *
 *   PORT, HOST      porta (4173) e interface (0.0.0.0)
 *   SITE_DIR        pasta com a cópia do site (./site)
 *   DADOS_DIR       pasta onde ficam as alterações, as imagens enviadas e o
 *                   acesso do painel (./dados). Em hospedagem, aponte para um
 *                   disco que não seja apagado a cada publicação.
 *   ADMIN_USUARIO,  usuário e senha iniciais do painel, usados enquanto ninguém
 *   ADMIN_SENHA     trocou pelo painel (padrão: os de admin/acesso.mjs)
 *   CONFIAR_NO_PROXY=1  use quando o site fica atrás de um proxy da hospedagem
 *                   (Render, Railway, nginx...): o limite de tentativas de login
 *                   passa a contar por visitante, pelo cabeçalho X-Forwarded-For
 *   SILENCIOSO=1    não registra cada pedido no terminal
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { criarAcesso } from './admin/acesso.mjs';
import { criarAdmin } from './admin/api.mjs';
import { criarConteudo } from './admin/conteudo.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(process.env.SITE_DIR || path.join(AQUI, 'site'));
const DADOS = path.resolve(process.env.DADOS_DIR || path.join(AQUI, 'dados'));
const PORTA = Number(process.env.PORT) || 4173;
const HOST = process.env.HOST || '0.0.0.0';
const SILENCIOSO = process.env.SILENCIOSO === '1';
const CONFIAR_NO_PROXY = process.env.CONFIAR_NO_PROXY === '1';

/** Mesmos Content-Type que o servidor original devolve para cada extensão. */
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.map': 'application/json',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm',
};

const IMAGENS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.bmp']);
const COMPRIMIVEIS = /^(text\/|application\/(json|manifest\+json|xml)|image\/svg\+xml)/;

const COMUNS = {
  'X-Content-Type-Options': 'nosniff',
  // Sempre revalida: o que for alterado aparece ao recarregar a página.
  'Cache-Control': 'no-cache',
};

/**
 * Imagens são identificadas pelo conteúdo, não pelo nome. No site original o
 * /favicon.ico, por exemplo, é na verdade um arquivo WebP.
 */
function tipoDaImagem(arquivo) {
  let inicio;
  try {
    const fd = fs.openSync(arquivo, 'r');
    inicio = Buffer.alloc(16);
    fs.readSync(fd, inicio, 0, 16, 0);
    fs.closeSync(fd);
  } catch {
    return null;
  }
  const ascii = inicio.toString('latin1');
  if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') return 'image/webp';
  if (ascii.startsWith('\x89PNG')) return 'image/png';
  if (inicio[0] === 0xff && inicio[1] === 0xd8 && inicio[2] === 0xff) return 'image/jpeg';
  if (ascii.startsWith('GIF8')) return 'image/gif';
  if (ascii.slice(4, 12) === 'ftypavif') return 'image/avif';
  if (inicio[0] === 0 && inicio[1] === 0 && inicio[2] === 1 && inicio[3] === 0) return 'image/x-icon';
  if (ascii.startsWith('BM')) return 'image/bmp';
  return null;
}

function tipoDe(arquivo) {
  const ext = path.extname(arquivo).toLowerCase();
  if (IMAGENS.has(ext)) return tipoDaImagem(arquivo) || TIPOS[ext];
  return TIPOS[ext] || 'application/octet-stream';
}

function arquivoComum(caminho) {
  try {
    const info = fs.statSync(caminho);
    return info.isFile() ? info : null;
  } catch {
    return null;
  }
}

function registrar(req, status, extra = '') {
  if (SILENCIOSO) return;
  const hora = new Date().toLocaleTimeString('pt-BR', { hour12: false });
  console.log(`${hora}  ${status}  ${req.method} ${req.url}${extra}`);
}

const avisar = (mensagem) => console.warn(`[aviso] ${mensagem}`);

/**
 * De onde veio o pedido, para o limite de tentativas de login. Atrás de um proxy
 * todos os pedidos chegam com o endereço do proxy; com CONFIAR_NO_PROXY=1 vale o
 * último endereço de X-Forwarded-For (o que o próprio proxy anotou, e que o
 * visitante não consegue forjar).
 */
function enderecoDe(req) {
  if (CONFIAR_NO_PROXY) {
    const anotado = String(req.headers['x-forwarded-for'] || '').split(',').pop().trim();
    if (anotado) return anotado.slice(0, 64);
  }
  return req.socket.remoteAddress || 'desconhecido';
}

const conteudo = criarConteudo({ raizSite: RAIZ, dirDados: DADOS, aviso: avisar });
const acesso = await criarAcesso({
  dirDados: DADOS,
  ...(process.env.ADMIN_USUARIO ? { usuarioInicial: process.env.ADMIN_USUARIO } : {}),
  ...(process.env.ADMIN_SENHA ? { senhaInicial: process.env.ADMIN_SENHA } : {}),
  aviso: avisar,
});
const admin = criarAdmin({ acesso, conteudo, dirPainel: path.join(AQUI, 'admin', 'painel'), enviarArquivo, enderecoDe, registrar });

/** Decide qual arquivo do disco responde a um caminho da URL. */
function localizar(caminhoUrl) {
  let decodificado;
  try {
    decodificado = decodeURIComponent(caminhoUrl);
  } catch {
    return { status: 400 };
  }
  if (decodificado.includes('\0')) return { status: 400 };

  // normalize() resolve os ".." antes de juntar com a raiz: nada escapa de ./site.
  const relativo = path.posix.normalize('/' + decodificado.replace(/\\/g, '/'));
  const alvo = path.join(RAIZ, relativo);
  if (alvo !== RAIZ && !alvo.startsWith(RAIZ + path.sep)) return { status: 403 };

  // Imagem que o administrador trocou pelo painel: sai a nova, no mesmo endereço.
  const troca = conteudo.imagemPara(relativo);
  if (troca) {
    const info = arquivoComum(troca.arquivo);
    if (info) return { status: 200, arquivo: troca.arquivo, info, tipo: troca.tipo || undefined, trocada: true };
  }

  // Endereços que mudam conforme o site começa ou não pelo convite: "/", "/regras/" e "/convite/".
  const pagina = conteudo.paginaPara(relativo);
  if (pagina?.ir) return { status: 302, ir: pagina.ir };
  if (pagina) {
    const arquivo = path.join(RAIZ, pagina.arquivo);
    const info = arquivoComum(arquivo);
    if (info) return { status: 200, arquivo, info };
  }

  const candidatos = relativo.endsWith('/') ? [path.join(alvo, 'index.html')] : [alvo, path.join(alvo, 'index.html')];
  for (const arquivo of candidatos) {
    const info = arquivoComum(arquivo);
    if (info) return { status: 200, arquivo, info };
  }

  // Não existe. O servidor original responde assim:
  //  - /api/...            -> erro 500 (o site publicado não tem API funcionando);
  //  - nome com extensão   -> 404;
  //  - o resto (e .html)   -> é uma rota do aplicativo: responde o index.html da raiz.
  //    O aplicativo manda toda rota desconhecida para /404, e para esse endereço
  //    o original devolve o mesmo index.html, só que com status 404.
  if (relativo === '/api' || relativo.startsWith('/api/')) return { status: 500 };
  const ultimo = relativo.split('/').filter(Boolean).pop() || '';
  if (!ultimo.includes('.') || /\.html?$/i.test(ultimo)) {
    const arquivo = path.join(RAIZ, 'index.html');
    const info = arquivoComum(arquivo);
    const status = relativo === '/404' || relativo === '/404/' ? 404 : 200;
    if (info) return { status, arquivo, info, rotaDoApp: true };
  }
  return { status: 404 };
}

const comprimidos = new Map();
function comprimir(arquivo, info) {
  const chave = `${arquivo}|${info.size}|${info.mtimeMs}`;
  let pronto = comprimidos.get(chave);
  if (!pronto) {
    pronto = zlib.gzipSync(fs.readFileSync(arquivo));
    if (comprimidos.size > 200) comprimidos.clear();
    comprimidos.set(chave, pronto);
  }
  return pronto;
}

function semCorpo(req, res, status, extras = {}) {
  res.writeHead(status, { ...COMUNS, 'Content-Length': 0, ...extras });
  res.end();
  registrar(req, status);
}

const aceitaGzip = (req) => /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''));

/** Envia um arquivo do disco, sem modificar nada nele. */
function enviarArquivo(req, res, arquivo, extras = {}, { status = 200, tipo, info, nota = '' } = {}) {
  info ||= arquivoComum(arquivo);
  if (!info) return semCorpo(req, res, 404);
  tipo ||= tipoDe(arquivo);
  const etag = `W/"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`;
  const cabecalhos = { ...COMUNS, 'Content-Type': tipo, ETag: etag, 'Last-Modified': info.mtime.toUTCString(), ...extras };

  // Só o /404 cai aqui: o arquivo inteiro, com o status que o original usa.
  if (status !== 200) {
    let corpo;
    try {
      corpo = fs.readFileSync(arquivo);
    } catch {
      return semCorpo(req, res, 500);
    }
    res.writeHead(status, { ...COMUNS, 'Content-Type': tipo, 'Content-Length': corpo.length, ...extras });
    res.end(req.method === 'HEAD' ? undefined : corpo);
    return registrar(req, status, nota);
  }

  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, cabecalhos);
    res.end();
    return registrar(req, 304, nota);
  }

  const intervalo = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ''));

  // Texto: vai comprimido (fica bem mais leve na pré-visualização).
  if (!intervalo && aceitaGzip(req) && COMPRIMIVEIS.test(tipo) && info.size > 1024) {
    const corpo = comprimir(arquivo, info);
    res.writeHead(200, { ...cabecalhos, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding', 'Content-Length': corpo.length });
    res.end(req.method === 'HEAD' ? undefined : corpo);
    return registrar(req, 200, nota);
  }

  // Pedaço do arquivo (vídeo e áudio pedem assim para poder avançar).
  if (intervalo && (intervalo[1] || intervalo[2]) && info.size > 0) {
    let inicio;
    let fim;
    if (intervalo[1] === '') {
      inicio = Math.max(0, info.size - Number(intervalo[2]));
      fim = info.size - 1;
    } else {
      inicio = Number(intervalo[1]);
      fim = intervalo[2] === '' ? info.size - 1 : Math.min(Number(intervalo[2]), info.size - 1);
    }
    if (inicio > fim || inicio >= info.size) return semCorpo(req, res, 416, { 'Content-Range': `bytes */${info.size}` });
    res.writeHead(206, {
      ...cabecalhos,
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${inicio}-${fim}/${info.size}`,
      'Content-Length': fim - inicio + 1,
    });
    if (req.method === 'HEAD') res.end();
    else transmitir(arquivo, res, { start: inicio, end: fim });
    return registrar(req, 206, nota);
  }

  res.writeHead(200, { ...cabecalhos, 'Accept-Ranges': 'bytes', 'Content-Length': info.size });
  if (req.method === 'HEAD') res.end();
  else transmitir(arquivo, res);
  return registrar(req, 200, nota);
}

/** Manda o arquivo aos poucos. Se ele sumir no meio do caminho (imagem trocada no painel, por exemplo), só essa resposta é cortada. */
function transmitir(arquivo, res, opcoes) {
  const leitura = fs.createReadStream(arquivo, opcoes);
  leitura.on('error', () => res.destroy());
  res.on('close', () => leitura.destroy());
  leitura.pipe(res);
}

/** Envia um arquivo do site já montado com as alterações do administrador. */
function enviarMontado(req, res, montado, { status, tipo, nota }) {
  const cabecalhos = { ...COMUNS, 'Content-Type': tipo };
  if (status === 200) {
    cabecalhos.ETag = montado.etag;
    if (req.headers['if-none-match'] === montado.etag) {
      res.writeHead(304, cabecalhos);
      res.end();
      return registrar(req, 304, nota);
    }
  }
  let corpo = montado.corpo;
  if (aceitaGzip(req) && corpo.length > 1024) {
    corpo = montado.comprimido();
    cabecalhos['Content-Encoding'] = 'gzip';
    cabecalhos.Vary = 'Accept-Encoding';
  }
  res.writeHead(status, { ...cabecalhos, 'Content-Length': corpo.length });
  res.end(req.method === 'HEAD' ? undefined : corpo);
  return registrar(req, status, nota);
}

async function atender(req, res) {
  let caminhoUrl;
  let consulta;
  try {
    ({ pathname: caminhoUrl, search: consulta } = new URL(req.url, 'http://localhost'));
  } catch {
    return semCorpo(req, res, 400);
  }

  // Painel do administrador (aceita /Admin, /ADMIN...: no celular o teclado costuma pôr maiúscula).
  const minusculo = caminhoUrl.toLowerCase();
  if (minusculo === '/admin' || minusculo.startsWith('/admin/')) return admin(req, res, minusculo);

  if (req.method !== 'GET' && req.method !== 'HEAD') return semCorpo(req, res, 405, { Allow: 'GET, HEAD' });

  const achado = localizar(caminhoUrl);
  // A página está em outro endereço. O redirecionamento é temporário (302) porque depende de uma opção do painel.
  if (achado.ir) return semCorpo(req, res, achado.status, { Location: achado.ir + consulta });
  if (!achado.arquivo) return semCorpo(req, res, achado.status);

  let nota = achado.rotaDoApp ? '  (rota do aplicativo -> index.html)' : '';
  if (achado.trocada) {
    nota += '  (imagem enviada pelo painel)';
  } else {
    const montado = conteudo.gerar(path.relative(RAIZ, achado.arquivo).split(path.sep).join('/'));
    if (montado) return enviarMontado(req, res, montado, { status: achado.status, tipo: tipoDe(achado.arquivo), nota });
  }
  return enviarArquivo(req, res, achado.arquivo, {}, { status: achado.status, tipo: achado.tipo, info: achado.info, nota });
}

const servidor = http.createServer((req, res) => {
  atender(req, res).catch((erro) => {
    console.error(erro);
    if (!res.headersSent) res.writeHead(500, { ...COMUNS, 'Content-Length': 0 });
    res.end();
  });
});

servidor.on('error', (erro) => {
  if (erro.code === 'EADDRINUSE') {
    console.error(`A porta ${PORTA} já está em uso. Tente outra: PORT=8080 node fronteira-sul/servidor.mjs`);
  } else {
    console.error(erro);
  }
  process.exit(1);
});

if (!arquivoComum(path.join(RAIZ, 'index.html'))) {
  console.error(`Não encontrei ${path.join(RAIZ, 'index.html')}. A pasta "site" precisa ficar ao lado deste arquivo.`);
  process.exit(1);
}

conteudo.carregar();

servidor.listen(PORTA, HOST, () => {
  const onde = conteudo.enderecos();
  console.log('Fronteira do Sul RP — site e painel do administrador');
  console.log(`  Convite       : http://localhost:${PORTA}${onde.convite}`);
  console.log(`  Regras        : http://localhost:${PORTA}${onde.regras}`);
  console.log(`  Painel        : http://localhost:${PORTA}/admin/`);
  console.log(`  Cópia do site : ${RAIZ}`);
  console.log(`  Alterações    : ${DADOS}`);
  if (acesso.info().senhaInicial) console.log('  Atenção       : o painel ainda usa a senha inicial. Troque no painel, em "Usuário e senha".');
  console.log('  Para encerrar : Ctrl+C');
});

for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => {
    servidor.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 500).unref();
  });
}
