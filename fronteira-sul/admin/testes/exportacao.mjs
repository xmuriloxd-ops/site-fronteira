// Testa o site gravado em arquivos (../../exportar.mjs), que é o que vai para uma hospedagem que não roda o servidor.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { conferir, conferirComPaciencia, enderecoDoArquivo, gravadoParaOutroEndereco } from '../../conferir-publicado.mjs';
import { ErroDeExportacao, exportar } from '../../exportar.mjs';
import { criarConteudo } from '../conteudo.mjs';
import { ORIGEM_ORIGINAL } from '../mapa.mjs';
import {
  COPIA,
  CREDITOS_DA_COPIA,
  RAIZ,
  SEM_A_ENTRADA_DO_ADMIN,
  SEM_COMECAR_PELO_CONVITE_NEM_ADMIN,
  SITE,
  copiaDoSite,
  iniciar,
  naPasta,
  ok,
  paginaQueLeva,
  parar,
  pastaTemporaria,
  pngSimples,
  portaLivre,
  resumo,
  versaoDaImagem,
  versaoDe,
} from './apoio.mjs';

/** A pasta em que o GitHub Pages deste projeto publica o site, e um endereço de exemplo. */
const PASTA = '/projetos-cidades2/fronteira-sul';
const ENDERECO = 'https://usuario.github.io';

/** Os arquivos que saem de uma instalação: os onze da cópia, a página de regras no endereço novo e a tela "não encontrada". */
const ARQUIVOS_GRAVADOS = [
  '404.html',
  '__manus/pwa/manifest.webmanifest',
  'assets/index-DMP8NyHf.css',
  'assets/index-FbaU4KfD.js',
  'convite/index.html',
  'favicon.ico',
  'fronteira-sul-convite-preview.jpg',
  'fronteira-sul-logo.webp',
  'index.html',
  'manus-storage/fronteira-sul-logo_1b1b4c2d.webp',
  'regras/index.html',
  'robots.txt',
  'sitemap.xml',
];
/** Os que nada muda numa instalação nova: saem iguais aos da cópia, byte a byte. */
const IGUAIS_AOS_DA_COPIA = ['assets/index-DMP8NyHf.css', 'favicon.ico', 'fronteira-sul-convite-preview.jpg', 'fronteira-sul-logo.webp', 'manus-storage/fronteira-sul-logo_1b1b4c2d.webp', 'robots.txt', 'sitemap.xml'];

/** Uma pasta de saída que ainda não existe. */
const saidaNova = () => path.join(pastaTemporaria(), 'saida');

/** Todos os arquivos de uma pasta: caminho (com "/") -> bytes. */
function arvore(pasta, dentro = '') {
  const achados = {};
  for (const item of fs.readdirSync(path.join(pasta, dentro), { withFileTypes: true })) {
    const rel = dentro ? `${dentro}/${item.name}` : item.name;
    if (item.isDirectory()) Object.assign(achados, arvore(pasta, rel));
    else achados[rel] = fs.readFileSync(path.join(pasta, rel));
  }
  return achados;
}
const texto = (arquivos, caminho) => arquivos[caminho].toString('utf8');
const vezes = (onde, trecho) => onde.split(trecho).length - 1;

/** Grava o site e devolve os arquivos gravados. */
function gravar(opcoes) {
  const saida = saidaNova();
  const feito = exportar({ saida, raizSite: SITE, ...opcoes });
  return { feito, arquivos: arvore(saida), saida };
}

/** Salva pelo mesmo caminho do painel. */
function painel(dados, raizSite = SITE) {
  const c = criarConteudo({ raizSite, dirDados: dados });
  c.carregar();
  return c;
}

/** O aplicativo gravado precisa continuar sendo JavaScript válido. */
const rascunho = path.join(pastaTemporaria(), 'aplicativo.mjs');
function conferirSintaxe(js) {
  fs.writeFileSync(rascunho, js);
  execFileSync(process.execPath, ['--check', rascunho], { stdio: 'pipe' });
}

/** A raiz dos endereços que o aplicativo usa quando a página está em `caminho`. */
function raizDoAplicativo(js, caminho) {
  const inicio = js.indexOf('parser:fA,base:') + 'parser:fA,base:'.length;
  const fim = js.indexOf(',ssrPath:', inicio);
  assert.ok(inicio > 20 && fim > inicio, 'não achei a raiz dos endereços no aplicativo');
  return vm.runInNewContext(`(${js.slice(inicio, fim)})`, { location: { pathname: caminho } });
}

/** Os endereços do próprio site que uma página aponta (href e src que começam com uma barra só). */
const enderecosDoSite = (html) => [...html.matchAll(/\s(?:href|src)="(\/(?!\/)[^"]*)"/g)].map((m) => m[1]);

/**
 * Cada arquivo gravado é, byte a byte, o que o servidor responde no endereço
 * dele. Onde o servidor manda o navegador para outro endereço, o arquivo é a
 * página que leva para lá.
 */
async function igualAoServidor(base, arquivos) {
  for (const [caminho, bytes] of Object.entries(arquivos)) {
    const endereco = caminho === '404.html' ? '/404' : `/${caminho.replace(/(^|\/)index\.html$/, '$1')}`;
    const r = await fetch(base + endereco, { redirect: 'manual' });
    if (r.status === 302) {
      assert.equal(bytes.toString('utf8'), paginaQueLeva(r.headers.get('location')), `${caminho}: o servidor manda para ${r.headers.get('location')}`);
      continue;
    }
    assert.equal(r.status, caminho === '404.html' ? 404 : 200, endereco);
    assert.ok(Buffer.from(await r.arrayBuffer()).equals(bytes), `${caminho} é diferente do que o servidor entrega em ${endereco}`);
  }
}

/** Sobe o servidor com uma pasta de dados, roda `fazer(base)` e desce. */
async function comOServidor(dados, fazer) {
  const porta = await portaLivre();
  const servidor = await iniciar(porta, dados);
  try {
    await fazer(`http://127.0.0.1:${porta}`);
  } finally {
    await parar(servidor);
  }
}

function recusa(fazer, trecho) {
  try {
    fazer();
  } catch (erro) {
    assert.ok(erro instanceof ErroDeExportacao, String(erro?.stack || erro));
    assert.ok(erro.message.includes(trecho), erro.message);
    return;
  }
  assert.fail(`esperava a recusa: ${trecho}`);
}

