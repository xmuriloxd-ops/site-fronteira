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
];

export const getEdital = (id: string) => EDITAIS.find((e) => e.id === id);
