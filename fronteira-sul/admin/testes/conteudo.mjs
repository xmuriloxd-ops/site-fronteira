// Testa a parte que guarda as alterações e monta as páginas (../conteudo.mjs).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { criarConteudo, ErroDeConteudo } from '../conteudo.mjs';
import { alturasDeTelaBaixa, cabecaDoInicio } from '../convite-no-inicio.mjs';
import { ARQUIVOS, CAMPOS, IDS_RESERVADOS, ORIGEM_ORIGINAL } from '../mapa.mjs';
import {
  ABA_ADMIN,
  BASE_ENTREGUE,
  BASE_NA_COPIA,
  CABECA_DO_INICIO,
  CLIQUE_NA_IMAGEM,
  COPIA,
  CREDITOS_DA_COPIA,
  ENDERECOS,
  ENDERECOS_DO_ORIGINAL,
  ESTILO_DO_LINK_DE_VOLTA,
  ESTILO_DO_LINK_DO_ADMIN,
  IMAGEM_DO_CONVITE,
  LINK_DE_VOLTA,
  LINK_DO_ADMIN,
  PADRAO,
  SEM_A_ENTRADA_DO_ADMIN,
  SEM_COMECAR_PELO_CONVITE,
  SEM_O_LINK_DE_VOLTA,
  SITE,
  semSeloDaManus,
  VOLTAR_ENTREGUE,
  VOLTAR_NA_COPIA,
  comAImagemTrocada,
  comOLinkDeVolta,
  copiaDoSite,
  esconderLinha,
  linkDeVolta,
  ok,
  pastaTemporaria,
  pedindoOAplicativo,
  pngSimples,
  resumo,
  versaoDaImagem,
  versaoDe,
} from './apoio.mjs';

/** Quantas vezes `trecho` aparece em `texto`. */
const vezes = (texto, trecho) => texto.split(trecho).length - 1;

/** O botão da página do convite: [destino, texto]. */
function botaoDoConvite(html) {
  const achados = [...html.matchAll(/<a class="button" href="([^"]*)">([^<]*)<\/a>/g)];
  assert.equal(achados.length, 1, 'a página do convite tem um botão só');
  return [achados[0][1], achados[0][2]];
}

/** Os links de uma página, na ordem em que aparecem (que é a da tecla Tab): [classe, destino, texto]. */
const linksDe = (html) => [...html.matchAll(/<a class="([^"]*)" href="([^"]*)">([^<]*)<\/a>/g)].map((m) => [m[1], m[2], m[3]]);

/** A raiz dos endereços que o aplicativo montado usa quando a página está em `caminho`. */
function raizDoAplicativo(js, caminho) {
  const inicio = js.indexOf('parser:fA,base:') + 'parser:fA,base:'.length;
  const fim = js.indexOf(',ssrPath:', inicio);
  assert.ok(inicio > 20 && fim > inicio, 'não achei a raiz dos endereços no aplicativo');
  return vm.runInNewContext(`(${js.slice(inicio, fim)})`, { location: { pathname: caminho } });
}

function novo(pasta, raizSite = SITE) {
  const avisos = [];
  const c = criarConteudo({ raizSite, dirDados: pasta, aviso: (m) => avisos.push(m) });
  c.carregar();
  return { c, avisos };
}

const texto = (c, nome) => c.gerar(ARQUIVOS[nome])?.corpo.toString('utf8') ?? null;

/** O aplicativo montado precisa continuar sendo JavaScript válido. */
const rascunho = path.join(pastaTemporaria(), 'aplicativo.mjs');
function conferirSintaxe(js) {
  fs.writeFileSync(rascunho, js);
  execFileSync(process.execPath, ['--check', rascunho], { stdio: 'pipe' });
}

function recusa(fazer, trecho, status = 400) {
  try {
    fazer();
  } catch (erro) {
    assert.ok(erro instanceof ErroDeConteudo, String(erro));
    assert.equal(erro.status, status, erro.message);
    assert.ok(erro.message.includes(trecho), erro.message);
    return;
  }
  assert.fail(`esperava a recusa: ${trecho}`);
}

/** Lê uma lista de dados do aplicativo original, sem passar pelo código que está sendo testado. */
function dadoDoOriginal(abre, fecha) {
  const inicio = COPIA.js.indexOf(abre) + abre.length - 1;
  const fim = COPIA.js.indexOf(fecha, inicio);
  return JSON.parse(JSON.stringify(vm.runInNewContext(`(${COPIA.js.slice(inicio, fim + 1)})`)));
}

