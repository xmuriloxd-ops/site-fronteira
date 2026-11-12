// Painel do administrador — Fronteira do Sul RP.
// Fala com o servidor pelos endereços /admin/api/... (ver ../api.mjs).

const LIMITE_IMAGEM = 8 * 1024 * 1024;
const TIPOS_DE_IMAGEM = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const CHAVE_TOKEN = 'fs-admin-token';

// ───────────────────────────── utilidades ─────────────────────────────
const $ = (id) => document.getElementById(id);

/** Cria um elemento. Texto sempre entra como texto, nunca como HTML. */
function h(tag, attrs, ...filhos) {
  const el = document.createElement(tag);
  for (const [chave, valor] of Object.entries(attrs || {})) {
    if (valor === false || valor == null) continue;
    if (chave === 'class') el.className = valor;
    else if (chave === 'text') el.textContent = valor;
    else if (chave.startsWith('on')) el.addEventListener(chave.slice(2), valor);
    else if (chave in el && chave !== 'list' && chave !== 'form') el[chave] = valor;
    else el.setAttribute(chave, valor === true ? '' : valor);
  }
  for (const filho of filhos.flat()) if (filho != null && filho !== false) el.append(filho);
  return el;
}

const botao = (texto, aoClicar, classe = '') => h('button', { type: 'button', class: `botao ${classe}`.trim(), text: texto, onclick: aoClicar });
/** Botão só com um desenho (seta ou xis feitos em CSS: não dependem da fonte do aparelho). */
const botaoDesenho = (desenho, nome, aoClicar, { desligado = false, classe = '' } = {}) =>
  h('button', { type: 'button', class: `botao pequeno icone ${classe}`.trim(), title: nome, 'aria-label': nome, disabled: desligado, onclick: aoClicar }, h('span', { class: `desenho ${desenho}`, 'aria-hidden': 'true' }));
const tem = (obj, chave) => Object.prototype.hasOwnProperty.call(obj, chave);
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** As mesmas limpezas que o servidor faz, para saber se um campo mudou de verdade. */
const umaLinha = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const paragrafosDe = (texto) =>
  String(texto ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n(?:[ \t]*\n)+/)
    .map((p) => p.replace(/\t/g, ' ').replace(/ +\n/g, '\n').trim())
    .filter(Boolean);
const linhasDe = (texto) => String(texto ?? '').split(/\r?\n/).map(umaLinha).filter(Boolean);

