#!/usr/bin/env node
/**
 * Cópia exata (byte a byte) do site publicado em ORIGEM para fronteira-sul/site,
 * seguida de uma conferência da cópia contra o original num Chrome de verdade.
 *
 * Roda no GitHub Actions: o ambiente de edição não tem acesso ao site original.
 * Nada do conteúdo baixado é alterado; cada arquivo vai para o mesmo caminho que
 * tem na URL (/assets/x.js -> site/assets/x.js).
 *
 * Etapas: 1) baixa as páginas e tudo que elas referenciam; 2) abre o original no
 * navegador para achar o que só aparece em tempo de execução; 3) sonda o
 * comportamento do servidor; 4) abre a cópia (com o site original bloqueado) e
 * compara com o original: conteúdo, posições, pixels e interações.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { setTimeout as dormir } from 'node:timers/promises';

// ───────────────────────────── configuração ─────────────────────────────
const ORIGEM = (process.env.ORIGEM || 'https://fronteirasul-fmudazpm.manus.space').replace(/\/+$/, '');
const HOST_ORIGEM = new URL(ORIGEM).host;
const PAGINAS = (process.env.PAGINAS || '/convite/?v=c14b569|/').split('|').filter(Boolean);
const RAIZ = path.resolve(process.env.PASTA || 'fronteira-sul');
const DIR_SITE = path.join(RAIZ, 'site');
const DIR_SAIDA = path.join(RAIZ, '_copia', 'saida');
const PORTA_LOCAL = Number(process.env.PORTA_LOCAL || 4173);
const LOCAL = `http://127.0.0.1:${PORTA_LOCAL}`;
const FERRAMENTAS = path.resolve(process.env.FERRAMENTAS || '.');
const SEM_NAVEGADOR = process.env.SEM_NAVEGADOR === '1';
const ROTA_INEXISTENTE = '/pagina-que-nao-existe';
const TERMO_BUSCA = process.env.TERMO_BUSCA || 'arma';

const exigir = createRequire(path.join(FERRAMENTAS, 'ferramentas.cjs'));

const UA = {
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  movel: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
};

// ───────────────────────────── utilidades ─────────────────────────────
const inicio = Date.now();
const log = (...a) => console.log(`[${((Date.now() - inicio) / 1000).toFixed(1).padStart(6)}s]`, ...a);
const avisos = [];
const avisar = (msg) => {
  avisos.push(msg);
  log('AVISO:', msg);
};
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const semNonce = (b) => (Buffer.isBuffer(b) ? b.toString('utf8') : String(b)).replace(/\bnonce="[^"]*"/g, 'nonce=""');
const ehHtml = (ct) => /\btext\/html\b/i.test(ct || '');
const curto = (u) => (u.length > 160 ? `${u.slice(0, 157)}...` : u);
const semAssinatura = (u) => {
  const i = u.indexOf('?');
  return i > 0 && u.length > 200 ? `${u.slice(0, i)}?…` : u;
};

function gravar(arquivo, dados) {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  fs.writeFileSync(arquivo, dados);
}

function decodificarEntidades(s) {
  return String(s)
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
}

// ───────────────────────────── download ─────────────────────────────
async function baixar(url, { ua = UA.desktop, seguir = true } = {}) {
  const cadeia = [];
  let atual = url;
  for (let salto = 0; salto < 12; salto++) {
    const r = await fetch(atual, {
      redirect: 'manual',
      signal: AbortSignal.timeout(60000),
      headers: { 'user-agent': ua, accept: '*/*', 'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7' },
    });
    const cabecalhos = Object.fromEntries(r.headers);
    if (seguir && r.status >= 300 && r.status < 400 && cabecalhos.location) {
      await r.arrayBuffer().catch(() => {});
      const proximo = new URL(cabecalhos.location, atual).href;
      cadeia.push({ de: semAssinatura(atual), status: r.status, para: semAssinatura(proximo) });
      atual = proximo;
      continue;
    }
    const corpo = Buffer.from(await r.arrayBuffer());
    return { status: r.status, cabecalhos, corpo, cadeia, urlFinal: atual };
  }
  throw new Error('redirecionamentos demais');
}

async function baixarComTentativas(url, opcoes) {
  let ultimoErro;
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    try {
      const r = await baixar(url, opcoes);
      if ((r.status >= 500 || r.status === 429) && tentativa < 4) {
        await dormir(800 * tentativa);
        continue;
      }
      return r;
    } catch (erro) {
      ultimoErro = erro;
      await dormir(800 * tentativa);
    }
  }
  throw ultimoErro || new Error('falhou');
}

// ───────────────────────────── registro de recursos ─────────────────────────────
/** @type {Map<string, any>} */
const recursos = new Map();
const fila = [];
const destinos = new Map(); // caminho relativo em site/ -> { reg, comparavel }
const linksExternos = new Map();
const outrosLinks = new Set();
const urlsEmJs = new Set();
let indexRaizNorm = null;

function enfileirar(bruto, base, por, { candidato = false, pagina = false } = {}) {
  if (!bruto) return null;
  const valor = String(bruto).trim();
  if (!valor || /^(data|blob|javascript|about|mailto|tel|chrome|chrome-extension|devtools):/i.test(valor) || valor.startsWith('#')) return null;
  let u;
  try {
    u = new URL(valor, base);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol)) return null;
  u.hash = '';
  const chave = u.href;
  let reg = recursos.get(chave);
  if (!reg) {
    reg = { url: chave, mesmoSite: u.host === HOST_ORIGEM, por: new Set(), candidato, pagina, estado: 'fila' };
    recursos.set(chave, reg);
    fila.push(reg);
  }
  if (por) reg.por.add(por);
  if (!candidato) reg.candidato = false;
  return reg;
}

function registrarLink(bruto, base, por) {
  if (!bruto) return;
  const valor = String(bruto).trim();
  if (!valor || valor.startsWith('#')) return;
  let u;
  try {
    u = new URL(valor, base);
  } catch {
    return;
  }
  if (!/^https?:$/.test(u.protocol)) {
    outrosLinks.add(valor.slice(0, 200));
    return;
  }
  if (u.host === HOST_ORIGEM) {
    enfileirar(u.href, base, por, { candidato: true, pagina: true });
  } else {
    u.hash = '';
    if (!linksExternos.has(u.href)) linksExternos.set(u.href, new Set());
    linksExternos.get(u.href).add(por);
  }
}

// ───────────────────────────── extração de referências ─────────────────────────────
function atributos(texto) {
  const a = {};
  const re = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(texto))) a[m[1].toLowerCase()] = decodificarEntidades(m[2] ?? m[3] ?? m[4] ?? '');
  return a;
}

const urlsDeSrcset = (v) =>
  String(v)
    .split(',')
    .map((parte) => parte.trim().split(/\s+/)[0])
    .filter(Boolean);

function extrairCss(css, base, por) {
  for (const m of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s][^)]*?))\s*\)/g)) {
    const v = (m[1] ?? m[2] ?? m[3] ?? '').trim().replace(/\\(.)/g, '$1');
    if (v) enfileirar(v, base, por);
  }
  for (const m of css.matchAll(/@import\s+(?:url\(\s*)?(?:"([^"]+)"|'([^']+)'|([^\s;)'"]+))/g)) {
    enfileirar(m[1] ?? m[2] ?? m[3], base, por);
  }
}

const EXT_ARQUIVO =
  'js|mjs|cjs|css|png|jpe?g|webp|avif|svg|gif|ico|bmp|tiff?|woff2?|ttf|otf|eot|mp4|webm|mov|m4v|mp3|ogg|oga|wav|m4a|aac|flac|json|webmanifest|txt|xml|pdf|map|wasm|glb|gltf|lottie|riv|csv|md|vtt|srt|zip';
const RE_ARQUIVO_EM_JS = new RegExp(
  '(["\'`])([^"\'`\\s\\\\<>{}|^]{1,400}?\\.(?:' + EXT_ARQUIVO + ')(?:\\?[^"\'`\\s\\\\]{0,300})?)\\1',
  'gi',
);

