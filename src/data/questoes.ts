import type { QuestaoSimulado } from '../types';

/**
 * Banco de questões do portal.
 *
 * Todas as questões são autorais, escritas a partir do conteúdo programático
 * dos editais publicados neste site. Nenhuma questão é copiada de terceiros e
 * não há links externos: o treino acontece inteiramente dentro do portal.
 */

export interface MateriaBanco {
  id: string;
  nome: string;
  questoes: QuestaoSimulado[];
}

/** Número de questões por disciplina no edital de Soldado (total: 60). */
export const DISTRIBUICAO_PROVA: { disciplina: string; quantidade: number; pontos: number }[] = [
  { disciplina: 'Língua Portuguesa', quantidade: 12, pontos: 1 },
  { disciplina: 'Raciocínio Matemático', quantidade: 7, pontos: 1 },
  { disciplina: 'Noções de Informática', quantidade: 6, pontos: 1 },
  { disciplina: 'História', quantidade: 6, pontos: 1 },
  { disciplina: 'Geografia', quantidade: 6, pontos: 1 },
  { disciplina: 'Noções de Direito', quantidade: 9, pontos: 2 },
  { disciplina: 'Legislação', quantidade: 14, pontos: 2 },
];

export const BANCO_QUESTOES: MateriaBanco[] = [
  {
    id: 'portugues',
    nome: 'Língua Portuguesa',
    questoes: [
      {
        id: 'pt1',
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
          'A vírgula isola o adjetivo explicativo intercalado ("cansados após a operação"), ligado ao sujeito "os policiais". As demais alternativas separam termos que não admitem pausa ou isolam oração adjetiva restritiva indevidamente.',
      },
      {
        id: 'pt2',
        disciplina: 'Língua Portuguesa',
        enunciado:
          'No período "A tropa avançou lentamente, embora o terreno fosse hostil", a conjunção destacada introduz ideia de:',
        alternativas: ['conclusão', 'concessão', 'consequência', 'finalidade', 'proporção'],
        correta: 1,
        explicacao:
          '"Embora" é conjunção subordinativa adverbial concessiva: admite uma objeção que não impede a realização do fato principal.',
      },
      {
        id: 'pt3',
        disciplina: 'Língua Portuguesa',
        enunciado:
          'Assinale a alternativa em que todas as palavras estão corretamente acentuadas segundo o Acordo Ortográfico vigente.',
        alternativas: [
          'herói, baú, você, ônibus',
          'heroi, baú, voce, onibus',
          'herói, bau, você, onibus',
          'heroi, bau, voce, ônibus',
          'herói, baú, voce, ônibus',
        ],
        correta: 0,
        explicacao:
          'São acentuadas as oxítonas terminadas em ditongo aberto (herói), as vogais tônicas i e u que formam hiato com a anterior (baú), as oxítonas terminadas em "e" (você) e as proparoxítonas (ônibus).',
      },
      {
        id: 'pt4',
        disciplina: 'Língua Portuguesa',
        enunciado:
          'Em "Faz cinco anos que o cabo ingressou na corporação", o verbo "fazer" está empregado como:',
        alternativas: [
          'verbo pessoal, concordando com "cinco anos"',
          'verbo impessoal, indicando tempo decorrido',
          'verbo transitivo direto com objeto "cinco anos"',
          'verbo de ligação',
          'verbo pronominal',
        ],
        correta: 1,
        explicacao:
          'O verbo "fazer" indicando tempo decorrido é impessoal: permanece na terceira pessoa do singular e não admite sujeito.',
      },
      {
        id: 'pt5',
        disciplina: 'Língua Portuguesa',
        enunciado:
          'Assinale a alternativa que completa corretamente as lacunas: "O comandante ___ tropa, encaminhou o relatório ___ corregedoria, ___ fim de formalizar a ocorrência."',
        alternativas: [
          'à / a / afim',
          'a / à / a fim',
          'à / à / a fim',
          'a / a / afim',
          'à / a / a fim',
        ],
        correta: 4,
        explicacao:
          '"Encaminhou a tropa" não leva crase (verbo transitivo direto). "Encaminhou à corregedoria" exige a preposição a mais o artigo. "A fim de" indica finalidade e é escrito separado.',
      },
      {
        id: 'pt6',
        disciplina: 'Língua Portuguesa',
        enunciado:
          'No trecho "O soldado cujo currículo foi elogiado assumiu o comando", o pronome "cujo" expressa ideia de:',
        alternativas: ['lugar', 'posse', 'tempo', 'modo', 'dúvida'],
        correta: 1,
        explicacao:
          '"Cujo" é pronome relativo que expressa posse, ligando dois substantivos sem admitir artigo entre eles.',
      },
      {
        id: 'pt7',
        disciplina: 'Língua Portuguesa',
        enunciado:
          'Assinale a alternativa em que a concordância verbal está correta.',
        alternativas: [
          'Haviam muitos policiais no local.',
          'Fazem dois anos que ele se formou.',
          'Existe muitas ocorrências registradas hoje.',
          'Havia muitas viaturas na avenida.',
          'Aconteceu vários furtos no bairro.',
        ],
        correta: 3,
        explicacao:
          '"Haver" no sentido de existir é impessoal e fica na terceira pessoa do singular ("havia muitas viaturas"). O mesmo vale para "fazer" indicando tempo. "Existir" e "acontecer" concordam com o sujeito.',
      },
      {
        id: 'pt8',
        disciplina: 'Língua Portuguesa',
        enunciado:
          'A figura de linguagem presente em "A farda é a segunda pele do policial" é:',
        alternativas: ['metáfora', 'metonímia', 'hipérbole', 'eufemismo', 'antítese'],
        correta: 0,
        explicacao:
          'Trata-se de metáfora: comparação implícita entre a farda e uma segunda pele, sem termo comparativo expresso.',
      },
    ],
  },
  {
    id: 'matematica',
    nome: 'Raciocínio Matemático',
    questoes: [
      {
        id: 'mt1',
        disciplina: 'Raciocínio Matemático',
        enunciado:
          'Em uma operação, 260 munições foram distribuídas igualmente entre 13 policiais. Sabendo que 5 desses policiais já possuíam 12 munições cada um, quantas munições tem, ao todo, um desses 5 policiais após a distribuição?',
        alternativas: ['32', '30', '28', '26', '24'],
        correta: 0,
        explicacao: '260 ÷ 13 = 20 munições por policial. Os 5 policiais já tinham 12, então cada um passa a ter 12 + 20 = 32 munições.',
      },
      {
        id: 'mt2',
        disciplina: 'Raciocínio Matemático',
        enunciado:
          'Uma viatura percorre 180 km em 2 horas e 30 minutos. Mantendo a mesma velocidade média, quantos quilômetros ela percorre em 1 hora e 20 minutos?',
        alternativas: ['90 km', '96 km', '100 km', '108 km', '120 km'],
        correta: 1,
        explicacao: '2h30 = 150 min. 180 km ÷ 150 min = 1,2 km/min. Em 80 min: 1,2 × 80 = 96 km.',
      },
      {
        id: 'mt3',
        disciplina: 'Raciocínio Matemático',
        enunciado:
          'Em um batalhão com 320 policiais, 65% possuem curso de tiro tático. Desses, 25% também possuem curso de operações especiais. Quantos policiais possuem os dois cursos?',
        alternativas: ['40', '48', '52', '60', '80'],
        correta: 2,
        explicacao: '65% de 320 = 208. 25% de 208 = 52 policiais.',
      },
      {
        id: 'mt4',
        disciplina: 'Raciocínio Matemático',
        enunciado:
          'Um tanque em forma de paralelepípedo tem 2 m de comprimento, 1,5 m de largura e 1 m de altura. Qual é a capacidade total desse tanque, em litros?',
        alternativas: ['1.500 L', '2.000 L', '2.500 L', '3.000 L', '3.500 L'],
        correta: 3,
        explicacao: 'Volume = 2 × 1,5 × 1 = 3 m³. Como 1 m³ = 1.000 L, a capacidade é de 3.000 litros.',
      },
      {
        id: 'mt5',
        disciplina: 'Raciocínio Matemático',
        enunciado:
          'Em um grupo de 50 policiais, 30 fizeram o curso de ROTAM, 20 fizeram o curso de RONE e 8 fizeram os dois cursos. Quantos não fizeram nenhum dos dois cursos?',
        alternativas: ['8', '10', '12', '14', '16'],
        correta: 0,
        explicacao: 'Pelo princípio da inclusão-exclusão: 30 + 20 − 8 = 42 fizeram ao menos um curso. 50 − 42 = 8 não fizeram nenhum.',
      },
      {
        id: 'mt6',
        disciplina: 'Raciocínio Matemático',
        enunciado:
          'A proposição "Todos os policiais do pelotão são habilitados em tiro" é negada por:',
        alternativas: [
          'Nenhum policial do pelotão é habilitado em tiro',
          'Alguns policiais do pelotão não são habilitados em tiro',
          'Todos os policiais do pelotão não são habilitados em tiro',
          'Alguns policiais do pelotão são habilitados em tiro',
          'Nenhum policial habilitado em tiro está no pelotão',
        ],
        correta: 1,
        explicacao:
          'A negação de "todo A é B" é "algum A não é B". Basta um único contraexemplo para refutar a proposição universal.',
      },
      {
        id: 'mt7',
        disciplina: 'Raciocínio Matemático',
        enunciado:
          'O preço de um equipamento de proteção era R$ 400,00 e sofreu um aumento de 15%. Semanas depois, o novo valor recebeu um desconto de 10%. Qual é o valor final?',
        alternativas: ['R$ 410,00', 'R$ 414,00', 'R$ 420,00', 'R$ 424,00', 'R$ 430,00'],
        correta: 1,
        explicacao: '400 × 1,15 = 460. Depois, 460 × 0,90 = 414.',
      },
    ],
  },
  {
    id: 'informatica',
    nome: 'Noções de Informática',
    questoes: [
      {
        id: 'inf1',
        disciplina: 'Noções de Informática',
        enunciado:
          'Um policial recebe um e-mail que imita a comunicação interna da corporação e pede login e senha para "atualizar o cadastro". A prática descrita é conhecida como:',
        alternativas: ['ransomware', 'phishing', 'spyware', 'rootkit', 'adware'],
        correta: 1,
        explicacao:
          'Phishing é a tentativa de obter dados sensíveis por meio de mensagens que se passam por pessoas ou instituições confiáveis.',
      },
      {
        id: 'inf2',
        disciplina: 'Noções de Informática',
        enunciado:
          'Sobre segurança da informação, a propriedade que garante que o dado não foi alterado durante o armazenamento ou a transmissão é a:',
        alternativas: ['disponibilidade', 'confidencialidade', 'integridade', 'autenticidade', 'legalidade'],
        correta: 2,
        explicacao: 'Integridade assegura que a informação permanece completa e sem alterações não autorizadas.',
      },
      {
        id: 'inf3',
        disciplina: 'Noções de Informática',
        enunciado:
          'Qual extensão de arquivo é típica de uma planilha eletrônica criada no LibreOffice Calc?',
        alternativas: ['.ods', '.odt', '.odp', '.docx', '.pdf'],
        correta: 0,
        explicacao:
          '.ods é o formato de planilha do padrão OpenDocument. .odt é texto, .odp é apresentação, .docx é texto do Word e .pdf é formato de documento portátil.',
      },
      {
        id: 'inf4',
        disciplina: 'Noções de Informática',
        enunciado:
          'Um arquivo foi criptografado por um programa malicioso e o criminoso exige pagamento para liberá-lo. Esse tipo de ataque é chamado de:',
        alternativas: ['phishing', 'ransomware', 'keylogger', 'worm', 'spoofing'],
        correta: 1,
        explicacao:
          'Ransomware sequestra os dados por criptografia e exige resgate. A principal defesa é o backup offline e a atualização do sistema.',
      },
      {
        id: 'inf5',
        disciplina: 'Noções de Informática',
        enunciado:
          'No navegador, o recurso que permite manter a mesma sessão autenticada ao visitar outros sites é:',
        alternativas: ['cache', 'cookies', 'histórico', 'favoritos', 'plugins'],
        correta: 1,
        explicacao:
          'Cookies são pequenos arquivos que armazenam informações de sessão, permitindo reconhecer o usuário entre páginas.',
      },
      {
        id: 'inf6',
        disciplina: 'Noções de Informática',
        enunciado:
          'A principal vantagem do backup em nuvem para a administração pública é:',
        alternativas: [
          'garantir que o arquivo nunca será apagado',
          'substituir a necessidade de senha',
          'manter cópia em local distinto do original, reduzindo a perda em caso de falha local',
          'aumentar a velocidade do computador',
          'eliminar a necessidade de antivírus',
        ],
        correta: 2,
        explicacao:
          'O backup externo mantém uma cópia em ambiente diferente do original, protegendo os dados em caso de incêndio, furto ou falha do disco.',
      },
    ],
  },
  {
    id: 'historia',
    nome: 'História',
    questoes: [
      {
        id: 'hs1',
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
          'O tropeirismo, ligado ao transporte de gado entre o Rio Grande do Sul e São Paulo, foi central na ocupação dos Campos Gerais paranaenses.',
      },
      {
        id: 'hs2',
        disciplina: 'História',
        enunciado:
          'A Polícia Militar do Paraná foi criada em 10 de agosto de 1854 com a denominação de:',
        alternativas: [
          'Companhia de Força Policial',
          'Guarda Nacional',
          'Corpo de Bombeiros',
          'Regimento de Segurança',
          'Força Pública',
        ],
        correta: 0,
        explicacao:
          'A corporação nasceu como Companhia de Força Policial da Província do Paraná e recebeu outras denominações ao longo da história até 1946, quando passou a se chamar Polícia Militar.',
      },
      {
        id: 'hs3',
        disciplina: 'História',
        enunciado:
          'A Revolução de 1930, que levou Getúlio Vargas ao poder, caracterizou-se por:',
        alternativas: [
          'deposição da República Velha e fim da política do café com leite',
          'instauração do Estado Novo imediatamente',
          'restauração do império no Brasil',
          'implantação do parlamentarismo',
          'separação da Igreja e do Estado',
        ],
        correta: 0,
        explicacao:
          'A Revolução de 1930 encerrou a chamada República Velha e a alternância entre São Paulo e Minas Gerais na presidência.',
      },
      {
        id: 'hs4',
        disciplina: 'História',
        enunciado:
          'No Paraná, a erva-mate teve papel econômico relevante principalmente:',
        alternativas: [
          'no século XVIII, durante o ciclo do ouro',
          'entre o fim do século XIX e o início do século XX, com a exportação para o Prata',
          'durante o regime militar, para abastecer a indústria automotiva',
          'na década de 1990, com a abertura comercial',
          'no período colonial, com o cultivo do açúcar',
        ],
        correta: 1,
        explicacao:
          'A erva-mate enriqueceu Curitiba e outras cidades paranaenses entre o fim do século XIX e o começo do século XX, com forte exportação para Argentina e Uruguai.',
      },
      {
        id: 'hs5',
        disciplina: 'História',
        enunciado:
          'A Constituição de 1988, conhecida como Constituição Cidadã, ficou marcada pela:',
        alternativas: [
          'restrição dos direitos fundamentais',
          'ampliação dos direitos sociais e garantias individuais',
          'instauração do bipartidarismo',
          'supressão do habeas corpus',
          'criação do Estado Novo',
        ],
        correta: 1,
        explicacao:
          'A Carta de 1988 consolidou a redemocratização, ampliando direitos sociais, garantias individuais e a participação popular.',
      },
      {
        id: 'hs6',
        disciplina: 'História',
        enunciado:
          'A Guerra do Contestado, ocorrida entre 1912 e 1916, envolveu disputa territorial entre:',
        alternativas: [
          'Paraná e Santa Catarina',
          'Paraná e São Paulo',
          'Paraná e Argentina',
          'Brasil e Paraguai',
          'Paraná e Mato Grosso',
        ],
        correta: 0,
        explicacao:
          'O conflito envolveu disputa de terras entre Paraná e Santa Catarina, agravada pela expulsão de posseiros na construção da ferrovia e pela atuação de monges.',
      },
    ],
  },
  {
    id: 'geografia',
    nome: 'Geografia',
    questoes: [
      {
        id: 'geo1',
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
        id: 'geo2',
        disciplina: 'Geografia',
        enunciado:
          'O Paraná faz parte da região Sul do Brasil e possui três grandes unidades de relevo. São elas:',
        alternativas: [
          'planalto central, depressão e cordilheira',
          'litoral, serra do mar e planaltos interioranos',
          'pampa, chapadão e tabuleiro',
          'escudo cristalino, bacia sedimentar e pantanal',
          'campo, cerrado e caatinga',
        ],
        correta: 1,
        explicacao:
          'O relevo paranaense é tradicionalmente dividido em litoral, Serra do Mar e planaltos interioranos, escalonados de leste para oeste.',
      },
      {
        id: 'geo3',
        disciplina: 'Geografia',
        enunciado:
          'O Mercosul tem como principal objetivo:',
        alternativas: [
          'a criação de uma moeda única obrigatória',
          'a união aduaneira com livre circulação de bens e serviços entre os membros',
          'a militarização das fronteiras',
          'a extinção das tarifas de importação com a União Europeia',
          'a padronização das leis penais dos países',
        ],
        correta: 1,
        explicacao:
          'O Mercosul busca a integração econômica por meio de uma união aduaneira, com tarifa externa comum e livre circulação entre os países-membros.',
      },
      {
        id: 'geo4',
        disciplina: 'Geografia',
        enunciado:
          'No mapa, uma escala de 1:50.000 significa que 1 centímetro no papel corresponde a:',
        alternativas: ['50 metros', '500 metros', '5 quilômetros', '50 quilômetros', '500 quilômetros'],
        correta: 1,
        explicacao:
          '1:50.000 indica que 1 cm no mapa equivale a 50.000 cm no terreno, ou seja, 500 metros.',
      },
      {
        id: 'geo5',
        disciplina: 'Geografia',
        enunciado:
          'Sobre a urbanização paranaense, é correto afirmar que:',
        alternativas: [
          'a população sempre foi predominantemente urbana',
          'na década de 1970 o estado passou a ter maioria da população vivendo em cidades',
          'não houve êxodo rural no estado',
          'a capital perdeu população na década de 2010',
          'o estado possui apenas uma cidade com mais de 100 mil habitantes',
        ],
        correta: 1,
        explicacao:
          'A inversão demográfica ocorreu na década de 1970, quando a população urbana superou a rural, impulsionada pela modernização agrícola e pela migração.',
      },
      {
        id: 'geo6',
        disciplina: 'Geografia',
        enunciado:
          'O clima predominante no norte do Paraná é:',
        alternativas: [
          'equatorial úmido',
          'semiárido',
          'subtropical úmido, com verões quentes',
          'tropical de altitude seco',
          'polar',
        ],
        correta: 2,
        explicacao:
          'O norte paranaense apresenta clima subtropical úmido, com verões quentes e chuvas bem distribuídas ao longo do ano.',
      },
    ],
  },
  {
    id: 'direito',
    nome: 'Noções de Direito',
    questoes: [
      {
        id: 'dir1',
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
        id: 'dir2',
        disciplina: 'Direito Penal',
        enunciado: 'Sobre o crime de tortura (Lei nº 9.455/1997), assinale a alternativa correta:',
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
        id: 'dir3',
        disciplina: 'Direito Processual Penal',
        enunciado: 'São características do inquérito policial:',
        alternativas: [
          'publicidade ampla, contraditório pleno e natureza acusatória',
          'ser escrito, sigiloso e dispensável para a propositura da ação penal',
          'caráter jurisdicional e vinculação do Ministério Público',
          'obrigatoriedade de defesa técnica durante toda a apuração',
          'natureza decisória, com produção de coisa julgada',
        ],
        correta: 1,
        explicacao:
          'O inquérito é peça informativa, escrita, sigilosa e dispensável: o Ministério Público pode denunciar com base em outros elementos de convicção.',
      },
      {
        id: 'dir4',
        disciplina: 'Direito Penal',
        enunciado:
          'A lei penal mais benéfica ao réu, publicada após a prática do fato, aplica-se aos fatos anteriores?',
        alternativas: [
          'Não, em razão da irretroatividade absoluta da lei penal.',
          'Sim, por força da retroatividade da lei penal mais benéfica.',
          'Somente se houver pedido expresso do Ministério Público.',
          'Somente após o trânsito em julgado.',
          'Apenas nos crimes hediondos.',
        ],
        correta: 1,
        explicacao:
          'A Constituição e o Código Penal determinam a retroatividade da lei penal mais benéfica, mesmo que o fato tenha ocorrido antes de sua vigência.',
      },
      {
        id: 'dir5',
        disciplina: 'Direitos Humanos',
        enunciado:
          'A Convenção Americana sobre Direitos Humanos (Pacto de San José da Costa Rica) foi incorporada ao direito brasileiro e trata, entre outros temas:',
        alternativas: [
          'da criação de tribunais militares internacionais',
          'da proteção dos direitos civis e políticos e das garantias judiciais',
          'da regulamentação do comércio internacional',
          'da padronização das polícias militares estaduais',
          'da extinção da pena privativa de liberdade',
        ],
        correta: 1,
        explicacao:
          'A Convenção assegura direitos civis e políticos, como vida, liberdade pessoal, garantias judiciais e liberdade de expressão, além de prever a Comissão e a Corte Interamericanas.',
      },
      {
        id: 'dir6',
        disciplina: 'Direito Constitucional',
        enunciado:
          'São órgãos de segurança pública previstos no artigo 144 da Constituição Federal, EXCETO:',
        alternativas: [
          'polícia federal',
          'polícia rodoviária federal',
          'polícia ferroviária federal',
          'polícias civis e militares',
          'guarda municipal ambiental federal',
        ],
        correta: 4,
        explicacao:
          'O rol do artigo 144 contempla polícia federal, rodoviária federal, ferroviária federal, polícias civis, militares e corpos de bombeiros militares, além das polícias penais. Não existe "guarda municipal ambiental federal".',
      },
      {
        id: 'dir7',
        disciplina: 'Direito Penal',
        enunciado:
          'Considerando a Lei Maria da Penha (Lei nº 11.340/2006), as medidas protetivas de urgência:',
        alternativas: [
          'dependem sempre de pagamento de fiança',
          'podem ser concedidas de imediato, inclusive pelo delegado, em caso de risco à integridade da ofendida',
          'aplicam-se apenas a vítimas maiores de 60 anos',
          'exigem sentença condenatória transitada em julgado',
          'são vedadas em cidades sem juizado especializado',
        ],
        correta: 1,
        explicacao:
          'A lei prevê medidas protetivas de urgência que podem ser concedidas de imediato, comunicando-se o juiz, sempre que houver risco à integridade física ou psicológica da ofendida.',
      },
      {
        id: 'dir8',
        disciplina: 'Direito Penal',
        enunciado:
          'A Lei nº 8.069/1990 (ECA) prevê que a apreensão de adolescente em flagrante de ato infracional:',
        alternativas: [
          'depende de autorização judicial prévia em qualquer hipótese',
          'é possível e deve ser comunicada imediatamente à autoridade judiciária e à família',
          'só pode ocorrer com mandado',
          'é vedada no período noturno',
          'exige a presença de defensor antes da apreensão',
        ],
        correta: 1,
        explicacao:
          'O adolescente pode ser apreendido em flagrante, devendo a autoridade policial comunicar imediatamente a autoridade judiciária, o Ministério Público e a família.',
      },
      {
        id: 'dir9',
        disciplina: 'Direito Penal',
        enunciado:
          'De acordo com o Estatuto do Desarmamento (Lei nº 10.826/2003), o porte de arma de fogo de uso permitido sem autorização configura:',
        alternativas: [
          'infração administrativa',
          'crime de porte ilegal de arma de fogo, com pena de reclusão',
          'mera irregularidade sanável por multa',
          'contravenção penal',
          'conduta atípica',
        ],
        correta: 1,
        explicacao:
          'O porte ilegal de arma de fogo de uso permitido é crime, punido com reclusão de 2 a 4 anos e multa, conforme o artigo 14 da Lei nº 10.826/2003.',
      },
    ],
  },
  {
    id: 'legislacao',
    nome: 'Legislação e Institucional',
    questoes: [
      {
        id: 'leg1',
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
      {
        id: 'leg2',
        disciplina: 'Legislação Institucional',
        enunciado:
          'A Lei Estadual nº 1.943/1954, que instituiu o Código da Polícia Militar do Paraná, trata, entre outros temas:',
        alternativas: [
          'da estrutura geral, hierarquia e disciplina da corporação',
          'da criação da Polícia Federal',
          'do Código de Trânsito Brasileiro',
          'das regras do sistema financeiro nacional',
          'da legislação trabalhista rural',
        ],
        correta: 0,
        explicacao:
          'O Código da PMPR disciplina a estrutura da corporação, a hierarquia, os deveres e a disciplina dos militares estaduais.',
      },
      {
        id: 'leg3',
        disciplina: 'Legislação Institucional',
        enunciado:
          'Na hierarquia militar, os postos são ocupados por oficiais e as graduações pelos praças. Assinale a alternativa que contém apenas graduações:',
        alternativas: [
          'coronel, major, capitão',
          'soldado, cabo, sargento, tenente',
          'soldado, cabo, sargento',
          'tenente, capitão, major',
          'general, coronel, major',
        ],
        correta: 2,
        explicacao:
          'Soldado, cabo e sargento são praças. Os demais citados (tenente, capitão, major, coronel) são postos de oficiais.',
      },
      {
        id: 'leg4',
        disciplina: 'Legislação Extravagante',
        enunciado:
          'A Lei nº 7.716/1989 trata de:',
        alternativas: [
          'crimes de tortura',
          'crimes resultantes de preconceito de raça ou de cor',
          'crimes hediondos',
          'crimes de trânsito',
          'crimes ambientais',
        ],
        correta: 1,
        explicacao:
          'A Lei nº 7.716/1989 define os crimes resultantes de preconceito de raça, cor, etnia, religião ou procedência nacional.',
      },
      {
        id: 'leg5',
        disciplina: 'Legislação Extravagante',
        enunciado:
          'São considerados crimes hediondos, nos termos da Lei nº 8.072/1990:',
        alternativas: [
          'furto simples e estelionato',
          'latrocínio, extorsão mediante sequestro e estupro de vulnerável',
          'desacato e desobediência',
          'porte de arma de uso permitido',
          'lesão corporal leve',
        ],
        correta: 1,
        explicacao:
          'A lei considera hediondos, entre outros, o homicídio doloso, o latrocínio, o estupro, o estupro de vulnerável e a extorsão mediante sequestro.',
      },
      {
        id: 'leg6',
        disciplina: 'Legislação Institucional',
        enunciado:
          'O uso diferenciado da força pelos policiais militares deve observar:',
        alternativas: [
          'a discricionariedade absoluta do agente',
          'a legalidade, a necessidade, a proporcionalidade e a razoabilidade do emprego da força',
          'o emprego da força letal como primeira alternativa',
          'a hierarquia apenas em ambiente urbano',
          'a autorização judicial em todas as ocorrências',
        ],
        correta: 1,
        explicacao:
          'O uso da força deve observar a legalidade, a necessidade e a proporcionalidade, privilegiando os meios menos lesivos e o escalonamento do uso da força.',
      },
      {
        id: 'leg7',
        disciplina: 'Legislação Institucional',
        enunciado:
          'A Lei nº 12.288/2010, Estatuto da Igualdade Racial, tem como objetivo:',
        alternativas: [
          'regulamentar as eleições proporcionais',
          'garantir igualdade de oportunidades e combater a discriminação étnico-racial',
          'criar o sistema tributário nacional',
          'disciplinar o sistema penitenciário federal',
          'definir as competências dos tribunais militares',
        ],
        correta: 1,
        explicacao:
          'O Estatuto da Igualdade Racial assegura direitos e combate a discriminação e as desigualdades étnico-raciais.',
      },
      {
        id: 'leg8',
        disciplina: 'Legislação Institucional',
        enunciado:
          'Nos termos da Lei Maria da Penha, a violência doméstica abrange a violência física, sexual, patrimonial, moral e:',
        alternativas: ['institucional', 'psicológica', 'cibernética', 'econômica', 'simbólica'],
        correta: 1,
        explicacao:
          'A Lei nº 11.340/2006 elenca cinco formas de violência doméstica: física, psicológica, sexual, patrimonial e moral.',
      },
    ],
  },
];

/** Todas as questões do banco, achatadas. */
export const TODAS_QUESTOES: QuestaoSimulado[] = BANCO_QUESTOES.flatMap((m) => m.questoes);

export const getQuestoesPorMateria = (materiaId: string) =>
  BANCO_QUESTOES.find((m) => m.id === materiaId)?.questoes ?? [];

/** Sorteia um simulado com a distribuição proporcional ao edital. */
export function montarSimulado(quantidade: number, materiaId?: string): QuestaoSimulado[] {
  const fonte = materiaId ? getQuestoesPorMateria(materiaId) : TODAS_QUESTOES;
  if (materiaId) return [...fonte].sort(() => Math.random() - 0.5).slice(0, quantidade);
  return [...fonte].sort(() => Math.random() - 0.5).slice(0, quantidade);
}
