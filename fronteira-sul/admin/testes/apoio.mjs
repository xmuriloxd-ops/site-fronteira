// Apoio comum aos testes: caminhos, pastas temporárias, contagem e o que uma instalação nova deve entregar.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ARQUIVOS } from '../mapa.mjs';

/** A pasta fronteira-sul/. */
export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SITE = path.join(RAIZ, 'site');

// ───── a cópia e a instalação nova
/** Os arquivos de texto de site/, exatamente como foram copiados do site original. */
export const COPIA = Object.fromEntries(Object.entries(ARQUIVOS).map(([nome, rel]) => [nome, fs.readFileSync(path.join(SITE, rel), 'utf8')]));

/** O único trecho de `texto` que casa com `padrao` (grupo 1). */
function lerOUnico(texto, padrao) {
  const achados = texto.match(new RegExp(padrao.source, 'g')) || [];
  assert.equal(achados.length, 1, `esperava achar uma vez só: ${padrao}`);
  return padrao.exec(texto)[1];
}
/** Troca o único trecho de `texto` que casa com `padrao`. */
function trocarOUnico(texto, padrao, trocar) {
  lerOUnico(texto, padrao);
  return texto.replace(padrao, trocar);
}

/** Os créditos que vieram na cópia, lidos do próprio arquivo (campo do painel -> texto). */
export const CREDITOS_DA_COPIA = {
  'regras.creditos.nome': lerOUnico(COPIA.js, /className:"author-name",children:"([^"]*)"/),
  'regras.creditos.discord': lerOUnico(COPIA.js, /navigator\.clipboard\.writeText\("([^"]*)"\)/),
  'regras.creditos.telefone': lerOUnico(COPIA.js, /href:"tel:[^"]*",children:"([^"]*)"/),
  'regras.creditos.email': lerOUnico(COPIA.js, /href:"mailto:([^"]*)"/),
};

/** A aba "Admin", que o servidor acrescenta depois das duas abas da página de regras. */
export const ABA_ADMIN =
  ',R.jsx("a",{className:"view-tab",href:"/admin/",style:{display:"inline-flex",alignItems:"center",marginLeft:"auto",textDecoration:"none"},children:"Admin"})';

export const IMAGEM_DO_CONVITE = '/fronteira-sul-convite-preview.jpg';

// ───── o site começa pelo convite (ver ../convite-no-inicio.mjs)
/** Onde fica cada página numa instalação nova, e com a opção "Começar o site pelo convite" desligada. */
export const ENDERECOS = { inicio: '/', convite: '/', regras: '/regras/' };
export const ENDERECOS_DO_ORIGINAL = { inicio: '/', convite: '/convite/', regras: '/' };

/**
 * O que muda no aplicativo de regras para ele funcionar em /regras/: a raiz
 * dos endereços (vazia na cópia) e o botão "Go Home" da tela "não encontrada",
 * que passa a abrir o início do site de verdade. Escritos aqui por extenso, e
 * não importados, para o teste notar se alguém mexer neles sem querer.
 */
export const BASE_NA_COPIA = 'base:"",ssrPath:';
export const BASE_ENTREGUE = 'base:/^\\/regras(\\/|$)/i.test(location.pathname)?"/regras":"",ssrPath:';
export const VOLTAR_NA_COPIA = 'const r=()=>{a("/")}';
export const VOLTAR_ENTREGUE = 'const r=()=>{location.assign("/")}';

/** Na página do convite: clicar na imagem faz o mesmo que o botão. */
export const CLIQUE_NA_IMAGEM = ` onclick="var b=document.querySelector('a.button');if(b)b.click()"`;

/**
 * O que entra no <head> do convite quando ele é o início do site: as regras
 * de visual que fazem o convite, com o botão, caber na tela (a imagem da cópia
 * tem 1200 × 675, proporção 1,7778).
 *
 * Também por extenso. Estes testes não abrem um navegador: o que garante que
 * o convite cabe na tela são as medições descritas no LEIA-ME.md, feitas com
 * estas regras exatamente como estão aqui. Quem mudar uma delas precisa medir
 * de novo.
 */