// ───── 1. instalação nova, na raiz do endereço
{
  const dados = pastaTemporaria();
  const { feito, arquivos } = gravar({ dirDados: dados });
  assert.deepEqual(Object.keys(arquivos).sort(), ARQUIVOS_GRAVADOS);
  // As páginas e o aplicativo, por extenso (ver apoio.mjs): o que o site entrega, sem a entrada do painel.
  assert.equal(texto(arquivos, 'index.html'), SEM_A_ENTRADA_DO_ADMIN.convite, 'o começo do site é o convite');
  assert.equal(texto(arquivos, 'regras/index.html'), SEM_A_ENTRADA_DO_ADMIN.index);
  assert.equal(texto(arquivos, 'assets/index-FbaU4KfD.js'), SEM_A_ENTRADA_DO_ADMIN.js);
  assert.equal(texto(arquivos, '404.html'), SEM_A_ENTRADA_DO_ADMIN.index, 'a tela "não encontrada" é a página do aplicativo');
  assert.equal(texto(arquivos, 'convite/index.html'), paginaQueLeva('/'), 'o endereço antigo do convite leva ao começo do site');
  assert.equal(texto(arquivos, '__manus/pwa/manifest.webmanifest'), COPIA.manifesto);
  for (const rel of IGUAIS_AOS_DA_COPIA) assert.ok(arquivos[rel].equals(fs.readFileSync(path.join(SITE, rel))), rel);
  // Sem a entrada do painel, com a opção do painel ligada (é como ela vem).
  for (const caminho of ['index.html', 'regras/index.html', '404.html', 'assets/index-FbaU4KfD.js']) {
    assert.ok(!texto(arquivos, caminho).includes('/admin/'), `${caminho} não aponta para o painel`);
    assert.ok(!texto(arquivos, caminho).includes('admin-no-canto'), caminho);
  }
  // Nada dos créditos que vieram na cópia.
  for (const [caminho, bytes] of Object.entries(arquivos)) {
    for (const [campo, valor] of Object.entries(CREDITOS_DA_COPIA)) assert.ok(!bytes.includes(Buffer.from(valor)), `${caminho} traz ${campo} da cópia`);
  }
  // O que a exportação conta do que fez.
  assert.deepEqual(feito.arquivos.map((a) => a.caminho), ARQUIVOS_GRAVADOS);
  for (const a of feito.arquivos) assert.equal(a.bytes, arquivos[a.caminho].length, a.caminho);
  const origem = Object.fromEntries(feito.arquivos.map((a) => [a.caminho, a.origem]));
  assert.equal(origem['index.html'], 'montado');
  assert.equal(origem['assets/index-FbaU4KfD.js'], 'montado');
  assert.equal(origem['convite/index.html'], 'leva a /');
  assert.equal(origem['favicon.ico'], 'cópia');
  assert.deepEqual(feito.enderecos, { convite: '/', regras: '/regras/' });
  // Ninguém disse onde o site vai ficar: os links de compartilhamento ficam como na cópia, e a exportação lembra disso.
  assert.deepEqual(feito.avisos, ['Sem --endereco, os links de compartilhamento continuam apontando para o site original.']);
  assert.equal(feito.endereco, '');
  // Exportar só lê: nada aparece na pasta de dados.
  assert.deepEqual(fs.readdirSync(dados), []);
  ok('instalação nova: os onze arquivos da cópia, as regras em /regras/, a tela "não encontrada" e o endereço antigo do convite; sem a entrada do painel');

  // O servidor, com a entrada do Admin desligada no painel, entrega exatamente estes bytes.
  const dadosSemAdmin = pastaTemporaria();
  painel(dadosSemAdmin).salvar({ versao: 0, opcoes: { abaAdmin: false } });
  await comOServidor(dadosSemAdmin, (base) => igualAoServidor(base, arquivos));
  // E a opção do painel não muda o que é gravado: com ela desligada, saem os mesmos arquivos.
  assert.deepEqual(gravar({ dirDados: dadosSemAdmin }).arquivos, arquivos);
  ok('cada arquivo gravado é, byte a byte, o que o servidor entrega no mesmo endereço com a entrada do Admin desligada');
}

// ───── 2. dentro de uma pasta do endereço
{
  const { feito, arquivos } = gravar({ dirDados: pastaTemporaria(), pasta: PASTA });
  const esperado = naPasta(SEM_A_ENTRADA_DO_ADMIN, PASTA);
  assert.deepEqual(Object.keys(arquivos).sort(), ARQUIVOS_GRAVADOS);
  const js = texto(arquivos, 'assets/index-FbaU4KfD.js');
  assert.equal(js, esperado.js);
  assert.equal(texto(arquivos, 'index.html'), esperado.convite);
  assert.equal(texto(arquivos, 'regras/index.html'), esperado.index);
  assert.equal(texto(arquivos, '404.html'), esperado.index);
  assert.equal(texto(arquivos, '__manus/pwa/manifest.webmanifest'), esperado.manifesto);
  assert.equal(texto(arquivos, 'convite/index.html'), paginaQueLeva(`${PASTA}/`));
  for (const rel of IGUAIS_AOS_DA_COPIA) assert.ok(arquivos[rel].equals(fs.readFileSync(path.join(SITE, rel))), rel);
  assert.deepEqual(feito.enderecos, { convite: `${PASTA}/`, regras: `${PASTA}/regras/` });
  assert.equal(feito.pasta, PASTA);
  conferirSintaxe(js);

  // Tudo o que as duas páginas pedem ao próprio site fica dentro da pasta, e existe entre os arquivos gravados.
  for (const caminho of ['index.html', 'regras/index.html']) {
    const pedidos = enderecosDoSite(texto(arquivos, caminho));
    assert.ok(pedidos.length >= 4, caminho);
    for (const endereco of pedidos) {
      assert.ok(endereco.startsWith(`${PASTA}/`), `${caminho} aponta para fora da pasta: ${endereco}`);
      const rel = endereco.slice(PASTA.length + 1).replace(/\?.*$/, '');
      // (o endereço da plataforma original nunca existiu: no site original ele só responde erro)
      if (rel === 'api/platform/config.js') continue;
      assert.ok(Object.hasOwn(arquivos, rel.endsWith('/') || rel === '' ? `${rel}index.html` : rel), `${caminho} pede ${endereco}, que não foi gravado`);
    }
  }
  assert.deepEqual(enderecosDoSite(texto(arquivos, 'index.html')), [
    `${PASTA}/__manus/pwa/manifest.webmanifest`,
    `${PASTA}/favicon.ico`,
    `${PASTA}/fronteira-sul-convite-preview.jpg`,
    `${PASTA}/regras/`,
  ]);
  assert.deepEqual(enderecosDoSite(texto(arquivos, 'regras/index.html')), [
    `${PASTA}/assets/index-FbaU4KfD.js?v=${versaoDe(js)}`,
    `${PASTA}/assets/index-DMP8NyHf.css`,
    `${PASTA}/__manus/pwa/manifest.webmanifest`,
    `${PASTA}/favicon.ico`,
  ]);
  ok('dentro de uma pasta: cada endereço do próprio site começa por ela, nas páginas, no aplicativo e na lista de ícones; o resto não muda');

  // Onde o aplicativo procura as telas, conforme o endereço em que a página está.
  assert.equal(raizDoAplicativo(js, `${PASTA}/regras/`), `${PASTA}/regras`);
  assert.equal(raizDoAplicativo(js, `${PASTA}/regras`), `${PASTA}/regras`);
  assert.equal(raizDoAplicativo(js, `${PASTA}/REGRAS/`), `${PASTA}/regras`, 'maiúsculas não importam');
  for (const fora of [`${PASTA}/404`, `${PASTA}/404.html`, `${PASTA}/`, `${PASTA}/regras-antigas/`, '/regras/']) {
    assert.equal(raizDoAplicativo(js, fora), PASTA, `em ${fora}, a raiz é a pasta: a tela "não encontrada" fica em ${PASTA}/404`);
  }
  assert.equal(vezes(js, `,tg="${PASTA}/404";function `), 1, 'a tela "não encontrada" recarrega dentro da pasta');
  assert.equal(vezes(js, `location.assign("${PASTA}/")`), 1, 'o botão dela abre o começo do site');
  // Um ponto no nome da pasta vale por um ponto, e não por uma letra qualquer.
  const comPonto = texto(gravar({ dirDados: pastaTemporaria(), pasta: '/v1.2/site' }).arquivos, 'assets/index-FbaU4KfD.js');
  assert.equal(comPonto, naPasta(SEM_A_ENTRADA_DO_ADMIN, '/v1.2/site').js);
  assert.equal(raizDoAplicativo(comPonto, '/v1.2/site/regras/'), '/v1.2/site/regras');
  assert.equal(raizDoAplicativo(comPonto, '/v1x2/site/regras/'), '/v1.2/site');
  conferirSintaxe(comPonto);
  ok('o aplicativo procura as regras em <pasta>/regras/ e a tela "não encontrada" em <pasta>/404, e continua sendo JavaScript válido');
}

