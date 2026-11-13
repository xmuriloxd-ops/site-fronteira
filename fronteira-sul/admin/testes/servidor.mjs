// Testa o servidor de verdade, por HTTP: páginas, login, painel, imagens e o que não pode ser entregue.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { analisarImagem } from '../imagem.mjs';
import { ARQUIVOS } from '../mapa.mjs';
import {
  CREDITOS_DA_COPIA,
  ENDERECOS,
  ENDERECOS_DO_ORIGINAL,
  ESTILO_DO_LINK_DE_VOLTA,
  GIF_MINIMO,
  LINK_DE_VOLTA,
  LINK_DO_ADMIN,
  PADRAO,
  RAIZ,
  SEM_A_ENTRADA_DO_ADMIN,
  SEM_COMECAR_PELO_CONVITE,
  SEM_O_LINK_DE_VOLTA,
  SITE,
  comOLinkDeVolta,
  iniciar,
  ok,
  parar,
  pastaTemporaria,
  pngSimples,
  portaLivre,
  resumo,
  versaoDaImagem,
  versaoDe,
} from './apoio.mjs';

const DADOS = pastaTemporaria();
const resumoDe = (corpo) => crypto.createHash('sha256').update(corpo).digest('hex');
const doSite = (rel) => fs.readFileSync(path.join(SITE, rel));

/** Nome e resumo de cada arquivo de site/: o servidor nunca pode escrever nessa pasta. */
function retratoDoSite(pasta = SITE, prefixo = '') {
  const lista = [];
  for (const item of fs.readdirSync(pasta, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const caminho = path.join(pasta, item.name);
    if (item.isDirectory()) lista.push(...retratoDoSite(caminho, `${prefixo}${item.name}/`));
    else lista.push(`${prefixo}${item.name} ${resumoDe(fs.readFileSync(caminho))}`);
  }
  return lista;
}
const siteAntes = retratoDoSite();

// ───── leitura das imagens (sem servidor)
{
  const jpg = doSite('fronteira-sul-convite-preview.jpg');
  const webp = doSite('fronteira-sul-logo.webp');
  assert.deepEqual(analisarImagem(jpg), { tipo: 'image/jpeg', ext: 'jpg', largura: 1200, altura: 675 });
  assert.deepEqual(analisarImagem(webp), { tipo: 'image/webp', ext: 'webp', largura: 1200, altura: 676 });
  assert.deepEqual(analisarImagem(pngSimples(300, 200)), { tipo: 'image/png', ext: 'png', largura: 300, altura: 200 });
  assert.deepEqual(analisarImagem(GIF_MINIMO), { tipo: 'image/gif', ext: 'gif', largura: 1, altura: 1 });
  // Os outros dois formatos de WebP (sem e com perda), montados só com o cabeçalho.
  const riff = (formato, dados) => Buffer.concat([Buffer.from('RIFF\0\0\0\0WEBP', 'latin1'), Buffer.from(formato, 'latin1'), Buffer.alloc(4), dados, Buffer.alloc(16)]);
  const semPerda = Buffer.alloc(5);
  semPerda[0] = 0x2f;
  semPerda.writeUInt32LE((50 - 1) | ((40 - 1) << 14), 1);
  assert.deepEqual(analisarImagem(riff('VP8L', semPerda)), { tipo: 'image/webp', ext: 'webp', largura: 50, altura: 40 });
  const comPerda = Buffer.from([0, 0, 0, 0x9d, 0x01, 0x2a, 0x40, 0x01, 0xf0, 0x00]);
  assert.deepEqual(analisarImagem(riff('VP8 ', comPerda)), { tipo: 'image/webp', ext: 'webp', largura: 320, altura: 240 });
  // Arquivo cortado: o tipo vale, o tamanho fica desconhecido.
  assert.deepEqual(analisarImagem(jpg.subarray(0, 20)), { tipo: 'image/jpeg', ext: 'jpg', largura: 0, altura: 0 });
  for (const falso of ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', '<html><body>oi</body></html> texto', '%PDF-1.7 um documento qualquer', 'GIF8 mas não é gif de verdade', '']) {
    assert.equal(analisarImagem(Buffer.from(falso)), null, falso);
  }
  assert.equal(analisarImagem('não é um Buffer'), null);
  ok('imagens: tipo e tamanho lidos do conteúdo (PNG, JPG, GIF, WebP); SVG, HTML e PDF não passam');
}

// ───── servidor (portaLivre, iniciar e parar estão no apoio: outros testes também sobem o servidor)
const PORTA = await portaLivre();
const BASE = `http://127.0.0.1:${PORTA}`;
let processo = null;

async function subir() {
  processo = await iniciar(PORTA, DADOS);
}

const descer = () => parar(processo);

/**
 * Um pedido à API do painel, como o painel faz: POST com JSON, e o token da sessão dentro do corpo.
 * Para os pedidos fora do formato: `corpo` e `tipo` mandam um corpo qualquer, `metodo` troca o POST,
 * `headers` acrescenta cabeçalhos e `base` manda o pedido por outro caminho (ver o intermediário, lá embaixo).
 */
async function api(rota, { token, json, corpo, tipo, metodo = 'POST', headers: extras = {}, base = BASE } = {}) {
  const headers = { ...extras };
  let body;
  if (corpo !== undefined) {
    headers['Content-Type'] = tipo || 'application/octet-stream';
    body = corpo;
  } else if (metodo !== 'GET' && metodo !== 'HEAD') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(token ? { sessao: token, ...json } : (json ?? {}));
  }
  const r = await fetch(`${base}/admin/api/${rota}`, { method: metodo, headers, body });
  const texto = await r.text();
  let dados = null;
  try {
    dados = JSON.parse(texto);
  } catch {
    /* resposta sem JSON */
  }
  return { status: r.status, dados, texto, headers: r.headers };
}

/** Pedido sem nenhum tratamento do caminho nem do corpo (o fetch arruma os ".." antes de enviar). */
function cru(caminho, { metodo = 'GET', headers = {} } = {}) {
  return new Promise((resolver, rejeitar) => {
    const pedido = http.request({ host: '127.0.0.1', port: PORTA, path: caminho, method: metodo, headers }, (r) => {
      let texto = '';
      r.on('data', (d) => (texto += d));
      r.on('end', () => resolver({ status: r.statusCode, texto, headers: r.headers }));
    });
    pedido.on('error', rejeitar);
    pedido.flushHeaders(); // só os cabeçalhos: o corpo anunciado nunca é enviado
    if (!headers['Content-Length']) pedido.end();
  });
}

