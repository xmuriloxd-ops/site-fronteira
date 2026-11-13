#!/usr/bin/env node
/**
 * Confere se o site que está no ar é, byte a byte, o que o exportar.mjs gravou.
 *
 *   node fronteira-sul/conferir-publicado.mjs --arquivos PASTA_GRAVADA
 *        --endereco https://usuario.github.io/projeto/site
 *        [--tentativas 12] [--espera 10]
 *
 *   --arquivos    a pasta em que o exportar.mjs gravou o site
 *   --endereco    o endereço em que essa pasta foi publicada (com a pasta do
 *                 endereço, se houver)
 *   --tentativas  quantas vezes conferir antes de desistir (12). Logo depois
 *                 de uma publicação, a hospedagem pode levar um tempo para
 *                 entregar os arquivos novos.
 *   --espera      segundos entre uma tentativa e outra (10)
 *
 * Cada arquivo é pedido no endereço em que o visitante o encontra: uma página
 * "index.html" é pedida pelo endereço da pasta dela ("/regras/"), os outros
 * pelo próprio nome. A resposta precisa ser 200 e ter os mesmos bytes.
 *
 * Antes disso, confere se os arquivos foram gravados para esse endereço (ver
 * gravadoParaOutroEndereco): com a pasta errada, todos os arquivos estariam
 * no ar e mesmo assim as páginas não os achariam.
 *
 * Sai com 0 quando tudo confere, e com 1 quando não.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export class ErroDeConferencia extends Error {}

function listar(pasta, dentro = '') {
  const achados = [];
  for (const item of fs.readdirSync(path.join(pasta, dentro), { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const rel = dentro ? `${dentro}/${item.name}` : item.name;
    if (item.isDirectory()) achados.push(...listar(pasta, rel));
    else if (item.isFile()) achados.push(rel);
  }
  return achados;
}

/** Os arquivos gravados, um por linha de caminho (com "/"). Uma pasta sem nenhum é engano de quem chamou. */
function listarGravados(pasta) {
  const lista = listar(pasta);
  if (!lista.length) throw new ErroDeConferencia(`Não há arquivos em ${pasta}.`);
  return lista;
}

/** O endereço em que o visitante encontra um arquivo gravado. */
export const enderecoDoArquivo = (caminho) => caminho.replace(/(^|\/)index\.html$/, '$1');

/** Um endereço do próprio site dentro de uma página (href ou src que começa com uma barra só), sem o que vem depois de "?" ou "#". */
const ENDERECO_DO_SITE = /\s(?:href|src)="(\/(?!\/)[^"?#]*)/g;

/**
 * Os arquivos foram gravados para outro endereço? O exportar.mjs escreve a
 * pasta do endereço (--pasta) na frente de cada endereço do próprio site. Se
 * ela não for a pasta em que o site foi publicado, as páginas pedem os
 * arquivos no lugar errado.
 *
 * Devolve '' quando os arquivos servem para `endereco`. Quando não, devolve o
 * que foi achado, em uma frase:
 *
 *   - uma página pede um endereço que fica fora de `endereco`; ou
 *   - as páginas não pedem nenhum dos arquivos gravados (os endereços delas
 *     ficam dentro de `endereco`, mas em uma pasta mais funda).
 */
export function gravadoParaOutroEndereco({ arquivos, endereco }) {
  const pasta = path.resolve(arquivos);
  const lista = listarGravados(pasta);
  /** A pasta do endereço, com a barra do fim: "/" quando o site fica na raiz. */
  const dentro = `${new URL(endereco).pathname.replace(/\/+$/, '')}/`;
  const gravados = new Set(lista.map(enderecoDoArquivo));
  let algumFoiGravado = false;
  for (const caminho of lista.filter((nome) => nome.endsWith('.html'))) {
    const texto = fs.readFileSync(path.join(pasta, caminho), 'utf8');
    for (const [, pedido] of texto.matchAll(ENDERECO_DO_SITE)) {
      if (!pedido.startsWith(dentro)) return `${caminho} pede "${pedido}", que fica fora desse endereço`;
      if (gravados.has(pedido.slice(dentro.length))) algumFoiGravado = true;
    }
  }
  return algumFoiGravado ? '' : 'as páginas não pedem nenhum dos arquivos gravados';
}

/**
 * Pede cada arquivo e compara. Devolve a lista de diferenças (vazia quando
 * tudo confere): [{ caminho, endereco, motivo }].
 */
