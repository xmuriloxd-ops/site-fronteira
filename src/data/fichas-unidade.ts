import type { FormularioRecrutamento } from '../types';

/**
 * Formulários de inscrição das unidades especializadas.
 *
 * Campos do padrão de inscrição:
 *   QRA             — nome de guerra / indicativo do operador
 *   patente         — posto ou graduação
 *   unidade         — lotação atual
 *   cargaHoraria    — disponibilidade semanal
 *   tempoServico    — tempo na corporação
 *   autorizacao     — quem autorizou a inscrição
 *
 * As inscrições caem na mesma lista do comando usada pelo 13º BPM.
 */

export const FORMULARIO_ROTAM: FormularioRecrutamento = {
  id: 'rotam-operacional-2026',
  titulo: 'FORMULÁRIO DE INSCRIÇÃO — ROTAM',
  subtitulo: 'SELEÇÃO INTERNA — CURSO OPERACIONAL DE ROTAM 2026',
  batalhao: 'Pelotões ROTAM dos Batalhões de Área',
  referencia: 'ROTAM',
  introducao:
    'Formulário de inscrição para o Curso Operacional de Rondas Ostensivas Tático Móveis. Informe QRA, patente, unidade, carga horária, tempo de serviço e quem autorizou a sua participação. A análise é feita pelo comando da unidade.',
  orientacoes: [
    'Preencha o QRA com o mesmo usado em serviço.',
    'A patente deve corresponder ao posto ou graduação efetivamente ocupado.',
    'A unidade é a sua lotação no momento da inscrição.',
    'A carga horária informada será considerada na escala do curso.',
    'Informe quem autorizou a sua inscrição (comando imediato).',
    'Somente policiais militares da ativa com curso de formação concluído podem se inscrever.',
  ],
  rodape: 'Boa sorte, policial!\n\nComando do ROTAM — Polícia Militar do Paraná',
  campos: [
    {
      id: 'identificacao',
      numero: 0,
      titulo: 'Identificação',
      tipo: 'identificacao',
      obrigatorio: true,
      ajuda: 'Nome, idade e ID',
    },
    {
      id: 'qra',
      numero: 1,
      titulo: 'QRA',
      tipo: 'texto',
      obrigatorio: true,
      minimoCaracteres: 2,
      placeholder: 'Ex.: CB Silva',
      ajuda: 'Nome de guerra / indicativo usado em serviço.',
    },
    {
      id: 'patente',
      numero: 2,
      titulo: 'Patente',
      tipo: 'opcoes',
      obrigatorio: true,
      opcoes: ['Soldado', 'Cabo', '3º Sargento', '2º Sargento', '1º Sargento', 'Subtenente', '2º Tenente', '1º Tenente', 'Capitão'],
      ajuda: 'Posto ou graduação.',
    },
    {
      id: 'unidade',
      numero: 3,
      titulo: 'Unidade',
      tipo: 'texto',
      obrigatorio: true,
      minimoCaracteres: 3,
      placeholder: 'Ex.: 13º BPM — Fronteira Sul',
      ajuda: 'Unidade onde está lotado.',
    },
    {
      id: 'cargaHoraria',
      numero: 4,
      titulo: 'Carga horária',
      tipo: 'opcoes-outro',
      obrigatorio: true,
      opcoes: ['8 horas semanais', '12 horas semanais', '20 horas semanais', '24 horas semanais', '40 horas semanais'],
      permiteOutro: true,
      ajuda: 'Quanto tempo por semana você tem disponível.',
    },
    {
      id: 'tempoServico',
      numero: 5,
      titulo: 'Tempo de serviço',
      tipo: 'opcoes',
      obrigatorio: true,
      opcoes: ['Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', '5 a 10 anos', 'Mais de 10 anos'],
      ajuda: 'Tempo de serviço efetivo na corporação.',
    },
    {
      id: 'autorizacao',
      numero: 6,
      titulo: 'Quem autorizou',
      tipo: 'texto',
      obrigatorio: true,
      minimoCaracteres: 3,
      placeholder: 'Ex.: Cap. Oliveira — Cmt do 13º BPM',
      ajuda: 'Nome e função de quem autorizou a inscrição.',
    },
  ],
};