export const CABECA_DO_INICIO = [
  '<style id="convite-no-inicio">',
  'main{--tela:100vh;',
  '--ao-lado:calc((var(--tela) - 2*clamp(16px,4vw,48px) - 185px)*1.7778);',
  '--embaixo:calc((var(--tela) - 2*clamp(16px,4vw,48px) - 261px)*1.7778);',
  '--largura:max(clamp(0px,(var(--ao-lado) - 600px)*99999,var(--ao-lado)),var(--embaixo));',
  'container-type:inline-size;width:min(100%,1100px,max(300px,var(--largura)))}',
  '@media (max-width:680px){main{--largura:var(--embaixo)}}',
  '.poster{width:min(100%,max(120px,var(--largura)));margin-left:auto;margin-right:auto}',
  '@supports (width:1cqw){h1{font-size:clamp(20px,min(3vw,3.3cqw),30px)}}',
  '@container (max-width:600px){.message{align-items:stretch;flex-direction:column;padding:18px}.button{width:100%}}',
  '@media (min-width:480px) and (max-height:479px),(min-width:640px) and (max-height:618px) and (min-aspect-ratio:4/3){',
  'body{padding-top:16px;padding-bottom:16px}',
  'main{display:flex;align-items:center;gap:16px;width:min(100%,1100px)}',
  '.poster{flex:none;width:min(60%,calc(100% - 256px),calc((var(--tela) - 34px)*1.7778));margin:0}',
  '.message{flex:1;min-width:0;margin-top:0;align-items:stretch;flex-direction:column;padding:18px}',
  'h1{text-wrap:balance}',
  '.button{width:100%}',
  '}',
  '@supports (height:100svh){body{min-height:100svh}main{--tela:100svh}}',
  '.poster{cursor:pointer;aspect-ratio:auto 1200/675}',
  '.eyebrow:empty,h1:empty,p:empty,.button:empty{display:none}',
  '</style>',
].join('\n');

/**
 * A etiqueta "Admin" no canto do convite, quando ele é o início do site: o
 * link, que entra logo depois do convite, e as regras de visual dele, que
 * entram no <head> depois das de cima. É a entrada do painel na primeira
 * página, como a aba "Admin" é na página de regras.
 *
 * Também por extenso: que a etiqueta não muda o convite de lugar nem fica por
 * cima da imagem, do texto ou do botão, em nenhum tamanho de tela, foi
 * conferido no navegador com este link e estas regras exatamente como estão
 * aqui (ver LEIA-ME.md).
 */
export const LINK_DO_ADMIN = '<a class="admin-no-canto" href="/admin/">Admin</a>';
export const ESTILO_DO_LINK_DO_ADMIN = [
  '<style id="admin-no-canto">',
  '.admin-no-canto{position:absolute;top:0;right:0;display:flex;align-items:center;height:16px;padding:0 9px 1px 11px;',
  'border:solid rgba(234,191,78,.26);border-width:0 0 1px 1px;border-radius:0 0 0 8px;background:rgba(23,26,22,.94);',
  'color:#b8b8ac;font-size:10px;font-weight:800;line-height:1;letter-spacing:.18em;text-transform:uppercase;text-decoration:none;white-space:nowrap;',
  'transition:color .18s,border-color .18s}',
  '.admin-no-canto::after{content:"";position:absolute;top:0;right:0;bottom:-9px;left:0}',
  '.admin-no-canto:hover{color:#eabf4e;border-color:rgba(234,191,78,.55)}',
  '.admin-no-canto:focus-visible{outline:2px solid #f6d77b;outline-offset:-2px}',
  '@media (prefers-reduced-motion:reduce){.admin-no-canto{transition:none}}',
  '</style>',
].join('\n');

