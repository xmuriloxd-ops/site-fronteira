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
  /** Entrega automática da ficha no Discord (preenchida pelo servidor). */
  discordEnviado?: boolean;
  discordErro?: string;
}

/** Documento de divulgação das inscrições abertas, montado pelo comando. */
export interface DivulgacaoInscricoes {
  /** Unidades em destaque: quais inscrições estão abertas. */
  unidades: string[];
  /** Texto de chamada do anúncio (editável). */
  texto: string;
  /** Data do anúncio no formato ISO (aaaa-mm-dd), editável. */
  data: string;
  /** Horário no formato HH:mm, editável. */
  horario: string;
  /** Quem está divulgando (posto, nome ou setor). */
  responsavel: string;
  /** Link do formulário ou convite do servidor. */
  link: string;
  /** Observações finais (opcional). */
  observacoes: string;
}

/** Destino de Discord devolvido pelo servidor para o envio automático. */
export interface DestinoDiscord {
  /** URL do webhook do canal cadastrado pelo comando. */
  webhook: string;
  mencionarHere: boolean;
}

/** Resposta de POST /api/public/recrutamento */
export interface RespostaInscricao {
  ok: boolean;
  aviso: string;
  inscricao: InscricaoRecrutamento;
  /** Presente apenas quando o envio automático está ligado e há webhook salvo. */
  discord?: DestinoDiscord;
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
  /** Formulário de origem (ou id da inscrição divulgada pelo painel). */
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
  /** Documento de divulgação das inscrições abertas, publicado pelo comando. */
  divulgacao?: DivulgacaoInscricoes;
}
