/**
 * Cartaz do MANDADO DE PRISÃO, no mesmo modelo institucional da ficha de
 * registro (brasão, faixa preta, foto, dia/data automáticos e assinatura da
 * autoridade). Gerado em <canvas> para ser enviado como imagem no Discord.
 */
import type { Mandado } from '../types';
import { STATUS_MANDADO } from '../types';
import { carimboCompleto, dataBR, dataHoraBR, diaPorExtenso, horaBR, textoOuTraco } from './format';
import {
  BRANCO,
  CINZA,
  DIR,
  ESQ,
  LARG,
  MARGEM,
  PRETO,
  W,
  carregarImagem,
  espacado,
  espacadoCentro,
  espacadoDireita,
  fonte,
  garantirFontes,
  imagemContain,
  imagemCover,
  quebrar,
} from './cartaz';

export type DadosCartazMandado = Partial<Mandado> & { criadoEm: string };

export interface CartazMandado {
  dataUrl: string;
  blob: Blob;
  nome: string;
  largura: number;
  altura: number;
}

interface Linha {
  rotulo: string;
  linhas: string[];
  altura: number;
}

function preparar(ctx: CanvasRenderingContext2D, dados: DadosCartazMandado): Linha[] {
  fonte(ctx, 'cond', 26, 400);
  const campos: [string, string][] = [
    ['ARTIGOS / TIPIFICAÇÃO', dados.artigos ?? ''],
    ['FUNDAMENTO DO MANDADO', dados.fundamento ?? ''],
    ['PROCESSO / INQUÉRITO', dados.processo ?? ''],
    ['AUTORIDADE QUE EXPEDIU', dados.autoridade ?? ''],
    ['JUÍZO / UNIDADE DE ORIGEM', dados.origem ?? ''],
    ['UNIDADE RESPONSÁVEL PELO CUMPRIMENTO', dados.unidade ?? ''],
    ['AGENTE / EQUIPE DESIGNADA', dados.agente ?? ''],
    ['VALIDADE / PRAZO', dados.validade ?? ''],
    ['OBSERVAÇÕES', dados.observacoes ?? ''],
  ];
  return campos.map(([rotulo, valor]) => {
    const linhas = quebrar(ctx, valor, LARG - 44, 4);
    return { rotulo, linhas, altura: Math.max(92, 44 + linhas.length * 30 + 16) };
  });
}

