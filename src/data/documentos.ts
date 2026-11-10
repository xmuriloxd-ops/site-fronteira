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

export const DOCUMENTOS: DocumentoEdital[] = [PMPR_SOLDADO];


export const getDocumento = (editalId: string) => DOCUMENTOS.find((d) => d.editalId === editalId);