// ───── 3. o endereço em que o site vai ficar
{
  // Sem o endereço, os links de compartilhamento continuam como na cópia, e a exportação avisa.
  const semEndereco = gravar({ dirDados: pastaTemporaria(), pasta: PASTA });
  assert.equal(vezes(texto(semEndereco.arquivos, 'index.html'), ORIGEM_ORIGINAL), 5);
  assert.deepEqual(semEndereco.feito.avisos, ['Sem --endereco, os links de compartilhamento continuam apontando para o site original.']);

  const { feito, arquivos } = gravar({ dirDados: pastaTemporaria(), pasta: PASTA, endereco: `${ENDERECO}/` });
  assert.equal(feito.endereco, ENDERECO, 'a barra do fim não conta');
  assert.deepEqual(feito.avisos, []);
  const naPastaSemEndereco = naPasta(SEM_A_ENTRADA_DO_ADMIN, PASTA);
  const trocar = (onde, antes, depois, quantas) => {
    assert.equal(vezes(onde, antes), quantas, antes);
    return onde.split(antes).join(depois);
  };
  // No convite: o endereço da própria página (duas vezes) e o da imagem (três).
  let convite = trocar(naPastaSemEndereco.convite, `${ORIGEM_ORIGINAL}/convite/"`, `${ENDERECO}${PASTA}/"`, 2);
  convite = trocar(convite, `${ORIGEM_ORIGINAL}/fronteira-sul-convite-preview.jpg`, `${ENDERECO}${PASTA}/fronteira-sul-convite-preview.jpg`, 3);
  assert.equal(texto(arquivos, 'index.html'), convite);
  // Na página de regras, o mesmo: ela fica em <pasta>/regras/.
  let index = trocar(naPastaSemEndereco.index, `${ORIGEM_ORIGINAL}/"`, `${ENDERECO}${PASTA}/regras/"`, 2);
  index = trocar(index, `${ORIGEM_ORIGINAL}/fronteira-sul-convite-preview.jpg`, `${ENDERECO}${PASTA}/fronteira-sul-convite-preview.jpg`, 3);
  assert.equal(texto(arquivos, 'regras/index.html'), index);
  assert.ok(!Object.values(arquivos).some((bytes) => bytes.includes(Buffer.from(ORIGEM_ORIGINAL))), 'nenhum arquivo gravado aponta para o site original');
  assert.equal(texto(arquivos, 'robots.txt'), `User-Agent: *\nAllow: /\nDisallow: /api/*\nSitemap: ${ENDERECO}${PASTA}/sitemap.xml`);
  assert.equal(
    texto(arquivos, 'sitemap.xml'),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '<url>',
      `<loc>${ENDERECO}${PASTA}/</loc>`,
      /<lastmod>[^<]+<\/lastmod>/.exec(COPIA.sitemap)[0],
      '</url>',
      '<url>',
      `<loc>${ENDERECO}${PASTA}/regras/</loc>`,
      '</url>',
      '</urlset>',
    ].join('\n'),
  );
  // O aplicativo e a lista de ícones não levam o endereço: não dependem dele.
  assert.equal(texto(arquivos, 'assets/index-FbaU4KfD.js'), naPastaSemEndereco.js);
  assert.equal(texto(arquivos, '__manus/pwa/manifest.webmanifest'), naPastaSemEndereco.manifesto);
  ok('com o endereço: os links de compartilhamento e o mapa do site apontam para o convite e as regras dentro da pasta, e nada aponta para o site original');

  // O endereço da publicação vale no lugar do "Endereço do site" do painel; sem ele, vale o do painel, mais a pasta.
  const dados = pastaTemporaria();
  painel(dados).salvar({ versao: 0, opcoes: { enderecoPublico: 'https://do-painel.example' } });
  const comODoPainel = gravar({ dirDados: dados, pasta: PASTA });
  assert.deepEqual(comODoPainel.feito.avisos, []);
  assert.ok(texto(comODoPainel.arquivos, 'index.html').includes(`<link rel="canonical" href="https://do-painel.example${PASTA}/" />`));
  const comODaPublicacao = gravar({ dirDados: dados, pasta: PASTA, endereco: ENDERECO });
  assert.equal(texto(comODaPublicacao.arquivos, 'index.html'), convite);
  assert.ok(!Object.values(comODaPublicacao.arquivos).some((bytes) => bytes.includes(Buffer.from('do-painel.example'))));
  ok('o endereço da publicação vale no lugar do "Endereço do site" do painel; sem ele, vale o do painel, mais a pasta');
}

