// Testa a parte que guarda as alterações e monta as páginas (../conteudo.mjs).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { criarConteudo, ErroDeConteudo } from '../conteudo.mjs';
import { ARQUIVOS, CAMPOS, ORIGEM_ORIGINAL } from '../mapa.mjs';
import { ABA_ADMIN, BLOCO_DO_CONVITE, CABECA_DO_CONVITE, COPIA, CREDITOS_DA_COPIA, PADRAO, SITE, esconderLinha, ok, pastaTemporaria, pngSimples, resumo } from './apoio.mjs';

/** O bloco do convite dentro do aplicativo montado: vai do começo da página até a barra do topo. */
function blocoEm(js) {
  const inicio = js.indexOf('className:"site-shell",children:[') + 'className:"site-shell",children:['.length;
  const fim = js.indexOf('R.jsxs("header",', inicio);
  assert.ok(inicio > 40 && fim >= inicio, 'não achei o começo da página no aplicativo');
  return js.slice(inicio, fim);
}

function novo(pasta) {
  const avisos = [];
  const c = criarConteudo({ raizSite: SITE, dirDados: pasta, aviso: (m) => avisos.push(m) });
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
  assert.equal(texto(c, 'index'), PADRAO.index);
  assert.equal(texto(c, 'convite'), PADRAO.convite);
  for (const nome of ['manifesto', 'robots', 'sitemap']) assert.equal(c.gerar(ARQUIVOS[nome]), null, nome);
  assert.equal(c.gerar('assets/index-DMP8NyHf.css'), null);
  assert.deepEqual(d.textos, {});
  assert.ok(!fs.existsSync(path.join(pasta, 'conteudo.json')));
  ok('instalação nova: a cópia mais o convite no início, os créditos novos e a aba Admin; nada é gravado');

  // O convite, com as palavras do pedido: a imagem, os três textos e o botão, antes de tudo na página.
  assert.ok(js.includes('className:"site-shell",children:[R.jsx("section",{className:"fs-convite"'), 'o convite é o primeiro item da página');
  const bloco = blocoEm(js);
  assert.equal(bloco, BLOCO_DO_CONVITE);
  for (const trecho of [
    'R.jsx("img",{className:"fs-convite-imagem",src:"/fronteira-sul-convite-preview.jpg",',
    'width:1200,height:675',
    'children:"CONVITE OFICIAL"',
    'children:"Uma nova história começa aqui."',
    'children:"Conheça a cidade, confira as regras oficiais e prepare-se para o roleplay."',
    'R.jsx("a",{className:"fs-convite-botao",href:"#inicio",onClick:',
    'children:"Consultar regras oficiais"',
    // a imagem tem um "CONSULTE AS REGRAS" desenhado: clicar nela faz o mesmo que o botão
    'decoding:"async",style:{cursor:"pointer"},onClick:e=>{const b=e.currentTarget.closest(".fs-convite")?.querySelector(".fs-convite-botao");b&&b.click()}})',
  ]) {
    assert.equal(bloco.split(trecho).length, 2, trecho);
  }
  assert.ok(js.indexOf('id:"inicio"') > js.indexOf(bloco), 'o botão aponta para as regras, que vêm depois do convite');
  assert.equal(js.split('className:"fs-convite"').length, 2, 'o convite entra uma vez só');
  assert.equal(js.split('className:"fs-convite-botao"').length, 2, 'com um botão só');
  assert.equal(js.split(ABA_ADMIN).length, 2, 'a aba Admin entra uma vez só');
  const index = texto(c, 'index');
  assert.ok(index.includes('<link rel="preload" as="image" href="/fronteira-sul-convite-preview.jpg" />'));
  assert.ok(index.includes('<style id="convite-no-inicio">'));
  assert.ok(index.indexOf(CABECA_DO_CONVITE) < index.indexOf('</head>'));
  // Junto com o convite: o espaço do logo já reservado na barra do topo e a busca sem puxar a página para cima.
  assert.ok(index.includes('\n.topbar-brand img{aspect-ratio:auto 1200/676}\n</style>'));
  assert.ok(index.includes('\nhtml:has(#rules-search:focus){scroll-padding-top:0}\n'));
  // Na página /convite/, o botão abre a página de regras já depois do convite (senão o visitante veria o convite duas vezes).
  assert.ok(texto(c, 'convite').includes('<a class="button" href="/#inicio">Consultar regras oficiais</a>'));
  assert.ok(bloco.includes('ref:e=>{') && bloco.includes('location.hash!=="#inicio"'), 'e a página de regras atende a esse endereço');
  ok('o convite (imagem, textos e botão que leva às regras) é o primeiro item da página de regras');

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

  // site/ continua sendo a cópia: desfazendo as três mudanças do projeto, tudo sai byte a byte como ela.
  const r2 = c.salvar({ versao: 0, opcoes: { abaAdmin: false, conviteNoInicio: false }, textos: CREDITOS_DA_COPIA });
  assert.equal(r2.versao, 1);
  for (const rel of Object.values(ARQUIVOS)) assert.equal(c.gerar(rel), null, rel);
  ok('sem o convite, sem a aba Admin e com os créditos da cópia, todos os arquivos saem como o original');
}

