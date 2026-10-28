/**
 * Conteúdo inicial do portal ROTAM GOIÁS · GTA RP.
 *
 * Estes dados são usados apenas na primeira execução do servidor
 * (quando a pasta `data/` ainda não existe). Depois disso, tudo é
 * gerenciado pelo painel administrativo.
 *
 * Todo o conteúdo é ficcional e faz parte de um servidor de roleplay.
 */

export interface SeedPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  location?: string;
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SeedPhoto {
  id: string;
  url: string;
  caption: string;
  tag: string;
  author: string;
  createdAt: string;
}

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

export const seedPosts: SeedPost[] = [
  {
    id: 'post-raio-imortal',
    slug: 'operacao-raio-imortal-capital',
    title: 'ROTAM deflagra Operação Raio Imortal e fecha quatro pontos de tráfico na Capital',
    category: 'Operação',
    excerpt:
      'Ação conjunta do Batalhão ROTAM com a inteligência do 1º CRPM resultou na desarticulação de uma rede de distribuição de entorpecentes na região central de Goiânia.',
    content: `A madrugada desta sexta-feira marcou mais uma investida do **Batalhão de Rondas Ostensivas Táticas Metropolitanas (ROTAM)** contra o crime organizado na Capital. A **Operação Raio Imortal** mobilizou seis viaturas táticas e vinte e quatro operadores em um cerco coordenado a quatro imóveis apontados como pontos de distribuição de entorpecentes.

## Como a operação foi conduzida

O levantamento de inteligência começou há três semanas, com o acompanhamento de veículos suspeitos e a identificação de rotas de abastecimento na zona central. Na madrugada da ação, os pelotões se dividiram em quatro frentes simultâneas:

- **Frente Norte:** bloqueio de vias de fuga com apoio de cerco tático.
- **Frente Central:** entrada nos imóveis após leitura de mandados.
- **Frente Sul:** interceptação de um veículo de transporte de entorpecentes.
- **Apoio Aéreo:** monitoramento e repasse de informações em tempo real.

## Resultados

A operação terminou com **oito prisões em flagrante**, apreensão de cinco armas de fogo, munições de diversos calibres e aproximadamente **340 kg de entorpecentes**. Três veículos com registro de roubo foram recuperados e devolvidos aos proprietários.

> "A doutrina ROTAM é feita de precisão. Cada equipe sabia exatamente onde entrar, quando entrar e como sair. O resultado é esse: nenhum operador ferido e a cidade mais segura." — Comando do Batalhão ROTAM

## Próximos passos

O material apreendido foi encaminhado para perícia e a investigação segue sob responsabilidade da delegacia especializada. Novas fases da operação estão previstas para as próximas semanas, com foco no Entorno Sul da Capital.

A ROTAM reforça que denúncias podem ser feitas de forma anônima pelos canais oficiais do batalhão.`,
    coverImage: '/img/hero-operacao.jpg',
    author: 'Assessoria de Comunicação · ROTAM',
    location: 'Goiânia · GO',
    featured: true,
    published: true,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: 'post-curso-22',
    slug: '22-curso-operacional-rotam',
    title: '22º Curso Operacional de ROTAM forma 45 novos operadores do Raio Imortal',
    category: 'Curso',
    excerpt:
      'Após onze semanas de instrução intensiva, 45 policiais concluíram o curso mais exigente da corporação e passam a integrar o efetivo do Batalhão ROTAM.',
    content: `Onze semanas. Mais de 600 horas de instrução. Um único objetivo: formar operadores capazes de atuar na linha de frente do patrulhamento tático.

## A grade de instrução

O 22º Curso Operacional de ROTAM reuniu policiais de nove unidades da corporação em um programa que combina técnica, condicionamento e doutrina:

- **Tiro tático** defensivo e ofensivo, em cenários reais de confronto.
- **Abordagem de alto risco** e controle de veículos.
- **Progressão em ambiente confinado** e resgate tático.
- **Direito aplicado à atividade policial** e uso diferenciado da força.
- **Educação física** diária, com testes eliminatórios de resistência.

## O padrão ROTAM

A avaliação final aconteceu em um cenário de ocorrência complexa, com o emprego de múltiplas equipes, reféns simulados e comunicação de rádio sob pressão. Dos 62 candidatos que iniciaram a jornada, **45 concluíram** o curso.

> "Aqui não se forma apenas um policial melhor preparado. Forma-se um operador que entende que a força precisa vir sempre acompanhada de técnica e legalidade." — Instrutor-chefe do curso

## A nova tropa

Os formandos agora passam por um período de adaptação operacional, atuando ao lado de pelotões veteranos antes de assumir viaturas próprias. A próxima turma já tem data prevista para o início das instruções.`,
    coverImage: '/img/galeria/curso-operacional.jpg',
    author: 'Núcleo de Ensino · ROTAM',
    location: 'Goiânia · GO',
    featured: false,
    published: true,
    createdAt: daysAgo(6),
    updatedAt: daysAgo(6),
  },
  {
    id: 'post-formatura',
    slug: 'formatura-tropa-raio-imortal',
    title: 'Formatura da tropa: novos guerreiros recebem o brevê do Raio Imortal',
    category: 'Formatura',
    excerpt:
      'Cerimônia no pátio do batalhão marcou a entrega dos brevês aos novos operadores, em noite de reconhecimento às famílias e à tropa.',
    content: `O pátio do batalhão ficou pequeno para a cerimônia de formatura da nova turma de operadores ROTAM. Familiares, autoridades e veteranos acompanharam a entrega dos brevês — símbolo máximo do pertencimento à tropa.

## A heráldica do brevê

O brevê ROTAM carrega um significado que todo formando aprende antes mesmo de recebê-lo:

- O **raio vermelho** representa energia, precisão, força e rapidez.
- A **sigla ROTAM em amarelo-ouro** sobre o raio simboliza ocorrências e atuação de destaque.
- O **contorno vermelho** indica os limites da legalidade, mesmo diante do risco.

## Discurso do comando

Em sua fala, o comandante destacou que o brevê não é um distintivo de vaidade, mas um compromisso: *"quem carrega o raio no peito carrega junto a responsabilidade de ser o primeiro a chegar e o último a sair."*

A cerimônia terminou com o desfile da tropa formada e a tradicional saudação entre veteranos e novos operadores.`,
    coverImage: '/img/galeria/formatura-tropa.jpg',
    author: 'Assessoria de Comunicação · ROTAM',
    location: 'Goiânia · GO',
    featured: false,
    published: true,
    createdAt: daysAgo(9),
    updatedAt: daysAgo(9),
  },
  {
    id: 'post-br060',
    slug: 'apreensao-br-060',
    title: 'Apreensão recorde: 1,2 tonelada de entorpecentes é interceptada na BR-060',
    category: 'Operação',
    excerpt:
      'Bloqueio tático na saída da Capital terminou com dois presos e a maior apreensão da história recente do batalhão.',
    content: `Um bloqueio tático montado por equipes da ROTAM na BR-060, saída para o Entorno Sul, resultou na maior apreensão de entorpecentes dos últimos anos.

## A interceptação

A ação começou com a informação de que um veículo de carga seguia em direção à Capital com documentação inconsistente. Os operadores montaram um bloqueio escalonado e abordaram o veículo ainda no trevo de acesso.

Durante a inspeção, a equipe localizou compartimentos ocultos no assoalho da carroceria. **1,2 tonelada de entorpecentes** estava distribuída em fardos prensados.

## Ocorrência

- Dois homens presos em flagrante.
- Um veículo de carga apreendido.
- Entorpecentes encaminhados à perícia.
- Documentação falsa encaminhada à Polícia Federal.

A operação foi concluída sem troca de tiros e sem feridos entre operadores e civis.`,
    coverImage: '/img/galeria/ocorrencia-rodovia.jpg',
    author: 'Assessoria de Comunicação · ROTAM',
    location: 'BR-060 · GO',
    featured: false,
    published: true,
    createdAt: daysAgo(13),
    updatedAt: daysAgo(13),
  },
  {
    id: 'post-entorno-sul',
    slug: 'patrulhamento-entorno-sul',
    title: 'ROTAM amplia patrulhamento tático no Entorno Sul da Região Metropolitana',
    category: 'Notícia',
    excerpt:
      'Novo plano operacional leva viaturas do batalhão a bairros com maior índice de crimes contra o patrimônio.',
    content: `A partir desta semana, o patrulhamento tático da ROTAM passa a cobrir novas áreas do Entorno Sul da Região Metropolitana de Goiânia. A decisão foi tomada com base nos índices de criminalidade das últimas oito semanas.

## Como funciona o patrulhamento tático

Diferente do policiamento ostensivo tradicional, o patrulhamento tático móvel atua em apoio às viaturas de área, com foco em:

- Crimes contra o patrimônio (roubo a transeuntes, comércios e veículos).
- Enfrentamento de grupos armados.
- Apoio em ocorrências de alto risco.
- Ações de saturação em horários críticos.

## Efetivo empregado

Duas equipes adicionais foram empregadas no período noturno, com viaturas equipadas para apoio imediato. A população pode acompanhar as ações pelos canais oficiais do batalhão.

A ROTAM reforça que o canal de denúncias segue aberto 24 horas.`,
    coverImage: '/img/galeria/operacao-viatura.jpg',
    author: 'Seção de Operações · ROTAM',
    location: 'Entorno Sul · GO',
    featured: false,
    published: true,
    createdAt: daysAgo(18),
    updatedAt: daysAgo(18),
  },
  {
    id: 'post-edital',
    slug: 'edital-efetivo-rotam',
    title: 'Comunicado: processo seletivo interno para o efetivo ROTAM',
    category: 'Comunicado',
    excerpt:
      'Inscrições abertas para policiais interessados em integrar o Batalhão de Rondas Ostensivas Táticas Metropolitanas.',
    content: `O Comando do Batalhão ROTAM comunica a abertura do **processo seletivo interno** para composição de novas equipes de patrulhamento tático.

## Requisitos

- Estar em efetivo exercício na corporação há, no mínimo, dois anos.
- Não responder a procedimento disciplinar em andamento.
- Aptidão física comprovada em teste de condicionamento.
- Disponibilidade para regime de escala operacional e cursos de especialização.

## Etapas do certame

- **Etapa 1:** avaliação física eliminatória.
- **Etapa 2:** prova de tiro tático.
- **Etapa 3:** entrevista e avaliação psicológica.
- **Etapa 4:** análise de conduta e documental.

As inscrições podem ser feitas diretamente na seção de pessoal do batalhão, no período definido no boletim interno. Dúvidas devem ser encaminhadas ao canal oficial da unidade.`,
    coverImage: '/img/galeria/auditorio-curso.jpg',
    author: 'Comando ROTAM',
    location: 'Goiânia · GO',
    featured: false,
    published: true,
    createdAt: daysAgo(24),
    updatedAt: daysAgo(24),
  },
  {
    id: 'post-instrucao-choque',
    slug: 'instrucao-controle-disturbios',
    title: 'Instrução de choque: treinamento noturno simula controle de distúrbios',
    category: 'Curso',
    excerpt:
      'Com emprego de efeito moral e cerimonial pirotécnico, a tropa treinou progressão noturna e controle de multidão.',
    content: `A noite de instrução começou com a leitura do cenário e terminou com a tropa formada em silêncio. Durante quatro horas, os operadores simularam o controle de distúrbios em área urbana, com emprego de equipamentos de efeito moral.

## Objetivos do treinamento

- Manter a coesão da tropa sob forte estresse visual e sonoro.
- Praticar progressão noturna com baixa visibilidade.
- Aplicar protocolos de uso diferenciado da força.
- Coordenar comunicação de rádio em cenário dinâmico.

## A doutrina por trás da técnica

Toda instrução de choque da ROTAM começa pelo estudo da legalidade. Antes de qualquer disparo de efeito moral, o operador precisa saber responder *por que*, *quando* e *até onde* pode agir.

> "O equipamento é o mesmo para todos. O diferencial do operador ROTAM é saber exatamente o momento de usar e o momento de parar." — Instrutor de controle de distúrbios

O ciclo de instruções segue ao longo de todo o ano e é obrigatório para a manutenção do brevê.`,
    coverImage: '/img/galeria/instrucao-tatica.jpg',
    author: 'Núcleo de Ensino · ROTAM',
    location: 'Goiânia · GO',
    featured: false,
    published: true,
    createdAt: daysAgo(31),
    updatedAt: daysAgo(31),
  },
  {
    id: 'post-raiadinho',
    slug: 'projeto-raiadinho-comunidade',
    title: 'ROTAM e comunidade: projeto leva crianças ao batalhão no Dia das Crianças',
    category: 'Notícia',
    excerpt:
      'Visita guiada, exposição de viaturas e muita brincadeira marcaram o encontro entre a tropa e os pequenos moradores do Entorno.',
    content: `O portão do batalhão se abriu para um público diferente: crianças de comunidades atendidas pelos projetos sociais da região. O evento faz parte da aproximação da tropa com a população, uma das diretrizes do comando.

## Programação

- Exposição de viaturas e equipamentos.
- Apresentação da tropa de choque.
- Oficina de educação no trânsito.
- Lanche e entrega de material escolar.

## A tropa também é da comunidade

> "Quem protege precisa ser reconhecido pela comunidade. Uma criança que conhece o batalhão hoje é uma criança que confia na polícia amanhã." — Coordenador social do evento

A ação deve se repetir no fim do ano, com ampliação do número de vagas e participação de outras unidades da corporação.`,
    coverImage: '/img/galeria/curso-capacetes.jpg',
    author: 'Setor de Comunicação Social · ROTAM',
    location: 'Goiânia · GO',
    featured: false,
    published: true,
    createdAt: daysAgo(38),
    updatedAt: daysAgo(38),
  },
];

