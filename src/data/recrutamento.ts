import type { FormularioRecrutamento } from '../types';

/**
 * Edital de recrutamento em formato de formulário.
 *
 * Este é o documento "Fronteira Sul — Novembro de 2026": as respostas enviadas
 * pelo candidato ficam no próprio portal e aparecem na aba do comando.
 */
export const FORMULARIO_RECRUTAMENTO: FormularioRecrutamento = {
  id: 'fronteira-sul-nov-2026',
  titulo: 'EDITAL - PMPR - 13º BATALHÃO | NOV/2026',
  subtitulo: 'PROCESSO SELETIVO — RECRUTAMENTO NOVEMBRO 2026 - Fronteira Sul',
  batalhao: '13º Batalhão de Polícia Militar — Fronteira Sul',
  referencia: 'RP',
  introducao:
    'Este formulário tem como objetivo avaliar os conhecimentos, a postura, o raciocínio e a capacidade de interpretação dos candidatos interessados em ingressar na Polícia Militar do Paraná - Fronteira Sul - RP.',
  orientacoes: [
    'Responda todas as questões com atenção, clareza e seriedade.',
    'Utilize suas próprias palavras e demonstre seus conhecimentos.',
    'As respostas serão avaliadas considerando conhecimento, coerência, disciplina e compreensão das regras de Roleplay.',
    'O preenchimento do formulário não garante a aprovação ou o ingresso na corporação.',
    'Os candidatos selecionados poderão ser convocados para as próximas etapas do recrutamento.',
    'Hierarquia, disciplina, respeito e comprometimento são princípios fundamentais da nossa corporação.',
  ],
  rodape: 'Boa sorte, candidato!\n\nComando da Polícia Militar do Paraná',
  campos: [
    {
      id: 'identificacao',
      numero: 0,
      titulo: 'Nome (dentro da cidade), idade (fora do RP) e ID (dentro do RP)',
      tipo: 'identificacao',
      obrigatorio: true,
      ajuda: 'Nome (dentro da cidade), idade (fora do RP) e ID (dentro do RP)',
    },
    {
      id: 'q1',
      numero: 1,
      titulo: 'Qual a sua disponibilidade? Dias e horários.',
      tipo: 'texto-longo',
      obrigatorio: true,
      minimoCaracteres: 20,
      placeholder: 'Ex.: Segunda a sexta, das 19h às 23h; sábado e domingo à tarde.',
    },
    {
      id: 'q2',
      numero: 2,
      titulo:
        'Qual é a função do P1, P2, P3 e P4 durante o patrulhamento e durante uma abordagem em uma viatura na PMPR?',
      tipo: 'texto-longo',
      obrigatorio: true,
      minimoCaracteres: 60,
      ajuda: 'Descreva a posição e a responsabilidade de cada um na guarnição.',
    },
    {
      id: 'q3',
      numero: 3,
      titulo: 'Qual é a importância da modulação correta do rádio durante uma ocorrência?',
      tipo: 'texto-longo',
      obrigatorio: true,
      minimoCaracteres: 40,
    },
    {
      id: 'q4',
      numero: 4,
      titulo: 'Em que momento você realiza uma abordagem?',
      tipo: 'texto-longo',
      obrigatorio: true,
      minimoCaracteres: 40,
    },
    {
      id: 'q5',
      numero: 5,
      titulo:
        'O que significam os códigos Q mais utilizados na comunicação policial? Cite pelo menos três exemplos.',
      tipo: 'texto-longo',
      obrigatorio: true,
      minimoCaracteres: 30,
      ajuda: 'Exemplo de formato: QTA — ...; QSL — ...; QRV — ...',
    },
    {
      id: 'q6',
      numero: 6,
      titulo:
        'Na sua opinião, o que diferencia um bom policial de RP de um jogador que busca apenas perseguições e confrontos?',
      tipo: 'texto-longo',
      obrigatorio: true,
      minimoCaracteres: 60,
    },
    {
      id: 'redacao',
      numero: 7,
      titulo:
        'Faça uma redação de pelo menos 8 linhas sobre você e o porquê de fazer parte da Polícia Militar do Paraná.',
      tipo: 'texto-longo',
      obrigatorio: true,
      minimoCaracteres: 400,
      ajuda: 'Mínimo de 8 linhas — cerca de 400 caracteres.',
    },
    {
      id: 'escala',
      numero: 8,
      titulo: 'Você está de acordo em fazer a escala 5x2 de pelo menos 4 horas no batalhão?',
      tipo: 'opcoes-outro',
      obrigatorio: true,
      opcoes: ['SIM'],
      permiteOutro: true,
    },
    {
      id: 'ausencias',
      numero: 9,
      titulo: 'Você está de acordo em manter o seu comando informado sobre ausências?',
      tipo: 'opcoes',
      obrigatorio: true,
      opcoes: ['Sim', 'Não', 'Talvez'],
    },
  ],
};

export const TOTAL_OBRIGATORIAS = FORMULARIO_RECRUTAMENTO.campos.filter((c) => c.obrigatorio).length;
