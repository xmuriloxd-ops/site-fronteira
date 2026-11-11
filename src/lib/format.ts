/** Utilitários de data, imagem e texto. Tudo em pt-BR e horário de Brasília. */

export const TZ = 'America/Sao_Paulo';

const fmtDia = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: TZ });
const fmtDiaCurto = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: TZ });
const fmtData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: TZ,
});
const fmtHora = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: TZ,
});
const fmtDataHora = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: TZ,
});

function dataValida(iso?: string): Date {
  const d = iso ? new Date(iso) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function diaPorExtenso(iso?: string): string {
  return fmtDia.format(dataValida(iso)).replace(/^./, (c) => c.toUpperCase());
}

export function diaCurto(iso?: string): string {
  return fmtDiaCurto.format(dataValida(iso)).replace('.', '').toUpperCase();
}

export function dataBR(iso?: string): string {
  return fmtData.format(dataValida(iso));
}

export function horaBR(iso?: string): string {
  return fmtHora.format(dataValida(iso));
}

export function dataHoraBR(iso?: string): string {
  return fmtDataHora.format(dataValida(iso));
}

/** "QUARTA-FEIRA · 11/11/2026 · 14:35:08" */
export function carimboCompleto(iso?: string): string {
  return `${diaPorExtenso(iso).toUpperCase()} · ${dataBR(iso)} · ${horaBR(iso)}`;
}

export function agoraISO(): string {
  return new Date().toISOString();
}

export function novoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Número sequencial por ano com o prefixo escolhido. */
function numeroSequencial(registros: { numero?: string }[], prefixoBase: string, iso: string): string {
  const ano = Number(fmtData.format(dataValida(iso)).slice(-4)) || new Date().getFullYear();
  const prefixo = `${prefixoBase}-${ano}-`;
  let maior = 0;
  for (const p of registros) {
    if (!p.numero?.startsWith(prefixo)) continue;
    const n = Number(p.numero.slice(prefixo.length));
    if (Number.isFinite(n) && n > maior) maior = n;
  }
  return `${prefixo}${String(maior + 1).padStart(4, '0')}`;
}

/** Número sequencial das denúncias (protocolo): DEN-2026-0001. */
export function proximoNumero(denuncias: { numero?: string }[], iso = agoraISO()): string {
  return numeroSequencial(denuncias, 'DEN', iso);
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '??';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function textoOuTraco(valor?: string): string {
  const v = valor?.trim();
  return v ? v : '—';
}

export function limitar(valor: string, max: number): string {
  return valor.length > max ? `${valor.slice(0, max - 1)}…` : valor;
}

/** Reduz a foto antes de guardar (evita JSON gigante). */
export async function comprimirImagem(
  arquivo: File,
  maxLado = 1000,
  qualidade = 0.76,
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    leitor.readAsDataURL(arquivo);
  });

  const imagem = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
    img.src = dataUrl;
  });

  const escala = Math.min(1, maxLado / Math.max(imagem.width, imagem.height));
  const largura = Math.max(1, Math.round(imagem.width * escala));
  const altura = Math.max(1, Math.round(imagem.height * escala));

  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, largura, altura);
  ctx.drawImage(imagem, 0, 0, largura, altura);
  return canvas.toDataURL('image/jpeg', qualidade);
}

export interface ArquivoFoto {
  blob: Blob;
  nome: string;
}

/** Converte uma data URL de imagem em Blob (para anexar no webhook). */
export function dataUrlParaBlob(dataUrl: string): { blob: Blob; tipo: string } | null {
  const m = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return null;
  const tipo = m[1] === 'image/jpg' ? 'image/jpeg' : m[1];
  try {
    const binario = atob(m[2]);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
    return { blob: new Blob([bytes], { type: tipo }), tipo };
  } catch {
    return null;
  }
}

/** Converte uma data URL em arquivo com nome `foto-N.ext`. */
export function dataUrlParaArquivo(dataUrl: string, indice: number): ArquivoFoto | null {
  const convertido = dataUrlParaBlob(dataUrl);
  if (!convertido) return null;
  const extensao =
    convertido.tipo === 'image/png' ? 'png' : convertido.tipo === 'image/webp' ? 'webp' : 'jpg';
  return { blob: convertido.blob, nome: `foto-${indice}.${extensao}` };
}

export function baixarArquivo(nome: string, conteudo: string, tipo = 'application/json') {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