export const seedPhotos: SeedPhoto[] = [
  {
    id: 'foto-01',
    url: '/img/hero-operacao.jpg',
    caption: 'Operador do Raio Imortal em posição de patrulhamento noturno.',
    tag: 'Operacional',
    author: 'Comunicação ROTAM',
    createdAt: daysAgo(2),
  },
  {
    id: 'foto-02',
    url: '/img/galeria/formatura-tropa.jpg',
    caption: 'Tropa formada em desfile noturno após a cerimônia de formatura.',
    tag: 'Formatura',
    author: 'Comunicação ROTAM',
    createdAt: daysAgo(9),
  },
  {
    id: 'foto-03',
    url: '/img/galeria/curso-operacional.jpg',
    caption: 'Formandos do 22º Curso Operacional durante a leitura do certame.',
    tag: 'Curso',
    author: 'Núcleo de Ensino',
    createdAt: daysAgo(6),
  },
  {
    id: 'foto-04',
    url: '/img/galeria/instrucao-tatica.jpg',
    caption: 'Instrução noturna com emprego de efeito moral e baixa visibilidade.',
    tag: 'Treinamento',
    author: 'Núcleo de Ensino',
    createdAt: daysAgo(31),
  },
  {
    id: 'foto-05',
    url: '/img/galeria/curso-capacetes.jpg',
    caption: 'Operador com capacete COE durante instrução de choque.',
    tag: 'Treinamento',
    author: 'Núcleo de Ensino',
    createdAt: daysAgo(38),
  },
  {
    id: 'foto-06',
    url: '/img/galeria/operacao-viatura.jpg',
    caption: 'Equipe do batalhão durante solenidade de entrega de equipamentos.',
    tag: 'Operacional',
    author: 'Comunicação ROTAM',
    createdAt: daysAgo(18),
  },
  {
    id: 'foto-07',
    url: '/img/galeria/tropa-formatura.jpg',
    caption: 'Operadores posicionados junto ao símbolo do batalhão.',
    tag: 'Formatura',
    author: 'Comunicação ROTAM',
    createdAt: daysAgo(45),
  },
  {
    id: 'foto-08',
    url: '/img/galeria/auditorio-curso.jpg',
    caption: 'Abertura do curso operacional com a presença da tropa e instrutores.',
    tag: 'Curso',
    author: 'Núcleo de Ensino',
    createdAt: daysAgo(24),
  },
];

export const defaultSettings = {
  siteName: 'ROTAM GOIÁS',
  unit: 'Batalhão de Rondas Ostensivas Táticas Metropolitanas',
  server: 'GTA RP · Goiânia',
  heroTitle: 'Raio Imortal',
  heroSubtitle:
    'Patrulhamento tático, doutrina e disciplina. O portfólio operacional da tropa de pronto-emprego que atua nas ruas da capital no roleplay.',
  about:
    'Unidade de pronto-emprego e reserva tática especial, a ROTAM atua no patrulhamento tático móvel, no apoio a ocorrências de alto risco e no enfrentamento ao crime organizado. No servidor de roleplay, o batalhão mantém a mesma doutrina da unidade real: técnica, legalidade e presença.',
  instagram: 'https://instagram.com/rotam_pmgo',
  discord: '',
  email: 'comunicacao@rotam-go.gta',
  whatsapp: '',
  heroImage: '/img/hero-operacao.jpg',
  foundedYear: '1981',
};
