import type { FormularioRecrutamento } from '../types';

/**
 * Fichas de identificação operacional das unidades especializadas.
 *
 * Seguem o padrão de qualificação da tropa:
 *   QRA    — nome de guerra / indicativo do operador
 *   PT     — posto ou graduação
 *   UND    — unidade de lotação atual
 *   CARGHR — carga horária disponível para o serviço
 *
 * As inscrições caem na mesma lista do comando usada pelo edital do 13º BPM.
 */

export const FORMULARIO_ROTAM: FormularioRecrutamento = {
  id: 'rotam-operacional-2026',
  titulo: 'FICHA DE IDENTIFICAÇÃO OPERACIONAL — ROTAM',
  subtitulo: 'SELEÇÃO INTERNA — CURSO OPERACIONAL DE ROTAM 2026',
  batalhao: 'Pelotões ROTAM dos Batalhões de Área',
  referencia: 'ROTAM',
  introducao:
    'Ficha de qualificação operacional para policiais militares interessados no Curso Operacional de Rondas Ostentivas Tático Móveis. Preencha seus dados de identificação e a disponibilidade de serviço; a análise é feita pelo comando da unidade.',
  orientacoes: [
    'Preencha a identificação com o mesmo QRA usado em serviço.',
    'O PT deve corresponder ao posto ou graduação efetivamente ocupado.',
    'A UND é a sua unidade de lotação no momento da inscrição.',
    'A CARGHR informada será considerada na escala do curso.',
    'Somente policiais militares da ativa com curso de formação concluído podem se inscrever.',
    'A inscrição não garante matrícula: o comando avalia antiguidade, comportamento e aptidão física.',
  ],
  rodape: 'Boa sorte, policial!\n\nComando do ROTAM — Polícia Militar do Paraná',
  campos: [
    {
      id: 'identificacao',
      numero: 0,
      titulo: 'Identificação funcional',
      tipo: 'identificacao',
      obrigatorio: true,
      ajuda: 'Nome de guerra, idade e ID funcional',
    },
    {
      id: 'qra',
      numero: 1,
      titulo: 'QRA — nome de guerra / indicativo',
      tipo: 'texto',
      obrigatorio: true,
      minimoCaracteres: 2,
      placeholder: 'Ex.: CB Silva',
      ajuda: 'QRA: prefixo da estação ou do operador.',
    },
    {
      id: 'pt',
      numero: 2,
      titulo: 'PT — posto ou graduação',
      tipo: 'opcoes',
      obrigatorio: true,
      opcoes: ['Soldado', 'Cabo', '3º Sargento', '2º Sargento', '1º Sargento', 'Subtenente', '2º Tenente', '1º Tenente', 'Capitão'],
      ajuda: 'PT: posto ou graduação do operador.',
    },
    {
      id: 'und',
      numero: 3,
      titulo: 'UND — unidade de lotação',
      tipo: 'texto',
      obrigatorio: true,
      minimoCaracteres: 3,
      placeholder: 'Ex.: 13º BPM — Fronteira Sul',
      ajuda: 'UND: unidade onde está lotado atualmente.',
    },
    {
      id: 'cargHR',
      numero: 4,
      titulo: 'CARGHR — carga horária disponível',
      tipo: 'opcoes-outro',
      obrigatorio: true,
      opcoes: ['8 horas semanais', '12 horas semanais', '20 horas semanais', '24 horas semanais', '40 horas semanais'],
      permiteOutro: true,
      ajuda: 'CARGHR: quantas horas por semana você consegue cumprir no curso e na escala.',
    },
    {
      id: 'experiencia',
      numero: 5,
      titulo: 'Você já possui curso de ROTAM, Choque ou outra especializada? Qual?',
      tipo: 'texto-longo',
      obrigatorio: true,
      minimoCaracteres: 10,
      placeholder: 'Se não possui, escreva "não possuo" e informe sua experiência operacional.',
    },
    {
      id: 'motivacao',
      numero: 6,
      titulo: 'Por que deseja integrar o ROTAM?',
      tipo: 'texto-longo',
      obrigatorio: true,
      minimoCaracteres: 60,
      ajuda: 'Descreva sua motivação e o que você pode agregar à tropa.',
    },
  ],
};