export async function gerarCartazMandado(
  dados: DadosCartazMandado,
  opcoes: { marcaDagua?: string } = {},
): Promise<CartazMandado> {
  await garantirFontes();

  const medida = document.createElement('canvas').getContext('2d');
  if (!medida) throw new Error('Este navegador não suporta canvas.');
  const linhas = preparar(medida, dados);
  const alturaTabela = linhas.reduce((total, l) => total + l.altura, 0);

  const Y_TABELA = 560;
  const yFimTabela = Y_TABELA + alturaTabela;
  const H = Math.max(1600, yFimTabela + 360);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível criar o cartaz do mandado.');

  ctx.fillStyle = BRANCO;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  /* moldura */
  ctx.lineWidth = 3;
  ctx.strokeStyle = PRETO;
  ctx.strokeRect(MARGEM, MARGEM, W - 2 * MARGEM, H - 2 * MARGEM);

  /* cabeçalho */
  const brasao = await carregarImagem('/brasao-pcpr.png');
  if (brasao) ctx.drawImage(brasao, ESQ, MARGEM + 18, 96, 96);

  const xTexto = ESQ + 118;
  ctx.fillStyle = PRETO;
  fonte(ctx, 'anton', 44);
  ctx.fillText('POLÍCIA CIVIL DO PARANÁ', xTexto, MARGEM + 66);
  ctx.fillStyle = CINZA;
  fonte(ctx, 'cond', 20, 600);
  ctx.fillText('SECRETARIA DE SEGURANÇA PÚBLICA · SISTEMA RP', xTexto, MARGEM + 90);
  ctx.fillText('MANDADOS DE PRISÃO E CUMPRIMENTO', xTexto, MARGEM + 112);

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

  /* faixa preta */
  const yFaixa = MARGEM + 132;
  ctx.fillStyle = PRETO;
  ctx.fillRect(ESQ, yFaixa, LARG, 56);
  ctx.fillStyle = BRANCO;
  fonte(ctx, 'cond', 26, 700);
  espacado(ctx, 'MANDADO DE PRISÃO', ESQ + 16, yFaixa + 36, 2.8);
  ctx.textAlign = 'right';
  fonte(ctx, 'cond', 24, 600);
  ctx.fillText(`Nº ${dados.numero || 'A GERAR'}`, DIR - 16, yFaixa + 36);
  ctx.textAlign = 'left';

  /* faixa de situação */
  const status = dados.status ?? 'pendente';
  const yStatus = yFaixa + 68;
  ctx.strokeStyle = PRETO;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(ESQ, yStatus, LARG, 54);
  ctx.fillStyle = PRETO;
  fonte(ctx, 'cond', 17, 700);
  espacado(ctx, 'SITUAÇÃO DO MANDADO', ESQ + 16, yStatus + 34, 1.6);
  ctx.textAlign = 'right';
  fonte(ctx, 'anton', 34);
  ctx.fillText(STATUS_MANDADO[status], DIR - 16, yStatus + 39);
  ctx.textAlign = 'left';

  /* identificação do procurado */
  const yPerfil = yStatus + 66;
  const fotoW = 176;
  const fotoH = 214;
  if (dados.fotos?.[0]) {
    const foto = await carregarImagem(dados.fotos[0]);
    if (foto) {
      imagemCover(ctx, foto, ESQ, yPerfil, fotoW, fotoH);
    } else {
      ctx.fillStyle = '#e6e6e6';
      ctx.fillRect(ESQ, yPerfil, fotoW, fotoH);
    }
  } else {
    ctx.fillStyle = '#e6e6e6';
    ctx.fillRect(ESQ, yPerfil, fotoW, fotoH);
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'center';
    fonte(ctx, 'anton', 38);
    ctx.fillText('SEM', ESQ + fotoW / 2, yPerfil + fotoH / 2 - 4);
    ctx.fillText('FOTO', ESQ + fotoW / 2, yPerfil + fotoH / 2 + 36);
    ctx.textAlign = 'left';
  }
  ctx.strokeStyle = PRETO;
  ctx.lineWidth = 3;
  ctx.strokeRect(ESQ, yPerfil, fotoW, fotoH);
  if ((dados.fotos?.length ?? 0) > 1) {
    ctx.fillStyle = PRETO;
    ctx.fillRect(ESQ, yPerfil + fotoH - 26, fotoW, 26);
    ctx.fillStyle = BRANCO;
    ctx.textAlign = 'center';
    fonte(ctx, 'cond', 17, 700);
    ctx.fillText(`+${(dados.fotos?.length ?? 0) - 1} FOTOS`, ESQ + fotoW / 2, yPerfil + fotoH - 8);
    ctx.textAlign = 'left';
  }

  const xDir = ESQ + fotoW + 22;
  ctx.fillStyle = CINZA;
  fonte(ctx, 'cond', 17, 700);
  espacado(ctx, 'IDENTIFICAÇÃO DO PROCURADO', xDir, yPerfil + 20, 1.8);

  const nome = (dados.nome?.trim() || 'NOME DO PROCURADO').toUpperCase();
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

  /* dia e data automáticos */
  const yAuto = yPerfil + 136;
  const autoW = DIR - xDir;
  ctx.setLineDash([7, 5]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = PRETO;
  ctx.strokeRect(xDir, yAuto, autoW, 100);
  ctx.setLineDash([]);
  ctx.fillStyle = PRETO;
  fonte(ctx, 'cond', 16, 700);
  espacado(ctx, 'DIA E DATA · GERADOS AUTOMATICAMENTE', xDir + 14, yAuto + 24, 1.6);
  const col1 = xDir + 14;
  const col2 = xDir + autoW * 0.55;
  const col3 = xDir + autoW * 0.76;
  [col2, col3].forEach((x) => {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.moveTo(x, yAuto + 38);
    ctx.lineTo(x, yAuto + 90);
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
    ctx.fillText(rotulo, x, yAuto + 54);
    ctx.fillStyle = PRETO;
    fonte(ctx, 'cond', 27, 600);
    ctx.fillText(valor.toUpperCase(), x, yAuto + 84);
  });

  /* tabela de campos */
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

  /* rodapé */
  ctx.fillStyle = PRETO;
  fonte(ctx, 'cond', 19, 400);
  ctx.fillText(
    `Documento gerado automaticamente em ${dataHoraBR(dados.criadoEm)} — horário de Brasília.`,
    ESQ,
    yFimTabela + 34,
  );
  ctx.fillStyle = CINZA;
  fonte(ctx, 'cond', 17, 500);
  const extra =
    status === 'cumprido' && dados.cumpridoEm
      ? `${carimboCompleto(dados.criadoEm)} · CUMPRIDO EM ${dataHoraBR(dados.cumpridoEm)}`
      : carimboCompleto(dados.criadoEm);
  ctx.fillText(extra, ESQ, yFimTabela + 58);

  /* assinatura da autoridade */
  const autoridade = dados.autoridade?.trim() || '—';
  const yLinha = H - 118;
  const xAssinatura = DIR - 430;

  ctx.fillStyle = CINZA;
  fonte(ctx, 'cond', 16, 700);
  espacadoDireita(ctx, 'ASSINATURA DA AUTORIDADE', DIR, yLinha - 92, 1.6);

  if (dados.assinatura) {
    const img = await carregarImagem(dados.assinatura);
    if (img) imagemContain(ctx, img, xAssinatura, yLinha - 88, 430, 82);
  } else {
    const nomeCursivo = autoridade === '—' ? 'Autoridade' : autoridade;
    let tamanho = 52;
    ctx.fillStyle = PRETO;
    ctx.textAlign = 'right';
    fonte(ctx, 'script', tamanho);
    while (ctx.measureText(nomeCursivo).width > 420 && tamanho > 24) {
      tamanho -= 2;
      fonte(ctx, 'script', tamanho);
    }
    ctx.fillText(nomeCursivo, DIR - 10, yLinha - 12);
    ctx.textAlign = 'left';
  }

  ctx.beginPath();
  ctx.lineWidth = 1.6;
  ctx.moveTo(xAssinatura, yLinha);
  ctx.lineTo(DIR, yLinha);
  ctx.stroke();

  ctx.fillStyle = PRETO;
  fonte(ctx, 'cond', 18, 700);
  espacadoCentro(ctx, `AUTORIDADE · ${autoridade.toUpperCase()}`, (xAssinatura + DIR) / 2, yLinha + 26, 1.4);

  /* marca d'água */
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

  const numero = (dados.numero || 'mandado').replace(/[^a-zA-Z0-9-]/g, '-');
  const nomeArquivo = `cartaz-${numero}.png`;
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Falha ao gerar o PNG do cartaz do mandado.'))),
      'image/png',
    );
  });
  return { dataUrl, blob, nome: nomeArquivo, largura: W, altura: H };
}

/** Mandado de exemplo usado na prévia e no teste do Discord. */
export function dadosMandadoExemplo(): DadosCartazMandado {
  return {
    numero: 'MDP-2026-0001',
    fotos: [],
    nome: 'Carlos Alberto Ribeiro',
    idRp: '22981',
    artigos: 'Art. 121 — Homicídio Qualificado\nArt. 157 — Roubo',
    fundamento: 'Prisão preventiva decretada para garantia da ordem pública e conveniência da instrução criminal.',
    processo: '0001234-56.2026.8.16.0001',
    autoridade: 'Dr. Henrique Almeida',
    origem: '2ª Vara Criminal da Comarca de Curitiba',
    unidade: 'DHPP — Delegacia de Homicídios',
    agente: 'Equipe de Capturas / Agente P. Costa',
    validade: 'Até o efetivo cumprimento ou revogação',
    status: 'pendente',
    observacoes: 'Procurado possui antecedentes e pode estar armado. Cumprimento com apoio tático.',
    criadoEm: new Date().toISOString(),
  };
}
