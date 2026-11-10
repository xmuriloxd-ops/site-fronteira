/**
 * Cartaz de divulgação das inscrições — 1600×900.
 *
 * Reproduz a arte do modelo oficial (Edital Aberto / Soldado PMPR): cabeçalho
 * com brasão e lema, faixa amarela inclinada, "CONCURSO PARA" + palavra em
 * destaque, frase de apoio, três ícones amarelos e rodapé com o brasão do
 * Governo do Paraná. Os textos são fixos: o cartaz é a arte, não um editor.
 */

import type { DivulgacaoInscricoes } from '../types';

const LARGURA = 1600;
const ALTURA = 900;

const AMARELO = '#f5c518';
const BRANCO = '#ffffff';
const PRETO = '#0a0a0a';

/** Anton: títulos grossos e condensados. Barlow: textos e legendas. */
const FONTE_TITULO = '"Anton", "Arial Narrow", Impact, sans-serif';
const FONTE_TEXTO = '"Barlow Condensed", "Arial Narrow", sans-serif';

const textoFixo = {
  orgao: 'POLÍCIA MILITAR',
  orgao2: 'DO PARANÁ',
  lema: 'DISCIPLINA   |   LEALDADE   |   SERVIÇO',
  canto1: 'JUNTE-SE A NÓS',
  canto2: 'E FAÇA A DIFERENÇA',
  selo: 'EDITAL ABERTO',
  chamada: 'CONCURSO PARA',
  destaque: 'SOLDADO',
  apoio: 'INGRESSE NA MAIOR FORÇA DE SEGURANÇA PÚBLICA DO PARANÁ',
  blocos: [
    { titulo: 'EDITAL', titulo2: 'PUBLICADO', icone: 'documento' as const },
    { titulo: 'VAGAS PARA', titulo2: 'SOLDADO', icone: 'escudo' as const },
    { titulo: 'NÍVEL MÉDIO', titulo2: 'COMPLETO', icone: 'pessoas' as const },
  ],
  governo: 'GOVERNO DO ESTADO',
};

/* ----------------------------- carregamento ----------------------------- */

const cacheImagens = new Map<string, Promise<HTMLImageElement>>();

function carregarImagem(src: string): Promise<HTMLImageElement> {
  const guardada = cacheImagens.get(src);
  if (guardada) return guardada;
  const promessa = new Promise<HTMLImageElement>((resolver, rejeitar) => {
    const img = new Image();
    img.onload = () => resolver(img);
    img.onerror = () => rejeitar(new Error(`Falha ao carregar ${src}`));
    img.src = src;
  });
  cacheImagens.set(src, promessa);
  return promessa;
}

/* ------------------------------- desenho -------------------------------- */

/** Desenha cobrindo a área indicada, sem distorcer. */
function desenharCobrindo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  largura: number,
  altura: number,
) {
  const escala = Math.max(largura / img.width, altura / img.height);
  const w = img.width * escala;
  const h = img.height * escala;
  ctx.drawImage(img, x + (largura - w) / 2, y + (altura - h) / 2, w, h);
}

/**
 * O brasão é um PNG opaco com fundo branco: vira transparente por luminância
 * e é recortado na margem, para não aparecer a caixa branca no cartaz.
 */
