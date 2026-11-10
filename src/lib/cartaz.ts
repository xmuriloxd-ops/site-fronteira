/**
 * Gera o cartaz de divulgação das inscrições como imagem PNG.
 *
 * Tudo é desenhado no <canvas> do navegador, no mesmo estilo da peça oficial:
 * fundo fotográfico, faixa amarela de "INSCRIÇÕES ABERTAS", unidade em
 * destaque, data/horário, quem está divulgando e o brasão da PMPR.
 *
 * A imagem é devolvida como Blob para ser anexada ao Discord junto do texto.
 */

import type { DivulgacaoInscricoes } from '../types';
import { UNIDADES_DIVULGACAO, formatarQuando } from './documentoTexto';

const LARGURA = 1600;
const ALTURA = 900;

const AMARELO = '#ffd400';
const PRETO = '#0a0a0a';
const BRANCO = '#ffffff';

/** Fontes condensadas de impacto, com alternativas do sistema. */
const FONTE_IMPACTO = '"Arial Black", "Helvetica Neue", Impact, system-ui, sans-serif';
const FONTE_TEXTO = '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Não foi possível carregar ${src}`));
    img.src = src;
  });
}

/**
 * Brasão sem o fundo branco: o arquivo é opaco, então o branco vira
 * transparência por luminância (o brasão em si é colorido e escuro).
 */
function imagemSemFundo(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  ctx.drawImage(img, 0, 0);

  const dados = ctx.getImageData(0, 0, c.width, c.height);
  const px = dados.data;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const menor = Math.min(r, g, b);
    // branco/cinza claro = fundo
    if (menor > 205) {
      px[i + 3] = 0;
    } else if (menor > 165) {
      // suaviza a borda para não ficar serrilhado
      px[i + 3] = Math.round(((205 - menor) / 40) * 255);
    }
  }
  ctx.putImageData(dados, 0, 0);

  // O arquivo original tem muita margem branca: recorta a área visível
  // para o brasão ocupar o espaço reservado no cartaz.
  let x1 = c.width;
  let y1 = c.height;
  let x2 = 0;
  let y2 = 0;
  for (let y = 0; y < c.height; y += 1) {
    for (let x = 0; x < c.width; x += 1) {
      if (px[(y * c.width + x) * 4 + 3] > 16) {
        if (x < x1) x1 = x;
        if (x > x2) x2 = x;
        if (y < y1) y1 = y;
        if (y > y2) y2 = y;
      }
    }
  }

  if (x2 <= x1 || y2 <= y1) return c;

  const recorte = document.createElement('canvas');
  recorte.width = x2 - x1 + 1;
  recorte.height = y2 - y1 + 1;
  const ctxRecorte = recorte.getContext('2d');
  if (ctxRecorte) ctxRecorte.drawImage(c, x1, y1, recorte.width, recorte.height, 0, 0, recorte.width, recorte.height);
  return recorte;
}

/** Desenha a imagem cobrindo a área, sem distorcer (equivalente ao object-fit: cover). */
function desenharCobrindo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const escala = Math.max(w / img.width, h / img.height);
  const dw = img.width * escala;
  const dh = img.height * escala;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/** Texto com espaçamento entre letras (o canvas não tem letter-spacing nativo). */
function textoEspacado(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  espaco: number,
) {
  let cursor = x;
  for (const letra of texto) {
    ctx.fillText(letra, cursor, y);
    const medida = ctx.measureText(letra).width;
    cursor += medida + espaco;
  }
  return cursor;
}

