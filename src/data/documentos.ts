/**
 * Texto integral dos editais, publicado dentro do próprio portal.
 *
 * Estrutura de cada seção:
 *  - chave      identificador usado na navegação lateral
 *  - titulo     título da seção (Caixa Alta)
 *  - capitulo   numeração romana sequencial (gerada automaticamente)
 *  - paragrafos blocos de texto corrido
 *  - itens      incisos / linhas de lista
 *  - tabela     tabela simples com cabeçalho e linhas
 *  - anexos     quadros complementares
 */

export interface Tabela {
  colunas: string[];
  linhas: string[][];
}

export interface SecaoEdital {
  chave: string;
  titulo: string;
  paragrafos?: string[];
  itens?: string[];
  tabela?: Tabela;
}

export interface DocumentoEdital {
  editalId: string;
  numero: string;
  titulo: string;
  orgao: string;
  unidade: string;
  cidade: string;
  data: string;
  preambulo: string[];
  secoes: SecaoEdital[];
  assinaturas: { nome: string; cargo: string }[];
  rodape: string;
  versao: string;
  atualizadoEm: string;
}

const RODAPE_PADRAO =
  'Este edital é publicado e distribuído exclusivamente pelo Portal de Editais da Polícia Militar do Paraná. ' +
  'Documento de caráter informativo e demonstrativo, sem vínculo oficial com a corporação. Em caso de divergência, ' +
  'prevalecem as publicações oficiais da Polícia Militar do Paraná.';

/* ================================================================== */
/* 1. PMPR — SOLDADO                                                   */
/* ================================================================== */