// ───── 4. com o que foi salvo pelo painel: textos, opções e imagens
{
  const dados = pastaTemporaria();
  const c = painel(dados);
  c.salvar({
    versao: 0,
    textos: { 'convite.titulo': 'A cidade abre sexta & <sábado>', 'regras.abertura.titulo1': 'Jogo "limpo".', 'regras.voltar.texto': 'Voltar' },
    opcoes: { abaAdmin: false, removerManus: true, cssExtra: 'h1{letter-spacing:0}', enderecoPublico: ENDERECO },
  });
  const imagemDoConvite = pngSimples(40, 30, [200, 30, 30]);
  const logo = pngSimples(20, 20, [30, 200, 30]);
  c.trocarImagem('convite', { corpo: imagemDoConvite, tipo: 'image/png', ext: 'png', largura: 40, altura: 30 });
  c.trocarImagem('logo', { corpo: logo, tipo: 'image/png', ext: 'png', largura: 20, altura: 20 });
  const vConvite = versaoDaImagem(imagemDoConvite);
  const vLogo = versaoDaImagem(logo);

  // Na raiz: outra vez, byte a byte o que o servidor entrega (ele está com a entrada do Admin desligada).
  const naRaiz = gravar({ dirDados: dados });
  await comOServidor(dados, (base) => igualAoServidor(base, naRaiz.arquivos));
  assert.ok(naRaiz.arquivos['fronteira-sul-convite-preview.jpg'].equals(imagemDoConvite), 'a imagem enviada sai no endereço da imagem original');
  for (const rel of ['fronteira-sul-logo.webp', 'manus-storage/fronteira-sul-logo_1b1b4c2d.webp', 'favicon.ico']) assert.ok(naRaiz.arquivos[rel].equals(logo), rel);
  assert.equal(Object.fromEntries(naRaiz.feito.arquivos.map((a) => [a.caminho, a.origem]))['favicon.ico'], 'imagem do painel');
  ok('com textos, opções e imagens salvos pelo painel, os arquivos gravados continuam sendo, byte a byte, o que o servidor entrega');

  // Na pasta: os mesmos arquivos, com a pasta na frente dos endereços (e o endereço completo com a pasta).
  const { arquivos } = gravar({ dirDados: dados, pasta: PASTA });
  const raiz = { js: texto(naRaiz.arquivos, 'assets/index-FbaU4KfD.js'), index: texto(naRaiz.arquivos, 'regras/index.html'), convite: texto(naRaiz.arquivos, 'index.html'), manifesto: texto(naRaiz.arquivos, '__manus/pwa/manifest.webmanifest') };
  const esperado = naPasta(raiz, PASTA);
  const comAPastaNoEndereco = (html) => html.split(`${ENDERECO}/`).join(`${ENDERECO}${PASTA}/`);
  assert.equal(texto(arquivos, 'assets/index-FbaU4KfD.js'), esperado.js);
  assert.equal(texto(arquivos, 'regras/index.html'), comAPastaNoEndereco(esperado.index));
  assert.equal(texto(arquivos, 'index.html'), comAPastaNoEndereco(esperado.convite));
  assert.equal(texto(arquivos, '__manus/pwa/manifest.webmanifest'), esperado.manifesto);
  for (const rel of ['fronteira-sul-convite-preview.jpg', 'fronteira-sul-logo.webp', 'manus-storage/fronteira-sul-logo_1b1b4c2d.webp', 'favicon.ico', 'assets/index-DMP8NyHf.css']) {
    assert.ok(arquivos[rel].equals(naRaiz.arquivos[rel]), rel);
  }
  conferirSintaxe(texto(arquivos, 'assets/index-FbaU4KfD.js'));
  // O que se espera ver, por extenso.
  const convite = texto(arquivos, 'index.html');
  assert.ok(convite.includes(`src="${PASTA}/fronteira-sul-convite-preview.jpg?v=${vConvite}"`), 'a imagem trocada, pela versão dela');
  assert.ok(convite.includes(`<link rel="icon" href="${PASTA}/favicon.ico?v=${vLogo}">`), 'o ícone da aba usa o logo trocado, pela versão dele');
  assert.ok(convite.includes(`content="${ENDERECO}${PASTA}/fronteira-sul-convite-preview.jpg?v=${vConvite}"`), 'a imagem da prévia de link');
  assert.ok(convite.includes('<h1 id="title">A cidade abre sexta &amp; &lt;sábado&gt;</h1>'));
  assert.ok(convite.includes('h1{letter-spacing:0}'));
  assert.ok(!convite.includes('manus-content-root') && !texto(arquivos, 'regras/index.html').includes('api/platform'), 'sem o selo, as estatísticas e o endereço da plataforma original');
  const js = texto(arquivos, 'assets/index-FbaU4KfD.js');
  assert.ok(js.includes(`"${PASTA}/manus-storage/fronteira-sul-logo_1b1b4c2d.webp?v=${vLogo}"`) && js.includes(`"${PASTA}/fronteira-sul-logo.webp?v=${vLogo}"`));
  assert.ok(js.includes('"Jogo \\"limpo\\"."'));
  assert.equal(vezes(js, `className:"view-tab",href:"${PASTA}/",children:[`), 2, 'o link de volta, com o texto do painel, leva ao começo da pasta');
  assert.deepEqual(JSON.parse(texto(arquivos, '__manus/pwa/manifest.webmanifest')).icons.map((i) => i.src), [`${PASTA}/favicon.ico?v=${vLogo}`, `${PASTA}/favicon.ico?v=${vLogo}`]);
  ok('na pasta, com o que foi salvo pelo painel: imagens trocadas pela versão delas, textos, CSS e a retirada do selo da hospedagem original');

  // Para onde o botão do convite leva: um endereço do próprio site ganha a pasta; os outros ficam como foram escritos.
  const botao = (html) => /<a class="button" href="([^"]*)">/.exec(html)[1];
  for (const [escrito, naPagina] of [
    ['/regras/', `${PASTA}/regras/`],
    ['/', `${PASTA}/regras/`],
    ['/manus-storage/fronteira-sul-logo_1b1b4c2d.webp', `${PASTA}/manus-storage/fronteira-sul-logo_1b1b4c2d.webp`],
    ['https://discord.gg/exemplo', 'https://discord.gg/exemplo'],
    ['#title', '#title'],
  ]) {
    c.salvar({ textos: { 'convite.botaoLink': escrito } });
    assert.equal(botao(texto(gravar({ dirDados: dados, pasta: PASTA }).arquivos, 'index.html')), naPagina, escrito);
    assert.equal(botao(texto(gravar({ dirDados: dados }).arquivos, 'index.html')), naPagina.replace(PASTA, ''), `${escrito}, na raiz`);
  }
  ok('botão do convite: um endereço do próprio site ganha a pasta; um endereço completo ou uma âncora ficam como foram escritos');
}