function extrairJs(js, base, por) {
  for (const m of js.matchAll(/https?:\/\/[^\s"'`<>\\)]{4,300}/g)) urlsEmJs.add(m[0]);
  for (const m of js.matchAll(RE_ARQUIVO_EM_JS)) {
    const s = m[2];
    if (s.length < 4) continue;
    if (/^https?:\/\//i.test(s) || s.startsWith('//')) {
      enfileirar(s, base, por, { candidato: true });
    } else if (s.startsWith('/')) {
      enfileirar(s, `${ORIGEM}/`, por, { candidato: true });
    } else if (/^[A-Za-z0-9_@.~+%$-][A-Za-z0-9_@.~+%$/-]*(\?.*)?$/.test(s)) {
      enfileirar(s, base, por, { candidato: true });
      if (!s.startsWith('.')) enfileirar(s, `${ORIGEM}/`, por, { candidato: true });
    }
  }
}

function extrairJsonTexto(texto, base, por) {
  let dados;
  try {
    dados = JSON.parse(texto);
  } catch {
    return;
  }
  const re = new RegExp('\\.(?:' + EXT_ARQUIVO + ')(?:\\?.*)?$', 'i');
  const andar = (v) => {
    if (typeof v === 'string') {
      if (v.length < 500 && !/\s/.test(v) && (re.test(v) || /^https?:\/\//i.test(v)) && !v.startsWith('data:')) {
        if (re.test(v)) enfileirar(v, base, por, { candidato: true });
      }
    } else if (Array.isArray(v)) v.forEach(andar);
    else if (v && typeof v === 'object') Object.values(v).forEach(andar);
  };
  andar(dados);
}

function extrairHtml(html, urlPagina, por) {
  let base = urlPagina;
  const mBase = html.match(/<base\b[^>]*\bhref\s*=\s*["']?([^"'\s>]+)/i);
  if (mBase) {
    try {
      base = new URL(decodificarEntidades(mBase[1]), urlPagina).href;
    } catch {
      /* base invalida: ignora */
    }
  }
  const limpo = html.replace(/<!--[\s\S]*?-->/g, '');

  for (const m of limpo.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const a = atributos(m[1]);
    if (a.src || !m[2].trim()) continue;
    if ((a.type || '').toLowerCase().includes('json')) extrairJsonTexto(m[2], base, por);
    else extrairJs(m[2], base, por);
  }
  for (const m of limpo.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) extrairCss(m[1], base, por);

  const soTags = limpo
    .replace(/(<script\b[^>]*>)[\s\S]*?<\/script\s*>/gi, '$1')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '');

  for (const m of soTags.matchAll(/<([a-zA-Z][a-zA-Z0-9:-]*)\b((?:"[^"]*"|'[^']*'|[^>"'])*)>/g)) {
    const tag = m[1].toLowerCase();
    const a = atributos(m[2]);
    const ref = (v) => enfileirar(v, base, por);
    switch (tag) {
      case 'a':
      case 'area':
        registrarLink(a.href, base, por);
        break;
      case 'link': {
        if (!a.href) break;
        const rel = (a.rel || '').toLowerCase().split(/\s+/);
        const soLink = ['canonical', 'alternate', 'dns-prefetch', 'preconnect', 'author', 'license', 'next', 'prev', 'me', 'help', 'search'];
        if (rel.some((r) => soLink.includes(r))) registrarLink(a.href, base, por);
        else {
          ref(a.href);
          if (a.imagesrcset) urlsDeSrcset(a.imagesrcset).forEach(ref);
        }
        break;
      }
      case 'script':
        ref(a.src);
        break;
      case 'img':
      case 'source':
        ref(a.src);
        ref(a['data-src']);
        if (a.srcset) urlsDeSrcset(a.srcset).forEach(ref);
        if (a['data-srcset']) urlsDeSrcset(a['data-srcset']).forEach(ref);
        break;
      case 'video':
        ref(a.src);
        ref(a.poster);
        break;
      case 'audio':
      case 'track':
      case 'embed':
      case 'input':
        ref(a.src);
        break;
      case 'iframe':
      case 'frame':
        registrarLink(a.src, base, por);
        break;
      case 'object':
        ref(a.data);
        break;
      case 'use':
      case 'image':
        ref(a.href || a['xlink:href']);
        break;
      case 'meta': {
        const chave = (a.property || a.name || a.itemprop || '').toLowerCase();
        if (/(^|:)(image|video|audio)(:secure_url|:url|:src)?$/.test(chave) || (chave.startsWith('msapplication-') && /\.(png|jpe?g|xml|ico|svg)(\?|$)/i.test(a.content || ''))) ref(a.content);
        else if (chave === 'og:url') registrarLink(a.content, base, por);
        break;
      }
      default:
        if (a.background) ref(a.background);
    }
    if (a.style) extrairCss(a.style, base, por);
  }
}

function mapaDeFonte(texto, reg) {
  const m = texto.slice(-2000).match(/[/*]#\s*sourceMappingURL=([^\s*]+)/);
  if (m && !m[1].startsWith('data:')) enfileirar(m[1], reg.url, reg.url, { candidato: true });
  else if (!m) enfileirar(`${reg.url.split('?')[0]}.map`, reg.url, reg.url, { candidato: true });
}

function extrairFontesDoMapa(reg, corpo) {
  try {
    const mapa = JSON.parse(corpo.toString('utf8'));
    if (!Array.isArray(mapa.sources) || !Array.isArray(mapa.sourcesContent)) return;
    let n = 0;
    mapa.sources.forEach((origem, i) => {
      const conteudo = mapa.sourcesContent[i];
      if (typeof conteudo !== 'string') return;
      if (/node_modules/.test(origem)) return;
      const limpo = String(origem)
        .replace(/^[a-z]+:\/\/+/i, '')
        .replace(/\.\.\//g, '')
        .replace(/^\.?\/+/, '')
        .replace(/[^A-Za-z0-9._\-/@+]/g, '_');
      gravar(path.join(DIR_SAIDA, 'fontes', limpo), conteudo);
      n++;
    });
    reg.fontesExtraidas = n;
    log(`  mapa de fonte ${reg.url}: ${n} arquivo(s) de codigo-fonte extraidos`);
  } catch (erro) {
    avisar(`mapa de fonte ilegivel ${reg.url}: ${erro.message}`);
  }
}

function analisar(reg, corpo) {
  const ct = (reg.contentType || '').toLowerCase();
  let ext = '';
  try {
    ext = path.posix.extname(new URL(reg.url).pathname).toLowerCase();
  } catch {
    /* sem extensao */
  }
  const base = reg.mesmoSite ? reg.url : reg.urlFinal || reg.url;
  const texto = () => corpo.toString('utf8');

  if (ehHtml(ct)) {
    if (reg.mesmoSite) extrairHtml(texto(), reg.url, reg.url);
    return;
  }
  if (ct.includes('text/css') || ext === '.css') {
    extrairCss(texto(), base, reg.url);
    if (reg.mesmoSite) mapaDeFonte(texto(), reg);
    return;
  }
  if (!reg.mesmoSite) return;
  if (ext === '.map') {
    extrairFontesDoMapa(reg, corpo);
    return;
  }
  if (ct.includes('javascript') || ct.includes('ecmascript') || ['.js', '.mjs', '.cjs'].includes(ext)) {
    extrairJs(texto(), reg.url, reg.url);
    mapaDeFonte(texto(), reg);
    return;
  }
  if (ct.includes('json') || ['.json', '.webmanifest'].includes(ext)) {
    extrairJsonTexto(texto(), reg.url, reg.url);
    return;
  }
  if (ct.includes('svg') || ext === '.svg') {
    extrairCss(texto(), reg.url, reg.url);
    return;
  }
  if (ct.includes('xml') || ext === '.xml') {
    for (const m of texto().matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) registrarLink(decodificarEntidades(m[1]), reg.url, reg.url);
    return;
  }
  if (ext === '.txt') {
    for (const m of texto().matchAll(/^\s*sitemap:\s*(\S+)/gim)) enfileirar(m[1], reg.url, reg.url, { candidato: true });
  }
}

// ───────────────────────────── gravação ─────────────────────────────
function destinoMesmoSite(reg, corpo) {
  const u = new URL(reg.url);
  let p;
  try {
    p = decodeURIComponent(u.pathname);
  } catch {
    p = u.pathname;
  }
  const ext = path.posix.extname(p).toLowerCase();
  if (ehHtml(reg.contentType)) {
    if (ext && ext !== '.html' && ext !== '.htm') return { descartar: 'HTML servido no lugar de um arquivo' };
    const raiz = p === '/' || p === '/index.html';
    if (!raiz && indexRaizNorm !== null && semNonce(corpo) === indexRaizNorm) {
      return { descartar: 'rota do aplicativo: o servidor devolve o index.html da raiz', rotaSpa: true };
    }
    if (p.endsWith('/')) p += 'index.html';
    else if (!ext) p += '/index.html';
  } else if (p.endsWith('/')) {
    p += 'index';
  }
  const rel = path.posix.normalize(p).replace(/^\/+/, '');
  if (!rel || rel.startsWith('..') || rel.includes('\0')) return { descartar: 'caminho invalido' };
  return { rel };
}

function salvarMesmoSite(reg, corpo) {
  if (reg.status === 404 && ehHtml(reg.contentType) && indexRaizNorm !== null && semNonce(corpo) === indexRaizNorm) {
    // A pagina "nao encontrada" do aplicativo: o index.html da raiz, com status 404.
    reg.estado = 'rota-do-app';
    reg.motivo = 'pagina "nao encontrada" do aplicativo: o servidor devolve o index.html da raiz com status 404';
    return false;
  }
  if (reg.status !== 200) {
    reg.estado = 'descartado';
    reg.motivo = `HTTP ${reg.status}`;
    return false;
  }
  const d = destinoMesmoSite(reg, corpo);
  if (d.descartar) {
    reg.estado = d.rotaSpa ? 'rota-do-app' : 'descartado';
    reg.motivo = d.descartar;
    return false;
  }
  const comparavel = ehHtml(reg.contentType) ? sha256(semNonce(corpo)) : reg.sha256;
  const existente = destinos.get(d.rel);
  if (existente) {
    reg.destino = `site/${d.rel}`;
    if (existente.comparavel === comparavel) {
      reg.estado = 'mesmo-arquivo';
      reg.igualA = existente.reg.url;
      return false;
    }
    reg.estado = 'conflito';
    reg.igualA = existente.reg.url;
    const variante = path.join(DIR_SAIDA, 'variantes', `${sha256(reg.url).slice(0, 8)}-${path.basename(d.rel)}`);
    gravar(variante, corpo);
    avisar(`conteudo diferente para o mesmo arquivo site/${d.rel}: ${reg.url} x ${existente.reg.url}`);
    return false;
  }
  destinos.set(d.rel, { reg, comparavel });
  reg.estado = 'salvo';
  reg.destino = `site/${d.rel}`;
  gravar(path.join(DIR_SITE, d.rel), corpo);
  return true;
}

function salvarExterno(reg) {
  // Arquivos de outros sites (scripts da plataforma, estatisticas) nao fazem parte
  // da copia: fica so o registro (endereco, tamanho, sha256) no relatorio.
  reg.estado = reg.status === 200 ? 'externo' : 'descartado';
  if (reg.status !== 200) reg.motivo = `HTTP ${reg.status}`;
  return false;
}

const CABECALHOS_UTEIS = ['content-type', 'cache-control', 'content-disposition', 'etag', 'last-modified', 'x-manus-seo-source', 'access-control-allow-origin'];

async function processar(reg) {
  if (!reg.mesmoSite && reg.candidato) {
    // URL de outro site achada por heuristica dentro do JS: so vale a pena se parece arquivo.
    const ext = path.posix.extname(new URL(reg.url).pathname).toLowerCase();
    if (!/^\.(png|jpe?g|webp|avif|svg|gif|ico|woff2?|ttf|otf|mp4|webm|mp3|ogg|wav|css|json)$/.test(ext)) {
      reg.estado = 'ignorado';
      reg.motivo = 'endereco de outro site citado no codigo (nao e arquivo)';
      return;
    }
  }
  let r;
  try {
    r = await baixarComTentativas(reg.url);
  } catch (erro) {
    reg.estado = 'erro';
    reg.motivo = String(erro?.cause?.code || erro?.message || erro).slice(0, 200);
    if (!reg.candidato) avisar(`nao consegui baixar ${curto(reg.url)}: ${reg.motivo}`);
    return;
  }
  reg.status = r.status;
  reg.contentType = r.cabecalhos['content-type'] || '';
  reg.cabecalhos = Object.fromEntries(CABECALHOS_UTEIS.filter((c) => r.cabecalhos[c]).map((c) => [c, r.cabecalhos[c]]));
  reg.cadeia = r.cadeia;
  reg.urlFinal = r.urlFinal;
  reg.tamanho = r.corpo.length;
  reg.sha256 = sha256(r.corpo);
  const guardado = reg.mesmoSite ? salvarMesmoSite(reg, r.corpo) : salvarExterno(reg);
  if (guardado) analisar(reg, r.corpo);
  if (reg.mesmoSite && r.status >= 500) {
    // Guarda a pagina de erro para inspecao (nao entra na copia).
    reg.erroServidor = true;
    const nome = `${r.status}-${sha256(reg.url).slice(0, 6)}-${path.basename(new URL(reg.url).pathname) || 'raiz'}.txt`;
    gravar(path.join(DIR_SAIDA, 'erros', nome), r.corpo);
    gravar(path.join(DIR_SAIDA, 'erros', `${nome}.cabecalhos.json`), JSON.stringify(r.cabecalhos, null, 2));
  }
  if (!guardado && !reg.candidato && reg.mesmoSite && reg.estado === 'descartado') {
    avisar(`referencia sem arquivo (${reg.motivo}): ${curto(reg.url)}  <- ${[...reg.por].slice(0, 2).map(curto).join(', ')}`);
  }
}

async function esvaziarFila() {
  while (fila.length) {
    const trabalhadores = Array.from({ length: 6 }, async () => {
      for (;;) {
        const reg = fila.shift();
        if (!reg) return;
        await processar(reg);
      }
    });
    await Promise.all(trabalhadores);
  }
}

// ───────────────────────────── navegador ─────────────────────────────
let puppeteer = null;
let PNG = null;

function acharChrome() {
  const candidatos = [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  return candidatos.find((c) => c && fs.existsSync(c)) || null;
}

async function abrirNavegador() {
  puppeteer = exigir('puppeteer-core');
  ({ PNG } = exigir('pngjs'));
  const executablePath = acharChrome();
  if (!executablePath) throw new Error('Chrome nao encontrado');
  const args = process.env.CHROME_ARGS
    ? JSON.parse(process.env.CHROME_ARGS)
    : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none', '--mute-audio'];
  const browser = await puppeteer.launch({ executablePath, args, headless: process.env.CHROME_HEADLESS || true, protocolTimeout: 180000 });
  const versao = await browser.version();
  const maior = (versao.match(/\/(\d+)\./) || [])[1];
  if (maior) {
    UA.desktop = UA.desktop.replace(/Chrome\/\d+/, `Chrome/${maior}`);
    UA.movel = UA.movel.replace(/Chrome\/\d+/, `Chrome/${maior}`);
  }
  log(`navegador: ${versao} (${executablePath})`);
  return browser;
}

/** Pausa depois de cada rolagem ou clique, antes de fotografar. */
const ESPERA = 350;
/** Maximo de cargas de cada lado por cenario, e ate quando (minutos) ainda se fazem cargas extras. */
const MAX_RODADAS = Number(process.env.MAX_RODADAS || 4);
const PRAZO_EXTRAS_MS = Number(process.env.MINUTOS_EXTRAS || 13) * 60000;

const TAMANHOS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  movel: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

/** Durante as capturas nada e enviado a servicos de estatistica (nem do original, nem da copia). */
const ESTATISTICAS =
  /(^|\.)(plausible\.io|manus-analytics\.com|manus\.im|amplitude\.com|google-analytics\.com|googletagmanager\.com|doubleclick\.net|sentry\.io|posthog\.com|mixpanel\.com|segment\.io|segment\.com|hotjar\.com|clarity\.ms|facebook\.com|facebook\.net)$/i;
const SEL_ABAS = '[role="tab"]';
const SEL_CLIQUES = 'button:not([role="tab"]), [role="button"]:not([role="tab"]), summary';
const SEL_ANCORAS = 'a[href^="#"]';

/**
 * Ajudantes que rodam dentro da pagina (iguais no original e na copia). Nao mexem
 * no conteudo. Duas coisas que mudam sozinhas com o relogio sao paradas para as
 * fotos poderem ser comparadas pixel a pixel: o cursor de texto piscando (fica
 * invisivel) e as animacoes sem fim, como um ponto pulsando (ficam no quadro inicial).
 */
const NA_PAGINA = `
(() => {
  try {
    const folha = new CSSStyleSheet();
    folha.replaceSync('input, textarea, [contenteditable] { caret-color: transparent !important; }');
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, folha];
  } catch (e) { /* navegador sem suporte: segue com o cursor visivel */ }
  const ajudantes = {
    /** Espera as animacoes e transicoes com fim (entrada da pagina, troca de aba, avisos) terminarem. */
    async quieto(limite) {
      const inicio = performance.now();
      for (;;) {
        const ativas = document.getAnimations().filter((a) => {
          const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
          return t && t.iterations !== Infinity && (a.playState === 'running' || a.pending);
        });
        if (!ativas.length) return 0;
        if (performance.now() - inicio > limite) return ativas.length;
        await new Promise((r) => setTimeout(r, 50));
      }
    },
    congelar() {
      let n = 0;
      for (const a of document.getAnimations()) {
        const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
        if (!t || t.iterations !== Infinity) continue;
        try { a.pause(); a.currentTime = 0; n++; } catch (e) { /* animacao ja removida */ }
      }
      return n;
    },
    alvo() {
      const doc = document.scrollingElement || document.documentElement;
      if (doc.scrollHeight - doc.clientHeight > 40) return doc;
      let melhor = null, folga = 40;
      for (const el of document.querySelectorAll('body *')) {
        const s = getComputedStyle(el);
        if (!/(auto|scroll)/.test(s.overflowY)) continue;
        const f = el.scrollHeight - el.clientHeight;
        if (f > folga) { folga = f; melhor = el; }
      }
      return melhor || doc;
    },
    async parado(quieto, limite) {
      quieto = quieto || 250; limite = limite || 5000;
      const alvo = this.alvo();
      const inicio = performance.now();
      let ultimo = alvo.scrollTop, estavel = 0;
      while (performance.now() - inicio < limite) {
        await new Promise((r) => setTimeout(r, 50));
        const agora = alvo.scrollTop;
        if (agora === ultimo) { estavel += 50; if (estavel >= quieto) break; } else { estavel = 0; ultimo = agora; }
      }
      return alvo.scrollTop;
    },
    raiz() { return document.getElementById('root') || document.querySelector('main') || document.body; },
    html() {
      const raiz = this.raiz();
      if (!raiz) return '';
      const copia = raiz.cloneNode(true);
      for (const no of copia.querySelectorAll('script, manus-content-root')) no.remove();
      return copia.outerHTML.split(location.origin).join('');
    },
    geometria() {
      const sx = window.scrollX, sy = window.scrollY, linhas = [];
      const n = (v) => Math.round(v * 100) / 100;
      const pular = { script: 1, style: 1, link: 1, meta: 1, noscript: 1, template: 1 };
      for (const el of document.querySelectorAll('body, body *')) {
        const tag = el.tagName.toLowerCase();
        if (pular[tag]) continue;
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        const classe = typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || '';
        linhas.push([
          tag, el.id, classe, n(r.left + sx), n(r.top + sy), n(r.width), n(r.height),
          s.display, s.visibility, s.position, s.color, s.backgroundColor,
          s.backgroundImage.split(location.origin).join(''),
          s.fontFamily, s.fontSize, s.fontWeight, s.fontStyle, s.lineHeight, s.letterSpacing,
          s.textTransform, s.textAlign, s.textDecorationLine,
          s.borderTopWidth, s.borderTopStyle, s.borderTopColor, s.borderTopLeftRadius,
          s.boxShadow, s.padding, s.margin, s.zIndex, s.overflow,
        ].join('|'));
      }
      return linhas;
    },
  };
  Object.defineProperty(window, '__fs', { value: ajudantes, configurable: true });
  window.__janelas = [];
  window.open = function (endereco) { window.__janelas.push(String(endereco)); return null; };
})();
`;

async function assentar(page, res, extra = 1500) {
  await page.waitForNetworkIdle({ idleTime: 900, timeout: 30000 }).catch(() => res.avisos.push('a rede nao ficou parada'));
  await page.evaluate(() => (document.fonts ? document.fonts.ready.then(() => true) : true)).catch(() => {});
  await dormir(extra);
}

/** Rola a pagina inteira uma vez: dispara o que so carrega quando aparece na tela. */
async function rolarTudo(page) {
  await page.evaluate(async () => {
    const alvo = window.__fs.alvo();
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));
    const passo = Math.max(240, Math.floor(alvo.clientHeight * 0.75));
    for (let y = 0, i = 0; i < 500; i++, y += passo) {
      alvo.scrollTo({ top: y, behavior: 'instant' });
      await espera(90);
      if (y >= alvo.scrollHeight - alvo.clientHeight) break;
    }
    alvo.scrollTo({ top: 0, behavior: 'instant' });
    await espera(300);
  });
}

function infoDaPagina() {
  const fundos = new Set();
  for (const el of document.querySelectorAll('*')) {
    const bg = getComputedStyle(el).backgroundImage;
    if (bg && bg !== 'none') for (const m of bg.matchAll(/url\(["']?([^"')]+)["']?\)/g)) fundos.add(m[1]);
  }
  const raizManus = document.querySelector('manus-content-root');
  return {
    urlFinal: location.href,
    titulo: document.title,
    altura: document.documentElement.scrollHeight,
    largura: document.documentElement.scrollWidth,
    elementos: document.querySelectorAll('*').length,
    caracteres: document.body ? document.body.innerText.length : 0,
    links: [...document.querySelectorAll('a[href]')].map((a) => a.href),
    imagens: [...document.images].map((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0, w: i.naturalWidth, h: i.naturalHeight })),
    fundos: [...fundos],
    recursos: performance.getEntriesByType('resource').map((e) => e.name),
    fontes: [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.style} ${f.status}`),
    seloDaPlataforma: raizManus ? { sombra: !!raizManus.shadowRoot, filhosNaSombra: raizManus.shadowRoot ? raizManus.shadowRoot.childElementCount : 0 } : null,
  };
}

async function listar(page, seletor) {
  return page.$$eval(seletor, (els) =>
    els.map((el, i) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        i,
        rotulo: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 48),
        href: el.getAttribute('href'),
        visivel: r.width >= 4 && r.height >= 4 && s.visibility !== 'hidden' && s.display !== 'none',
        desabilitado: !!el.disabled || el.getAttribute('aria-disabled') === 'true',
        selecionado: el.getAttribute('aria-selected') === 'true',
      };
    }),
  );
}

async function clicar(page, seletor, indice) {
  const alvos = await page.$$(seletor);
  try {
    if (!alvos[indice]) return false;
    await alvos[indice].click({ delay: 20 });
    return true;
  } catch {
    return false;
  } finally {
    await Promise.all(alvos.map((a) => a.dispose().catch(() => {})));
  }
}

/**
 * Registra um "passo": o HTML do aplicativo, o texto visivel, a rolagem, o
 * endereco e as fotos. Em `estado: true` tambem mede posicao e estilo de todos
 * os elementos. `fotos`: 'viewport' (so a tela atual) ou 'completa' (a pagina
 * inteira, uma foto por tela, de cima a baixo).
 */
async function ponto(page, res, nome, { fotos = 'viewport', estado = false } = {}) {
  const p = { nome, fotos: [] };
  try {
    if (estado || fotos !== 'viewport') {
      await page.evaluate(() => window.__fs.alvo().scrollTo({ top: 0, behavior: 'instant' }));
      await dormir(ESPERA);
    }
    p.animando = await page.evaluate(() => window.__fs.quieto(3000));
    await dormir(120);
    const dados = await page.evaluate((comGeometria) => {
      const alvo = window.__fs.alvo();
      return {
        congeladas: window.__fs.congelar(),
        rolagem: Math.round(alvo.scrollTop),
        total: alvo.scrollHeight,
        visivel: alvo.clientHeight,
        caminho: location.pathname + location.search,
        hash: location.hash,
        titulo: document.title,
        html: window.__fs.html(),
        texto: document.body ? document.body.innerText : '',
        geometria: comGeometria ? window.__fs.geometria() : null,
      };
    }, estado);
    Object.assign(p, dados);
    if (dados.congeladas) await dormir(80);
    const maximo = Math.max(0, dados.total - dados.visivel);
    let posicoes = [null];
    if (fotos === 'completa' && maximo > 4) {
      posicoes = [];
      for (let y = 0; y < maximo; y += dados.visivel) posicoes.push(y);
      posicoes.push(maximo);
      if (posicoes.length > 80) {
        const passo = (posicoes.length - 1) / 79;
        posicoes = Array.from({ length: 80 }, (_, i) => posicoes[Math.round(i * passo)]);
      }
    }
    for (const y of posicoes) {
      if (y !== null) {
        await page.evaluate((top) => {
          window.__fs.alvo().scrollTo({ top, behavior: 'instant' });
          window.__fs.congelar();
        }, y);
        await dormir(ESPERA);
      }
      const png = Buffer.from(await page.screenshot({ type: 'png' }));
      p.fotos.push({ y: y ?? dados.rolagem, png, sha: sha256(png) });
      if (estado && !p.jpg) p.jpg = Buffer.from(await page.screenshot({ type: 'jpeg', quality: 60 }));
    }
    if (posicoes[0] !== null) {
      await page.evaluate(() => window.__fs.alvo().scrollTo({ top: 0, behavior: 'instant' }));
      await dormir(150);
    }
  } catch (erro) {
    p.erro = String(erro?.message || erro).slice(0, 160);
  }
  res.pontos.push(p);
  return p;
}

/** O mesmo roteiro de uso roda no original e na copia; cada passo e comparado depois. */
async function roteiro(page, res, cenario) {
  const espera = ESPERA;
  const P = (nome, opcoes = {}) => ponto(page, res, nome, opcoes);
  const pararRolagem = () => page.evaluate(() => window.__fs.parado()).catch(() => {});
  const semAvisos = () => page.waitForFunction(() => !document.querySelector('[data-sonner-toast]'), { timeout: 9000 }).catch(() => {});

  const cliquesDoEstado = async (prefixo, limite = 8) => {
    const lista = await listar(page, SEL_CLIQUES).catch(() => []);
    let feitos = 0;
    for (const item of lista) {
      if (feitos >= limite) break;
      if (!item.visivel) continue;
      const ok = await clicar(page, SEL_CLIQUES, item.i);
      res.cliques.push({ estado: prefixo, rotulo: item.rotulo, desabilitado: item.desabilitado, ok });
      if (!ok) continue;
      feitos++;
      await dormir(espera);
      await pararRolagem();
      await P(`${prefixo} › clique "${item.rotulo}"${item.desabilitado ? ' (desabilitado)' : ''}`);
      await semAvisos();
    }
  };

  await P('inicial', { fotos: 'completa', estado: true });
  const abas = await listar(page, SEL_ABAS).catch(() => []);
  if (cenario.interagir) await cliquesDoEstado('inicial');
  const tudo = cenario.interagir === 'tudo';

  // Cada aba e um estado diferente da pagina: fotografa todas.
  const abaInicial = abas.find((a) => a.selecionado);
  for (const aba of abas.slice(0, 6)) {
    if (aba.selecionado || !aba.visivel) continue;
    if (!(await clicar(page, SEL_ABAS, aba.i))) continue;
    await dormir(espera);
    await pararRolagem();
    await P(`aba "${aba.rotulo}"`, { fotos: 'completa', estado: true });
    if (cenario.interagir) await cliquesDoEstado(`aba "${aba.rotulo}"`);
  }
  if (abaInicial && abas.length > 1) {
    await clicar(page, SEL_ABAS, abaInicial.i);
    await dormir(espera);
    await pararRolagem();
    await P(`volta para a aba "${abaInicial.rotulo}"`, { estado: true });
  }

  if (tudo) {
    // Busca.
    const campo = await page.$('input[type="search"], input[type="text"], input:not([type])');
    if (campo) {
      try {
        await campo.click({ delay: 20 });
        await page.keyboard.type(TERMO_BUSCA, { delay: 35 });
        await dormir(espera + 250);
        await pararRolagem();
        await P(`busca › digitar "${TERMO_BUSCA}"`);
        await page.keyboard.press('Enter');
        await dormir(espera);
        await pararRolagem();
        await P('busca › Enter');
        await cliquesDoEstado('busca', 6);
        await campo.click({ clickCount: 3, delay: 20 });
        await page.keyboard.press('Backspace');
        await dormir(espera);
        await pararRolagem();
        await P('busca › limpar');
      } catch (erro) {
        res.avisos.push(`busca: ${String(erro?.message || erro).slice(0, 120)}`);
      }
    }

    // Caixa de selecao (menu de secoes).
    const opcoes = await page
      .$$eval('select option', (os) => os.map((o) => ({ v: o.value, t: (o.textContent || '').trim().slice(0, 48), d: o.disabled })))
      .catch(() => []);
    const validas = opcoes.filter((o) => o.v && !o.d);
    if (validas.length) {
      const escolhidas = [...new Set([validas[Math.floor(validas.length / 2)], validas[validas.length - 1]])];
      for (const o of escolhidas) {
        try {
          await page.select('select', o.v);
          await dormir(espera);
          await pararRolagem();
          await P(`menu › "${o.t}"`);
        } catch (erro) {
          res.avisos.push(`menu: ${String(erro?.message || erro).slice(0, 120)}`);
        }
      }
    }

    // Links do indice (ancoras).
    const ancoras = (await listar(page, SEL_ANCORAS).catch(() => [])).filter((a) => a.visivel && a.href && a.href.length > 1);
    const ancorasEscolhidas = [...new Set([ancoras[1], ancoras[Math.floor(ancoras.length / 2)], ancoras[ancoras.length - 1]].filter(Boolean))];
    for (const a of ancorasEscolhidas) {
      if (!(await clicar(page, SEL_ANCORAS, a.i))) continue;
      await dormir(espera);
      await pararRolagem();
      await P(`indice › ${a.href}`);
    }
  }

  // Por ultimo (porque sai da pagina): o primeiro link para outra pagina do proprio site.
  const interno = await page
    .$$eval('a[href]', (as) => {
      for (const [i, a] of as.entries()) {
        let u;
        try {
          u = new URL(a.getAttribute('href'), location.href);
        } catch {
          continue;
        }
        if (u.origin === location.origin && u.pathname !== location.pathname && !a.target) return { i, caminho: u.pathname + u.search };
      }
      return null;
    })
    .catch(() => null);
  if (interno && tudo) {
    const navegacao = page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }).catch(() => null);
    if (await clicar(page, 'a[href]', interno.i)) {
      await navegacao;
      await assentar(page, res);
      await P(`link › ${interno.caminho}`, { estado: true });
    }
  }
}

/**
 * Abre uma URL num contexto limpo, grava tudo que o navegador pediu e executa o
 * roteiro.
 *  - `bloquearHost`: usado na conferencia da copia — qualquer pedido ao site
 *    original e barrado e anotado (a copia tem que funcionar sozinha).
 *  - `atrasos`: tempos de rede medidos numa carga do original. A copia e
 *    servida deste computador (resposta instantanea); para a comparacao ser
 *    justa, cada arquivo da copia so e entregue depois do mesmo tempo que o
 *    original levou. Sem isso o Chrome desenha a mesma pagina com diferencas
 *    de 1 pixel, porque a ordem de chegada dos arquivos muda o desenho.
 */
async function capturar(browser, cenario, { base, bloquearHost = null, rotulo = '', atrasos = null }) {
  const tamanho = TAMANHOS[cenario.tela];
  const url = base + cenario.caminho;
  const origemCenario = new URL(url).origin;
  const res = {
    rotulo,
    cenario: cenario.nome,
    url,
    base,
    tela: cenario.tela,
    rede: [],
    tempos: new Map(),
    falhas: [],
    console: [],
    erros: [],
    vazamentos: [],
    estatisticasBarradas: [],
    enviosATerceiros: [],
    janelas: [],
    saidasBarradas: [],
    avisos: [],
    cliques: [],
    pontos: [],
  };
  const filas = new Map([...(atrasos || [])].map(([chave, lista]) => [chave, [...lista]]));
  const atrasoDe = (chave) => {
    const lista = filas.get(chave);
    if (!lista || !lista.length) return 0;
    return Math.min(8000, lista.length > 1 ? lista.shift() : lista[0]);
  };
  const iniciosDePedido = new WeakMap();
  const anotarTempo = (req) => {
    const resposta = req.response();
    if (resposta && resposta.status() >= 300 && resposta.status() < 400) return; // continua no proximo salto
    const primeiro = req.redirectChain()[0] || req;
    const t = iniciosDePedido.get(primeiro);
    if (t === undefined || !primeiro.url().startsWith(base)) return;
    const chave = `${primeiro.method()} ${primeiro.url().slice(base.length)}`;
    if (!res.tempos.has(chave)) res.tempos.set(chave, []);
    res.tempos.get(chave).push(Date.now() - t);
  };
  const corpos = new Map();
  const tarefas = [];
  const t0 = Date.now();
  let contexto = null;
  let page = null;
  let aoCriarAlvo = null;
  try {
    contexto = await browser.createBrowserContext();
    await contexto.overridePermissions(origemCenario, ['clipboard-read', 'clipboard-write']).catch(() => {});
    page = await contexto.newPage();
    await page.setViewport(tamanho);
    await page.setUserAgent(cenario.tela === 'movel' ? UA.movel : UA.desktop);
    await page.evaluateOnNewDocument(NA_PAGINA);
    await page.setRequestInterception(true);
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    aoCriarAlvo = async (alvo) => {
      if (alvo.type() !== 'page') return;
      try {
        const nova = await alvo.page();
        if (nova && nova !== page && alvo.browserContext() === contexto) {
          res.janelas.push(curto(alvo.url()));
          await nova.close();
        }
      } catch {
        /* a janela ja fechou */
      }
    };
    browser.on('targetcreated', aoCriarAlvo);

    page.on('request', (req) => {
      const primeiro = req.redirectChain()[0] || req;
      if (!iniciosDePedido.has(primeiro)) iniciosDePedido.set(primeiro, Date.now());
      if (req.isInterceptResolutionHandled()) return;
      let u;
      try {
        u = new URL(req.url());
      } catch {
        req.continue().catch(() => {});
        return;
      }
      if (!/^https?:$/.test(u.protocol)) {
        req.continue().catch(() => {});
        return;
      }
      if (bloquearHost && u.host === bloquearHost) {
        res.vazamentos.push({ url: curto(req.url()), tipo: req.resourceType(), metodo: req.method() });
        req.abort('blockedbyclient').catch(() => {});
        return;
      }
      if (req.isNavigationRequest() && req.frame() === page.mainFrame() && u.origin !== origemCenario) {
        res.saidasBarradas.push(curto(req.url()));
        req.abort('aborted').catch(() => {});
        return;
      }
      if (u.origin !== origemCenario && req.method() !== 'GET') {
        const envio = { url: curto(req.url()), metodo: req.method(), corpo: String(req.postData() || '').slice(0, 200) };
        if (ESTATISTICAS.test(u.host)) {
          res.estatisticasBarradas.push(envio);
          req.abort('blockedbyclient').catch(() => {});
          return;
        }
        res.enviosATerceiros.push(envio);
      }
      const ms = atrasos && u.origin === origemCenario ? atrasoDe(`${req.method()} ${u.pathname}${u.search}`) : 0;
      if (ms > 0) setTimeout(() => req.continue().catch(() => {}), ms);
      else req.continue().catch(() => {});
    });
    page.on('requestfinished', anotarTempo);

    page.on('response', (resp) => {
      const req = resp.request();
      const cab = resp.headers();
      const reg = {
        url: resp.url(),
        metodo: req.method(),
        tipo: req.resourceType(),
        status: resp.status(),
        contentType: cab['content-type'] || '',
        para: cab.location ? semAssinatura(cab.location) : undefined,
      };
      if (cab.location) {
        try {
          Object.defineProperty(reg, 'seguinte', { value: new URL(cab.location, resp.url()).href, enumerable: false });
        } catch {
          /* location invalido */
        }
      }
      res.rede.push(reg);
      if (resp.status() >= 300 && resp.status() < 400) return;
      tarefas.push(
        resp
          .buffer()
          .then((buf) => {
            reg.tamanho = buf.length;
            reg.sha256 = sha256(buf);
            const chave = `${req.method()} ${resp.url()}`;
            if (!corpos.has(chave)) corpos.set(chave, buf);
          })
          .catch((erro) => {
            reg.semCorpo = String(erro?.message || erro).slice(0, 80);
          }),
      );
    });
    page.on('requestfailed', (req) => {
      res.falhas.push({ url: curto(req.url()), tipo: req.resourceType(), metodo: req.method(), erro: req.failure()?.errorText || '' });
    });
    page.on('console', (msg) => {
      if (res.console.length < 60) res.console.push({ tipo: msg.type(), texto: msg.text().slice(0, 300) });
    });
    page.on('pageerror', (erro) => {
      if (res.erros.length < 40) res.erros.push(String(erro?.message || erro).slice(0, 300));
    });

    const resposta = await page.goto(url, { waitUntil: 'load', timeout: 90000 });
    res.statusPagina = resposta ? resposta.status() : null;
    await assentar(page, res);
    await rolarTudo(page);
    await page.waitForNetworkIdle({ idleTime: 700, timeout: 20000 }).catch(() => {});
    await dormir(500);
    res.info = await page.evaluate(infoDaPagina);
    await roteiro(page, res, cenario);
    await page.waitForNetworkIdle({ idleTime: 700, timeout: 15000 }).catch(() => {});
    res.urlNoFim = page.url();
  } catch (erro) {
    res.falhou = String(erro?.stack || erro).slice(0, 500);
    avisar(`captura "${cenario.nome}" (${rotulo}) falhou: ${String(erro?.message || erro).slice(0, 200)}`);
  } finally {
    await Promise.allSettled(tarefas);
    try {
      if (page) res.janelas.push(...(await page.evaluate(() => window.__janelas || [])));
    } catch {
      /* pagina indisponivel */
    }
    if (aoCriarAlvo) browser.off('targetcreated', aoCriarAlvo);
    if (contexto) await contexto.close().catch(() => {});
  }
  res.duracao = Date.now() - t0;
  res.corpos = corpos;
  return res;
}

// ───────────────────────────── comparação ─────────────────────────────
/** Diferenca de cor (0–255, por canal) ate a qual se considera arredondamento do desenho. */
const TOLERANCIA = 2;
const medidas = new Map();

/** Mede a diferenca entre duas fotos, pixel a pixel, sem nenhuma tolerancia. */
function medir(fa, fb) {
  if (fa.sha === fb.sha) return { n: 0, maior: 0, fortes: 0 };
  const chave = fa.sha < fb.sha ? `${fa.sha}:${fb.sha}` : `${fb.sha}:${fa.sha}`;
  let m = medidas.get(chave);
  if (m) return m;
  const A = PNG.sync.read(fa.png);
  const B = PNG.sync.read(fb.png);
  if (A.width !== B.width || A.height !== B.height) {
    m = { n: Infinity, maior: 255, fortes: Infinity, tamanhos: `${A.width}x${A.height} e ${B.width}x${B.height}` };
  } else {
    let n = 0, maior = 0, fortes = 0;
    let x0 = A.width, y0 = A.height, x1 = -1, y1 = -1;
    const a = A.data, b = B.data;
    for (let i = 0, p = 0; i < a.length; i += 4, p++) {
      if (a[i] === b[i] && a[i + 1] === b[i + 1] && a[i + 2] === b[i + 2] && a[i + 3] === b[i + 3]) continue;
      const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]), Math.abs(a[i + 3] - b[i + 3]));
      n++;
      if (d > maior) maior = d;
      if (d > TOLERANCIA) {
        fortes++;
        const x = p % A.width;
        const y = (p - x) / A.width;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    m = { n, maior, fortes, total: A.width * A.height, caixa: fortes ? [x0, y0, x1, y1] : null };
  }
  medidas.set(chave, m);
  return m;
}

/** Recorte para inspecao: original em cima, copia no meio, pixels diferentes embaixo. */
function recorte(fa, fb, caixa, larguraMax = 900, alturaMax = 260) {
  const A = PNG.sync.read(fa.png);
  const B = PNG.sync.read(fb.png);
  const [cx0, cy0, cx1, cy1] = caixa || [0, 0, A.width - 1, A.height - 1];
  const x = Math.max(0, Math.min(cx0 - 12, A.width - larguraMax));
  const y = Math.max(0, cy0 - 12);
  const w = Math.min(larguraMax, A.width - x, Math.max(120, cx1 - x + 24));
  const h = Math.min(alturaMax, A.height - y, Math.max(48, cy1 - y + 24));
  const saida = new PNG({ width: w, height: h * 3 + 8 });
  saida.data.fill(255);
  PNG.bitblt(A, saida, x, y, w, h, 0, 0);
  PNG.bitblt(B, saida, x, y, w, h, 0, h + 4);
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const i = ((y + yy) * A.width + x + xx) * 4;
      const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
      const o = ((2 * (h + 4) + yy) * w + xx) * 4;
      const cor = d > TOLERANCIA ? [220, 0, 0] : d > 0 ? [255, 190, 90] : [236, 236, 236];
      saida.data[o] = cor[0];
      saida.data[o + 1] = cor[1];
      saida.data[o + 2] = cor[2];
      saida.data[o + 3] = 255;
    }
  }
  return PNG.sync.write(saida);
}

function primeiraDiferenca(a, b) {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  return { posicao: i, original: a.slice(Math.max(0, i - 70), i + 110), copia: b.slice(Math.max(0, i - 70), i + 110) };
}

/**
 * Compara tudo que nao depende do desenho: passos, HTML, texto, rolagem, endereco
 * e a posicao/estilo de cada elemento. `a` e o original, `b` a copia.
 */
function compararEstrutura(a, b) {
  const diferencas = [];
  const passos = [];
  const n = Math.max(a.pontos.length, b.pontos.length);
  for (let i = 0; i < n; i++) {
    const pa = a.pontos[i];
    const pb = b.pontos[i];
    if (!pa || !pb) {
      diferencas.push(`o passo ${i + 1} ("${(pa || pb).nome}") so aconteceu ${pa ? 'no original' : 'na copia'}`);
      continue;
    }
    const item = { nome: pa.nome, diferente: [] };
    if (pa.erro || pb.erro) {
      item.diferente.push('erro ao registrar');
      diferencas.push(`${pa.nome}: erro ao registrar o passo (${pa.erro || pb.erro})`);
    }
    const campos = { nome: 'nome do passo', html: 'HTML', texto: 'texto visivel', rolagem: 'posicao da rolagem', caminho: 'endereco', hash: 'ancora do endereco', titulo: 'titulo', total: 'altura da pagina' };
    for (const [campo, rotulo] of Object.entries(campos)) {
      if (pa[campo] === pb[campo]) continue;
      item.diferente.push(rotulo);
      const detalhe = typeof pa[campo] === 'string' && pa[campo].length > 80 ? JSON.stringify(primeiraDiferenca(pa[campo], pb[campo])) : `${pa[campo]} x ${pb[campo]}`;
      diferencas.push(`${pa.nome}: ${rotulo} diferente — ${detalhe.slice(0, 420)}`);
    }
    if (pa.fotos.length !== pb.fotos.length) {
      item.diferente.push('quantidade de fotos');
      diferencas.push(`${pa.nome}: ${pa.fotos.length} foto(s) no original e ${pb.fotos.length} na copia`);
    }
    if (pa.geometria && pb.geometria) {
      const total = Math.max(pa.geometria.length, pb.geometria.length);
      let diferentes = 0;
      const exemplos = [];
      for (let k = 0; k < total; k++) {
        if (pa.geometria[k] === pb.geometria[k]) continue;
        diferentes++;
        if (exemplos.length < 2) exemplos.push({ original: String(pa.geometria[k]).slice(0, 200), copia: String(pb.geometria[k]).slice(0, 200) });
      }
      item.geometria = { elementos: total, diferentes };
      if (diferentes) {
        item.diferente.push('posicao/estilo dos elementos');
        diferencas.push(`${pa.nome}: ${diferentes} de ${total} elementos com posicao ou estilo diferente — ${JSON.stringify(exemplos).slice(0, 420)}`);
      }
    }
    passos.push(item);
  }
  return { diferencas, passos };
}

/**
 * Classifica cada foto usando todas as cargas feitas ate agora:
 *  - identica:        alguma carga da copia saiu pixel a pixel igual a alguma carga do original;
 *  - arredondamento:  nenhum pixel difere mais que TOLERANCIA niveis de cor (em 255);
 *  - varia:           nao casou, e o proprio site muda de uma carga para outra nesse ponto;
 *  - diferente:       nao casou, e cada lado e sempre igual a si mesmo (diferenca de verdade).
 * As fotos ja resolvidas ficam em `decididas` e saem da memoria. Devolve as pendentes.
 */
function analisarFotos(cargasO, cargasC, decididas) {
  const pendentes = [];
  cargasO[0].pontos.forEach((p, s) => {
    p.fotos.forEach((foto, k) => {
      const chave = `${s}:${k}`;
      const todas = [...cargasO, ...cargasC].map((c) => c.pontos[s]?.fotos[k]).filter(Boolean);
      if (decididas.has(chave)) {
        for (const f of todas) f.png = null;
        return;
      }
      const O = cargasO.map((c) => c.pontos[s]?.fotos[k]).filter((f) => f && f.png);
      const C = cargasC.map((c) => c.pontos[s]?.fotos[k]).filter((f) => f && f.png);
      const item = { passo: p.nome, s, k, y: foto.y, cargas: [O.length, C.length] };
      if (!O.length || !C.length) {
        item.classe = 'ausente';
        pendentes.push(item);
        return;
      }
      let melhor = null;
      for (const a of O) {
        for (const b of C) {
          const m = medir(a, b);
          if (!melhor || m.fortes < melhor.m.fortes || (m.fortes === melhor.m.fortes && m.n < melhor.m.n)) melhor = { a, b, m };
        }
      }
      item.pixels = melhor.m.n;
      item.maior = melhor.m.maior;
      item.fortes = melhor.m.fortes;
      item.caixa = melhor.m.caixa;
      item.tamanhos = melhor.m.tamanhos;
      if (melhor.m.n === 0) item.classe = 'identica';
      else if (melhor.m.fortes === 0) item.classe = 'arredondamento';
      else {
        const varia = (lista) => lista.some((a, i) => lista.slice(i + 1).some((b) => medir(a, b).fortes > 0));
        item.variaNoOriginal = varia(O);
        item.variaNaCopia = varia(C);
        item.classe = item.variaNoOriginal || item.variaNaCopia ? 'varia' : 'diferente';
        item.par = melhor;
      }
      if (item.classe === 'identica' || item.classe === 'arredondamento') {
        decididas.set(chave, item);
        for (const f of todas) f.png = null;
      } else {
        pendentes.push(item);
      }
    });
  });
  return pendentes;
}

function compararRede(original, copia) {
  const pedidosDe = (r) => {
    const mapa = new Map();
    for (const x of r.rede) {
      if (!x.url.startsWith(r.base)) continue;
      const chave = `${x.metodo} ${x.url.slice(r.base.length)}`;
      if (!mapa.has(chave)) mapa.set(chave, new Set());
      // 304 = "use o que voce ja tem": para o navegador e o mesmo que 200.
      mapa.get(chave).add(x.status === 304 ? 200 : x.status);
    }
    return mapa;
  };
  const texto = (st) => [...st].sort().join('/');
  const A = pedidosDe(original);
  const B = pedidosDe(copia);
  const saida = {
    original: [...A].map(([k, st]) => `${k} -> ${texto(st)}`).sort(),
    copia: [...B].map(([k, st]) => `${k} -> ${texto(st)}`).sort(),
    soNoOriginal: [...A.keys()].filter((k) => !B.has(k)).sort(),
    soNaCopia: [...B.keys()].filter((k) => !A.has(k)).sort(),
    redirecionavaNoOriginal: [],
    statusDiferente: [],
    conteudoDiferente: [],
  };
  for (const [k, st] of A) {
    const outro = B.get(k);
    if (!outro || texto(st) === texto(outro)) continue;
    const eraRedirecionamento = [...st].every((n) => n >= 300 && n < 400) && texto(outro) === '200';
    if (eraRedirecionamento) saida.redirecionavaNoOriginal.push(k);
    else saida.statusDiferente.push(`${k}: original ${texto(st)}, copia ${texto(outro)}`);
  }
  // Mesmo caminho, mesmo conteudo? (Para o que redirecionava, vale o arquivo final que o navegador recebeu.)
  const finalDe = (r, caminho) => {
    let alvo = r.base + caminho;
    for (let salto = 0; salto < 6; salto++) {
      const corpo = r.corpos.get(`GET ${alvo}`);
      if (corpo) return corpo;
      const item = r.rede.find((x) => x.metodo === 'GET' && x.url === alvo && x.status >= 300 && x.status < 400 && x.seguinte);
      if (!item) return null;
      alvo = item.seguinte;
    }
    return null;
  };
  for (const k of B.keys()) {
    if (!k.startsWith('GET ') || !A.has(k)) continue;
    const caminho = k.slice(4);
    const cb = copia.corpos.get(`GET ${copia.base}${caminho}`);
    const ca = finalDe(original, caminho);
    if (!cb || !ca) continue;
    const pagina = /^\s*<!doctype html|^\s*<html/i.test(cb.subarray(0, 200).toString('utf8'));
    const iguais = pagina ? semNonce(ca) === semNonce(cb) : ca.equals(cb);
    if (!iguais) saida.conteudoDiferente.push(caminho);
  }
  return saida;
}

function resumoCaptura(r) {
  return {
    rotulo: r.rotulo,
    url: r.url,
    status: r.statusPagina,
    falhou: r.falhou,
    duracaoSeg: Math.round(r.duracao / 100) / 10,
    titulo: r.info?.titulo,
    altura: r.info?.altura,
    largura: r.info?.largura,
    elementos: r.info?.elementos,
    caracteres: r.info?.caracteres,
    imagens: r.info?.imagens,
    fontes: r.info?.fontes,
    seloDaPlataforma: r.info?.seloDaPlataforma,
    passos: r.pontos.map((p) => `${p.nome} [${p.fotos.length} foto(s)${p.erro ? `, ERRO ${p.erro}` : ''}]`),
    animacoesCongeladas: Math.max(0, ...r.pontos.map((p) => p.congeladas || 0)),
    pedidos: r.rede.length,
    falhas: r.falhas,
    console: r.console.filter((c) => c.tipo === 'error' || c.tipo === 'warn').slice(0, 20),
    erros: r.erros,
    vazamentos: r.vazamentos,
    estatisticasBarradas: r.estatisticasBarradas.map((e) => `${e.metodo} ${e.url}`),
    enviosATerceiros: r.enviosATerceiros,
    janelas: r.janelas,
    saidasBarradas: r.saidasBarradas,
    avisos: r.avisos,
    urlNoFim: r.urlNoFim,
  };
}

// ───────────────────────────── servidor local ─────────────────────────────
async function subirServidorLocal() {
  const filho = spawn(process.execPath, [path.join(RAIZ, 'servidor.mjs')], {
    env: { ...process.env, PORT: String(PORTA_LOCAL), HOST: '127.0.0.1', SILENCIOSO: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let saida = '';
  filho.stdout.on('data', (d) => (saida += d));
  filho.stderr.on('data', (d) => (saida += d));
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`${LOCAL}/`, { signal: AbortSignal.timeout(2000) });
      if (r.status === 200) return filho;
    } catch {
      /* ainda subindo */
    }
    if (filho.exitCode !== null) break;
    await dormir(200);
  }
  filho.kill();
  throw new Error(`servidor local nao respondeu: ${saida.slice(0, 300)}`);
}

// ───────────────────────────── roteiro ─────────────────────────────
const SONDAS = [
  '/',
  '/index.html',
  '/convite',
  '/convite/',
  '/convite/index.html',
  '/convite/?v=c14b569',
  '/favicon.ico',
  '/fronteira-sul-logo.webp',
  '/manus-storage/fronteira-sul-logo_1b1b4c2d.webp',
  '/fronteira-sul-convite-preview.jpg',
  '/__manus/pwa/manifest.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
  '/404',
  '/404/',
  '/404.html',
  '/404/outra',
  '/nao-existe-xyz',
  '/nao-existe-xyz/',
  '/nao-existe-xyz/outra',
  '/nao-existe-xyz.png',
  '/nao-existe-xyz.html',
  '/nao.existe/rota',
  '/assets',
  '/assets/',
  '/assets/nao-existe-xyz.js',
  '/convite/nao-existe-xyz',
  '/convite/nao-existe-xyz.png',
  '/api/platform/config.js',
  '/api/nao-existe-xyz',
  '/api/trpc/auth.me',
  '/__manus/nao-existe-xyz',
  '/manus-storage/nao-existe-xyz.webp',
];

/** Nomes prováveis de outras paginas soltas no site (como /convite/, que nao esta no sitemap). */
const PALPITES = (
  'regras regra regulamento policia police pm pcpr prf convites invite convite-oficial convite2 discord loja vip doacao staff equipe sobre ' +
  'whitelist allowlist wl inicio home cidade mapa eventos faccoes ilegal legal mecanica hospital samu bombeiros jornal noticias changelog ' +
  'faq ajuda suporte contato termos privacidade preview share card og embed link links banner poster painel'
).split(' ');

async function sondar(base, caminho) {
  try {
    const r = await baixar(base + caminho);
    const pagina = ehHtml(r.cabecalhos['content-type']);
    return {
      status: r.status,
      primeiroStatus: r.cadeia.length ? r.cadeia[0].status : r.status,
      contentType: r.cabecalhos['content-type'] || '',
      cacheControl: r.cabecalhos['cache-control'] || '',
      tamanho: r.corpo.length,
      sha: sha256(pagina ? semNonce(r.corpo) : r.corpo).slice(0, 16),
    };
  } catch (erro) {
    return { erro: String(erro?.message || erro).slice(0, 120) };
  }
}

function nomeDoCenario(caminho) {
  if (caminho === '/') return 'regras';
  if (caminho === ROTA_INEXISTENTE) return 'rota-inexistente';
  return caminho.split('?')[0].replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-') || 'pagina';
}

async function principal() {
  log(`origem: ${ORIGEM}`);
  log(`paginas pedidas: ${PAGINAS.join('  ')}`);
  fs.rmSync(DIR_SITE, { recursive: true, force: true });
  fs.rmSync(DIR_SAIDA, { recursive: true, force: true });
  fs.mkdirSync(DIR_SITE, { recursive: true });
  fs.mkdirSync(DIR_SAIDA, { recursive: true });

  let browser = null;
  if (!SEM_NAVEGADOR) {
    try {
      browser = await abrirNavegador();
    } catch (erro) {
      avisar(`navegador indisponivel: ${erro.message}`);
    }
  }

  // 1) Download direto: primeiro as paginas principais (em ordem), depois o resto.
  log('1) baixando as paginas e tudo que elas referenciam');
  const raiz = await baixarComTentativas(`${ORIGEM}/`);
  if (raiz.status !== 200 || !ehHtml(raiz.cabecalhos['content-type'])) throw new Error(`a pagina inicial respondeu ${raiz.status}`);
  indexRaizNorm = semNonce(raiz.corpo);

  const sementes = ['/', ...PAGINAS.map((p) => p.split('?')[0]), ...PAGINAS];
  for (const caminho of [...new Set(sementes)]) {
    const reg = enfileirar(ORIGEM + caminho, `${ORIGEM}/`, 'pagina pedida');
    if (reg && reg.estado === 'fila') {
      fila.splice(fila.indexOf(reg), 1);
      await processar(reg);
    }
  }
  const conhecidos = [
    '/favicon.ico', '/robots.txt', '/sitemap.xml', '/favicon.png', '/favicon.svg', '/apple-touch-icon.png',
    '/apple-touch-icon-precomposed.png', '/manifest.json', '/manifest.webmanifest', '/site.webmanifest', '/sw.js',
    '/service-worker.js', '/browserconfig.xml', '/humans.txt', '/.well-known/security.txt',
  ];
  for (const c of conhecidos) enfileirar(ORIGEM + c, `${ORIGEM}/`, 'caminho padrao', { candidato: true });
  for (const p of PALPITES) enfileirar(`${ORIGEM}/${p}/`, `${ORIGEM}/`, 'palpite de pagina', { candidato: true, pagina: true });
  await esvaziarFila();
  log(`   ${destinos.size} arquivo(s) do site ate aqui`);

  // 2) Navegador no original: descobre o que so aparece em tempo de execucao.
  const cenarios = [];
  for (const caminho of [...PAGINAS, ROTA_INEXISTENTE]) {
    const nome = nomeDoCenario(caminho);
    cenarios.push({ nome: `${nome}-desktop`, caminho, tela: 'desktop', interagir: caminho === ROTA_INEXISTENTE ? 'cliques' : 'tudo' });
    if (caminho !== ROTA_INEXISTENTE) cenarios.push({ nome: `${nome}-movel`, caminho, tela: 'movel', interagir: false });
  }
  const originais = new Map();
  const corposNavegador = new Map();
  if (browser) {
    log('2) abrindo o site original no navegador');
    const rotasExtras = new Set();
    const capturarOriginal = async (c) => {
      const r = await capturar(browser, c, { base: ORIGEM, rotulo: 'original (carga 1)' });
      originais.set(c.nome, r);
      log(`   ${c.nome}: ${r.rede.length} pedidos, "${r.info?.titulo}", altura ${r.info?.altura}px, ${r.pontos.length} passos, ${(r.duracao / 1000).toFixed(0)}s`);
      for (const link of r.info?.links || []) {
        try {
          const u = new URL(link);
          if (u.host === HOST_ORIGEM) rotasExtras.add(u.pathname + u.search);
        } catch {
          /* link invalido */
        }
      }
    };
    for (const c of cenarios) await capturarOriginal(c);
    const jaVistas = new Set(cenarios.map((c) => c.caminho.split('?')[0].replace(/\/+$/, '') || '/'));
    let extras = 0;
    for (const rota of rotasExtras) {
      const chave = rota.split('?')[0].replace(/\/+$/, '') || '/';
      if (jaVistas.has(chave) || extras >= 4) continue;
      jaVistas.add(chave);
      extras++;
      const c = { nome: `rota-${chave.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'x'}-desktop`, caminho: rota, tela: 'desktop', interagir: 'cliques' };
      cenarios.push(c);
      await capturarOriginal(c);
    }

    for (const r of originais.values()) {
      for (const item of r.rede) {
        let u;
        try {
          u = new URL(item.url);
        } catch {
          continue;
        }
        if (!/^https?:$/.test(u.protocol)) continue;
        if (item.metodo === 'GET' && u.host === HOST_ORIGEM) enfileirar(item.url, r.url, `navegador (${r.cenario})`);
      }
      for (const [chave, corpo] of r.corpos) if (!corposNavegador.has(chave)) corposNavegador.set(chave, corpo);
      for (const lista of [r.info?.recursos || [], r.info?.fundos || [], (r.info?.imagens || []).map((i) => i.src)]) {
        for (const u of lista) {
          try {
            if (new URL(u, r.url).host === HOST_ORIGEM) enfileirar(u, r.url, `navegador (${r.cenario})`);
          } catch {
            /* ignora */
          }
        }
      }
    }
    await esvaziarFila();
    log(`   ${destinos.size} arquivo(s) do site depois do navegador`);
  }

  // Erros 5xx do servidor original: tenta de novo mais tarde (podem ser passageiros).
  const comErro = [...recursos.values()].filter((r) => r.mesmoSite && r.erroServidor && !r.candidato);
  for (const reg of comErro) {
    const antes = reg.status;
    await dormir(1500);
    await processar(reg);
    reg.novaTentativa = `${antes} -> ${reg.status}`;
    log(`   nova tentativa de ${reg.url}: ${reg.novaTentativa}`);
  }
  if (comErro.length) await esvaziarFila();

  // 3) O que o navegador recebeu e o que foi gravado tem que ser a mesma coisa.
  const divergencias = [];
  const conferidos = new Map(); // destino em site/ -> true/false
  const conferir = (reg, corpo, url) => {
    if (!reg || !reg.sha256) return;
    let iguais;
    if (!ehHtml(reg.contentType)) iguais = sha256(corpo) === reg.sha256;
    else if (reg.estado === 'rota-do-app') iguais = semNonce(corpo) === indexRaizNorm;
    else if (reg.destino && fs.existsSync(path.join(RAIZ, reg.destino))) iguais = semNonce(corpo) === semNonce(fs.readFileSync(path.join(RAIZ, reg.destino)));
    else return;
    reg.confereComNavegador = iguais;
    if (reg.destino) conferidos.set(reg.destino, (conferidos.get(reg.destino) ?? true) && iguais);
    if (!iguais) {
      divergencias.push({ url, problema: 'conteudo recebido pelo navegador difere do arquivo baixado', navegador: sha256(corpo).slice(0, 16), baixado: reg.sha256.slice(0, 16) });
    }
  };
  for (const [chave, corpo] of corposNavegador) {
    if (!chave.startsWith('GET ')) continue;
    let u;
    try {
      u = new URL(chave.slice(4));
    } catch {
      continue;
    }
    u.hash = '';
    if (u.host === HOST_ORIGEM) conferir(recursos.get(u.href), corpo, u.href);
  }
  // O que redirecionava (icone, logo): compara o arquivo final que o navegador recebeu do CDN.
  for (const r of originais.values()) {
    for (const item of r.rede) {
      if (item.metodo !== 'GET' || !item.seguinte) continue;
      let u;
      try {
        u = new URL(item.url);
      } catch {
        continue;
      }
      if (u.host !== HOST_ORIGEM) continue;
      const corpo = r.corpos.get(`GET ${item.seguinte}`);
      if (!corpo) continue;
      u.hash = '';
      conferir(recursos.get(u.href), corpo, u.href);
    }
  }
  for (const d of divergencias) avisar(`${d.problema}: ${curto(d.url)}`);

  // 4) Comportamento do servidor original (para o servidor local imitar).
  log('3) sondando o comportamento do servidor original');
  const sondas = {};
  for (const caminho of SONDAS) sondas[caminho] = { original: await sondar(ORIGEM, caminho) };

  // 5) Conferencia: a copia, servida localmente, com o site original bloqueado.
  const conferencia = [];
  const pastaTelas = path.join(DIR_SAIDA, 'telas');
  const nomeDeArquivo = (t) => t.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 44);
  let servidor = null;
  try {
    servidor = await subirServidorLocal();
    log(`4) conferindo a copia em ${LOCAL} (site original bloqueado)`);
    for (const caminho of SONDAS) sondas[caminho].copia = await sondar(LOCAL, caminho);

    for (const c of browser ? cenarios : []) {
      const item = { cenario: c.nome, caminho: c.caminho, tela: c.tela, problemas: [], observacoes: [] };
      const cargasO = [originais.get(c.nome)];
      const cargasC = [];
      const decididas = new Map();
      const estrutura = new Map();
      let pendentes = [];
      let passosDaEstrutura = [];
      for (;;) {
        const original = cargasO[cargasC.length];
        const copia = await capturar(browser, c, { base: LOCAL, bloquearHost: HOST_ORIGEM, atrasos: original.tempos, rotulo: `copia (carga ${cargasC.length + 1})` });
        cargasC.push(copia);
        const e = compararEstrutura(original, copia);
        if (cargasC.length === 1) passosDaEstrutura = e.passos;
        for (const d of e.diferencas) if (!estrutura.has(d)) estrutura.set(d, cargasC.length);
        if (original.falhou) item.problemas.push(`a carga ${cargasC.length} do original falhou`);
        if (copia.falhou) item.problemas.push(`a carga ${cargasC.length} da copia falhou`);
        pendentes = analisarFotos(cargasO, cargasC, decididas);
        log(
          `   ${c.nome}, carga ${cargasC.length}: ${copia.pontos.length} passos; fotos resolvidas ${decididas.size}, pendentes ${pendentes.length}` +
            `${pendentes.length ? ` (${pendentes.slice(0, 3).map((x) => `${x.passo} y${x.y}: ${x.fortes ?? '?'} px`).join('; ')})` : ''}; estrutura ${e.diferencas.length ? 'DIFERENTE' : 'igual'}; ${(copia.duracao / 1000).toFixed(0)}s`,
        );
        if (!pendentes.length) break;
        if (cargasC.length >= MAX_RODADAS || Date.now() - inicio > PRAZO_EXTRAS_MS) break;
        cargasO.push(await capturar(browser, c, { base: ORIGEM, rotulo: `original (carga ${cargasO.length + 1})` }));
      }

      const original = cargasO[0];
      const copia = cargasC[0];
      for (const p of original.pontos) if (p.jpg) gravar(path.join(pastaTelas, `${c.nome}-${nomeDeArquivo(p.nome)}.jpg`), p.jpg);
      pendentes
        .filter((x) => x.par)
        .sort((x, y) => y.fortes - x.fortes)
        .slice(0, 3)
        .forEach((x, i) => gravar(path.join(pastaTelas, `${c.nome}-diferenca${i + 1}.png`), recorte(x.par.a, x.par.b, x.caixa)));

      const todas = [...decididas.values(), ...pendentes];
      const conta = (classe) => todas.filter((x) => x.classe === classe).length;
      item.cargas = cargasC.length;
      item.fotos = {
        total: todas.length,
        identicas: conta('identica'),
        arredondamento: conta('arredondamento'),
        maiorArredondamento: Math.max(0, ...todas.filter((x) => x.classe === 'arredondamento').map((x) => x.maior)),
        pixelsArredondados: todas.filter((x) => x.classe === 'arredondamento').reduce((soma, x) => soma + x.pixels, 0),
        variam: conta('varia'),
        diferentes: conta('diferente'),
        ausentes: conta('ausente'),
      };
      item.passos = original.pontos.map((p, s) => {
        const fotos = todas.filter((x) => x.s === s);
        const n = (classe) => fotos.filter((x) => x.classe === classe).length;
        return {
          nome: p.nome,
          fotos: fotos.length,
          identicas: n('identica'),
          arredondamento: n('arredondamento'),
          variam: n('varia'),
          diferentes: n('diferente') + n('ausente'),
          estrutura: passosDaEstrutura[s]?.diferente || [],
          geometria: passosDaEstrutura[s]?.geometria,
          pendentes: fotos
            .filter((x) => x.classe !== 'identica' && x.classe !== 'arredondamento')
            .slice(0, 4)
            .map((x) => `y${x.y}: ${x.classe}, ${x.fortes ?? '?'} px fortes de ${x.pixels ?? '?'} (max ${x.maior ?? '?'}) @[${x.caixa || ''}]${x.tamanhos ? ` tamanhos ${x.tamanhos}` : ''}; varia no original: ${x.variaNoOriginal ? 'sim' : 'nao'}, na copia: ${x.variaNaCopia ? 'sim' : 'nao'}`),
        };
      });
      item.rede = compararRede(original, copia);
      item.capturaOriginal = resumoCaptura(original);
      item.capturaCopia = resumoCaptura(copia);
      item.vazamentos = cargasC.flatMap((x) => x.vazamentos.map((v) => v.url));
      item.duracoes = { original: cargasO.map((x) => Math.round(x.duracao / 1000)), copia: cargasC.map((x) => Math.round(x.duracao / 1000)) };

      for (const [d, carga] of estrutura) item.problemas.push(`${d}${carga > 1 ? ` (so na carga ${carga})` : ''}`);
      if (item.vazamentos.length) item.problemas.push(`${item.vazamentos.length} pedido(s) da copia ao site original: ${[...new Set(item.vazamentos)].slice(0, 3).join(', ')}`);
      const { rede } = item;
      if (rede.conteudoDiferente.length) item.problemas.push(`conteudo diferente em: ${rede.conteudoDiferente.join(', ')}`);
      if (rede.soNoOriginal.length) item.problemas.push(`pedidos que so o original fez: ${rede.soNoOriginal.join(', ')}`);
      if (rede.soNaCopia.length) item.problemas.push(`pedidos que so a copia fez: ${rede.soNaCopia.join(', ')}`);
      if (rede.statusDiferente.length) item.problemas.push(`respostas diferentes: ${rede.statusDiferente.join(', ')}`);
      const quebradas = (r) => (r.info?.imagens || []).filter((i) => !i.ok).length;
      if (quebradas(copia) > quebradas(original)) item.problemas.push('imagens quebradas na copia');
      if (item.fotos.diferentes) item.problemas.push(`${item.fotos.diferentes} foto(s) diferentes do original em todas as ${item.cargas} cargas`);
      if (item.fotos.ausentes) item.problemas.push(`${item.fotos.ausentes} foto(s) que so existem de um lado`);
      if (item.fotos.variam) item.observacoes.push(`${item.fotos.variam} foto(s) nao casaram pixel a pixel em ${item.cargas} cargas, mas nesses pontos o proprio site muda de uma carga para outra`);
      if (item.fotos.arredondamento) item.observacoes.push(`${item.fotos.arredondamento} foto(s) so com arredondamento de cor (ate ${item.fotos.maiorArredondamento} em 255, ${item.fotos.pixelsArredondados} px)`);

      for (const carga of [...cargasO, ...cargasC]) for (const p of carga.pontos) p.fotos = [];
      medidas.clear();
      conferencia.push(item);
      log(
        `   => ${c.nome}: ${item.problemas.length ? `PROBLEMAS (${item.problemas.length})` : 'igual ao original'} · ${item.fotos.total} fotos: ${item.fotos.identicas} identicas, ` +
          `${item.fotos.arredondamento} arredondamento, ${item.fotos.variam} variam, ${item.fotos.diferentes} diferentes · ${item.cargas} carga(s)`,
      );
    }
  } catch (erro) {
    avisar(`conferencia interrompida: ${String(erro?.stack || erro).slice(0, 400)}`);
  } finally {
    if (servidor) servidor.kill();
  }
  if (browser) await browser.close().catch(() => {});

  // 6) Estabilidade: baixa tudo de novo e confere que nada mudou no meio do caminho.
  log('5) baixando tudo outra vez para conferir os arquivos gravados');
  const estabilidade = [];
  for (const [rel, { reg }] of destinos) {
    try {
      const r = await baixarComTentativas(reg.url);
      const gravado = fs.readFileSync(path.join(DIR_SITE, rel));
      const iguais = ehHtml(reg.contentType) ? semNonce(r.corpo) === semNonce(gravado) : r.corpo.equals(gravado);
      estabilidade.push({ arquivo: `site/${rel}`, status: r.status, igual: iguais });
      if (!iguais && !/sitemap\.xml$/.test(rel)) avisar(`o arquivo site/${rel} mudou entre dois downloads`);
    } catch (erro) {
      estabilidade.push({ arquivo: `site/${rel}`, erro: String(erro?.message || erro).slice(0, 100) });
    }
  }

  // 7) Relatorios.
  log('6) escrevendo relatorios');
  const lista = [...recursos.values()].map((r) => ({
    url: semAssinatura(r.url),
    mesmoSite: r.mesmoSite,
    estado: r.estado,
    destino: r.destino,
    motivo: r.motivo,
    status: r.status,
    contentType: r.contentType,
    tamanho: r.tamanho,
    sha256: r.sha256,
    cabecalhos: r.cabecalhos,
    redirecionamentos: r.cadeia && r.cadeia.length ? r.cadeia : undefined,
    igualA: r.igualA,
    candidato: r.candidato || undefined,
    confereComNavegador: r.destino ? conferidos.get(r.destino) : r.confereComNavegador,
    novaTentativa: r.novaTentativa,
    por: [...r.por].slice(0, 4).map(curto),
  }));
  const salvos = lista.filter((r) => r.estado === 'salvo').sort((a, b) => a.destino.localeCompare(b.destino));
  for (const s of salvos) s.igualNoSegundoDownload = estabilidade.find((e) => e.arquivo === s.destino)?.igual;

  const relatorio = {
    geradoEm: new Date().toISOString(),
    origem: ORIGEM,
    paginasPedidas: PAGINAS,
    navegador: browser ? UA.desktop : null,
    avisos,
    arquivosDoSite: salvos,
    sondas,
    conferencia,
    divergenciasNavegador: divergencias,
    linksExternos: [...linksExternos.entries()].map(([url, por]) => ({ url, por: [...por].slice(0, 3) })),
    outrosLinks: [...outrosLinks],
    urlsNoCodigo: [...urlsEmJs].sort(),
    redeDoOriginal: [...originais.values()].map((r) => ({ cenario: r.cenario, rede: r.rede.map((x) => ({ ...x, url: curto(semAssinatura(x.url)) })) })),
    todosOsRecursos: lista,
  };
  gravar(path.join(DIR_SAIDA, 'relatorio.json'), JSON.stringify(relatorio, null, 2));
  gravar(path.join(DIR_SAIDA, 'RESUMO.md'), resumoEmTexto(relatorio));
  const comProblema = conferencia.filter((c) => c.problemas.length).length;
  log(`pronto: ${salvos.length} arquivo(s) em site/, ${avisos.length} aviso(s), ${conferencia.length} cenario(s) conferidos, ${comProblema} com problema`);
}

function resumoEmTexto(rel) {
  const L = [];
  const kb = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${(n / 1024).toFixed(1)} kB`);
  const simNao = (v) => (v === undefined ? '-' : v ? 'sim' : 'NAO');
  L.push(`# Copia de ${rel.origem}`, '', `Gerado em ${rel.geradoEm} · ${rel.navegador || 'sem navegador'}`, '');

  L.push(`## Arquivos do site (${rel.arquivosDoSite.length})`, '');
  L.push('| arquivo | bytes | tipo no original | sha256 | igual ao que o navegador recebeu | igual no 2o download | redirecionava |', '|---|---|---|---|---|---|---|');
  for (const a of rel.arquivosDoSite) {
    const red = a.redirecionamentos ? a.redirecionamentos.map((x) => `${x.status} -> ${new URL(x.para.replace('?…', '')).host}`).join(' ; ') : '';
    L.push(`| ${a.destino} | ${a.tamanho} (${kb(a.tamanho)}) | ${a.contentType} | ${a.sha256.slice(0, 16)} | ${simNao(a.confereComNavegador)} | ${simNao(a.igualNoSegundoDownload)} | ${red} |`);
  }

  L.push('', `## Avisos (${rel.avisos.length})`, '');
  for (const a of rel.avisos) L.push(`- ${a}`);

  L.push('', '## Conferencia (copia x original)', '');
  L.push('Cada foto e comparada pixel a pixel, sem tolerancia. "identica" = alguma carga da copia saiu exatamente igual a alguma carga do original.', '');
  for (const c of rel.conferencia) {
    const f = c.fotos;
    L.push(`### ${c.cenario} — ${c.caminho} (${c.tela})`, '');
    L.push(`**${c.problemas.length ? `PROBLEMAS (${c.problemas.length})` : 'Igual ao original'}**`, '');
    for (const p of c.problemas) L.push(`- PROBLEMA: ${p}`);
    for (const o of c.observacoes) L.push(`- observacao: ${o}`);
    L.push(`- cargas: ${c.cargas} de cada lado (segundos: original ${c.duracoes.original.join(', ')}; copia ${c.duracoes.copia.join(', ')})`);
    L.push(`- fotos: ${f.total} · identicas ${f.identicas} · so arredondamento ${f.arredondamento} · variam ${f.variam} · diferentes ${f.diferentes} · ausentes ${f.ausentes}`);
    const o = c.capturaOriginal;
    const p = c.capturaCopia;
    L.push(`- original: "${o.titulo}" ${o.largura}x${o.altura}px, ${o.elementos} elementos, ${o.caracteres} caracteres, ${o.pedidos} pedidos · copia: "${p.titulo}" ${p.largura}x${p.altura}px, ${p.elementos} elementos, ${p.caracteres} caracteres, ${p.pedidos} pedidos`);
    L.push(`- pedidos ao proprio site: ${c.rede.original.length} x ${c.rede.copia.length} · so no original: ${c.rede.soNoOriginal.join(' ; ') || '-'} · so na copia: ${c.rede.soNaCopia.join(' ; ') || '-'} · respostas diferentes: ${c.rede.statusDiferente.join(' ; ') || '-'} · conteudo diferente: ${c.rede.conteudoDiferente.join(' ; ') || '-'}`);
    L.push(`- redirecionava no original (arquivo local na copia): ${c.rede.redirecionavaNoOriginal.join(' ; ') || '-'}`);
    L.push(`- pedidos da copia ao site original: ${c.vazamentos.join(' ; ') || 'nenhum'} · saidas barradas: original ${o.saidasBarradas.join(' ; ') || '-'} / copia ${p.saidasBarradas.join(' ; ') || '-'} · janelas: ${o.janelas.join(' ; ') || '-'} / ${p.janelas.join(' ; ') || '-'}`);
    L.push(`- estatisticas barradas: ${o.estatisticasBarradas.length} x ${p.estatisticasBarradas.length} · outros envios a terceiros: ${o.enviosATerceiros.map((e) => `${e.metodo} ${e.url}`).join(' ; ') || '-'} / ${p.enviosATerceiros.map((e) => `${e.metodo} ${e.url}`).join(' ; ') || '-'}`);
    L.push(`- erros de script: original ${o.erros.join(' ¦ ') || '-'} / copia ${p.erros.join(' ¦ ') || '-'}`);
    L.push(`- selo da plataforma: original ${JSON.stringify(o.seloDaPlataforma)} / copia ${JSON.stringify(p.seloDaPlataforma)} · animacoes sem fim congeladas: ${o.animacoesCongeladas} / ${p.animacoesCongeladas} · avisos: ${[...o.avisos, ...p.avisos].join(' ; ') || '-'} · endereco no fim: ${o.urlNoFim} / ${p.urlNoFim}`);
    L.push('', '| passo | fotos | identicas | arredond. | variam | diferentes | estrutura | elementos (dif/total) |', '|---|---|---|---|---|---|---|---|');
    for (const d of c.passos) {
      L.push(`| ${d.nome} | ${d.fotos} | ${d.identicas} | ${d.arredondamento} | ${d.variam} | ${d.diferentes} | ${d.estrutura.length ? `DIFERENTE: ${d.estrutura.join(', ')}` : 'igual'} | ${d.geometria ? `${d.geometria.diferentes}/${d.geometria.elementos}` : '-'} |`);
      for (const x of d.pendentes) L.push(`| ↳ ${x} | | | | | | | |`);
    }
    L.push('', `Console (erros/avisos) — original: ${o.console.map((x) => x.texto).join(' ¦ ').slice(0, 900) || '-'}`);
    L.push(`Console (erros/avisos) — copia: ${p.console.map((x) => x.texto).join(' ¦ ').slice(0, 900) || '-'}`);
    L.push(`Falhas de rede — original: ${o.falhas.map((x) => `${x.url} (${x.erro})`).join(' ; ').slice(0, 600) || '-'}`);
    L.push(`Falhas de rede — copia: ${p.falhas.map((x) => `${x.url} (${x.erro})`).join(' ; ').slice(0, 600) || '-'}`);
    L.push('');
  }

  L.push('## Comportamento do servidor (original x copia)', '', '| caminho | original | copia | mesmo status | mesmo conteudo |', '|---|---|---|---|---|');
  for (const [caminho, s] of Object.entries(rel.sondas)) {
    const f = (x) => (x ? (x.erro ? `erro ${x.erro}` : `${x.primeiroStatus !== x.status ? `${x.primeiroStatus}→` : ''}${x.status} ${x.contentType} ${x.tamanho}b ${x.sha}`) : '-');
    const mesmoStatus = s.original && s.copia && s.original.status === s.copia.status;
    const mesmoConteudo = s.original && s.copia && s.original.sha === s.copia.sha;
    L.push(`| ${caminho} | ${f(s.original)} | ${f(s.copia)} | ${simNao(!!mesmoStatus)} | ${simNao(!!mesmoConteudo)} |`);
  }

  L.push('', '## Pedidos do navegador no original', '');
  for (const c of rel.redeDoOriginal) {
    L.push(`### ${c.cenario}`, '');
    const vistos = new Set();
    for (const r of c.rede) {
      const linha = `- ${r.metodo} ${r.status} ${r.tipo} ${r.url} ${r.contentType || ''} ${r.tamanho ?? ''}${r.para ? ` -> ${curto(r.para)}` : ''}`;
      if (vistos.has(linha)) continue;
      vistos.add(linha);
      L.push(linha);
    }
    L.push('');
  }

  L.push('## Links para fora do site', '');
  for (const l of rel.linksExternos) L.push(`- ${l.url}`);
  for (const l of rel.outrosLinks) L.push(`- ${l}`);
  L.push('', '## Enderecos citados no codigo', '');
  for (const u of rel.urlsNoCodigo) L.push(`- ${u}`);
  L.push('', '## Recursos nao salvos', '');
  const naoSalvos = rel.todosOsRecursos.filter((x) => x.estado !== 'salvo');
  const porEstado = {};
  for (const r of naoSalvos) (porEstado[`${r.estado}${r.motivo ? ` (${r.motivo})` : ''}`] ||= []).push(r);
  for (const [estado, itens] of Object.entries(porEstado)) {
    L.push(`- **${estado}** — ${itens.length}: ${itens.slice(0, 70).map((r) => curto(r.url).replace(rel.origem, '')).join(' , ')}`);
  }
  return `${L.join('\n')}\n`;
}

principal()
  .then(() => process.exit(0))
  .catch((erro) => {
    console.error(erro);
    console.log(`::error::A copia falhou: ${String(erro?.message || erro).slice(0, 200)}`);
    process.exit(1);
  });
