// Apoio comum aos testes: caminhos, pastas temporárias e contagem.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

/** A pasta fronteira-sul/. */
export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SITE = path.join(RAIZ, 'site');

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
