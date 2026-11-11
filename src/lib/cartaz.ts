/**
 * Cartaz da ficha de registro de prisão.
 *
 * Desenha em <canvas> a mesma ficha do modelo impresso (fundo branco, tinta
 * preta, brasão da PCPR, foto, campos, dia/data automáticos e assinatura do
 * escrivão) para ser enviada como IMAGEM no Discord, baixada ou impressa.
 *
 * Tudo é gerado no navegador: não depende de biblioteca externa nem de
 * renderização do DOM, então o resultado é idêntico em qualquer navegador.
 */
import type { Prisao } from '../types';
import { carimboCompleto, dataBR, dataHoraBR, diaPorExtenso, horaBR, textoOuTraco } from './format';

export type DadosCartaz = Partial<Prisao> & { criadoEm: string };

export interface Cartaz {
  dataUrl: string;
  blob: Blob;
  nome: string;
  largura: number;
  altura: number;
}

export const W = 1200;
export const MARGEM = 40;
export const ESQ = 60;
export const DIR = 1140;
export const LARG = DIR - ESQ;
export const PRETO = '#000000';
export const BRANCO = '#ffffff';
export const CINZA = '#444444';

export type Familia = 'anton' | 'cond' | 'script';

export function fonte(ctx: CanvasRenderingContext2D, familia: Familia, tamanho: number, peso = 400) {
  if (familia === 'anton') {
    ctx.font = `${tamanho}px Anton, "Arial Narrow", Impact, sans-serif`;
  } else if (familia === 'script') {
    ctx.font = `italic ${tamanho}px "Segoe Script", "Brush Script MT", "Comic Sans MS", cursive`;
  } else {
    ctx.font = `${peso} ${tamanho}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  }
}

export async function garantirFontes() {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  try {
    await Promise.all([
      document.fonts.load('40px Anton'),
      document.fonts.load('400 24px "Barlow Condensed"'),
      document.fonts.load('700 24px "Barlow Condensed"'),
    ]);
    await document.fonts.ready;
  } catch {
    /* segue com a fonte de fallback do sistema */
  }
}

export function carregarImagem(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Desenha texto com espaçamento entre letras (rótulos institucionais). */
export function espacado(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  espaco = 1.8,
): number {
  let cx = x;
  for (const ch of texto) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + espaco;
  }
  return cx - x - espaco;
}

function larguraEspacada(ctx: CanvasRenderingContext2D, texto: string, espaco: number) {
  let largura = 0;
  for (const ch of texto) largura += ctx.measureText(ch).width + espaco;
  return largura - espaco;
}

export function espacadoDireita(
  ctx: CanvasRenderingContext2D,
  texto: string,
  xDireita: number,
  y: number,
  espaco = 1.8,
) {
  espacado(ctx, texto, xDireita - larguraEspacada(ctx, texto, espaco), y, espaco);
}

export function espacadoCentro(
  ctx: CanvasRenderingContext2D,
  texto: string,
  xCentro: number,
  y: number,
  espaco = 1.8,
) {
  espacado(ctx, texto, xCentro - larguraEspacada(ctx, texto, espaco) / 2, y, espaco);
}

/** Quebra o texto em linhas que caibam na largura, com elipse se sobrar. */
export function quebrar(
  ctx: CanvasRenderingContext2D,
  texto: string,
  larguraMax: number,
  maxLinhas = 4,
): string[] {
  const bruto = (texto || '').trim() || '—';
  const linhas: string[] = [];
  let cortado = false;

  for (const paragrafo of bruto.split('\n')) {
    let atual = '';
    for (const palavra of paragrafo.split(/\s+/).filter(Boolean)) {
      const tentativa = atual ? `${atual} ${palavra}` : palavra;
      if (ctx.measureText(tentativa).width <= larguraMax) {
        atual = tentativa;
        continue;
      }
      if (atual) {
        linhas.push(atual);
        atual = '';
        if (linhas.length >= maxLinhas) {
          cortado = true;
          break;
        }
      }
      if (ctx.measureText(palavra).width > larguraMax) {
        let pedaco = '';
        for (const letra of palavra) {
          if (pedaco && ctx.measureText(pedaco + letra).width > larguraMax) {
            linhas.push(pedaco);
            pedaco = letra;
            if (linhas.length >= maxLinhas) {
              cortado = true;
              break;
            }
          } else {
            pedaco += letra;
          }
        }
        atual = cortado ? '' : pedaco;
      } else {
        atual = palavra;
      }
      if (cortado) break;
    }
    if (cortado) break;
    if (atual) {
      linhas.push(atual);
      if (linhas.length >= maxLinhas) {
        cortado = true;
        break;
      }
    }
  }

  const resultado = linhas.slice(0, maxLinhas);
  if (cortado && resultado.length) {
    let ultima = resultado[resultado.length - 1];
    while (ultima && ctx.measureText(`${ultima}…`).width > larguraMax) ultima = ultima.slice(0, -1);
    resultado[resultado.length - 1] = `${ultima}…`;
  }
  return resultado.length ? resultado : ['—'];
}

export interface LinhaCampo {
  rotulo: string;
  linhas: string[];
  altura: number;
}

function prepararLinhas(ctx: CanvasRenderingContext2D, dados: DadosCartaz): LinhaCampo[] {
  fonte(ctx, 'cond', 26, 400);
  const campos: [string, string][] = [
    ['ARTIGOS / ENQUADRAMENTO', dados.artigos ?? ''],
    ['ITENS APREENDIDOS', dados.itensApreendidos ?? ''],
    ['AGENTE QUE EFETUOU A PRISÃO', dados.agente ?? ''],
    ['UNIDADE NA OCORRÊNCIA', dados.unidade ?? ''],
    ['ESCRIVÃO RESPONSÁVEL', dados.escrivao ?? ''],
    ['LOCAL DA OCORRÊNCIA', dados.local ?? ''],
    ['OBSERVAÇÕES', dados.observacoes ?? ''],
  ];
  return campos.map(([rotulo, valor]) => {
    const linhas = quebrar(ctx, valor, LARG - 44, 4);
    return { rotulo, linhas, altura: Math.max(96, 46 + linhas.length * 30 + 18) };
  });
}

export function imagemCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  pb = true,
) {
  const escala = Math.max(w / img.width, h / img.height);
  const iw = img.width * escala;
  const ih = img.height * escala;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (pb) ctx.filter = 'grayscale(1) contrast(1.1)';
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  ctx.restore();
}

export function imagemContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const escala = Math.min(w / img.width, h / img.height);
  const iw = img.width * escala;
  const ih = img.height * escala;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

/** Gera o cartaz em PNG. `marcaDagua` marca prévias e testes (ex.: "EXEMPLO"). */
export async function gerarCartaz(
  dados: DadosCartaz,
  opcoes: { marcaDagua?: string } = {},
): Promise<Cartaz> {
  await garantirFontes();

  const medida = document.createElement('canvas').getContext('2d');
  if (!medida) throw new Error('Este navegador não suporta canvas.');
  const linhas = prepararLinhas(medida, dados);
  const alturaTabela = linhas.reduce((total, l) => total + l.altura, 0);

  const Y_TABELA = 480;
  const yFimTabela = Y_TABELA + alturaTabela;
  const H = Math.max(1520, yFimTabela + 360);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível criar o cartaz.');

  ctx.fillStyle = BRANCO;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = PRETO;
  ctx.strokeStyle = PRETO;

  /* ------------------------- moldura ------------------------- */
  ctx.lineWidth = 3;
  ctx.strokeRect(MARGEM, MARGEM, W - 2 * MARGEM, H - 2 * MARGEM);

  /* ------------------------- cabeçalho ----------------------- */
  const brasao = await carregarImagem('/brasao-pcpr.png');
  if (brasao) ctx.drawImage(brasao, ESQ, MARGEM + 18, 96, 96);

  const xTexto = ESQ + 118;
  fonte(ctx, 'anton', 44);
  ctx.fillStyle = PRETO;
  ctx.fillText('POLÍCIA CIVIL DO PARANÁ', xTexto, MARGEM + 66);
  fonte(ctx, 'cond', 20, 600);
  ctx.fillStyle = CINZA;
  ctx.fillText('SECRETARIA DE SEGURANÇA PÚBLICA · SISTEMA RP', xTexto, MARGEM + 90);
  ctx.fillText('REGISTRO DE PRISÕES E APREENSÕES', xTexto, MARGEM + 112);

  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.moveTo(DIR - 112, MARGEM + 20);
  ctx.lineTo(DIR - 112, MARGEM + 112);
  ctx.stroke();
  ctx.textAlign = 'right';
  ctx.fillStyle = PRETO;
  fonte(ctx, 'anton', 42);
  ctx.fillText('PCPR', DIR, MARGEM + 66);
  fonte(ctx, 'cond', 22, 700);
  ctx.fillText('RP', DIR, MARGEM + 96);
  ctx.textAlign = 'left';

  /* ------------------------- faixa preta --------------------- */
  const yFaixa = MARGEM + 132;
  ctx.fillStyle = PRETO;
  ctx.fillRect(ESQ, yFaixa, LARG, 56);
  ctx.fillStyle = BRANCO;
  fonte(ctx, 'cond', 26, 700);
  espacado(ctx, 'FICHA DE REGISTRO DE PRISÃO', ESQ + 16, yFaixa + 36, 2.4);
  ctx.textAlign = 'right';
  fonte(ctx, 'cond', 24, 600);
  ctx.fillText(`Nº ${dados.numero || 'A GERAR'}`, DIR - 16, yFaixa + 36);
  ctx.textAlign = 'left';

  /* ------------------------- identificação ------------------- */
  const yPerfil = yFaixa + 76;
  const fotoX = ESQ;
  const fotoW = 176;
  const fotoH = 214;
  if (dados.fotos?.[0]) {
    const foto = await carregarImagem(dados.fotos[0]);
    if (foto) {
      imagemCover(ctx, foto, fotoX, yPerfil, fotoW, fotoH);
    } else {
      ctx.fillStyle = '#e6e6e6';
      ctx.fillRect(fotoX, yPerfil, fotoW, fotoH);
    }
  } else {
    ctx.fillStyle = '#e6e6e6';
    ctx.fillRect(fotoX, yPerfil, fotoW, fotoH);
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'center';
    fonte(ctx, 'anton', 38);
    ctx.fillText('SEM', fotoX + fotoW / 2, yPerfil + fotoH / 2 - 4);
    ctx.fillText('FOTO', fotoX + fotoW / 2, yPerfil + fotoH / 2 + 36);
    ctx.textAlign = 'left';
  }
  ctx.strokeStyle = PRETO;
  ctx.lineWidth = 3;
  ctx.strokeRect(fotoX, yPerfil, fotoW, fotoH);
  if ((dados.fotos?.length ?? 0) > 1) {
    ctx.fillStyle = PRETO;
    ctx.fillRect(fotoX, yPerfil + fotoH - 26, fotoW, 26);
    ctx.fillStyle = BRANCO;
    ctx.textAlign = 'center';
    fonte(ctx, 'cond', 17, 700);
    ctx.fillText(`+${(dados.fotos?.length ?? 0) - 1} FOTOS`, fotoX + fotoW / 2, yPerfil + fotoH - 8);
    ctx.textAlign = 'left';
  }

  const xDir = fotoX + fotoW + 22;
  ctx.fillStyle = CINZA;
  fonte(ctx, 'cond', 17, 700);
  espacado(ctx, 'IDENTIFICAÇÃO DO CUSTODIADO', xDir, yPerfil + 20, 1.8);

  const nome = (dados.nome?.trim() || 'NOME DO CUSTODIADO').toUpperCase();
  ctx.fillStyle = PRETO;
  let tamanhoNome = 50;
  fonte(ctx, 'anton', tamanhoNome);
  while (ctx.measureText(nome).width > DIR - xDir && tamanhoNome > 26) {
    tamanhoNome -= 2;
    fonte(ctx, 'anton', tamanhoNome);
  }
  ctx.fillText(nome, xDir, yPerfil + 88);

  fonte(ctx, 'cond', 23, 600);
  ctx.fillText(`ID RP  ${textoOuTraco(dados.idRp)}`, xDir, yPerfil + 116);
  const idLargura = ctx.measureText(`ID RP  ${textoOuTraco(dados.idRp)}`).width;
  ctx.fillText(`TEMPO DE PRISÃO  ${textoOuTraco(dados.tempoPrisao)}`, xDir + idLargura + 30, yPerfil + 116);

  /* -------------------- dia e data automáticos ---------------- */
  const yAuto = yPerfil + 128;
  const autoW = DIR - xDir;
  ctx.setLineDash([7, 5]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = PRETO;
  ctx.strokeRect(xDir, yAuto, autoW, 88);
  ctx.setLineDash([]);
  ctx.fillStyle = PRETO;
  fonte(ctx, 'cond', 16, 700);
  espacado(ctx, 'DIA E DATA · GERADOS AUTOMATICAMENTE', xDir + 14, yAuto + 22, 1.6);
  const col1 = xDir + 14;
  const col2 = xDir + autoW * 0.55;
  const col3 = xDir + autoW * 0.76;
  [col2, col3].forEach((x) => {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.moveTo(x, yAuto + 30);
    ctx.lineTo(x, yAuto + 78);
    ctx.stroke();
  });
  const colunas: [number, string, string][] = [
    [col1, 'DIA DA SEMANA', diaPorExtenso(dados.criadoEm)],
    [col2 + 14, 'DATA', dataBR(dados.criadoEm)],
    [col3 + 14, 'HORA', horaBR(dados.criadoEm)],
  ];
  colunas.forEach(([x, rotulo, valor]) => {
    ctx.fillStyle = CINZA;
    fonte(ctx, 'cond', 15, 700);
    ctx.fillText(rotulo, x, yAuto + 46);
    ctx.fillStyle = PRETO;
    fonte(ctx, 'cond', 27, 600);
    ctx.fillText(valor.toUpperCase(), x, yAuto + 74);
  });

  /* --------------------------- tabela ------------------------ */
  let y = Y_TABELA;
  ctx.lineWidth = 2;
  ctx.strokeStyle = PRETO;
  ctx.strokeRect(ESQ, y, LARG, alturaTabela);
  for (const linha of linhas) {
    ctx.fillStyle = CINZA;
    fonte(ctx, 'cond', 16, 700);
    espacado(ctx, linha.rotulo, ESQ + 18, y + 27, 1.7);
    ctx.fillStyle = PRETO;
    fonte(ctx, 'cond', 26, 400);
    linha.linhas.forEach((texto, i) => ctx.fillText(texto, ESQ + 18, y + 58 + i * 30));
    y += linha.altura;
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.moveTo(ESQ, y);
    ctx.lineTo(DIR, y);
    ctx.stroke();
  }

  /* --------------------------- rodapé ------------------------ */
  ctx.fillStyle = PRETO;
  fonte(ctx, 'cond', 19, 400);
  ctx.fillText(
    `Documento gerado automaticamente em ${dataHoraBR(dados.criadoEm)} — horário de Brasília.`,
    ESQ,
    yFimTabela + 34,
  );
  ctx.fillStyle = CINZA;
  fonte(ctx, 'cond', 17, 500);
  ctx.fillText(carimboCompleto(dados.criadoEm), ESQ, yFimTabela + 58);

  /* ------------------- assinatura do escrivão ---------------- */
  const escrivao = dados.escrivao?.trim() || '—';
  const yLinhaAssinatura = H - 118;
  const xAssinatura = DIR - 430;

  ctx.fillStyle = CINZA;
  ctx.textAlign = 'right';
  fonte(ctx, 'cond', 16, 700);
  espacadoDireita(ctx, 'ASSINATURA DO ESCRIVÃO', DIR, yLinhaAssinatura - 92, 1.6);
  ctx.textAlign = 'left';

  if (dados.assinatura) {
    const img = await carregarImagem(dados.assinatura);
    if (img) imagemContain(ctx, img, xAssinatura, yLinhaAssinatura - 88, 430, 82);
  } else {
    ctx.fillStyle = PRETO;
    ctx.textAlign = 'right';
    fonte(ctx, 'script', 52);
    // Caligrafia com nome do escrivão quando não há assinatura desenhada.
    ctx.fillText(escrivao === '—' ? 'Escrivão' : escrivao, DIR - 10, yLinhaAssinatura - 12);
    ctx.textAlign = 'left';
  }

  ctx.beginPath();
  ctx.lineWidth = 1.6;
  ctx.moveTo(xAssinatura, yLinhaAssinatura);
  ctx.lineTo(DIR, yLinhaAssinatura);
  ctx.stroke();

  ctx.fillStyle = PRETO;
  ctx.textAlign = 'left';
  fonte(ctx, 'cond', 18, 700);
  espacadoCentro(
    ctx,
    `ESCRIVÃO · ${escrivao.toUpperCase()}`,
    (xAssinatura + DIR) / 2,
    yLinhaAssinatura + 26,
    1.4,
  );

  /* ------------------------- marca d'água -------------------- */
  if (opcoes.marcaDagua) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 7);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.065)';
    fonte(ctx, 'anton', 150);
    ctx.fillText(opcoes.marcaDagua.toUpperCase(), 0, 0);
    ctx.restore();
  }

  const numero = (dados.numero || 'ficha').replace(/[^a-zA-Z0-9-]/g, '-');
  const nomeArquivo = `cartaz-${numero}.png`;
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao gerar o PNG do cartaz.'))), 'image/png');
  });
  return { dataUrl, blob, nome: nomeArquivo, largura: W, altura: H };
}

/** Ficha de exemplo usada na prévia e no teste do Discord. */
export function dadosCartazExemplo(): DadosCartaz {
  return {
    numero: 'PCPR-2026-0001',
    fotos: [],
    nome: 'João da Silva',
    idRp: '18420',
    artigos: 'Art. 33 — Tráfico de Drogas\nArt. 12 — Porte Ilegal de Arma de Fogo',
    tempoPrisao: '30 minutos',
    itensApreendidos: '1 arma de fogo, 12 munições, R$ 3.500,00 em espécie, 1 celular',
    agente: 'Agente R. Souza',
    unidade: 'DENARC — Delegacia de Narcóticos',
    escrivao: 'Escrivão M. Lima',
    local: 'Avenida Central, Centro',
    observacoes: 'Ocorrência atendida pela viatura 12. Custodiado encaminhado à carceragem.',
    criadoEm: new Date().toISOString(),
  };
}