const PMPR_SOLDADO: DocumentoEdital = {
  editalId: 'pmpr-soldado',
  numero: 'EDITAL Nº 01/2026 — SOLDADO PMPR',
  titulo: 'Edital de Concurso Público para o Cargo de Soldado Policial Militar',
  orgao: 'GOVERNO DO ESTADO DO PARANÁ',
  unidade: 'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA — POLÍCIA MILITAR DO PARANÁ',
  cidade: 'Curitiba',
  data: '02 de outubro de 2026',
  preambulo: [
    'O Comandante-Geral da Polícia Militar do Paraná, no uso das atribuições que lhe confere a legislação estadual, e considerando o disposto na Lei Federal nº 14.751/2023, na Lei Estadual nº 1.943/1954 e no Decreto Estadual que autoriza a abertura do certame, torna público o presente Edital, que estabelece as normas, os requisitos e o cronograma do Concurso Público destinado ao provimento de 2.000 (duas mil) vagas imediatas no cargo de Soldado Policial Militar, bem como à formação de cadastro de reserva.',
    'O concurso será executado sob a responsabilidade do Instituto Brasileiro de Formação e Capacitação — IBFC, doravante denominado Banca Examinadora, em estrita observância a este Edital e à legislação vigente.',
  ],
  secoes: [
    {
      chave: 'disposicoes',
      titulo: 'DAS DISPOSIÇÕES PRELIMINARES',
      itens: [
        '1.1. O concurso destina-se ao provimento de 2.000 (duas mil) vagas no cargo de Soldado Policial Militar, de nível superior, distribuídas entre ampla concorrência e a reserva legal destinada a candidatos afrodescendentes.',
        '1.2. O regime de contratação é estatutário, submetido à hierarquia e à disciplina militares, nos termos da legislação estadual e federal aplicável.',
        '1.3. O certame será composto pelas etapas descritas no Capítulo VI, todas de caráter eliminatório, sendo as etapas 1 e 6 também classificatórias.',
        '1.4. A inscrição do candidato implica o conhecimento e a aceitação integral das condições estabelecidas neste Edital.',
        '1.5. As informações oficiais serão divulgadas exclusivamente por meio deste portal e pelos canais de comunicação da Banca Examinadora.',
        '1.6. Os prazos serão contados em dias úteis, excluindo o dia do início e incluindo o do vencimento, salvo disposição expressa em contrário.',
      ],
    },
    {
      chave: 'cargos',
      titulo: 'DO CARGO, DAS VAGAS E DA REMUNERAÇÃO',
      paragrafos: [
        '2.1. O cargo de Soldado Policial Militar integra a carreira de praças da Polícia Militar do Paraná e tem por atribuição o policiamento ostensivo, a preservação da ordem pública e o atendimento de ocorrências policiais em todo o território estadual.',
      ],
      tabela: {
        colunas: ['Situação funcional', 'Subsídio', 'Auxílio-alimentação'],
        linhas: [
          ['Aluno-Soldado de 3ª Classe', 'R$ 2.530,12', 'R$ 834,74'],
          ['Aluno-Soldado Operacional de 2ª Classe', 'R$ 3.795,18', 'R$ 834,74'],
          ['Soldado de 1ª Classe', 'R$ 6.101,87', 'R$ 834,74'],
        ],
      },
      itens: [
        '2.2. As vagas serão distribuídas entre as regiões de lotação indicadas no Anexo III, observada a ordem de classificação.',
        '2.3. O candidato aprovado permanece na condição de aluno durante o Curso de Formação de Soldados, percebendo a bolsa-auxílio correspondente.',
        '2.4. Além do subsídio, poderão incidir adicionais previstos em lei, tais como adicional de tempo de serviço e adicional noturno.',
        '2.5. A carga horária semanal é de 40 horas, podendo ser ampliada conforme a necessidade do serviço operacional.',
      ],
    },
    {
      chave: 'requisitos',
      titulo: 'DOS REQUISITOS PARA A INVESTIDURA',
      paragrafos: ['3.1. O candidato deverá comprovar, na data da posse, o atendimento cumulativo dos seguintes requisitos:'],
      itens: [
        'a) ser brasileiro, nato ou naturalizado, ou português com reconhecimento de igualdade de direitos;',
        'b) ter concluído o ensino superior em qualquer área, reconhecido pelo Ministério da Educação;',
        'c) ter no máximo 30 (trinta) anos de idade no ato da inscrição, não podendo ter completado 31 anos no primeiro dia de inscrições;',
        'd) estar quite com as obrigações militares, quando do sexo masculino, e com as obrigações eleitorais;',
        'e) possuir Carteira Nacional de Habilitação, no mínimo, da categoria B, válida e sem suspensão;',
        'f) ser aprovado no Exame de Capacidade Física, na Avaliação Psicológica, no Exame de Sanidade Física e na Investigação Social;',
        'g) não possuir antecedentes criminais incompatíveis com a função, nem registro de ato infracional grave;',
        'h) apresentar declaração de idoneidade e não acumular cargo público incompatível com o regime militar.',
      ],
    },
    {
      chave: 'inscricoes',
      titulo: 'DAS INSCRIÇÕES',
      itens: [
        '4.1. As inscrições serão realizadas exclusivamente pela internet, no endereço eletrônico da Banca Examinadora, no período de 12 de outubro a 16 de novembro de 2026, observado o horário oficial de Brasília.',
        '4.2. A taxa de inscrição é de R$ 130,00 (cento e trinta reais), devendo o pagamento ser efetuado até o dia 17 de novembro de 2026.',
        '4.3. O pedido de isenção da taxa poderá ser formulado no prazo previsto no Anexo I, mediante comprovação de hipossuficiência ou de doação de sangue, nos termos da lei estadual.',
        '4.4. O candidato afrodescendente que desejar concorrer às vagas reservadas deverá manifestar essa opção no formulário de inscrição, submetendo-se ao procedimento de heteroidentificação previsto no Capítulo VIII.',
        '4.5. A inscrição somente será confirmada após a confirmação do pagamento pela instituição bancária.',
        '4.6. Não serão aceitas inscrições por via postal, fax, correio eletrônico ou fora do prazo.',
        '4.7. O candidato é responsável pela veracidade das informações prestadas, respondendo civil, penal e administrativamente por falsidade.',
      ],
    },
    {
      chave: 'deficiencia',
      titulo: 'DAS PESSOAS COM DEFICIÊNCIA',
      itens: [
        '5.1. O candidato com deficiência que pretender concorrer às vagas reservadas deverá declarar essa condição no formulário de inscrição e apresentar laudo médico com indicação expressa do tipo de deficiência e do código correspondente da Classificação Internacional de Doenças.',
        '5.2. A Polícia Militar disponibilizará, quando solicitado e justificado, atendimento especial para a realização das provas, incluindo prova em formato ampliado, intérprete de Libras e tempo adicional de 60 minutos.',
        '5.3. A solicitação de atendimento especial deverá ser feita no prazo de inscrição, acompanhada de documentação comprobatória.',
        '5.4. A condição de pessoa com deficiência será submetida à avaliação de junta médica oficial da corporação.',
      ],
    },
    {
      chave: 'provas',
      titulo: 'DAS ETAPAS DO CONCURSO',
      paragrafos: [
        '6.1. O concurso é composto por seis etapas, conforme o quadro a seguir:',
      ],
      tabela: {
        colunas: ['Etapa', 'Denominação', 'Caráter'],
        linhas: [
          ['1ª', 'Prova Objetiva e Prova Discursiva', 'Eliminatório e classificatório'],
          ['2ª', 'Exame de Capacidade Física (ECAFI)', 'Eliminatório'],
          ['3ª', 'Avaliação Psicológica', 'Eliminatório'],
          ['4ª', 'Exame de Sanidade Física (ESAFI)', 'Eliminatório'],
          ['5ª', 'Investigação Social', 'Eliminatório'],
          ['6ª', 'Curso de Formação de Soldados (CFS)', 'Eliminatório e classificatório'],
        ],
      },
      itens: [
        '6.2. A Prova Objetiva será composta por 60 (sessenta) questões de múltipla escolha, com cinco alternativas e apenas uma correta, divididas em conhecimentos gerais e específicos.',
        '6.3. A Prova Discursiva consistirá em uma redação de até 30 (trinta) linhas, sobre tema de atualidades e cidadania, valendo até 20 (vinte) pontos.',
        '6.4. A duração total da prova objetiva e da discursiva será de 5 (cinco) horas, incluído o tempo para preenchimento da folha de respostas.',
        '6.5. Será eliminado o candidato que obtiver zero em qualquer disciplina, deixar de responder a qualquer questão, obtiver nota zero na prova discursiva ou desrespeitar as regras de conduta previstas neste Edital.',
        '6.6. Os locais de prova serão divulgados com antecedência mínima de 5 (cinco) dias, nos municípios de Curitiba, Cascavel, Campo Mourão, Foz do Iguaçu, Guarapuava, Jacarezinho, Londrina, Maringá, Paranaguá, Pato Branco, Ponta Grossa e Umuarama.',
      ],
    },
    {
      chave: 'objetiva',
      titulo: 'DA PROVA OBJETIVA E DO CONTEÚDO PROGRAMÁTICO',
      paragrafos: ['7.1. A distribuição das questões e a pontuação obedecem ao quadro abaixo:'],
      tabela: {
        colunas: ['Prova', 'Questões', 'Pontos por questão', 'Total'],
        linhas: [
          ['Conhecimentos Gerais', '40', '1', '40'],
          ['Conhecimentos Específicos', '20', '2', '40'],
          ['Total', '60', '—', '80'],
        ],
      },
      itens: [
        '7.2. Será considerado habilitado o candidato que obtiver, cumulativamente, no mínimo 12 (doze) pontos em conhecimentos gerais, 12 (doze) pontos em conhecimentos específicos e 32 (trinta e dois) pontos no total da prova objetiva.',
        '7.3. Língua Portuguesa (12 questões): compreensão e interpretação de textos; coesão e coerência; ortografia, acentuação e pontuação; classes de palavras e emprego de pronomes; sintaxe do período, concordância, regência e crase; figuras de linguagem; variedades linguísticas.',
        '7.4. Raciocínio Matemático (7 questões): operações com números reais e porcentagem; razão, proporção, regra de três e escalas; equações e sistemas; problemas de contagem; média, mediana, moda e leitura de gráficos; área, volume e capacidade; conjuntos e diagramas de Venn; proposições, conectivos e equivalência lógica.',
        '7.5. Noções de Informática (6 questões): sistemas operacionais e gestão de arquivos; editores de texto, planilhas e apresentações; internet, navegadores e correio eletrônico; segurança da informação, malwares e phishing; computação em nuvem e backup; noções de redes.',
        '7.6. História (6 questões): Brasil Colônia, Império e República; Era Vargas; regime militar e redemocratização; história do Paraná, tropeirismo, erva-mate e ciclos econômicos; formação territorial e movimentos sociais paranaenses.',
        '7.7. Geografia (6 questões): geografia física e política do Brasil; relevo, clima, hidrografia e biomas; população, urbanização e migrações; geografia do Paraná; globalização, blocos econômicos e Mercosul; cartografia e escalas.',
        '7.8. Noções de Direito (9 questões): direitos e garantias fundamentais; segurança pública no artigo 144 da Constituição Federal; crime, tipicidade, ilicitude e culpabilidade; inquérito policial e prisões; direitos humanos e Convenção Americana de 1969.',
        '7.9. Legislação (14 questões): Lei nº 8.072/1990; Lei nº 9.455/1997; Lei nº 10.826/2003; Lei nº 11.340/2006; Lei nº 8.069/1990; Lei nº 12.288/2010; Lei nº 7.716/1989; Lei Federal nº 14.751/2023; Lei Estadual nº 1.943/1954.',
      ],
    },
    {
      chave: 'ecafi',
      titulo: 'DO EXAME DE CAPACIDADE FÍSICA — ECAFI',
      paragrafos: ['8.1. O ECAFI é eliminatório e será aplicado por banca de oficiais e profissionais de educação física da corporação, observados os índices mínimos:'],
      tabela: {
        colunas: ['Teste', 'Masculino', 'Feminino'],
        linhas: [
          ['Barra fixa', '6 repetições de flexão', '15 segundos em isometria'],
          ['Abdominal', '31 repetições', '26 repetições'],
          ['Corrida de 300 m', '56 segundos', '64 segundos'],
          ['Corrida de 2.400 m', '11 min 58 s', '14 min 07 s'],
        ],
      },
      itens: [
        '8.2. O candidato será convocado com antecedência mínima de 5 (cinco) dias e deverá apresentar atestado médico autorizando a prática de atividade física.',
        '8.3. Será eliminado o candidato que não comparecer, que se apresentar após o horário limite ou que não atingir o índice mínimo em qualquer dos testes.',
        '8.4. É vedado o uso de recursos ergogênicos, substâncias dopantes ou qualquer artifício que comprometa a isonomia da avaliação.',
        '8.5. Não haverá segunda chamada, salvo em caso de força maior devidamente comprovado e aceito pela comissão.',
      ],
    },
    {
      chave: 'psicologica',
      titulo: 'DA AVALIAÇÃO PSICOLÓGICA E DO EXAME DE SANIDADE FÍSICA',
      itens: [
        '9.1. A avaliação psicológica será realizada por psicólogos habilitados e terá por objetivo verificar a aptidão do candidato para o desempenho da função policial militar.',
        '9.2. A avaliação compreenderá a aplicação de instrumentos psicométricos validados e entrevista individual, sendo sigilosa e de caráter eliminatório.',
        '9.3. O Exame de Sanidade Física compreenderá avaliação clínica, oftalmológica e odontológica, destinada a comprovar a aptidão física e sanitária do candidato.',
        '9.4. Não serão admitidos candidatos com doenças ou condições clínicas incompatíveis com o serviço operacional, conforme a relação de patologias impeditivas do Anexo IV.',
      ],
    },
    {
      chave: 'social',
      titulo: 'DA INVESTIGAÇÃO SOCIAL',
      itens: [
        '10.1. A Investigação Social tem por objetivo apurar a idoneidade moral, a conduta social e a vida pregressa do candidato.',
        '10.2. O candidato deverá apresentar declaração de antecedentes criminais, certidões negativas de distribuidores criminais e declaração de idoneidade firmada pelo próprio candidato.',
        '10.3. Poderão ser consultadas bases de dados institucionais, observada a Lei Geral de Proteção de Dados.',
        '10.4. Será eliminado o candidato que prestar informação falsa, omitir fato relevante ou apresentar conduta incompatível com a função policial militar.',
      ],
    },
    {
      chave: 'classificacao',
      titulo: 'DA CLASSIFICAÇÃO, DO DESEMPATE E DA HOMOLOGAÇÃO',
      itens: [
        '11.1. A nota final será a soma da prova objetiva, da prova discursiva e da etapa de formação, na proporção definida no Anexo II.',
        '11.2. Em caso de empate, terá preferência o candidato que, sucessivamente: obtiver maior nota na prova discursiva; obtiver maior nota em conhecimentos específicos; obtiver maior nota em Língua Portuguesa; possuir maior idade; tiver exercido efetivo serviço militar.',
        '11.3. O resultado final será homologado pelo Comandante-Geral e publicado neste portal.',
        '11.4. O prazo de validade do concurso é de 2 (dois) anos, contado da homologação, prorrogável uma única vez por igual período.',
      ],
    },
    {
      chave: 'curso',
      titulo: 'DO CURSO DE FORMAÇÃO DE SOLDADOS',
      itens: [
        '12.1. O Curso de Formação de Soldados será realizado em regime de internato, na Escola de Formação e Aperfeiçoamento de Praças, com duração aproximada de 12 (doze) meses.',
        '12.2. O aluno fará jus à bolsa-auxílio de aluno-soldado, conforme a tabela do Capítulo II.',
        '12.3. Será eliminado o aluno que for reprovado em qualquer disciplina, que obtiver conceito disciplinar negativo ou que se ausentar injustificadamente.',
        '12.4. A conclusão do curso confere ao aprovado a graduação de Soldado de 1ª Classe.',
      ],
    },
    {
      chave: 'posse',
      titulo: 'DA POSSE E DO EXERCÍCIO',
      itens: [
        '13.1. O candidato aprovado e classificado será convocado para a posse, devendo apresentar a documentação exigida no prazo definido no ato de convocação.',
        '13.2. A posse dar-se-á mediante compromisso solene de fidelidade à Constituição e às leis, observados os deveres éticos da corporação.',
        '13.3. O prazo para o exercício é de 30 (trinta) dias, contado da data da posse, podendo ser prorrogado mediante requerimento fundamentado.',
        '13.4. A não comprovação dos requisitos do Capítulo III na data da posse implica a eliminação do candidato.',
      ],
    },
    {
      chave: 'disposicoes-finais',
      titulo: 'DAS DISPOSIÇÕES FINAIS',
      itens: [
        '14.1. Os casos omissos serão resolvidos pela Comissão de Concurso, ouvida a Banca Examinadora.',
        '14.2. Os prazos de recurso estão definidos no Anexo I e serão de 2 (dois) dias úteis para cada etapa.',
        '14.3. O candidato que cometer fraude, utilizar equipamento não autorizado ou desrespeitar a autoridade da fiscalização será eliminado e submetido às sanções legais cabíveis.',
        '14.4. A inscrição implica a autorização para o uso dos dados pessoais estritamente necessários à execução do certame.',
        '14.5. Este Edital entra em vigor na data de sua publicação.',
      ],
    },
  ],
  assinaturas: [
    { nome: 'Comando-Geral da PMPR', cargo: 'Comandante-Geral da Polícia Militar do Paraná' },
    { nome: 'Comissão de Concurso', cargo: 'Presidente da Comissão Organizadora' },
  ],
  rodape: RODAPE_PADRAO,
  versao: '1.0',
  atualizadoEm: '10/11/2026',
};