function imagemSemFundo(img: HTMLImageElement): HTMLCanvasElement {
  const tela = document.createElement('canvas');
  tela.width = img.width;
  tela.height = img.height;
  const ctx = tela.getContext('2d');
  if (!ctx) throw new Error('Este navegador não suporta geração de imagem.');
  ctx.drawImage(img, 0, 0);

  const dados = ctx.getImageData(0, 0, tela.width, tela.height);
  const p = dados.data;
  let minX = tela.width;
  let minY = tela.height;
  let maxX = 0;
  let maxY = 0;

  for (let i = 0; i < p.length; i += 4) {
    const r = p[i];
    const g = p[i + 1];
    const b = p[i + 2];
    const claro = (r + g + b) / 3;
    if (claro > 205) {
      p[i + 3] = 0;
      continue;
    }
    p[i + 3] = claro > 175 ? Math.round(((205 - claro) / 30) * 255) : 255;

    const pixel = i / 4;
    const x = pixel % tela.width;
    const y = Math.floor(pixel / tela.width);
    if (p[i + 3] > 16) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  ctx.putImageData(dados, 0, 0);

  const recorte = document.createElement('canvas');
  recorte.width = Math.max(1, maxX - minX + 1);
  recorte.height = Math.max(1, maxY - minY + 1);
  const ctxRecorte = recorte.getContext('2d');
  if (!ctxRecorte) throw new Error('Este navegador não suporta geração de imagem.');
  ctxRecorte.drawImage(tela, -minX, -minY);
  return recorte;
}

/** Texto com espaçamento entre letras (o canvas não tem letterSpacing). */
function textoEspacado(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  espaco: number,
): number {
  let cursor = x;
  for (const letra of texto) {
    ctx.fillText(letra, cursor, y);
    cursor += ctx.measureText(letra).width + espaco;
  }
  return cursor;
}

/** Largura de um texto com espaçamento, sem desenhar. */
function larguraEspacada(ctx: CanvasRenderingContext2D, texto: string, espaco: number): number {
  return ctx.measureText(texto).width + espaco * Math.max(0, texto.length - 1);
}

/** Ícone de documento com linhas (bloco 1). */
function iconeDocumento(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.strokeStyle = AMARELO;
  ctx.lineWidth = Math.max(4, t * 0.11);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.roundRect(x, y, t * 0.72, t, t * 0.1);
  ctx.stroke();
  ctx.lineWidth = Math.max(3, t * 0.08);
  for (let i = 0; i < 3; i += 1) {
    const yy = y + t * (0.28 + i * 0.22);
    ctx.beginPath();
    ctx.moveTo(x + t * 0.15, yy);
    ctx.lineTo(x + t * (i === 2 ? 0.4 : 0.57), yy);
    ctx.stroke();
  }
}

/** Escudo com visto (bloco 2). */
function iconeEscudo(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.strokeStyle = AMARELO;
  ctx.fillStyle = AMARELO;
  ctx.lineWidth = Math.max(4, t * 0.11);
  ctx.lineJoin = 'round';
  const cx = x + t * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(cx + t * 0.46, y + t * 0.16);
  ctx.lineTo(cx + t * 0.42, y + t * 0.62);
  ctx.quadraticCurveTo(cx + t * 0.3, y + t * 0.92, cx, y + t);
  ctx.quadraticCurveTo(cx - t * 0.3, y + t * 0.92, cx - t * 0.42, y + t * 0.62);
  ctx.lineTo(cx - t * 0.46, y + t * 0.16);
  ctx.closePath();
  ctx.stroke();
  ctx.lineWidth = Math.max(5, t * 0.13);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - t * 0.2, y + t * 0.5);
  ctx.lineTo(cx - t * 0.02, y + t * 0.68);
  ctx.lineTo(cx + t * 0.24, y + t * 0.34);
  ctx.stroke();
}

/** Três pessoas (bloco 3). */
function iconePessoas(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.fillStyle = AMARELO;
  const cabeca = t * 0.15;
  const pessoas: [number, number, number][] = [
    [x + t * 0.5, y + t * 0.18, 1], // centro (maior)
    [x + t * 0.18, y + t * 0.3, 0.78],
    [x + t * 0.82, y + t * 0.3, 0.78],
  ];
  for (const [cx, cy, escala] of pessoas) {
    ctx.beginPath();
    ctx.arc(cx, cy, cabeca * escala, 0, Math.PI * 2);
    ctx.fill();
  }
  // corpos
  const corpo = (cx: number, cy: number, largura: number) => {
    ctx.beginPath();
    ctx.moveTo(cx - largura, cy + t * 0.5);
    ctx.quadraticCurveTo(cx - largura, cy, cx, cy);
    ctx.quadraticCurveTo(cx + largura, cy, cx + largura, cy + t * 0.5);
    ctx.closePath();
    ctx.fill();
  };
  corpo(x + t * 0.5, y + t * 0.42, t * 0.26);
  corpo(x + t * 0.18, y + t * 0.5, t * 0.2);
  corpo(x + t * 0.82, y + t * 0.5, t * 0.2);
}

const ICONES = {
  documento: iconeDocumento,
  escudo: iconeEscudo,
  pessoas: iconePessoas,
};

/** Espera as fontes do cartaz, com prazo para não travar a prévia. */
async function carregarFontes() {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  const lista = [
    `700 100px ${FONTE_TITULO}`,
    `400 100px ${FONTE_TEXTO}`,
    `600 100px ${FONTE_TEXTO}`,
    `700 100px ${FONTE_TEXTO}`,
  ];
  await Promise.race([
    Promise.all(lista.map((f) => document.fonts.load(f))),
    new Promise((r) => setTimeout(r, 3000)),
  ]);
}

/**
 * Desenha o cartaz e devolve o canvas pronto.
 */