// ───── 5. com a opção "Começar o site pelo convite" desligada
{
  const dados = pastaTemporaria();
  painel(dados).salvar({ versao: 0, opcoes: { conviteNoInicio: false, abaAdmin: false } });
  const naRaiz = gravar({ dirDados: dados });
  assert.deepEqual(Object.keys(naRaiz.arquivos).sort(), ARQUIVOS_GRAVADOS);
  assert.deepEqual(naRaiz.feito.enderecos, { convite: '/convite/', regras: '/' });
  // Por extenso: as regras no começo do site, o convite da cópia em /convite/, e sem a aba Admin.
  assert.equal(texto(naRaiz.arquivos, 'index.html'), SEM_COMECAR_PELO_CONVITE_NEM_ADMIN.index);
  assert.equal(texto(naRaiz.arquivos, '404.html'), SEM_COMECAR_PELO_CONVITE_NEM_ADMIN.index);
  assert.equal(texto(naRaiz.arquivos, 'assets/index-FbaU4KfD.js'), SEM_COMECAR_PELO_CONVITE_NEM_ADMIN.js);
  assert.equal(texto(naRaiz.arquivos, 'convite/index.html'), SEM_COMECAR_PELO_CONVITE_NEM_ADMIN.convite, 'o convite é o da cópia, em /convite/, fora o selo da Manus');
  assert.equal(texto(naRaiz.arquivos, 'regras/index.html'), paginaQueLeva('/'), '"/regras/" leva às regras, que estão no começo do site');
  await comOServidor(dados, (base) => igualAoServidor(base, naRaiz.arquivos));

  const { feito, arquivos } = gravar({ dirDados: dados, pasta: PASTA });
  const esperado = naPasta(SEM_COMECAR_PELO_CONVITE_NEM_ADMIN, PASTA, { comecaPeloConvite: false });
  const js = texto(arquivos, 'assets/index-FbaU4KfD.js');
  assert.equal(js, esperado.js);
  assert.equal(texto(arquivos, 'index.html'), esperado.index);
  assert.equal(texto(arquivos, 'convite/index.html'), esperado.convite);
  assert.equal(texto(arquivos, 'regras/index.html'), paginaQueLeva(`${PASTA}/`));
  assert.deepEqual(feito.enderecos, { convite: `${PASTA}/convite/`, regras: `${PASTA}/` });
  assert.equal(vezes(js, `base:"${PASTA}",ssrPath:`), 1, 'a raiz dos endereços é a pasta, em qualquer página');
  assert.equal(raizDoAplicativo(js, `${PASTA}/`), PASTA);
  assert.equal(raizDoAplicativo(js, `${PASTA}/404`), PASTA);
  assert.equal(vezes(js, 'const r=()=>{a("/")}'), 1, 'o botão da tela "não encontrada" mostra as regras, como na cópia: elas são o começo do site');
  assert.equal(/<a class="button" href="([^"]*)">/.exec(texto(arquivos, 'convite/index.html'))[1], `${PASTA}/`, 'o botão do convite leva às regras, no começo da pasta');
  conferirSintaxe(js);
  ok('sem começar pelo convite: regras no começo, convite em /convite/ e "/regras/" levando ao começo, na raiz (igual ao servidor) e dentro da pasta');
}

// ───── 6. o que impede a exportação: nada é gravado
{
  const naoGravou = (saida) => assert.ok(!fs.existsSync(saida), 'nada foi gravado');
  // A cópia do site veio diferente: publicar o que não foi conferido seria pior do que não publicar.
  const semARaiz = copiaDoSite({ js: (t) => t.replace('base:"",ssrPath:', 'base:"",outroNome:') });
  let saida = saidaNova();
  recusa(() => exportar({ saida, raizSite: semARaiz, dirDados: pastaTemporaria(), pasta: PASTA }), `O site não pôde ser preparado para a pasta ${PASTA}`);
  naoGravou(saida);
  recusa(() => exportar({ saida, raizSite: semARaiz, dirDados: pastaTemporaria() }), 'O site não pôde começar pelo convite');
  naoGravou(saida);
  const semATelaNaoEncontrada = copiaDoSite({ js: (t) => t.replace(',tg="/404";function ', ',tg="/nao-encontrada";function ') });
  recusa(() => exportar({ saida, raizSite: semATelaNaoEncontrada, dirDados: pastaTemporaria(), pasta: PASTA }), `O site não pôde ser preparado para a pasta ${PASTA}`);
  naoGravou(saida);
  // (na raiz esse trecho não é usado: a mesma cópia é gravada sem problema)
  assert.equal(Object.keys(gravar({ raizSite: semATelaNaoEncontrada, dirDados: pastaTemporaria() }).arquivos).length, ARQUIVOS_GRAVADOS.length);
  const semAImagemClicavel = copiaDoSite({ convite: (t) => t.replace('<img class="poster"', '<img class="cartaz"') });
  recusa(() => exportar({ saida, raizSite: semAImagemClicavel, dirDados: pastaTemporaria() }), 'A imagem do convite não pôde ficar clicável');
  naoGravou(saida);
  ok('cópia do site diferente do esperado: a exportação para e diz o que não achou');

  // O que foi salvo pelo painel está ilegível, ou falta uma imagem enviada.
  const ilegivel = pastaTemporaria();
  fs.writeFileSync(path.join(ilegivel, 'conteudo.json'), '{ "textos": ');
  recusa(() => exportar({ saida, raizSite: SITE, dirDados: ilegivel }), 'está ilegível');
  naoGravou(saida);
  assert.deepEqual(fs.readdirSync(ilegivel), ['conteudo.json'], 'o arquivo ilegível fica onde estava, com o mesmo nome');
  assert.equal(fs.readFileSync(path.join(ilegivel, 'conteudo.json'), 'utf8'), '{ "textos": ');
  const semAImagem = pastaTemporaria();
  const c = painel(semAImagem);
  c.trocarImagem('logo', { corpo: pngSimples(8, 8), tipo: 'image/png', ext: 'png', largura: 8, altura: 8 });
  assert.equal(Object.keys(gravar({ dirDados: semAImagem }).arquivos).length, ARQUIVOS_GRAVADOS.length, 'com a imagem no lugar, grava');
  fs.rmSync(path.join(semAImagem, 'imagens'), { recursive: true });
  recusa(() => exportar({ saida, raizSite: SITE, dirDados: semAImagem }), 'Falta a imagem "logo" enviada pelo painel');
  naoGravou(saida);
  ok('conteúdo salvo ilegível ou imagem enviada faltando: a exportação para, sem mexer na pasta de dados');

  // A pasta de saída e o que foi pedido.
  const ocupada = pastaTemporaria();
  fs.writeFileSync(path.join(ocupada, 'algo.txt'), 'x');
  recusa(() => exportar({ saida: ocupada, raizSite: SITE, dirDados: pastaTemporaria() }), 'precisa não existir ou estar vazia');
  assert.deepEqual(fs.readdirSync(ocupada), ['algo.txt']);
  const vazia = pastaTemporaria();
  assert.equal(exportar({ saida: vazia, raizSite: SITE, dirDados: pastaTemporaria() }).arquivos.length, ARQUIVOS_GRAVADOS.length, 'numa pasta vazia que já existe, grava');
  const copia = copiaDoSite();
  recusa(() => exportar({ saida: path.join(copia, 'saida'), raizSite: copia, dirDados: pastaTemporaria() }), 'não pode ficar dentro de site/');
  const dadosComSaida = pastaTemporaria();
  recusa(() => exportar({ saida: path.join(dadosComSaida, 'saida'), raizSite: SITE, dirDados: dadosComSaida }), 'não pode ficar dentro de site/');
  recusa(() => exportar({ raizSite: SITE, dirDados: pastaTemporaria() }), 'Diga onde gravar');
  recusa(() => exportar({ saida, raizSite: pastaTemporaria(), dirDados: pastaTemporaria() }), 'Não encontrei');
  for (const pasta of ['projeto', '/projeto/', '/', '//projeto', '/pro jeto', '/pro"jeto', '/projeto?x', '/projeto/../x', '/./projeto', '/projeto/..', '/a<b', '/ação']) {
    recusa(() => exportar({ saida, raizSite: SITE, dirDados: pastaTemporaria(), pasta }), 'Pasta inválida');
  }
  for (const endereco of ['usuario.github.io', 'ftp://usuario.github.io', 'https://usuario.github.io/projeto', 'https://usuario.github.io/?a=1', 'https://usuario.github.io/#x', 'https://']) {
    recusa(() => exportar({ saida, raizSite: SITE, dirDados: pastaTemporaria(), endereco }), 'Endereço inválido');
  }
  naoGravou(saida);
  ok('pasta de saída ocupada ou dentro do projeto, pasta ou endereço mal escritos: recusados, e nada é gravado');
}