/**
 * O link de volta ao convite, que a página de regras ganha quando o site
 * começa por ele: uma seta e o texto, dentro de uma caixa. O aplicativo recebe
 * o elemento duas vezes (na barra do topo, para telas estreitas, e na linha
 * das abas), e a página recebe as regras de visual que mostram um de cada vez.
 *
 * Também por extenso: onde o link aparece em cada largura de tela, sem tirar
 * nada do lugar, foi conferido no navegador com este elemento e estas regras
 * exatamente como estão aqui (ver LEIA-ME.md).
 */
export const LINK_DE_VOLTA =
  'R.jsx("span",{className:"voltar-ao-convite",children:R.jsxs("a",{className:"view-tab",href:"/",children:[' +
  'R.jsxs("svg",{width:14,height:14,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",' +
  'children:[R.jsx("path",{d:"m12 19-7-7 7-7"}),R.jsx("path",{d:"M19 12H5"})]}),' +
  '"Voltar ao convite"]})})';
/** O mesmo link com outro texto. */
export const linkDeVolta = (texto) => LINK_DE_VOLTA.replace('"Voltar ao convite"', () => JSON.stringify(texto));

export const ESTILO_DO_LINK_DE_VOLTA = [
  '<style id="voltar-ao-convite">',
  '.voltar-ao-convite{display:flex;justify-content:flex-end}',
  '.voltar-ao-convite>a{display:flex;align-items:center;gap:7px;flex:0 1 auto;min-width:0;overflow-wrap:anywhere;text-decoration:none}',
  '.voltar-ao-convite svg{flex:none}',
  '.view-tabs>.voltar-ao-convite{flex:1 1 0}',
  '.topbar>.voltar-ao-convite{display:none}',
  '@media (max-width:700px){',
  '.view-tabs>.voltar-ao-convite{display:none}',
  '.topbar{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:0}',
  '.topbar>.topbar-tools{grid-column:1/-1}',
  '.topbar>.voltar-ao-convite{display:flex;align-self:center}',
  '}',
  '</style>',
].join('\n');

/**
 * Endereços com versão. O que muda pelo painel é pedido pelas páginas com a
 * versão no endereço ("...js?v=abc"), para nenhum intermediário entregar uma
 * cópia antiga guardada: quando o conteúdo muda, o endereço muda.
 *
 * A versão de um arquivo montado pelo servidor é o começo do resumo (SHA-1,
 * em base64 para endereços) do que é entregue.
 */
export const versaoDe = (conteudo) => crypto.createHash('sha1').update(conteudo, 'utf8').digest('base64url').slice(0, 10);
const PEDIDO_DO_APLICATIVO = /(<script type="module" crossorigin src="\/assets\/index-FbaU4KfD\.js)(?:\?v=[A-Za-z0-9_-]{10})?(">)/;
/** A página de regras `index` pedindo o aplicativo `js`: a versão que vai no endereço é a dele. */
export const pedindoOAplicativo = (index, js) => trocarOUnico(index, PEDIDO_DO_APLICATIVO, (_, antes, depois) => `${antes}?v=${versaoDe(js)}${depois}`);
/**
 * Uma imagem trocada pelo painel: o endereço dela ganha, em todo lugar onde
 * aparece, o começo do resumo (SHA-256) do arquivo enviado.
 */
export const versaoDaImagem = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 12);
export const comAImagemTrocada = (texto, endereco, bytes) => texto.split(`"${endereco}"`).join(`"${endereco}?v=${versaoDaImagem(bytes)}"`);

/** A regra que esconde uma linha dos créditos (3 = telefone, 4 = e-mail). */
export const esconderLinha = (n) => `.author-details > .contact-row:nth-child(${n}){display:none!important}`;

