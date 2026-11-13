#!/usr/bin/env node
/**
 * Grava o site em arquivos, para uma hospedagem que não roda o servidor
 * (o GitHub Pages, por exemplo).
 *
 * O que vai para os arquivos é o que o servidor entrega a um visitante: a
 * cópia do site, o que este projeto mudou nela e o que o administrador mudou
 * pelo painel (dados/conteudo.json e dados/imagens). Duas coisas são
 * diferentes, porque numa hospedagem de arquivos não há servidor:
 *
 *   - O painel não vai. As páginas saem sem a aba e sem a etiqueta "Admin",
 *     seja qual for a opção salva no painel. Para mudar o site, usa-se o
 *     painel onde o servidor roda, e exporta-se de novo.
 *   - Um endereço que o servidor responde mandando o navegador para outro
 *     ("/convite/" leva a "/") vira uma página pequena que faz o mesmo.
 *
 * O site pode ficar dentro de uma pasta do endereço, como no GitHub Pages
 * ("https://usuario.github.io/projeto/site/"). Nesse caso, diga a pasta: cada
 * endereço do próprio site passa a começar por ela.
 *
 *   node fronteira-sul/exportar.mjs --saida PASTA_DE_SAIDA
 *        [--pasta /projeto/site] [--endereco https://usuario.github.io]
 *
 *   --saida     onde gravar. Precisa não existir ou estar vazia.
 *   --pasta     a pasta do endereço em que o site vai ficar, sem a barra do
 *               fim. Sem ela, o site fica na raiz do endereço.
 *   --endereco  o começo do endereço em que o site vai ficar (sem a pasta).
 *               Vale nos links de compartilhamento (a prévia que o Discord e o
 *               WhatsApp mostram) no lugar do "Endereço do site" do painel.
 *
 * As mesmas variáveis do servidor valem aqui: SITE_DIR (a cópia do site) e
 * DADOS_DIR (o que foi salvo pelo painel).
 *
 * Nada é gravado se a cópia do site vier diferente do esperado, se o que foi
 * salvo pelo painel estiver ilegível ou se faltar uma imagem enviada: publicar
 * um site diferente do que se vê no painel seria pior do que não publicar.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { criarConteudo } from './admin/conteudo.mjs';
import { paginaQueLeva } from './admin/convite-no-inicio.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));

/** O que impede a exportação; a mensagem é mostrada a quem rodou o comando. */
export class ErroDeExportacao extends Error {}

/** Os endereços que não são o de um arquivo de site/: as páginas, onde quer que estejam. */
const PAGINAS = ['/', '/regras/', '/convite/'];
/** A tela "página não encontrada" do aplicativo: em hospedagens de arquivos, é este o arquivo que responde a um endereço que não existe. */
const NAO_ENCONTRADA = '404.html';

function arquivoComum(caminho) {
  try {
    return fs.statSync(caminho).isFile();
  } catch {
    return false;
  }
}

