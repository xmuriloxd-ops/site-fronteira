import type { ProvaAnterior, QuestaoSimulado } from '../types';

/**
 * Provas anteriores e materiais de estudo.
 * Os links apontam para repositórios públicos de provas (QConcursos, Estratégia,
 * DSO Concursos e Tec Concursos) e para o portal oficial da PMPR.
 */
export const PROVAS: ProvaAnterior[] = [
  {
    id: 'pmpr-soldado-2025-objetiva',
    orgao: 'PMPR',
    cargo: 'Soldado Policial Militar',
    ano: 2025,
    banca: 'IBFC',
    tipo: 'Prova objetiva',
    url: 'https://arquivos.qconcursos.com/prova/arquivo_prova/134058/ibfc-2025-pm-pr-soldado-da-policia-militar-prova.pdf',
    fonte: 'QConcursos',
    observacao: '60 questões · versão B · inclui a proposta de redação',
  },
  {
    id: 'pmpr-soldado-2025-gabarito',
    orgao: 'PMPR',
    cargo: 'Soldado Policial Militar',
    ano: 2025,
    banca: 'IBFC',
    tipo: 'Gabarito',
    url: 'https://dsoconcursos.com.br/gabarito-pm-pr-extraoficial-confira-aqui-a-correcao-da-prova-de-soldado/',
    fonte: 'DSO Concursos',
    observacao: 'Correção extraoficial comentada, questão por questão',
  },
  {
    id: 'pmpr-soldado-2021-objetiva',
    orgao: 'PMPR',
    cargo: 'Soldado Policial Militar',
    ano: 2021,
    banca: 'UFPR / NC',
    tipo: 'Prova objetiva',
    url: 'https://arquivos.qconcursos.com/prova/arquivo_prova/82040/nc-ufpr-2021-pm-pr-soldado-policia-militar-prova.pdf',
    fonte: 'QConcursos',
    observacao: 'Prova aplicada sob o edital de 2020, com 60 questões',
  },
  {
    id: 'pmpr-cadete-2025',
    orgao: 'PMPR',
    cargo: 'Cadete (CFO)',
    ano: 2025,
    banca: 'IBFC',
    tipo: 'Prova completa',
    url: 'https://www.tecconcursos.com.br/orgaos/pm-pr',
    fonte: 'Tec Concursos',
    observacao: 'Provas de cadete de 2021 a 2025 para download',
  },
  {
    id: 'pmpr-repositorio',
    orgao: 'PMPR',
    cargo: 'Soldado e Cadete',
    ano: 2025,
    banca: 'IBFC / UFPR',
    tipo: 'Prova completa',
    url: 'https://www.qconcursos.com/questoes-militares/concursos/pm-pr-2025-soldado-edital-n-1',
    fonte: 'QConcursos',
    observacao: 'Repositório com provas de 2013 a 2025',
  },
  {
    id: 'pmpr-reta-final',
    orgao: 'PMPR',
    cargo: 'Soldado Policial Militar',
    ano: 2025,
    banca: 'IBFC',
    tipo: 'Prova completa',
    url: 'https://www.estrategiaconcursos.com.br/blog/cadernos-de-reta-final-para-o-concurso-pm-pr-soldado/',
    fonte: 'Estratégia Concursos',
    observacao: 'Cadernos de questões por disciplina do edital',
  },
];

export const PROVAS_POR_EDITAL: Record<string, string[]> = {
  'pmpr-soldado': [
    'pmpr-soldado-2025-objetiva',
    'pmpr-soldado-2025-gabarito',
    'pmpr-soldado-2021-objetiva',
    'pmpr-cadete-2025',
    'pmpr-repositorio',
    'pmpr-reta-final',
  ],
  rotam: ['pmpr-soldado-2025-objetiva', 'pmpr-soldado-2021-objetiva', 'pmpr-repositorio'],
  rone: ['pmpr-soldado-2025-objetiva', 'pmpr-cadete-2025', 'pmpr-repositorio'],
};

