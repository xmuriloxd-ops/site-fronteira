/**
 * Conteúdo editável do site.
 *
 * Monta, na hora de entregar cada página, a versão que vale. São três camadas:
 *
 *   1. os arquivos de ../site: a cópia exata do site original, só lida;
 *   2. o que este projeto mudou em relação à cópia (os `padrao` e as opções
 *      de mapa.mjs): vale em toda instalação e é o "original" do painel;
 *   3. o que o administrador alterou pelo painel (dados/conteudo.json).
 *
 * "Restaurar o original" é deixar de aplicar a camada 3.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import {
  BASE_DAS_REGRAS,
  BASE_ORIGINAL,
  CLIQUE_NA_IMAGEM,
  ESTILO_DO_LINK_DE_VOLTA,
  MARCA_DA_BASE,
  MARCA_DA_IMAGEM,
  MARCA_DO_TOPO,
  MARCA_DO_VOLTAR,
  VOLTAR_ORIGINAL,
  VOLTAR_PARA_O_INICIO,
  cabecaDoInicio,
  ehAsRegras,
  enderecos,
  linkDeVolta,
  paginaDoEndereco,
} from './convite-no-inicio.mjs';
import { analisarImagem } from './imagem.mjs';
import { ARQUIVOS, CAMPOS, IDS_RESERVADOS, IMAGENS, INTERRUPTORES, OPCOES_PADRAO, ORIGEM_ORIGINAL } from './mapa.mjs';

const FORMATO = 1;
const MAX_HISTORICO = 15;

/** Endereço da imagem do convite dentro do site (as medidas dela reservam o espaço na página do convite). */
const IMAGEM_DO_CONVITE = IMAGENS.find((img) => img.id === 'convite').caminhos[0];

/** A aba "Admin": entra logo depois das duas abas da página de regras (e do link de volta ao convite, quando ele existe). */
const FIM_DAS_ABAS = 'children:"Regras da Polícia"})';
const MARCA_DAS_ABAS = `${FIM_DAS_ABAS}]})`;
const ABA_ADMIN =
  ',R.jsx("a",{className:"view-tab",href:"/admin/",style:{display:"inline-flex",alignItems:"center",marginLeft:"auto",textDecoration:"none"},children:"Admin"})';

/** Erro causado pelo que o administrador enviou; a mensagem é mostrada no painel. */
export class ErroDeConteudo extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

// ───────────────────────────── texto ─────────────────────────────
const CONTROLES = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u2028\u2029\uFEFF]/g;

/** Texto de uma linha só: quebras viram espaço. */
function linhaUnica(valor) {
  return String(valor ?? '')
    .replace(/\r\n?|\n|\t/g, ' ')
    .replace(CONTROLES, '')
    .replace(/ {2,}/g, ' ')
    .trim();
}