/**
 * O que o site entrega sem nada salvo pelo painel: a cópia mais o que este
 * projeto mudou nela.
 *
 *   - o aplicativo de regras: a raiz dos endereços (para ele funcionar em
 *     /regras/), o botão da tela "não encontrada", o link de volta ao convite
 *     (na barra do topo e na linha das abas), a aba Admin e os créditos;
 *   - a página de regras: as regras de visual do link de volta, as linhas
 *     vazias dos créditos, escondidas, e o aplicativo pedido com a versão
 *     dele no endereço;
 *   - a página do convite, que passa a ser o início do site: o botão leva a
 *     /regras/, a imagem é clicável, o <head> ganha as regras de visual e o
 *     canto da página ganha a etiqueta "Admin".
 *
 * É montado aqui com trocas simples de texto, sem passar pelo conteudo.mjs.
 * Os arquivos que não aparecem aqui saem iguais aos da cópia.
 *
 * `comecaPeloConvite: false` é a opção "Começar o site pelo convite"
 * desligada: as páginas ficam onde estavam no site original. O aplicativo
 * volta a ter a raiz e o botão da cópia, não há link de volta, e a página do
 * convite é a da cópia, sem tirar nem pôr (null). A aba Admin e os créditos
 * continuam. `textoDoLink` é o texto do link de volta; vazio, ele não entra.
 * `entradaDoAdmin: false` é a opção "Mostrar “Admin” para os visitantes"
 * desligada: nem a aba na página de regras, nem a etiqueta no convite.
 */