// ───── 7. pela linha de comando
{
  const comando = path.join(RAIZ, 'exportar.mjs');
  // (cada rodada com a sua pasta de dados: o que estiver salvo no projeto de quem roda o teste não muda o resultado)
  const rodar = (argumentos, variaveis = { DADOS_DIR: pastaTemporaria() }) => {
    const env = { ...process.env, ...variaveis };
    delete env.SITE_DIR;
    return spawnSync(process.execPath, [comando, ...argumentos], { env, encoding: 'utf8' });
  };
  const dados = pastaTemporaria();
  painel(dados).salvar({ versao: 0, textos: { 'convite.titulo': 'Pela linha de comando' } });
  const saida = saidaNova();
  let r = rodar(['--saida', saida, '--pasta', PASTA, '--endereco', ENDERECO], { DADOS_DIR: dados });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stderr, '');
  assert.ok(r.stdout.includes(`13 arquivos`) && r.stdout.includes(`Convite : ${ENDERECO}${PASTA}/`) && r.stdout.includes(`Regras  : ${ENDERECO}${PASTA}/regras/`), r.stdout);
  assert.ok(r.stdout.includes('Painel  : não vai junto'), r.stdout);
  const arquivos = arvore(saida);
  assert.deepEqual(Object.keys(arquivos).sort(), ARQUIVOS_GRAVADOS);
  assert.ok(texto(arquivos, 'index.html').includes('<h1 id="title">Pela linha de comando</h1>'), 'DADOS_DIR diz onde está o que foi salvo pelo painel');
  assert.ok(texto(arquivos, 'index.html').includes(`<link rel="canonical" href="${ENDERECO}${PASTA}/" />`));
  // O mesmo pedido de novo: a pasta de saída já tem arquivos.
  r = rodar(['--saida', saida, '--pasta', PASTA], { DADOS_DIR: dados });
  assert.equal(r.status, 1);
  assert.ok(r.stderr.includes('precisa não existir ou estar vazia') && r.stderr.includes('Nada foi gravado.'), r.stderr);
  assert.deepEqual(arvore(saida), arquivos, 'o que estava gravado fica como estava');
  for (const [argumentos, trecho] of [
    [[], 'Diga onde gravar'],
    [['--saida'], 'Falta o valor de --saida'],
    [['--saida', saidaNova(), '--porta', '80'], 'Não conheço "--porta"'],
    [['--saida', saidaNova(), '--pasta', 'sem-barra'], 'Pasta inválida'],
  ]) {
    r = rodar(argumentos);
    assert.equal(r.status, 1, argumentos.join(' '));
    assert.ok(r.stderr.includes(trecho), r.stderr);
    assert.equal(r.stdout, '');
  }
  r = rodar(['--ajuda']);
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('--saida') && r.stdout.includes('--pasta') && r.stdout.includes('--endereco'));
  ok('linha de comando: grava com --saida, --pasta e --endereco, lê DADOS_DIR, e sai com erro e uma frase clara quando não pode gravar');
}

