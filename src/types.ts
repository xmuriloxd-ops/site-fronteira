/**
 * Tipos centrais — Corregedoria-Geral da Polícia Militar do Paraná (RP).
 *
 * O site recebe denúncias contra policiais militares, numera cada protocolo
 * (DEN-AAAA-0001) e pode publicá-las automaticamente num canal do Discord
 * via webhook.
 */

/** Situação da denúncia no acompanhamento corregedoria. */
export type SituacaoDenuncia = 'aberta' | 'em-analise' | 'procedente' | 'improcedente' | 'arquivada';

export const SITUACOES_DENUNCIA: Record<SituacaoDenuncia, string> = {
  aberta: 'ABERTA',
  'em-analise': 'EM ANÁLISE',
  procedente: 'PROCEDENTE',
  improcedente: 'IMPROCEDENTE',
  arquivada: 'ARQUIVADA',
};

/** Uma denúncia protocolada. */
export interface Denuncia {
  id: string;
  /** Protocolo sequencial por ano, ex.: DEN-2026-0001. */
  numero: string;
  /** Natureza da denúncia (conduta em serviço, abuso de autoridade...). */
  categoria: string;
  /** Relato dos fatos. */
  relato: string;
  /** Local onde ocorreram os fatos. */
  local: string;
  /** Data dos fatos (ISO yyyy-mm-dd). */
  dataFatos: string;
  /** Nome do (a) denunciado (a) — ou descrição, se não identificado. */
  denunciadoNome: string;
  /** Posto ou graduação do denunciado. */
  denunciadoPosto: string;
  /** Unidade / OPM do denunciado. */
  denunciadoUnidade: string;
  /** Denúncia anônima (denunciante não se identifica). */
  anonima: boolean;
  /** Nome de quem denuncia (quando não anônima). */
  denuncianteNome: string;
  /** Contato de quem denuncia (quando não anônima). */
  denuncianteContato: string;
  /** Evidências em data URL (JPEG comprimido no navegador). */
  fotos: string[];
  /** Acompanhamento corregedoria. */
  situacao: SituacaoDenuncia;
  /** Parecer / notas internas da corregedoria. */
  parecer: string;
  /** Dia, data e hora gerados automaticamente a partir deste ISO. */
  criadoEm: string;
  /** Última alteração de situação/parecer. */
  atualizadoEm?: string;
  /** Preenchido quando a denúncia é entregue no Discord. */
  discordEnviadoEm?: string;
  /** Último erro de envio ao Discord. */
  discordErro?: string;
}

/** Campos digitados pelo usuário (o resto é gerado automaticamente). */
export type RascunhoDenuncia = Omit<
  Denuncia,
  'id' | 'numero' | 'criadoEm' | 'atualizadoEm' | 'discordEnviadoEm' | 'discordErro'
>;

/** Configuração do canal do Discord que recebe as denúncias. */
export interface ConfigDiscord {
  /** URL do webhook do canal. */
  webhook: string;
  /** Nome amigável do canal, ex.: #denuncias. */
  canal: string;
  /** Publica cada denúncia automaticamente ao salvar. */
  autoEnviar: boolean;
  /** Marca @here na mensagem. */
  mencionarHere: boolean;
  /** ID de cargo para mencionar (opcional). */
  cargoId?: string;
  /** Nome que aparece como autor da mensagem. */
  nomeBot?: string;
  /** Como a denúncia chega no canal: com fotos, em texto ou os dois. */
  formatoEnvio?: 'ambos' | 'texto' | 'fotos';
}

/** Histórico de entregas no Discord. */
export interface EnvioDiscord {
  id: string;
  denunciaId?: string;
  titulo: string;
  status: 'sucesso' | 'erro';
  detalhe: string;
  via: 'navegador' | 'servidor' | 'local';
  criadoEm: string;
}

/** Estado completo do sistema. */
export interface EstadoApp {
  denuncias: Denuncia[];
  discord: ConfigDiscord;
  envios: EnvioDiscord[];
}

/** Operações enviadas ao servidor (sincronização granular). */
export type OperacaoSync =
  | { tipo: 'criar'; denuncia: Denuncia }
  | { tipo: 'atualizar'; denuncia: Denuncia }
  | { tipo: 'excluir'; id: string }
  | { tipo: 'discord'; config: ConfigDiscord }
  | { tipo: 'envio'; envio: EnvioDiscord };

export const CONFIG_DISCORD_PADRAO: ConfigDiscord = {
  webhook: '',
  canal: '#denuncias',
  autoEnviar: true,
  mencionarHere: false,
  cargoId: '',
  nomeBot: 'Corregedoria · Denúncias PMPR',
  formatoEnvio: 'ambos',
};

export const ESTADO_VAZIO: EstadoApp = {
  denuncias: [],
  discord: { ...CONFIG_DISCORD_PADRAO },
  envios: [],
};

export type AbaId = 'denunciar' | 'denuncias' | 'discord';
