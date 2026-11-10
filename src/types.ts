/**
 * Tipos centrais do Portal de Inscrições da Polícia Militar do Paraná.
 */


/* ------------------------------------------------------------------ */
/* Formulário de recrutamento RP                                       */
/* ------------------------------------------------------------------ */

export type TipoCampoRecrutamento =
  | 'identificacao'
  | 'texto'
  | 'texto-longo'
  | 'opcoes'
  | 'opcoes-outro';

export interface CampoRecrutamento {
  id: string;
  numero: number;
  titulo: string;
  ajuda?: string;
  tipo: TipoCampoRecrutamento;
  obrigatorio: boolean;
  opcoes?: string[];
  permiteOutro?: boolean;
  minimoCaracteres?: number;
  placeholder?: string;
}

export interface FormularioRecrutamento {
  id: string;
  titulo: string;
  subtitulo: string;
  batalhao: string;
  referencia: string;
  introducao: string;
  orientacoes: string[];
  rodape: string;
  campos: CampoRecrutamento[];
}

export interface InscricaoRecrutamento {
  id: string;
  formularioId: string;
  nome: string;
  idade: string;
  idRp: string;
  respostas: Record<string, string>;
  criadoEm: string;
  status: 'novo' | 'em-analise' | 'aprovado' | 'reprovado';
  observacaoComando?: string;
}

/* ------------------------------------------------------------------ */
/* Interessados e Discord                                             */
/* ------------------------------------------------------------------ */

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



export interface AdminData {
  login: string;
  discord: ConfigDiscord;
  interessados: Interessado[];
  envios: EnvioDiscord[];
}

export interface AppConfigPublica {
  discordVinculado: boolean;
  canalDiscord: string;
  conviteDiscord: string;
  interessados: number;
  inscricoes: number;
}
