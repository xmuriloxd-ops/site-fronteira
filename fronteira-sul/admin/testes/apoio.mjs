// Apoio comum aos testes: caminhos, pastas temporárias, contagem e o que uma instalação nova deve entregar.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { blocoDoConvite, cabecaDoConvite } from '../convite-no-inicio.mjs';
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

/** O convite do início da página de regras, com os textos da página /convite/ da cópia. */
export const BLOCO_DO_CONVITE = blocoDoConvite({
  imagem: { endereco: IMAGEM_DO_CONVITE, descricao: lerOUnico(COPIA.convite, /<img class="poster" src="[^"]*" alt="([^"]*)"/), largura: 1200, altura: 675 },
  sobretitulo: lerOUnico(COPIA.convite, /<span class="eyebrow">([^<]*)<\/span>/),
  titulo: lerOUnico(COPIA.convite, /<h1 id="title">([^<]*)<\/h1>/),
  texto: lerOUnico(COPIA.convite, /<p>([^<]*)<\/p>/),
  botao: lerOUnico(COPIA.convite, /<a class="button" href="[^"]*">([^<]*)<\/a>/),
  link: lerOUnico(COPIA.convite, /<a class="button" href="([^"]*)">/),
});

/** O que entra no <head> da página de regras junto com o convite (o logo da cópia tem 1200 × 676). */
export const CABECA_DO_CONVITE = cabecaDoConvite(IMAGEM_DO_CONVITE, { largura: 1200, altura: 676 });

/** A regra que esconde uma linha dos créditos (3 = telefone, 4 = e-mail). */
export const esconderLinha = (n) => `.author-details > .contact-row:nth-child(${n}){display:none!important}`;

/**
 * O que uma instalação nova entrega: a cópia mais o que este projeto mudou
 * nela — o convite no início da página de regras, os créditos e a aba Admin.
 * Na página /convite/, só muda o destino do botão: ele passa a abrir a página
 * de regras já depois do convite. É montado aqui com trocas simples de texto,
 * sem passar pelo conteudo.mjs. Os arquivos que não aparecem aqui saem iguais
 * aos da cópia.
 */
export const PADRAO = (() => {
  let js = COPIA.js;
  js = trocarOUnico(js, /className:"site-shell",children:\[/, (achado) => achado + BLOCO_DO_CONVITE);
  js = trocarOUnico(js, /children:"Regras da Polícia"\}\)(?=\]\}\))/, (achado) => achado + ABA_ADMIN);
  js = trocarOUnico(js, /(className:"author-name",children:)"[^"]*"/, (_, antes) => `${antes}"MURILO MENDES"`);
  js = trocarOUnico(js, /(className:"text-button",onClick:ne,children:\[)"[^"]*"/, (_, antes) => `${antes}"sgtmendes1997_29726"`);
  js = trocarOUnico(js, /(navigator\.clipboard\.writeText\()"[^"]*"/, (_, antes) => `${antes}"sgtmendes1997_29726"`);
  js = trocarOUnico(js, /href:"tel:[^"]*",children:"[^"]*"/, () => 'href:"tel:",children:""');
  js = trocarOUnico(js, /href:"mailto:[^"]*",children:"[^"]*"/, () => 'href:"mailto:",children:""');
  const noHead = `${CABECA_DO_CONVITE}\n<style id="ajustes-do-admin">\n${esconderLinha(3)}\n${esconderLinha(4)}\n</style>`;
  const index = trocarOUnico(COPIA.index, /<\/head>/, (achado) => noHead + achado);
  const convite = trocarOUnico(COPIA.convite, /<a class="button" href="\/">/, () => '<a class="button" href="/#inicio">');
  return { js, index, convite };
})();

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