// ───── 1. instalação nova
{
  const pasta = pastaTemporaria();
  const { c, avisos } = novo(pasta);
  const d = c.descrever();
  assert.deepEqual(d.problemas, [], 'todos os campos do mapa precisam ser achados nos arquivos de site/');
  assert.deepEqual(avisos, []);
  assert.equal(d.campos.length, CAMPOS.length);
  assert.equal(d.versao, 0);
  ok(`os ${CAMPOS.length} campos do mapa foram achados nos arquivos do site`);

  const regulamento = JSON.parse(vm.runInNewContext(/QA=JSON\.parse\(('(?:[^'\\]|\\.)*')\)/.exec(COPIA.js)[1]));
  assert.deepEqual(d.regulamento.original, regulamento);
  assert.deepEqual(d.policia.original.faixas, dadoDoOriginal(',ii=[', '],p0=['));
  assert.deepEqual(d.policia.original.aplicacao, dadoDoOriginal(',p0=[', '],h0=['));
  assert.deepEqual(d.policia.original.cnh, dadoDoOriginal(',h0=[', '],PA="'));
  ok('regulamento e regras da polícia são lidos do aplicativo sem nenhuma diferença');

  const js = texto(c, 'js');
  assert.equal(js, PADRAO.js);
  conferirSintaxe(js);
  const index = texto(c, 'index');
  const convite = texto(c, 'convite');
  assert.equal(index, PADRAO.index);
  assert.equal(convite, PADRAO.convite);
  for (const nome of ['manifesto', 'robots', 'sitemap']) assert.equal(c.gerar(ARQUIVOS[nome]), null, nome);
  assert.equal(c.gerar('assets/index-DMP8NyHf.css'), null);
  assert.deepEqual(d.textos, {});
  assert.ok(!fs.existsSync(path.join(pasta, 'conteudo.json')));
  ok('instalação nova: a cópia mais o site começando pelo convite, os créditos novos e a aba Admin; nada é gravado');

  // O site começa pelo convite, e as regras ficam em outra página.
  assert.equal(d.opcoes.conviteNoInicio, true);
  assert.deepEqual(c.enderecos(), ENDERECOS);
  assert.deepEqual(d.enderecos, ENDERECOS, 'o painel recebe os endereços, para os links "Ver regras" e "Ver convite"');
  for (const endereco of ['/', '/index.html', '/INDEX.HTML']) assert.deepEqual(c.paginaPara(endereco), { arquivo: 'convite/index.html' }, endereco);
  for (const endereco of ['/regras', '/regras/', '/Regras/', '/REGRAS']) assert.deepEqual(c.paginaPara(endereco), { arquivo: 'index.html' }, endereco);
  for (const endereco of ['/convite', '/convite/', '/convite/index.html', '/Convite/']) assert.deepEqual(c.paginaPara(endereco), { ir: '/' }, endereco);
  // O resto continua sendo o que está em site/ (ou, se não existir, uma rota do aplicativo).
  for (const endereco of ['/regras/outra', '/regras/index.html', '/regrasx', '/regra', '/convite/outra', '/404', '/admin', '/favicon.ico', '/assets/index-FbaU4KfD.js', '/sitemap.xml']) {
    assert.equal(c.paginaPara(endereco), null, endereco);
  }
  ok('endereços: "/" é o convite, "/regras/" é a página de regras e "/convite/" leva para "/"');

  // O início do site, com as palavras do pedido: a imagem, os três textos e o botão. Fora do convite,
  // só a etiqueta "Admin", no canto da página (ela tem a parte dela, logo abaixo).
  for (const trecho of [
    '<img class="poster" onclick="var b=document.querySelector(\'a.button\');if(b)b.click()" src="/fronteira-sul-convite-preview.jpg"',
    '<span class="eyebrow">CONVITE OFICIAL</span>',
    '<h1 id="title">Uma nova história começa aqui.</h1>',
    '<p>Conheça a cidade, confira as regras oficiais e prepare-se para o roleplay.</p>',
    '<a class="button" href="/regras/">Consultar regras oficiais</a>',
  ]) {
    assert.equal(vezes(convite, trecho), 1, trecho);
  }
  assert.deepEqual(botaoDoConvite(convite), ['/regras/', 'Consultar regras oficiais'], 'é pelo botão que se chega às regras');
  assert.equal(vezes(convite, '<a '), 2);
  assert.deepEqual(linksDe(convite), [['button', '/regras/', 'Consultar regras oficiais'], ['admin-no-canto', '/admin/', 'Admin']], 'os links da página: o botão e, depois dele, a etiqueta Admin');
  assert.ok(!/id="root"|\/assets\/index-|topbar|view-tab|rules-search/.test(convite), 'nada da página de regras vem junto');
  const corpo = convite.slice(convite.indexOf('<body'), convite.indexOf('</body>'));
  assert.deepEqual(corpo.match(/<(?!\/)[a-z0-9]+/g), ['<body', '<main', '<img', '<section', '<div', '<span', '<h1', '<p', '<a', '<a'], 'no corpo da página só há a imagem, os textos, o botão e a etiqueta Admin');
  const dentroDoConvite = corpo.slice(corpo.indexOf('<main'), corpo.indexOf('</main>'));
  assert.deepEqual(dentroDoConvite.match(/<(?!\/)[a-z0-9]+/g), ['<main', '<img', '<section', '<div', '<span', '<h1', '<p', '<a'], 'dentro do convite, o botão é o único link');
  assert.equal(vezes(convite, CABECA_DO_INICIO), 1);
  assert.equal(vezes(convite, `${CABECA_DO_INICIO}\n${ESTILO_DO_LINK_DO_ADMIN}</head>`), 1, 'as regras de visual do início entram no fim do <head>, seguidas só das da etiqueta Admin');
  assert.ok(CABECA_DO_INICIO.startsWith('<style id="convite-no-inicio">') && CABECA_DO_INICIO.includes('aspect-ratio:auto 1200/675'), 'e reservam o espaço da imagem (1200 × 675)');
  ok('o início do site é só o convite: a imagem, os três textos e o botão "Consultar regras oficiais", que leva a /regras/');

  // A entrada do painel na primeira página: a etiqueta "Admin", no canto do convite.
  assert.equal(LINK_DO_ADMIN, '<a class="admin-no-canto" href="/admin/">Admin</a>', 'um link para o painel, com o mesmo texto da aba Admin da página de regras');
  assert.equal(vezes(convite, `</section>\n    </main>${LINK_DO_ADMIN}\n  </body>`), 1, 'entra logo depois do convite: fora dele, e depois do botão na ordem da tecla Tab');
  assert.equal(vezes(convite, 'admin-no-canto'), vezes(LINK_DO_ADMIN + ESTILO_DO_LINK_DO_ADMIN, 'admin-no-canto'), 'uma vez só, com as regras de visual dela');
  // Ela fica solta da página, no canto de cima à direita, e tem a altura da menor margem que a página deixa
  // acima do convite: 16px (a margem vai de 16px a 48px; no desenho de tela baixa, é de 16px).
  assert.ok(ESTILO_DO_LINK_DO_ADMIN.includes('.admin-no-canto{position:absolute;top:0;right:0;display:flex;align-items:center;height:16px;'));
  assert.ok(COPIA.convite.includes('padding: clamp(16px, 4vw, 48px);') && CABECA_DO_INICIO.includes('body{padding-top:16px;padding-bottom:16px}'), 'a margem de cima da página nunca é menor que a altura da etiqueta');
  assert.equal(vezes(COPIA.convite + COPIA.index + COPIA.js + js + index, 'admin-no-canto'), 0, 'a etiqueta não existe na cópia nem entra na página de regras');
  const chaveDoAdmin = d.interruptores.find((i) => i.opcao === 'abaAdmin');
  assert.deepEqual([chaveDoAdmin.pagina, chaveDoAdmin.grupo, chaveDoAdmin.rotulo], ['regras', 'Abas', 'Mostrar “Admin” para os visitantes'], 'no painel, a mesma opção liga e desliga a aba e a etiqueta');
  assert.ok(chaveDoAdmin.ajuda.includes('a página de regras tem a aba “Admin”') && chaveDoAdmin.ajuda.includes('etiqueta “Admin” no canto de cima') && chaveDoAdmin.ajuda.includes('/admin/'), chaveDoAdmin.ajuda);
  ok('o convite tem a etiqueta "Admin" no canto, que leva ao painel: fora do convite, depois do botão');

  // A outra parte do site: a página de regras, sem o convite, funcionando em /regras/.
  assert.ok(!/fs-convite|convite-no-inicio|class="poster"/.test(js + index), 'a página de regras não traz o convite');
  assert.equal(vezes(js, BASE_ENTREGUE), 1);
  assert.equal(vezes(js, BASE_NA_COPIA), 0);
  for (const caminho of ['/regras', '/regras/', '/Regras/', '/REGRAS', '/regras/outra', '/regras/404']) assert.equal(raizDoAplicativo(js, caminho), '/regras', caminho);
  // Fora de /regras/ a raiz continua vazia: é assim que a tela "não encontrada" segue funcionando em /404.
  for (const caminho of ['/', '/404', '/404/', '/regrasx', '/regra', '/outra/regras/', '/convite/x']) assert.equal(raizDoAplicativo(js, caminho), '', caminho);
  assert.equal(raizDoAplicativo(COPIA.js, '/regras/'), '', 'na cópia a raiz é sempre vazia');
  // O botão "Go Home" da tela "não encontrada" abre o início do site de verdade (o convite é outro arquivo).
  assert.equal(vezes(js, VOLTAR_ENTREGUE), 1);
  assert.equal(vezes(js, VOLTAR_NA_COPIA), 0);
  assert.ok(js.includes(`,[]);${VOLTAR_ENTREGUE};return R.jsx("div",{"data-loc":"client/src/pages/NotFound.tsx:34"`), 'a troca é no botão da tela "não encontrada"');
  assert.equal(vezes(js, ABA_ADMIN), 1, 'a aba Admin entra uma vez só');
  assert.ok(!IDS_RESERVADOS.has('regras'), '"regras" voltou a ser um nome livre para uma seção do regulamento');
  ok('a página de regras não traz o convite e funciona em /regras/; a tela "não encontrada" continua em /404');

  // Da página de regras volta-se ao convite por um link no topo dela.
  assert.equal(vezes(js, LINK_DE_VOLTA), 2, 'o aplicativo recebe o link duas vezes: uma para telas estreitas, outra para as largas');
  assert.equal(vezes(js, 'voltar-ao-convite'), 2, 'e mais nenhuma');
  assert.equal(vezes(js, `alt:"Logo Fronteira do Sul RP"})}),${LINK_DE_VOLTA},R.jsxs("div",{"data-loc":"client/src/pages/Home.tsx:285",className:"topbar-tools"`), 1, 'na barra do topo, entre o logo e as ferramentas');
  assert.equal(vezes(js, `children:"Regras da Polícia"}),${LINK_DE_VOLTA}${ABA_ADMIN}]})`), 1, 'na linha das abas, depois das duas abas e antes da aba Admin');
  assert.ok(LINK_DE_VOLTA.startsWith('R.jsx("span",{className:"voltar-ao-convite",children:R.jsxs("a",{className:"view-tab",href:"/",') && LINK_DE_VOLTA.endsWith(',"Voltar ao convite"]})})'), 'é um link para o início do site, com o texto "Voltar ao convite"');
  assert.equal(vezes(index, ESTILO_DO_LINK_DE_VOLTA), 1, 'a página de regras recebe as regras de visual do link');
  assert.ok(index.includes(`${ESTILO_DO_LINK_DE_VOLTA}\n<style id="ajustes-do-admin">`), 'antes das do administrador, que podem mudar o resto');
  assert.ok(ESTILO_DO_LINK_DE_VOLTA.includes('.topbar>.voltar-ao-convite{display:none}') && ESTILO_DO_LINK_DE_VOLTA.includes('@media (max-width:700px){\n.view-tabs>.voltar-ao-convite{display:none}'), 'que mostram um dos dois de cada vez');
  assert.equal(vezes(COPIA.js + COPIA.index + COPIA.convite + convite, 'voltar-ao-convite'), 0, 'o link não existe na cópia nem entra na página do convite');
  const noPainelOLink = d.campos.find((f) => f.id === 'regras.voltar.texto');
  assert.deepEqual([noPainelOLink.pagina, noPainelOLink.grupo, noPainelOLink.rotulo, noPainelOLink.original], ['regras', 'Link para voltar ao convite', 'Texto do link', 'Voltar ao convite'], 'o texto do link muda pelo painel, em "Página de regras"');
  assert.ok(noPainelOLink.ajuda.includes('Deixe vazio para tirar o link'));
  ok('a página de regras tem um link de volta ao convite: na barra do topo e na linha das abas, antes da aba Admin');

  // Os créditos pedidos; telefone e e-mail não aparecem.
  const creditos = js.slice(js.indexOf('className:"author-card"'), js.indexOf('className:"closing-note"'));
  for (const trecho of [
    'children:"CRÉDITOS"',
    'children:"Quem criou"',
    'children:"Este guia foi organizado para facilitar a consulta das regras da cidade."',
    'className:"author-name",children:"MURILO MENDES"',
    'children:["sgtmendes1997_29726",',
    'href:"tel:",children:""',
    'href:"mailto:",children:""',
  ]) {
    assert.equal(creditos.split(trecho).length, 2, trecho);
  }
  assert.ok(js.includes('navigator.clipboard.writeText("sgtmendes1997_29726")'), 'o botão de copiar copia o Discord novo');
  assert.ok(index.includes(esconderLinha(3)) && index.includes(esconderLinha(4)), 'as linhas de telefone e e-mail ficam escondidas');
  for (const [id, antigo] of Object.entries(CREDITOS_DA_COPIA)) {
    assert.ok(antigo.length > 5, id);
    assert.ok(!js.includes(antigo) && !index.includes(antigo), `${id}: o texto da cópia não pode ser entregue`);
  }
  assert.ok(!js.includes('tel:+') && !js.includes('mailto:d'), 'nem nos links');
  const noPainel = Object.fromEntries(d.campos.map((f) => [f.id, f.original]));
  assert.equal(noPainel['regras.creditos.nome'], 'MURILO MENDES');
  assert.equal(noPainel['regras.creditos.discord'], 'sgtmendes1997_29726');
  assert.equal(noPainel['regras.creditos.telefone'], '');
  assert.equal(noPainel['regras.creditos.email'], '');
  ok('créditos: MURILO MENDES e o Discord novo; nada dos créditos da cópia é entregue');

  const r = c.salvar({ versao: 0, textos: noPainel, regulamento: d.regulamento.original, policia: d.policia.original, opcoes: d.opcoes });
  assert.equal(r.mudou, false);
  assert.equal(r.versao, 0);
  assert.deepEqual(r.textos, {});
  assert.equal(r.regulamento.atual, null);
  assert.equal(r.policia.atual, null);
  assert.ok(!fs.existsSync(path.join(pasta, 'conteudo.json')));
  ok('salvar sem ter mudado nada não cria versão');

  // site/ continua sendo a cópia: desfazendo as quatro mudanças do projeto, tudo sai byte a byte como ela.
  const r2 = c.salvar({ versao: 0, opcoes: { abaAdmin: false, conviteNoInicio: false, removerManus: false }, textos: CREDITOS_DA_COPIA });
  assert.equal(r2.versao, 1);
  for (const rel of Object.values(ARQUIVOS)) assert.equal(c.gerar(rel), null, rel);
  assert.deepEqual(c.enderecos(), ENDERECOS_DO_ORIGINAL);
  for (const endereco of ['/', '/index.html', '/convite', '/convite/', '/convite/index.html']) assert.equal(c.paginaPara(endereco), null, `${endereco}: vale o arquivo de site/`);
  ok('sem começar pelo convite, sem a aba Admin, com o selo da Manus e com os créditos da cópia, todos os arquivos e endereços são os do original');
}

// ───── 2. cada campo, um por vez
{
  const { c } = novo(pastaTemporaria());
  const d = c.descrever();
  let versao = 0;
  // Campos sem lugar na cópia: é o projeto que acrescenta o texto à página. Em que arquivo ele entra, e quantas vezes.
  const ACRESCENTADOS = { 'regras.voltar.texto': { js: 2 } };
  for (const campo of CAMPOS) {
    const info = d.campos.find((f) => f.id === campo.id);
    const marca = campo.id.replace(/\W/g, '');
    let valor = `ZZ${marca}ZZ`;
    if (campo.tipo === 'link') valor = `/zz-${marca}`;
    if (campo.tipo === 'email') valor = `zz${marca}@exemplo.com`;
    if (campo.tipo === 'telefone') valor = '+55 (11) 91234-5678';
    const r = c.salvar({ versao, textos: { [campo.id]: valor } });
    versao = r.versao;
    assert.deepEqual(r.textos, { [campo.id]: valor });

    // Quantos lugares o campo tem em cada arquivo.
    const lugaresEm = campo.locais.length ? {} : ACRESCENTADOS[campo.id];
    assert.ok(lugaresEm, `${campo.id}: um campo sem lugar na cópia precisa dizer aqui onde o texto entra`);
    assert.equal(!campo.locais.length, campo.id in ACRESCENTADOS, campo.id);
    for (const l of campo.locais) lugaresEm[l.arquivo] = (lugaresEm[l.arquivo] || 0) + (l.chaves ? l.chaves.length : 1);
    const arquivosDoCampo = new Set(Object.keys(lugaresEm));
    // Uma linha que vem escondida (campo vazio) volta a aparecer quando o campo ganha texto.
    const apareceALinha = info.escondeSeVazio && info.original === '';
    let achados = 0;
    for (const nome of Object.keys(ARQUIVOS)) {
      const t = texto(c, nome);
      // O que a instalação nova entrega (null = o arquivo da cópia). A página de regras pede o aplicativo pela
      // versão dele: quando o campo muda o aplicativo, esse endereço muda junto, e mais nada.
      const padrao = nome === 'index' ? pedindoOAplicativo(PADRAO.index, texto(c, 'js')) : (PADRAO[nome] ?? null);
      if (nome === 'index' && apareceALinha) {
        assert.equal(t, padrao.replace(`${campo.seVazioEsconde}{display:none!important}\n`, ''), `${campo.id}: só a regra que escondia a linha sai da página`);
        continue;
      }
      if (!arquivosDoCampo.has(nome)) {
        // Arquivo que o campo não toca: igual ao de uma instalação nova.
        assert.equal(t, padrao, `${campo.id} mexeu em ${nome}`);
        continue;
      }
      assert.ok(t != null, `${campo.id}: ${nome} não foi montado`);
      if (campo.tipo === 'telefone') achados += vezes(t, '+55 (11) 91234-5678') + vezes(t, 'tel:+5511912345678');
      else achados += vezes(t, valor);
      if (nome === 'js') conferirSintaxe(t);
      if (nome === 'manifesto') JSON.parse(t);
      // Só os trechos do campo mudaram: o tamanho do arquivo bate com a troca.
      if (nome !== 'manifesto' && campo.tipo !== 'telefone') {
        assert.equal(t.length, (padrao ?? COPIA[nome]).length + lugaresEm[nome] * (valor.length - info.original.length), `${campo.id}: tamanho de ${nome}`);
      }
    }
    const esperados = Object.values(lugaresEm).reduce((soma, n) => soma + n, 0);
    assert.equal(achados, esperados, `${campo.id}: lugares trocados`);
    // Os textos do convite ficam na página do convite, e só nela: a página de regras não muda com eles.
    if (campo.id.startsWith('convite.')) assert.deepEqual([...arquivosDoCampo], ['convite'], `${campo.id}: só a página do convite`);
  }
  ok('cada campo troca só os próprios trechos, e o aplicativo continua válido');

  const r = c.salvar({ versao, textos: {} });
  assert.deepEqual(r.textos, {});
  assert.equal(texto(c, 'js'), PADRAO.js);
  assert.equal(texto(c, 'index'), PADRAO.index);
  assert.equal(texto(c, 'convite'), PADRAO.convite);
  ok('apagar as alterações devolve o site ao que era');
}

// ───── 3. textos difíceis e valores recusados
{
  const { c } = novo(pastaTemporaria());
  const d = c.descrever();
  const dificil = `"</script><b>x</b> 'a' \\n \\ \${y} \`z\` &amp; <!-- é 😀 --> \u2028fim`;
  const esperado = dificil.replace('\u2028', '');
  const textos = {};
  for (const f of d.campos) {
    if (f.tipo === 'link') textos[f.id] = 'https://exemplo.com/a?b=1&c="2"';
    else if (f.tipo === 'email') textos[f.id] = 'a.b+c@exemplo.com.br';
    else if (f.tipo === 'telefone') textos[f.id] = '(45) 9 9999-0000';
    else textos[f.id] = dificil;
  }
  const r = c.salvar({ versao: 0, textos });
  for (const f of d.campos) if (!['link', 'email', 'telefone'].includes(f.tipo)) assert.equal(r.textos[f.id], esperado, f.id);
  const js = texto(c, 'js');
  conferirSintaxe(js);
  const contarTags = (t) => (t.match(/<[a-zA-Z/!]/g) || []).length;
  // As únicas tags a mais são as do projeto: na página de regras, o <style> do link de volta ao convite;
  // na do convite, o <style> que entra quando ela é o início do site, e a etiqueta Admin com o <style> dela.
  // (E as a menos são as do selo e das estatísticas da hospedagem original, que o projeto tira.)
  const tagsEsperadas = {
    index: contarTags(semSeloDaManus(COPIA.index)) + contarTags(ESTILO_DO_LINK_DE_VOLTA),
    convite: contarTags(semSeloDaManus(COPIA.convite)) + contarTags(CABECA_DO_INICIO) + contarTags(ESTILO_DO_LINK_DO_ADMIN) + contarTags(LINK_DO_ADMIN),
  };
  assert.equal(contarTags(ESTILO_DO_LINK_DE_VOLTA), 2);
  assert.equal(contarTags(CABECA_DO_INICIO), 2);
  assert.equal(contarTags(ESTILO_DO_LINK_DO_ADMIN), 2);
  assert.equal(contarTags(LINK_DO_ADMIN), 2);
  for (const nome of ['index', 'convite']) {
    const html = texto(c, nome);
    assert.equal(contarTags(html), tagsEsperadas[nome], `${nome}: o texto não pode criar tags`);
    assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'));
  }
  // No convite, os textos entram como texto e o destino do botão como atributo: nunca como HTML.
  const convite = texto(c, 'convite');
  const comoTexto = '"&lt;/script&gt;&lt;b&gt;x&lt;/b&gt; \'a\' ';
  const comoAtributo = '&quot;&lt;/script&gt;&lt;b&gt;x&lt;/b&gt; \'a\' ';
  for (const trecho of [`<span class="eyebrow">${comoTexto}`, `<h1 id="title">${comoTexto}`, `<p>${comoTexto}`, `<a class="button" href="https://exemplo.com/a?b=1&amp;c=&quot;2&quot;">${comoTexto}`]) {
    assert.equal(vezes(convite, trecho), 1, trecho);
  }
  assert.equal(vezes(convite, `<img class="poster"${CLIQUE_NA_IMAGEM} src="/fronteira-sul-convite-preview.jpg" alt="${comoAtributo}`), 1, 'a descrição da imagem entra como atributo');
  assert.deepEqual(botaoDoConvite(convite)[0], 'https://exemplo.com/a?b=1&amp;c=&quot;2&quot;');
  // O texto do link de volta entra no aplicativo como texto do JavaScript, nos dois lugares.
  assert.equal(vezes(js, linkDeVolta(esperado)), 2);
  assert.ok(linkDeVolta(esperado).endsWith(`,${JSON.stringify(esperado)}]})})`));
  assert.ok(js.includes('href:"tel:45999990000"'));
  assert.ok(js.includes('"mailto:a.b+c@exemplo.com.br"'));
  const manifesto = JSON.parse(texto(c, 'manifesto'));
  assert.equal(manifesto.name, esperado);
  assert.equal(manifesto.short_name, esperado);
  ok('aspas, barras, crases, ${}, tags e emoji não quebram o aplicativo nem criam HTML');

  const v = r.versao;
  recusa(() => c.salvar({ versao: v, textos: { 'convite.titulo': 'x'.repeat(301) } }), 'passou de 300');
  recusa(() => c.salvar({ versao: v, textos: { 'convite.botaoLink': 'javascript:alert(1)' } }), 'use /');
  recusa(() => c.salvar({ versao: v, textos: { 'convite.botaoLink': '//outro.example' } }), 'use /');
  recusa(() => c.salvar({ versao: v, textos: { 'convite.botaoLink': '' } }), 'use /');
  recusa(() => c.salvar({ versao: v, textos: { 'regras.creditos.email': 'nao-e-email' } }), 'e-mail');
  recusa(() => c.salvar({ versao: v, textos: { 'convite.titulo': 5 } }), 'inválido');
  recusa(() => c.salvar({ versao: v - 1, textos: {} }), 'outra aba', 409);
  recusa(() => c.salvar({ versao: v, regulamento: [{ title: '', paragraphs: [] }] }), 'sem título');
  recusa(() => c.salvar({ versao: v, regulamento: 'x' }), 'formato');
  recusa(() => c.salvar({ versao: v, policia: { faixas: [{ title: 'A', fines: [{ description: 'x', amount: '1', points: 'dois' }] }], aplicacao: [], cnh: [] } }), 'número inteiro');
  recusa(() => c.salvar({ versao: v, opcoes: { enderecoPublico: 'ftp://x.com' } }), 'Endereço');
  recusa(() => c.salvar({ versao: v, opcoes: { enderecoPublico: 'https://' } }), 'Endereço');
  recusa(() => c.salvar([]), 'inválido');
  assert.equal(c.versao, v);
  ok('valores inválidos são recusados sem alterar nada');
}

// ───── 4. regulamento e polícia
const pastaQueFica = pastaTemporaria();
{
  const { c } = novo(pastaQueFica);
  const d = c.descrever();
  const reg = structuredClone(d.regulamento.original);
  reg[0].title = 'Boas-vindas "novas" & <b>';
  reg[0].paragraphs[0] = 'Linha 1\nLinha 2 com \'aspas\' e "aspas" e \\ barra';
  reg.splice(3, 1);
  reg.push({ title: 'Seção Nova ção', paragraphs: ['  Primeiro  \n\n\n segundo pedaço ', '', 'Outro.'] });
  reg.push({ id: 'apresentacao', title: 'Repetida', paragraphs: ['x'] });
  reg.push({ title: 'Autor', paragraphs: [] }); // "autor" já é uma âncora da página
  reg.push({ title: 'Regras', paragraphs: ['y'] }); // "regras" é um nome livre: a página fica em /regras/, e a seção, em /regras/#regras
  reg.push({ id: 'regras', title: 'Outra que pede o mesmo nome', paragraphs: [] });
  [reg[1], reg[2]] = [reg[2], reg[1]];
  const pol = structuredClone(d.policia.original);
  pol.faixas[0].title = 'Leves (novo)';
  pol.faixas[0].fines[0].amount = 'R$ 1.234';
  pol.faixas[0].fines[0].points = '7';
  pol.faixas[0].fines.push({ description: 'Nova "multa"', amount: 'R$ 5', points: '' });
  pol.faixas[0].fines.push({ description: '', amount: '', points: '' });
  pol.faixas.push({ title: 'Grupo extra', fines: [{ description: 'A', amount: 'B' }, { description: 'A', amount: 'C', points: 0 }] });
  pol.aplicacao.push('Regra extra `com crase` ${x}');
  pol.cnh.shift();

  const r = c.salvar({ versao: 0, regulamento: reg, policia: pol });
  const a = r.regulamento.atual;
  assert.equal(a.length, d.regulamento.original.length - 1 + 5);
  assert.deepEqual(a.slice(0, 3).map((s) => s.id), ['apresentacao', 'regras-de-ouro', 'regras-gerais']);
  assert.equal(a[0].paragraphs[0], 'Linha 1\nLinha 2 com \'aspas\' e "aspas" e \\ barra');
  const nova = a.find((s) => s.title === 'Seção Nova ção');
  assert.equal(nova.id, 'secao-nova-cao');
  assert.deepEqual(nova.paragraphs, ['Primeiro\n segundo pedaço', 'Outro.']);
  assert.equal(a.find((s) => s.title === 'Repetida').id, 'apresentacao-2');
  assert.equal(a.find((s) => s.title === 'Autor').id, 'secao-autor');
  assert.equal(a.find((s) => s.title === 'Outra que pede o mesmo nome').id, 'regras', 'quem pediu um identificador escolhe primeiro');
  assert.equal(a.find((s) => s.title === 'Regras').id, 'regras-2');
  assert.equal(new Set(a.map((s) => s.id)).size, a.length, 'nenhuma âncora repetida');
  const p = r.policia.atual;
  assert.equal(p.faixas[0].fines[0].points, 7);
  assert.equal(p.faixas[0].fines.length, d.policia.original.faixas[0].fines.length + 1, 'linha em branco é ignorada');
  assert.ok(!('points' in p.faixas[0].fines.at(-1)));
  assert.equal(p.faixas.at(-1).id, 'grupo-extra');
  assert.deepEqual(p.faixas.at(-1).fines.map((m) => m.id), ['a', 'a-2']);
  assert.equal(p.faixas.at(-1).fines[1].points, 0);

  const js = texto(c, 'js');
  conferirSintaxe(js);
  const i = js.indexOf('QA=') + 3;
  const f = js.indexOf(',LA={sections:QA}');
  assert.ok(f > i);
  assert.deepEqual(JSON.parse(js.slice(i, f)), a);
  const lista = (abre, fecha) => {
    const x = js.indexOf(abre) + abre.length - 1;
    return JSON.parse(js.slice(x, js.indexOf(fecha, x) + 1));
  };
  assert.deepEqual(lista(',ii=[', '],p0=['), p.faixas);
  assert.deepEqual(lista(',p0=[', '],h0=['), p.aplicacao);
  assert.deepEqual(lista(',h0=[', '],PA="'), p.cnh);
  ok('regulamento e polícia: o aplicativo recebe exatamente o que foi salvo');

  const r2 = c.salvar({ versao: r.versao, policia: null });
  assert.equal(r2.policia.atual, null);
  assert.ok(r2.regulamento.atual);
  ok('null devolve só aquela parte ao original');
}

// ───── 5. o que foi salvo continua depois de reiniciar
{
  const { c, avisos } = novo(pastaQueFica);
  assert.deepEqual(avisos, []);
  const d = c.descrever();
  assert.equal(d.versao, 2);
  assert.equal(d.regulamento.atual[0].title, 'Boas-vindas "novas" & <b>');
  assert.equal(d.policia.atual, null);
  assert.deepEqual(d.historico.map((v) => v.id), ['1']);
  assert.equal(d.historico[0].policia, true);
  ok('o conteúdo salvo volta depois de reiniciar');

  const r = c.restaurarDoHistorico('1');
  assert.equal(r.versao, 3);
  assert.equal(r.policia.atual.faixas[0].title, 'Leves (novo)');
  assert.equal(r.historico.length, 2);
  recusa(() => c.restaurarDoHistorico('999'), 'não existe', 404);
  recusa(() => c.restaurarDoHistorico('../1'), 'inválida');
  ok('voltar para uma versão do histórico');

  const r3 = c.restaurarOriginal();
  assert.equal(r3.regulamento.atual, null);
  assert.equal(r3.policia.atual, null);
  assert.deepEqual(r3.textos, {});
  assert.equal(texto(c, 'js'), PADRAO.js);
  assert.equal(texto(c, 'index'), PADRAO.index);
  ok('restaurar o original');

  fs.writeFileSync(path.join(pastaQueFica, 'conteudo.json'), '{ quebrado');
  const { c: c2, avisos: avisos2 } = novo(pastaQueFica);
  assert.equal(c2.versao, 0);
  assert.equal(avisos2.length, 1);
  assert.ok(fs.readdirSync(pastaQueFica).some((nome) => nome.startsWith('conteudo.json.ilegivel-')), 'o arquivo ilegível fica guardado');
  assert.equal(texto(c2, 'js'), PADRAO.js);
  ok('arquivo de dados ilegível não derruba o site');
}

// ───── 6. opções e imagens
{
  const pasta = pastaTemporaria();
  const { c } = novo(pasta);
  let r = c.salvar({
    versao: 0,
    opcoes: { mostrarCreditos: false, mostrarDestaque: false, cssExtra: 'body{color:red}</style><script>alert(1)</script>' },
    textos: { 'regras.creditos.email': '', 'regras.creditos.discord': '' },
  });
  let index = texto(c, 'index');
  for (const regra of ['.author-card{display:none!important}', '.cheat-callout{display:none!important}', esconderLinha(2), esconderLinha(3), esconderLinha(4)]) {
    assert.ok(index.includes(regra), regra);
  }
  assert.ok(index.includes('body{color:red}<\\/style><script>alert(1)<\\/script>'), 'o CSS extra não consegue fechar o <style>');
  assert.equal(vezes(index, '</style>'), vezes(COPIA.index, '</style>') + 2, 'na página de regras, o <style> do link de volta ao convite e o dos ajustes');
  const ordemNasRegras = ['<style id="voltar-ao-convite">', '<style id="ajustes-do-admin">', '</head>'].map((trecho) => index.indexOf(trecho));
  assert.ok(ordemNasRegras.every((posicao, n) => posicao >= 0 && (n === 0 || posicao > ordemNasRegras[n - 1])), 'o CSS do administrador vem por último');
  assert.equal(vezes(index, '<script'), vezes(semSeloDaManus(COPIA.index), '<script') + 1, 'só aparece como texto dentro do <style>');
  let convite = texto(c, 'convite');
  assert.ok(convite.includes('body{color:red}<\\/style><script>alert(1)<\\/script>'));
  assert.ok(!convite.includes('.author-card'), 'as regras que escondem partes da página de regras não vão para o convite');
  assert.equal(vezes(convite, '</style>'), vezes(COPIA.convite, '</style>') + 3, 'no convite, o <style> do início do site, o da etiqueta Admin e o dos ajustes');
  const ordem = ['<style>', '<style id="convite-no-inicio">', '<style id="admin-no-canto">', '<style id="ajustes-do-admin">', '</head>'].map((trecho) => convite.indexOf(trecho));
  assert.ok(ordem.every((posicao, n) => posicao >= 0 && (n === 0 || posicao > ordem[n - 1])), 'o CSS do administrador vem por último, para poder mudar o resto');
  conferirSintaxe(texto(c, 'js'));
  ok('esconder blocos, campos vazios e CSS extra');

  r = c.salvar({ versao: r.versao, opcoes: { removerManus: true } });
  for (const nome of ['index', 'convite']) {
    const html = texto(c, nome);
    assert.ok(!/manus-content-root|manuscdn|plausible|manus-analytics|amplitude|__manus_space/i.test(html), nome);
    assert.ok(html.trimEnd().endsWith('</body>\n</html>'), nome);
  }
  assert.ok(!texto(c, 'index').includes('/api/platform/config.js'));
  assert.ok(texto(c, 'index').includes('<div id="root"></div>'));
  assert.match(texto(c, 'convite'), /<\/section>\s*<\/main><a class="admin-no-canto" href="\/admin\/">Admin<\/a>\s*<\/body>\s*<\/html>\s*$/, 'a etiqueta Admin do convite continua: o que sai é só o que vem depois dela');
  assert.equal(r.opcoes.mostrarCreditos, false, 'mudar uma opção preserva as outras');
  ok('tirar o selo e as estatísticas da hospedagem original');

  r = c.salvar({ versao: r.versao, opcoes: { enderecoPublico: 'meusite.com.br/qualquer/coisa' } });
  assert.equal(r.opcoes.enderecoPublico, 'https://meusite.com.br');
  for (const nome of ['index', 'convite', 'robots', 'sitemap']) {
    const t = texto(c, nome);
    assert.ok(!t.includes(ORIGEM_ORIGINAL), nome);
    assert.ok(t.includes('https://meusite.com.br'), nome);
  }
  // O endereço de cada página (canonical e og:url) é o lugar em que ela está agora: o convite em "/", as regras em "/regras/".
  const enderecoDaPagina = (html) => [/<link rel="canonical" href="([^"]*)" \/>/.exec(html)[1], /<meta property="og:url" content="([^"]*)" \/>/.exec(html)[1]];
  assert.deepEqual(enderecoDaPagina(texto(c, 'convite')), ['https://meusite.com.br/', 'https://meusite.com.br/']);
  assert.deepEqual(enderecoDaPagina(texto(c, 'index')), ['https://meusite.com.br/regras/', 'https://meusite.com.br/regras/']);
  assert.ok(!texto(c, 'convite').includes('meusite.com.br/convite/'), 'o endereço antigo do convite não é mais anunciado');
  for (const nome of ['index', 'convite']) {
    assert.equal(vezes(texto(c, nome), 'https://meusite.com.br/fronteira-sul-convite-preview.jpg'), vezes(COPIA[nome], `${ORIGEM_ORIGINAL}/fronteira-sul-convite-preview.jpg`), `${nome}: a imagem da prévia continua no mesmo endereço`);
  }
  // O mapa do site lista as duas páginas; o da cópia só tinha o endereço principal.
  const paginasDoMapa = (xml) => [...xml.matchAll(/<url>\s*<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(paginasDoMapa(COPIA.sitemap), [`${ORIGEM_ORIGINAL}/`]);
  assert.deepEqual(paginasDoMapa(texto(c, 'sitemap')), ['https://meusite.com.br/', 'https://meusite.com.br/regras/']);
  assert.equal(vezes(texto(c, 'sitemap'), '<url>'), 2);
  assert.equal(vezes(texto(c, 'sitemap'), '</url>'), 2);
  assert.ok(texto(c, 'sitemap').trimEnd().endsWith('</url>\n</urlset>'));
  assert.equal(texto(c, 'robots'), COPIA.robots.replace(ORIGEM_ORIGINAL, 'https://meusite.com.br'));
  // Com as páginas nos lugares do original, os endereços anunciados também são os do original.
  r = c.salvar({ versao: r.versao, opcoes: { conviteNoInicio: false } });
  assert.deepEqual(enderecoDaPagina(texto(c, 'convite')), ['https://meusite.com.br/convite/', 'https://meusite.com.br/convite/']);
  assert.deepEqual(enderecoDaPagina(texto(c, 'index')), ['https://meusite.com.br/', 'https://meusite.com.br/']);
  assert.equal(texto(c, 'sitemap'), COPIA.sitemap.replace(ORIGEM_ORIGINAL, 'https://meusite.com.br'));
  r = c.salvar({ versao: r.versao, opcoes: { conviteNoInicio: true } });
  ok('endereço do site nos links de compartilhamento: o convite em "/", as regras em "/regras/", e as duas no mapa do site');

  // O endereço de quem serve o site agora (ENDERECO_PUBLICO, no servidor): vale quando o painel não tem um.
  const comServidor = criarConteudo({ raizSite: SITE, dirDados: pastaTemporaria(), enderecoPadrao: 'preview.exemplo/' });
  comServidor.carregar();
  assert.deepEqual(enderecoDaPagina(texto(comServidor, 'convite')), ['https://preview.exemplo/', 'https://preview.exemplo/']);
  assert.deepEqual(enderecoDaPagina(texto(comServidor, 'index')), ['https://preview.exemplo/regras/', 'https://preview.exemplo/regras/']);
  assert.equal(texto(comServidor, 'robots'), COPIA.robots.replace(ORIGEM_ORIGINAL, 'https://preview.exemplo'), 'é o endereço de quem serve, e não o do site original');
  assert.deepEqual(paginasDoMapa(texto(comServidor, 'sitemap')), ['https://preview.exemplo/', 'https://preview.exemplo/regras/']);
  // O "Endereço do site" do painel, quando preenchido, vale mais.
  comServidor.salvar({ versao: 0, opcoes: { enderecoPublico: 'https://meu-site.exemplo' } });
  assert.deepEqual(enderecoDaPagina(texto(comServidor, 'convite')), ['https://meu-site.exemplo/', 'https://meu-site.exemplo/']);
  assert.equal(texto(comServidor, 'robots'), COPIA.robots.replace(ORIGEM_ORIGINAL, 'https://meu-site.exemplo'));
  // Um endereço que não serve (sem domínio) é ignorado: tudo fica como sem endereço nenhum.
  const semEnderecoBom = criarConteudo({ raizSite: SITE, dirDados: pastaTemporaria(), enderecoPadrao: 'sem-dominio' });
  semEnderecoBom.carregar();
  assert.equal(semEnderecoBom.gerar(ARQUIVOS.robots), null);
  assert.deepEqual(enderecoDaPagina(texto(semEnderecoBom, 'convite')), [`${ORIGEM_ORIGINAL}/convite/`, `${ORIGEM_ORIGINAL}/convite/`]);
  ok('endereço de quem serve o site (ENDERECO_PUBLICO): vale no lugar do site original, e o painel vale mais que ele');

  const png = pngSimples(8, 4);
  const outra = pngSimples(8, 4, [200, 10, 10]);
  const enviar = (id, corpo, largura = 8, altura = 4) => c.trocarImagem(id, { corpo, tipo: 'image/png', ext: 'png', largura, altura });
  assert.equal(c.imagemPara('/fronteira-sul-convite-preview.jpg'), null);
  const antes = r.versao;
  r = enviar('convite', png, 800, 450);
  assert.equal(r.versao, antes + 1);
  const trocada = c.imagemPara('/fronteira-sul-convite-preview.jpg');
  assert.ok(fs.readFileSync(trocada.arquivo).equals(png));
  assert.equal(trocada.tipo, 'image/png');
  index = texto(c, 'index');
  assert.match(index, /og:image" content="https:\/\/meusite\.com\.br\/fronteira-sul-convite-preview\.jpg\?v=[0-9a-f]{12}"/);
  assert.ok(index.includes('<meta property="og:image:type" content="image/png" />'));
  assert.ok(index.includes('<meta property="og:image:width" content="800" />'));
  assert.ok(index.includes('<meta property="og:image:height" content="450" />'));
  ok('imagem do convite trocada: arquivo, tipo, tamanho e endereço novo na prévia do link');

  assert.equal(c.imagemPara('/favicon.ico'), null);
  enviar('logo', png);
  for (const caminho of ['/manus-storage/fronteira-sul-logo_1b1b4c2d.webp', '/fronteira-sul-logo.webp', '/favicon.ico']) assert.ok(c.imagemPara(caminho), caminho);
  enviar('icone', outra);
  assert.ok(fs.readFileSync(c.imagemPara('/favicon.ico').arquivo).equals(outra));
  enviar('icone', png);
  assert.equal(fs.readdirSync(path.join(pasta, 'imagens')).filter((nome) => nome.startsWith('icone-')).length, 1, 'a imagem antiga é apagada');
  c.removerImagem('icone');
  assert.ok(fs.readFileSync(c.imagemPara('/favicon.ico').arquivo).equals(png), 'sem ícone próprio, vale o logo');
  c.removerImagem('logo');
  assert.equal(c.imagemPara('/favicon.ico'), null);
  assert.equal(c.imagemPara('/outra.png'), null);
  recusa(() => enviar('nao-existe', png), 'desconhecida', 404);
  ok('logo, ícone (usa o logo quando não tem o seu) e voltar à imagem original');

  const { c: c2 } = novo(pasta);
  assert.ok(c2.imagemPara('/fronteira-sul-convite-preview.jpg'));
  c2.restaurarOriginal();
  assert.equal(c2.imagemPara('/fronteira-sul-convite-preview.jpg'), null);
  assert.deepEqual(fs.readdirSync(path.join(pasta, 'imagens')), []);
  ok('imagens continuam depois de reiniciar e somem ao restaurar o original');
}

// ───── 7. o site começa pelo convite: a opção, o botão, a imagem e o que acontece quando um arquivo vem diferente
{
  const { c } = novo(pastaTemporaria());
  let r = c.salvar({ versao: 0, opcoes: { conviteNoInicio: false } });
  assert.equal(r.opcoes.conviteNoInicio, false);
  assert.deepEqual(r.enderecos, ENDERECOS_DO_ORIGINAL);
  assert.deepEqual(c.enderecos(), ENDERECOS_DO_ORIGINAL);
  assert.equal(texto(c, 'js'), SEM_COMECAR_PELO_CONVITE.js, 'o aplicativo volta a ter a raiz e o botão da cópia');
  assert.equal(vezes(texto(c, 'js'), BASE_NA_COPIA), 1);
  assert.equal(vezes(texto(c, 'js'), VOLTAR_NA_COPIA), 1);
  assert.equal(texto(c, 'index'), SEM_COMECAR_PELO_CONVITE.index);
  assert.ok(!(texto(c, 'js') + texto(c, 'index')).includes('voltar-ao-convite'), 'e a página de regras fica sem o link de volta: ela é o início do site');
  assert.equal(texto(c, 'convite'), SEM_COMECAR_PELO_CONVITE.convite, 'a página do convite volta a ser a da cópia, fora o selo da Manus, e o botão leva a "/"');
  assert.equal(vezes(texto(c, 'convite'), '<a class="button" href="/">'), 1);
  // Os endereços voltam a ser os do site original; "/regras/" continua valendo e leva para "/".
  for (const endereco of ['/', '/index.html', '/convite', '/convite/', '/convite/index.html', '/regras/outra', '/404']) assert.equal(c.paginaPara(endereco), null, endereco);
  for (const endereco of ['/regras', '/regras/', '/Regras/']) assert.deepEqual(c.paginaPara(endereco), { ir: '/' }, endereco);
  ok('opção desligada: as páginas ficam onde estavam no original (regras em "/", convite em "/convite/"), e "/regras/" leva para "/"');

  r = c.salvar({ versao: r.versao, opcoes: { conviteNoInicio: true } });
  assert.deepEqual(r.enderecos, ENDERECOS);
  assert.equal(texto(c, 'js'), PADRAO.js);
  assert.equal(texto(c, 'index'), PADRAO.index);
  assert.equal(texto(c, 'convite'), PADRAO.convite);
  ok('opção ligada de novo: tudo como em uma instalação nova');

  // Os textos do convite mudam o início do site; a página de regras não tem mais nada dele.
  r = c.salvar({ versao: r.versao, textos: { 'convite.titulo': 'Bem-vindo à "cidade"', 'convite.botao': 'Ver as regras', 'convite.sobretitulo': '', 'convite.texto': '' } });
  let convite = texto(c, 'convite');
  assert.ok(convite.includes('<h1 id="title">Bem-vindo à "cidade"</h1>'));
  assert.deepEqual(botaoDoConvite(convite), ['/regras/', 'Ver as regras']);
  assert.ok(convite.includes('<span class="eyebrow"></span>') && convite.includes('<p></p>'), 'um texto vazio fica vazio na página (e as regras de visual escondem a linha)');
  assert.ok(CABECA_DO_INICIO.includes('.eyebrow:empty,h1:empty,p:empty,.button:empty{display:none}'));
  assert.equal(texto(c, 'js'), PADRAO.js, 'a página de regras não muda com os textos do convite');
  assert.equal(texto(c, 'index'), PADRAO.index);
  ok('os textos do convite aparecem no início do site, e só nele');

  // O botão. Estes destinos querem dizer "a página de regras", esteja ela onde estiver:
  // "/regras/" é o que o painel mostra, "/" é o que veio na cópia e "/#regras" foi o atalho da versão anterior.
  r = c.salvar({ versao: r.versao, textos: {} });
  const destinoCom = (escrito, comecaPeloConvite) => {
    r = c.salvar({ versao: r.versao, textos: { 'convite.botaoLink': escrito }, opcoes: { conviteNoInicio: comecaPeloConvite } });
    return botaoDoConvite(texto(c, 'convite') ?? COPIA.convite)[0];
  };
  for (const escrito of ['/regras/', '/regras', '/', '/#regras', '/REGRAS/', ' /regras/ ']) {
    assert.equal(destinoCom(escrito, true), '/regras/', `"${escrito}", com o site começando pelo convite`);
    assert.equal(destinoCom(escrito, false), '/', `"${escrito}", com as páginas nos lugares do original`);
  }
  // Sem isso, um botão salvo com "/" abriria o próprio convite.
  assert.equal(destinoCom('/', true), ENDERECOS.regras);
  // Qualquer outro destino entra como foi escrito, nos dois casos.
  for (const escrito of ['https://discord.gg/exemplo', '/regras/#regras-gerais', '#title', 'https://meu-site.exemplo/', '/regras/outra', '/regrasx']) {
    assert.equal(destinoCom(escrito, true), escrito, escrito);
    assert.equal(destinoCom(escrito, false), escrito, escrito);
  }
  r = c.salvar({ versao: r.versao, textos: {}, opcoes: { conviteNoInicio: true } });
  assert.equal(texto(c, 'convite'), PADRAO.convite);
  const noPainel = c.descrever().campos.find((f) => f.id === 'convite.botaoLink');
  assert.equal(noPainel.original, '/regras/', 'no painel, o destino do botão aparece como /regras/');
  // Botão sem texto: fica vazio na página (as regras de visual escondem o retângulo); a imagem continua levando ao mesmo destino.
  r = c.salvar({ versao: r.versao, textos: { 'convite.botao': '' } });
  convite = texto(c, 'convite');
  assert.deepEqual(botaoDoConvite(convite), ['/regras/', '']);
  assert.equal(vezes(convite, `<img class="poster"${CLIQUE_NA_IMAGEM} `), 1);
  r = c.salvar({ versao: r.versao, textos: {} });
  ok('botão do convite: "/regras/", "/" e "/#regras" levam às regras onde elas estiverem; outro destino entra como foi escrito');

  // Clicar na imagem faz o mesmo que o botão, só enquanto o convite é o início do site.
  assert.equal(CLIQUE_NA_IMAGEM, ` onclick="var b=document.querySelector('a.button');if(b)b.click()"`);
  assert.equal(vezes(texto(c, 'convite'), 'onclick='), 1);
  assert.equal(vezes(COPIA.convite, 'onclick='), 0);
  // As regras de visual acompanham as medidas da imagem que estiver valendo.
  // (E a imagem trocada é pedida com a versão dela no endereço: ver "endereços com versão", mais abaixo.)
  const enviar = (largura, altura) => {
    const corpo = pngSimples(8, 4, [largura % 256, 0, 0]);
    c.trocarImagem('convite', { corpo, tipo: 'image/png', ext: 'png', largura, altura });
    return corpo;
  };
  const comAImagem = (bytes, cabeca) => comAImagemTrocada(PADRAO.convite.replace(CABECA_DO_INICIO, cabeca), IMAGEM_DO_CONVITE, bytes);
  let enviada = enviar(800, 400);
  assert.equal(texto(c, 'convite'), comAImagem(enviada, cabecaDoInicio({ largura: 800, altura: 400 })));
  assert.ok(cabecaDoInicio({ largura: 800, altura: 400 }).includes('aspect-ratio:auto 800/400') && cabecaDoInicio({ largura: 800, altura: 400 }).includes('*2.0000)'));
  enviada = enviar(0, 0); // imagem cujo tamanho não pôde ser lido: a página só não reserva o espaço dela
  assert.equal(texto(c, 'convite'), comAImagem(enviada, cabecaDoInicio(null)));
  assert.ok(!cabecaDoInicio(null).includes('aspect-ratio:auto') && cabecaDoInicio(null).includes('*1.7778)'));
  c.removerImagem('convite');
  assert.equal(texto(c, 'convite'), PADRAO.convite);
  // As regras de visual são as que foram medidas no navegador (estão por extenso no apoio.mjs).
  assert.equal(cabecaDoInicio({ largura: 1200, altura: 675 }), CABECA_DO_INICIO);
  // Com outra imagem, só muda o que depende do formato dela: a proporção, o espaço reservado e as duas
  // alturas de tela em que a imagem passa para o lado do texto (uma imagem mais alta precisa de mais tela).
  const comOutraImagem = (largura, altura, proporcao, imagemPequena, botaoEmbaixo) =>
    CABECA_DO_INICIO.split('*1.7778)').join(`*${proporcao})`)
      .replace('aspect-ratio:auto 1200/675', `aspect-ratio:auto ${largura}/${altura}`)
      .replace('(max-height:479px)', `(max-height:${imagemPequena}px)`)
      .replace('(max-height:618px)', `(max-height:${botaoEmbaixo}px)`);
  assert.equal(vezes(CABECA_DO_INICIO, '*1.7778)'), 3);
  assert.equal(cabecaDoInicio({ largura: 800, altura: 400 }), comOutraImagem(800, 400, '2.0000', 460, 581), 'imagem mais comprida');
  assert.equal(cabecaDoInicio({ largura: 900, altura: 900 }), comOutraImagem(900, 900, '1.0000', 610, 881), 'imagem quadrada');
  assert.equal(cabecaDoInicio({ largura: 675, altura: 1200 }), comOutraImagem(675, 1200, '0.5625', 843, 1347), 'imagem em pé');
  assert.equal(cabecaDoInicio(null), CABECA_DO_INICIO.replace(';aspect-ratio:auto 1200/675', ''), 'sem as medidas, vale o formato da imagem original');
  assert.deepEqual(alturasDeTelaBaixa(1200 / 675), { imagemPequena: 479, botaoEmbaixo: 618 });
  assert.deepEqual(alturasDeTelaBaixa(1), { imagemPequena: 610, botaoEmbaixo: 881 });
  // Uma imagem que é um fio de tão comprida, ou de tão alta, não põe números inválidos nas regras.
  assert.equal(cabecaDoInicio({ largura: 65535, altura: 1 }), comOutraImagem(65535, 1, '20.0000', 325, 311));
  assert.equal(cabecaDoInicio({ largura: 1, altura: 65535 }), comOutraImagem(1, 65535, '0.1000', 3310, 6281));
  // Com a opção desligada, nada disso entra: mesmo com imagem nova, a página do convite é a da cópia,
  // fora o selo da Manus, que este projeto tira de toda instalação. A outra diferença é o endereço da
  // imagem nova, que leva a versão dela.
  enviada = enviar(800, 400);
  r = c.salvar({ versao: c.versao, opcoes: { conviteNoInicio: false } });
  assert.equal(texto(c, 'convite'), comAImagemTrocada(SEM_COMECAR_PELO_CONVITE.convite, IMAGEM_DO_CONVITE, enviada));
  c.removerImagem('convite');
  assert.equal(texto(c, 'convite'), SEM_COMECAR_PELO_CONVITE.convite, 'de volta à imagem original, a página é a da cópia, fora o selo da Manus');
  ok('a imagem do convite é clicável e as regras de visual seguem as medidas da imagem em uso');
}

// O que o site precisa achar nos arquivos para começar pelo convite. Se um arquivo vier diferente
// (uma cópia nova do site, por exemplo), o site fica como o original e o painel avisa.
{
  const semRaiz = copiaDoSite({ js: (js) => js.replace(BASE_NA_COPIA, 'base:"" ,ssrPath:') });
  const { c, avisos } = novo(pastaTemporaria(), semRaiz);
  const d = c.descrever();
  assert.equal(d.problemas.length, 1, d.problemas.join(' | '));
  assert.ok(d.problemas[0].startsWith('O site não pôde começar pelo convite e ficou como o original, com as regras no endereço principal:'), d.problemas[0]);
  assert.deepEqual(avisos, d.problemas, 'o problema também sai no terminal');
  assert.equal(d.opcoes.conviteNoInicio, true, 'a opção continua ligada: só não pôde ser atendida');
  assert.deepEqual(d.enderecos, ENDERECOS_DO_ORIGINAL);
  assert.equal(c.paginaPara('/'), null);
  assert.deepEqual(c.paginaPara('/regras/'), { ir: '/' });
  assert.equal(c.paginaPara('/convite/'), null);
  assert.equal(texto(c, 'convite'), SEM_COMECAR_PELO_CONVITE.convite, 'o convite fica como na cópia, fora o selo da Manus, com o botão levando a "/"');
  const js = texto(c, 'js');
  assert.ok(!js.includes('location.pathname)?"/regras"') && js.includes(VOLTAR_NA_COPIA), 'e o aplicativo não é mexido pela metade');
  assert.ok(js.includes(ABA_ADMIN) && js.includes('"MURILO MENDES"'), 'o resto continua valendo');
  conferirSintaxe(js);
  ok('sem achar a raiz dos endereços no aplicativo, o site fica como o original e o painel avisa');

  // Os dois acabamentos: sem a marca, só aquele detalhe fica de fora.
  const semAcabamento = copiaDoSite({
    js: (texto) => texto.replace(VOLTAR_NA_COPIA, 'const r=()=>{a( "/")}'),
    convite: (html) => html.replace('<img class="poster"', '<img  class="poster"'),
  });
  const { c: c2 } = novo(pastaTemporaria(), semAcabamento);
  const d2 = c2.descrever();
  assert.deepEqual(d2.enderecos, ENDERECOS, 'o site começa pelo convite do mesmo jeito');
  // (mexer na imagem também tira do painel o campo da descrição dela: são três avisos)
  assert.equal(d2.problemas.length, 3, d2.problemas.join(' | '));
  assert.ok(d2.problemas[0].startsWith('O texto "Descrição da imagem'), d2.problemas[0]);
  assert.ok(d2.problemas[1].startsWith('O botão da tela “página não encontrada” não pôde ser ajustado'), d2.problemas[1]);
  assert.ok(d2.problemas[2].startsWith('A imagem do convite não pôde ficar clicável'), d2.problemas[2]);
  assert.ok(!d2.problemas.some((p) => p.includes('ficou como o original')));
  const js2 = texto(c2, 'js');
  assert.equal(vezes(js2, BASE_ENTREGUE), 1);
  assert.ok(!js2.includes('location.assign'));
  conferirSintaxe(js2);
  const convite2 = texto(c2, 'convite');
  assert.deepEqual(botaoDoConvite(convite2), ['/regras/', 'Consultar regras oficiais']);
  assert.ok(!convite2.includes('onclick=') && convite2.includes('<style id="convite-no-inicio">'));
  assert.deepEqual(linksDe(convite2), [['button', '/regras/', 'Consultar regras oficiais'], ['admin-no-canto', '/admin/', 'Admin']], 'a etiqueta Admin não depende da imagem');
  ok('sem achar o botão da tela "não encontrada" ou a imagem do convite, só esse detalhe fica de fora, e o painel avisa');

  // O terceiro acabamento: a etiqueta Admin entra onde o convite termina. Se esse ponto não for achado
  // (ou aparecer mais de uma vez), a etiqueta fica de fora, com as regras de visual dela; o resto continua.
  for (const [caso, mexer] of [
    ['sem o fim do convite', (html) => html.replace('</main>', '</main >')],
    ['com dois', (html) => html.replace('</section>', '</section><!-- </main> -->')],
  ]) {
    const { c: c3 } = novo(pastaTemporaria(), copiaDoSite({ convite: mexer }));
    const d3 = c3.descrever();
    assert.deepEqual(d3.problemas, ['A etiqueta “Admin” não pôde ser colocada no canto do convite (o painel continua abrindo pelo endereço /admin/).'], caso);
    assert.deepEqual(d3.enderecos, ENDERECOS, `${caso}: o site começa pelo convite do mesmo jeito`);
    assert.equal(texto(c3, 'convite'), mexer(SEM_A_ENTRADA_DO_ADMIN.convite), `${caso}: o convite sai como sairia sem a etiqueta`);
    assert.ok(!texto(c3, 'convite').includes('admin-no-canto'), caso);
    assert.equal(texto(c3, 'js'), PADRAO.js, `${caso}: a aba Admin da página de regras continua`);
  }
  ok('sem achar onde o convite termina, só a etiqueta Admin fica de fora, e o painel avisa');
}

// ───── 8. o link de volta ao convite, na página de regras
{
  const { c } = novo(pastaTemporaria());
  // O texto muda pelo painel, nos dois lugares; mais nada muda.
  let r = c.salvar({ versao: 0, textos: { 'regras.voltar.texto': 'Início' } });
  assert.equal(texto(c, 'js'), comOLinkDeVolta('Início').js);
  assert.equal(vezes(texto(c, 'js'), linkDeVolta('Início')), 2);
  assert.ok(linkDeVolta('Início').endsWith(',"Início"]})})') && linkDeVolta('Início').includes('href:"/"'));
  assert.equal(texto(c, 'index'), comOLinkDeVolta('Início').index, 'na página de regras só muda o endereço do aplicativo, que leva a versão dele');
  assert.equal(texto(c, 'convite'), PADRAO.convite);

  // Texto vazio: o link não entra, nem as regras de visual dele.
  r = c.salvar({ versao: r.versao, textos: { 'regras.voltar.texto': '   ' } });
  assert.deepEqual(r.textos, { 'regras.voltar.texto': '' });
  assert.equal(texto(c, 'js'), SEM_O_LINK_DE_VOLTA.js);
  assert.equal(texto(c, 'index'), SEM_O_LINK_DE_VOLTA.index);
  assert.ok(!(texto(c, 'js') + texto(c, 'index')).includes('voltar-ao-convite'));
  assert.equal(vezes(texto(c, 'index'), '</style>'), vezes(COPIA.index, '</style>') + 1, 'fica só o <style> dos ajustes');
  assert.equal(texto(c, 'convite'), PADRAO.convite);

  // Sem a aba Admin, o link continua: é o último da linha das abas.
  r = c.salvar({ versao: r.versao, textos: {}, opcoes: { abaAdmin: false } });
  const semAdmin = texto(c, 'js');
  assert.equal(semAdmin, PADRAO.js.replace(ABA_ADMIN, ''));
  assert.equal(vezes(semAdmin, `children:"Regras da Polícia"}),${LINK_DE_VOLTA}]})`), 1);
  assert.equal(vezes(semAdmin, LINK_DE_VOLTA), 2);
  conferirSintaxe(semAdmin);
  assert.equal(texto(c, 'index'), SEM_A_ENTRADA_DO_ADMIN.index);

  // O link só existe enquanto o site começa pelo convite. Com as páginas nos lugares do original,
  // a página de regras é o início do site: não há para onde voltar, mesmo com um texto salvo.
  r = c.salvar({ versao: r.versao, textos: { 'regras.voltar.texto': 'Início' }, opcoes: { abaAdmin: true, conviteNoInicio: false } });
  assert.equal(texto(c, 'js'), SEM_COMECAR_PELO_CONVITE.js);
  assert.equal(texto(c, 'index'), SEM_COMECAR_PELO_CONVITE.index);
  r = c.salvar({ versao: r.versao, opcoes: { conviteNoInicio: true } });
  assert.equal(texto(c, 'js'), comOLinkDeVolta('Início').js, 'ligando de novo, o link volta com o texto que estava salvo');
  assert.equal(texto(c, 'index'), comOLinkDeVolta('Início').index);

  // "Restaurar o site original" devolve o texto do projeto.
  assert.deepEqual(c.restaurarOriginal().textos, {});
  assert.equal(texto(c, 'js'), PADRAO.js);
  ok('link de volta: o texto muda pelo painel; vazio, o link não entra; ele só existe enquanto o site começa pelo convite');

  // Aplicativo diferente do esperado: sem achar um dos dois lugares, o link só não entra ali, e o painel avisa.
  const mexerNoTopo = (js) => js.replace('className:"topbar-tools"', 'className:"topbar-tools "');
  const mexerNasAbas = (js) => js.replace('children:"Regras da Polícia"})]})', 'children:"Regras da Polícia"}) ]})');
  const noTopo = `${LINK_DE_VOLTA},R.jsxs("div",{"data-loc":"client/src/pages/Home.tsx:285"`;
  const nasAbas = `children:"Regras da Polícia"}),${LINK_DE_VOLTA}`;

  const semTopo = novo(pastaTemporaria(), copiaDoSite({ js: mexerNoTopo })).c;
  let d = semTopo.descrever();
  assert.equal(d.problemas.length, 1, d.problemas.join(' | '));
  assert.ok(d.problemas[0].startsWith('O link de volta ao convite não pôde ser colocado na barra do topo da página de regras, onde ele aparece no celular:'), d.problemas[0]);
  let js = texto(semTopo, 'js');
  assert.deepEqual([vezes(js, LINK_DE_VOLTA), vezes(js, noTopo), vezes(js, nasAbas + ABA_ADMIN)], [1, 0, 1], 'o link da linha das abas continua');
  assert.ok(texto(semTopo, 'index').includes(ESTILO_DO_LINK_DE_VOLTA));
  conferirSintaxe(js);

  const semAbas = novo(pastaTemporaria(), copiaDoSite({ js: mexerNasAbas })).c;
  d = semAbas.descrever();
  assert.equal(d.problemas.length, 2, d.problemas.join(' | '));
  assert.ok(d.problemas[0].startsWith('A aba "Admin" não pôde ser colocada na página de regras:'), d.problemas[0]);
  assert.ok(d.problemas[1].startsWith('O link de volta ao convite não pôde ser colocado ao lado das abas da página de regras, onde ele aparece no computador'), d.problemas[1]);
  js = texto(semAbas, 'js');
  assert.deepEqual([vezes(js, LINK_DE_VOLTA), vezes(js, noTopo), vezes(js, nasAbas), vezes(js, ABA_ADMIN)], [1, 1, 0, 0], 'o link da barra do topo continua');
  assert.ok(texto(semAbas, 'index').includes(ESTILO_DO_LINK_DE_VOLTA));
  conferirSintaxe(js);

  const semOsDois = novo(pastaTemporaria(), copiaDoSite({ js: (t) => mexerNasAbas(mexerNoTopo(t)) })).c;
  d = semOsDois.descrever();
  assert.equal(d.problemas.length, 3, d.problemas.join(' | '));
  assert.deepEqual(d.enderecos, ENDERECOS, 'o site começa pelo convite do mesmo jeito');
  js = texto(semOsDois, 'js');
  assert.ok(!js.includes('voltar-ao-convite') && !texto(semOsDois, 'index').includes('voltar-ao-convite'), 'sem lugar nenhum para o link, as regras de visual dele também não entram');
  assert.equal(vezes(js, BASE_ENTREGUE), 1);
  conferirSintaxe(js);
  ok('sem achar um dos lugares do link de volta no aplicativo, ele só não entra ali, e o painel avisa');

  // Sem lugar para a aba Admin na página de regras, a etiqueta do convite continua: ela está em outro arquivo.
  assert.equal(texto(semAbas, 'convite'), PADRAO.convite);
  assert.equal(texto(semOsDois, 'convite'), PADRAO.convite);
}

// ───── 9. a etiqueta Admin, no canto do convite
{
  const { c } = novo(pastaTemporaria());
  const oBotaoEAEtiqueta = [['button', '/regras/', 'Consultar regras oficiais'], ['admin-no-canto', '/admin/', 'Admin']];
  assert.deepEqual(linksDe(texto(c, 'convite')), oBotaoEAEtiqueta);

  // A opção do painel tira as duas entradas de uma vez: a aba da página de regras e a etiqueta do convite.
  // Sem a etiqueta, o convite sai byte a byte como saía antes de ela existir.
  let r = c.salvar({ versao: 0, opcoes: { abaAdmin: false } });
  assert.equal(texto(c, 'convite'), SEM_A_ENTRADA_DO_ADMIN.convite);
  assert.equal(SEM_A_ENTRADA_DO_ADMIN.convite, PADRAO.convite.replace(LINK_DO_ADMIN, '').replace(`\n${ESTILO_DO_LINK_DO_ADMIN}`, ''), 'o que muda no convite é só o link e as regras de visual dele');
  assert.equal(texto(c, 'js'), SEM_A_ENTRADA_DO_ADMIN.js);
  assert.equal(SEM_A_ENTRADA_DO_ADMIN.js, PADRAO.js.replace(ABA_ADMIN, ''));
  assert.equal(texto(c, 'index'), SEM_A_ENTRADA_DO_ADMIN.index, 'na página de regras só muda o endereço do aplicativo, que agora é outro');
  assert.deepEqual(linksDe(texto(c, 'convite')), [oBotaoEAEtiqueta[0]], 'o botão volta a ser o único link do convite');
  assert.ok(!(texto(c, 'convite') + texto(c, 'js') + texto(c, 'index')).includes('/admin/'), 'nenhuma página aponta para o painel');
  r = c.salvar({ versao: r.versao, opcoes: { abaAdmin: true } });
  assert.equal(texto(c, 'convite'), PADRAO.convite);
  assert.equal(texto(c, 'js'), PADRAO.js);

  // A etiqueta só existe enquanto o convite é o início do site. Com as páginas nos lugares do original, o
  // início é a página de regras, que tem a aba Admin; o convite, em /convite/, é o da cópia, fora o selo da Manus.
  r = c.salvar({ versao: r.versao, opcoes: { conviteNoInicio: false } });
  assert.equal(texto(c, 'convite'), SEM_COMECAR_PELO_CONVITE.convite);
  assert.equal(texto(c, 'js'), SEM_COMECAR_PELO_CONVITE.js);
  assert.equal(vezes(texto(c, 'js'), ABA_ADMIN), 1);
  r = c.salvar({ versao: r.versao, opcoes: { conviteNoInicio: true } });
  assert.equal(texto(c, 'convite'), PADRAO.convite);

  // Ela não depende do que o administrador põe no convite: outros textos, outro destino no botão, botão sem texto, outra imagem.
  r = c.salvar({ versao: r.versao, textos: { 'convite.sobretitulo': '', 'convite.titulo': 'Outro <título>', 'convite.texto': 'Outro texto', 'convite.botao': '', 'convite.botaoLink': 'https://discord.gg/exemplo' } });
  c.trocarImagem('convite', { corpo: pngSimples(8, 8), tipo: 'image/png', ext: 'png', largura: 900, altura: 900 });
  let convite = texto(c, 'convite');
  assert.deepEqual(linksDe(convite), [['button', 'https://discord.gg/exemplo', ''], oBotaoEAEtiqueta[1]]);
  assert.equal(vezes(convite, `</main>${LINK_DO_ADMIN}\n  </body>`), 1);
  assert.equal(vezes(convite, `${cabecaDoInicio({ largura: 900, altura: 900 })}\n${ESTILO_DO_LINK_DO_ADMIN}</head>`), 1, 'as regras de visual da etiqueta são sempre as mesmas, seja qual for a imagem');
  c.removerImagem('convite');

  // Sem o selo da hospedagem original, e com CSS do administrador (que vem depois, e pode mudar a etiqueta).
  r = c.salvar({ versao: c.versao, textos: {}, opcoes: { removerManus: true, cssExtra: '.admin-no-canto{display:none}' } }); // (trocar a imagem também cria versão)
  convite = texto(c, 'convite');
  assert.deepEqual(linksDe(convite), oBotaoEAEtiqueta);
  assert.match(convite, /<\/main><a class="admin-no-canto" href="\/admin\/">Admin<\/a>\s*<\/body>\s*<\/html>\s*$/);
  assert.equal(vezes(convite, `${CABECA_DO_INICIO}\n${ESTILO_DO_LINK_DO_ADMIN}\n<style id="ajustes-do-admin">\n.admin-no-canto{display:none}\n</style></head>`), 1);

  // "Restaurar o site original" devolve a etiqueta, como tudo o mais.
  r = c.salvar({ versao: r.versao, opcoes: { abaAdmin: false } });
  assert.ok(!texto(c, 'convite').includes(LINK_DO_ADMIN));
  assert.equal(c.restaurarOriginal().opcoes.abaAdmin, true);
  assert.equal(texto(c, 'convite'), PADRAO.convite);
  ok('etiqueta Admin: liga e desliga junto com a aba Admin; só existe enquanto o site começa pelo convite; não depende dos textos nem da imagem');
}

// ───── 10. endereços com versão: o que muda pelo painel é pedido por um endereço que muda junto
// Entre o servidor e o visitante pode haver quem guarde arquivos por um tempo sem perguntar se mudaram.
// As páginas são pedidas a cada visita; o que elas carregam, nem sempre. Com a versão no endereço,
// ninguém tem guardada uma cópia antiga do que acabou de mudar.
{
  const { c } = novo(pastaTemporaria());
  const pedidoDoAplicativo = (html) => /<script type="module" crossorigin src="([^"]*)"><\/script>/.exec(html)[1];
  const comVersao = (t) => (t.match(/"(?:https?:\/\/[^"\s?]*|\/[^"\s?]*)\?v=[A-Za-z0-9_-]+"/g) || []).sort();
  const todos = () => ['js', 'index', 'convite', 'manifesto'].flatMap((nome) => comVersao(texto(c, nome) ?? COPIA[nome]));

  // O aplicativo de regras: a página pede pelo resumo do que o servidor entrega.
  const versaoInicial = versaoDe(PADRAO.js);
  assert.match(versaoInicial, /^[A-Za-z0-9_-]{10}$/);
  assert.equal(pedidoDoAplicativo(texto(c, 'index')), `/assets/index-FbaU4KfD.js?v=${versaoInicial}`);
  assert.equal(pedidoDoAplicativo(COPIA.index), '/assets/index-FbaU4KfD.js', 'na cópia, o endereço não tem versão');
  assert.equal(c.gerar(ARQUIVOS.js).versao, versaoInicial);
  assert.ok(c.gerar(ARQUIVOS.js).etag.startsWith(`W/"a-${versaoInicial}`), 'é o mesmo resumo que identifica o arquivo para o navegador');
  assert.deepEqual(todos(), [`"/assets/index-FbaU4KfD.js?v=${versaoInicial}"`], 'numa instalação nova, é o único endereço com versão');

  // Mudou um texto das regras: o aplicativo é outro, e o endereço dele também.
  let r = c.salvar({ versao: 0, textos: { 'regras.topo.menu': 'Sumário' } });
  const versaoComOTexto = versaoDe(texto(c, 'js'));
  assert.notEqual(versaoComOTexto, versaoInicial);
  assert.equal(texto(c, 'index'), pedindoOAplicativo(PADRAO.index, texto(c, 'js')), 'na página de regras, só o endereço do aplicativo muda');
  assert.equal(pedidoDoAplicativo(texto(c, 'index')), `/assets/index-FbaU4KfD.js?v=${versaoComOTexto}`);
  // Um texto que só existe no convite não mexe no aplicativo nem no endereço dele.
  r = c.salvar({ versao: r.versao, textos: { 'regras.topo.menu': 'Sumário', 'convite.titulo': 'Outro título' } });
  assert.equal(pedidoDoAplicativo(texto(c, 'index')), `/assets/index-FbaU4KfD.js?v=${versaoComOTexto}`);
  // Voltando o texto, volta o endereço: a versão depende só do conteúdo.
  r = c.salvar({ versao: r.versao, textos: {} });
  assert.equal(texto(c, 'index'), PADRAO.index);
  // Quando o aplicativo é o da cópia, sem tirar nem pôr, o endereço fica como na cópia.
  r = c.salvar({ versao: r.versao, opcoes: { abaAdmin: false, conviteNoInicio: false, removerManus: false }, textos: CREDITOS_DA_COPIA });
  assert.equal(c.gerar(ARQUIVOS.js), null);
  assert.equal(c.gerar(ARQUIVOS.index), null);
  r = c.salvar({ versao: r.versao, opcoes: { abaAdmin: true, conviteNoInicio: true, removerManus: true }, textos: {} });
  assert.equal(texto(c, 'index'), PADRAO.index);
  ok('a página de regras pede o aplicativo pela versão dele, que muda quando um texto das regras muda');

  // Imagens trocadas pelo painel: o endereço de cada uma ganha o resumo do arquivo enviado.
  const enviar = (id, corpo, medidas = {}) => c.trocarImagem(id, { corpo, tipo: 'image/png', ext: 'png', largura: 1200, altura: 675, ...medidas });
  const convite1 = pngSimples(8, 4, [10, 20, 30]);
  const convite2 = pngSimples(8, 4, [30, 20, 10]);
  enviar('convite', convite1);
  assert.match(versaoDaImagem(convite1), /^[0-9a-f]{12}$/);
  assert.equal(texto(c, 'convite'), comAImagemTrocada(PADRAO.convite, IMAGEM_DO_CONVITE, convite1), 'no convite, só o endereço da imagem muda');
  assert.equal(vezes(texto(c, 'convite'), `<img class="poster"${CLIQUE_NA_IMAGEM} src="/fronteira-sul-convite-preview.jpg?v=${versaoDaImagem(convite1)}" alt="`), 1);
  assert.equal(texto(c, 'js'), PADRAO.js, 'o aplicativo não usa a imagem do convite');
  assert.equal(texto(c, 'index'), PADRAO.index);
  // (sem o endereço público preenchido, a imagem da prévia de link continua apontando para o site original, sem versão)
  assert.equal(vezes(texto(c, 'convite'), `content="${ORIGEM_ORIGINAL}/fronteira-sul-convite-preview.jpg"`), 3);
  enviar('convite', convite2);
  assert.equal(texto(c, 'convite'), comAImagemTrocada(PADRAO.convite, IMAGEM_DO_CONVITE, convite2), 'outra imagem, outro endereço');
  assert.notEqual(versaoDaImagem(convite1), versaoDaImagem(convite2));
  // Um texto do administrador igual ao endereço da imagem, com aspas e tudo, continua sendo só um texto.
  r = c.salvar({ versao: c.versao, textos: { 'convite.titulo': 'Veja "/fronteira-sul-convite-preview.jpg" aqui' } });
  assert.equal(vezes(texto(c, 'convite'), '<h1 id="title">Veja "/fronteira-sul-convite-preview.jpg" aqui</h1>'), 1);
  assert.equal(vezes(texto(c, 'convite'), '?v='), 1, 'a versão entra só no endereço da imagem');
  r = c.salvar({ versao: r.versao, textos: {} });
  // Com o endereço público, a imagem da prévia de link leva a mesma versão (uma vez só).
  r = c.salvar({ versao: r.versao, opcoes: { enderecoPublico: 'https://meusite.com.br' } });
  for (const nome of ['index', 'convite']) {
    assert.equal(vezes(texto(c, nome), `content="https://meusite.com.br/fronteira-sul-convite-preview.jpg?v=${versaoDaImagem(convite2)}"`), 3, nome);
    assert.ok(!texto(c, nome).includes('?v=' + versaoDaImagem(convite2) + '?v='), nome);
  }
  r = c.salvar({ versao: r.versao, opcoes: { enderecoPublico: '' } });
  c.removerImagem('convite');
  assert.equal(texto(c, 'convite'), PADRAO.convite, 'de volta à imagem original, o endereço volta a ser o da cópia');
  ok('imagem do convite trocada: a página pede a imagem pela versão do arquivo enviado');

  // O logo aparece no aplicativo, em dois endereços; e é o ícone, enquanto o ícone não tem imagem própria.
  const logo = pngSimples(8, 8, [1, 2, 3]);
  const icone = pngSimples(8, 8, [3, 2, 1]);
  enviar('logo', logo, { largura: 8, altura: 8 });
  const vLogo = versaoDaImagem(logo);
  let js = texto(c, 'js');
  let jsEsperado = comAImagemTrocada(comAImagemTrocada(PADRAO.js, '/manus-storage/fronteira-sul-logo_1b1b4c2d.webp', logo), '/fronteira-sul-logo.webp', logo);
  assert.equal(js, jsEsperado);
  assert.equal(vezes(js, `ng="/manus-storage/fronteira-sul-logo_1b1b4c2d.webp?v=${vLogo}"`), 1);
  assert.equal(vezes(js, `o("/fronteira-sul-logo.webp?v=${vLogo}")`), 1);
  assert.equal(comVersao(js).length, 2, 'e mais nenhum endereço com versão');
  conferirSintaxe(js);
  assert.equal(texto(c, 'index'), pedindoOAplicativo(PADRAO.index, jsEsperado), 'o aplicativo mudou: a página de regras pede o novo');
  assert.notEqual(versaoDe(jsEsperado), versaoInicial);
  assert.equal(texto(c, 'convite'), PADRAO.convite, 'o convite não usa o logo');
  const iconesDe = (t) => JSON.parse(t).icons.map((i) => i.src);
  assert.deepEqual(iconesDe(COPIA.manifesto), ['/favicon.ico', '/favicon.ico']);
  assert.deepEqual(iconesDe(texto(c, 'manifesto')), [`/favicon.ico?v=${vLogo}`, `/favicon.ico?v=${vLogo}`], 'sem ícone próprio, o ícone é o logo novo');
  assert.equal(texto(c, 'manifesto'), comAImagemTrocada(COPIA.manifesto, '/favicon.ico', logo), 'na lista de ícones, só os endereços mudam');
  enviar('icone', icone, { largura: 8, altura: 8 });
  assert.deepEqual(iconesDe(texto(c, 'manifesto')), [`/favicon.ico?v=${versaoDaImagem(icone)}`, `/favicon.ico?v=${versaoDaImagem(icone)}`]);
  assert.equal(texto(c, 'js'), jsEsperado, 'o ícone próprio não muda o aplicativo');
  // Um nome de site igual ao endereço do ícone não vira endereço.
  r = c.salvar({ versao: c.versao, textos: { 'compartilhar.nomeDoApp': '/favicon.ico' } });
  const manifesto = JSON.parse(texto(c, 'manifesto'));
  assert.deepEqual([manifesto.name, manifesto.short_name], ['/favicon.ico', '/favicon.ico']);
  assert.deepEqual(manifesto.icons.map((i) => i.src), [`/favicon.ico?v=${versaoDaImagem(icone)}`, `/favicon.ico?v=${versaoDaImagem(icone)}`]);
  r = c.salvar({ versao: r.versao, textos: {} });
  c.removerImagem('icone');
  c.removerImagem('logo');
  assert.equal(texto(c, 'js'), PADRAO.js);
  assert.equal(texto(c, 'index'), PADRAO.index);
  assert.equal(c.gerar(ARQUIVOS.manifesto), null);
  assert.deepEqual(todos(), [`"/assets/index-FbaU4KfD.js?v=${versaoInicial}"`]);
  ok('logo e ícone trocados: o aplicativo e a lista de ícones pedem as imagens pela versão do arquivo enviado');
}

resumo();
