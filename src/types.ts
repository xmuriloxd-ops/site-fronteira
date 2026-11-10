/**
 * Tipos centrais do Portal de Editais da Polícia Militar do Paraná.
 */

export type EditalStatus = 'aberto' | 'em-breve' | 'encerrado';
export type EditalTom = 'rotam' | 'rone' | 'pmpr';

export interface EditalMateria {
  titulo: string;
  topicos: string[];
}

export interface EditalEtapa {
  ordem: number;
  nome: string;
  descricao: string;
  carater: 'Eliminatório' | 'Classificatório' | 'Eliminatório e classificatório';
}

export interface EditalCronogramaItem {
  etapa: string;
  periodo: string;
  observacao?: string;
}

export interface EditalRequisito {
  titulo: string;
  detalhe: string;
}

export interface Edital {
  id: string;
  sigla: string;
  nome: string;
  unidade: string;
  tom: EditalTom;
  status: EditalStatus;
  chamada: string;
  resumo: string;
  vagas: number;
  vagasDetalhe: string;
  publico: string;
  remuneracao: string;
  remuneracaoCurta: string;
  taxa: string;
  inscricoes: string;
  prova: string;
  banca: string;
  escolaridade: string;
  idade: string;
  local: string;
  destaque: string[];
  requisitos: EditalRequisito[];
  etapas: EditalEtapa[];
  materias: EditalMateria[];
  cronograma: EditalCronogramaItem[];
  observacoes: string[];
}

export interface ProvaAnterior {
  id: string;
  orgao: string;
  cargo: string;
  ano: number;
  banca: string;
  tipo: 'Prova objetiva' | 'Gabarito' | 'Prova discursiva' | 'Prova completa';
  url: string;
  fonte: string;
  observacao?: string;
}

export interface QuestaoSimulado {
  id: string;
  disciplina: string;
  enunciado: string;
  alternativas: string[];
  correta: number;
  explicacao: string;
}

export interface Interessado {
  id: string;
  nome: string;
  discord: string;
  editais: string[];
  criadoEm: string;
  vinculado: boolean;
}

export interface EnvioDiscord {
  id: string;
  editalId: string;
  titulo: string;
  destino: string;
  status: 'sucesso' | 'erro';
  detalhe?: string;
  criadoEm: string;
}

export interface ConfigDiscord {
  webhook: string;
  canal: string;
  autoEnviar: boolean;
  mencionarHere: boolean;
  vinculado: boolean;
}

export interface EditalOverride {
  status?: EditalStatus;
  aviso?: string;
}

export interface AdminData {
  login: string;
  discord: ConfigDiscord;
  interessados: Interessado[];
  envios: EnvioDiscord[];
  overrides: Record<string, EditalOverride>;
}

export interface AppConfigPublica {
  discordVinculado: boolean;
  canalDiscord: string;
  conviteDiscord: string;
  interessados: number;
  overrides: Record<string, EditalOverride>;
}