/** Quebra o texto em linhas que caibam na largura dada. */
function quebrarLinhas(ctx: CanvasRenderingContext2D, texto: string, largura: number): string[] {
  const palavras = texto.split(/\s+/);
  const linhas: string[] = [];
  let atual = '';
  for (const palavra of palavras) {
    const teste = atual ? `${atual} ${palavra}` : palavra;
    if (ctx.measureText(teste).width > largura && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = teste;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/** Nome curto da unidade usado no cartaz: PMPR, ROTAM, RONE. */
export function unidadeDestaque(divulgacao: DivulgacaoInscricoes): string {
  const siglas = divulgacao.unidades
    .map((id) => UNIDADES_DIVULGACAO.find((u) => u.id === id)?.sigla)
    .filter(Boolean) as string[];

  if (siglas.length === 0) return 'PMPR';
  // Com as três selecionadas, o cartaz destaca o portal da PMPR.
  if (siglas.length === 3) return 'PMPR';
  return siglas.join(' · ');
}

/** Frase de apoio do cartaz, montada com as unidades escolhidas. */
function fraseApoio(divulgacao: DivulgacaoInscricoes): string {
  const nomes = divulgacao.unidades
    .map((id) => UNIDADES_DIVULGACAO.find((u) => u.id === id)?.sigla)
    .filter(Boolean) as string[];

  if (nomes.length === 3) return 'INGRESSE NA MAIOR FORÇA DE SEGURANÇA PÚBLICA DO PARANÁ';
  if (nomes.length === 1) return `INSCRIÇÕES ABERTAS PARA A ${nomes[0]} — POLÍCIA MILITAR DO PARANÁ`;
  return `INSCRIÇÕES ABERTAS PARA ${nomes.slice(0, -1).join(', ')} E ${nomes[nomes.length - 1]}`;
}

export interface OpcoesCartaz {
  /** Frase da faixa amarela. */
  selo?: string;
  /** Texto do selo de data/horário. */
  quando?: string;
  /**
   * Linha de chamada impressa no cartaz. Quando informada, substitui o
   * `texto` do documento — é o texto editado só para a imagem.
   */
  textoChamada?: string;
  /** Frase de apoio sob a unidade. */
  apoio?: string;
}

/**
 * Desenha o cartaz e devolve o canvas pronto.
 * Separado da conversão para Blob para permitir prévia sem custo.
 */
export async function desenharCartaz(
  divulgacao: DivulgacaoInscricoes,
  opcoes: OpcoesCartaz = {},
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Este navegador não suporta geração de imagem.');

  const [fundo, brasaoImg] = await Promise.all([
    carregarImagem('/divulgacao/pano-de-fundo.jpg'),
    carregarImagem('/pmpr-brasao.png').catch(() => null),
  ]);
  const brasao = brasaoImg ? imagemSemFundo(brasaoImg) : null;

  /* ------------------------------ Fundo ------------------------------ */
  desenharCobrindo(ctx, fundo, 0, 0, LARGURA, ALTURA);

  // Escurece a esquerda e a base para o texto ficar legível
  const gradiente = ctx.createLinearGradient(0, 0, LARGURA * 0.72, 0);
  gradiente.addColorStop(0, 'rgba(0,0,0,0.90)');
  gradiente.addColorStop(0.42, 'rgba(0,0,0,0.62)');
  gradiente.addColorStop(1, 'rgba(0,0,0,0.05)');
  ctx.fillStyle = gradiente;
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  const base = ctx.createLinearGradient(0, ALTURA * 0.55, 0, ALTURA);
  base.addColorStop(0, 'rgba(0,0,0,0)');
  base.addColorStop(1, 'rgba(0,0,0,0.78)');
  ctx.fillStyle = base;
  ctx.fillRect(0, ALTURA * 0.55, LARGURA, ALTURA * 0.45);

  /* --------------------- Faixas diagonais da borda -------------------- */
  ctx.save();
  ctx.fillStyle = AMARELO;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(26, 0);
  ctx.lineTo(0, 210);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(LARGURA, ALTURA);
  ctx.lineTo(LARGURA - 26, ALTURA);
  ctx.lineTo(LARGURA, ALTURA - 210);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  /* ------------------------------ Cabeçalho --------------------------- */
  const margem = 64;
  let topo = 58;

  if (brasao) {
    ctx.drawImage(brasao, margem - 4, topo - 8, 132, 132);
  }

  const xTexto = brasao ? margem + 148 : margem;
  ctx.fillStyle = BRANCO;
  ctx.font = `900 44px ${FONTE_IMPACTO}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('POLÍCIA MILITAR', xTexto, topo + 44);
  ctx.fillText('DO PARANÁ', xTexto, topo + 92);

  ctx.font = `600 17px ${FONTE_TEXTO}`;
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  let xDivisa = textoEspacado(ctx, 'DISCIPLINA', xTexto, topo + 120, 2.6);
  ctx.fillStyle = AMARELO;
  ctx.fillText('|', xDivisa + 10, topo + 120);
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  xDivisa = textoEspacado(ctx, 'LEALDADE', xDivisa + 28, topo + 120, 2.6);
  ctx.fillStyle = AMARELO;
  ctx.fillText('|', xDivisa + 10, topo + 120);
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  textoEspacado(ctx, 'SERVIÇO', xDivisa + 28, topo + 120, 2.6);

  // Canto superior direito
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `700 17px ${FONTE_TEXTO}`;
  const espacoCanto = 2.2;
  const larguraCanto = (t: string) =>
    [...t].reduce((soma, letra) => soma + ctx.measureText(letra).width + espacoCanto, 0);
  const t1 = 'JUNTE-SE A NÓS';
  const t2 = 'E FAÇA A DIFERENÇA';
  textoEspacado(ctx, t1, LARGURA - margem - larguraCanto(t1), topo + 14, espacoCanto);
  textoEspacado(ctx, t2, LARGURA - margem - larguraCanto(t2), topo + 40, espacoCanto);
  ctx.fillStyle = AMARELO;
  ctx.fillRect(LARGURA - margem - 62, topo + 58, 62, 5);

  /* --------------------------- Faixa amarela -------------------------- */
  const faixaY = 262;
  const faixaH = 108;
  const selo = opcoes.selo ?? 'INSCRIÇÕES ABERTAS';
  ctx.font = `900 76px ${FONTE_IMPACTO}`;
  // a faixa acompanha o texto, com folga para o corte diagonal
  const faixaW = Math.min(LARGURA - 40, ctx.measureText(selo).width + margem + 110);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, faixaY);
  ctx.lineTo(faixaW, faixaY);
  ctx.lineTo(faixaW - 62, faixaY + faixaH);
  ctx.lineTo(0, faixaY + faixaH);
  ctx.closePath();
  ctx.fillStyle = AMARELO;
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = PRETO;
  ctx.font = `900 76px ${FONTE_IMPACTO}`;
  ctx.fillText(selo, margem - 18, faixaY + 80);

  /* ----------------------- Unidade em destaque ------------------------ */
  const destaque = unidadeDestaque(divulgacao);
  ctx.fillStyle = BRANCO;
  ctx.font = `800 42px ${FONTE_IMPACTO}`;
  ctx.fillText('CONCURSO PARA', margem, faixaY + faixaH + 58);

  // Nome da unidade: tamanho adaptado ao comprimento
  let tamanho = 132;
  ctx.font = `900 ${tamanho}px ${FONTE_IMPACTO}`;
  while (ctx.measureText(destaque).width > LARGURA * 0.62 && tamanho > 56) {
    tamanho -= 6;
    ctx.font = `900 ${tamanho}px ${FONTE_IMPACTO}`;
  }
  ctx.fillStyle = BRANCO;
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 18;
  ctx.fillText(destaque, margem - 6, faixaY + faixaH + 58 + tamanho * 0.86);
  ctx.shadowBlur = 0;

  /* ------------------------- Frase de apoio --------------------------- */
  const apoioY = faixaY + faixaH + 58 + tamanho * 0.86 + 26;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `700 24px ${FONTE_TEXTO}`;
  textoEspacado(ctx, opcoes.apoio?.trim() || fraseApoio(divulgacao), margem, apoioY, 1.1);

  /* --------------------- Blocos de data e horário --------------------- */
  const quando = opcoes.quando ?? formatarQuando(divulgacao.data, divulgacao.horario);
  const blocos: { titulo: string; valor: string }[] = [];
  if (quando) blocos.push({ titulo: 'DATA E HORÁRIO', valor: quando });
  if (divulgacao.responsavel.trim()) blocos.push({ titulo: 'DIVULGADO POR', valor: divulgacao.responsavel.trim() });

  let bx = margem;
  const by = ALTURA - 196;
  for (const bloco of blocos.slice(0, 2)) {
    ctx.fillStyle = AMARELO;
    ctx.fillRect(bx, by, 5, 64);
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.font = `700 15px ${FONTE_TEXTO}`;
    textoEspacado(ctx, bloco.titulo, bx + 20, by + 20, 2);
    ctx.fillStyle = BRANCO;
    let tam = 30;
    ctx.font = `800 ${tam}px ${FONTE_TEXTO}`;
    while (ctx.measureText(bloco.valor).width > 390 && tam > 18) {
      tam -= 2;
      ctx.font = `800 ${tam}px ${FONTE_TEXTO}`;
    }
    ctx.fillText(bloco.valor, bx + 20, by + 56);
    bx += 440;
  }

  /* ----------------------- Texto de chamada --------------------------- */
  const chamada = (opcoes.textoChamada ?? divulgacao.texto).trim();
  if (chamada) {
    ctx.fillStyle = 'rgba(255,255,255,0.80)';
    ctx.font = `400 21px ${FONTE_TEXTO}`;
    const linhas = quebrarLinhas(ctx, chamada, 640).slice(0, 3);
    linhas.forEach((linha, i) => ctx.fillText(linha, margem, by - 44 + i * 28));
  }

  /* ------------------------ Rodapé institucional ---------------------- */
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, ALTURA - 62, LARGURA, 62);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `600 15px ${FONTE_TEXTO}`;
  textoEspacado(ctx, 'PORTAL DE INSCRIÇÕES · POLÍCIA MILITAR DO PARANÁ', margem, ALTURA - 25, 1.6);

  if (brasao) {
    ctx.globalAlpha = 0.9;
    ctx.drawImage(brasao, LARGURA - margem - 40, ALTURA - 56, 46, 46);
    ctx.globalAlpha = 1;
  }

  return canvas;
}

/** Converte o canvas em PNG pronto para upload. */
export function canvasParaBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Não foi possível gerar a imagem do cartaz.'));
    }, 'image/png');
  });
}

/** Gera o cartaz e devolve o arquivo PNG com nome amigável. */
export async function gerarCartaz(
  divulgacao: DivulgacaoInscricoes,
  opcoes: OpcoesCartaz = {},
): Promise<File> {
  const canvas = await desenharCartaz(divulgacao, opcoes);
  const blob = await canvasParaBlob(canvas);
  const nome = `divulgacao-${divulgacao.unidades.join('-') || 'pmpr'}.png`;
  return new File([blob], nome, { type: 'image/png' });
}

/** URL temporária para mostrar a prévia do cartaz no painel. */
export async function urlPreviaCartaz(
  divulgacao: DivulgacaoInscricoes,
  opcoes: OpcoesCartaz = {},
): Promise<{ url: string; revogar: () => void }> {
  const canvas = await desenharCartaz(divulgacao, opcoes);
  const blob = await canvasParaBlob(canvas);
  const url = URL.createObjectURL(blob);
  return { url, revogar: () => URL.revokeObjectURL(url) };
}