function oQueOSiteEntrega({ comecaPeloConvite = true, textoDoLink = 'Voltar ao convite', entradaDoAdmin = true } = {}) {
  const link = comecaPeloConvite && textoDoLink ? linkDeVolta(textoDoLink) : null;
  let js = COPIA.js;
  if (comecaPeloConvite) {
    js = trocarOUnico(js, /base:"",ssrPath:/, () => BASE_ENTREGUE);
    js = trocarOUnico(js, /const r=\(\)=>\{a\("\/"\)\}/, () => VOLTAR_ENTREGUE);
  }
  if (link) js = trocarOUnico(js, /R\.jsxs\("div",\{"data-loc":"client\/src\/pages\/Home\.tsx:285",className:"topbar-tools"/, (achado) => `${link},${achado}`);
  js = trocarOUnico(js, /children:"Regras da Polícia"\}\)(?=\]\}\))/, (achado) => achado + (link ? `,${link}` : '') + (entradaDoAdmin ? ABA_ADMIN : ''));
  js = trocarOUnico(js, /(className:"author-name",children:)"[^"]*"/, (_, antes) => `${antes}"MURILO MENDES"`);
  js = trocarOUnico(js, /(className:"text-button",onClick:ne,children:\[)"[^"]*"/, (_, antes) => `${antes}"sgtmendes1997_29726"`);
  js = trocarOUnico(js, /(navigator\.clipboard\.writeText\()"[^"]*"/, (_, antes) => `${antes}"sgtmendes1997_29726"`);
  js = trocarOUnico(js, /href:"tel:[^"]*",children:"[^"]*"/, () => 'href:"tel:",children:""');
  js = trocarOUnico(js, /href:"mailto:[^"]*",children:"[^"]*"/, () => 'href:"mailto:",children:""');
  const noHead = `${link ? `${ESTILO_DO_LINK_DE_VOLTA}\n` : ''}<style id="ajustes-do-admin">\n${esconderLinha(3)}\n${esconderLinha(4)}\n</style>`;
  const index = pedindoOAplicativo(trocarOUnico(COPIA.index, /<\/head>/, (achado) => noHead + achado), js);
  if (!comecaPeloConvite) return { js, index, convite: null };
  let convite = trocarOUnico(COPIA.convite, /<a class="button" href="\/">/, () => '<a class="button" href="/regras/">');
  convite = trocarOUnico(convite, /<img class="poster"/, (achado) => achado + CLIQUE_NA_IMAGEM);
  if (entradaDoAdmin) convite = trocarOUnico(convite, /<\/main>/, (achado) => achado + LINK_DO_ADMIN);
  convite = trocarOUnico(convite, /<\/head>/, (achado) => CABECA_DO_INICIO + (entradaDoAdmin ? `\n${ESTILO_DO_LINK_DO_ADMIN}` : '') + achado);
  return { js, index, convite };
}

/** Uma instalação nova. */
export const PADRAO = oQueOSiteEntrega();
/** Com a opção "Começar o site pelo convite" desligada. */
export const SEM_COMECAR_PELO_CONVITE = oQueOSiteEntrega({ comecaPeloConvite: false });
/** Com o texto do link de volta vazio: a página de regras não tem o link. */
export const SEM_O_LINK_DE_VOLTA = oQueOSiteEntrega({ textoDoLink: '' });
/** Com outro texto no link de volta. */
export const comOLinkDeVolta = (texto) => oQueOSiteEntrega({ textoDoLink: texto });
/** Com a opção "Mostrar “Admin” para os visitantes" desligada: sem a aba nas regras e sem a etiqueta no convite. */
export const SEM_A_ENTRADA_DO_ADMIN = oQueOSiteEntrega({ entradaDoAdmin: false });
/** Com as duas opções desligadas: as páginas onde estavam no site original, e sem a aba Admin. */
export const SEM_COMECAR_PELO_CONVITE_NEM_ADMIN = oQueOSiteEntrega({ comecaPeloConvite: false, entradaDoAdmin: false });

// ───── o site gravado em arquivos (ver ../../exportar.mjs)
/**
 * A página que fica no lugar de um endereço que leva a outro. O servidor
 * manda o navegador de "/convite/" para "/"; uma hospedagem de arquivos não
 * faz isso, e o endereço antigo recebe esta página, que leva ao novo.
 */
export const paginaQueLeva = (destino) =>
  [
    '<!doctype html>',
    '<html lang="pt-BR">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="robots" content="noindex">',
    '<title>Fronteira do Sul RP</title>',
    `<meta http-equiv="refresh" content="0; url=${destino}">`,
    `<script>location.replace("${destino}"+location.search+location.hash)</script>`,
    '</head>',
    '<body>',
    `<a href="${destino}">Continuar</a>`,
    '</body>',
    '</html>',
    '',
  ].join('\n');

/** Troca todas as vezes em que `antes` aparece em `texto`, conferindo quantas são. */
function trocarTodas(texto, antes, depois, vezes) {
  const partes = texto.split(antes);
  assert.equal(partes.length - 1, vezes, `esperava achar ${vezes} vez(es): ${antes}`);
  return partes.join(depois);
}

/**
 * O site dentro de uma pasta do endereço ("/projeto/site"), como numa
 * hospedagem que publica cada projeto em uma pasta. Cada endereço do próprio
 * site passa a começar pela pasta; nada mais muda.
 *
 * Recebe o que o site entrega na raiz ({ js, index, convite }, como em
 * oQueOSiteEntrega) e devolve o mesmo dentro da pasta, mais a lista de ícones
 * (`manifesto`). Também por extenso, com trocas simples de texto:
 *
 *   - no aplicativo: a raiz dos endereços, o endereço da tela "não
 *     encontrada", o botão dela (quando o site começa pelo convite), os dois
 *     endereços do logo e o destino do link de volta ao convite;
 *   - na página de regras: o aplicativo (com a versão dele, que mudou), o
 *     estilo, a lista de ícones e o endereço da plataforma original;
 *   - na página do convite: a imagem, a lista de ícones e o destino do botão;
 *   - nas duas: onde fica o ícone da aba, que na raiz o navegador acha
 *     sozinho.
 *
 * `comecaPeloConvite: false` é a opção desligada: `esperado.convite` vem null
 * (a página é a da cópia) e as regras ficam no começo da pasta.
 */
export function naPasta(esperado, pasta, { comecaPeloConvite = true, semAPlataforma = false } = {}) {
  // (a pasta dentro de uma expressão regular: as barras e os pontos levam uma barra invertida na frente)
  const emExpressao = pasta.replace(/[/.]/g, (c) => `\\${c}`);
  let js = esperado.js;
  js = comecaPeloConvite
    ? trocarTodas(js, 'base:/^\\/regras(\\/|$)/i.test(location.pathname)?"/regras":"",ssrPath:', `base:/^${emExpressao}\\/regras(\\/|$)/i.test(location.pathname)?"${pasta}/regras":"${pasta}",ssrPath:`, 1)
    : trocarTodas(js, 'base:"",ssrPath:', `base:"${pasta}",ssrPath:`, 1);
  js = trocarTodas(js, ',tg="/404";function ', `,tg="${pasta}/404";function `, 1);
  if (comecaPeloConvite) js = trocarTodas(js, 'const r=()=>{location.assign("/")}', `const r=()=>{location.assign("${pasta}/")}`, 1);
  js = trocarOUnico(js, /"(\/manus-storage\/fronteira-sul-logo_1b1b4c2d\.webp(?:\?v=[0-9a-f]{12})?)"/, (_, endereco) => `"${pasta}${endereco}"`);
  js = trocarOUnico(js, /"(\/fronteira-sul-logo\.webp(?:\?v=[0-9a-f]{12})?)"/, (_, endereco) => `"${pasta}${endereco}"`);
  const linkDeVolta = 'className:"voltar-ao-convite",children:R.jsxs("a",{className:"view-tab",href:"/",';
  js = trocarTodas(js, linkDeVolta, linkDeVolta.replace('href:"/"', `href:"${pasta}/"`), js.includes(linkDeVolta) ? 2 : 0);

  // Onde fica o ícone da aba: entra no <head> antes do que o projeto já punha ali (ou sozinho, se não havia nada).
  const comOIcone = (html) => trocarOUnico(html, /(<link rel="manifest" href=")(\/__manus\/pwa\/manifest\.webmanifest" crossorigin="use-credentials" \/>)(<\/head>)?/, (_, antes, lista, fim) => {
    const versao = /"src":"\/favicon\.ico(\?v=[0-9a-f]{12})"/.exec(esperado.manifesto || '')?.[1] || '';
    return `${antes}${pasta}${lista}<link rel="icon" href="${pasta}/favicon.ico${versao}">${fim || '\n'}`;
  });

  let index = esperado.index;
  index = trocarOUnico(index, /(<script type="module" crossorigin src=")(\/assets\/index-FbaU4KfD\.js)(?:\?v=[A-Za-z0-9_-]{10})?(">)/, (_, antes, endereco, depois) => `${antes}${pasta}${endereco}?v=${versaoDe(js)}${depois}`);
  index = trocarTodas(index, '<link rel="stylesheet" crossorigin href="/assets/index-DMP8NyHf.css">', `<link rel="stylesheet" crossorigin href="${pasta}/assets/index-DMP8NyHf.css">`, 1);
  index = trocarTodas(index, '<script src="/api/platform/config.js"></script>', `<script src="${pasta}/api/platform/config.js"></script>`, semAPlataforma ? 0 : 1);
  index = comOIcone(index);

  let convite = esperado.convite ?? COPIA.convite;
  convite = trocarOUnico(convite, /(<img class="poster"[^>]* src=")(\/fronteira-sul-convite-preview\.jpg(?:\?v=[0-9a-f]{12})?")/, (_, antes, endereco) => `${antes}${pasta}${endereco}`);
  convite = trocarOUnico(convite, /(<a class="button" href=")(\/[^"/][^"]*|\/)(">)/, (_, antes, destino, depois) => `${antes}${pasta}${destino}${depois}`);
  convite = comOIcone(convite);

  let manifesto = esperado.manifesto ?? COPIA.manifesto;
  for (const chave of ['id', 'start_url', 'scope']) manifesto = trocarTodas(manifesto, `"${chave}":"/"`, `"${chave}":"${pasta}/"`, 1);
  manifesto = trocarTodas(manifesto, '"src":"/favicon.ico', `"src":"${pasta}/favicon.ico`, 2);
  return { js, index, convite, manifesto };
}

// ───── o servidor de verdade, para os testes que falam com ele por HTTP
export const portaLivre = () =>
  new Promise((resolver) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolver(port));
    });
  });