export async function desenharCartaz(
  _divulgacao: DivulgacaoInscricoes,
  _opcoes: OpcoesCartaz = {},
): Promise<HTMLCanvasElement> {
  await carregarFontes();

  const tela = document.createElement('canvas');
  tela.width = LARGURA;
  tela.height = ALTURA;
  const ctx = tela.getContext('2d');
  if (!ctx) throw new Error('Este navegador não suporta geração de imagem.');

  const [fundo, brasaoImg] = await Promise.all([
    carregarImagem('/divulgacao/pano-de-fundo.jpg'),
    carregarImagem('/pmpr-brasao.png').catch(() => null),
  ]);
  const brasao = brasaoImg ? imagemSemFundo(brasaoImg) : null;

  /* ------------------------------ Fundo ------------------------------ */
  desenharCobrindo(ctx, fundo, 0, 0, LARGURA, ALTURA);

  // Escurece a esquerda (texto) e a base (rodapé)
  const lateral = ctx.createLinearGradient(0, 0, LARGURA * 0.66, 0);
  lateral.addColorStop(0, 'rgba(0,0,0,0.94)');
  lateral.addColorStop(0.5, 'rgba(0,0,0,0.72)');
  lateral.addColorStop(1, 'rgba(0,0,0,0.05)');
  ctx.fillStyle = lateral;
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  const topo = ctx.createLinearGradient(0, 0, 0, 230);
  topo.addColorStop(0, 'rgba(0,0,0,0.72)');
  topo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topo;
  ctx.fillRect(0, 0, LARGURA, 230);

  /* --------------------------- Faixas da borda --------------------------- */
  // Canto superior esquerdo: faixa amarela diagonal
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(30, 0);
  ctx.lineTo(0, 250);
  ctx.closePath();
  ctx.fillStyle = AMARELO;
  ctx.fill();

  // Fios amarelos no canto inferior direito
  ctx.save();
  ctx.strokeStyle = AMARELO;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(LARGURA - 210, ALTURA);
  ctx.lineTo(LARGURA, ALTURA - 210);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(LARGURA - 130, ALTURA);
  ctx.lineTo(LARGURA, ALTURA - 130);
  ctx.stroke();
  ctx.restore();

  /* ------------------------------ Cabeçalho ------------------------------ */
  const margem = 56;
  let x = margem;

  if (brasao) {
    const lado = 132;
    ctx.drawImage(brasao, x, 34, lado, lado);
    x += lado + 26;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 13, 46);
    ctx.lineTo(x - 13, 154);
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = BRANCO;
  ctx.font = `400 52px ${FONTE_TITULO}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(textoFixo.orgao, x, 88);
  ctx.fillText(textoFixo.orgao2, x, 142);

  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `600 20px ${FONTE_TEXTO}`;
  ctx.fillText(textoFixo.lema, x, 176, 430);

  // Canto superior direito
  ctx.fillStyle = BRANCO;
  ctx.font = `600 22px ${FONTE_TEXTO}`;
  const direita = LARGURA - margem;
  let w = larguraEspacada(ctx, textoFixo.canto1, 1.2);
  textoEspacado(ctx, textoFixo.canto1, direita - w, 56, 1.2);
  w = larguraEspacada(ctx, textoFixo.canto2, 1.2);
  textoEspacado(ctx, textoFixo.canto2, direita - w, 82, 1.2);
  ctx.fillStyle = AMARELO;
  ctx.fillRect(direita - 96, 94, 96, 4);

  /* ----------------------------- Faixa amarela ---------------------------- */
  const faixaY = 236;
  const faixaH = 96;
  ctx.beginPath();
  ctx.moveTo(0, faixaY);
  ctx.lineTo(LARGURA * 0.57, faixaY);
  ctx.lineTo(LARGURA * 0.53, faixaY + faixaH);
  ctx.lineTo(0, faixaY + faixaH);
  ctx.closePath();
  ctx.fillStyle = AMARELO;
  ctx.fill();

  ctx.fillStyle = PRETO;
  ctx.font = `400 74px ${FONTE_TITULO}`;
  ctx.fillText(textoFixo.selo, margem, faixaY + faixaH - 18);

  /* ---------------------- Concurso para + destaque ---------------------- */
  ctx.fillStyle = BRANCO;
  ctx.font = `400 58px ${FONTE_TITULO}`;
  ctx.fillText(textoFixo.chamada, margem - 4, 392);

  // Palavra grande: encolhe até caber na metade esquerda
  let tamanho = 182;
  const limite = LARGURA * 0.53;
  ctx.font = `400 ${tamanho}px ${FONTE_TITULO}`;
  while (ctx.measureText(textoFixo.destaque).width > limite && tamanho > 60) {
    tamanho -= 4;
    ctx.font = `400 ${tamanho}px ${FONTE_TITULO}`;
  }
  ctx.fillStyle = BRANCO;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 18;
  ctx.fillText(textoFixo.destaque, margem - 6, 404 + tamanho * 0.86);
  ctx.shadowBlur = 0;

  /* --------------------------- Frase de apoio --------------------------- */
  const apoioY = 404 + tamanho * 0.86 + 42;
  ctx.fillStyle = BRANCO;
  ctx.font = `600 28px ${FONTE_TEXTO}`;
  ctx.fillText(textoFixo.apoio, margem, apoioY, LARGURA * 0.62);

  /* ------------------------ Blocos com ícones ------------------------ */
  const blocoY = apoioY + 56;
  const coluna = 320;
  textoFixo.blocos.forEach((bloco, i) => {
    const bx = margem + i * coluna;
    ICONES[bloco.icone](ctx, bx, blocoY, 64);

    ctx.fillStyle = BRANCO;
    ctx.font = `700 30px ${FONTE_TEXTO}`;
    ctx.fillText(bloco.titulo, bx, blocoY + 110);
    ctx.fillText(bloco.titulo2, bx, blocoY + 142);

    // Separador entre os blocos
    if (i < textoFixo.blocos.length - 1) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx + coluna - 42, blocoY - 2);
      ctx.lineTo(bx + coluna - 42, blocoY + 138);
      ctx.stroke();
      ctx.restore();
    }
  });

  /* --------------------------- Faixa do rodapé --------------------------- */
  const rodapeY = ALTURA - 78;
  const grad = ctx.createLinearGradient(0, rodapeY, 0, ALTURA);
  grad.addColorStop(0, 'rgba(0,0,0,0.0)');
  grad.addColorStop(0.35, 'rgba(0,0,0,0.78)');
  grad.addColorStop(1, 'rgba(0,0,0,0.92)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, rodapeY - 20, LARGURA, 98);

  // Assinatura do Governo do Paraná: PARANÁ + brasão, e "GOVERNO DO ESTADO" embaixo
  ctx.fillStyle = BRANCO;
  ctx.font = `400 34px ${FONTE_TITULO}`;
  const assinatura = 'PARANÁ';
  const larguraAssinatura = ctx.measureText(assinatura).width;
  const larguraBrasao = 44;
  const assinaturaX = LARGURA - margem - (larguraBrasao + 12) - 16 - larguraAssinatura;
  ctx.fillText(assinatura, assinaturaX, ALTURA - 42);

  // Selo escuro atrás do brasão: o fundo do rodapé pode estar claro
  const seloX = assinaturaX + larguraAssinatura + 8;
  const seloY = ALTURA - 74;
  const seloLado = larguraBrasao + 12;
  ctx.save();
  const fundoSelo = ctx.createLinearGradient(seloX, seloY, seloX, seloY + seloLado);
  fundoSelo.addColorStop(0, '#1a3a4a');
  fundoSelo.addColorStop(1, '#0f2733');
  ctx.fillStyle = fundoSelo;
  ctx.beginPath();
  ctx.roundRect(seloX, seloY, seloLado, seloLado, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (brasao) ctx.drawImage(brasao, seloX + 6, seloY + 6, larguraBrasao, larguraBrasao);
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.font = `600 14px ${FONTE_TEXTO}`;
  const limiteLegenda = seloX - assinaturaX - 8;
  ctx.fillText(textoFixo.governo, assinaturaX, ALTURA - 20, limiteLegenda);

  return tela;
}

/* ------------------------------ conversão ------------------------------- */

/** Converte o canvas em Blob PNG. */
export function canvasParaBlob(tela: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolver, rejeitar) => {
    tela.toBlob((blob) => {
      if (blob) resolver(blob);
      else rejeitar(new Error('Não foi possível gerar a imagem do cartaz.'));
    }, 'image/png');
  });
}

export interface OpcoesCartaz {
  /** Mantido por compatibilidade: o cartaz agora tem texto fixo. */
  selo?: string;
  quando?: string;
  textoChamada?: string;
  apoio?: string;
}

/** Gera o cartaz e devolve como arquivo pronto para anexar. */
export async function gerarCartaz(
  divulgacao: DivulgacaoInscricoes,
  opcoes: OpcoesCartaz = {},
): Promise<File> {
  const tela = await desenharCartaz(divulgacao, opcoes);
  const blob = await canvasParaBlob(tela);
  const nome = 'edital-aberto-soldado-pmpr.png';
  return new File([blob], nome, { type: 'image/png' });
}

/** URL da prévia, com função para revogar o objeto. */
export async function urlPreviaCartaz(
  divulgacao: DivulgacaoInscricoes,
  opcoes: OpcoesCartaz = {},
): Promise<{ url: string; revogar: () => void }> {
  const tela = await desenharCartaz(divulgacao, opcoes);
  const blob = await canvasParaBlob(tela);
  const url = URL.createObjectURL(blob);
  return { url, revogar: () => URL.revokeObjectURL(url) };
}