/* ================================================================== */
/* 2. ROTAM                                                            */
/* ================================================================== */

const ROTAM: DocumentoEdital = {
  editalId: 'rotam',
  numero: 'EDITAL Nº 02/2026 — CURSO DE ROTAM',
  titulo: 'Edital de Seleção Interna para o Curso Operacional de Rondas Ostensivas Tático Móveis',
  orgao: 'POLÍCIA MILITAR DO PARANÁ',
  unidade: 'COMANDO DE OPERAÇÕES — PELOTÕES ROTAM',
  cidade: 'Curitiba',
  data: '10 de novembro de 2026',
  preambulo: [
    'O Comandante do Comando de Operações, no uso de suas atribuições e considerando a necessidade de ampliar a capacidade operacional das unidades de área, faz saber aos interessados que estarão abertas as inscrições para o Curso Operacional de Rondas Ostensivas Tático Móveis — ROTAM, destinado a praças e oficiais do quadro de policiais militares da ativa.',
    'A seleção é gratuita e de caráter interno, regendo-se pelas normas deste Edital, pelo Código da Polícia Militar do Paraná e pelas diretrizes do Comando-Geral.',
  ],
  secoes: [
    {
      chave: 'objeto',
      titulo: 'DO OBJETO E DA FINALIDADE',
      itens: [
        '1.1. O presente Edital tem por objeto a seleção de 96 (noventa e seis) policiais militares para o Curso Operacional de ROTAM, distribuídos entre 4 (quatro) batalhões de área.',
        '1.2. O curso destina-se ao preparo de policiais para a atuação no patrulhamento tático motorizado, no 2º e 3º esforço, em apoio às guarnições de radiopatrulha.',
        '1.3. A conclusão do curso é condição obrigatória para a incorporação ao efetivo do pelotão ROTAM e para a concessão do adicional de atividade especializada.',
        '1.4. O policial aprovado permanece vinculado ao batalhão de origem, podendo ser empregado em qualquer região do estado conforme a necessidade do serviço.',
      ],
    },
    {
      chave: 'vagas',
      titulo: 'DAS VAGAS E DA DISTRIBUIÇÃO',
      tabela: {
        colunas: ['Unidade', 'Sede', 'Vagas'],
        linhas: [
          ['Batalhão de Polícia Militar — capital', 'Curitiba', '30'],
          ['Batalhão de Polícia Militar — norte', 'Londrina', '24'],
          ['Batalhão de Polícia Militar — noroeste', 'Maringá', '22'],
          ['Batalhão de Polícia Militar — oeste', 'Cascavel', '20'],
        ],
      },
      itens: [
        '2.1. As vagas não preenchidas em uma unidade poderão ser remanejadas para outra, a critério da comissão de seleção.',
        '2.2. Será formado cadastro de reserva de até 50% do total de vagas, para aproveitamento no prazo de 12 (doze) meses.',
      ],
    },
    {
      chave: 'requisitos',
      titulo: 'DOS REQUISITOS PARA A INSCRIÇÃO',
      itens: [
        'a) estar no efetivo exercício da função policial militar na data da inscrição;',
        'b) contar com, no mínimo, 2 (dois) anos de efetivo serviço na corporação;',
        'c) não ter sofrido punição disciplinar nos últimos 12 (doze) meses;',
        'd) não responder a processo administrativo disciplinar ou a inquérito policial militar em curso;',
        'e) possuir conceito disciplinar favorável emitido pelo comandante da unidade de origem;',
        'f) ter disponibilidade para escalas diurnas e noturnas, operações especiais e afastamento da sede por até 30 (trinta) dias;',
        'g) apresentar atestado médico autorizando a prática de atividade física de alto impacto;',
        'h) não estar em gozo de licença superior a 30 (trinta) dias no período do curso.',
      ],
    },
    {
      chave: 'inscricoes',
      titulo: 'DAS INSCRIÇÕES',
      itens: [
        '4.1. As inscrições serão realizadas no período de 18 de novembro a 18 de dezembro de 2026, exclusivamente pelo sistema interno de RH da corporação, mediante preenchimento da ficha de inscrição.',
        '4.2. Não há cobrança de taxa de inscrição.',
        '4.3. O candidato deverá anexar a ficha funcional e o parecer do comandante da unidade de origem.',
        '4.4. A homologação das inscrições será publicada em 5 de janeiro de 2027, cabendo recurso no prazo de 2 (dois) dias úteis.',
        '4.5. A inscrição implica o compromisso de comparecimento a todas as etapas, salvo motivo de força maior justificado e aceito pela comissão.',
      ],
    },
    {
      chave: 'etapas',
      titulo: 'DAS ETAPAS DA SELEÇÃO',
      tabela: {
        colunas: ['Etapa', 'Denominação', 'Caráter'],
        linhas: [
          ['1ª', 'Inscrição e análise documental', 'Eliminatório'],
          ['2ª', 'Prova objetiva', 'Eliminatório e classificatório'],
          ['3ª', 'Teste de aptidão física', 'Eliminatório'],
          ['4ª', 'Teste de tiro e avaliação tática', 'Eliminatório e classificatório'],
          ['5ª', 'Curso operacional de ROTAM', 'Eliminatório e classificatório'],
        ],
      },
    },
    {
      chave: 'objetiva',
      titulo: 'DA PROVA OBJETIVA',
      paragrafos: [
        '6.1. A prova objetiva terá 40 (quarenta) questões de múltipla escolha, com cinco alternativas e apenas uma correta, valendo 1 (um) ponto cada, totalizando 40 (quarenta) pontos.',
        '6.2. A distribuição do conteúdo observa o quadro a seguir:',
      ],
      tabela: {
        colunas: ['Disciplina', 'Questões'],
        linhas: [
          ['Legislação institucional', '10'],
          ['Tática policial', '9'],
          ['Armamento e tiro', '8'],
          ['Direito penal e processual penal militar', '8'],
          ['Direitos humanos', '5'],
        ],
      },
      itens: [
        '6.3. Será aprovado o candidato que obtiver, no mínimo, 24 (vinte e quatro) pontos e não zerar nenhuma disciplina.',
        '6.4. A prova terá duração de 3 (três) horas e será realizada na sede da unidade de destino.',
        '6.5. O gabarito preliminar será divulgado no mesmo dia, cabendo recurso em 1 (um) dia útil.',
      ],
    },
    {
      chave: 'taf',
      titulo: 'DO TESTE DE APTIDÃO FÍSICA',
      paragrafos: ['7.1. O teste de aptidão física é eliminatório e observa os índices mínimos abaixo, superiores aos exigidos no ingresso da corporação:'],
      tabela: {
        colunas: ['Teste', 'Masculino', 'Feminino'],
        linhas: [
          ['Barra fixa', '8 repetições', '20 segundos em isometria'],
          ['Flexão de braço', '30 repetições', '20 repetições'],
          ['Abdominal', '40 repetições', '32 repetições'],
          ['Corrida de 100 m', '14 segundos', '16 segundos'],
          ['Corrida de 2.400 m', '11 min 00 s', '13 min 20 s'],
        ],
      },
      itens: [
        '7.2. O candidato deverá apresentar atestado médico emitido há menos de 30 (trinta) dias.',
        '7.3. Será eliminado o candidato que não atingir o índice mínimo em qualquer dos testes ou que abandonar a prova.',
      ],
    },
    {
      chave: 'tiro',
      titulo: 'DO TESTE DE TIRO E DA AVALIAÇÃO TÁTICA',
      itens: [
        '8.1. O teste de tiro será realizado com pistola .40 e fuzil 5,56 mm, em estande oficial, observadas as normas de segurança da corporação.',
        '8.2. Será aprovado o candidato que obtiver, no mínimo, 65% de acertos em cada série e cumprir integralmente as normas de segurança.',
        '8.3. A avaliação tática compreenderá: abordagem de pessoas, abordagem de veículos, progressão em ambiente construído e simulacro de ocorrência de alto risco.',
        '8.4. Serão avaliados a tomada de decisão, o uso diferenciado da força, a comunicação tática e a observância dos direitos fundamentais.',
        '8.5. A avaliação será registrada em formulário próprio, assinado por, no mínimo, dois avaliadores.',
      ],
    },
    {
      chave: 'curso',
      titulo: 'DO CURSO OPERACIONAL',
      itens: [
        '9.1. O curso terá duração de 8 (oito) semanas, em período integral, com início previsto para 2 de março de 2027.',
        '9.2. A grade curricular compreende: patrulhamento tático motorizado, técnicas de abordagem, tiro tático, controle de distúrbios civis, direção operacional, gerenciamento de crises e condicionamento físico.',
        '9.3. A avaliação será contínua, composta por provas teóricas, práticas e conceito disciplinar.',
        '9.4. Será eliminado o aluno que obtiver nota inferior a 60% em qualquer disciplina, faltar a mais de 10% da carga horária ou incorrer em falta disciplinar.',
        '9.5. O curso exige dedicação exclusiva, incluindo período noturno e fins de semana.',
      ],
    },
    {
      chave: 'classificacao',
      titulo: 'DA CLASSIFICAÇÃO FINAL',
      itens: [
        '10.1. A nota final será a média ponderada da prova objetiva (peso 2), do teste de tiro e avaliação tática (peso 3) e do curso operacional (peso 5).',
        '10.2. Em caso de empate, terá preferência o candidato com maior nota na avaliação tática; persistindo, o de maior tempo de serviço na unidade operacional; e, por fim, o de maior idade.',
        '10.3. O resultado final será publicado em boletim interno e neste portal.',
      ],
    },
    {
      chave: 'disposicoes-finais',
      titulo: 'DAS DISPOSIÇÕES FINAIS',
      itens: [
        '11.1. A ausência injustificada a qualquer etapa implica eliminação automática.',
        '11.2. Os casos omissos serão resolvidos pela comissão de seleção, com anuência do Comando de Operações.',
        '11.3. O candidato aprovado assinará termo de compromisso de permanência mínima de 2 (dois) anos no pelotão ROTAM.',
        '11.4. Este Edital entra em vigor na data de sua publicação.',
      ],
    },
  ],
  assinaturas: [
    { nome: 'Comando de Operações', cargo: 'Comandante do Comando de Operações da PMPR' },
    { nome: 'Comissão de Seleção ROTAM', cargo: 'Presidente da Comissão de Seleção' },
  ],
  rodape: RODAPE_PADRAO,
  versao: '1.0',
  atualizadoEm: '10/11/2026',
};