/** Sobe um servidor e espera ele responder. `registro: true` liga a lista de pedidos que ele escreve no terminal. */
export async function iniciar(porta, dados, { registro = false } = {}) {
  // Só as variáveis do teste: nada do ambiente de quem roda muda o resultado.
  const env = { ...process.env, PORT: String(porta), HOST: '127.0.0.1', DADOS_DIR: dados, SILENCIOSO: '1' };
  for (const nome of ['SITE_DIR', 'ADMIN_USUARIO', 'ADMIN_SENHA', 'CONFIAR_NO_PROXY', ...(registro ? ['SILENCIOSO'] : [])]) delete env[nome];
  const p = spawn(process.execPath, [path.join(RAIZ, 'servidor.mjs')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let saida = '';
  p.stdout.on('data', (d) => (saida += d));
  p.stderr.on('data', (d) => (saida += d));
  p.saida = () => saida;
  for (let i = 0; i < 200; i++) {
    if (p.exitCode !== null) break;
    try {
      await fetch(`http://127.0.0.1:${porta}/robots.txt`);
      return p;
    } catch {
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  throw new Error(`o servidor não subiu:\n${saida}`);
}

export async function parar(p) {
  if (!p || p.exitCode !== null) return;
  const fim = new Promise((r) => p.once('exit', r));
  p.kill('SIGTERM');
  await fim;
}

/** Uma cópia de site/ em uma pasta temporária, para testar o que acontece quando um arquivo vem diferente. */
export function copiaDoSite(alterar = {}) {
  const pasta = pastaTemporaria();
  fs.cpSync(SITE, pasta, { recursive: true });
  for (const [nome, mudar] of Object.entries(alterar)) {
    const arquivo = path.join(pasta, ARQUIVOS[nome]);
    const antes = fs.readFileSync(arquivo, 'utf8');
    const depois = mudar(antes);
    assert.notEqual(depois, antes, `a alteração de ${nome} não mudou nada`);
    fs.writeFileSync(arquivo, depois);
  }
  return pasta;
}

const temporarias = [];
/** Pasta vazia, apagada sozinha quando o teste termina. */
export function pastaTemporaria() {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'fronteira-sul-teste-'));
  temporarias.push(pasta);
  return pasta;
}
process.on('exit', () => {
  for (const pasta of temporarias) fs.rmSync(pasta, { recursive: true, force: true });
});

let passaram = 0;
export function ok(nome) {
  passaram += 1;
  console.log(`  ok  ${nome}`);
}
export function resumo() {
  console.log(`  ${passaram} verificações passaram.`);
}

/** Um PNG válido de uma cor só, para testar o envio de imagens sem depender de arquivos de fora. */
export function pngSimples(largura, altura, [r, g, b] = [51, 102, 153]) {
  const tabela = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (dados) => {
    let c = 0xffffffff;
    for (const byte of dados) c = tabela[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const pedaco = (tipo, dados) => {
    const corpo = Buffer.concat([Buffer.from(tipo, 'latin1'), dados]);
    const tamanho = Buffer.alloc(4);
    tamanho.writeUInt32BE(dados.length);
    const soma = Buffer.alloc(4);
    soma.writeUInt32BE(crc(corpo));
    return Buffer.concat([tamanho, corpo, soma]);
  };
  const cabecalho = Buffer.alloc(13);
  cabecalho.writeUInt32BE(largura, 0);
  cabecalho.writeUInt32BE(altura, 4);
  cabecalho.set([8, 2, 0, 0, 0], 8); // 8 bits por cor, RGB
  const linha = Buffer.concat([Buffer.from([0]), Buffer.alloc(largura * 3, Buffer.from([r, g, b]))]);
  const pixels = Buffer.concat(Array.from({ length: altura }, () => linha));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco('IHDR', cabecalho),
    pedaco('IDAT', zlib.deflateSync(pixels)),
    pedaco('IEND', Buffer.alloc(0)),
  ]);
}

/** Um GIF válido de 1 × 1. */
export const GIF_MINIMO = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