/** Parágrafo: pode ter quebras de linha, mas não linhas em branco. */
function variasLinhas(valor) {
  return String(valor ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(CONTROLES, '')
    .replace(/ +\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function slug(texto, reserva = 'item') {
  const s = String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return s || reserva;
}

const escaparAtributo = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escaparTexto = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const desescaparHtml = (v) =>
  String(v)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&amp;/g, '&');
/** Texto dentro de um modelo entre crases do JavaScript. */
const escaparModelo = (v) => String(v).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
const soTelefone = (v) => {
  const t = String(v).trim();
  return (t.startsWith('+') ? '+' : '') + t.replace(/\D/g, '');
};

/** Lê um texto entre aspas do JavaScript a partir da aspa de abertura. */
function lerLiteral(txt, i) {
  const aspa = txt[i];
  if (aspa !== '"' && aspa !== "'") throw new Error('esperava uma aspa');
  let valor = '';
  for (let p = i + 1; p < txt.length; p++) {
    const c = txt[p];
    if (c === aspa) return { fim: p + 1, valor };
    if (c === '\n') break;
    if (c !== '\\') {
      valor += c;
      continue;
    }
    const d = txt[++p];
    if (d === 'n') valor += '\n';
    else if (d === 'r') valor += '\r';
    else if (d === 't') valor += '\t';
    else if (d === 'b') valor += '\b';
    else if (d === 'f') valor += '\f';
    else if (d === 'v') valor += '\v';
    else if (d === '0' && !/[0-9]/.test(txt[p + 1] || '')) valor += '\0';
    else if (d === 'x') {
      valor += String.fromCharCode(parseInt(txt.slice(p + 1, p + 3), 16));
      p += 2;
    } else if (d === 'u' && txt[p + 1] === '{') {
      const fim = txt.indexOf('}', p);
      valor += String.fromCodePoint(parseInt(txt.slice(p + 2, fim), 16));
      p = fim;
    } else if (d === 'u') {
      valor += String.fromCharCode(parseInt(txt.slice(p + 1, p + 5), 16));
      p += 4;
    } else if (d !== '\n') valor += d;
  }
  throw new Error('texto sem aspa de fechamento');
}

/** Posição única de `trecho` em `txt`; erro se não existir ou se repetir. */
function unico(txt, trecho) {
  const i = txt.indexOf(trecho);
  if (i < 0) throw new Error('o trecho esperado não existe no arquivo');
  if (txt.indexOf(trecho, i + 1) >= 0) throw new Error('o trecho esperado aparece mais de uma vez no arquivo');
  return i;
}

/** Aplica as trocas (posições do texto original) de trás para a frente. */
function aplicarTrocas(txt, trocas) {
  const ordenadas = [...trocas].sort((a, b) => b.inicio - a.inicio || b.fim - a.fim);
  let saida = txt;
  let limite = Infinity;
  for (const t of ordenadas) {
    if (t.fim > limite) throw new Error('duas alterações no mesmo trecho');
    saida = saida.slice(0, t.inicio) + t.novo + saida.slice(t.fim);
    limite = t.inicio;
  }
  return saida;
}

// ───────────────────────────── leitura do original ─────────────────────────────
/** Acha, no arquivo original, o lugar que um "local" do mapa descreve. */
function resolverLocal(textos, local) {
  const txt = textos[local.arquivo];
  if (txt == null) throw new Error(`o arquivo "${local.arquivo}" não pôde ser lido`);

  if (local.arquivo === 'manifesto') {
    const json = JSON.parse(txt);
    return { tipo: 'manifesto', chaves: local.chaves, valor: String(json[local.chaves[0]] ?? ''), comparavel: true };
  }

  if (local.modelo) {
    const [antes, valor, depois] = local.modelo;
    const i = unico(txt, antes + valor + depois) + antes.length;
    return { tipo: 'trecho', inicio: i, fim: i + valor.length, valor, escrever: escaparModelo, comparavel: true };
  }

  if (local.arquivo === 'js') {
    const base = unico(txt, local.apos) + local.apos.length;
    let aspa = base;
    if (local.chave) {
      const k = txt.indexOf(`${local.chave}"`, base);
      if (k < 0 || k - base > 1500) throw new Error(`não achei ${local.chave} depois da marca`);
      aspa = k + local.chave.length;
    }
    const { fim, valor: bruto } = lerLiteral(txt, aspa);
    // Espaços nas pontas (ex.: " CENTRAL DE REGRAS") fazem parte do visual e ficam fora do campo.
    const prefixo = local.prefixo ?? /^\s*/.exec(bruto)[0];
    if (!bruto.startsWith(prefixo)) throw new Error(`o texto original não começa com "${prefixo}"`);
    const sufixo = local.prefixo != null ? '' : /\s*$/.exec(bruto.slice(prefixo.length))[0];
    const transformar = local.transformar === 'telefone' ? soTelefone : (v) => v;
    return {
      tipo: 'trecho',
      inicio: aspa,
      fim,
      valor: bruto.slice(prefixo.length, bruto.length - sufixo.length),
      escrever: (v) => JSON.stringify(prefixo + transformar(v) + sufixo),
      comparavel: !local.transformar,
    };
  }

  // HTML: o texto fica entre `antes` e `depois`.
  const inicio = unico(txt, local.antes) + local.antes.length;
  const fim = txt.indexOf(local.depois, inicio);
  if (fim < 0) throw new Error('não achei o fim do trecho');
  return {
    tipo: 'trecho',
    inicio,
    fim,
    valor: desescaparHtml(txt.slice(inicio, fim)),
    escrever: local.escape === 'attr' ? escaparAtributo : escaparTexto,
    comparavel: true,
  };
}

/** Acha o regulamento (uma lista em JSON dentro do aplicativo). */
function resolverRegulamento(js) {
  const marca = "QA=JSON.parse('";
  const i = unico(js, marca);
  const lido = lerLiteral(js, i + marca.length - 1);
  if (js[lido.fim] !== ')') throw new Error('formato inesperado');
  return { inicio: i + 'QA='.length, fim: lido.fim + 1, original: JSON.parse(lido.valor) };
}

/** Acha uma lista de dados escrita direto no código, entre `abre` e `fecha`. */
function resolverLista(js, abre, fecha) {
  const inicio = unico(js, abre) + abre.length - 1;
  const fim = js.indexOf(fecha, inicio);
  if (fim < 0) throw new Error('não achei o fim da lista');
  // É só uma lista de dados do próprio site: roda isolada e vira JSON puro.
  const valor = vm.runInNewContext(`(${js.slice(inicio, fim + 1)})`, Object.create(null), { timeout: 1000 });
  return { inicio, fim: fim + 1, original: JSON.parse(JSON.stringify(valor)) };
}

// ───────────────────────────── validação do que o painel envia ─────────────────────────────
const LIMITES = { curto: 300, longo: 3000, link: 500, email: 200, telefone: 60 };

function limparCampo(campo, valor) {
  if (typeof valor !== 'string') throw new ErroDeConteudo(`"${campo.rotulo}": valor inválido.`);
  const v = linhaUnica(valor);
  const max = LIMITES[campo.tipo || 'curto'];
  if (v.length > max) throw new ErroDeConteudo(`"${campo.rotulo}": o texto passou de ${max} caracteres.`);
  if (campo.tipo === 'link' && !/^(https?:\/\/[^\s]+|\/(?!\/)[^\s]*|#[^\s]*|mailto:[^\s]+|tel:[^\s]+)$/i.test(v)) {
    throw new ErroDeConteudo(`"${campo.rotulo}": use /regras/ para a página de regras, um caminho começando com / ou um endereço completo começando com https://`);
  }
  if (campo.tipo === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    throw new ErroDeConteudo(`"${campo.rotulo}": o e-mail não parece válido.`);
  }
  return v;
}

/**
 * Devolve um identificador que ainda não foi usado. Identificadores viram
 * âncoras da página (#secao), então não podem repetir nem bater com os que a
 * página já usa.
 */
function idUnico(desejado, usados, reserva) {
  const texto = String(desejado || '');
  let base = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(texto) && texto.length <= 80 ? texto : slug(texto, reserva);
  const reservado = (id) => IDS_RESERVADOS.has(id) || /^(police|match)-/.test(id) || /-title$/.test(id);
  if (reservado(base)) base = `${reserva}-${base}`.slice(0, 70).replace(/-+$/g, '');
  let id = base;
  for (let n = 2; usados.has(id) || reservado(id); n++) id = `${base}-${n}`;
  usados.add(id);
  return id;
}

function limparRegulamento(entrada) {
  if (!Array.isArray(entrada)) throw new ErroDeConteudo('Regulamento: formato inválido.');
  if (entrada.length > 100) throw new ErroDeConteudo('Regulamento: o máximo é de 100 seções.');
  const secoes = entrada.map((s, i) => {
    if (!s || typeof s !== 'object') throw new ErroDeConteudo(`Regulamento: a seção ${i + 1} é inválida.`);
    const title = linhaUnica(s.title);
    if (!title) throw new ErroDeConteudo(`Regulamento: a seção ${i + 1} está sem título.`);
    if (title.length > 160) throw new ErroDeConteudo(`Regulamento: o título da seção ${i + 1} passou de 160 caracteres.`);
    if (!Array.isArray(s.paragraphs)) throw new ErroDeConteudo(`Regulamento: a seção "${title}" é inválida.`);
    if (s.paragraphs.length > 1500) throw new ErroDeConteudo(`Regulamento: a seção "${title}" passou de 1500 parágrafos.`);
    const paragraphs = [];
    for (const p of s.paragraphs) {
      if (typeof p !== 'string') throw new ErroDeConteudo(`Regulamento: a seção "${title}" tem um parágrafo inválido.`);
      const limpo = variasLinhas(p);
      if (!limpo) continue;
      if (limpo.length > 20000) throw new ErroDeConteudo(`Regulamento: um parágrafo da seção "${title}" passou de 20.000 caracteres.`);
      paragraphs.push(limpo);
    }
    return { pedido: typeof s.id === 'string' ? s.id : '', title, paragraphs };
  });
  // Quem já tinha identificador escolhe primeiro: os links antigos (#secao) continuam valendo.
  const usados = new Set();
  for (const s of secoes) if (s.pedido) s.id = idUnico(s.pedido, usados, 'secao');
  for (const s of secoes) if (!s.id) s.id = idUnico(slug(s.title, 'secao'), usados, 'secao');
  return secoes.map(({ id, title, paragraphs }) => ({ id, title, paragraphs }));
}

function limparLista(entrada, nome, { max = 150, tamanho = 800 } = {}) {
  if (!Array.isArray(entrada)) throw new ErroDeConteudo(`${nome}: formato inválido.`);
  if (entrada.length > max) throw new ErroDeConteudo(`${nome}: o máximo é de ${max} itens.`);
  const saida = [];
  for (const item of entrada) {
    if (typeof item !== 'string') throw new ErroDeConteudo(`${nome}: item inválido.`);
    const limpo = linhaUnica(item);
    if (!limpo) continue;
    if (limpo.length > tamanho) throw new ErroDeConteudo(`${nome}: um item passou de ${tamanho} caracteres.`);
    saida.push(limpo);
  }
  return saida;
}

function limparFaixas(entrada) {
  if (!Array.isArray(entrada)) throw new ErroDeConteudo('Multas: formato inválido.');
  if (entrada.length > 40) throw new ErroDeConteudo('Multas: o máximo é de 40 grupos.');
  const usados = new Set();
  return entrada.map((f, i) => {
    if (!f || typeof f !== 'object') throw new ErroDeConteudo(`Multas: o grupo ${i + 1} é inválido.`);
    const title = linhaUnica(f.title);
    if (!title) throw new ErroDeConteudo(`Multas: o grupo ${i + 1} está sem título.`);
    if (title.length > 160) throw new ErroDeConteudo(`Multas: o título do grupo ${i + 1} passou de 160 caracteres.`);
    if (!Array.isArray(f.fines)) throw new ErroDeConteudo(`Multas: o grupo "${title}" é inválido.`);
    if (f.fines.length > 200) throw new ErroDeConteudo(`Multas: o grupo "${title}" passou de 200 multas.`);
    const idsDasMultas = new Set();
    const fines = [];
    for (const m of f.fines) {
      if (!m || typeof m !== 'object') throw new ErroDeConteudo(`Multas: o grupo "${title}" tem uma linha inválida.`);
      const description = linhaUnica(m.description);
      const amount = linhaUnica(m.amount);
      const semPontos = m.points === undefined || m.points === null || m.points === '';
      if (!description && !amount && semPontos) continue; // linha em branco
      if (!description) throw new ErroDeConteudo(`Multas: no grupo "${title}" há uma linha sem a infração.`);
      if (description.length > 300) throw new ErroDeConteudo(`Multas: uma infração do grupo "${title}" passou de 300 caracteres.`);
      if (amount.length > 60) throw new ErroDeConteudo(`Multas: um valor do grupo "${title}" passou de 60 caracteres.`);
      const multa = { id: idUnico(typeof m.id === 'string' && m.id ? m.id : slug(description, 'multa'), idsDasMultas, 'multa'), description, amount };
      if (!semPontos) {
        const pontos = typeof m.points === 'number' ? m.points : Number(String(m.points).trim());
        if (!Number.isInteger(pontos) || pontos < 0 || pontos > 9999) {
          throw new ErroDeConteudo(`Multas: os pontos de "${description}" precisam ser um número inteiro (ou ficar em branco).`);
        }
        multa.points = pontos;
      }
      fines.push(multa);
    }
    return { id: idUnico(typeof f.id === 'string' && f.id ? f.id : slug(title, 'grupo'), usados, 'grupo'), title, fines };
  });
}

function limparPolicia(entrada) {
  if (!entrada || typeof entrada !== 'object') throw new ErroDeConteudo('Polícia: formato inválido.');
  return {
    faixas: limparFaixas(entrada.faixas),
    aplicacao: limparLista(entrada.aplicacao, 'Primeira lista da polícia'),
    cnh: limparLista(entrada.cnh, 'Segunda lista da polícia'),
  };
}

function limparOpcoes(entrada) {
  const saida = { ...OPCOES_PADRAO };
  if (!entrada || typeof entrada !== 'object') return saida;
  for (const chave of ['conviteNoInicio', 'abaAdmin', 'mostrarCreditos', 'mostrarDestaque', 'removerManus']) {
    if (typeof entrada[chave] === 'boolean') saida[chave] = entrada[chave];
  }
  if (typeof entrada.cssExtra === 'string') {
    const css = entrada.cssExtra.replace(/\r\n?/g, '\n').replace(CONTROLES, '').trim();
    if (css.length > 60000) throw new ErroDeConteudo('CSS extra: o texto passou de 60.000 caracteres.');
    saida.cssExtra = css;
  }
  if (typeof entrada.enderecoPublico === 'string' && entrada.enderecoPublico.trim()) {
    let texto = entrada.enderecoPublico.trim();
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(texto)) texto = `https://${texto}`;
    let u = null;
    try {
      u = new URL(texto);
    } catch {
      /* cai no erro abaixo */
    }
    if (!u || (u.protocol !== 'https:' && u.protocol !== 'http:') || !u.hostname.includes('.')) {
      throw new ErroDeConteudo('Endereço do site: escreva o endereço completo, por exemplo https://meusite.com.br');
    }
    saida.enderecoPublico = u.origin;
  }
  return saida;
}

const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const copiar = (v) => JSON.parse(JSON.stringify(v));
const tem = (objeto, chave) => Object.prototype.hasOwnProperty.call(objeto, chave);

// ───────────────────────────── o conteúdo ─────────────────────────────
export function criarConteudo({ raizSite, dirDados, aviso = () => {} }) {
  const arquivoDados = path.join(dirDados, 'conteudo.json');
  const dirImagens = path.join(dirDados, 'imagens');
  const dirHistorico = path.join(dirDados, 'historico');

  /** O que foi lido dos arquivos originais; relido sozinho se algum deles mudar no disco. */
  let original = null;
  /** O que o administrador alterou. */
  let estado = vazio();
  /** Arquivos já montados com as alterações (zerado a cada publicação). */
  const gerados = new Map();

  function vazio() {
    return { formato: FORMATO, versao: 0, atualizadoEm: null, textos: {}, regulamento: null, policia: null, opcoes: { ...OPCOES_PADRAO }, imagens: {} };
  }

  function carimbo() {
    return [...Object.values(ARQUIVOS), IMAGEM_DO_CONVITE]
      .map((rel) => {
        try {
          const s = fs.statSync(path.join(raizSite, rel));
          return `${s.size}:${s.mtimeMs}`;
        } catch {
          return 'x';
        }
      })
      .join('|');
  }

  function lerOriginal() {
    const marca = carimbo();
    if (original && original.marca === marca) return original;

    const textos = {};
    const problemas = [];
    for (const [nome, rel] of Object.entries(ARQUIVOS)) {
      try {
        textos[nome] = fs.readFileSync(path.join(raizSite, rel), 'utf8');
      } catch {
        textos[nome] = null;
        problemas.push(`Não consegui ler site/${rel}.`);
      }
    }

    const campos = new Map();
    for (const campo of CAMPOS) {
      try {
        const locais = campo.locais.map((local) => ({ arquivo: local.arquivo, ...resolverLocal(textos, local) }));
        const valores = new Set(locais.filter((l) => l.comparavel).map((l) => l.valor));
        if (valores.size > 1) throw new Error('o original usa textos diferentes nos lugares deste campo');
        // `original` é o que está no arquivo copiado; `padrao`, o que o site mostra enquanto
        // o administrador não mexe (igual ao original, a não ser que o projeto tenha mudado).
        // Um campo sem `locais` é um texto que o projeto acrescenta: na cópia ele não existe.
        const original = locais.length ? locais[0].valor : '';
        let padrao = original;
        if (campo.padrao !== undefined) {
          try {
            padrao = limparCampo(campo, campo.padrao);
          } catch (erro) {
            problemas.push(`O texto padrão de "${campo.rotulo}" (mapa.mjs) é inválido e foi ignorado: ${erro.message}`);
          }
        }
        campos.set(campo.id, { campo, locais, original, padrao });
      } catch (erro) {
        problemas.push(`O texto "${campo.rotulo}" não pode ser editado: ${erro.message}.`);
      }
    }

    const js = textos.js || '';
    const tentar = (oQue, fazer) => {
      try {
        return fazer();
      } catch (erro) {
        problemas.push(`${oQue}: ${erro.message}.`);
        return null;
      }
    };
    const regulamento = tentar('O regulamento não pode ser editado', () => {
      const r = resolverRegulamento(js);
      return { ...r, original: limparRegulamento(r.original) };
    });
    const policia = tentar('As regras da polícia não podem ser editadas', () => {
      const faixas = resolverLista(js, ',ii=[', '],p0=[');
      const aplicacao = resolverLista(js, ',p0=[', '],h0=[');
      const cnh = resolverLista(js, ',h0=[', '],PA="');
      return { faixas, aplicacao, cnh, original: limparPolicia({ faixas: faixas.original, aplicacao: aplicacao.original, cnh: cnh.original }) };
    });
    // O ponto logo depois das duas abas. É onde entram a aba "Admin" e, na versão para telas largas, o link de volta ao convite.
    const depoisDasAbas = tentar('A aba "Admin" não pôde ser colocada na página de regras', () => unico(js, MARCA_DAS_ABAS) + FIM_DAS_ABAS.length);
    // O que precisa ser achado nos arquivos para o site começar pelo convite (ver convite-no-inicio.mjs).
    const conviteNoInicio = tentar('O site não pôde começar pelo convite e ficou como o original, com as regras no endereço principal', () => {
      if (textos.index == null || textos.convite == null) throw new Error('falta uma das duas páginas');
      const base = unico(js, MARCA_DA_BASE);
      const botao = campos.get('convite.botaoLink')?.locais.find((l) => l.arquivo === 'convite' && l.tipo === 'trecho');
      if (!botao) throw new Error('não achei o botão na página do convite');
      // Os dois que vêm agora são acabamento: sem a marca, o site começa pelo convite do mesmo jeito,
      // só aquele detalhe fica de fora (e entra na lista de problemas, para quem cuida do site saber).
      const umaVez = (texto, marca, seFaltar) => {
        const i = texto.indexOf(marca);
        if (i >= 0 && texto.indexOf(marca, i + 1) < 0) return i;
        problemas.push(seFaltar);
        return null;
      };
      const voltar = umaVez(js, MARCA_DO_VOLTAR, 'O botão da tela “página não encontrada” não pôde ser ajustado: ele mostra as regras em vez de voltar para o convite.');
      const imagem = umaVez(textos.convite, MARCA_DA_IMAGEM, 'A imagem do convite não pôde ficar clicável (o botão continua levando às regras).');
      return {
        base,
        // o botão da tela "não encontrada", que volta para o início do site
        voltar: voltar == null ? null : voltar + MARCA_DO_VOLTAR.indexOf(VOLTAR_ORIGINAL),
        // o clique na imagem do convite, que faz o mesmo que o botão
        imagem: imagem == null ? null : imagem + MARCA_DA_IMAGEM.length,
      };
    });
    // O link de volta ao convite tem dois lugares na página de regras (ver convite-no-inicio.mjs). Como os
    // acabamentos acima: sem achar um dos lugares, o link só não entra ali, e o problema entra na lista.
    if (depoisDasAbas == null) problemas.push('O link de volta ao convite não pôde ser colocado ao lado das abas da página de regras, onde ele aparece no computador.');
    const antesDasFerramentas = tentar('O link de volta ao convite não pôde ser colocado na barra do topo da página de regras, onde ele aparece no celular', () => unico(js, MARCA_DO_TOPO));
    // Largura e altura da imagem do convite que veio no site (para reservar o espaço dela na página).
    let imagemDoConvite = null;
    try {
      imagemDoConvite = analisarImagem(fs.readFileSync(path.join(raizSite, IMAGEM_DO_CONVITE)));
    } catch {
      /* sem a imagem original, a página só não sabe as medidas */
    }

    for (const p of problemas) aviso(p);
    original = { marca, textos, campos, regulamento, policia, depoisDasAbas, antesDasFerramentas, conviteNoInicio, imagemDoConvite, problemas };
    gerados.clear();
    return original;
  }

  // ── armazenamento ──
  function gravarAtomico(arquivo, conteudo) {
    fs.mkdirSync(path.dirname(arquivo), { recursive: true });
    const temporario = `${arquivo}.${process.pid}.tmp`;
    try {
      fs.writeFileSync(temporario, conteudo);
      fs.renameSync(temporario, arquivo);
    } catch (erro) {
      fs.rmSync(temporario, { force: true });
      throw erro;
    }
  }

  /** Lê um estado gravado, aproveitando só o que continua válido. */
  function normalizar(bruto) {
    const o = lerOriginal();
    const novo = vazio();
    if (!bruto || typeof bruto !== 'object') return novo;
    novo.versao = Number.isInteger(bruto.versao) && bruto.versao > 0 ? bruto.versao : 0;
    novo.atualizadoEm = typeof bruto.atualizadoEm === 'string' ? bruto.atualizadoEm : null;
    const tentar = (fazer) => {
      try {
        fazer();
      } catch {
        /* parte antiga que deixou de ser aceita: fica o original */
      }
    };
    const textos = bruto.textos && typeof bruto.textos === 'object' ? bruto.textos : {};
    for (const [id, reg] of o.campos) {
      if (!tem(textos, id)) continue;
      tentar(() => {
        const limpo = limparCampo(reg.campo, textos[id]);
        if (limpo !== reg.padrao) novo.textos[id] = limpo;
      });
    }
    if (o.regulamento && bruto.regulamento) {
      tentar(() => {
        const limpo = limparRegulamento(bruto.regulamento);
        if (!igual(limpo, o.regulamento.original)) novo.regulamento = limpo;
      });
    }
    if (o.policia && bruto.policia) {
      tentar(() => {
        const limpo = limparPolicia(bruto.policia);
        if (!igual(limpo, o.policia.original)) novo.policia = limpo;
      });
    }
    tentar(() => {
      novo.opcoes = limparOpcoes(bruto.opcoes);
    });
    for (const img of IMAGENS) {
      const reg = bruto.imagens?.[img.id];
      if (!reg || typeof reg.arquivo !== 'string' || !/^[a-z0-9-]+\.(png|jpg|webp|gif)$/.test(reg.arquivo)) continue;
      if (!fs.existsSync(path.join(dirImagens, reg.arquivo))) continue;
      novo.imagens[img.id] = {
        arquivo: reg.arquivo,
        tipo: String(reg.tipo || ''),
        largura: Number(reg.largura) || 0,
        altura: Number(reg.altura) || 0,
        bytes: Number(reg.bytes) || 0,
        enviadaEm: String(reg.enviadaEm || ''),
      };
    }
    return novo;
  }

  function carregar() {
    lerOriginal();
    estado = vazio();
    gerados.clear();
    let texto;
    try {
      texto = fs.readFileSync(arquivoDados, 'utf8');
    } catch (erro) {
      if (erro.code !== 'ENOENT') aviso(`Não consegui ler ${arquivoDados} (${erro.message}). O site segue com o conteúdo original.`);
      return;
    }
    try {
      estado = normalizar(JSON.parse(texto));
    } catch (erro) {
      // Não apaga: guarda o arquivo com outro nome para alguém poder olhar depois.
      const guardado = `${arquivoDados}.ilegivel-${Date.now()}`;
      try {
        fs.renameSync(arquivoDados, guardado);
      } catch {
        /* segue sem renomear */
      }
      aviso(`O arquivo ${arquivoDados} está ilegível (${erro.message}). O site segue com o conteúdo original; o arquivo foi guardado como ${path.basename(guardado)}.`);
    }
  }

  function guardarNoHistorico() {
    if (!estado.versao) return;
    try {
      fs.mkdirSync(dirHistorico, { recursive: true });
      const nome = `conteudo-${String(estado.versao).padStart(6, '0')}.json`;
      fs.writeFileSync(path.join(dirHistorico, nome), JSON.stringify({ ...estado, imagens: undefined, guardadoEm: new Date().toISOString() }));
      const antigos = fs.readdirSync(dirHistorico).filter((n) => /^conteudo-\d+\.json$/.test(n)).sort();
      for (const n of antigos.slice(0, Math.max(0, antigos.length - MAX_HISTORICO))) fs.rmSync(path.join(dirHistorico, n), { force: true });
    } catch (erro) {
      aviso(`Não consegui guardar a versão anterior no histórico: ${erro.message}`);
    }
  }

  function publicar(novo, { historico = true } = {}) {
    const pronto = { ...novo, formato: FORMATO, versao: estado.versao + 1, atualizadoEm: new Date().toISOString() };
    try {
      gravarAtomico(arquivoDados, JSON.stringify(pronto, null, 2));
    } catch (erro) {
      throw new ErroDeConteudo(`Não consegui gravar as alterações no disco (${erro.code || erro.message}).`, 500);
    }
    if (historico) guardarNoHistorico();
    estado = pronto;
    gerados.clear();
  }

  function conferirVersao(versao) {
    if (versao !== undefined && versao !== null && versao !== estado.versao) {
      throw new ErroDeConteudo('O conteúdo foi alterado em outra aba ou por outra pessoa enquanto você editava. Recarregue a página para ver a versão atual.', 409);
    }
  }

  /**
   * Publica o que o painel enviou. Cada parte é opcional: o que não vier fica
   * como está; `null` em `regulamento` ou `policia` volta ao original.
   */
  function salvar(entrada) {
    const o = lerOriginal();
    if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) throw new ErroDeConteudo('Pedido inválido.');
    conferirVersao(entrada.versao);
    const novo = { ...estado, textos: { ...estado.textos }, opcoes: { ...estado.opcoes } };

    if (entrada.textos !== undefined) {
      if (!entrada.textos || typeof entrada.textos !== 'object' || Array.isArray(entrada.textos)) throw new ErroDeConteudo('Textos: formato inválido.');
      novo.textos = {};
      for (const [id, reg] of o.campos) {
        if (!tem(entrada.textos, id)) continue;
        const limpo = limparCampo(reg.campo, entrada.textos[id]);
        if (limpo !== reg.padrao) novo.textos[id] = limpo;
      }
    }
    if (entrada.regulamento !== undefined) {
      if (!o.regulamento) throw new ErroDeConteudo('O regulamento não pode ser editado nesta instalação.');
      novo.regulamento = null;
      if (entrada.regulamento !== null) {
        const limpo = limparRegulamento(entrada.regulamento);
        if (JSON.stringify(limpo).length > 2_000_000) throw new ErroDeConteudo('Regulamento: o texto ficou grande demais.');
        if (!igual(limpo, o.regulamento.original)) novo.regulamento = limpo;
      }
    }
    if (entrada.policia !== undefined) {
      if (!o.policia) throw new ErroDeConteudo('As regras da polícia não podem ser editadas nesta instalação.');
      novo.policia = null;
      if (entrada.policia !== null) {
        const limpo = limparPolicia(entrada.policia);
        if (!igual(limpo, o.policia.original)) novo.policia = limpo;
      }
    }
    if (entrada.opcoes !== undefined) novo.opcoes = limparOpcoes({ ...estado.opcoes, ...(entrada.opcoes && typeof entrada.opcoes === 'object' ? entrada.opcoes : {}) });

    const mudou = !igual({ ...novo, versao: 0, atualizadoEm: 0 }, { ...estado, versao: 0, atualizadoEm: 0 });
    if (mudou) publicar(novo);
    return { ...descrever(), mudou };
  }

  /** Desfaz tudo o que foi feito pelo painel: textos, regras, opções e imagens voltam ao padrão do projeto. */
  function restaurarOriginal() {
    const imagens = Object.values(estado.imagens);
    publicar(vazio());
    for (const reg of imagens) fs.rmSync(path.join(dirImagens, reg.arquivo), { force: true });
    return descrever();
  }

  function listarHistorico() {
    let nomes = [];
    try {
      nomes = fs.readdirSync(dirHistorico).filter((n) => /^conteudo-\d+\.json$/.test(n)).sort().reverse();
    } catch {
      return [];
    }
    const lista = [];
    for (const nome of nomes) {
      try {
        const j = JSON.parse(fs.readFileSync(path.join(dirHistorico, nome), 'utf8'));
        lista.push({
          id: String(Number(nome.replace(/\D/g, ''))),
          publicadaEm: j.atualizadoEm || null,
          substituidaEm: j.guardadoEm || null,
          textos: Object.keys(j.textos || {}).length,
          regulamento: !!j.regulamento,
          policia: !!j.policia,
        });
      } catch {
        /* arquivo ilegível: pula */
      }
    }
    return lista;
  }

  /** Volta os textos, as regras e as opções de uma versão anterior (as imagens não entram no histórico). */
  function restaurarDoHistorico(id) {
    if (!/^\d{1,9}$/.test(String(id))) throw new ErroDeConteudo('Versão inválida.');
    let bruto;
    try {
      bruto = JSON.parse(fs.readFileSync(path.join(dirHistorico, `conteudo-${String(id).padStart(6, '0')}.json`), 'utf8'));
    } catch {
      throw new ErroDeConteudo('Essa versão não existe mais.', 404);
    }
    const novo = normalizar(bruto);
    novo.imagens = estado.imagens;
    publicar(novo);
    return descrever();
  }

  // ── imagens ──
  function trocarImagem(id, { corpo, tipo, ext, largura, altura }) {
    const img = IMAGENS.find((x) => x.id === id);
    if (!img) throw new ErroDeConteudo('Imagem desconhecida.', 404);
    const nome = `${id}-${crypto.createHash('sha256').update(corpo).digest('hex').slice(0, 12)}.${ext}`;
    try {
      gravarAtomico(path.join(dirImagens, nome), corpo);
    } catch (erro) {
      throw new ErroDeConteudo(`Não consegui gravar a imagem no disco (${erro.code || erro.message}).`, 500);
    }
    const anterior = estado.imagens[id];
    const registro = { arquivo: nome, tipo, largura: largura || 0, altura: altura || 0, bytes: corpo.length, enviadaEm: new Date().toISOString() };
    publicar({ ...estado, imagens: { ...estado.imagens, [id]: registro } }, { historico: false });
    if (anterior && anterior.arquivo !== nome) fs.rmSync(path.join(dirImagens, anterior.arquivo), { force: true });
    return descrever();
  }

  function removerImagem(id) {
    if (!IMAGENS.some((x) => x.id === id)) throw new ErroDeConteudo('Imagem desconhecida.', 404);
    const anterior = estado.imagens[id];
    if (!anterior) return descrever();
    const imagens = { ...estado.imagens };
    delete imagens[id];
    publicar({ ...estado, imagens }, { historico: false });
    fs.rmSync(path.join(dirImagens, anterior.arquivo), { force: true });
    return descrever();
  }

  /** Se o administrador trocou a imagem deste endereço, devolve o arquivo que deve ser entregue. */
  function imagemPara(caminhoUrl) {
    for (const img of IMAGENS) {
      if (!img.caminhos.includes(caminhoUrl)) continue;
      const reg = estado.imagens[img.id] || (img.herda ? estado.imagens[img.herda] : null);
      return reg ? { arquivo: path.join(dirImagens, reg.arquivo), tipo: reg.tipo } : null;
    }
    return null;
  }

  // ── montagem das páginas ──
  /** O texto que vale para um campo: o que o administrador escreveu ou, sem isso, o padrão do projeto. */
  function textoDe(id) {
    const reg = lerOriginal().campos.get(id);
    if (!reg) return '';
    return tem(estado.textos, id) ? estado.textos[id] : reg.padrao;
  }

  /** Os campos cujo texto em uso é diferente do que está no arquivo copiado: [registro do campo, texto]. */
  function textosTrocados() {
    const lista = [];
    for (const [id, reg] of lerOriginal().campos) {
      const valor = textoDe(id);
      if (valor !== reg.original) lista.push([reg, valor]);
    }
    return lista;
  }

  function trocasDeTexto(arquivo) {
    const trocas = [];
    for (const [reg, valor] of textosTrocados()) {
      for (const local of reg.locais) {
        if (local.arquivo === arquivo && local.tipo === 'trecho') trocas.push({ inicio: local.inicio, fim: local.fim, novo: local.escrever(valor) });
      }
    }
    return trocas;
  }

  /** O site começa pelo convite? (A opção está ligada e o que ela precisa foi achado nos arquivos.) */
  const conviteNoInicio = () => estado.opcoes.conviteNoInicio && lerOriginal().conviteNoInicio != null;

  /** Onde fica cada página agora: { inicio, convite, regras }. */
  const enderecosDoSite = () => enderecos(conviteNoInicio());

  /**
   * O que responde em um endereço, além dos arquivos de site/: { arquivo } (caminho dentro de site/),
   * { ir } (o navegador é mandado para esse endereço) ou null.
   */
  function paginaPara(caminhoUrl) {
    const achado = paginaDoEndereco(caminhoUrl, conviteNoInicio());
    if (!achado) return null;
    return achado.ir ? { ir: achado.ir } : { arquivo: ARQUIVOS[achado.pagina] };
  }

  /**
   * O link de volta ao convite que a página de regras mostra: { texto, destino }. É null quando ela não
   * tem o link: o site não começa pelo convite, o administrador deixou o texto vazio ou o aplicativo
   * veio diferente e nenhum dos dois lugares do link foi achado.
   */
  function linkParaOConvite() {
    const o = lerOriginal();
    if (!conviteNoInicio() || (o.depoisDasAbas == null && o.antesDasFerramentas == null)) return null;
    const texto = textoDe('regras.voltar.texto');
    return texto ? { texto, destino: enderecosDoSite().convite } : null;
  }

  function montarJs() {
    const o = lerOriginal();
    if (o.textos.js == null) return null;
    const trocas = trocasDeTexto('js');
    if (o.regulamento && estado.regulamento) {
      trocas.push({ inicio: o.regulamento.inicio, fim: o.regulamento.fim, novo: JSON.stringify(estado.regulamento) });
    }
    if (o.policia && estado.policia) {
      for (const parte of ['faixas', 'aplicacao', 'cnh']) {
        trocas.push({ inicio: o.policia[parte].inicio, fim: o.policia[parte].fim, novo: JSON.stringify(estado.policia[parte]) });
      }
    }
    // O link de volta ao convite entra em dois lugares: na linha das abas e na barra do topo, depois do logo.
    const volta = linkParaOConvite();
    const elementoDaVolta = volta ? linkDeVolta(volta.texto, volta.destino) : null;
    if (o.depoisDasAbas != null) {
      // Na linha das abas, nesta ordem: o link de volta e a aba Admin.
      const novo = (elementoDaVolta ? `,${elementoDaVolta}` : '') + (estado.opcoes.abaAdmin ? ABA_ADMIN : '');
      if (novo) trocas.push({ inicio: o.depoisDasAbas, fim: o.depoisDasAbas, novo });
    }
    if (elementoDaVolta && o.antesDasFerramentas != null) trocas.push({ inicio: o.antesDasFerramentas, fim: o.antesDasFerramentas, novo: `${elementoDaVolta},` });
    // Com o site começando pelo convite, a página de regras fica em /regras/ e o aplicativo precisa saber disso.
    if (conviteNoInicio()) {
      const { base, voltar } = o.conviteNoInicio;
      trocas.push({ inicio: base, fim: base + BASE_ORIGINAL.length, novo: BASE_DAS_REGRAS });
      if (voltar != null) trocas.push({ inicio: voltar, fim: voltar + VOLTAR_ORIGINAL.length, novo: VOLTAR_PARA_O_INICIO });
    }
    return trocas.length ? aplicarTrocas(o.textos.js, trocas) : null;
  }

  /** CSS acrescentado à página: blocos escondidos e o CSS extra do administrador. */
  function cssDaPagina(nome) {
    const regras = [];
    if (nome === 'index') {
      if (!estado.opcoes.mostrarCreditos) regras.push('.author-card{display:none!important}');
      if (!estado.opcoes.mostrarDestaque) regras.push('.cheat-callout{display:none!important}');
      for (const [{ campo }, valor] of textosTrocados()) {
        if (campo.seVazioEsconde && valor === '') regras.push(`${campo.seVazioEsconde}{display:none!important}`);
      }
    }
    // "</" não pode aparecer dentro de <style>; em CSS, "<\/" quer dizer a mesma coisa.
    if (estado.opcoes.cssExtra) regras.push(estado.opcoes.cssExtra.replace(/<\//g, '<\\/'));
    return regras.join('\n');
  }

  function todas(txt, trecho) {
    const posicoes = [];
    for (let i = txt.indexOf(trecho); i >= 0; i = txt.indexOf(trecho, i + trecho.length)) posicoes.push(i);
    return posicoes;
  }

  function montarHtml(nome) {
    const o = lerOriginal();
    const txt = o.textos[nome];
    if (txt == null) return null;
    let trocas = trocasDeTexto(nome);
    const noComeco = conviteNoInicio();
    const onde = enderecosDoSite();

    if (nome === 'convite') {
      // O botão: quando o destino quer dizer "a página de regras", vai o endereço em que ela está agora.
      const reg = o.campos.get('convite.botaoLink');
      const local = reg?.locais.find((l) => l.arquivo === 'convite' && l.tipo === 'trecho');
      if (local) {
        const link = textoDe('convite.botaoLink');
        const destinoDoBotao = ehAsRegras(link) ? onde.regras : link;
        trocas = trocas.filter((t) => t.inicio !== local.inicio || t.fim !== local.fim);
        if (destinoDoBotao !== reg.original) trocas.push({ inicio: local.inicio, fim: local.fim, novo: local.escrever(destinoDoBotao) });
      }
      // Clicar na imagem faz o mesmo que o botão.
      if (noComeco && o.conviteNoInicio.imagem != null) trocas.push({ inicio: o.conviteNoInicio.imagem, fim: o.conviteNoInicio.imagem, novo: CLIQUE_NA_IMAGEM });
    }

    // Com o endereço do site preenchido, os links de compartilhamento passam a apontar para cá.
    const destino = estado.opcoes.enderecoPublico;
    if (destino && destino !== ORIGEM_ORIGINAL) {
      // O endereço da própria página (canonical e og:url) acompanha o lugar em que ela está neste site.
      const naCopia = nome === 'convite' ? '/convite/"' : '/"';
      const aqui = nome === 'convite' ? onde.convite : onde.regras;
      for (const i of todas(txt, ORIGEM_ORIGINAL)) {
        const fim = i + ORIGEM_ORIGINAL.length;
        if (noComeco && txt.startsWith(naCopia, fim)) trocas.push({ inicio: i, fim: fim + naCopia.length - 1, novo: destino + aqui });
        else trocas.push({ inicio: i, fim, novo: destino });
      }
      const imagem = estado.imagens.convite;
      if (imagem) {
        // Imagem nova ganha um endereço novo, para o Discord e o WhatsApp buscarem de novo.
        const alvo = `${ORIGEM_ORIGINAL}/fronteira-sul-convite-preview.jpg`;
        const versao = `?v=${imagem.arquivo.replace(/^convite-|\.[a-z]+$/g, '')}`;
        for (const i of todas(txt, alvo)) trocas.push({ inicio: i + alvo.length, fim: i + alvo.length, novo: versao });
        const ajustar = (antes, valor) => {
          const i = txt.indexOf(antes);
          const inicio = i + antes.length;
          const fim = i < 0 ? -1 : txt.indexOf('"', inicio);
          if (fim >= inicio && valor) trocas.push({ inicio, fim, novo: escaparAtributo(valor) });
        };
        ajustar('<meta property="og:image:type" content="', imagem.tipo);
        ajustar('<meta property="og:image:width" content="', imagem.largura ? String(imagem.largura) : '');
        ajustar('<meta property="og:image:height" content="', imagem.altura ? String(imagem.altura) : '');
      }
    }

    // O que entra no fim do <head>. O CSS do administrador vem por último, para poder mudar o resto.
    const noHead = [];
    if (nome === 'convite' && noComeco) noHead.push(cabecaDoInicio(estado.imagens.convite || o.imagemDoConvite));
    if (nome === 'index' && linkParaOConvite()) noHead.push(ESTILO_DO_LINK_DE_VOLTA);
    const css = cssDaPagina(nome);
    if (css) noHead.push(`<style id="ajustes-do-admin">\n${css}\n</style>`);
    const fimDoHead = txt.indexOf('</head>');
    if (noHead.length && fimDoHead >= 0) trocas.push({ inicio: fimDoHead, fim: fimDoHead, novo: noHead.join('\n') });

    if (estado.opcoes.removerManus) {
      // Tudo que a hospedagem original colocou no fim da página: selo e estatísticas.
      const inicio = txt.indexOf('<manus-content-root>');
      const fim = txt.indexOf('</body>');
      if (inicio >= 0 && fim > inicio) {
        trocas = trocas.filter((t) => t.fim <= inicio || t.inicio >= fim);
        trocas.push({ inicio, fim, novo: '' });
      }
      // No original este endereço só responde erro; sem ele a página funciona igual.
      const plataforma = '<script src="/api/platform/config.js"></script>';
      const p = txt.indexOf(plataforma);
      if (p >= 0 && (inicio < 0 || p + plataforma.length <= inicio)) trocas.push({ inicio: p, fim: p + plataforma.length, novo: '' });
    }
    return trocas.length ? aplicarTrocas(txt, trocas) : null;
  }

  function montarManifesto() {
    const o = lerOriginal();
    if (o.textos.manifesto == null) return null;
    let json = null;
    for (const [reg, valor] of textosTrocados()) {
      for (const local of reg.locais) {
        if (local.tipo !== 'manifesto') continue;
        json ||= JSON.parse(o.textos.manifesto);
        for (const chave of local.chaves) json[chave] = valor;
      }
    }
    return json ? JSON.stringify(json) : null;
  }

  function montarComEndereco(nome) {
    const o = lerOriginal();
    const destino = estado.opcoes.enderecoPublico;
    if (o.textos[nome] == null || !destino || destino === ORIGEM_ORIGINAL || !o.textos[nome].includes(ORIGEM_ORIGINAL)) return null;
    let texto = o.textos[nome].split(ORIGEM_ORIGINAL).join(destino);
    // O mapa do site que veio na cópia só lista o endereço principal, que era o das regras.
    // Com o site começando pelo convite, a página de regras entra na lista com o endereço novo.
    if (nome === 'sitemap' && conviteNoInicio()) {
      const fim = texto.lastIndexOf('</urlset>');
      if (fim >= 0) texto = `${texto.slice(0, fim)}<url>\n<loc>${destino}${enderecosDoSite().regras}</loc>\n</url>\n${texto.slice(fim)}`;
    }
    return texto;
  }

  const NOME_POR_ARQUIVO = new Map(Object.entries(ARQUIVOS).map(([nome, rel]) => [rel, nome]));

  /**
   * Versão de um arquivo do site com as alterações do administrador, ou null
   * quando o arquivo original vale como está. `rel` é o caminho dentro de site/.
   */
  function gerar(rel) {
    const nome = NOME_POR_ARQUIVO.get(rel);
    if (!nome) return null;
    lerOriginal();
    if (gerados.has(nome)) return gerados.get(nome);
    let texto = null;
    try {
      if (nome === 'js') texto = montarJs();
      else if (nome === 'index' || nome === 'convite') texto = montarHtml(nome);
      else if (nome === 'manifesto') texto = montarManifesto();
      else texto = montarComEndereco(nome);
    } catch (erro) {
      aviso(`Não consegui aplicar as alterações em ${rel} (${erro.message}). Esse arquivo segue como o original.`);
    }
    let resultado = null;
    if (texto != null) {
      const corpo = Buffer.from(texto, 'utf8');
      let gzip = null;
      resultado = {
        corpo,
        etag: `W/"a-${crypto.createHash('sha1').update(corpo).digest('base64url').slice(0, 20)}"`,
        comprimido: () => (gzip ||= zlib.gzipSync(corpo)),
      };
    }
    gerados.set(nome, resultado);
    return resultado;
  }

  /** Tudo que o painel precisa para montar os formulários. */
  function descrever() {
    const o = lerOriginal();
    return {
      versao: estado.versao,
      atualizadoEm: estado.atualizadoEm,
      campos: CAMPOS.filter((c) => o.campos.has(c.id)).map((c) => ({
        id: c.id,
        pagina: c.pagina,
        grupo: c.grupo,
        rotulo: c.rotulo,
        ajuda: c.ajuda || '',
        tipo: c.tipo || 'curto',
        max: LIMITES[c.tipo || 'curto'],
        escondeSeVazio: !!c.seVazioEsconde,
        // Para o painel, "original" é o site como vem neste projeto.
        original: o.campos.get(c.id).padrao,
      })),
      textos: { ...estado.textos },
      regulamento: o.regulamento ? { original: copiar(o.regulamento.original), atual: estado.regulamento ? copiar(estado.regulamento) : null } : null,
      policia: o.policia ? { original: copiar(o.policia.original), atual: estado.policia ? copiar(estado.policia) : null } : null,
      opcoes: { ...estado.opcoes },
      opcoesPadrao: { ...OPCOES_PADRAO },
      interruptores: INTERRUPTORES,
      // Onde cada página está agora (para os links "Ver regras" e "Ver convite" do painel).
      enderecos: enderecosDoSite(),
      imagens: IMAGENS.map((img) => {
        const reg = estado.imagens[img.id];
        return {
          id: img.id,
          rotulo: img.rotulo,
          ajuda: img.ajuda,
          caminho: img.caminhos[0],
          herda: img.herda || null,
          atual: reg ? { tipo: reg.tipo, largura: reg.largura, altura: reg.altura, bytes: reg.bytes, enviadaEm: reg.enviadaEm } : null,
        };
      }),
      origemOriginal: ORIGEM_ORIGINAL,
      historico: listarHistorico(),
      problemas: [...o.problemas],
    };
  }

  return {
    carregar,
    salvar,
    descrever,
    gerar,
    paginaPara,
    enderecos: enderecosDoSite,
    imagemPara,
    trocarImagem,
    removerImagem,
    restaurarOriginal,
    restaurarDoHistorico,
    get versao() {
      return estado.versao;
    },
    get problemas() {
      return lerOriginal().problemas;
    },
  };
}