/* ================================================================== */
/* 3. RONE                                                             */
/* ================================================================== */

const RONE: DocumentoEdital = {
  editalId: 'rone',
  numero: 'EDITAL Nº 03/2026 — CURSO BPRONE',
  titulo: 'Edital de Seleção Interna para o Curso de Operações Especiais do Batalhão de Rondas Ostensivas de Natureza Especial',
  orgao: 'POLÍCIA MILITAR DO PARANÁ',
  unidade: 'BATALHÃO DE RONDAS OSTENSIVAS DE NATUREZA ESPECIAL — BPRONE',
  cidade: 'Curitiba',
  data: '10 de novembro de 2026',
  preambulo: [
    'O Comandante do Batalhão de Rondas Ostensivas de Natureza Especial, no uso de suas atribuições, torna pública a abertura das inscrições para o Curso de Operações Especiais da unidade, com previsão de início em abril de 2027.',
    'A RONE foi criada em 13 de julho de 1992 e transformada em batalhão em 2022. Sua missão é atuar em ocorrências de altíssima complexidade, no combate ao crime organizado, em escoltas, na retomada de pontos sensíveis e no gerenciamento de crises.',
    'Este Edital é preliminar. Datas, quantitativos e índices poderão sofrer ajustes até a publicação da versão definitiva, prevista para dezembro de 2026.',
  ],
  secoes: [
    {
      chave: 'objeto',
      titulo: 'DO OBJETO',
      itens: [
        '1.1. A seleção destina-se ao preenchimento de 45 (quarenta e cinco) vagas no Curso de Operações Especiais do BPRONE.',
        '1.2. O curso habilita o policial militar ao emprego em operações de alto risco, sendo requisito para a incorporação ao efetivo da unidade.',
        '1.3. A seleção é gratuita e destinada exclusivamente a policiais militares da ativa.',
      ],
    },
    {
      chave: 'requisitos',
      titulo: 'DOS REQUISITOS',
      itens: [
        'a) contar com, no mínimo, 3 (três) anos de efetivo serviço na corporação, sendo ao menos 1 (um) ano em unidade operacional;',
        'b) ter concluído curso de ROTAM, Choque, COE ou curso de operações especiais equivalente, ou comprovar experiência em patrulhamento tático;',
        'c) ter no máximo 35 (trinta e cinco) anos de idade na data da inscrição;',
        'd) possuir ensino superior e curso de formação de praças ou de oficiais concluído;',
        'e) não ter sofrido punição disciplinar nos últimos 24 (vinte e quatro) meses;',
        'f) apresentar parecer favorável do comandante da unidade de origem;',
        'g) ter disponibilidade integral para escalas, operações e afastamentos de até 60 (sessenta) dias, inclusive fora do estado;',
        'h) ser aprovado na avaliação psicológica específica para atuação em situações de alto risco.',
      ],
    },
    {
      chave: 'etapas',
      titulo: 'DAS ETAPAS',
      tabela: {
        colunas: ['Etapa', 'Denominação', 'Caráter'],
        linhas: [
          ['1ª', 'Inscrição e triagem curricular', 'Eliminatório'],
          ['2ª', 'Prova objetiva e redação', 'Eliminatório e classificatório'],
          ['3ª', 'Teste de aptidão física especial', 'Eliminatório'],
          ['4ª', 'Avaliação psicológica', 'Eliminatório'],
          ['5ª', 'Curso de Operações Especiais', 'Eliminatório e classificatório'],
        ],
      },
    },
    {
      chave: 'objetiva',
      titulo: 'DA PROVA OBJETIVA E DA REDAÇÃO',
      itens: [
        '3.1. A prova objetiva terá 50 (cinquenta) questões de múltipla escolha, valendo 1 (um) ponto cada, sobre legislação e direito militar, operações especiais, tiro e armamento, direitos humanos e condicionamento físico.',
        '3.2. A redação técnica, de até 40 (quarenta) linhas, versará sobre tema de gerenciamento de crises ou de uso diferenciado da força, valendo até 20 (vinte) pontos.',
        '3.3. Será aprovado o candidato que obtiver, no mínimo, 30 (trinta) pontos na prova objetiva e 12 (doze) pontos na redação.',
        '3.4. A prova terá duração de 4 (quatro) horas.',
      ],
    },
    {
      chave: 'taf',
      titulo: 'DO TESTE DE APTIDÃO FÍSICA ESPECIAL',
      tabela: {
        colunas: ['Teste', 'Masculino', 'Feminino'],
        linhas: [
          ['Barra fixa', '10 repetições', '25 segundos em isometria'],
          ['Flexão de braço', '35 repetições', '25 repetições'],
          ['Abdominal', '45 repetições', '38 repetições'],
          ['Corrida de 3.000 m', '13 min 30 s', '16 min 00 s'],
          ['Natação de 100 m', '2 min 10 s', '2 min 40 s'],
        ],
      },
      itens: [
        '4.1. O teste é eliminatório e será aplicado em duas etapas: pista de atletismo e piscina.',
        '4.2. Será eliminado o candidato que não atingir o índice mínimo em qualquer dos testes ou que abandonar a prova.',
        '4.3. É obrigatória a apresentação de atestado médico específico para atividades de alto rendimento e natação.',
      ],
    },
    {
      chave: 'curso',
      titulo: 'DO CURSO DE OPERAÇÕES ESPECIAIS',
      itens: [
        '5.1. O curso terá duração de 16 (dezesseis) semanas, em regime de internato, com início previsto para abril de 2027.',
        '5.2. A grade curricular compreende: combate urbano, tiro de precisão, ações táticas, explosivos, rapel e técnicas verticais, operações aquáticas, gerenciamento de crises e atendimento pré-hospitalar tático.',
        '5.3. A avaliação será contínua, com provas teóricas, práticas e conceito disciplinar.',
        '5.4. Será eliminado o aluno reprovado em qualquer disciplina, que faltar a mais de 8% da carga horária ou que incorrer em falta disciplinar.',
        '5.5. A conclusão do curso confere ao aprovado o brevê de operações especiais do BPRONE.',
      ],
    },
    {
      chave: 'cronograma',
      titulo: 'DO CRONOGRAMA PREVISTO',
      tabela: {
        colunas: ['Etapa', 'Previsão'],
        linhas: [
          ['Publicação do edital definitivo', 'Dezembro de 2026'],
          ['Inscrições', 'Janeiro de 2027'],
          ['Prova objetiva e redação', 'Fevereiro de 2027'],
          ['Teste de aptidão física especial', 'Fevereiro de 2027'],
          ['Avaliação psicológica', 'Março de 2027'],
          ['Início do curso', 'Abril de 2027'],
        ],
      },
    },
    {
      chave: 'disposicoes-finais',
      titulo: 'DAS DISPOSIÇÕES FINAIS',
      itens: [
        '6.1. As datas e os quantitativos deste Edital são preliminares e poderão ser alterados até a publicação da versão definitiva.',
        '6.2. A ausência injustificada a qualquer etapa implica eliminação automática.',
        '6.3. Os casos omissos serão resolvidos pela comissão de seleção do BPRONE.',
        '6.4. Este Edital entra em vigor na data de sua publicação.',
      ],
    },
  ],
  assinaturas: [
    { nome: 'Batalhão de Rondas Ostensivas de Natureza Especial', cargo: 'Comandante do BPRONE' },
    { nome: 'Comissão de Seleção BPRONE', cargo: 'Presidente da Comissão de Seleção' },
  ],
  rodape: RODAPE_PADRAO,
  versao: '0.9 (preliminar)',
  atualizadoEm: '10/11/2026',
};

export const DOCUMENTOS: DocumentoEdital[] = [PMPR_SOLDADO, ROTAM, RONE];

export const getDocumento = (editalId: string) => DOCUMENTOS.find((d) => d.editalId === editalId);