export const getProvasDoEdital = (editalId: string): ProvaAnterior[] => {
  const ids = PROVAS_POR_EDITAL[editalId] ?? [];
  return ids
    .map((id) => PROVAS.find((p) => p.id === id))
    .filter((p): p is ProvaAnterior => Boolean(p));
};

/**
 * Simulado autoral, escrito no formato da prova objetiva da PMPR
 * (5 alternativas, uma correta), a partir dos tópicos do edital.
 */
export const QUESTOES_SIMULADO: QuestaoSimulado[] = [
  {
    id: 'q1',
    disciplina: 'Língua Portuguesa',
    enunciado:
      'Assinale a alternativa em que o emprego da vírgula está de acordo com a norma-padrão da língua portuguesa.',
    alternativas: [
      'O policial militar, que atua na fronteira relatou a ocorrência.',
      'A guarnição chegou ao local, e isolou a área rapidamente.',
      'Os policiais, cansados após a operação, retornaram ao quartel.',
      'Comprou, munição, colete e rádio para a equipe.',
      'O comandante disse, que a operação seria mantida.',
    ],
    correta: 2,
    explicacao:
      'A vírgula isola o adjetivo explicativo intercalado ("cansados após a operação"), que se liga ao sujeito "os policiais". As demais alternativas separam termos que não admitem pausa ou isolam oração adjetiva restritiva indevidamente.',
  },
  {
    id: 'q2',
    disciplina: 'Língua Portuguesa',
    enunciado:
      'No período "A tropa avançou lentamente, embora o terreno fosse hostil", a conjunção destacada introduz ideia de:',
    alternativas: ['conclusão', 'concessão', 'consequência', 'finalidade', 'proporção'],
    correta: 1,
    explicacao:
      '"Embora" é conjunção subordinativa adverbial concessiva: admite uma objeção que não impede a realização do fato principal.',
  },
  {
    id: 'q3',
    disciplina: 'Raciocínio Matemático',
    enunciado:
      'Em uma operação, 260 munições foram distribuídas igualmente entre 13 policiais. Sabendo que 5 policiais já possuíam 12 munições cada um, quantas munições tem, ao todo, um desses 5 policiais após a distribuição?',
    alternativas: ['32', '30', '28', '26', '24'],
    correta: 0,
    explicacao:
      '260 ÷ 13 = 20 munições por policial. Os 5 policiais já tinham 12, então cada um passa a ter 12 + 20 = 32 munições.',
  },
  {
    id: 'q4',
    disciplina: 'Raciocínio Matemático',
    enunciado:
      'Uma viatura percorre 180 km em 2 horas e 30 minutos. Mantendo a mesma velocidade média, quantos quilômetros ela percorre em 1 hora e 20 minutos?',
    alternativas: ['90 km', '96 km', '100 km', '108 km', '120 km'],
    correta: 1,
    explicacao:
      '2h30 = 150 min. 180 km ÷ 150 min = 1,2 km/min. Em 80 min: 1,2 × 80 = 96 km.',
  },
  {
    id: 'q5',
    disciplina: 'Raciocínio Matemático',
    enunciado:
      'Em um batalhão com 320 policiais, 65% possuem curso de tiro tático. Desses, 25% também possuem curso de operações especiais. Quantos policiais possuem os dois cursos?',
    alternativas: ['40', '48', '52', '60', '80'],
    correta: 2,
    explicacao: '65% de 320 = 208. 25% de 208 = 52 policiais.',
  },
  {
    id: 'q6',
    disciplina: 'Noções de Informática',
    enunciado:
      'Um policial recebe um e-mail que imita a comunicação interna da corporação e pede login e senha para "atualizar o cadastro". A prática descrita é conhecida como:',
    alternativas: [
      'ransomware',
      'phishing',
      'spyware',
      'rootkit',
      'adware',
    ],
    correta: 1,
    explicacao:
      'Phishing é a tentativa de obter dados sensíveis por meio de mensagens que se passam por pessoas ou instituições confiáveis.',
  },
  {
    id: 'q7',
    disciplina: 'Noções de Informática',
    enunciado:
      'Sobre segurança da informação, a propriedade que garante que o dado não foi alterado durante o armazenamento ou a transmissão é a:',
    alternativas: ['disponibilidade', 'confidencialidade', 'integridade', 'autenticidade', 'legalidade'],
    correta: 2,
    explicacao:
      'Integridade assegura que a informação permanece completa e sem alterações não autorizadas.',
  },
  {
    id: 'q8',
    disciplina: 'História',
    enunciado:
      'Sobre a formação econômica do Paraná, a atividade que impulsionou a ocupação dos Campos Gerais e o surgimento de cidades como Ponta Grossa foi:',
    alternativas: [
      'a cafeicultura no Vale do Paraíba',
      'o tropeirismo e a criação de gado',
      'a extração de borracha',
      'a mineração de ouro no litoral',
      'a indústria têxtil',
    ],
    correta: 1,
    explicacao:
      'O tropeirismo, ligado ao transporte de gado entre Rio Grande do Sul e São Paulo, foi central na ocupação dos Campos Gerais paranaenses.',
  },
  {
    id: 'q9',
    disciplina: 'Geografia',
    enunciado:
      'A floresta com araucária, presente originalmente no Sul e Sudoeste do Paraná, foi intensamente explorada em razão:',
    alternativas: [
      'do valor da madeira e da expansão agrícola',
      'do uso medicinal de sua resina',
      'da necessidade de abrir minas de carvão',
      'da produção de borracha natural',
      'da criação de reservas indígenas',
    ],
    correta: 0,
    explicacao:
      'A araucária foi explorada pela madeira e depois substituída por lavouras, o que reduziu drasticamente a cobertura original.',
  },
  {
    id: 'q10',
    disciplina: 'Direito Constitucional',
    enunciado:
      'A Constituição Federal de 1988 define que a segurança pública é dever do Estado, direito e responsabilidade de todos. De acordo com o artigo 144, a polícia militar destina-se a:',
    alternativas: [
      'exercer as funções de polícia judiciária da União',
      'realizar exclusivamente o patrulhamento de trânsito',
      'o policiamento ostensivo e a preservação da ordem pública',
      'executar a vigilância dos presídios estaduais',
      'apurar infrações penais contra a administração pública',
    ],
    correta: 2,
    explicacao:
      'O artigo 144, § 5º, atribui à polícia militar a polícia ostensiva e a preservação da ordem pública, além das demais atribuições previstas em lei.',
  },
  {
    id: 'q11',
    disciplina: 'Direito Penal',
    enunciado:
      'Sobre o crime de tortura (Lei nº 9.455/1997), assinale a alternativa correta:',
    alternativas: [
      'O crime de tortura admite fiança e é afiançável em qualquer hipótese.',
      'A lei prevê causa de aumento quando o crime é cometido por agente público.',
      'A tortura é considerada crime comum, sem previsão de hediondez.',
      'A confissão obtida mediante tortura é válida se confirmada em juízo.',
      'O crime de tortura não se aplica a agentes públicos.',
    ],
    correta: 1,
    explicacao:
      'A Lei nº 9.455/1997 prevê causa de aumento de pena quando o crime é cometido por agente público (art. 1º, § 4º, II), entre outras hipóteses.',
  },
  {
    id: 'q12',
    disciplina: 'Legislação Institucional',
    enunciado:
      'Sobre a Lei Federal nº 14.751/2023, que institui a Lei Orgânica Nacional das Polícias Militares e dos Corpos de Bombeiros Militares, é correto afirmar:',
    alternativas: [
      'Determina que os policiais militares sejam regidos exclusivamente pela CLT.',
      'Cria a Polícia Penal estadual como órgão da polícia militar.',
      'Estabelece normas gerais de organização, efetivo, carreira e regime disciplinar das corporações.',
      'Suprime a competência das assembleias legislativas sobre os efetivos.',
      'Extingue a hierarquia militar nas corporações estaduais.',
    ],
    correta: 2,
    explicacao:
      'A lei fixa normas gerais nacionais para a organização das polícias militares e corpos de bombeiros militares dos estados e do Distrito Federal.',
  },
];
