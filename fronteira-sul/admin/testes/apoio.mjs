// Apoio comum aos testes: caminhos, pastas temporárias, contagem e o que uma instalação nova deve entregar.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
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

/** A regra que esconde uma linha dos créditos (3 = telefone, 4 = e-mail). */
export const esconderLinha = (n) => `.author-details > .contact-row:nth-child(${n}){display:none!important}`;

/**
 * O que o site entrega sem nada salvo pelo painel: a cópia mais o que este
 * projeto mudou nela.
 *
 *   - o aplicativo de regras: a raiz dos endereços (para ele funcionar em
 *     /regras/), o botão da tela "não encontrada", o link de volta ao convite
 *     (na barra do topo e na linha das abas), a aba Admin e os créditos;
 *   - a página de regras: as regras de visual do link de volta e as linhas
 *     vazias dos créditos, escondidas;
 *   - a página do convite, que passa a ser o início do site: o botão leva a
 *     /regras/, a imagem é clicável e o <head> ganha as regras de visual.
 *
 * É montado aqui com trocas simples de texto, sem passar pelo conteudo.mjs.
 * Os arquivos que não aparecem aqui saem iguais aos da cópia.
 *
 * `comecaPeloConvite: false` é a opção "Começar o site pelo convite"
 * desligada: as páginas ficam onde estavam no site original. O aplicativo
 * volta a ter a raiz e o botão da cópia, não há link de volta, e a página do
 * convite é a da cópia, sem tirar nem pôr (null). A aba Admin e os créditos
 * continuam. `textoDoLink` é o texto do link de volta; vazio, ele não entra.
 */
function oQueOSiteEntrega({ comecaPeloConvite = true, textoDoLink = 'Voltar ao convite' } = {}) {
  const link = comecaPeloConvite && textoDoLink ? linkDeVolta(textoDoLink) : null;
  let js = COPIA.js;
  if (comecaPeloConvite) {
    js = trocarOUnico(js, /base:"",ssrPath:/, () => BASE_ENTREGUE);
    js = trocarOUnico(js, /const r=\(\)=>\{a\("\/"\)\}/, () => VOLTAR_ENTREGUE);
  }
  if (link) js = trocarOUnico(js, /R\.jsxs\("div",\{"data-loc":"client\/src\/pages\/Home\.tsx:285",className:"topbar-tools"/, (achado) => `${link},${achado}`);
  js = trocarOUnico(js, /children:"Regras da Polícia"\}\)(?=\]\}\))/, (achado) => achado + (link ? `,${link}` : '') + ABA_ADMIN);
  js = trocarOUnico(js, /(className:"author-name",children:)"[^"]*"/, (_, antes) => `${antes}"MURILO MENDES"`);
  js = trocarOUnico(js, /(className:"text-button",onClick:ne,children:\[)"[^"]*"/, (_, antes) => `${antes}"sgtmendes1997_29726"`);
  js = trocarOUnico(js, /(navigator\.clipboard\.writeText\()"[^"]*"/, (_, antes) => `${antes}"sgtmendes1997_29726"`);
  js = trocarOUnico(js, /href:"tel:[^"]*",children:"[^"]*"/, () => 'href:"tel:",children:""');
  js = trocarOUnico(js, /href:"mailto:[^"]*",children:"[^"]*"/, () => 'href:"mailto:",children:""');
  const noHead = `${link ? `${ESTILO_DO_LINK_DE_VOLTA}\n` : ''}<style id="ajustes-do-admin">\n${esconderLinha(3)}\n${esconderLinha(4)}\n</style>`;
  const index = trocarOUnico(COPIA.index, /<\/head>/, (achado) => noHead + achado);
  if (!comecaPeloConvite) return { js, index, convite: null };
  let convite = trocarOUnico(COPIA.convite, /<a class="button" href="\/">/, () => '<a class="button" href="/regras/">');
  convite = trocarOUnico(convite, /<img class="poster"/, (achado) => achado + CLIQUE_NA_IMAGEM);
  convite = trocarOUnico(convite, /<\/head>/, (achado) => CABECA_DO_INICIO + achado);
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