// ───── 2. cada campo, um por vez
{
  const { c } = novo(pastaTemporaria());
  const d = c.descrever();
  /** Os textos do convite aparecem também no bloco do início da página de regras, que fica dentro do aplicativo. */
  const NO_BLOCO = new Set(['convite.sobretitulo', 'convite.titulo', 'convite.texto', 'convite.botao', 'convite.botaoLink', 'convite.imagemDescricao']);
  let versao = 0;
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

    const arquivosDoCampo = new Set(campo.locais.map((l) => l.arquivo));
    const noBloco = NO_BLOCO.has(campo.id);
    // Uma linha que vem escondida (campo vazio) volta a aparecer quando o campo ganha texto.
    const apareceALinha = info.escondeSeVazio && info.original === '';
    let achados = 0;
    for (const nome of Object.keys(ARQUIVOS)) {
      const t = texto(c, nome);
      const padrao = PADRAO[nome] ?? null; // o que a instalação nova entrega (null = o arquivo da cópia)
      const peloBloco = nome === 'js' && noBloco;
      if (nome === 'index' && apareceALinha) {
        assert.equal(t, PADRAO.index.replace(`${campo.seVazioEsconde}{display:none!important}\n`, ''), `${campo.id}: só a regra que escondia a linha sai da página`);
        continue;
      }
      if (!arquivosDoCampo.has(nome) && !peloBloco) {
        // Arquivo que o campo não toca: igual ao de uma instalação nova.
        assert.equal(t, padrao, `${campo.id} mexeu em ${nome}`);
        continue;
      }
      assert.ok(t != null, `${campo.id}: ${nome} não foi montado`);
      if (campo.tipo === 'telefone') achados += t.split('+55 (11) 91234-5678').length - 1 + (t.split('tel:+5511912345678').length - 1);
      else achados += t.split(valor).length - 1;
      if (nome === 'js') conferirSintaxe(t);
      if (nome === 'manifesto') JSON.parse(t);
      if (peloBloco && campo.tipo === 'link') {
        // No bloco, "/" aparece como "#inicio"; outro destino entra como foi escrito, e só isso muda.
        assert.ok(blocoEm(t).includes(`className:"fs-convite-botao",href:${JSON.stringify(valor)},onClick:`), campo.id);
        assert.equal(t.length, PADRAO.js.length + valor.length - '#inicio'.length, `${campo.id}: tamanho de ${nome}`);
        continue;
      }
      // Só os trechos do campo mudaram: o tamanho do arquivo bate com a troca.
      if (nome !== 'manifesto' && campo.tipo !== 'telefone') {
        // (o botão do convite com outro destino: aí a página /convite/ parte da cópia, sem o atalho para as regras)
        const base = (campo.id === 'convite.botaoLink' ? COPIA[nome] : padrao ?? COPIA[nome]).length;
        const lugares = peloBloco ? 1 : campo.locais.filter((l) => l.arquivo === nome).length;
        assert.equal(t.length, base + lugares * (valor.length - info.original.length), `${campo.id}: tamanho de ${nome}`);
      }
    }
    const esperados = campo.locais.reduce((soma, l) => soma + (l.chaves ? l.chaves.length : 1), 0) + (noBloco ? 1 : 0);
    assert.equal(achados, esperados, `${campo.id}: lugares trocados`);
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
  // Na página de regras, as únicas tags a mais são as do convite (visual e pré-carregamento da imagem).
  const tagsEsperadas = { index: contarTags(COPIA.index) + contarTags(CABECA_DO_CONVITE), convite: contarTags(COPIA.convite) };
  for (const nome of ['index', 'convite']) {
    const html = texto(c, nome);
    assert.equal(contarTags(html), tagsEsperadas[nome], `${nome}: o texto não pode criar tags`);
    assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'));
  }
  assert.ok(texto(c, 'convite').includes('href="https://exemplo.com/a?b=1&amp;c=&quot;2&quot;"'));
  // No bloco do início, os mesmos textos entram como texto do aplicativo (nunca como código).
  const bloco = blocoEm(js);
  for (const classe of ['fs-convite-sobretitulo', 'fs-convite-descricao']) assert.ok(bloco.includes(`className:"${classe}",children:${JSON.stringify(esperado)}`), classe);
  assert.ok(bloco.includes(`id:"fs-convite-titulo",className:"fs-convite-titulo",children:${JSON.stringify(esperado)}`));
  assert.ok(bloco.includes(`alt:${JSON.stringify(esperado)}`));
  // O botão é o mesmo da instalação nova (mesmo clique); só o destino e o texto mudam.
  const botaoPadrao = 'R.jsx("a",{className:"fs-convite-botao",href:"#inicio",onClick:';
  const fimDoBotaoPadrao = ',children:"Consultar regras oficiais"})';
  const clique = BLOCO_DO_CONVITE.slice(BLOCO_DO_CONVITE.indexOf(botaoPadrao) + botaoPadrao.length, BLOCO_DO_CONVITE.indexOf(fimDoBotaoPadrao));
  assert.ok(clique.startsWith('e=>{') && clique.endsWith('}') && !clique.includes('R.jsx'), 'não achei o clique do botão na instalação nova');
  assert.ok(bloco.includes(`R.jsx("a",{className:"fs-convite-botao",href:${JSON.stringify('https://exemplo.com/a?b=1&c="2"')},onClick:${clique},children:${JSON.stringify(esperado)}})`));
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
  assert.equal(a.length, d.regulamento.original.length - 1 + 3);
  assert.deepEqual(a.slice(0, 3).map((s) => s.id), ['apresentacao', 'regras-de-ouro', 'regras-gerais']);
  assert.equal(a[0].paragraphs[0], 'Linha 1\nLinha 2 com \'aspas\' e "aspas" e \\ barra');
  const nova = a.find((s) => s.title === 'Seção Nova ção');
  assert.equal(nova.id, 'secao-nova-cao');
  assert.deepEqual(nova.paragraphs, ['Primeiro\n segundo pedaço', 'Outro.']);
  assert.equal(a.find((s) => s.title === 'Repetida').id, 'apresentacao-2');
  assert.equal(a.find((s) => s.title === 'Autor').id, 'secao-autor');
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
  assert.equal((index.match(/<\/style>/g) || []).length, 2, 'só os dois <style> do servidor: o do convite e o dos ajustes');
  assert.ok(index.indexOf('<style id="convite-no-inicio">') < index.indexOf('<style id="ajustes-do-admin">'), 'o CSS do administrador vem por último, para poder mudar o resto');
  assert.equal((index.match(/<script/g) || []).length, (COPIA.index.match(/<script/g) || []).length + 1, 'só aparece como texto dentro do <style>');
  assert.ok(texto(c, 'convite').includes('body{color:red}'));
  assert.ok(!texto(c, 'convite').includes('.author-card'));
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
  assert.equal(r.opcoes.mostrarCreditos, false, 'mudar uma opção preserva as outras');
  ok('tirar o selo e as estatísticas da hospedagem original');

  r = c.salvar({ versao: r.versao, opcoes: { enderecoPublico: 'meusite.com.br/qualquer/coisa' } });
  assert.equal(r.opcoes.enderecoPublico, 'https://meusite.com.br');
  for (const nome of ['index', 'convite', 'robots', 'sitemap']) {
    const t = texto(c, nome);
    assert.ok(!t.includes(ORIGEM_ORIGINAL), nome);
    assert.ok(t.includes('https://meusite.com.br'), nome);
  }
  assert.ok(texto(c, 'convite').includes('<link rel="canonical" href="https://meusite.com.br/convite/" />'));
  ok('endereço do site nos links de compartilhamento');

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

// ───── 7. o convite no início da página de regras
{
  const { c } = novo(pastaTemporaria());
  let r = c.salvar({ versao: 0, opcoes: { conviteNoInicio: false } });
  assert.equal(r.opcoes.conviteNoInicio, false);
  assert.equal(texto(c, 'js'), PADRAO.js.replace(BLOCO_DO_CONVITE, ''), 'só o bloco sai do aplicativo');
  assert.equal(texto(c, 'index'), PADRAO.index.replace(`${CABECA_DO_CONVITE}\n`, ''), 'e, da página, só o visual e o pré-carregamento dele');
  assert.ok(!texto(c, 'js').includes('fs-convite') && !texto(c, 'index').includes('fs-convite'));
  assert.equal(c.gerar('convite/index.html'), null, 'e a página /convite/ volta a ser a da cópia (o botão leva a "/")');
  ok('convite desligado: sai da página de regras sem deixar nada para trás; /convite/ fica como na cópia');

  r = c.salvar({ versao: r.versao, opcoes: { conviteNoInicio: true } });
  assert.equal(texto(c, 'js'), PADRAO.js);
  assert.equal(texto(c, 'index'), PADRAO.index);
  assert.equal(texto(c, 'convite'), PADRAO.convite);

  // Os textos são os da página /convite/: mudou lá, mudou no início da página de regras.
  r = c.salvar({ versao: r.versao, textos: { 'convite.titulo': 'Bem-vindo à "cidade"', 'convite.botao': 'Ver as regras', 'convite.sobretitulo': '', 'convite.texto': '' } });
  let js = texto(c, 'js');
  conferirSintaxe(js);
  let bloco = blocoEm(js);
  assert.ok(bloco.includes('className:"fs-convite-titulo",children:"Bem-vindo à \\"cidade\\""'));
  assert.ok(bloco.includes('href:"#inicio",onClick:') && bloco.includes('children:"Ver as regras"'));
  assert.ok(!bloco.includes('fs-convite-sobretitulo') && !bloco.includes('fs-convite-descricao'), 'texto vazio não deixa uma linha vazia');
  assert.ok(texto(c, 'convite').includes('<h1 id="title">Bem-vindo à "cidade"</h1>'));
  assert.ok(texto(c, 'convite').includes('<a class="button" href="/#inicio">Ver as regras</a>'));
  ok('o convite do início usa os mesmos textos da página /convite/');

  // O botão: "/" (as regras) vira "#inicio"; qualquer outro destino entra como foi escrito.
  // (Na hora do clique, o botão desce a página se o link for desta mesma página; senão, o navegador segue o link.)
  for (const destino of ['https://discord.gg/exemplo', '/#regras-gerais', '#regras-gerais', 'https://meu-site.exemplo/']) {
    r = c.salvar({ versao: r.versao, textos: { 'convite.botaoLink': destino } });
    bloco = blocoEm(texto(c, 'js'));
    assert.ok(bloco.includes(`R.jsx("a",{className:"fs-convite-botao",href:${JSON.stringify(destino)},onClick:e=>{`), destino);
    assert.ok(!bloco.includes('href:"#inicio"'), destino);
    assert.ok(texto(c, 'convite').includes(`<a class="button" href="${destino}">Consultar regras oficiais</a>`), `${destino}: na página /convite/ vai o mesmo destino`);
  }
  // "/#inicio" escrito à mão também quer dizer "as regras".
  r = c.salvar({ versao: r.versao, textos: { 'convite.botaoLink': '/#inicio' } });
  assert.ok(blocoEm(texto(c, 'js')).includes('className:"fs-convite-botao",href:"#inicio",onClick:'));
  assert.equal(texto(c, 'convite'), PADRAO.convite);
  r = c.salvar({ versao: r.versao, textos: { 'convite.botao': '' } });
  bloco = blocoEm(texto(c, 'js'));
  assert.ok(!bloco.includes('fs-convite-botao') && !bloco.includes('onClick') && bloco.includes('fs-convite-texto'), 'sem texto, o botão não aparece (e a imagem deixa de ser clicável)');
  assert.ok(bloco.includes('decoding:"async"})'));
  r = c.salvar({ versao: r.versao, textos: { 'convite.botao': '', 'convite.sobretitulo': '', 'convite.titulo': '', 'convite.texto': '' } });
  js = texto(c, 'js');
  conferirSintaxe(js);
  bloco = blocoEm(js);
  assert.ok(bloco.includes('fs-convite-imagem') && !bloco.includes('fs-convite-mensagem') && bloco.includes('"aria-label":"Convite"'), 'sem texto nenhum, fica só a imagem');
  ok('botão do convite: "/" leva às regras, outro destino entra como foi escrito, e sem texto o botão some');

  // A imagem é a do convite (mesmo endereço); as medidas acompanham a imagem que estiver valendo.
  r = c.salvar({ versao: r.versao, textos: {} });
  const enviar = (largura, altura) => c.trocarImagem('convite', { corpo: pngSimples(8, 4, [largura % 256, 0, 0]), tipo: 'image/png', ext: 'png', largura, altura });
  enviar(800, 400);
  bloco = blocoEm(texto(c, 'js'));
  assert.ok(bloco.includes('src:"/fronteira-sul-convite-preview.jpg"') && bloco.includes('width:800,height:400') && bloco.includes('"--fs-convite-proporcao":"2.0000"'));
  enviar(0, 0); // imagem cujo tamanho não pôde ser lido
  bloco = blocoEm(texto(c, 'js'));
  assert.ok(!bloco.includes('width:') && bloco.includes('"--fs-convite-proporcao":"1.7778"'));
  c.removerImagem('convite');
  assert.equal(texto(c, 'js'), PADRAO.js);
  ok('a imagem do início é a do convite: trocou em “Imagens”, trocou nos dois lugares');

  // O espaço reservado para o logo na barra do topo acompanha o logo que estiver valendo.
  const enviarLogo = (largura, altura) => c.trocarImagem('logo', { corpo: pngSimples(8, 4, [0, largura % 256, 0]), tipo: 'image/png', ext: 'png', largura, altura });
  enviarLogo(300, 200);
  assert.equal(texto(c, 'index'), PADRAO.index.replace('aspect-ratio:auto 1200/676', 'aspect-ratio:auto 300/200'));
  enviarLogo(0, 0); // logo cujo tamanho não pôde ser lido: a página só não reserva o espaço
  assert.equal(texto(c, 'index'), PADRAO.index.replace('\n.topbar-brand img{aspect-ratio:auto 1200/676}', ''));
  c.removerImagem('logo');
  assert.equal(texto(c, 'index'), PADRAO.index);
  assert.equal(texto(c, 'js'), PADRAO.js);
  ok('o espaço do logo na barra do topo segue as medidas do logo em uso');
}

resumo();