const baixar = async (caminho, opcoes) => {
  const r = await fetch(BASE + caminho, opcoes);
  return { status: r.status, tipo: r.headers.get('content-type'), headers: r.headers, corpo: Buffer.from(await r.arrayBuffer()) };
};
const entrar = (usuario, senha, base) => api('entrar', { json: { usuario, senha }, base });
/** Envia uma imagem como o painel: os bytes em base64, dentro do JSON. */
const enviarImagem = (id, token, bytes, base) => api(`imagens/${id}`, { token, json: { arquivo: Buffer.from(bytes).toString('base64') }, base });
const pagina = async (caminho) => (await baixar(caminho)).corpo.toString('utf8');
/** Pede sem seguir o redirecionamento: [status, para onde manda, tamanho do corpo]. */
const semSeguir = async (caminho, metodo = 'GET') => {
  const r = await fetch(BASE + caminho, { method: metodo, redirect: 'manual' });
  return [r.status, r.headers.get('location'), (await r.arrayBuffer()).byteLength];
};

try {
  await subir();
  assert.ok(processo.saida().includes('senha inicial'), 'ao iniciar, o servidor avisa que a senha inicial está em uso');

  assert.ok(processo.saida().includes(`  Convite       : http://localhost:${PORTA}/\n`), 'ao iniciar, o servidor mostra onde está o convite');
  assert.ok(processo.saida().includes(`  Regras        : http://localhost:${PORTA}/regras/\n`), 'e onde estão as regras');

  // ───── o site, sem nenhuma alteração feita pelo painel
  // O site começa pelo convite: "/" é a página do convite, com o botão que leva às regras.
  for (const caminho of ['/', '/index.html', '/?de=discord']) assert.equal(await pagina(caminho), PADRAO.convite, caminho);
  // As regras ficam em outra página, /regras/. O aplicativo dela sai com o que o projeto mudou na cópia
  // (funcionar em /regras/, o link de volta ao convite, os créditos e a aba Admin); todo o resto, byte a byte como a cópia.
  const aplicativo = await pagina(`/${ARQUIVOS.js}`);
  assert.equal(aplicativo, PADRAO.js);
  for (const caminho of ['/regras/', '/regras', '/Regras/', '/REGRAS', '/regras/?busca=rdm']) assert.equal(await pagina(caminho), PADRAO.index, caminho);
  // Endereço que não existe é uma rota do aplicativo, como no original: ele mostra a tela "não encontrada".
  for (const caminho of ['/uma-rota-qualquer', '/regras/outra', '/regras/index.html', '/convite/outra', '/404']) assert.equal(await pagina(caminho), PADRAO.index, caminho);
  // O endereço antigo do convite continua valendo: leva para o início, sem perder o que vem depois do "?".
  for (const caminho of ['/convite', '/convite/', '/convite/index.html', '/Convite/']) {
    assert.deepEqual(await semSeguir(caminho), [302, '/', 0], caminho);
    assert.deepEqual(await semSeguir(caminho, 'HEAD'), [302, '/', 0], `HEAD ${caminho}`);
    assert.equal(await pagina(caminho), PADRAO.convite, `${caminho}: seguindo, chega ao convite`);
  }
  assert.deepEqual(await semSeguir('/convite/?de=discord&n=1'), [302, '/?de=discord&n=1', 0]);
  assert.deepEqual(await semSeguir('/convite?'), [302, '/', 0]);
  assert.equal((await cru('/convite/')).headers['cache-control'], 'no-cache', 'o redirecionamento depende de uma opção do painel: o navegador não pode guardá-lo');
  for (const rel of Object.values(ARQUIVOS).concat('assets/index-DMP8NyHf.css', 'favicon.ico', 'fronteira-sul-convite-preview.jpg')) {
    if (rel === ARQUIVOS.js || rel === ARQUIVOS.index || rel === ARQUIVOS.convite) continue;
    assert.equal(resumoDe((await baixar(`/${rel}`)).corpo), resumoDe(doSite(rel)), rel);
  }
  assert.ok(aplicativo.includes('href:"/admin/"'));
  assert.ok(PADRAO.convite.includes('<a class="button" href="/regras/">Consultar regras oficiais</a>'), 'é pelo botão do convite que se chega às regras');
  assert.ok(PADRAO.convite.includes(`</main>${LINK_DO_ADMIN}`) && LINK_DO_ADMIN.includes('href="/admin/"'), 'e, no canto do convite, a etiqueta Admin leva ao painel');
  assert.ok(!aplicativo.includes('fs-convite') && !PADRAO.index.includes('convite-no-inicio'), 'a página de regras não traz o convite');
  assert.equal(aplicativo.split(LINK_DE_VOLTA).length - 1, 2, 'a página de regras tem o link de volta ao convite (um para telas estreitas, outro para as largas)');
  assert.ok(LINK_DE_VOLTA.includes('href:"/"') && PADRAO.index.includes(ESTILO_DO_LINK_DE_VOLTA), 'ele leva ao início do site, e a página recebe as regras de visual dele');
  assert.ok(aplicativo.includes('children:"MURILO MENDES"') && aplicativo.includes('navigator.clipboard.writeText("sgtmendes1997_29726")'));
  for (const antigo of Object.values(CREDITOS_DA_COPIA)) assert.ok(!aplicativo.includes(antigo), 'os créditos da cópia não são entregues');
  for (const [caminho, status, tipo] of [
    ['/', 200, 'text/html; charset=utf-8'],
    ['/regras', 200, 'text/html; charset=utf-8'],
    ['/regras/', 200, 'text/html; charset=utf-8'],
    ['/uma-rota-qualquer', 200, 'text/html; charset=utf-8'],
    ['/404', 404, 'text/html; charset=utf-8'],
    ['/nao-existe.png', 404, null],
    ['/regras/nao-existe.png', 404, null],
    ['/api/platform/config.js', 500, null],
    ['/favicon.ico', 200, 'image/webp'],
    ['/admin', 200, 'text/html; charset=utf-8'],
    ['/admin/', 200, 'text/html; charset=utf-8'],
    ['/Admin/', 200, 'text/html; charset=utf-8'],
    ['/admin/painel.js', 200, 'text/javascript; charset=utf-8'],
    ['/admin/painel.css', 200, 'text/css; charset=utf-8'],
    ['/admin/outra-coisa', 404, null],
  ]) {
    const r = await baixar(caminho);
    assert.equal(r.status, status, caminho);
    assert.equal(r.tipo, tipo, caminho);
  }
  for (const caminho of ['/', '/regras/', '/convite/', '/admin/']) assert.equal((await fetch(BASE + caminho, { method: 'POST', redirect: 'manual' })).status, 405, `POST ${caminho}`);
  ok('site sem alterações do painel: "/" é o convite (com a etiqueta Admin), "/regras/" são as regras (link de volta ao convite, créditos novos e aba Admin) e "/convite/" leva para "/"');

  const painel = await baixar('/admin/');
  assert.ok(painel.headers.get('content-security-policy').includes("script-src 'self'"));
  assert.equal(painel.headers.get('x-robots-tag'), 'noindex, nofollow');
  ok('painel: só carrega arquivos do próprio servidor e fica fora dos buscadores');

  // ───── endereços com versão
  // Um intermediário pode guardar arquivos por um tempo sem perguntar ao servidor se mudaram. As páginas
  // são pedidas a cada visita; por isso é nelas que vai a versão do que carregam. Quando o arquivo muda,
  // o endereço muda, e ninguém tem o endereço novo guardado.
  {
    // A página do painel nunca é guardada, e pede o painel.css e o painel.js pela versão de cada um.
    for (const caminho of ['/admin/', '/admin', '/Admin/']) {
      const tela = await baixar(caminho);
      assert.equal(tela.headers.get('cache-control'), 'no-store', caminho);
      assert.equal(tela.headers.get('etag'), null, caminho);
      const html = tela.corpo.toString('utf8');
      const pedidos = [...html.matchAll(/(?:href|src)="(\/admin\/painel\.[^"]*)"/g)].map((m) => m[1]);
      const doPainel = (nome) => fs.readFileSync(path.join(RAIZ, 'admin', 'painel', nome));
      assert.deepEqual(pedidos, [`/admin/painel.css?v=${versaoDe(doPainel('painel.css'))}`, `/admin/painel.js?v=${versaoDe(doPainel('painel.js'))}`], caminho);
      for (const pedido of pedidos) {
        const arquivo = await baixar(pedido);
        assert.equal(arquivo.status, 200, pedido);
        assert.ok(arquivo.corpo.equals(doPainel(pedido.slice('/admin/'.length).split('?')[0])), `${pedido}: é o arquivo de agora`);
      }
      assert.equal(html.replace(/\?v=[A-Za-z0-9_-]{10}"/g, '"'), doPainel('index.html').toString('utf8'), `${caminho}: fora as versões, a página é o arquivo`);
    }
    const semCorpo = await fetch(`${BASE}/admin/`, { method: 'HEAD' });
    assert.deepEqual([semCorpo.status, (await semCorpo.arrayBuffer()).byteLength, semCorpo.headers.get('cache-control')], [200, 0, 'no-store']);
    // A página de regras pede o aplicativo pela versão dele; com ou sem a versão, o servidor entrega o de agora.
    const pedidoDoAplicativo = /<script type="module" crossorigin src="([^"]*)"><\/script>/.exec(await pagina('/regras/'))[1];
    assert.equal(pedidoDoAplicativo, `/${ARQUIVOS.js}?v=${versaoDe(PADRAO.js)}`);
    assert.equal(await pagina(pedidoDoAplicativo), PADRAO.js);
    assert.equal(await pagina(`/${ARQUIVOS.js}?v=uma-versao-antiga`), PADRAO.js);
  }
  ok('endereços com versão: a página do painel (nunca guardada) e a página de regras pedem os arquivos pelo resumo do conteúdo deles');

  // ───── sem login
  const ROTAS_COM_SESSAO = ['sessao', 'conteudo', 'conteudo/salvar', 'imagens/logo', 'imagens/logo/remover', 'acesso', 'sair', 'restaurar-original', 'historico/1/restaurar'];
  for (const rota of [...ROTAS_COM_SESSAO, 'qualquer']) {
    const r = await api(rota);
    assert.equal(r.status, 401, rota);
    assert.ok(r.dados.erro);
    assert.equal(r.headers.get('cache-control'), 'no-store');
  }
  for (const token of ['x', 'a'.repeat(43), '../../etc/passwd']) assert.equal((await api('conteudo', { token })).status, 401);
  // (aqui o campo vai direto no corpo, do jeito que alguém de fora tentaria)
  for (const sessao of [123, true, null, ['a'.repeat(43)], { a: 1 }, '']) assert.equal((await api('conteudo', { json: { sessao } })).status, 401, JSON.stringify(sessao));
  ok('sem login, nada do conteúdo é lido nem alterado');

  for (const caminho of [
    '/servidor.mjs',
    '/LEIA-ME.md',
    '/admin/acesso.mjs',
    '/admin/api.mjs',
    '/admin/painel/index.html',
    '/dados/acesso.json',
    '/dados/conteudo.json',
    '/../dados/acesso.json',
    '/%2e%2e/dados/acesso.json',
    '/..%2fdados%2facesso.json',
    '/admin/../../dados/acesso.json',
    '/admin/%2e%2e/%2e%2e/dados/acesso.json',
    '/admin/..%2f..%2fdados%2facesso.json',
    '/assets/..%5c..%5c..%5cdados%5cacesso.json',
  ]) {
    const r = await cru(caminho);
    assert.ok([403, 404].includes(r.status), `${caminho} -> ${r.status}`);
    assert.equal(r.texto, '', caminho);
  }
  ok('arquivos do servidor e da pasta de dados não são alcançados pela web');

  // ───── login
  assert.equal((await api('entrar', { metodo: 'GET' })).status, 405);
  assert.equal((await api('entrar', { corpo: 'usuario=adm&senha=142536', tipo: 'application/x-www-form-urlencoded' })).status, 415);
  assert.equal((await api('entrar', { corpo: '{"usuario":', tipo: 'application/json' })).status, 400);
  assert.equal((await api('entrar', { json: [] })).status, 400);
  assert.equal((await api('entrar', { json: { usuario: 'adm' } })).status, 400);
  let r = await entrar('adm', '000000');
  assert.equal(r.status, 401);
  assert.equal(r.dados.erro, 'Usuário ou senha incorretos.');
  r = await entrar('adm', '142536');
  assert.equal(r.status, 200);
  assert.equal(r.dados.senhaInicial, true);
  const token = r.dados.token;
  const tokensUsados = [token];
  assert.deepEqual((await api('sessao', { token })).dados, { usuario: 'adm', senhaInicial: true });
  // Todo pedido à API é um POST (é o que qualquer hospedagem repassa), e a sessão só vale dentro do corpo.
  for (const rota of ['entrar', ...ROTAS_COM_SESSAO]) {
    for (const metodo of ['GET', 'PUT', 'DELETE']) {
      const recusa = await api(rota, { metodo, ...(metodo === 'GET' ? {} : { corpo: JSON.stringify({ sessao: token }), tipo: 'application/json' }) });
      assert.equal(recusa.status, 405, `${metodo} ${rota}`);
      assert.equal(recusa.headers.get('allow'), 'POST', `${metodo} ${rota}`);
      // Quem pede assim é um painel aberto antes da atualização (ele usava GET, PUT e DELETE), e ele mostra na tela o que vier aqui.
      assert.equal(recusa.dados.erro, 'O painel foi atualizado e esta tela ficou antiga: recarregue a página. (Este endereço só aceita pedidos POST.)', `${metodo} ${rota}`);
    }
  }
  assert.equal((await api('sessao', { headers: { Authorization: `Bearer ${token}` } })).status, 401, 'o token em um cabeçalho não abre nada');
  assert.equal((await api('sessao', { corpo: JSON.stringify({ sessao: token }), tipo: 'text/plain' })).status, 415, 'o corpo tem que ser JSON');
  assert.equal((await api('sessao', { token })).status, 200, 'nenhuma dessas recusas derruba a sessão');
  ok('login adm / 142536 abre a sessão; pedidos fora do formato são recusados');

  // ───── textos
  r = await api('conteudo', { token });
  assert.equal(r.status, 200);
  assert.equal(r.dados.versao, 0);
  assert.deepEqual(r.dados.problemas, []);
  r = await api('conteudo/salvar', { token, json: { versao: 0, textos: { 'convite.titulo': 'Título <novo> & "aspas"', 'regras.abertura.titulo1': 'RP sério.' } } });
  assert.equal(r.status, 200);
  assert.equal(r.dados.versao, 1);
  assert.deepEqual(r.dados.enderecos, ENDERECOS, 'o painel recebe os endereços das duas páginas');
  assert.ok((await pagina('/')).includes('<h1 id="title">Título &lt;novo&gt; &amp; "aspas"</h1>'), 'o título novo aparece no início do site');
  const aplicativoNovo = await pagina(`/${ARQUIVOS.js}`);
  assert.ok(aplicativoNovo.includes('children:["RP sério.",'));
  assert.equal(aplicativoNovo.length, PADRAO.js.length + 'RP sério.'.length - 'Roleplay justo.'.length, 'na página de regras só mudou o texto dela');
  assert.equal((await api('conteudo/salvar', { token, json: { versao: 0, textos: {} } })).status, 409);
  r = await api('conteudo/salvar', { token, json: { versao: 1, textos: { 'convite.titulo': 'x'.repeat(400) } } });
  assert.equal(r.status, 400);
  assert.ok(r.dados.erro.includes('300'));
  assert.equal((await api('conteudo/salvar', { corpo: 'x'.repeat(4 * 1024 * 1024 + 10), tipo: 'application/json' })).status, 413);
  ok('salvar textos muda as páginas na hora; conflito de versão e limites de tamanho respondem certo');

  const comprimido = await fetch(`${BASE}/${ARQUIVOS.js}`, { headers: { 'Accept-Encoding': 'gzip' } });
  const etag = comprimido.headers.get('etag');
  assert.equal(comprimido.headers.get('content-encoding'), 'gzip');
  await comprimido.arrayBuffer();
  assert.equal((await fetch(`${BASE}/${ARQUIVOS.js}`, { headers: { 'If-None-Match': etag } })).status, 304);
  const naoAchada = await baixar('/404');
  assert.equal(naoAchada.status, 404);
  assert.ok(naoAchada.corpo.toString('utf8').includes('<div id="root">'));
  for (const caminho of ['/', '/regras/']) {
    const cabeca = await baixar(caminho, { method: 'HEAD' });
    assert.equal(cabeca.status, 200, caminho);
    assert.equal(cabeca.corpo.length, 0, caminho);
    assert.ok(Number(cabeca.headers.get('content-length')) > 1000, `${caminho}: o tamanho da página é anunciado, só o corpo não vem`);
  }
  ok('página montada: compressão, 304 quando não mudou, HEAD e /404');

  // ───── imagens
  const jpg = doSite('fronteira-sul-convite-preview.jpg').subarray(0, 4000); // basta o começo: o servidor só lê o cabeçalho
  const png = pngSimples(300, 200);
  r = await enviarImagem('logo', token, png);
  assert.equal(r.status, 200, r.texto);
  let registro = r.dados.imagens.find((x) => x.id === 'logo').atual;
  assert.deepEqual([registro.tipo, registro.largura, registro.altura, registro.bytes], ['image/png', 300, 200, png.length]);
  for (const caminho of ['/manus-storage/fronteira-sul-logo_1b1b4c2d.webp', '/fronteira-sul-logo.webp', '/favicon.ico']) {
    const img = await baixar(caminho);
    assert.equal(img.tipo, 'image/png', caminho);
    assert.equal(img.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(img.corpo.equals(png), caminho);
  }
  r = await enviarImagem('icone', token, GIF_MINIMO);
  assert.equal(r.dados.imagens.find((x) => x.id === 'icone').atual.tipo, 'image/gif');
  assert.equal((await baixar('/favicon.ico')).tipo, 'image/gif');
  r = await enviarImagem('convite', token, jpg);
  registro = r.dados.imagens.find((x) => x.id === 'convite').atual;
  assert.deepEqual([registro.tipo, registro.largura, registro.altura], ['image/jpeg', 1200, 675]);
  // As páginas pedem cada imagem trocada pela versão do arquivo enviado (para nenhum intermediário entregar a
  // antiga, que ele pode ter guardado), e nesse endereço o servidor entrega a nova.
  {
    const noConvite = /<img class="poster"[^>]* src="([^"]*)"/.exec(await pagina('/'))[1];
    assert.equal(noConvite, `/fronteira-sul-convite-preview.jpg?v=${versaoDaImagem(jpg)}`);
    assert.ok((await baixar(noConvite)).corpo.equals(jpg));
    const aplicativoAgora = await pagina(`/${ARQUIVOS.js}`);
    for (const pedido of [`ng="/manus-storage/fronteira-sul-logo_1b1b4c2d.webp?v=${versaoDaImagem(png)}"`, `o("/fronteira-sul-logo.webp?v=${versaoDaImagem(png)}")`]) {
      assert.equal(aplicativoAgora.split(pedido).length - 1, 1, pedido);
    }
    assert.ok((await baixar(`/fronteira-sul-logo.webp?v=${versaoDaImagem(png)}`)).corpo.equals(png));
    const pedidoDoAplicativo = /<script type="module" crossorigin src="([^"]*)">/.exec(await pagina('/regras/'))[1];
    assert.equal(pedidoDoAplicativo, `/${ARQUIVOS.js}?v=${versaoDe(aplicativoAgora)}`, 'o aplicativo mudou (o logo é outro): a página de regras pede o novo');
    const icones = JSON.parse(await pagina(`/${ARQUIVOS.manifesto}`)).icons.map((i) => i.src);
    assert.deepEqual(icones, [`/favicon.ico?v=${versaoDaImagem(GIF_MINIMO)}`, `/favicon.ico?v=${versaoDaImagem(GIF_MINIMO)}`]);
    assert.ok((await baixar(icones[0])).corpo.equals(GIF_MINIMO));
  }

  // O que decide se é imagem é o conteúdo do arquivo, e não o nome nem o que o navegador diz dele.
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  assert.equal((await enviarImagem('logo', token, svg)).status, 415);
  assert.equal((await enviarImagem('logo', token, Buffer.from('<html><script>alert(1)</script></html> texto'))).status, 415);
  assert.equal((await enviarImagem('logo', token, Buffer.alloc(0))).status, 415);
  assert.equal((await enviarImagem('outra', token, png)).status, 404);
  assert.equal((await enviarImagem('..%2Flogo', token, png)).status, 404);
  // A imagem viaja em base64 dentro do JSON; o que não for base64 inteiro é recusado antes de virar arquivo.
  const emBase64 = png.toString('base64');
  for (const arquivo of [undefined, 123, null, ['a'], emBase64.slice(0, -3), `${emBase64.slice(0, 40)}\n${emBase64.slice(40)}`, `data:image/png;base64,${emBase64}`, `=${emBase64.slice(1)}`, 'não é base64!']) {
    r = await api('imagens/logo', { token, json: { arquivo } });
    assert.equal(r.status, 400, `${String(arquivo).slice(0, 30)}: ${r.texto}`);
  }
  assert.equal((await enviarImagem('logo', undefined, png)).status, 401, 'sem sessão, a imagem não entra');
  // O limite é de 8 MB do arquivo, e não do texto em base64 (que é um terço maior): 8 MB justos entram, um byte a mais não.
  const OITO_MB = 8 * 1024 * 1024;
  const justa = Buffer.concat([png, Buffer.alloc(OITO_MB - png.length)]);
  r = await enviarImagem('convite', token, justa);
  assert.equal(r.status, 200, r.texto);
  assert.equal(r.dados.imagens.find((x) => x.id === 'convite').atual.bytes, OITO_MB);
  assert.ok((await baixar('/fronteira-sul-convite-preview.jpg')).corpo.equals(justa), 'e chega ao site inteira, byte a byte');
  r = await enviarImagem('convite', token, Buffer.concat([justa, Buffer.alloc(1)]));
  assert.equal(r.status, 413);
  assert.ok(r.dados.erro.includes('8 MB'), r.texto);
  r = await enviarImagem('convite', token, jpg);
  assert.equal(r.status, 200, r.texto);
  // Passou bem de 8 MB: o servidor recebe o envio até o fim para o navegador conseguir ler o motivo da recusa.
  r = await enviarImagem('logo', token, Buffer.concat([png, Buffer.alloc(OITO_MB)]));
  assert.equal(r.status, 413);
  assert.ok(r.dados.erro.includes('8 MB'), r.texto);
  assert.equal((await api('sessao', { token })).status, 200, 'a conexão continua boa depois da recusa');
  // Muito acima do limite: recusa só pelo tamanho anunciado, sem receber nada.
  const enorme = await cru('/admin/api/imagens/logo', { metodo: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': String(100 * 1024 * 1024) } });
  assert.equal(enorme.status, 413);
  assert.equal(enorme.headers.connection, 'close');
  r = await api('conteudo', { token });
  assert.equal(r.dados.imagens.find((x) => x.id === 'logo').atual.largura, 300, 'os envios recusados não mexeram no logo');

  await api('imagens/icone/remover', { token });
  assert.equal((await baixar('/favicon.ico')).tipo, 'image/png', 'sem ícone próprio, vale o logo enviado');
  await api('imagens/logo/remover', { token });
  assert.ok((await baixar('/favicon.ico')).corpo.equals(doSite('favicon.ico')));
  ok('imagens: enviar (as páginas pedem a nova pela versão dela), recusar o que não é imagem ou passa de 8 MB, e voltar à original');

  // ───── troca de usuário e senha
  assert.equal((await api('acesso', { token, json: { senhaAtual: 'errada', novaSenha: 'nova-senha-1' } })).status, 403);
  assert.equal((await api('acesso', { token, json: { senhaAtual: '142536', novaSenha: '123' } })).status, 400);
  const outroAparelho = (await entrar('adm', '142536')).dados.token;
  tokensUsados.push(outroAparelho);
  r = await api('acesso', { token, json: { senhaAtual: '142536', novoUsuario: 'Chefe', novaSenha: 'nova-senha-1' } });
  assert.equal(r.status, 200, r.texto);
  assert.deepEqual(r.dados, { usuario: 'chefe', senhaInicial: false });
  assert.equal((await api('sessao', { token })).status, 200);
  assert.equal((await api('sessao', { token: outroAparelho })).status, 401);
  assert.equal((await entrar('adm', '142536')).status, 401);
  assert.equal((await entrar('chefe', 'nova-senha-1')).status, 200);
  ok('trocar usuário e senha: a senha antiga para de valer e os outros aparelhos saem');

  // ───── reinício
  await descer();
  await subir();
  assert.equal((await api('sessao', { token })).status, 401);
  assert.equal((await entrar('adm', '142536')).status, 401);
  r = await entrar('chefe', 'nova-senha-1');
  assert.equal(r.status, 200);
  const token2 = r.dados.token;
  tokensUsados.push(token2);
  assert.ok((await pagina('/')).includes('<h1 id="title">Título &lt;novo&gt; &amp; "aspas"</h1>'));
  assert.ok((await baixar('/fronteira-sul-convite-preview.jpg')).corpo.equals(jpg));
  assert.ok(!processo.saida().includes('senha inicial'));
  ok('depois de reiniciar: textos, imagem e o novo acesso continuam');

  // ───── histórico e restauração
  r = await api('conteudo/salvar', { token: token2, json: { textos: { 'convite.titulo': 'Segunda versão' } } });
  assert.ok(r.dados.historico.length >= 1);
  r = await api(`historico/${r.dados.historico[0].id}/restaurar`, { token: token2 });
  assert.equal(r.status, 200);
  assert.equal(r.dados.textos['convite.titulo'], 'Título <novo> & "aspas"');
  assert.equal((await api('historico/999999/restaurar', { token: token2 })).status, 404);
  r = await api('restaurar-original', { token: token2 });
  assert.equal(r.status, 200);
  assert.deepEqual(r.dados.textos, {});
  for (const rel of ['fronteira-sul-convite-preview.jpg', 'favicon.ico']) {
    assert.ok((await baixar(`/${rel}`)).corpo.equals(doSite(rel)), rel);
  }
  assert.equal(await pagina('/'), PADRAO.convite);
  assert.equal(await pagina('/regras/'), PADRAO.index);
  assert.equal(await pagina(`/${ARQUIVOS.js}`), PADRAO.js);
  assert.equal((await entrar('chefe', 'nova-senha-1')).status, 200, 'restaurar o site não mexe no acesso');
  ok('histórico e "restaurar o site original" devolvem os arquivos byte a byte');

  // ───── o link de volta ao convite, na página de regras
  // O texto muda pelo painel, na hora, e vazio tira o link.
  r = await api('conteudo', { token: token2 });
  assert.deepEqual(r.dados.textos, {});
  assert.equal(r.dados.campos.find((f) => f.id === 'regras.voltar.texto').original, 'Voltar ao convite');
  r = await api('conteudo/salvar', { token: token2, json: { versao: r.dados.versao, textos: { 'regras.voltar.texto': 'Início' } } });
  assert.equal(r.status, 200, r.texto);
  assert.equal(await pagina(`/${ARQUIVOS.js}`), comOLinkDeVolta('Início').js);
  assert.equal(await pagina('/regras/'), comOLinkDeVolta('Início').index, 'a página de regras passa a pedir o aplicativo novo, pela versão dele');
  r = await api('conteudo/salvar', { token: token2, json: { versao: r.dados.versao, textos: { 'regras.voltar.texto': '' } } });
  assert.equal(r.status, 200, r.texto);
  assert.equal(await pagina(`/${ARQUIVOS.js}`), SEM_O_LINK_DE_VOLTA.js);
  assert.equal(await pagina('/regras/'), SEM_O_LINK_DE_VOLTA.index);
  assert.ok(!(await pagina('/regras/')).includes('voltar-ao-convite') && !(await pagina(`/${ARQUIVOS.js}`)).includes('voltar-ao-convite'));
  assert.equal(await pagina('/'), PADRAO.convite, 'a página do convite não muda com o link');
  r = await api('conteudo/salvar', { token: token2, json: { versao: r.dados.versao, textos: {} } });
  assert.equal(r.status, 200, r.texto);
  assert.equal(await pagina(`/${ARQUIVOS.js}`), PADRAO.js);
  assert.equal(await pagina('/regras/'), PADRAO.index);
  ok('link de volta ao convite: pelo painel, o texto muda na hora, e vazio tira o link da página de regras');

  // ───── a entrada do painel para os visitantes: a etiqueta "Admin" do convite e a aba "Admin" das regras
  r = await api('conteudo', { token: token2 });
  const chaveDoAdmin = r.dados.interruptores.find((i) => i.opcao === 'abaAdmin');
  assert.deepEqual([chaveDoAdmin.pagina, chaveDoAdmin.grupo, chaveDoAdmin.rotulo, r.dados.opcoes.abaAdmin], ['regras', 'Abas', 'Mostrar “Admin” para os visitantes', true]);
  const marcaComAdmin = (await baixar('/')).headers.get('etag');
  r = await api('conteudo/salvar', { token: token2, json: { versao: r.dados.versao, opcoes: { abaAdmin: false } } });
  assert.equal(r.status, 200, r.texto);
  assert.equal((await fetch(`${BASE}/`, { headers: { 'If-None-Match': marcaComAdmin } })).status, 200, 'o navegador não fica com o convite antigo guardado');
  assert.equal(await pagina('/'), SEM_A_ENTRADA_DO_ADMIN.convite);
  assert.equal(await pagina(`/${ARQUIVOS.js}`), SEM_A_ENTRADA_DO_ADMIN.js);
  assert.equal(await pagina('/regras/'), SEM_A_ENTRADA_DO_ADMIN.index);
  assert.ok(!((await pagina('/')) + (await pagina(`/${ARQUIVOS.js}`)) + (await pagina('/regras/'))).includes('/admin/'), 'desligada, nenhuma página aponta para o painel');
  assert.equal((await baixar('/admin/')).status, 200, 'e o painel continua abrindo pelo endereço');
  r = await api('conteudo/salvar', { token: token2, json: { versao: r.dados.versao, opcoes: { abaAdmin: true } } });
  assert.equal(r.status, 200, r.texto);
  assert.equal(await pagina('/'), PADRAO.convite);
  assert.equal(await pagina(`/${ARQUIVOS.js}`), PADRAO.js);
  ok('opção "Mostrar “Admin” para os visitantes": a etiqueta do convite e a aba das regras somem e voltam juntas, na hora');

  // ───── a opção "Começar o site pelo convite"
  const marcaDoInicio = (await baixar('/')).headers.get('etag');
  assert.equal((await fetch(`${BASE}/`, { headers: { 'If-None-Match': marcaDoInicio } })).status, 304);
  r = await api('conteudo', { token: token2 });
  r = await api('conteudo/salvar', { token: token2, json: { versao: r.dados.versao, opcoes: { conviteNoInicio: false } } });
  assert.equal(r.status, 200, r.texto);
  assert.deepEqual(r.dados.enderecos, ENDERECOS_DO_ORIGINAL);
  // Desligada, as páginas ficam onde estavam no site original, e a troca vale no pedido seguinte.
  assert.equal((await fetch(`${BASE}/`, { headers: { 'If-None-Match': marcaDoInicio } })).status, 200, 'o navegador não fica com o convite guardado no lugar das regras');
  for (const caminho of ['/', '/index.html', '/uma-rota-qualquer']) assert.equal(await pagina(caminho), SEM_COMECAR_PELO_CONVITE.index, caminho);
  assert.equal(await pagina(`/${ARQUIVOS.js}`), SEM_COMECAR_PELO_CONVITE.js);
  for (const caminho of ['/convite', '/convite/', '/convite/index.html']) {
    assert.ok((await baixar(caminho)).corpo.equals(doSite('convite/index.html')), `${caminho}: a página do convite, byte a byte como a cópia`);
    assert.equal((await semSeguir(caminho))[0], 200, caminho);
  }
  // "/regras/" continua valendo (um link para as regras serve nos dois casos): leva para "/".
  for (const caminho of ['/regras', '/regras/', '/Regras/']) {
    assert.deepEqual(await semSeguir(caminho), [302, '/', 0], caminho);
    assert.equal(await pagina(caminho), SEM_COMECAR_PELO_CONVITE.index, `${caminho}: seguindo, chega às regras`);
  }
  assert.deepEqual(await semSeguir('/regras/?busca=rdm'), [302, '/?busca=rdm', 0]);
  // Ligada de novo, o site volta a começar pelo convite.
  r = await api('conteudo/salvar', { token: token2, json: { versao: r.dados.versao, opcoes: { conviteNoInicio: true } } });
  assert.deepEqual(r.dados.enderecos, ENDERECOS);
  assert.equal(await pagina('/'), PADRAO.convite);
  assert.equal(await pagina('/regras/'), PADRAO.index);
  assert.equal(await pagina(`/${ARQUIVOS.js}`), PADRAO.js);
  assert.deepEqual(await semSeguir('/convite/'), [302, '/', 0]);
  // Com o endereço do site preenchido, o mapa do site lista as duas páginas.
  r = await api('conteudo/salvar', { token: token2, json: { versao: r.dados.versao, opcoes: { enderecoPublico: 'https://cidade.exemplo' } } });
  assert.equal(r.status, 200, r.texto);
  assert.deepEqual([...(await pagina('/sitemap.xml')).matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]), ['https://cidade.exemplo/', 'https://cidade.exemplo/regras/']);
  assert.ok((await pagina('/')).includes('<link rel="canonical" href="https://cidade.exemplo/" />'));
  assert.ok((await pagina('/regras/')).includes('<link rel="canonical" href="https://cidade.exemplo/regras/" />'));
  ok('opção "Começar o site pelo convite": desligada, o site volta aos endereços do original; ligada, volta a começar pelo convite');

  assert.equal((await api('sair', { token: token2 })).status, 200);
  assert.equal((await api('sessao', { token: token2 })).status, 401);
  ok('sair encerra a sessão');

  // ───── atrás de um intermediário que só repassa o básico
  // Entre o navegador e o servidor quase sempre há um intermediário: o da hospedagem, o de uma tela de
  // prévia. Este é o mais pobre que ainda entrega um site: só deixa passar GET, HEAD e POST e, dos
  // cabeçalhos do pedido, só repassa o tipo e o tamanho do corpo. (Foi atrás de um que não entregava o
  // cabeçalho "Authorization" que o painel aceitava o login e, no pedido seguinte, dizia "sua sessão
  // terminou".) O painel tem que funcionar inteiro através dele.
  const intermediario = http.createServer((req, res) => {
    if (!['GET', 'HEAD', 'POST'].includes(req.method)) {
      res.writeHead(405, { 'Content-Length': 0, 'X-Recusado-Por': 'intermediario' });
      req.resume();
      return res.end();
    }
    const headers = {};
    for (const nome of ['content-type', 'content-length']) if (req.headers[nome] !== undefined) headers[nome] = req.headers[nome];
    const adiante = http.request({ host: '127.0.0.1', port: PORTA, method: req.method, path: req.url, headers }, (r) => {
      res.writeHead(r.statusCode, r.headers);
      r.pipe(res);
    });
    adiante.on('error', () => {
      if (!res.headersSent) res.writeHead(502, { 'Content-Length': 0 });
      res.end();
    });
    req.pipe(adiante);
  });
  await new Promise((r) => intermediario.listen(0, '127.0.0.1', r));
  try {
    const base = `http://127.0.0.1:${intermediario.address().port}`;
    const por = (rota, opcoes = {}) => api(rota, { ...opcoes, base });
    // Ele é mesmo tão pobre quanto foi dito: PUT e DELETE param nele, e um cabeçalho com o token não chega.
    for (const metodo of ['PUT', 'DELETE']) assert.equal((await por('sessao', { metodo, corpo: '{}', tipo: 'application/json' })).headers.get('x-recusado-por'), 'intermediario', metodo);
    assert.equal((await fetch(`${base}/`)).status, 200);
    r = await entrar('chefe', 'nova-senha-1', base);
    assert.equal(r.status, 200, r.texto);
    const token3 = r.dados.token;
    // O pedido logo depois do login: era aqui que o painel parava.
    r = await por('conteudo', { token: token3 });
    assert.equal(r.status, 200, r.texto);
    assert.deepEqual((await por('sessao', { token: token3 })).dados, { usuario: 'chefe', senhaInicial: false });
    r = await por('conteudo/salvar', { token: token3, json: { versao: r.dados.versao, textos: { 'convite.titulo': 'Pelo intermediário' } } });
    assert.equal(r.status, 200, r.texto);
    assert.ok((await pagina('/')).includes('<h1 id="title">Pelo intermediário</h1>'));
    r = await enviarImagem('logo', token3, png, base);
    assert.equal(r.status, 200, r.texto);
    assert.ok((await baixar('/fronteira-sul-logo.webp')).corpo.equals(png));
    r = await por('imagens/logo/remover', { token: token3 });
    assert.equal(r.status, 200, r.texto);
    assert.ok((await baixar('/fronteira-sul-logo.webp')).corpo.equals(doSite('fronteira-sul-logo.webp')));
    r = await por(`historico/${r.dados.historico[0].id}/restaurar`, { token: token3 });
    assert.equal(r.status, 200, r.texto);
    r = await por('acesso', { token: token3, json: { senhaAtual: 'nova-senha-1', novoUsuario: 'chefia' } });
    assert.deepEqual([r.status, r.dados], [200, { usuario: 'chefia', senhaInicial: false }], r.texto);
    r = await por('acesso', { token: token3, json: { senhaAtual: 'nova-senha-1', novoUsuario: 'chefe' } });
    assert.equal(r.status, 200, r.texto);
    r = await por('restaurar-original', { token: token3 });
    assert.equal(r.status, 200, r.texto);
    assert.equal(await pagina('/'), PADRAO.convite);
    assert.equal((await por('sair', { token: token3 })).status, 200);
    assert.equal((await por('sessao', { token: token3 })).status, 401);
    tokensUsados.push(token3);
  } finally {
    intermediario.close();
    intermediario.closeAllConnections();
  }
  // O painel fala com o servidor por um caminho só, e esse caminho é o que o teste acima percorreu.
  const painelJs = fs.readFileSync(path.join(RAIZ, 'admin', 'painel', 'painel.js'), 'utf8');
  assert.deepEqual(painelJs.match(/\bfetch\([^\n]*/g), ["fetch(`/admin/api/${rota}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo), cache: 'no-store' });"]);
  assert.ok(painelJs.includes("const corpo = rota === 'entrar' ? pedido : { sessao: token, ...pedido };"), 'a sessão vai dentro do corpo');
  assert.ok(!/XMLHttpRequest|sendBeacon|EventSource|WebSocket|<form/.test(painelJs));
  ok('painel atrás de um intermediário que só repassa POST e o corpo: login, textos, imagens, histórico, acesso e sair funcionam');

  // ───── o registro do servidor diz por que um pedido do painel foi recusado
  // É o que se vê no terminal quando alguém diz "a senha está certa e não entra": o login aceito e, logo
  // depois, um pedido recusado. A nota ao lado conta se o pedido chegou sem a sessão ou com uma que não vale.
  {
    const porta = await portaLivre();
    const outro = await iniciar(porta, pastaTemporaria(), { registro: true });
    try {
      const base = `http://127.0.0.1:${porta}`;
      const sessao = (await entrar('adm', '142536', base)).dados.token;
      assert.equal((await api('conteudo', { token: sessao, base })).status, 200);
      assert.equal((await api('conteudo', { base })).status, 401);
      assert.equal((await api('conteudo', { token: 'a'.repeat(43), base })).status, 401);
      assert.equal((await api('conteudo', { metodo: 'GET', headers: { Authorization: `Bearer ${sessao}` }, base })).status, 405);
      // (a linha de um pedido é escrita depois da resposta: a última pode demorar um instante para chegar aqui)
      for (let i = 0; i < 150 && !outro.saida().includes('405  GET /admin/api/conteudo'); i++) await new Promise((r) => setTimeout(r, 20));
      const linhas = outro
        .saida()
        .split('\n')
        .filter((linha) => linha.includes('/admin/api/'))
        .map((linha) => linha.replace(/^\d\d:\d\d:\d\d {2}/, ''));
      assert.deepEqual(linhas, [
        '200  POST /admin/api/entrar',
        '200  POST /admin/api/conteudo',
        '401  POST /admin/api/conteudo  (pedido sem sessão)',
        '401  POST /admin/api/conteudo  (sessão desconhecida ou vencida)',
        '405  GET /admin/api/conteudo',
      ]);
      assert.ok(!outro.saida().includes(sessao) && !outro.saida().includes('142536'), 'o token e a senha não aparecem no registro');
    } finally {
      await parar(outro);
    }
  }
  ok('registro do servidor: um pedido do painel recusado traz o motivo (sem sessão, ou sessão que não vale); token e senha não aparecem');

  // ───── limite de tentativas
  for (let i = 0; i < 5; i++) assert.equal((await entrar('chefe', `errada-${i}`)).status, 401);
  r = await entrar('chefe', 'nova-senha-1');
  assert.equal(r.status, 429);
  assert.match(r.dados.erro, /Espere \d+ segundos/);
  assert.ok(r.dados.esperar > 0 && r.dados.esperar <= 30);
  ok('depois de 5 senhas erradas, nem a senha certa entra antes da espera');

  assert.deepEqual(fs.readdirSync(DADOS).sort(), ['acesso.json', 'conteudo.json', 'historico', 'imagens']);
  assert.ok(!fs.readFileSync(path.join(DADOS, 'acesso.json'), 'utf8').includes('nova-senha-1'));
  // O token da sessão vai no corpo dos pedidos, junto com o que é salvo: ele abre a porta e para aí, sem ir para o disco.
  const noDisco = fs.readdirSync(DADOS, { recursive: true, withFileTypes: true }).filter((item) => item.isFile());
  assert.ok(noDisco.length >= 3 && tokensUsados.length === 4);
  for (const item of noDisco) {
    const texto = fs.readFileSync(path.join(item.parentPath ?? item.path, item.name), 'latin1');
    for (const usado of tokensUsados) assert.ok(!texto.includes(usado), `${item.name} guarda um token de sessão`);
    assert.ok(!texto.includes('"sessao"'), `${item.name} guarda o campo da sessão`);
  }
  assert.deepEqual(retratoDoSite(), siteAntes);
  ok('tudo fica na pasta de dados (a senha não fica escrita nela); nenhum arquivo de site/ foi tocado');
} finally {
  await descer();
}

resumo();