export async function conferir({ arquivos, endereco, marca = String(Date.now()) }) {
  const pasta = path.resolve(arquivos);
  const base = endereco.replace(/\/+$/, '');
  const diferencas = [];
  const lista = listarGravados(pasta);
  for (const caminho of lista) {
    // (o que vem depois do "?" não muda a resposta; serve para ninguém no caminho entregar uma cópia guardada)
    const url = `${base}/${enderecoDoArquivo(caminho)}`;
    const esperado = fs.readFileSync(path.join(pasta, caminho));
    let motivo = '';
    try {
      const r = await fetch(`${url}?conferencia=${marca}`, { cache: 'no-store', redirect: 'follow' });
      if (r.status !== 200) motivo = `respondeu ${r.status}`;
      else {
        const recebido = Buffer.from(await r.arrayBuffer());
        if (!recebido.equals(esperado)) motivo = `conteúdo diferente (${recebido.length} bytes no ar, ${esperado.length} gravados)`;
      }
    } catch (erro) {
      motivo = `não respondeu (${erro.cause?.code || erro.message})`;
    }
    if (motivo) diferencas.push({ caminho, endereco: url, motivo });
  }
  return { total: lista.length, diferencas };
}

/** Confere até dar certo ou acabarem as tentativas. `dizer` recebe uma linha por tentativa que falhou. */
export async function conferirComPaciencia({ arquivos, endereco, tentativas = 12, espera = 10, dizer = () => {} }) {
  let resultado;
  for (let n = 1; n <= tentativas; n++) {
    resultado = await conferir({ arquivos, endereco, marca: `${Date.now()}-${n}` });
    if (!resultado.diferencas.length) return { ...resultado, tentativas: n };
    if (n < tentativas) {
      dizer(`Tentativa ${n} de ${tentativas}: ${resultado.diferencas.length} de ${resultado.total} ainda não conferem. Esperando ${espera} s.`);
      await new Promise((r) => setTimeout(r, espera * 1000));
    }
  }
  return { ...resultado, tentativas };
}

// ───────────────────────────── linha de comando ─────────────────────────────
function lerArgumentos(argumentos) {
  const opcoes = {};
  for (let i = 0; i < argumentos.length; i++) {
    const nome = argumentos[i];
    if (!['--arquivos', '--endereco', '--tentativas', '--espera'].includes(nome)) throw new ErroDeConferencia(`Não conheço "${nome}".`);
    if (i + 1 >= argumentos.length) throw new ErroDeConferencia(`Falta o valor de ${nome}.`);
    opcoes[nome.slice(2)] = argumentos[++i];
  }
  if (!opcoes.arquivos || !opcoes.endereco) throw new ErroDeConferencia('Uso: node fronteira-sul/conferir-publicado.mjs --arquivos PASTA_GRAVADA --endereco https://usuario.github.io/projeto/site');
  if (!/^https?:\/\/[^/\s]+/.test(opcoes.endereco)) throw new ErroDeConferencia(`Endereço inválido: "${opcoes.endereco}".`);
  for (const nome of ['tentativas', 'espera']) {
    if (opcoes[nome] === undefined) continue;
    const numero = Number(opcoes[nome]);
    if (!Number.isFinite(numero) || numero < (nome === 'tentativas' ? 1 : 0)) throw new ErroDeConferencia(`Valor inválido para --${nome}: "${opcoes[nome]}".`);
    opcoes[nome] = numero;
  }
  return opcoes;
}

async function principal() {
  try {
    const opcoes = lerArgumentos(process.argv.slice(2));
    const engano = gravadoParaOutroEndereco(opcoes);
    if (engano) {
      throw new ErroDeConferencia(
        `Os arquivos em ${opcoes.arquivos} não foram gravados para ${opcoes.endereco}: ${engano}. Grave de novo com o exportar.mjs, dizendo em --pasta a pasta desse endereço.`,
      );
    }
    const r = await conferirComPaciencia({ ...opcoes, dizer: (linha) => console.log(linha) });
    if (r.diferencas.length) {
      console.error(`O site em ${opcoes.endereco} não é o que foi gravado: ${r.diferencas.length} de ${r.total} arquivos diferem.`);
      for (const d of r.diferencas) console.error(`  ${d.endereco}: ${d.motivo}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Confere: os ${r.total} arquivos em ${opcoes.endereco} são os que foram gravados${r.tentativas > 1 ? ` (na tentativa ${r.tentativas})` : ''}.`);
  } catch (erro) {
    if (!(erro instanceof ErroDeConferencia)) throw erro;
    console.error(erro.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await principal();
