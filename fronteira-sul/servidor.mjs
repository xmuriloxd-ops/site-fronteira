#!/usr/bin/env node
/**
 * Servidor local da cópia do site "Fronteira do Sul RP".
 *
 * Entrega a pasta ./site exatamente como ela está no disco — nenhum arquivo é
 * reescrito, minificado ou injetado — e responde do mesmo jeito que o servidor
 * original (manus.space):
 *
 *   /convite  e  /convite/      -> site/convite/index.html (sem redirecionar)
 *   /qualquer-rota (sem ponto)  -> site/index.html         (rota do aplicativo)
 *   /arquivo-que-nao-existe.png -> 404 sem corpo
 *   /api/qualquer-coisa         -> 500 sem corpo (no original a API não está no ar)
 *
 * Sem dependências: só precisa do Node 18 ou mais novo.
 *
 *   node fronteira-sul/servidor.mjs              # http://localhost:4173
 *   PORT=8080 node fronteira-sul/servidor.mjs    # outra porta
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(process.env.SITE_DIR || path.join(AQUI, 'site'));
const PORTA = Number(process.env.PORT) || 4173;
const HOST = process.env.HOST || '0.0.0.0';
const SILENCIOSO = process.env.SILENCIOSO === '1';

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

  const candidatos = relativo.endsWith('/') ? [path.join(alvo, 'index.html')] : [alvo, path.join(alvo, 'index.html')];
  for (const arquivo of candidatos) {
    const info = arquivoComum(arquivo);
    if (info) return { status: 200, arquivo, info };
  }

  // Não existe. O servidor original responde assim:
  //  - /api/...            -> erro 500 (o site publicado não tem API funcionando);
  //  - nome com extensão   -> 404;
  //  - o resto (e .html)   -> é uma rota do aplicativo: responde o index.html da raiz.
  if (relativo === '/api' || relativo.startsWith('/api/')) return { status: 500 };
  const ultimo = relativo.split('/').filter(Boolean).pop() || '';
  if (!ultimo.includes('.') || /\.html?$/i.test(ultimo)) {
    const arquivo = path.join(RAIZ, 'index.html');
    const info = arquivoComum(arquivo);
    if (info) return { status: 200, arquivo, info, rotaDoApp: true };
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

function registrar(req, status, extra = '') {
  if (SILENCIOSO) return;
  const hora = new Date().toLocaleTimeString('pt-BR', { hour12: false });
  console.log(`${hora}  ${status}  ${req.method} ${req.url}${extra}`);
}

const servidor = http.createServer((req, res) => {
  const comuns = {
    'X-Content-Type-Options': 'nosniff',
    // Sempre revalida: o que você editar aparece ao recarregar a página.
    'Cache-Control': 'no-cache',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { ...comuns, Allow: 'GET, HEAD', 'Content-Length': 0 });
    res.end();
    registrar(req, 405);
    return;
  }

  let caminhoUrl;
  try {
    caminhoUrl = new URL(req.url, 'http://localhost').pathname;
  } catch {
    res.writeHead(400, { ...comuns, 'Content-Length': 0 });
    res.end();
    registrar(req, 400);
    return;
  }

  const achado = localizar(caminhoUrl);
  if (achado.status !== 200) {
    res.writeHead(achado.status, { ...comuns, 'Content-Length': 0 });
    res.end();
    registrar(req, achado.status);
    return;
  }

  const { arquivo, info } = achado;
  const tipo = tipoDe(arquivo);
  const etag = `W/"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`;
  const cabecalhos = { ...comuns, 'Content-Type': tipo, ETag: etag, 'Last-Modified': info.mtime.toUTCString() };
  const nota = achado.rotaDoApp ? '  (rota do aplicativo -> index.html)' : '';

  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, cabecalhos);
    res.end();
    registrar(req, 304, nota);
    return;
  }

  const aceitaGzip = /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''));
  const intervalo = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ''));

  // Texto: vai comprimido (fica bem mais leve na pré-visualização).
  if (!intervalo && aceitaGzip && COMPRIMIVEIS.test(tipo) && info.size > 1024) {
    const corpo = comprimir(arquivo, info);
    res.writeHead(200, { ...cabecalhos, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding', 'Content-Length': corpo.length });
    res.end(req.method === 'HEAD' ? undefined : corpo);
    registrar(req, 200, nota);
    return;
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
    if (inicio > fim || inicio >= info.size) {
      res.writeHead(416, { ...comuns, 'Content-Range': `bytes */${info.size}`, 'Content-Length': 0 });
      res.end();
      registrar(req, 416);
      return;
    }
    res.writeHead(206, {
      ...cabecalhos,
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${inicio}-${fim}/${info.size}`,
      'Content-Length': fim - inicio + 1,
    });
    if (req.method === 'HEAD') res.end();
    else fs.createReadStream(arquivo, { start: inicio, end: fim }).pipe(res);
    registrar(req, 206, nota);
    return;
  }

  res.writeHead(200, { ...cabecalhos, 'Accept-Ranges': 'bytes', 'Content-Length': info.size });
  if (req.method === 'HEAD') {
    res.end();
  } else {
    const leitura = fs.createReadStream(arquivo);
    leitura.on('error', () => res.destroy());
    leitura.pipe(res);
  }
  registrar(req, 200, nota);
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

servidor.listen(PORTA, HOST, () => {
  console.log('Fronteira do Sul RP — cópia local do site');
  console.log(`  Pasta servida : ${RAIZ}`);
  console.log(`  Regras        : http://localhost:${PORTA}/`);
  console.log(`  Convite       : http://localhost:${PORTA}/convite/`);
  console.log('  Para encerrar : Ctrl+C');
});

for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => {
    servidor.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 500).unref();
  });
}
