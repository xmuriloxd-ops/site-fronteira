// Testa o servidor de verdade, por HTTP: páginas, login, painel, imagens e o que não pode ser entregue.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { analisarImagem } from '../imagem.mjs';
import { ARQUIVOS } from '../mapa.mjs';
import { CREDITOS_DA_COPIA, GIF_MINIMO, PADRAO, RAIZ, SITE, ok, pastaTemporaria, pngSimples, resumo } from './apoio.mjs';

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

// ───── servidor
const PORTA = await new Promise((resolver) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => {
    const { port } = s.address();
    s.close(() => resolver(port));
  });
});
const BASE = `http://127.0.0.1:${PORTA}`;
let processo = null;

async function subir() {
  // Só as variáveis do teste: nada do ambiente de quem roda muda o resultado.
  const env = { ...process.env, PORT: String(PORTA), HOST: '127.0.0.1', DADOS_DIR: DADOS, SILENCIOSO: '1' };
  for (const nome of ['SITE_DIR', 'ADMIN_USUARIO', 'ADMIN_SENHA', 'CONFIAR_NO_PROXY']) delete env[nome];
  processo = spawn(process.execPath, [path.join(RAIZ, 'servidor.mjs')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let saida = '';
  processo.stdout.on('data', (d) => (saida += d));
  processo.stderr.on('data', (d) => (saida += d));
  processo.saida = () => saida;
  for (let i = 0; i < 200; i++) {
    if (processo.exitCode !== null) break;
    try {
      await fetch(`${BASE}/robots.txt`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  throw new Error(`o servidor não subiu:\n${saida}`);
}

async function descer() {
  if (!processo || processo.exitCode !== null) return;
  const fim = new Promise((r) => processo.once('exit', r));
  processo.kill('SIGTERM');
  await fim;
}

async function api(metodo, rota, { token, json, corpo, tipo } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  } else if (corpo !== undefined) {
    headers['Content-Type'] = tipo || 'application/octet-stream';
    body = corpo;
  }
  const r = await fetch(`${BASE}/admin/api/${rota}`, { method: metodo, headers, body });
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
const entrar = (usuario, senha) => api('POST', 'entrar', { json: { usuario, senha } });

try {
  await subir();
  assert.ok(processo.saida().includes('senha inicial'), 'ao iniciar, o servidor avisa que a senha inicial está em uso');

  // ───── o site, sem nenhuma alteração feita pelo painel
  // A página de regras e o aplicativo dela saem com o que o projeto mudou na cópia
  // (convite no início, créditos e aba Admin); todo o resto, byte a byte como a cópia.
  const aplicativo = (await baixar(`/${ARQUIVOS.js}`)).corpo.toString('utf8');
  assert.equal(aplicativo, PADRAO.js);
  for (const caminho of ['/', '/index.html', '/uma-rota-qualquer', '/404']) assert.equal((await baixar(caminho)).corpo.toString('utf8'), PADRAO.index, caminho);
  // Na página do convite, só o destino do botão muda: abre a página de regras já depois do convite.
  for (const caminho of ['/convite', '/convite/', '/convite/index.html']) assert.equal((await baixar(caminho)).corpo.toString('utf8'), PADRAO.convite, caminho);
  for (const rel of Object.values(ARQUIVOS).concat('assets/index-DMP8NyHf.css', 'favicon.ico', 'fronteira-sul-convite-preview.jpg')) {
    if (rel === ARQUIVOS.js || rel === ARQUIVOS.index || rel === ARQUIVOS.convite) continue;
    assert.equal(resumoDe((await baixar(`/${rel}`)).corpo), resumoDe(doSite(rel)), rel);
  }
  assert.ok(aplicativo.includes('href:"/admin/"'));
  assert.ok(aplicativo.includes('className:"site-shell",children:[R.jsx("section",{className:"fs-convite"'), 'o convite abre a página de regras');
  assert.ok(aplicativo.includes('children:"MURILO MENDES"') && aplicativo.includes('navigator.clipboard.writeText("sgtmendes1997_29726")'));
  for (const antigo of Object.values(CREDITOS_DA_COPIA)) assert.ok(!aplicativo.includes(antigo), 'os créditos da cópia não são entregues');
  for (const [caminho, status, tipo] of [
    ['/', 200, 'text/html; charset=utf-8'],
    ['/convite', 200, 'text/html; charset=utf-8'],
    ['/convite/', 200, 'text/html; charset=utf-8'],
    ['/uma-rota-qualquer', 200, 'text/html; charset=utf-8'],
    ['/404', 404, 'text/html; charset=utf-8'],
    ['/nao-existe.png', 404, null],
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
  assert.equal((await fetch(`${BASE}/`, { method: 'POST' })).status, 405);
  assert.equal((await fetch(`${BASE}/admin/`, { method: 'POST' })).status, 405);
  ok('site sem alterações do painel: a cópia mais o convite no início, os créditos novos e a aba Admin; mesmas respostas do servidor original');

  const painel = await baixar('/admin/');
  assert.ok(painel.headers.get('content-security-policy').includes("script-src 'self'"));
  assert.equal(painel.headers.get('x-robots-tag'), 'noindex, nofollow');
  ok('painel: só carrega arquivos do próprio servidor e fica fora dos buscadores');

  // ───── sem login
  for (const [metodo, rota] of [
    ['GET', 'sessao'],
    ['GET', 'conteudo'],
    ['PUT', 'conteudo'],
    ['PUT', 'imagens/logo'],
    ['DELETE', 'imagens/logo'],
    ['POST', 'acesso'],
    ['POST', 'sair'],
    ['POST', 'restaurar-original'],
    ['POST', 'historico/1/restaurar'],
    ['GET', 'qualquer'],
  ]) {
    const r = await api(metodo, rota, metodo === 'GET' ? {} : { json: {} });
    assert.equal(r.status, 401, `${metodo} ${rota}`);
    assert.ok(r.dados.erro);
    assert.equal(r.headers.get('cache-control'), 'no-store');
  }
  for (const token of ['x', 'a'.repeat(43), '../../etc/passwd']) assert.equal((await api('GET', 'conteudo', { token })).status, 401);
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
  assert.equal((await api('GET', 'entrar')).status, 405);
  assert.equal((await api('POST', 'entrar', { corpo: 'usuario=adm&senha=142536', tipo: 'application/x-www-form-urlencoded' })).status, 415);
  assert.equal((await api('POST', 'entrar', { corpo: '{"usuario":', tipo: 'application/json' })).status, 400);
  assert.equal((await api('POST', 'entrar', { json: [] })).status, 400);
  assert.equal((await api('POST', 'entrar', { json: { usuario: 'adm' } })).status, 400);
  let r = await entrar('adm', '000000');
  assert.equal(r.status, 401);
  assert.equal(r.dados.erro, 'Usuário ou senha incorretos.');
  r = await entrar('adm', '142536');
  assert.equal(r.status, 200);
  assert.equal(r.dados.senhaInicial, true);
  const token = r.dados.token;
  assert.deepEqual((await api('GET', 'sessao', { token })).dados, { usuario: 'adm', senhaInicial: true });
  ok('login adm / 142536 abre a sessão; pedidos fora do formato são recusados');

  // ───── textos
  r = await api('GET', 'conteudo', { token });
  assert.equal(r.status, 200);
  assert.equal(r.dados.versao, 0);
  assert.deepEqual(r.dados.problemas, []);
  r = await api('PUT', 'conteudo', { token, json: { versao: 0, textos: { 'convite.titulo': 'Título <novo> & "aspas"', 'regras.abertura.titulo1': 'RP sério.' } } });
  assert.equal(r.status, 200);
  assert.equal(r.dados.versao, 1);
  assert.ok((await baixar('/convite/')).corpo.toString('utf8').includes('<h1 id="title">Título &lt;novo&gt; &amp; "aspas"</h1>'));
  const aplicativoNovo = (await baixar(`/${ARQUIVOS.js}`)).corpo.toString('utf8');
  assert.ok(aplicativoNovo.includes('children:["RP sério.",'));
  assert.ok(aplicativoNovo.includes('className:"fs-convite-titulo",children:"Título <novo> & \\"aspas\\""'), 'o convite do início acompanha o texto da página /convite/');
  assert.equal((await api('PUT', 'conteudo', { token, json: { versao: 0, textos: {} } })).status, 409);
  r = await api('PUT', 'conteudo', { token, json: { versao: 1, textos: { 'convite.titulo': 'x'.repeat(400) } } });
  assert.equal(r.status, 400);
  assert.ok(r.dados.erro.includes('300'));
  assert.equal((await api('PUT', 'conteudo', { token, corpo: 'x'.repeat(4 * 1024 * 1024 + 10), tipo: 'application/json' })).status, 413);
  assert.equal((await api('POST', 'conteudo', { token, json: {} })).status, 405);
  ok('salvar textos muda as páginas na hora; conflito de versão e limites de tamanho respondem certo');

  const comprimido = await fetch(`${BASE}/${ARQUIVOS.js}`, { headers: { 'Accept-Encoding': 'gzip' } });
  const etag = comprimido.headers.get('etag');
  assert.equal(comprimido.headers.get('content-encoding'), 'gzip');
  await comprimido.arrayBuffer();
  assert.equal((await fetch(`${BASE}/${ARQUIVOS.js}`, { headers: { 'If-None-Match': etag } })).status, 304);
  const naoAchada = await baixar('/404');
  assert.equal(naoAchada.status, 404);
  assert.ok(naoAchada.corpo.toString('utf8').includes('<div id="root">'));
  const cabeca = await baixar('/convite/', { method: 'HEAD' });
  assert.equal(cabeca.status, 200);
  assert.equal(cabeca.corpo.length, 0);
  ok('página montada: compressão, 304 quando não mudou, HEAD e /404');

  // ───── imagens
  const jpg = doSite('fronteira-sul-convite-preview.jpg').subarray(0, 4000); // basta o começo: o servidor só lê o cabeçalho
  const png = pngSimples(300, 200);
  r = await api('PUT', 'imagens/logo', { token, corpo: png, tipo: 'text/plain' }); // o tipo informado não importa: vale o conteúdo
  assert.equal(r.status, 200, r.texto);
  let registro = r.dados.imagens.find((x) => x.id === 'logo').atual;
  assert.deepEqual([registro.tipo, registro.largura, registro.altura, registro.bytes], ['image/png', 300, 200, png.length]);
  for (const caminho of ['/manus-storage/fronteira-sul-logo_1b1b4c2d.webp', '/fronteira-sul-logo.webp', '/favicon.ico']) {
    const img = await baixar(caminho);
    assert.equal(img.tipo, 'image/png', caminho);
    assert.equal(img.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(img.corpo.equals(png), caminho);
  }
  r = await api('PUT', 'imagens/icone', { token, corpo: GIF_MINIMO, tipo: 'image/gif' });
  assert.equal(r.dados.imagens.find((x) => x.id === 'icone').atual.tipo, 'image/gif');
  assert.equal((await baixar('/favicon.ico')).tipo, 'image/gif');
  r = await api('PUT', 'imagens/convite', { token, corpo: jpg, tipo: 'image/jpeg' });
  registro = r.dados.imagens.find((x) => x.id === 'convite').atual;
  assert.deepEqual([registro.tipo, registro.largura, registro.altura], ['image/jpeg', 1200, 675]);

  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  assert.equal((await api('PUT', 'imagens/logo', { token, corpo: svg, tipo: 'image/svg+xml' })).status, 415);
  assert.equal((await api('PUT', 'imagens/logo', { token, corpo: Buffer.from('<html><script>alert(1)</script></html> texto'), tipo: 'image/png' })).status, 415);
  assert.equal((await api('PUT', 'imagens/logo', { token, corpo: Buffer.alloc(0), tipo: 'image/png' })).status, 415);
  assert.equal((await api('PUT', 'imagens/outra', { token, corpo: png, tipo: 'image/png' })).status, 404);
  assert.equal((await api('PUT', 'imagens/..%2Flogo', { token, corpo: png, tipo: 'image/png' })).status, 404);
  // Passou de 8 MB: o servidor recebe o envio até o fim para o navegador conseguir ler o motivo da recusa.
  r = await api('PUT', 'imagens/logo', { token, corpo: Buffer.concat([png, Buffer.alloc(8 * 1024 * 1024)]), tipo: 'image/png' });
  assert.equal(r.status, 413);
  assert.ok(r.dados.erro.includes('8 MB'), r.texto);
  assert.equal((await api('GET', 'sessao', { token })).status, 200, 'a conexão continua boa depois da recusa');
  // Muito acima do limite: recusa só pelo tamanho anunciado, sem receber nada.
  const enorme = await cru('/admin/api/imagens/logo', { metodo: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/png', 'Content-Length': String(70 * 1024 * 1024) } });
  assert.equal(enorme.status, 413);
  assert.equal(enorme.headers.connection, 'close');
  r = await api('GET', 'conteudo', { token });
  assert.equal(r.dados.imagens.find((x) => x.id === 'logo').atual.largura, 300, 'os envios recusados não mexeram no logo');

  await api('DELETE', 'imagens/icone', { token });
  assert.equal((await baixar('/favicon.ico')).tipo, 'image/png', 'sem ícone próprio, vale o logo enviado');
  await api('DELETE', 'imagens/logo', { token });
  assert.ok((await baixar('/favicon.ico')).corpo.equals(doSite('favicon.ico')));
  ok('imagens: enviar, recusar o que não é imagem ou passa de 8 MB, e voltar à original');

  // ───── troca de usuário e senha
  assert.equal((await api('POST', 'acesso', { token, json: { senhaAtual: 'errada', novaSenha: 'nova-senha-1' } })).status, 403);
  assert.equal((await api('POST', 'acesso', { token, json: { senhaAtual: '142536', novaSenha: '123' } })).status, 400);
  const outroAparelho = (await entrar('adm', '142536')).dados.token;
  r = await api('POST', 'acesso', { token, json: { senhaAtual: '142536', novoUsuario: 'Chefe', novaSenha: 'nova-senha-1' } });
  assert.equal(r.status, 200, r.texto);
  assert.deepEqual(r.dados, { usuario: 'chefe', senhaInicial: false });
  assert.equal((await api('GET', 'sessao', { token })).status, 200);
  assert.equal((await api('GET', 'sessao', { token: outroAparelho })).status, 401);
  assert.equal((await entrar('adm', '142536')).status, 401);
  assert.equal((await entrar('chefe', 'nova-senha-1')).status, 200);
  ok('trocar usuário e senha: a senha antiga para de valer e os outros aparelhos saem');

  // ───── reinício
  await descer();
  await subir();
  assert.equal((await api('GET', 'sessao', { token })).status, 401);
  assert.equal((await entrar('adm', '142536')).status, 401);
  r = await entrar('chefe', 'nova-senha-1');
  assert.equal(r.status, 200);
  const token2 = r.dados.token;
  assert.ok((await baixar('/convite/')).corpo.toString('utf8').includes('<h1 id="title">Título &lt;novo&gt; &amp; "aspas"</h1>'));
  assert.ok((await baixar('/fronteira-sul-convite-preview.jpg')).corpo.equals(jpg));
  assert.ok(!processo.saida().includes('senha inicial'));
  ok('depois de reiniciar: textos, imagem e o novo acesso continuam');

  // ───── histórico e restauração
  r = await api('PUT', 'conteudo', { token: token2, json: { textos: { 'convite.titulo': 'Segunda versão' } } });
  assert.ok(r.dados.historico.length >= 1);
  r = await api('POST', `historico/${r.dados.historico[0].id}/restaurar`, { token: token2 });
  assert.equal(r.status, 200);
  assert.equal(r.dados.textos['convite.titulo'], 'Título <novo> & "aspas"');
  assert.equal((await api('POST', 'historico/999999/restaurar', { token: token2 })).status, 404);
  r = await api('POST', 'restaurar-original', { token: token2 });
  assert.equal(r.status, 200);
  assert.deepEqual(r.dados.textos, {});
  for (const rel of ['fronteira-sul-convite-preview.jpg', 'favicon.ico']) {
    assert.ok((await baixar(`/${rel}`)).corpo.equals(doSite(rel)), rel);
  }
  assert.equal((await baixar('/convite/')).corpo.toString('utf8'), PADRAO.convite);
  assert.equal((await baixar('/index.html')).corpo.toString('utf8'), PADRAO.index);
  assert.equal((await baixar(`/${ARQUIVOS.js}`)).corpo.toString('utf8'), PADRAO.js);
  assert.equal((await entrar('chefe', 'nova-senha-1')).status, 200, 'restaurar o site não mexe no acesso');
  ok('histórico e "restaurar o site original" devolvem os arquivos byte a byte');

  assert.equal((await api('POST', 'sair', { token: token2 })).status, 200);
  assert.equal((await api('GET', 'sessao', { token: token2 })).status, 401);
  ok('sair encerra a sessão');

  // ───── limite de tentativas
  for (let i = 0; i < 5; i++) assert.equal((await entrar('chefe', `errada-${i}`)).status, 401);
  r = await entrar('chefe', 'nova-senha-1');
  assert.equal(r.status, 429);
  assert.match(r.dados.erro, /Espere \d+ segundos/);
  assert.ok(r.dados.esperar > 0 && r.dados.esperar <= 30);
  ok('depois de 5 senhas erradas, nem a senha certa entra antes da espera');

  assert.deepEqual(fs.readdirSync(DADOS).sort(), ['acesso.json', 'conteudo.json', 'historico', 'imagens']);
  assert.ok(!fs.readFileSync(path.join(DADOS, 'acesso.json'), 'utf8').includes('nova-senha-1'));
  assert.deepEqual(retratoDoSite(), siteAntes);
  ok('tudo fica na pasta de dados (a senha não fica escrita nela); nenhum arquivo de site/ foi tocado');
} finally {
  await descer();
}

resumo();