// ───── 8. conferir o que está no ar (../../conferir-publicado.mjs)
{
  /**
   * Uma hospedagem de arquivos de mentira: entrega a pasta `raiz.pasta` dentro de `prefixo`, com "index.html"
   * respondendo pelo endereço da pasta. Trocar `raiz.pasta` é publicar outra coisa.
   */
  const prefixo = `${PASTA}/`;
  const raiz = { pasta: null, pedidos: [] };
  const hospedagem = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    raiz.pedidos.push(u.pathname + u.search);
    let arquivo = null;
    if (u.pathname.startsWith(prefixo)) {
      const rel = u.pathname.slice(prefixo.length);
      arquivo = path.join(raiz.pasta, rel.endsWith('/') || rel === '' ? `${rel}index.html` : rel);
    }
    if (!arquivo || !fs.existsSync(arquivo) || !fs.statSync(arquivo).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('não existe');
    }
    res.writeHead(200);
    res.end(fs.readFileSync(arquivo));
  });
  await new Promise((r) => hospedagem.listen(0, '127.0.0.1', r));
  const noAr = `http://127.0.0.1:${hospedagem.address().port}${PASTA}`;
  try {
    const gravado = gravar({ dirDados: pastaTemporaria(), pasta: PASTA, endereco: ENDERECO }).saida;
    assert.equal(enderecoDoArquivo('index.html'), '');
    assert.equal(enderecoDoArquivo('regras/index.html'), 'regras/');
    assert.equal(enderecoDoArquivo('404.html'), '404.html');
    assert.equal(enderecoDoArquivo('assets/index-DMP8NyHf.css'), 'assets/index-DMP8NyHf.css');

    // O que está no ar é o que foi gravado.
    raiz.pasta = gravado;
    let r = await conferir({ arquivos: gravado, endereco: `${noAr}/`, marca: 'm1' });
    assert.deepEqual(r, { total: 13, diferencas: [] });
    assert.deepEqual(
      raiz.pedidos.map((pedido) => pedido.replace(prefixo, '')).sort(),
      ARQUIVOS_GRAVADOS.map((caminho) => `${enderecoDoArquivo(caminho)}?conferencia=m1`).sort(),
      'cada arquivo é pedido uma vez, no endereço em que o visitante o encontra',
    );

    // No ar está outra publicação: um texto diferente, um arquivo a menos e uma imagem do mesmo tamanho com um byte trocado.
    const outra = path.join(pastaTemporaria(), 'outra');
    fs.cpSync(gravado, outra, { recursive: true });
    fs.appendFileSync(path.join(outra, 'regras', 'index.html'), '<!-- outra -->');
    fs.rmSync(path.join(outra, 'robots.txt'));
    const icone = fs.readFileSync(path.join(outra, 'favicon.ico'));
    icone[icone.length - 1] ^= 0xff;
    fs.writeFileSync(path.join(outra, 'favicon.ico'), icone);
    raiz.pasta = outra;
    r = await conferir({ arquivos: gravado, endereco: noAr });
    assert.equal(r.total, 13);
    assert.deepEqual(
      r.diferencas.map((d) => [d.caminho, d.endereco, d.motivo]),
      [
        ['favicon.ico', `${noAr}/favicon.ico`, `conteúdo diferente (${icone.length} bytes no ar, ${icone.length} gravados)`],
        ['regras/index.html', `${noAr}/regras/`, `conteúdo diferente (${fs.statSync(path.join(outra, 'regras', 'index.html')).size} bytes no ar, ${fs.statSync(path.join(gravado, 'regras', 'index.html')).size} gravados)`],
        ['robots.txt', `${noAr}/robots.txt`, 'respondeu 404'],
      ],
    );
    ok('conferir: cada arquivo gravado é pedido no endereço do visitante e comparado byte a byte; diferenças e arquivos que faltam são apontados');

    // Os arquivos foram gravados para o endereço em que estão? Com a pasta errada (--pasta), todos eles estariam no ar,
    // iguais aos gravados, e mesmo assim as páginas pediriam os arquivos no lugar errado.
    const publicado = `${ENDERECO}${PASTA}`;
    const gravadoPara = (pasta, dirDados = pastaTemporaria()) => gravar({ dirDados, pasta }).saida;
    const naRaiz = gravadoPara('');
    for (const [arquivos, endereco] of [
      [gravado, publicado],
      [gravado, `${publicado}/`],
      [naRaiz, 'https://exemplo.com'],
      [naRaiz, 'https://exemplo.com/'],
    ]) {
      assert.equal(gravadoParaOutroEndereco({ arquivos, endereco }), '', endereco);
    }
    // Gravado para a raiz, para uma pasta mais rasa, para outra pasta ou para uma de nome parecido: as páginas pedem endereços de fora.
    for (const [pasta, pedido] of [
      ['', '/assets/index-FbaU4KfD.js'],
      ['/fronteira-sul', '/fronteira-sul/assets/index-FbaU4KfD.js'],
      ['/projetos-cidades2', '/projetos-cidades2/assets/index-FbaU4KfD.js'],
      [`${PASTA}2`, `${PASTA}2/assets/index-FbaU4KfD.js`],
    ]) {
      assert.equal(gravadoParaOutroEndereco({ arquivos: pasta ? gravadoPara(pasta) : naRaiz, endereco: publicado }), `404.html pede "${pedido}", que fica fora desse endereço`);
    }
    // Gravado para uma pasta mais funda que a do endereço: os pedidos ficam dentro dele, mas nenhum acha um arquivo gravado.
    for (const [arquivos, endereco] of [
      [gravado, 'https://exemplo.com'],
      [gravado, `${ENDERECO}/projetos-cidades2`],
      [gravadoPara(`${PASTA}/x`), publicado],
    ]) {
      assert.equal(gravadoParaOutroEndereco({ arquivos, endereco }), 'as páginas não pedem nenhum dos arquivos gravados', endereco);
    }
    // Continua valendo com o que o painel muda nas páginas: imagens trocadas (o endereço ganha "?v="), o selo da hospedagem
    // original retirado, o botão do convite levando a outro site, e o site sem começar pelo convite.
    for (const opcoes of [{ removerManus: true }, { conviteNoInicio: false }]) {
      const dados = pastaTemporaria();
      const c = painel(dados);
      c.salvar({ versao: 0, textos: { 'convite.botaoLink': 'https://discord.gg/exemplo' }, opcoes });
      c.trocarImagem('convite', { corpo: pngSimples(40, 30, [200, 30, 30]), tipo: 'image/png', ext: 'png', largura: 40, altura: 30 });
      c.trocarImagem('logo', { corpo: pngSimples(20, 20, [30, 200, 30]), tipo: 'image/png', ext: 'png', largura: 20, altura: 20 });
      const naPasta = gravar({ dirDados: dados, pasta: PASTA });
      const convite = texto(naPasta.arquivos, opcoes.conviteNoInicio === false ? 'convite/index.html' : 'index.html');
      assert.ok(convite.includes('<a class="button" href="https://discord.gg/exemplo">') && convite.includes(`src="${PASTA}/fronteira-sul-convite-preview.jpg?v=`), JSON.stringify(opcoes));
      assert.equal(gravadoParaOutroEndereco({ arquivos: naPasta.saida, endereco: publicado }), '', JSON.stringify(opcoes));
      assert.equal(gravadoParaOutroEndereco({ arquivos: gravadoPara('', dados), endereco: 'https://exemplo.com' }), '', JSON.stringify(opcoes));
      assert.equal(gravadoParaOutroEndereco({ arquivos: gravadoPara('', dados), endereco: publicado }).slice(-28), 'que fica fora desse endereço', JSON.stringify(opcoes));
      assert.equal(gravadoParaOutroEndereco({ arquivos: gravadoPara(PASTA, dados), endereco: 'https://exemplo.com' }), 'as páginas não pedem nenhum dos arquivos gravados', JSON.stringify(opcoes));
    }
    // O que conta como endereço do próprio site: href ou src que começa com uma barra só, sem o que vem depois de "?" ou "#",
    // e só dentro das páginas. Endereços completos, de outro site, âncoras e endereços sem a barra não dizem nada sobre a pasta.
    const aMao = path.join(pastaTemporaria(), 'a-mao');
    fs.mkdirSync(path.join(aMao, 'sub'), { recursive: true });
    fs.writeFileSync(path.join(aMao, 'estilo.css'), 'a{}');
    fs.writeFileSync(path.join(aMao, 'index.html'), '<link href="/p/estilo.css?v=1"><a href="https://outro.example/q/">a</a><a href="//outro.example/q/">b</a><a href="#topo">c</a><img src="figura.png">');
    const emP = { arquivos: aMao, endereco: 'https://exemplo.com/p' };
    assert.equal(gravadoParaOutroEndereco(emP), '');
    fs.writeFileSync(path.join(aMao, 'sub', 'nota.txt'), '<a href="/q/">fora</a>');
    assert.equal(gravadoParaOutroEndereco(emP), '', 'um arquivo que não é página não conta');
    fs.writeFileSync(path.join(aMao, 'sub', 'index.html'), '<a href="/q/">fora</a>');
    assert.equal(gravadoParaOutroEndereco(emP), 'sub/index.html pede "/q/", que fica fora desse endereço');
    fs.writeFileSync(path.join(aMao, 'sub', 'index.html'), '<script src="/q/app.js#x"></script>');
    assert.equal(gravadoParaOutroEndereco(emP), 'sub/index.html pede "/q/app.js", que fica fora desse endereço');
    fs.writeFileSync(path.join(aMao, 'sub', 'index.html'), '<a href="/p/sub/?de=fora#topo">dentro</a>');
    fs.writeFileSync(path.join(aMao, 'index.html'), '<a href="/p/nao-gravado.css">x</a>');
    assert.equal(gravadoParaOutroEndereco(emP), '', 'basta uma página pedir um arquivo gravado (aqui, a página de uma pasta, pelo endereço da pasta)');
    fs.rmSync(path.join(aMao, 'sub', 'index.html'));
    assert.equal(gravadoParaOutroEndereco(emP), 'as páginas não pedem nenhum dos arquivos gravados');
    ok('conferir: arquivos gravados para outra pasta do endereço (mais rasa, mais funda, de nome parecido ou nenhuma) são recusados antes de qualquer pedido');

    // Logo depois de publicar, a hospedagem ainda entrega a publicação anterior por um tempo: a conferência espera e tenta de novo.
    const linhas = [];
    let tentativa = 0;
    const antes = raiz.pedidos.length;
    const comPaciencia = conferirComPaciencia({ arquivos: gravado, endereco: noAr, tentativas: 5, espera: 0.05, dizer: (linha) => { linhas.push(linha); tentativa += 1; if (tentativa === 2) raiz.pasta = gravado; } });
    r = await comPaciencia;
    assert.deepEqual([r.total, r.diferencas, r.tentativas], [13, [], 3]);
    assert.deepEqual(linhas, ['Tentativa 1 de 5: 3 de 13 ainda não conferem. Esperando 0.05 s.', 'Tentativa 2 de 5: 3 de 13 ainda não conferem. Esperando 0.05 s.']);
    assert.equal(new Set(raiz.pedidos.slice(antes).map((pedido) => pedido.split('?conferencia=')[1])).size, 3, 'cada tentativa pede com uma marca nova no endereço');
    // E desiste quando as tentativas acabam.
    raiz.pasta = outra;
    r = await conferirComPaciencia({ arquivos: gravado, endereco: noAr, tentativas: 2, espera: 0 });
    assert.deepEqual([r.diferencas.length, r.tentativas], [3, 2]);
    ok('conferir com paciência: tenta de novo até a hospedagem entregar a publicação nova, e desiste quando as tentativas acabam');

    // Pela linha de comando.
    const rodar = (argumentos) =>
      new Promise((resolver) => {
        const p = spawn(process.execPath, [path.join(RAIZ, 'conferir-publicado.mjs'), ...argumentos], { stdio: ['ignore', 'pipe', 'pipe'] });
        let saida = '';
        let erros = '';
        p.stdout.on('data', (d) => (saida += d));
        p.stderr.on('data', (d) => (erros += d));
        p.on('exit', (status) => resolver({ status, saida, erros }));
      });
    raiz.pasta = gravado;
    let c = await rodar(['--arquivos', gravado, '--endereco', noAr]);
    assert.deepEqual([c.status, c.erros], [0, '']);
    assert.equal(c.saida, `Confere: os 13 arquivos em ${noAr} são os que foram gravados.\n`);
    raiz.pasta = outra;
    c = await rodar(['--arquivos', gravado, '--endereco', noAr, '--tentativas', '2', '--espera', '0']);
    assert.equal(c.status, 1);
    assert.equal(c.saida, 'Tentativa 1 de 2: 3 de 13 ainda não conferem. Esperando 0 s.\n');
    assert.ok(c.erros.startsWith(`O site em ${noAr} não é o que foi gravado: 3 de 13 arquivos diferem.\n`) && c.erros.includes(`${noAr}/regras/: conteúdo diferente`) && c.erros.includes(`${noAr}/robots.txt: respondeu 404`), c.erros);
    // Gravado para outra pasta: recusa na hora, com o que fazer, sem pedir nada à hospedagem (esperar não resolveria).
    raiz.pasta = naRaiz;
    const pedidosAntes = raiz.pedidos.length;
    c = await rodar(['--arquivos', naRaiz, '--endereco', noAr]);
    assert.deepEqual([c.status, c.saida], [1, '']);
    assert.equal(
      c.erros,
      `Os arquivos em ${naRaiz} não foram gravados para ${noAr}: 404.html pede "/assets/index-FbaU4KfD.js", que fica fora desse endereço. Grave de novo com o exportar.mjs, dizendo em --pasta a pasta desse endereço.\n`,
    );
    assert.equal(raiz.pedidos.length, pedidosAntes, 'nenhum pedido foi feito');
    for (const [argumentos, trecho] of [
      [[], 'Uso: node fronteira-sul/conferir-publicado.mjs'],
      [['--arquivos', gravado], 'Uso: node fronteira-sul/conferir-publicado.mjs'],
      [['--arquivos', gravado, '--endereco', 'usuario.github.io'], 'Endereço inválido'],
      [['--arquivos', gravado, '--endereco', noAr, '--tentativas', '0'], 'Valor inválido para --tentativas'],
      [['--arquivos', gravado, '--endereco', noAr, '--depressa', '1'], 'Não conheço "--depressa"'],
      [['--arquivos', pastaTemporaria(), '--endereco', noAr], 'Não há arquivos'],
    ]) {
      c = await rodar(argumentos);
      assert.equal(c.status, 1, argumentos.join(' '));
      assert.ok(c.erros.includes(trecho), c.erros);
    }
    ok('conferir pela linha de comando: sai com 0 e uma frase quando confere; com 1 e o motivo quando difere ou foi gravado para outra pasta');
  } finally {
    await new Promise((r) => hospedagem.close(r));
  }
}

resumo();
