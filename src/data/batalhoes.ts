/**
 * Batalhões e unidades da Polícia Militar do Paraná.
 *
 * Usado no local da prova do cartaz: o comando escolhe o batalhão na lista e
 * o local é preenchido sozinho, sem digitação.
 */

export interface Batalhao {
  /** Sigla usada na seleção, como "13º BPM". */
  sigla: string;
  /** Nome por extenso. */
  nome: string;
  /** Cidade sede, com a região quando a sede é Curitiba. */
  cidade: string;
  /** Unidade especializada (aparece depois dos batalhões de área). */
  especializada?: boolean;
}

export const BATALHOES: Batalhao[] = [
  { sigla: '1º BPM', nome: '1º Batalhão de Polícia Militar', cidade: 'Ponta Grossa/PR' },
  { sigla: '2º BPM', nome: '2º Batalhão de Polícia Militar', cidade: 'Jacarezinho/PR' },
  { sigla: '3º BPM', nome: '3º Batalhão de Polícia Militar', cidade: 'Pato Branco/PR' },
  { sigla: '4º BPM', nome: '4º Batalhão de Polícia Militar', cidade: 'Maringá/PR' },
  { sigla: '5º BPM', nome: '5º Batalhão de Polícia Militar', cidade: 'Londrina/PR' },
  { sigla: '6º BPM', nome: '6º Batalhão de Polícia Militar', cidade: 'Cascavel/PR' },
  { sigla: '7º BPM', nome: '7º Batalhão de Polícia Militar', cidade: 'Cruzeiro do Oeste/PR' },
  { sigla: '8º BPM', nome: '8º Batalhão de Polícia Militar', cidade: 'Paranavaí/PR' },
  { sigla: '9º BPM', nome: '9º Batalhão de Polícia Militar', cidade: 'Paranaguá/PR' },
  { sigla: '10º BPM', nome: '10º Batalhão de Polícia Militar', cidade: 'Apucarana/PR' },
  { sigla: '11º BPM', nome: '11º Batalhão de Polícia Militar', cidade: 'Campo Mourão/PR' },
  { sigla: '12º BPM', nome: '12º Batalhão de Polícia Militar', cidade: 'Curitiba/PR — centro/noroeste' },
  { sigla: '13º BPM', nome: '13º Batalhão de Polícia Militar', cidade: 'Curitiba/PR — região sul' },
  { sigla: '14º BPM', nome: '14º Batalhão de Polícia Militar', cidade: 'Foz do Iguaçu/PR' },
  { sigla: '15º BPM', nome: '15º Batalhão de Polícia Militar', cidade: 'Rolândia/PR' },
  { sigla: '16º BPM', nome: '16º Batalhão de Polícia Militar', cidade: 'Guarapuava/PR' },
  { sigla: '17º BPM', nome: '17º Batalhão de Polícia Militar', cidade: 'São José dos Pinhais/PR' },
  { sigla: '18º BPM', nome: '18º Batalhão de Polícia Militar', cidade: 'Cornélio Procópio/PR' },
  { sigla: '19º BPM', nome: '19º Batalhão de Polícia Militar', cidade: 'Toledo/PR' },
  { sigla: '20º BPM', nome: '20º Batalhão de Polícia Militar', cidade: 'Curitiba/PR — leste/nordeste' },
  { sigla: '21º BPM', nome: '21º Batalhão de Polícia Militar', cidade: 'Francisco Beltrão/PR' },
  { sigla: '22º BPM', nome: '22º Batalhão de Polícia Militar', cidade: 'Colombo/PR' },
  { sigla: '23º BPM', nome: '23º Batalhão de Polícia Militar', cidade: 'Curitiba/PR — sudoeste' },
  { sigla: '25º BPM', nome: '25º Batalhão de Polícia Militar', cidade: 'Umuarama/PR' },
  { sigla: '26º BPM', nome: '26º Batalhão de Polícia Militar', cidade: 'Telêmaco Borba/PR' },
  { sigla: '27º BPM', nome: '27º Batalhão de Polícia Militar', cidade: 'União da Vitória/PR' },
  { sigla: '28º BPM', nome: '28º Batalhão de Polícia Militar', cidade: 'Lapa/PR' },
  { sigla: 'BPRONE', nome: 'Batalhão de Polícia de Rondas Ostensivas de Natureza Especial', cidade: 'Curitiba/PR', especializada: true },
  { sigla: 'ROTAM', nome: 'Rondas Ostensivas Tático Móveis', cidade: 'Curitiba/PR', especializada: true },
  { sigla: 'BOPE', nome: 'Batalhão de Operações Especiais', cidade: 'Curitiba/PR', especializada: true },
  { sigla: 'BPCHOQUE', nome: 'Batalhão de Polícia de Choque', cidade: 'Curitiba/PR', especializada: true },
  { sigla: 'APMG', nome: 'Academia Policial Militar do Guatupê', cidade: 'São José dos Pinhais/PR', especializada: true },
];

/** Local escrito no cartaz: "13º BPM — Curitiba/PR — região sul". */
export function localDoBatalhao(batalhao: Batalhao): string {
  return `${batalhao.sigla} — ${batalhao.cidade}`;
}

/** Acha o batalhão a partir do texto salvo no local da prova. */
export function acharBatalhao(local: string | undefined | null): Batalhao | undefined {
  const alvo = (local ?? '').trim();
  if (!alvo) return undefined;
  return BATALHOES.find((b) => localDoBatalhao(b) === alvo);
}