function dataLegivel(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return 'data desconhecida';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function tamanhoLegivel(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// ───────────────────────────── estado ─────────────────────────────
let token = '';
try {
  token = sessionStorage.getItem(CHAVE_TOKEN) || '';
} catch {
  // Navegador sem armazenamento (ex.: página embutida com bloqueio): a sessão dura até recarregar.
}
/** { usuario, senhaInicial } */
let sessao = null;
/** O que o servidor descreveu: campos, originais, o que está publicado. */
let servidor = null;
/** O que está nos formulários, salvo ou não. */
let rascunho = null;
/** O envio que corresponde ao que está publicado; serve para saber se há algo por salvar. */
let publicado = '';
let aba = 'regulamento';
let ocupado = false;

function guardarToken(novo) {
  token = novo || '';
  try {
    if (token) sessionStorage.setItem(CHAVE_TOKEN, token);
    else sessionStorage.removeItem(CHAVE_TOKEN);
  } catch {
    /* sem armazenamento: fica só na memória */
  }
}

// ───────────────────────────── servidor ─────────────────────────────
class ErroDoServidor extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

async function api(metodo, rota, { json, arquivo } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  } else if (arquivo) {
    headers['Content-Type'] = arquivo.type || 'application/octet-stream';
    body = arquivo;
  }
  let resposta;
  try {
    resposta = await fetch(`/admin/api/${rota}`, { method: metodo, headers, body, cache: 'no-store' });
  } catch {
    throw new ErroDoServidor(0, 'Não consegui falar com o servidor. Confira a internet e tente de novo.');
  }
  let dados = null;
  try {
    dados = await resposta.json();
  } catch {
    /* resposta sem JSON */
  }
  if (!resposta.ok) {
    const erro = new ErroDoServidor(resposta.status, dados?.erro || `O servidor respondeu com o erro ${resposta.status}.`);
    if (resposta.status === 401 && rota !== 'entrar') sessaoTerminou();
    throw erro;
  }
  return dados;
}

// ───────────────────────────── avisos e confirmações ─────────────────────────────
function avisar(texto, falha = false) {
  const caixa = h('div', { class: falha ? 'aviso falha' : 'aviso', role: falha ? 'alert' : 'status' }, h('p', { text: texto }));
  const fechar = () => caixa.remove();
  caixa.append(h('button', { type: 'button', 'aria-label': 'Fechar aviso', onclick: fechar }, h('span', { class: 'desenho xis', 'aria-hidden': 'true' })));
  $('avisos').append(caixa);
  setTimeout(fechar, falha ? 12000 : 5000);
}

/**
 * Pergunta dentro da própria página. (O confirm() do navegador não funciona
 * quando o painel está aberto dentro de outra página, como numa pré-visualização.)
 */
function confirmar({ titulo, texto, ok = 'Confirmar', cancelar = 'Cancelar', perigo = false }) {
  return new Promise((resolver) => {
    const dialogo = h(
      'dialog',
      { class: 'dialogo' },
      h('h2', { text: titulo }),
      h('p', { text: texto }),
      h(
        'div',
        { class: 'acoes' },
        botao(cancelar, () => dialogo.close('nao')),
        botao(ok, () => dialogo.close('sim'), perigo ? 'perigo' : 'primario'),
      ),
    );
    dialogo.addEventListener('close', () => {
      dialogo.remove();
      resolver(dialogo.returnValue === 'sim');
    });
    document.body.append(dialogo);
    dialogo.showModal();
  });
}

// ───────────────────────────── rascunho ─────────────────────────────
function novoRascunho(d) {
  const textos = {};
  for (const c of d.campos) textos[c.id] = tem(d.textos, c.id) ? d.textos[c.id] : c.original;
  return {
    textos,
    regulamento: d.regulamento ? secoesParaEditar(d.regulamento.atual || d.regulamento.original) : null,
    policia: d.policia ? policiaParaEditar(d.policia.atual || d.policia.original) : null,
    opcoes: { ...d.opcoes },
  };
}

/** No painel, o texto de uma seção é um campo só: parágrafos separados por uma linha em branco. */
const secoesParaEditar = (lista) => lista.map((s) => ({ id: s.id, title: s.title, texto: s.paragraphs.join('\n\n'), aberta: false }));

const policiaParaEditar = (p) => ({
  faixas: p.faixas.map((f) => ({
    id: f.id,
    title: f.title,
    aberta: false,
    fines: f.fines.map((m) => ({ id: m.id, description: m.description, amount: m.amount, points: m.points === undefined ? '' : String(m.points) })),
  })),
  aplicacao: p.aplicacao.join('\n'),
  cnh: p.cnh.join('\n'),
});

/** O que seria enviado ao servidor se o administrador salvasse agora. */
function montarEnvio() {
  const envio = { textos: {}, opcoes: { ...rascunho.opcoes } };
  for (const c of servidor.campos) {
    const valor = rascunho.textos[c.id];
    if (umaLinha(valor) !== c.original) envio.textos[c.id] = valor;
  }
  if (servidor.regulamento) {
    const lista = rascunho.regulamento.map((s) => ({ ...(s.id ? { id: s.id } : {}), title: umaLinha(s.title), paragraphs: paragrafosDe(s.texto) }));
    envio.regulamento = igual(lista, servidor.regulamento.original) ? null : lista;
  }
  if (servidor.policia) {
    const policia = {
      faixas: rascunho.policia.faixas.map((f) => ({
        ...(f.id ? { id: f.id } : {}),
        title: umaLinha(f.title),
        fines: f.fines
          .filter((m) => umaLinha(m.description) || umaLinha(m.amount) || umaLinha(m.points))
          .map((m) => {
            const multa = { ...(m.id ? { id: m.id } : {}), description: umaLinha(m.description), amount: umaLinha(m.amount) };
            const pontos = umaLinha(m.points);
            // Se não for número, vai como está: o servidor explica o erro.
            if (pontos !== '') multa.points = /^\d{1,4}$/.test(pontos) ? Number(pontos) : pontos;
            return multa;
          }),
      })),
      aplicacao: linhasDe(rascunho.policia.aplicacao),
      cnh: linhasDe(rascunho.policia.cnh),
    };
    envio.policia = igual(policia, servidor.policia.original) ? null : policia;
  }
  return envio;
}

const haPendencias = () => !!rascunho && JSON.stringify(montarEnvio()) !== publicado;

/** Passa a valer o que o servidor acabou de responder. */
function sincronizar(dados) {
  const anterior = rascunho;
  servidor = dados;
  rascunho = novoRascunho(dados);
  // Mantém abertas as seções que estavam abertas.
  if (anterior?.regulamento && rascunho.regulamento) rascunho.regulamento.forEach((s, i) => (s.aberta = !!anterior.regulamento[i]?.aberta));
  if (anterior?.policia && rascunho.policia) rascunho.policia.faixas.forEach((f, i) => (f.aberta = !!anterior.policia.faixas[i]?.aberta));
  publicado = JSON.stringify(montarEnvio());
}

/** Depois de trocar uma imagem: só a versão, as imagens e o histórico mudam; o que está sendo editado fica. */
function sincronizarSemPerderEdicao(dados) {
  servidor.versao = dados.versao;
  servidor.atualizadoEm = dados.atualizadoEm;
  servidor.imagens = dados.imagens;
  servidor.historico = dados.historico;
}

let temporizador = 0;
let barraPendente = false;
/** Chamado a cada tecla. A primeira mudança libera o botão de salvar na hora; as seguintes esperam a digitação parar. */
function mudou() {
  clearTimeout(temporizador);
  if (barraPendente) temporizador = setTimeout(atualizarBarra, 120);
  else atualizarBarra();
}

function atualizarBarra() {
  const pendente = haPendencias();
  barraPendente = pendente;
  document.querySelector('.barra').classList.toggle('pendente', pendente);
  $('barra-estado').textContent = pendente ? 'Alterações não salvas' : 'Nada para salvar';
  $('botao-salvar').disabled = !pendente || ocupado;
  $('botao-descartar').disabled = !pendente || ocupado;
}

async function salvar() {
  if (ocupado || !haPendencias()) return;
  ocupado = true;
  $('botao-salvar').textContent = 'Salvando…';
  atualizarBarra();
  try {
    let porCima = false;
    for (;;) {
      try {
        const dados = await api('PUT', 'conteudo', { json: { ...montarEnvio(), ...(porCima ? {} : { versao: servidor.versao }) } });
        sincronizar(dados);
        desenhar({ manterPosicao: true });
        avisar('Salvo. O site já está atualizado.');
        break;
      } catch (erro) {
        if (erro.status !== 409) throw erro;
        porCima = await confirmar({
          titulo: 'O site mudou enquanto você editava',
          texto:
            'Outra pessoa, ou outra aba, salvou alterações depois que você abriu o painel.\n\nSe você salvar por cima, vale o que está nesta tela. A versão da outra pessoa fica guardada em Histórico.',
          ok: 'Salvar por cima',
        });
        if (!porCima) break;
      }
    }
  } catch (erro) {
    if (erro.status !== 401) avisar(erro.message, true);
  } finally {
    ocupado = false;
    $('botao-salvar').textContent = 'Salvar e publicar';
    atualizarBarra();
  }
}

async function descartar() {
  if (!haPendencias()) return;
  const sim = await confirmar({
    titulo: 'Descartar as alterações?',
    texto: 'Tudo o que você mudou e ainda não salvou volta a ficar como está no site.',
    ok: 'Descartar',
    perigo: true,
  });
  if (!sim) return;
  sincronizar(servidor);
  desenhar({ manterPosicao: true });
  atualizarBarra();
}

// ───────────────────────────── peças dos formulários ─────────────────────────────
function campoDeTexto(c) {
  const id = `campo-${c.id.replace(/\W/g, '-')}`;
  const entrada =
    c.tipo === 'longo'
      ? h('textarea', { id, rows: 3, maxLength: c.max })
      : h('input', { id, type: c.tipo === 'email' ? 'email' : c.tipo === 'telefone' ? 'tel' : 'text', maxLength: c.max, autocomplete: 'off' });
  if (c.tipo === 'link' || c.tipo === 'email') entrada.spellcheck = false;
  entrada.value = rascunho.textos[c.id];
  const voltar = h('button', { type: 'button', class: 'link', text: 'Voltar ao original' });
  const caixa = h(
    'div',
    { class: 'campo' },
    h('label', { for: id }, c.rotulo, h('span', { class: 'selo', text: 'alterado' })),
    entrada,
    h('div', { class: 'sob' }, h('span', { class: 'ajuda', text: c.ajuda }), voltar),
  );
  const marcar = () => {
    const alterado = umaLinha(entrada.value) !== c.original;
    caixa.classList.toggle('alterado', alterado);
    voltar.hidden = !alterado;
  };
  entrada.addEventListener('input', () => {
    rascunho.textos[c.id] = entrada.value;
    marcar();
    mudou();
  });
  voltar.addEventListener('click', () => {
    entrada.value = c.original;
    rascunho.textos[c.id] = c.original;
    marcar();
    mudou();
    entrada.focus();
  });
  marcar();
  return caixa;
}

function interruptor(opcao, rotulo, ajuda = '') {
  const caixa = h('input', { type: 'checkbox', checked: !!rascunho.opcoes[opcao] });
  caixa.addEventListener('change', () => {
    rascunho.opcoes[opcao] = caixa.checked;
    mudou();
  });
  return h('label', { class: 'marcar' }, caixa, h('span', null, rotulo, ajuda ? h('small', { text: ajuda }) : null));
}

/** Um campo de texto solto (fora da lista de campos do site), ligado a um objeto do rascunho. */
function campoLivre({ id, rotulo, ajuda = '', objeto, chave, linhas = 0, classe = '', aoMudar, ...attrs }) {
  const entrada = linhas ? h('textarea', { id, rows: linhas, class: classe, ...attrs }) : h('input', { id, type: 'text', autocomplete: 'off', class: classe, ...attrs });
  entrada.value = objeto[chave] ?? '';
  entrada.addEventListener('input', () => {
    objeto[chave] = entrada.value;
    aoMudar?.(entrada.value);
    mudou();
  });
  return h('div', { class: 'campo' }, h('label', { for: id, text: rotulo }), entrada, ajuda ? h('div', { class: 'sob' }, h('span', { class: 'ajuda', text: ajuda })) : null);
}

/** Os campos de uma página do site, agrupados como no mapa. `depois` acrescenta peças ao fim de um grupo. */
function gruposDeCampos(pagina, depois = {}) {
  const grupos = new Map();
  for (const c of servidor.campos) {
    if (c.pagina !== pagina) continue;
    if (!grupos.has(c.grupo)) grupos.set(c.grupo, []);
    grupos.get(c.grupo).push(c);
  }
  return [...grupos].map(([nome, campos]) =>
    h(
      'fieldset',
      { class: 'grupo' },
      h('legend', { text: nome }),
      servidor.interruptores.filter((i) => i.pagina === pagina && i.grupo === nome).map((i) => interruptor(i.opcao, i.rotulo, i.ajuda)),
      campos.map(campoDeTexto),
      depois[nome] || null,
    ),
  );
}

const cabecalho = (titulo, intro) => [h('h1', { text: titulo }), h('p', { class: 'intro', text: intro })];

/** Deixa a caixa de texto do tamanho do texto (até 70% da altura da tela), para não rolar um quadradinho. */
function ajustarAltura(caixa) {
  if (!caixa || !caixa.offsetParent) return; // fechada ou fora da tela: não dá para medir
  const pagina = window.scrollY;
  caixa.style.height = 'auto';
  caixa.style.height = `${Math.min(caixa.scrollHeight + 2, Math.round(window.innerHeight * 0.7))}px`;
  window.scrollTo(0, pagina);
}

function trocarDeLugar(lista, i, j) {
  if (j < 0 || j >= lista.length) return false;
  [lista[i], lista[j]] = [lista[j], lista[i]];
  return true;
}

// ───────────────────────────── aba: regulamento ─────────────────────────────
function abaRegulamento() {
  const pecas = cabecalho('Regulamento', 'As seções da aba “Regulamento geral” do site. Toque em uma seção para mudar o título e o texto.');
  if (!servidor.regulamento) return [...pecas, h('p', { class: 'recado grave', text: 'O regulamento não pôde ser lido do site, então não dá para editar por aqui.' })];

  const lista = h('div');
  const redesenhar = (focar = -1) => {
    lista.replaceChildren(...rascunho.regulamento.map((s, i) => blocoDaSecao(s, i, redesenhar)));
    if (focar >= 0) lista.children[focar]?.querySelector('input')?.focus();
  };
  redesenhar();

  const adicionar = botao('+ Adicionar seção', () => {
    rascunho.regulamento.push({ id: '', title: 'Nova seção', texto: '', aberta: true });
    redesenhar(rascunho.regulamento.length - 1);
    mudou();
  });
  const original = botao('Voltar ao regulamento original', async () => {
    const sim = await confirmar({
      titulo: 'Voltar ao regulamento original?',
      texto: 'Todas as seções voltam a ser as da cópia do site. Só vale depois de salvar.',
      ok: 'Voltar ao original',
      perigo: true,
    });
    if (!sim) return;
    rascunho.regulamento = secoesParaEditar(servidor.regulamento.original);
    redesenhar();
    mudou();
  });
  return [...pecas, lista, h('div', { class: 'acoes fim' }, adicionar, original)];
}

function blocoDaSecao(secao, i, redesenhar) {
  const lista = rascunho.regulamento;
  const titulo = h('span', { class: 'bloco-titulo', text: secao.title || '(sem título)' });
  const conta = h('span', { class: 'bloco-conta' });
  const caixaDoTexto = () => bloco.querySelector('textarea');
  const contar = () => {
    const n = paragrafosDe(secao.texto).length;
    conta.textContent = n === 1 ? '1 parágrafo' : `${n} parágrafos`;
    ajustarAltura(caixaDoTexto());
  };

  const corpo = h(
    'div',
    { class: 'bloco-corpo' },
    campoLivre({ id: `secao-${i}-titulo`, rotulo: 'Título da seção', objeto: secao, chave: 'title', maxLength: 160, aoMudar: (v) => (titulo.textContent = v || '(sem título)') }),
    campoLivre({
      id: `secao-${i}-texto`,
      rotulo: 'Texto',
      objeto: secao,
      chave: 'texto',
      linhas: 14,
      classe: 'longo',
      aoMudar: contar,
      ajuda: 'Deixe uma linha em branco entre um parágrafo e outro. Uma linha curta sem ponto final vira subtítulo no site.',
    }),
    h(
      'div',
      { class: 'acoes' },
      h('button', { type: 'button', class: 'botao pequeno', text: 'Subir', disabled: i === 0, onclick: () => mover(-1) }),
      h('button', { type: 'button', class: 'botao pequeno', text: 'Descer', disabled: i === lista.length - 1, onclick: () => mover(1) }),
      botao(
        'Excluir seção',
        async () => {
          const sim = await confirmar({
            titulo: 'Excluir esta seção?',
            texto: `“${secao.title || 'Sem título'}” sai do regulamento com todo o texto dela. Só vale depois de salvar.`,
            ok: 'Excluir',
            perigo: true,
          });
          if (!sim) return;
          lista.splice(lista.indexOf(secao), 1);
          redesenhar();
          mudou();
        },
        'pequeno perigo',
      ),
    ),
  );
  function mover(passo) {
    const de = lista.indexOf(secao);
    if (!trocarDeLugar(lista, de, de + passo)) return;
    redesenhar();
    mudou();
  }

  const bloco = h('details', { class: 'bloco', open: !!secao.aberta }, h('summary', null, h('span', { class: 'bloco-num', text: String(i + 1).padStart(2, '0') }), titulo, conta), corpo);
  bloco.addEventListener('toggle', () => {
    secao.aberta = bloco.open;
    ajustarAltura(caixaDoTexto());
  });
  contar();
  // Seção que já nasce aberta: só dá para medir depois que entra na página.
  if (secao.aberta) requestAnimationFrame(() => ajustarAltura(caixaDoTexto()));
  return bloco;
}

// ───────────────────────────── aba: página de regras ─────────────────────────────
function abaRegras() {
  return [
    ...cabecalho('Página de regras', 'Os textos fixos da página: topo, abertura, índice, destaque e créditos. O texto das regras fica em “Regulamento”.'),
    ...gruposDeCampos('regras'),
  ];
}

// ───────────────────────────── aba: polícia ─────────────────────────────
function abaPolicia() {
  const pecas = cabecalho('Regras da Polícia', 'A aba “Regras da Polícia” do site: textos, tabela de multas e as duas listas.');
  if (!servidor.policia) {
    return [...pecas, ...gruposDeCampos('policia'), h('p', { class: 'recado grave', text: 'As multas e as listas não puderam ser lidas do site, então não dá para editar por aqui.' })];
  }
  const p = rascunho.policia;

  const faixas = h('div');
  const redesenhar = () => faixas.replaceChildren(...p.faixas.map((f, i) => blocoDaFaixa(f, i, redesenhar)));
  redesenhar();
  const tabela = h(
    'div',
    null,
    h('p', { class: 'texto', text: 'Cada grupo vira uma tabela no site. Deixe “Pontos” vazio quando a multa não tira pontos.' }),
    faixas,
    h(
      'div',
      { class: 'acoes fim' },
      botao('+ Adicionar grupo de multas', () => {
        p.faixas.push({ id: '', title: 'Novo grupo', aberta: true, fines: [{ id: '', description: '', amount: '', points: '' }] });
        redesenhar();
        faixas.lastElementChild?.querySelector('input')?.focus();
        mudou();
      }),
    ),
  );

  const umPorLinha = 'Um item por linha.';
  const listas = [
    campoLivre({ id: 'lista-aplicacao', rotulo: 'Itens da primeira lista', objeto: p, chave: 'aplicacao', linhas: 8, ajuda: umPorLinha }),
    campoLivre({ id: 'lista-cnh', rotulo: 'Itens da segunda lista', objeto: p, chave: 'cnh', linhas: 7, ajuda: umPorLinha }),
  ];
  return [...pecas, ...gruposDeCampos('policia', { Multas: tabela, Listas: listas })];
}

function blocoDaFaixa(faixa, i, redesenhar) {
  const lista = rascunho.policia.faixas;
  const titulo = h('span', { class: 'bloco-titulo', text: faixa.title || '(sem título)' });
  const conta = h('span', { class: 'bloco-conta' });
  const linhas = h('div', { class: 'multas' });

  const desenharLinhas = () => {
    conta.textContent = faixa.fines.length === 1 ? '1 multa' : `${faixa.fines.length} multas`;
    linhas.replaceChildren(
      h('div', { class: 'multa multa-cabeca' }, h('span', { text: 'Infração' }), h('span', { text: 'Valor' }), h('span', { text: 'Pontos' }), h('span')),
      ...faixa.fines.map((multa, j) => {
        const entrada = (chave, rotulo, extra = {}) => {
          const campo = h('input', { id: `grupo-${i}-multa-${j}-${chave}`, type: 'text', autocomplete: 'off', 'aria-label': `${rotulo} da multa ${j + 1}`, placeholder: rotulo, ...extra });
          campo.value = multa[chave];
          campo.addEventListener('input', () => {
            multa[chave] = campo.value;
            mudou();
          });
          return campo;
        };
        const mexer = (passo) => {
          if (!trocarDeLugar(faixa.fines, j, j + passo)) return;
          desenharLinhas();
          mudou();
        };
        return h(
          'div',
          { class: 'multa' },
          entrada('description', 'Infração', { maxLength: 300 }),
          entrada('amount', 'Valor', { maxLength: 60 }),
          entrada('points', 'Pontos', { maxLength: 4, inputMode: 'numeric', placeholder: 'Pts' }),
          h(
            'div',
            { class: 'multa-botoes' },
            botaoDesenho('cima', `Subir a multa ${j + 1}`, () => mexer(-1), { desligado: j === 0 }),
            botaoDesenho('baixo', `Descer a multa ${j + 1}`, () => mexer(1), { desligado: j === faixa.fines.length - 1 }),
            botaoDesenho(
              'xis',
              `Excluir a multa ${j + 1}`,
              () => {
                faixa.fines.splice(j, 1);
                desenharLinhas();
                mudou();
              },
              { classe: 'perigo' },
            ),
          ),
        );
      }),
    );
  };
  desenharLinhas();

  const mover = (passo) => {
    const de = lista.indexOf(faixa);
    if (!trocarDeLugar(lista, de, de + passo)) return;
    redesenhar();
    mudou();
  };
  const corpo = h(
    'div',
    { class: 'bloco-corpo' },
    campoLivre({ id: `grupo-${i}-titulo`, rotulo: 'Título do grupo', objeto: faixa, chave: 'title', maxLength: 160, aoMudar: (v) => (titulo.textContent = v || '(sem título)') }),
    linhas,
    h(
      'div',
      { class: 'acoes' },
      h('button', {
        type: 'button',
        class: 'botao pequeno',
        text: '+ Adicionar multa',
        onclick: () => {
          faixa.fines.push({ id: '', description: '', amount: '', points: '' });
          desenharLinhas();
          linhas.lastElementChild?.querySelector('input')?.focus();
          mudou();
        },
      }),
      h('button', { type: 'button', class: 'botao pequeno', text: 'Subir grupo', disabled: i === 0, onclick: () => mover(-1) }),
      h('button', { type: 'button', class: 'botao pequeno', text: 'Descer grupo', disabled: i === lista.length - 1, onclick: () => mover(1) }),
      botao(
        'Excluir grupo',
        async () => {
          const sim = await confirmar({
            titulo: 'Excluir este grupo de multas?',
            texto: `“${faixa.title || 'Sem título'}” sai do site com todas as multas dele. Só vale depois de salvar.`,
            ok: 'Excluir',
            perigo: true,
          });
          if (!sim) return;
          lista.splice(lista.indexOf(faixa), 1);
          redesenhar();
          mudou();
        },
        'pequeno perigo',
      ),
    ),
  );
  const bloco = h('details', { class: 'bloco', open: !!faixa.aberta }, h('summary', null, h('span', { class: 'bloco-num', text: String(i + 1).padStart(2, '0') }), titulo, conta), corpo);
  bloco.addEventListener('toggle', () => (faixa.aberta = bloco.open));
  return bloco;
}

// ───────────────────────────── aba: convite ─────────────────────────────
function abaConvite() {
  const paraImagens = h('p', { class: 'texto' }, 'Para trocar a foto do convite, vá em ', h('button', { type: 'button', class: 'link', text: 'Imagens', onclick: () => irPara('imagens') }), '.');
  return [...cabecalho('Convite', 'A página do convite: a imagem, o texto e o botão que leva às regras. Com a primeira opção abaixo ligada, é por ela que o site começa.'), ...gruposDeCampos('convite', { Imagem: paraImagens })];
}

// ───────────────────────────── aba: imagens ─────────────────────────────
function abaImagens() {
  return [
    ...cabecalho('Imagens', 'Troque as fotos do site. A imagem nova entra no ar assim que o envio termina, sem precisar salvar. Aceita PNG, JPG, WebP e GIF de até 8 MB.'),
    ...servidor.imagens.map(cartaoDaImagem),
  ];
}

function cartaoDaImagem(img) {
  const herdando = !img.atual && img.herda && servidor.imagens.find((x) => x.id === img.herda)?.atual;
  let situacao;
  if (img.atual) {
    const medidas = img.atual.largura ? ` · ${img.atual.largura} × ${img.atual.altura}` : '';
    situacao = h('p', { class: 'situacao' }, h('b', { text: 'Imagem enviada por você' }), ` em ${dataLegivel(img.atual.enviadaEm)}${medidas} · ${tamanhoLegivel(img.atual.bytes)}`);
  } else {
    situacao = h('p', { class: 'situacao', text: herdando ? 'Usando o logo que você enviou.' : 'Imagem original do site.' });
  }

  const seletor = h('input', { type: 'file', id: `arquivo-${img.id}`, accept: TIPOS_DE_IMAGEM.join(',') });
  const rotulo = h('label', { class: 'botao primario', for: seletor.id, text: 'Escolher outra imagem…' });
  seletor.addEventListener('change', async () => {
    const arquivo = seletor.files?.[0];
    seletor.value = '';
    if (!arquivo) return;
    if (arquivo.type && !TIPOS_DE_IMAGEM.includes(arquivo.type)) return avisar('Esse arquivo não serve. Envie uma imagem PNG, JPG, WebP ou GIF.', true);
    if (arquivo.size > LIMITE_IMAGEM) return avisar(`Essa imagem tem ${tamanhoLegivel(arquivo.size)}. O máximo é 8 MB; envie uma versão menor.`, true);
    rotulo.textContent = 'Enviando…';
    try {
      sincronizarSemPerderEdicao(await api('PUT', `imagens/${img.id}`, { arquivo }));
      avisar(`${img.rotulo}: imagem trocada. Já está no site.`);
    } catch (erro) {
      if (erro.status !== 401) avisar(erro.message, true);
    }
    if (aba === 'imagens') desenhar({ manterPosicao: true });
  });

  const voltar =
    img.atual &&
    botao('Voltar à imagem original', async () => {
      const sim = await confirmar({ titulo: 'Voltar à imagem original?', texto: `${img.rotulo}: a imagem que você enviou é apagada e o site volta a mostrar a original.`, ok: 'Voltar à original', perigo: true });
      if (!sim) return;
      try {
        sincronizarSemPerderEdicao(await api('DELETE', `imagens/${img.id}`));
        avisar(`${img.rotulo}: voltou a imagem original.`);
      } catch (erro) {
        if (erro.status !== 401) avisar(erro.message, true);
      }
      if (aba === 'imagens') desenhar({ manterPosicao: true });
    });

  return h(
    'section',
    { class: 'imagem' },
    // O número no fim só serve para o navegador buscar a imagem de novo depois de uma troca.
    h('div', { class: 'imagem-previa' }, h('img', { src: `${img.caminho}?v=${servidor.versao}`, alt: `${img.rotulo} em uso no site` })),
    h('div', null, h('h2', { text: img.rotulo }), h('p', { class: 'ajuda', text: img.ajuda }), situacao, h('div', { class: 'acoes' }, seletor, rotulo, voltar || null)),
  );
}

// ───────────────────────────── aba: compartilhamento ─────────────────────────────
function abaCompartilhar() {
  const endereco = h(
    'fieldset',
    { class: 'grupo' },
    h('legend', { text: 'Endereço do site' }),
    campoLivre({
      id: 'opcao-endereco',
      rotulo: 'Endereço onde este site está publicado',
      objeto: rascunho.opcoes,
      chave: 'enderecoPublico',
      placeholder: 'https://meusite.com.br',
      inputMode: 'url',
      spellcheck: false,
      ajuda: `Enquanto este campo estiver vazio, os links de compartilhamento apontam para o site original (${servidor.origemOriginal.replace('https://', '')}): quem colar o link no Discord ou no WhatsApp vê o título e a imagem de lá.`,
    }),
  );
  return [
    ...cabecalho('Compartilhamento', 'O que aparece na aba do navegador e na prévia quando o link do site é colado no Discord, no WhatsApp ou em redes sociais.'),
    endereco,
    ...gruposDeCampos('compartilhar'),
  ];
}

// ───────────────────────────── aba: avançado ─────────────────────────────
function abaAvancado() {
  return [
    ...cabecalho('Avançado', 'Opções que mexem no site inteiro.'),
    h(
      'fieldset',
      { class: 'grupo' },
      h('legend', { text: 'Hospedagem original' }),
      interruptor(
        'removerManus',
        'Tirar o selo “Made with Manus” e as estatísticas da hospedagem original',
        'O site foi copiado com o selo da Manus no canto da tela e com scripts que enviam as visitas para a Manus, o Plausible e o Amplitude. Marque para as páginas deixarem de carregar tudo isso.',
      ),
    ),
    h(
      'fieldset',
      { class: 'grupo' },
      h('legend', { text: 'CSS extra' }),
      campoLivre({
        id: 'opcao-css',
        rotulo: 'CSS acrescentado às duas páginas',
        objeto: rascunho.opcoes,
        chave: 'cssExtra',
        linhas: 10,
        classe: 'codigo',
        spellcheck: false,
        placeholder: '.hero h1 em { color: #7fd0ff; }',
        ajuda: 'Para quem conhece CSS: serve para mudar cores, tamanhos e espaços que não têm campo próprio no painel.',
      }),
    ),
  ];
}

// ───────────────────────────── aba: histórico ─────────────────────────────
async function trocarTudo(pergunta, pedido, feito) {
  if (ocupado) return;
  const extra = haPendencias() ? '\n\nO que você editou e ainda não salvou será perdido.' : '';
  if (!(await confirmar({ ...pergunta, texto: pergunta.texto + extra, perigo: true }))) return;
  ocupado = true;
  try {
    sincronizar(await pedido());
    avisar(feito);
  } catch (erro) {
    if (erro.status !== 401) avisar(erro.message, true);
  } finally {
    ocupado = false;
  }
  desenhar();
  atualizarBarra();
}

function abaHistorico() {
  const versoes = servidor.historico.map((v) => {
    const partes = [];
    if (v.textos) partes.push(v.textos === 1 ? '1 texto alterado' : `${v.textos} textos alterados`);
    if (v.regulamento) partes.push('regulamento alterado');
    if (v.policia) partes.push('regras da polícia alteradas');
    return h(
      'li',
      null,
      h('span', null, `Versão publicada em ${dataLegivel(v.publicadaEm)}`, h('small', { text: partes.length ? partes.join(' · ') : 'textos iguais aos do site original' })),
      h('button', {
        type: 'button',
        class: 'botao pequeno',
        text: 'Voltar para esta',
        onclick: () =>
          trocarTudo(
            { titulo: 'Voltar para esta versão?', texto: `Os textos, as regras e as opções voltam a ser os de ${dataLegivel(v.publicadaEm)}. As imagens não mudam.`, ok: 'Voltar para esta' },
            () => api('POST', `historico/${v.id}/restaurar`),
            'Pronto. O site voltou para a versão escolhida.',
          ),
      }),
    );
  });

  return [
    ...cabecalho('Histórico', 'Toda vez que você salva, a versão anterior dos textos fica guardada aqui (as 15 mais recentes). As imagens não entram no histórico.'),
    h(
      'section',
      { class: 'grupo' },
      h('h2', { text: 'Versões anteriores' }),
      versoes.length ? h('ul', { class: 'versoes' }, versoes) : h('p', { class: 'texto', text: 'Ainda não há versões anteriores.' }),
    ),
    h(
      'section',
      { class: 'grupo' },
      h('h2', { text: 'Site original' }),
      h('p', { class: 'texto', text: 'Desfaz tudo o que foi mudado pelo painel: textos, regras, opções e imagens voltam a ser como eram antes de qualquer alteração feita aqui. O usuário e a senha não mudam.' }),
      h(
        'div',
        { class: 'acoes' },
        botao(
          'Restaurar o site original',
          () =>
            trocarTudo(
              { titulo: 'Restaurar o site original?', texto: 'Todos os textos, as regras e as opções voltam ao original, e as imagens que você enviou são apagadas.', ok: 'Restaurar tudo' },
              () => api('POST', 'restaurar-original'),
              'Pronto. O site voltou ao original.',
            ),
          'perigo',
        ),
      ),
    ),
  ];
}

// ───────────────────────────── aba: usuário e senha ─────────────────────────────
function abaAcesso() {
  const campo = (id, rotulo, attrs, ajuda = '') => {
    const entrada = h('input', { id, ...attrs });
    return [entrada, h('div', { class: 'campo' }, h('label', { for: id, text: rotulo }), entrada, ajuda ? h('div', { class: 'sob' }, h('span', { class: 'ajuda', text: ajuda })) : null)];
  };
  const [usuario, caixaUsuario] = campo(
    'acesso-usuario',
    'Usuário',
    { type: 'text', value: sessao.usuario, autocomplete: 'username', autocapitalize: 'none', spellcheck: false, maxLength: 32 },
    'De 3 a 32 caracteres: letras sem acento, números, ponto, traço ou _.',
  );
  const [nova, caixaNova] = campo('acesso-nova', 'Nova senha', { type: 'password', autocomplete: 'new-password', maxLength: 128 }, 'Pelo menos 6 caracteres. Deixe vazio para manter a senha atual.');
  const [repetir, caixaRepetir] = campo('acesso-repetir', 'Repita a nova senha', { type: 'password', autocomplete: 'new-password', maxLength: 128 });
  const [atual, caixaAtual] = campo('acesso-atual', 'Senha atual', { type: 'password', autocomplete: 'current-password', required: true }, 'Para confirmar que é você.');
  const erro = h('p', { class: 'erro', role: 'alert', hidden: true });
  const enviar = h('button', { type: 'submit', class: 'botao primario', text: 'Trocar' });

  const formulario = h('form', { class: 'grupo', novalidate: true }, h('h2', { text: 'Trocar usuário e senha' }), caixaUsuario, caixaNova, caixaRepetir, caixaAtual, erro, h('div', { class: 'acoes fim' }, enviar));
  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const falhar = (texto, onde) => {
      erro.textContent = texto;
      erro.hidden = false;
      onde?.focus();
    };
    erro.hidden = true;
    const novoUsuario = usuario.value.trim().toLowerCase();
    if (!novoUsuario) return falhar('Escreva o usuário.', usuario);
    if (nova.value !== repetir.value) return falhar('As duas senhas novas não são iguais.', repetir);
    if (!nova.value && novoUsuario === sessao.usuario) return falhar('Mude o usuário ou escreva uma nova senha.', nova);
    if (!atual.value) return falhar('Escreva a senha atual.', atual);
    enviar.disabled = true;
    try {
      sessao = await api('POST', 'acesso', { json: { senhaAtual: atual.value, novoUsuario, novaSenha: nova.value } });
      avisar(nova.value ? 'Usuário e senha trocados. Na próxima vez, entre com os dados novos.' : 'Usuário trocado. Na próxima vez, entre com o usuário novo.');
      desenhar();
    } catch (falha) {
      if (falha.status !== 401) falhar(falha.message, falha.status === 403 ? atual : null);
    } finally {
      enviar.disabled = false;
    }
  });

  return [
    ...cabecalho('Usuário e senha', 'Os dados usados para entrar neste painel. Ao trocar, quem estiver com o painel aberto em outro aparelho precisa entrar de novo.'),
    formulario,
  ];
}