/** Todos os arquivos de uma pasta, com o caminho a partir dela (com "/"), em ordem. */
function listar(pasta, dentro = '') {
  const achados = [];
  for (const item of fs.readdirSync(path.join(pasta, dentro), { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const rel = dentro ? `${dentro}/${item.name}` : item.name;
    if (item.isDirectory()) achados.push(...listar(pasta, rel));
    else if (item.isFile()) achados.push(rel);
  }
  return achados;
}

/**
 * O que foi salvo pelo painel está inteiro? O servidor, quando acha um
 * arquivo ilegível ou uma imagem faltando, segue com o original e avisa no
 * terminal. Aqui isso publicaria, sem ninguém notar, um site diferente do que
 * o painel mostra: a exportação para.
 */
function conferirDados(dirDados) {
  const arquivo = path.join(dirDados, 'conteudo.json');
  let texto;
  try {
    texto = fs.readFileSync(arquivo, 'utf8');
  } catch (erro) {
    if (erro.code === 'ENOENT') return; // nada foi salvo pelo painel: vale o site como vem no projeto
    throw new ErroDeExportacao(`Não consegui ler ${arquivo} (${erro.message}).`);
  }
  let salvo;
  try {
    salvo = JSON.parse(texto);
  } catch (erro) {
    throw new ErroDeExportacao(`O arquivo ${arquivo} está ilegível (${erro.message}).`);
  }
  const imagens = salvo && typeof salvo === 'object' && salvo.imagens && typeof salvo.imagens === 'object' ? salvo.imagens : {};
  for (const [id, registro] of Object.entries(imagens)) {
    const nome = registro && typeof registro.arquivo === 'string' ? registro.arquivo : '';
    if (!nome || !arquivoComum(path.join(dirDados, 'imagens', path.basename(nome)))) {
      throw new ErroDeExportacao(`Falta a imagem "${id}" enviada pelo painel (${path.join(dirDados, 'imagens', nome || '?')}).`);
    }
  }
}

/**
 * Grava o site em `saida` e devolve o que foi gravado:
 * { saida, pasta, endereco, enderecos, arquivos: [{ caminho, bytes, origem }], avisos }.
 *
 * `origem` diz de onde veio cada arquivo: "cópia" (igual ao de site/),
 * "montado" (com as alterações do projeto e do painel), "imagem do painel" ou
 * "leva a <endereço>".
 */
export function exportar({ saida, pasta = '', endereco = '', raizSite = path.join(AQUI, 'site'), dirDados = path.join(AQUI, 'dados') } = {}) {
  if (!saida) throw new ErroDeExportacao('Diga onde gravar: --saida PASTA_DE_SAIDA');
  saida = path.resolve(saida);
  raizSite = path.resolve(raizSite);
  dirDados = path.resolve(dirDados);
  if (!arquivoComum(path.join(raizSite, 'index.html'))) throw new ErroDeExportacao(`Não encontrei ${path.join(raizSite, 'index.html')}. A pasta "site" precisa ficar ao lado deste arquivo.`);
  const dentro = (de, quem) => quem === de || quem.startsWith(de + path.sep);
  if (dentro(raizSite, saida) || dentro(dirDados, saida)) throw new ErroDeExportacao('A pasta de saída não pode ficar dentro de site/ nem de dados/.');
  if (fs.existsSync(saida) && (!fs.statSync(saida).isDirectory() || fs.readdirSync(saida).length)) {
    throw new ErroDeExportacao(`A pasta de saída precisa não existir ou estar vazia: ${saida}`);
  }

  const avisos = [];
  let conteudo;
  try {
    // (a pasta e o endereço são conferidos aqui, antes de qualquer leitura)
    conteudo = criarConteudo({ raizSite, dirDados, publicacao: { pasta, endereco }, aviso: (mensagem) => avisos.push(mensagem) });
  } catch (erro) {
    throw new ErroDeExportacao(erro.message);
  }
  conferirDados(dirDados);
  conteudo.carregar();
  // (ler os problemas também confere os arquivos de site/)
  const problemas = [...new Set([...conteudo.problemas, ...avisos])];
  if (problemas.length) {
    throw new ErroDeExportacao(['A cópia do site ou o que foi salvo pelo painel não está como o esperado:', ...problemas.map((p) => `  - ${p}`)].join('\n'));
  }

  /**
   * O que o servidor responde em um endereço do site (sem a pasta): os bytes,
   * { leva } quando ele manda o navegador para outro endereço, ou null. Segue
   * a mesma ordem do servidor: imagem trocada pelo painel, página que mudou de
   * endereço, arquivo de site/ com as alterações.
   */
  function oQueResponde(url) {
    const troca = conteudo.imagemPara(url);
    if (troca && arquivoComum(troca.arquivo)) return { bytes: fs.readFileSync(troca.arquivo), origem: 'imagem do painel' };
    const pagina = conteudo.paginaPara(url);
    if (pagina?.ir) return { leva: pagina.ir };
    const rel = pagina ? pagina.arquivo : url.endsWith('/') ? `${url.slice(1)}index.html` : url.slice(1);
    return doArquivo(rel);
  }
  function doArquivo(rel) {
    const arquivo = path.join(raizSite, rel);
    if (!arquivoComum(arquivo)) return null;
    const montado = conteudo.gerar(rel);
    return montado ? { bytes: montado.corpo, origem: 'montado' } : { bytes: fs.readFileSync(arquivo), origem: 'cópia' };
  }

  const gravar = new Map(); // caminho dentro da saída -> { bytes, origem }
  const acrescentar = (caminho, resposta) => {
    if (!resposta) return;
    const item = resposta.leva
      ? { bytes: Buffer.from(paginaQueLeva(pasta + resposta.leva), 'utf8'), origem: `leva a ${pasta}${resposta.leva}` }
      : { bytes: resposta.bytes, origem: resposta.origem };
    const antes = gravar.get(caminho);
    // "/" e "/index.html" são o mesmo arquivo na saída: o servidor tem que responder o mesmo nos dois.
    if (antes && !antes.bytes.equals(item.bytes)) throw new ErroDeExportacao(`Dois endereços dão conteúdos diferentes para ${caminho}.`);
    gravar.set(caminho, item);
  };
  for (const rel of listar(raizSite)) acrescentar(rel, oQueResponde(`/${rel}`));
  for (const url of PAGINAS) acrescentar(`${url.slice(1)}index.html`, oQueResponde(url));
  // O servidor responde a um endereço que não existe com a página do aplicativo, que mostra a tela "não encontrada".
  acrescentar(NAO_ENCONTRADA, doArquivo('index.html'));

  const arquivos = [];
  for (const caminho of [...gravar.keys()].sort()) {
    const { bytes, origem } = gravar.get(caminho);
    const destino = path.join(saida, ...caminho.split('/'));
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, bytes);
    arquivos.push({ caminho, bytes: bytes.length, origem });
  }

  const onde = conteudo.enderecos();
  const lembretes = [];
  const descricao = conteudo.descrever();
  const origem = (endereco ? new URL(endereco).origin : '') || descricao.opcoes.enderecoPublico;
  if (!origem) lembretes.push('Sem --endereco, os links de compartilhamento continuam apontando para o site original.');
  return { saida, pasta, endereco: origem, enderecos: { convite: pasta + onde.convite, regras: pasta + onde.regras }, arquivos, avisos: lembretes };
}

// ───────────────────────────── linha de comando ─────────────────────────────
function lerArgumentos(argumentos) {
  const opcoes = {};
  for (let i = 0; i < argumentos.length; i++) {
    const nome = argumentos[i];
    if (nome === '--ajuda' || nome === '-h' || nome === '--help') return { ajuda: true };
    if (!['--saida', '--pasta', '--endereco'].includes(nome)) throw new ErroDeExportacao(`Não conheço "${nome}". Veja: node fronteira-sul/exportar.mjs --ajuda`);
    if (i + 1 >= argumentos.length) throw new ErroDeExportacao(`Falta o valor de ${nome}.`);
    opcoes[nome.slice(2)] = argumentos[++i];
  }
  return opcoes;
}

const AJUDA = `Grava o site em arquivos, para uma hospedagem que não roda o servidor.

  node fronteira-sul/exportar.mjs --saida PASTA_DE_SAIDA [--pasta /projeto/site] [--endereco https://usuario.github.io]

  --saida     onde gravar (precisa não existir ou estar vazia)
  --pasta     a pasta do endereço em que o site vai ficar, sem a barra do fim; sem ela, a raiz
  --endereco  o começo do endereço em que o site vai ficar, sem a pasta

O site sai sem o painel: a aba e a etiqueta "Admin" não aparecem.`;

function principal() {
  let opcoes;
  try {
    opcoes = lerArgumentos(process.argv.slice(2));
    if (opcoes.ajuda) {
      console.log(AJUDA);
      return;
    }
    const feito = exportar({
      ...opcoes,
      ...(process.env.SITE_DIR ? { raizSite: process.env.SITE_DIR } : {}),
      ...(process.env.DADOS_DIR ? { dirDados: process.env.DADOS_DIR } : {}),
    });
    const total = feito.arquivos.reduce((soma, a) => soma + a.bytes, 0);
    console.log('Fronteira do Sul RP — site gravado em arquivos');
    for (const a of feito.arquivos) console.log(`  ${String(a.bytes).padStart(8)}  ${a.caminho}  (${a.origem})`);
    console.log(`  ${feito.arquivos.length} arquivos, ${total} bytes, em ${feito.saida}`);
    console.log(`  Convite : ${feito.endereco}${feito.enderecos.convite}`);
    console.log(`  Regras  : ${feito.endereco}${feito.enderecos.regras}`);
    console.log('  Painel  : não vai junto (as páginas saem sem a entrada "Admin")');
    for (const aviso of feito.avisos) console.log(`  Atenção : ${aviso}`);
  } catch (erro) {
    if (!(erro instanceof ErroDeExportacao)) throw erro;
    console.error(erro.message);
    console.error('Nada foi gravado.');
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) principal();
