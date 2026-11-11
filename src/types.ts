/**
 * Tipos centrais do sistema da Polícia Civil RP / PR.
 */

/** Um registro de prisão (ficha completa do custodiado). */
export interface Prisao {
  id: string;
  /** Número sequencial do registro, ex.: PCPR-2026-0007. */
  numero: string;
  /** Fotos em data URL (JPEG comprimido no navegador). */
  fotos: string[];
  /** Nome do criminoso / custodiado. */
  nome: string;
  /** ID do personagem no RP. */
  idRp: string;
  /** Artigos / enquadramentos. */
  artigos: string;
  /** Tempo de prisão. */
  tempoPrisao: string;
  /** Itens apreendidos na ocorrência. */
  itensApreendidos: string;
  /** Agente que efetuou a prisão. */
  agente: string;
  /** Unidade que estava na ocorrência. */
  unidade: string;
  /** Nome do escrivão. */
  escrivao: string;
  /** Local da ocorrência (opcional). */
  local?: string;
  /** Observações (opcional). */
  observacoes?: string;
  /** Assinatura desenhada pelo escrivão (data URL PNG com fundo transparente). */
  assinatura?: string;
  /** Dia, data e hora gerados automaticamente a partir deste ISO. */
  criadoEm: string;
  /** Preenchido quando a ficha é entregue no Discord. */
  discordEnviadoEm?: string;
  /** Último erro de envio ao Discord. */
  discordErro?: string;
}

/** Campos digitados pelo agente (o resto é gerado automaticamente). */
export type RascunhoPrisao = Omit<
  Prisao,
  'id' | 'numero' | 'criadoEm' | 'discordEnviadoEm' | 'discordErro'
>;

/* ------------------------------------------------------------------ */
/* Mandados de prisão                                                  */
/* ------------------------------------------------------------------ */

export type StatusMandado = 'pendente' | 'cumprido' | 'revogado';

export const STATUS_MANDADO: Record<StatusMandado, string> = {
  pendente: 'PENDENTE DE CUMPRIMENTO',
  cumprido: 'MANDADO CUMPRIDO',
  revogado: 'REVOGADO',
};

/** Um mandado de prisão expedido no RP. */
export interface Mandado {
  id: string;
  /** Número sequencial, ex.: MDP-2026-0003. */
  numero: string;
  fotos: string[];
  /** Nome do procurado. */
  nome: string;
  /** ID RP do procurado. */
  idRp: string;
  /** Artigos / tipificação. */
  artigos: string;
  /** Fundamento / motivo da expedição. */
  fundamento: string;
  /** Número do processo ou inquérito. */
  processo: string;
  /** Autoridade que expediu (juiz, delegado etc.). */
  autoridade: string;
  /** Juízo / delegacia de origem. */
  origem: string;
  /** Unidade responsável pelo cumprimento. */
  unidade: string;
  /** Agente ou equipe designada. */
  agente: string;
  /** Prazo / validade do mandado. */
  validade: string;
  status: StatusMandado;
  observacoes: string;
  /** Assinatura da autoridade (data URL PNG transparente). */
  assinatura?: string;
  /** Dia, data e hora gerados automaticamente. */
  criadoEm: string;
  /** Preenchido quando o status passa a "cumprido". */
  cumpridoEm?: string;
  discordEnviadoEm?: string;
  discordErro?: string;
}

export type RascunhoMandado = Omit<
  Mandado,
  'id' | 'numero' | 'criadoEm' | 'cumpridoEm' | 'discordEnviadoEm' | 'discordErro'
>;

/** Configuração do canal do Discord que recebe as prisões e mandados. */
export interface ConfigDiscord {
  /** URL do webhook do canal. */
  webhook: string;
  /** Nome amigável do canal, ex.: #prisoes. */
  canal: string;
  /** Envia cada registro automaticamente ao salvar. */
  autoEnviar: boolean;
  /** Marca @here na mensagem. */
  mencionarHere: boolean;
  /** ID de cargo para mencionar (opcional). */
  cargoId?: string;
  /** Nome que aparece como autor da mensagem. */
  nomeBot?: string;
  /** Como o cartaz chega no canal: imagem, texto em embed ou os dois. */
  formatoEnvio?: 'cartaz' | 'texto' | 'ambos';
}

/** Histórico de entregas no Discord. */
export interface EnvioDiscord {
  id: string;
  prisaoId?: string;
  titulo: string;
  status: 'sucesso' | 'erro';
  detalhe: string;
  via: 'navegador' | 'servidor' | 'local';
  criadoEm: string;
}

/** Estado completo do sistema. */
export interface EstadoApp {
  prisoes: Prisao[];
  mandados: Mandado[];
  discord: ConfigDiscord;
  /** Canal específico dos mandados. Webhook vazio = usa o canal das prisões. */
  discordMandados: ConfigDiscord;
  envios: EnvioDiscord[];
}

/** Operações enviadas ao servidor (sincronização granular). */
export type OperacaoSync =
  | { tipo: 'criar'; prisao: Prisao }
  | { tipo: 'atualizar'; prisao: Prisao }
  | { tipo: 'excluir'; id: string }
  | { tipo: 'criar-mandado'; mandado: Mandado }
  | { tipo: 'atualizar-mandado'; mandado: Mandado }
  | { tipo: 'excluir-mandado'; id: string }
  | { tipo: 'discord'; config: ConfigDiscord }
  | { tipo: 'discord-mandados'; config: ConfigDiscord }
  | { tipo: 'envio'; envio: EnvioDiscord };

export const CONFIG_DISCORD_PADRAO: ConfigDiscord = {
  webhook: '',
  canal: '#prisoes',
  autoEnviar: true,
  mencionarHere: false,
  cargoId: '',
  nomeBot: 'PCPR · Registro de Prisões',
  formatoEnvio: 'cartaz',
};

export const CONFIG_MANDADOS_PADRAO: ConfigDiscord = {
  webhook: '',
  canal: '#mandados',
  autoEnviar: true,
  mencionarHere: true,
  cargoId: '',
  nomeBot: 'PCPR · Mandados de Prisão',
  formatoEnvio: 'cartaz',
};

export const ESTADO_VAZIO: EstadoApp = {
  prisoes: [],
  mandados: [],
  discord: CONFIG_DISCORD_PADRAO,
  discordMandados: CONFIG_MANDADOS_PADRAO,
  envios: [],
};

export type AbaId = 'registrar' | 'prisoes' | 'mandados' | 'discord';