export const FORMULARIO_RONE: FormularioRecrutamento = {
  id: 'rone-operacional-2026',
  titulo: 'FICHA DE IDENTIFICAÇÃO OPERACIONAL — RONE',
  subtitulo: 'SELEÇÃO INTERNA — CURSO DE OPERAÇÕES ESPECIAIS 2026',
  batalhao: 'Batalhão de Rondas Ostensivas de Natureza Especial (BPRONE)',
  referencia: 'RONE',
  introducao:
    'Ficha de qualificação operacional para policiais militares interessados no Curso de Operações Especiais do BPRONE. Preencha seus dados de identificação e a disponibilidade de serviço; a análise é feita pelo comando da unidade.',
  orientacoes: [
    'Preencha a identificação com o mesmo QRA usado em serviço.',
    'O PT deve corresponder ao posto ou graduação efetivamente ocupado.',
    'A UND é a sua unidade de lotação no momento da inscrição.',
    'A CARGHR informada será considerada na escala do curso.',
    'Exige-se no mínimo 3 anos de serviço efetivo e aptidão física comprovada.',
    'A inscrição não garante matrícula: o comando avalia antiguidade, comportamento e histórico operacional.',
  ],
  rodape: 'Boa sorte, policial!\n\nComando do BPRONE — Polícia Militar do Paraná',
  campos: [
    {
      id: 'identificacao',
      numero: 0,
      titulo: 'Identificação funcional',
      tipo: 'identificacao',
      obrigatorio: true,
      ajuda: 'Nome de guerra, idade e ID funcional',
    },
    {
      id: 'qra',
      numero: 1,
      titulo: 'QRA — nome de guerra / indicativo',
      tipo: 'texto',
      obrigatorio: true,
      minimoCaracteres: 2,
      placeholder: 'Ex.: 3º SGT Rocha',
      ajuda: 'QRA: prefixo da estação ou do operador.',
    },
    {
      id: 'pt',
      numero: 2,
      titulo: 'PT — posto ou graduação',
      tipo: 'opcoes',
      obrigatorio: true,
      opcoes: ['Soldado', 'Cabo', '3º Sargento', '2º Sargento', '1º Sargento', 'Subtenente', '2º Tenente', '1º Tenente', 'Capitão'],
      ajuda: 'PT: posto ou graduação do operador.',
    },
    {
      id: 'und',
      numero: 3,
      titulo: 'UND — unidade de lotação',
      tipo: 'texto',
      obrigatorio: true,
      minimoCaracteres: 3,
      placeholder: 'Ex.: 13º BPM — Fronteira Sul',
      ajuda: 'UND: unidade onde está lotado atualmente.',
    },
    {
      id: 'cargHR',
      numero: 4,
      titulo: 'CARGHR — carga horária disponível',
      tipo: 'opcoes-outro',
      obrigatorio: true,
      opcoes: ['8 horas semanais', '12 horas semanais', '20 horas semanais', '24 horas semanais', '40 horas semanais'],
      permiteOutro: true,
      ajuda: 'CARGHR: quantas horas por semana você consegue cumprir no curso e na escala.',
    },
    {
      id: 'tempoServico',
      numero: 5,
      titulo: 'Tempo de serviço efetivo na corporação',
      tipo: 'opcoes',
      obrigatorio: true,
      opcoes: ['Menos de 3 anos', '3 a 5 anos', '5 a 10 anos', 'Mais de 10 anos'],
      ajuda: 'Requisito mínimo: 3 anos de serviço.',
    },
    {
      id: 'especializada',
      numero: 6,
      titulo: 'Possui curso de ROTAM, Choque ou outra especializada?',
      tipo: 'texto-longo',
      obrigatorio: true,
      minimoCaracteres: 10,
      placeholder: 'Informe o curso, a data de conclusão e a unidade formadora.',
    },
    {
      id: 'motivacao',
      numero: 7,
      titulo: 'Por que deseja integrar o RONE?',
      tipo: 'texto-longo',
      obrigatorio: true,
      minimoCaracteres: 60,
      ajuda: 'Descreva sua motivação e seu histórico operacional.',
    },
  ],
};

/** Formulários das unidades especializadas, indexados pelo id do edital. */
export const FORMULARIOS_UNIDADE: Record<string, FormularioRecrutamento> = {
  rotam: FORMULARIO_ROTAM,
  rone: FORMULARIO_RONE,
};