// ───────────────────────────── navegação ─────────────────────────────
const ABAS = [
  { id: 'regulamento', nome: 'Regulamento', pecas: abaRegulamento },
  { id: 'regras', nome: 'Página de regras', pecas: abaRegras },
  { id: 'policia', nome: 'Regras da Polícia', pecas: abaPolicia },
  { id: 'convite', nome: 'Convite', pecas: abaConvite },
  { id: 'imagens', nome: 'Imagens', pecas: abaImagens },
  { id: 'compartilhar', nome: 'Compartilhamento', pecas: abaCompartilhar },
  { id: 'avancado', nome: 'Avançado', pecas: abaAvancado },
  { id: 'historico', nome: 'Histórico', pecas: abaHistorico },
  { id: 'acesso', nome: 'Usuário e senha', pecas: abaAcesso },
];

function desenhar({ manterPosicao = false } = {}) {
  if (!sessao || !servidor) return;
  const posicao = window.scrollY;
  // Ao redesenhar a mesma aba (depois de salvar, por exemplo), o cursor volta para o campo em que estava.
  const emFoco = manterPosicao && document.activeElement?.id && $('conteudo').contains(document.activeElement) ? document.activeElement : null;
  const foco = emFoco && { id: emFoco.id, inicio: emFoco.selectionStart, fim: emFoco.selectionEnd, rolagem: emFoco.scrollTop };
  if (!ABAS.some((a) => a.id === aba)) aba = ABAS[0].id;

  $('menu').replaceChildren(...ABAS.map((a) => h('button', { type: 'button', text: a.nome, 'aria-current': a.id === aba ? 'page' : null, onclick: () => irPara(a.id) })));
  $('menu').querySelector('[aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  $('topo-usuario').textContent = sessao.usuario;
  // "Ver regras" e "Ver convite": onde cada página está agora (muda com a opção "Começar o site pelo convite").
  for (const link of document.querySelectorAll('[data-ver]')) link.setAttribute('href', servidor.enderecos[link.dataset.ver]);

  const recados = [];
  if (sessao.senhaInicial && aba !== 'acesso') {
    recados.push(
      h('p', { class: 'recado' }, 'Você ainda está usando a senha inicial. Qualquer pessoa que a conheça pode editar o site.', h('button', { type: 'button', class: 'link', text: 'Trocar a senha', onclick: () => irPara('acesso') })),
    );
  }
  if (servidor.problemas.length) {
    recados.push(h('div', { class: 'recado grave' }, 'Algumas partes do site não puderam ser lidas e não aparecem aqui para editar:', h('ul', null, servidor.problemas.map((p) => h('li', { text: p })))));
  }
  $('conteudo').replaceChildren(...recados, ...ABAS.find((a) => a.id === aba).pecas());
  const campo = foco && $(foco.id);
  if (campo) {
    campo.focus({ preventScroll: true });
    if (typeof foco.inicio === 'number' && campo.setSelectionRange) {
      try {
        campo.setSelectionRange(foco.inicio, foco.fim);
      } catch {
        /* tipo de campo sem seleção */
      }
    }
    campo.scrollTop = foco.rolagem;
  }
  window.scrollTo(0, manterPosicao ? posicao : 0);
}

function irPara(id) {
  aba = id;
  history.replaceState(null, '', `#${id}`);
  desenhar();
}

// ───────────────────────────── entrar e sair ─────────────────────────────
function mostrar(tela) {
  $('carregando').hidden = true;
  $('tela-entrar').hidden = tela !== 'entrar';
  $('tela-painel').hidden = tela !== 'painel';
}

function mostrarEntrada(aviso = '') {
  $('entrar-aviso').textContent = aviso;
  $('entrar-aviso').hidden = !aviso;
  $('entrar-erro').hidden = true;
  $('entrar-senha').value = '';
  mostrar('entrar');
  ($('entrar-usuario').value ? $('entrar-senha') : $('entrar-usuario')).focus();
}

function mostrarPainel() {
  mostrar('painel');
  desenhar();
  atualizarBarra();
}

function sessaoTerminou() {
  if (!token && !$('tela-entrar').hidden) return;
  guardarToken('');
  sessao = null;
  mostrarEntrada(rascunho && haPendencias() ? 'Sua sessão terminou. Entre de novo: o que você estava editando continua aqui.' : 'Sua sessão terminou. Entre de novo para continuar.');
}

async function entrar(evento) {
  evento.preventDefault();
  const erro = $('entrar-erro');
  const usuario = $('entrar-usuario').value.trim();
  const senha = $('entrar-senha').value;
  erro.hidden = true;
  if (!usuario || !senha) {
    erro.textContent = 'Escreva o usuário e a senha.';
    erro.hidden = false;
    return;
  }
  $('entrar-botao').disabled = true;
  $('entrar-botao').textContent = 'Entrando…';
  try {
    const dados = await api('POST', 'entrar', { json: { usuario, senha } });
    guardarToken(dados.token);
    sessao = { usuario: dados.usuario, senhaInicial: dados.senhaInicial };
    // Se a sessão caiu no meio de uma edição, o rascunho continua como estava.
    if (!rascunho) sincronizar(await api('GET', 'conteudo'));
    $('entrar-senha').value = '';
    mostrarPainel();
  } catch (falha) {
    erro.textContent = falha.message;
    erro.hidden = false;
    $('entrar-senha').select();
  } finally {
    $('entrar-botao').disabled = false;
    $('entrar-botao').textContent = 'Entrar';
  }
}

async function sair() {
  if (haPendencias()) {
    const sim = await confirmar({ titulo: 'Sair sem salvar?', texto: 'Há alterações que ainda não foram salvas. Se você sair agora, elas serão perdidas.', ok: 'Sair sem salvar', perigo: true });
    if (!sim) return;
  }
  try {
    await api('POST', 'sair');
  } catch {
    /* sem conexão: a sessão termina sozinha */
  }
  guardarToken('');
  sessao = null;
  servidor = null;
  rascunho = null;
  mostrarEntrada();
}

// ───────────────────────────── início ─────────────────────────────
$('form-entrar').addEventListener('submit', entrar);
$('botao-sair').addEventListener('click', sair);
$('botao-salvar').addEventListener('click', salvar);
$('botao-descartar').addEventListener('click', descartar);

// Links para o site: avisa antes de sair do painel com alterações por salvar.
for (const link of document.querySelectorAll('[data-sair-do-painel]')) {
  link.addEventListener('click', async (evento) => {
    if (!haPendencias() || evento.ctrlKey || evento.metaKey || evento.shiftKey) return;
    evento.preventDefault();
    const sim = await confirmar({ titulo: 'Sair do painel sem salvar?', texto: 'Há alterações que ainda não foram salvas. Se você abrir o site agora, elas serão perdidas.', ok: 'Sair sem salvar', perigo: true });
    if (sim) {
      rascunho = null;
      window.location.href = link.href;
    }
  });
}

window.addEventListener('beforeunload', (evento) => {
  if (!haPendencias()) return;
  evento.preventDefault();
  evento.returnValue = '';
});

document.addEventListener('keydown', (evento) => {
  if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 's' && !$('tela-painel').hidden) {
    evento.preventDefault();
    salvar();
  }
});

window.addEventListener('hashchange', () => {
  const id = window.location.hash.slice(1);
  if (sessao && id !== aba && ABAS.some((a) => a.id === id)) {
    aba = id;
    desenhar();
  }
});

(async function iniciar() {
  const pedida = window.location.hash.slice(1);
  if (ABAS.some((a) => a.id === pedida)) aba = pedida;
  if (token) {
    try {
      sessao = await api('GET', 'sessao');
      sincronizar(await api('GET', 'conteudo'));
      mostrarPainel();
      return;
    } catch (erro) {
      if (erro.status !== 401) {
        mostrarEntrada();
        $('entrar-erro').textContent = erro.message;
        $('entrar-erro').hidden = false;
        return;
      }
      // 401: a tela de entrada já foi mostrada por sessaoTerminou().
      return;
    }
  }
  mostrarEntrada();
})();
