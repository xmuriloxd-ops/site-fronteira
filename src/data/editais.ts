import type { Edital } from '../types';

/**
 * Conteúdo dos editais.
 *
 * Os dados do edital de Soldado PMPR (vagas, remuneração, banca, estrutura da
 * prova e índices do TAF) tomam por base a última edição publicada (Edital
 * 01/2025 – IBFC). Os editais de ROTAM e RONE seguem o modelo de seleção
 * interna adotado pela corporação para ingresso em tropas especializadas.
 *
 * Este portal é um projeto demonstrativo e não substitui as publicações
 * oficiais da Polícia Militar do Paraná.
 */

export const EDITAIS: Edital[] = [
  {
    id: 'pmpr-soldado',
    sigla: 'PMPR',
    nome: 'Soldado Policial Militar',
    unidade: 'Polícia Militar do Paraná',
    tom: 'pmpr',
    status: 'aberto',
    chamada: 'A porta de entrada da corporação',
    resumo:
      'Concurso público para o cargo de Soldado PM, com formação na Escola de Formação e Aperfeiçoamento de Praças. Aprovação garante ingresso na carreira militar estadual, com estabilidade, plano de carreira e atuação em todos os 399 municípios do Paraná.',
    vagas: 2000,
    vagasDetalhe: '2.000 vagas imediatas + cadastro de reserva',
    publico: 'Ampla concorrência e reserva para afrodescendentes',
    remuneracao:
      'R$ 2.530,12 (aluno-soldado) → R$ 3.795,18 (2ª classe) → R$ 6.101,87 (soldado de 1ª classe)',
    remuneracaoCurta: 'Até R$ 6.101,87',
    taxa: 'R$ 130,00',
    inscricoes: '12/10/2026 a 16/11/2026',
    prova: '13/12/2026',
    banca: 'IBFC',
    escolaridade: 'Ensino superior completo',
    idade: 'Até 30 anos no ato da inscrição',
    local:
      'Provas em Curitiba, Cascavel, Campo Mourão, Foz do Iguaçu, Guarapuava, Jacarezinho, Londrina, Maringá, Paranaguá, Pato Branco, Ponta Grossa e Umuarama',
    destaque: [
      '2.000 vagas imediatas',
      'Nível superior · CNH B',
      'Subsídio final de R$ 6.101,87',
    ],
    requisitos: [
      {
        titulo: 'Escolaridade',
        detalhe:
          'Ensino superior completo em qualquer área, reconhecido pelo MEC, na data da posse.',
      },
      {
        titulo: 'Idade',
        detalhe:
          'Ter no máximo 30 anos de idade no ato da inscrição — não ter completado 31 anos no primeiro dia de inscrições.',
      },
      {
        titulo: 'Carteira de habilitação',
        detalhe: 'CNH no mínimo categoria B, válida e sem suspensão.',
      },
      {
        titulo: 'Situação militar',
        detalhe:
          'Estar quite com as obrigações militares (para candidatos do sexo masculino) e eleitorais.',
      },
      {
        titulo: 'Aptidão física e sanitária',
        detalhe:
          'Ser aprovado no Exame de Capacidade Física (ECAFI), na avaliação psicológica e no exame de sanidade física.',
      },
      {
        titulo: 'Idoneidade',
        detalhe:
          'Não possuir antecedentes criminais incompatíveis com a função e ser aprovado na investigação social.',
      },
    ],
    etapas: [
      {
        ordem: 1,
        nome: 'Prova objetiva e discursiva',
        descricao:
          '60 questões objetivas de conhecimentos gerais e específicos, mais uma redação de até 30 linhas. Duração de 5 horas.',
        carater: 'Eliminatório e classificatório',
      },
      {
        ordem: 2,
        nome: 'Exame de Capacidade Física (ECAFI)',
        descricao:
          'Barra fixa, abdominal, corrida de 300 m e corrida de 2.400 m, com índices distintos por sexo.',
        carater: 'Eliminatório',
      },
      {
        ordem: 3,
        nome: 'Avaliação psicológica',
        descricao:
          'Aplicação de testes psicométricos e entrevista, com foco no perfil psicológico exigido para o serviço policial militar.',
        carater: 'Eliminatório',
      },
      {
        ordem: 4,
        nome: 'Exame de sanidade física',
        descricao:
          'Avaliação médica e odontológica para comprovar aptidão física e sanitária.',
        carater: 'Eliminatório',
      },
      {
        ordem: 5,
        nome: 'Investigação social',
        descricao:
          'Análise da conduta social e da vida pregressa do candidato, com apresentação de documentos.',
        carater: 'Eliminatório',
      },
      {
        ordem: 6,
        nome: 'Curso de Formação de Soldados (CFS)',
        descricao:
          'Curso de formação profissional em regime de internato, com duração aproximada de 12 meses na Escola Guatupê.',
        carater: 'Eliminatório e classificatório',
      },
    ],
    materias: [
      {
        titulo: 'Língua Portuguesa',
        topicos: [
          'Compreensão e interpretação de textos de diferentes gêneros',
          'Coesão, coerência e recursos argumentativos',
          'Ortografia, acentuação e pontuação',
          'Classes de palavras e emprego de pronomes',
          'Sintaxe do período: concordância, regência e crase',
          'Figuras de linguagem e efeitos de sentido',
          'Variedades linguísticas e adequação da linguagem',
        ],
      },
      {
        titulo: 'Raciocínio Matemático',
        topicos: [
          'Operações com números reais e porcentagem',
          'Razão, proporção, regra de três e escalas',
          'Equações, sistemas e problemas de contagem',
          'Média, mediana, moda e leitura de gráficos',
          'Área, volume e capacidade',
          'Conjuntos e diagramas de Venn',
          'Raciocínio lógico: proposições, conectivos e equivalência',
        ],
      },
      {
        titulo: 'Noções de Informática',
        topicos: [
          'Sistemas operacionais e gestão de arquivos',
          'Editores de texto, planilhas e apresentações',
          'Internet, navegadores e correio eletrônico',
          'Segurança da informação, malwares e phishing',
          'Computação em nuvem e backup',
          'Noções de redes e conectividade',
        ],
      },
      {
        titulo: 'História',
        topicos: [
          'Brasil Colônia, Império e República',
          'Era Vargas e o Estado Novo',
          'Regime militar e redemocratização',
          'História do Paraná: tropeirismo, erva-mate e ciclos econômicos',
          'Formação territorial e movimentos sociais paranaenses',
        ],
      },
      {
        titulo: 'Geografia',
        topicos: [
          'Geografia física e política do Brasil',
          'Relevo, clima, hidrografia e biomas',
          'População, urbanização e migrações',
          'Geografia do Paraná: regiões, economia e floresta com araucária',
          'Globalização, blocos econômicos e Mercosul',
          'Cartografia e escalas',
        ],
      },
      {
        titulo: 'Noções de Direito',
        topicos: [
          'Direito Constitucional: direitos e garantias fundamentais',
          'Segurança pública no artigo 144 da Constituição Federal',
          'Direito Penal: crime, tipicidade, ilicitude e culpabilidade',
          'Direito Processual Penal: inquérito policial e prisões',
          'Direitos Humanos e Convenção Americana de 1969',
        ],
      },
      {
        titulo: 'Legislação',
        topicos: [
          'Lei nº 8.072/1990 — Crimes hediondos',
          'Lei nº 9.455/1997 — Tortura',
          'Lei nº 10.826/2003 — Estatuto do Desarmamento',
          'Lei nº 11.340/2006 — Lei Maria da Penha',
          'Lei nº 8.069/1990 — Estatuto da Criança e do Adolescente',
          'Lei nº 12.288/2010 — Estatuto da Igualdade Racial',
          'Lei Federal nº 14.751/2023 — Lei Orgânica Nacional das Polícias Militares',
          'Lei Estadual nº 1.943/1954 — Código da Polícia Militar do Paraná',
        ],
      },
    ],
    cronograma: [
      { etapa: 'Publicação do edital', periodo: '02/10/2026' },
      { etapa: 'Inscrições', periodo: '12/10/2026 a 16/11/2026' },
      { etapa: 'Último dia para pagamento da taxa', periodo: '17/11/2026' },
      { etapa: 'Ensaio da prova discursiva', periodo: '13/12/2026', observacao: 'Etapa opcional e não eliminatória' },
      { etapa: 'Prova objetiva e discursiva', periodo: '13/12/2026' },
      { etapa: 'Gabarito preliminar', periodo: '14/12/2026' },
      { etapa: 'Exame de capacidade física', periodo: 'Fevereiro de 2027' },
      { etapa: 'Avaliação psicológica', periodo: 'Março de 2027' },
      { etapa: 'Investigação social', periodo: 'Abril de 2027' },
      { etapa: 'Curso de formação', periodo: '2º semestre de 2027' },
    ],
    observacoes: [
      'A prova objetiva tem 60 questões: 40 de conhecimentos gerais e 20 de conhecimentos específicos.',
      'É eliminado o candidato que não atingir 12 pontos em conhecimentos gerais, 12 em específicos e 32 no total.',
      'A auxílio-alimentação é de R$ 834,74, somado ao subsídio.',
      'Quantitativos e valores seguem como referência a última edição publicada.',
    ],
  },
  {
    id: 'rotam',
    sigla: 'ROTAM',
    nome: 'Rondas Ostensivas Tático Móveis',
    unidade: 'Pelotões ROTAM dos Batalhões de Área',
    tom: 'rotam',
    status: 'aberto',
    chamada: 'Patrulhamento tático motorizado',
    resumo:
      'Seleção interna para o curso operacional de ROTAM do Paraná. A tropa atua no patrulhamento tático motorizado, no 2º e 3º esforço, dando suporte às guarnições de radiopatrulha em ocorrências de alto risco, bloqueios, controle de distúrbios e operações de presença.',
    vagas: 96,
    vagasDetalhe: '96 vagas distribuídas entre 4 batalhões de área',
    publico: 'Praças e oficiais do quadro de policiais militares do Paraná',
    remuneracao:
      'Subsídio do posto ou graduação acrescido do adicional de atividade especializada previsto na legislação estadual',
    remuneracaoCurta: 'Adicional de especializada',
    taxa: 'Gratuita — seleção interna',
    inscricoes: '18/11/2026 a 18/12/2026',
    prova: '24/01/2027',
    banca: 'Comissão de Seleção da Unidade',
    escolaridade: 'Curso de formação de praças ou de oficiais concluído',
    idade: 'Sem limite de idade, respeitados os requisitos de saúde',
    local: 'Sede dos batalhões participantes: Curitiba, Londrina, Maringá e Cascavel',
    destaque: [
      '96 vagas internas',
      'Curso operacional de 8 semanas',
      'Adicional de atividade especializada',
    ],
    requisitos: [
      {
        titulo: 'Tempo de serviço',
        detalhe:
          'Mínimo de 2 anos de efetivo serviço na PMPR, contados até a data do encerramento das inscrições.',
      },
      {
        titulo: 'Situação funcional',
        detalhe:
          'Estar no efetivo exercício, sem punição disciplinar nos últimos 12 meses e sem processo administrativo em curso.',
      },
      {
        titulo: 'Aptidão física',
        detalhe:
          'Aprovação no teste de aptidão física específico, com índices superiores aos exigidos no ingresso da corporação.',
      },
      {
        titulo: 'Aptidão técnica',
        detalhe:
          'Aprovação no teste de tiro, na avaliação de tática policial e no curso de capacitação técnica.',
      },
      {
        titulo: 'Disponibilidade',
        detalhe:
          'Disponibilidade para escalas diurnas e noturnas, operações especiais e afastamento da sede por até 30 dias.',
      },
      {
        titulo: 'Conduta',
        detalhe:
          'Conceito disciplinar favorável e parecer da cadeia de comando da unidade de origem.',
      },
    ],
    etapas: [
      {
        ordem: 1,
        nome: 'Inscrição e análise documental',
        descricao:
          'Envio da ficha de inscrição e dos documentos funcionais à comissão de seleção da unidade.',
        carater: 'Eliminatório',
      },
      {
        ordem: 2,
        nome: 'Prova objetiva',
        descricao:
          '40 questões sobre legislação institucional, direito penal militar, tática policial, armamento e direitos humanos.',
        carater: 'Eliminatório e classificatório',
      },
      {
        ordem: 3,
        nome: 'Teste de aptidão física (TAF)',
        descricao:
          'Barra fixa, flexão, abdominal, corrida de 2.400 m e prova de velocidade de 100 m.',
        carater: 'Eliminatório',
      },
      {
        ordem: 4,
        nome: 'Teste de tiro e avaliação tática',
        descricao:
          'Prova prática de tiro com pistola e fuzil, abordagem de veículos e edificações e avaliação de tomada de decisão.',
        carater: 'Eliminatório e classificatório',
      },
      {
        ordem: 5,
        nome: 'Curso operacional de ROTAM',
        descricao:
          'Oito semanas de instrução em período integral: patrulhamento tático, abordagens, tiro tático, controle de distúrbios, direção operacional e condicionamento físico.',
        carater: 'Eliminatório e classificatório',
      },
    ],
    materias: [
      {
        titulo: 'Legislação institucional',
        topicos: [
          'Código da Polícia Militar do Paraná — Lei Estadual nº 1.943/1954',
          'Estatuto dos Militares do Paraná e regime disciplinar',
          'Lei Orgânica Nacional das Polícias Militares — Lei nº 14.751/2023',
          'Uso diferenciado da força e proporcionalidade',
          'Atribuições das unidades especializadas da PMPR',
        ],
      },
      {
        titulo: 'Tática policial',
        topicos: [
          'Patrulhamento tático motorizado',
          'Abordagem de pessoas, veículos e edificações',
          'Progressão, cobertura e comunicação tática',
          'Ocorrências de alto risco e gerenciamento de crise',
          'Operações de bloqueio e cerco',
        ],
      },
      {
        titulo: 'Armamento e tiro',
        topicos: [
          'Funcionamento e manutenção de pistolas e fuzis',
          'Fundamentos do tiro: empunhadura, visada e acionamento',
          'Tiro tático em ambiente urbano',
          'Regras de segurança e conduta no estande',
          'Armas menos letais',
        ],
      },
      {
        titulo: 'Direito aplicado',
        topicos: [
          'Direito Penal Militar: crimes militares em tempo de paz',
          'Direito Processual Penal Militar: inquérito policial militar',
          'Prisões em flagrante e uso de algemas',
          'Direitos humanos e controle externo da atividade policial',
        ],
      },
      {
        titulo: 'Condicionamento físico',
        topicos: [
          'Treinamento de força e resistência',
          'Circuitos funcionais aplicados ao serviço operacional',
          'Prevenção de lesões e saúde do policial militar',
        ],
      },
    ],
    cronograma: [
      { etapa: 'Publicação do edital de seleção', periodo: '10/11/2026' },
      { etapa: 'Inscrições', periodo: '18/11/2026 a 18/12/2026' },
      { etapa: 'Homologação das inscrições', periodo: '05/01/2027' },
      { etapa: 'Prova objetiva', periodo: '24/01/2027' },
      { etapa: 'Teste de aptidão física', periodo: '31/01/2027' },
      { etapa: 'Teste de tiro e avaliação tática', periodo: '07/02/2027' },
      { etapa: 'Início do curso operacional', periodo: '02/03/2027' },
      { etapa: 'Conclusão do curso', periodo: '30/04/2027' },
    ],
    observacoes: [
      'A seleção é interna e gratuita, destinada a policiais militares da ativa.',
      'O candidato aprovado permanece vinculado ao batalhão de origem, atuando no pelotão ROTAM.',
      'O curso operacional exige dedicação integral, incluindo período noturno e fins de semana.',
      'A conclusão do curso é condição obrigatória para a concessão do adicional de atividade especializada.',
    ],
  },
  {
    id: 'rone',
    sigla: 'RONE',
    nome: 'Rondas Ostensivas de Natureza Especial',
    unidade: 'Batalhão de Rondas Ostensivas de Natureza Especial (BPRONE)',
    tom: 'rone',
    status: 'em-breve',
    chamada: 'A tropa de elite do Paraná',
    resumo:
      'Seleção para o Batalhão de Rondas Ostensivas de Natureza Especial, unidade criada em 1992 e transformada em batalhão em 2022. Atua em ocorrências de altíssima complexidade, crime organizado, escoltas, retomada de pontos sensíveis e controle de distúrbios civis.',
    vagas: 45,
    vagasDetalhe: '45 vagas para o curso de operações especiais',
    publico: 'Policiais militares da ativa, preferencialmente com curso de ROTAM ou Choque',
    remuneracao:
      'Subsídio do posto ou graduação acrescido do adicional de atividade especializada e das vantagens previstas em lei',
    remuneracaoCurta: 'Adicional + vantagens',
    taxa: 'Gratuita — seleção interna',
    inscricoes: 'A definir — publicação prevista para dezembro de 2026',
    prova: 'Fevereiro de 2027 (previsão)',
    banca: 'Comissão de Seleção do BPRONE',
    escolaridade: 'Ensino superior e curso de formação de praças ou oficiais',
    idade: 'Máximo de 35 anos na data da inscrição',
    local: 'Curitiba e Região Metropolitana',
    destaque: [
      'RONE Preta · desde 1992',
      '45 vagas para o curso',
      'Atuação em todo o Paraná',
    ],
    requisitos: [
      {
        titulo: 'Tempo de serviço',
        detalhe:
          'Mínimo de 3 anos de efetivo serviço na PMPR, sendo pelo menos 1 ano em unidade operacional.',
      },
      {
        titulo: 'Cursos anteriores',
        detalhe:
          'Ter concluído curso de ROTAM, Choque, COE ou curso de operações especiais equivalente, ou apresentar experiência comprovada em patrulhamento tático.',
      },
      {
        titulo: 'Aptidão física',
        detalhe:
          'Aprovação no teste de aptidão física de nível especial, com índices superiores aos do curso de ROTAM.',
      },
      {
        titulo: 'Aptidão psicológica',
        detalhe:
          'Avaliação psicológica específica para atuação em situações de alto risco e de longa duração.',
      },
      {
        titulo: 'Disponibilidade',
        detalhe:
          'Disponibilidade integral para escalas, operações e afastamentos de até 60 dias, inclusive fora do estado.',
      },
      {
        titulo: 'Conduta',
        detalhe:
          'Conceito disciplinar exemplar, sem punições nos últimos 24 meses, com parecer favorável do comando da unidade.',
      },
    ],
    etapas: [
      {
        ordem: 1,
        nome: 'Inscrição e triagem curricular',
        descricao:
          'Análise da ficha funcional, dos cursos realizados e do parecer do comando da unidade de origem.',
        carater: 'Eliminatório',
      },
      {
        ordem: 2,
        nome: 'Prova objetiva e redação',
        descricao:
          '50 questões de legislação, direito penal militar, direitos humanos e operações especiais, além de uma redação técnica.',
        carater: 'Eliminatório e classificatório',
      },
      {
        ordem: 3,
        nome: 'Teste de aptidão física especial',
        descricao:
          'Barra fixa, flexão, abdominal, corrida de 3.000 m e prova de natação de 100 m.',
        carater: 'Eliminatório',
      },
      {
        ordem: 4,
        nome: 'Avaliação psicológica',
        descricao:
          'Bateria de testes e entrevista com psicólogos da corporação.',
        carater: 'Eliminatório',
      },
      {
        ordem: 5,
        nome: 'Curso de Rondas Ostensivas de Natureza Especial',
        descricao:
          'Dezesseis semanas em regime de internato: tiro de precisão, combate urbano, ações táticas, explosivos, rapel, natação e gerenciamento de crises.',
        carater: 'Eliminatório e classificatório',
      },
    ],
    materias: [
      {
        titulo: 'Legislação e direito militar',
        topicos: [
          'Código Penal Militar e Código de Processo Penal Militar',
          'Código da Polícia Militar do Paraná — Lei Estadual nº 1.943/1954',
          'Lei Orgânica Nacional das Polícias Militares — Lei nº 14.751/2023',
          'Estatuto do Desarmamento e normas sobre armas de uso restrito',
          'Regime disciplinar e corregedoria',
        ],
      },
      {
        titulo: 'Operações especiais',
        topicos: [
          'Gerenciamento de crises e negociação',
          'Invasão e retomada de instalações',
          'Controle de distúrbios civis e uso de equipamentos de choque',
          'Escoltas de dignatários e comboios',
          'Técnicas verticais, rapel e operações aquáticas',
        ],
      },
      {
        titulo: 'Tiro e armamento',
        topicos: [
          'Tiro de precisão com fuzil e espingarda',
          'Tiro instintivo e em movimento',
          'Manutenção e balística',
          'Dispositivos menos letais e granadas',
        ],
      },
      {
        titulo: 'Direitos humanos e cidadania',
        topicos: [
          'Convenção Americana sobre Direitos Humanos',
          'Sistema Interamericano de proteção',
          'Uso diferenciado da força e letalidade policial',
          'Igualdade racial e enfrentamento à discriminação',
        ],
      },
      {
        titulo: 'Saúde e condicionamento',
        topicos: [
          'Avaliação física de alto rendimento',
          'Nutrição e recuperação',
          'Primeiros socorros e atendimento pré-hospitalar tático',
        ],
      },
    ],
    cronograma: [
      { etapa: 'Publicação do edital', periodo: 'Dezembro de 2026 (previsto)' },
      { etapa: 'Inscrições', periodo: 'Janeiro de 2027 (previsto)' },
      { etapa: 'Prova objetiva e redação', periodo: 'Fevereiro de 2027 (previsto)' },
      { etapa: 'Teste de aptidão física especial', periodo: 'Fevereiro de 2027 (previsto)' },
      { etapa: 'Avaliação psicológica', periodo: 'Março de 2027 (previsto)' },
      { etapa: 'Início do curso', periodo: 'Abril de 2027 (previsto)' },
    ],
    observacoes: [
      'A RONE foi criada em 13 de julho de 1992 e transformada em batalhão (BPRONE) em 2022.',
      'A unidade é conhecida como "RONE Preta" pelas viaturas escuras e pela farda operacional.',
      'Este edital está em fase de elaboração; datas e quantitativos podem sofrer alteração.',
      'A seleção é interna e gratuita, destinada a policiais militares da ativa.',
    ],
  },
];

export const getEdital = (id: string) => EDITAIS.find((e) => e.id === id);