export const FORMULARIO_RONE: FormularioRecrutamento = {
  id: 'rone-operacional-2026',
  titulo: 'FORMULÁRIO DE INSCRIÇÃO — RONE',
  subtitulo: 'SELEÇÃO INTERNA — CURSO DE OPERAÇÕES ESPECIAIS 2026',
  batalhao: 'Batalhão de Rondas Ostensivas de Natureza Especial (BPRONE)',
  referencia: 'RONE',
  introducao:
    'Formulário de inscrição para o Curso de Operações Especiais do BPRONE. Informe QRA, patente, unidade, carga horária, tempo de serviço e quem autorizou a sua participação. A análise é feita pelo comando da unidade.',
  orientacoes: [
    'Preencha o QRA com o mesmo usado em serviço.',
    'A patente deve corresponder ao posto ou graduação efetivamente ocupado.',
    'A unidade é a sua lotação no momento da inscrição.',
    'A carga horária informada será considerada na escala do curso.',
    'Informe quem autorizou a sua inscrição (comando imediato).',
    'Exige-se no mínimo 3 anos de serviço efetivo e aptidão física comprovada.',
  ],
  rodape: 'Boa sorte, policial!\n\nComando do BPRONE — Polícia Militar do Paraná',
  campos: [
    {
      id: 'identificacao',
      numero: 0,
      titulo: 'Identificação',
      tipo: 'identificacao',
      obrigatorio: true,
      ajuda: 'Nome, idade e ID',
    },
    {
      id: 'qra',
      numero: 1,
      titulo: 'QRA',
      tipo: 'texto',
      obrigatorio: true,
      minimoCaracteres: 2,
      placeholder: 'Ex.: CB Silva',
      ajuda: 'Nome de guerra / indicativo usado em serviço.',
    },
    {
      id: 'patente',
      numero: 2,
      titulo: 'Patente',
      tipo: 'opcoes',
      obrigatorio: true,
      opcoes: ['Soldado', 'Cabo', '3º Sargento', '2º Sargento', '1º Sargento', 'Subtenente', '2º Tenente', '1º Tenente', 'Capitão'],
      ajuda: 'Posto ou graduação.',
    },
    {
      id: 'unidade',
      numero: 3,
      titulo: 'Unidade',
      tipo: 'texto',
      obrigatorio: true,
      minimoCaracteres: 3,
      placeholder: 'Ex.: 13º BPM — Fronteira Sul',
      ajuda: 'Unidade onde está lotado.',
    },
    {
      id: 'cargaHoraria',
      numero: 4,
      titulo: 'Carga horária',
      tipo: 'opcoes-outro',
      obrigatorio: true,
      opcoes: ['8 horas semanais', '12 horas semanais', '20 horas semanais', '24 horas semanais', '40 horas semanais'],
      permiteOutro: true,
      ajuda: 'Quanto tempo por semana você tem disponível.',
    },
    {
      id: 'tempoServico',
      numero: 5,
      titulo: 'Tempo de serviço',
      tipo: 'opcoes',
      obrigatorio: true,
      opcoes: ['Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', '5 a 10 anos', 'Mais de 10 anos'],
      ajuda: 'Tempo de serviço efetivo na corporação.',
    },
    {
      id: 'autorizacao',
      numero: 6,
      titulo: 'Quem autorizou',
      tipo: 'texto',
      obrigatorio: true,
      minimoCaracteres: 3,
      placeholder: 'Ex.: Cap. Oliveira — Cmt do 13º BPM',
      ajuda: 'Nome e função de quem autorizou a inscrição.',
    },
  ],
};

/** Formulários das unidades especializadas, indexados pelo id do formulário. */
export const FORMULARIOS_UNIDADE: Record<string, FormularioRecrutamento> = {
  [FORMULARIO_ROTAM.id]: FORMULARIO_ROTAM,
  [FORMULARIO_RONE.id]: FORMULARIO_RONE,
};
