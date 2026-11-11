/**
 * Mapa de tudo que o administrador pode editar no site.
 *
 * Os arquivos de ../site nunca são alterados. Cada campo abaixo aponta para o
 * lugar exato onde o texto aparece no arquivo original; na hora de entregar a
 * página, o servidor troca só aquele trecho pelo valor que o administrador
 * escreveu (ver conteudo.mjs). O texto original de cada campo é lido do
 * próprio arquivo, não fica repetido aqui.
 *
 * O que este projeto mudou em relação ao site copiado também está aqui:
 *   - `padrao` em um campo = o texto que o site usa no lugar do que veio na
 *     cópia (hoje, os créditos). Para o painel, esse é o texto "original" do
 *     campo: é para ele que "Voltar ao original" e "Restaurar o site original"
 *     voltam. O administrador continua podendo trocar pelo painel.
 *   - OPCOES_PADRAO, no fim do arquivo: o que vem ligado ou desligado (o
 *     convite no início da página de regras, a aba Admin...).
 *
 * Como um "local" é descrito:
 *   { arquivo: 'js', apos, chave }   texto dentro do aplicativo de regras:
 *       `apos`  = trecho único do arquivo que vem antes do texto;
 *       `chave` = o que vem colado antes da aspa de abertura do texto.
 *   { arquivo: 'js', modelo: [antes, valor, depois] }
 *       texto dentro de um modelo (entre crases) do aplicativo.
 *   { arquivo: 'index' | 'convite', antes, depois, escape }
 *       texto dentro do HTML, entre `antes` e `depois`.
 *   `prefixo` = parte fixa colada antes do valor (ex.: "mailto:").
 */

export const ARQUIVOS = {
  js: 'assets/index-FbaU4KfD.js',
  index: 'index.html',
  convite: 'convite/index.html',
  manifesto: '__manus/pwa/manifest.webmanifest',
  robots: 'robots.txt',
  sitemap: 'sitemap.xml',
};

/** Endereço do site original, que aparece nos links de compartilhamento. */
export const ORIGEM_ORIGINAL = 'https://fronteirasul-fmudazpm.manus.space';

/** Imagens que podem ser trocadas, e em que endereços do site cada uma aparece. */
export const IMAGENS = [
  {
    id: 'convite',
    rotulo: 'Imagem do convite',
    ajuda: 'Aparece no início da página de regras, na página do convite e na prévia quando o link é colado no Discord ou no WhatsApp. O ideal é 1200 × 675.',
    caminhos: ['/fronteira-sul-convite-preview.jpg'],
  },
  {
    id: 'logo',
    rotulo: 'Logo',
    ajuda: 'Aparece no topo e na abertura da página de regras. Prefira uma imagem com fundo transparente (PNG ou WebP).',
    caminhos: ['/manus-storage/fronteira-sul-logo_1b1b4c2d.webp', '/fronteira-sul-logo.webp'],
  },
  {
    id: 'icone',
    rotulo: 'Ícone da aba do navegador',
    ajuda: 'Se você não enviar um ícone, o site usa o logo.',
    caminhos: ['/favicon.ico'],
    herda: 'logo',
  },
];

const H = (n) => `"data-loc":"client/src/pages/Home.tsx:${n}"`;
const NF = (n) => `"data-loc":"client/src/pages/NotFound.tsx:${n}"`;
const EB = (n) => `"data-loc":"client/src/components/ErrorBoundary.tsx:${n}"`;

/** Local dentro do aplicativo de regras. */
const js = (apos, chave = 'children:', extra = {}) => ({ arquivo: 'js', apos, chave, ...extra });
/** Atributo de uma tag do HTML. */
const attr = (arquivo, antes) => ({ arquivo, antes, depois: '"', escape: 'attr' });
/** Texto entre duas tags do HTML. */
const texto = (arquivo, antes, depois) => ({ arquivo, antes, depois, escape: 'texto' });

const meta = (arquivo, nome) => attr(arquivo, `<meta ${nome.startsWith('og:') ? 'property' : 'name'}="${nome}" content="`);

/**
 * Campos de texto. `tipo`: 'curto' (uma linha), 'longo' (caixa maior),
 * 'link', 'email' ou 'telefone'. `seVazioEsconde`: seletor CSS do bloco que
 * some da página quando o campo fica vazio. `padrao`: o texto deste projeto,
 * quando é diferente do que veio na cópia (vazio = a linha não aparece).
 */
export const CAMPOS = [
  // ───────────── Página de regras: barra do topo ─────────────
  { id: 'regras.topo.menu', pagina: 'regras', grupo: 'Barra do topo', rotulo: 'Menu de seções', locais: [js(H(293))] },
  { id: 'regras.topo.busca', pagina: 'regras', grupo: 'Barra do topo', rotulo: 'Campo de busca (texto de exemplo)', locais: [js(H(308), 'placeholder:')] },
  { id: 'regras.topo.botaoBusca', pagina: 'regras', grupo: 'Barra do topo', rotulo: 'Botão de busca', locais: [js(H(341))] },
  { id: 'regras.topo.semResultados', pagina: 'regras', grupo: 'Barra do topo', rotulo: 'Aviso quando a busca não acha nada', locais: [js(H(326), '`:')] },

  // ───────────── Abas ─────────────
  { id: 'regras.abas.geral', pagina: 'regras', grupo: 'Abas', rotulo: 'Aba do regulamento', locais: [js(H(376))] },
  { id: 'regras.abas.policia', pagina: 'regras', grupo: 'Abas', rotulo: 'Aba da polícia', locais: [js(H(391))] },

  // ───────────── Abertura ─────────────
  { id: 'regras.abertura.sobretitulo', pagina: 'regras', grupo: 'Abertura', rotulo: 'Linha pequena acima do título', locais: [js(H(417), '}),')] },
  { id: 'regras.abertura.titulo1', pagina: 'regras', grupo: 'Abertura', rotulo: 'Título, primeira linha', locais: [js(H(419), 'children:[')] },
  { id: 'regras.abertura.titulo2', pagina: 'regras', grupo: 'Abertura', rotulo: 'Título, segunda linha (dourada)', locais: [js(H(422))] },
  { id: 'regras.abertura.texto', pagina: 'regras', grupo: 'Abertura', rotulo: 'Texto de apresentação', tipo: 'longo', locais: [js(H(424))] },
  {
    id: 'regras.abertura.nota',
    pagina: 'regras',
    grupo: 'Abertura',
    rotulo: 'Frase depois do número de seções',
    ajuda: 'O número de seções é contado sozinho e aparece antes desta frase.',
    locais: [js(H(431), 'tl.length,')],
  },
  { id: 'regras.abertura.emblemaAcima', pagina: 'regras', grupo: 'Abertura', rotulo: 'Texto acima do logo', locais: [js(H(437))] },
  { id: 'regras.abertura.emblemaAbaixo', pagina: 'regras', grupo: 'Abertura', rotulo: 'Texto abaixo do logo', locais: [js(H(439))] },

  // ───────────── Índice ─────────────
  { id: 'regras.indice.numero', pagina: 'regras', grupo: 'Índice', rotulo: 'Número ao lado do título', locais: [js(H(449))] },
  { id: 'regras.indice.sobretitulo', pagina: 'regras', grupo: 'Índice', rotulo: 'Linha pequena acima do título', locais: [js(H(451))] },
  { id: 'regras.indice.titulo', pagina: 'regras', grupo: 'Índice', rotulo: 'Título', locais: [js(H(452))] },
  { id: 'regras.indice.dica', pagina: 'regras', grupo: 'Índice', rotulo: 'Dica no fim do índice', tipo: 'longo', locais: [js(H(479))] },

  // ───────────── Cabeçalho do regulamento ─────────────
  { id: 'regras.leitura.sobretitulo', pagina: 'regras', grupo: 'Cabeçalho do regulamento', rotulo: 'Linha pequena acima do título', locais: [js(H(489))] },
  { id: 'regras.leitura.titulo', pagina: 'regras', grupo: 'Cabeçalho do regulamento', rotulo: 'Título', locais: [js(H(490))] },
  { id: 'regras.leitura.selo', pagina: 'regras', grupo: 'Cabeçalho do regulamento', rotulo: 'Selo à direita', locais: [js(H(493), '}),')] },
  {
    id: 'regras.leitura.prefixoSecao',
    pagina: 'regras',
    grupo: 'Cabeçalho do regulamento',
    rotulo: 'Palavra antes do número de cada seção',
    ajuda: 'Aparece como "SEÇÃO 01", "SEÇÃO 02"...',
    locais: [js(H(746), 'children:[')],
  },

  // ───────────── Destaque ─────────────
  { id: 'regras.destaque.rotulo', pagina: 'regras', grupo: 'Destaque no começo do regulamento', rotulo: 'Linha pequena', locais: [js(H(506))] },
  { id: 'regras.destaque.titulo', pagina: 'regras', grupo: 'Destaque no começo do regulamento', rotulo: 'Título', locais: [js(H(507))] },
  { id: 'regras.destaque.texto', pagina: 'regras', grupo: 'Destaque no começo do regulamento', rotulo: 'Texto', tipo: 'longo', locais: [js(H(510))] },
  { id: 'regras.destaque.marca1', pagina: 'regras', grupo: 'Destaque no começo do regulamento', rotulo: 'Marca à direita, linha de cima', locais: [js(H(518), 'children:[')] },
  { id: 'regras.destaque.marca2', pagina: 'regras', grupo: 'Destaque no começo do regulamento', rotulo: 'Marca à direita, linha de baixo', locais: [js(H(520), '}),')] },

  // ───────────── Créditos ─────────────
  { id: 'regras.creditos.sobretitulo', pagina: 'regras', grupo: 'Créditos (fim da página)', rotulo: 'Linha pequena acima do título', locais: [js(H(537))] },
  { id: 'regras.creditos.titulo', pagina: 'regras', grupo: 'Créditos (fim da página)', rotulo: 'Título', locais: [js(H(538))] },
  { id: 'regras.creditos.texto', pagina: 'regras', grupo: 'Créditos (fim da página)', rotulo: 'Texto', tipo: 'longo', locais: [js(H(539))] },
  {
    id: 'regras.creditos.nome',
    pagina: 'regras',
    grupo: 'Créditos (fim da página)',
    rotulo: 'Nome',
    ajuda: 'Deixe vazio para esconder.',
    seVazioEsconde: '.author-details > .author-name',
    padrao: 'MURILO MENDES',
    locais: [js(H(545))],
  },
  { id: 'regras.creditos.rotuloDiscord', pagina: 'regras', grupo: 'Créditos (fim da página)', rotulo: 'Discord: nome da linha', locais: [js(H(547))] },
  {
    id: 'regras.creditos.discord',
    pagina: 'regras',
    grupo: 'Créditos (fim da página)',
    rotulo: 'Discord: usuário',
    ajuda: 'É também o texto copiado quando o visitante clica. Deixe vazio para esconder a linha.',
    seVazioEsconde: '.author-details > .contact-row:nth-child(2)',
    padrao: 'sgtmendes1997_29726',
    locais: [js(H(548), 'children:['), js('navigator.clipboard.writeText(', '')],
  },
  { id: 'regras.creditos.copiar', pagina: 'regras', grupo: 'Créditos (fim da página)', rotulo: 'Discord: descrição do botão de copiar', locais: [js(H(555), 'p?"Copiado":')] },
  {
    id: 'regras.creditos.copiado',
    pagina: 'regras',
    grupo: 'Créditos (fim da página)',
    rotulo: 'Discord: aviso depois de copiar',
    locais: [js(H(559), 'children:p?'), js(H(555), 'children:p?')],
  },
  { id: 'regras.creditos.rotuloTelefone', pagina: 'regras', grupo: 'Créditos (fim da página)', rotulo: 'Telefone: nome da linha', locais: [js(H(564))] },
  {
    id: 'regras.creditos.telefone',
    pagina: 'regras',
    grupo: 'Créditos (fim da página)',
    rotulo: 'Telefone: número',
    tipo: 'telefone',
    ajuda: 'Deixe vazio para esconder a linha.',
    seVazioEsconde: '.author-details > .contact-row:nth-child(3)',
    padrao: '',
    locais: [js(H(565)), js(H(565), 'href:', { prefixo: 'tel:', transformar: 'telefone' })],
  },
  { id: 'regras.creditos.rotuloEmail', pagina: 'regras', grupo: 'Créditos (fim da página)', rotulo: 'E-mail: nome da linha', locais: [js(H(568))] },
  {
    id: 'regras.creditos.email',
    pagina: 'regras',
    grupo: 'Créditos (fim da página)',
    rotulo: 'E-mail: endereço',
    tipo: 'email',
    ajuda: 'Deixe vazio para esconder a linha.',
    seVazioEsconde: '.author-details > .contact-row:nth-child(4)',
    padrao: '',
    locais: [js(H(569)), js(H(569), 'href:', { prefixo: 'mailto:' })],
  },
  { id: 'regras.creditos.final1', pagina: 'regras', grupo: 'Créditos (fim da página)', rotulo: 'Frase final, primeira parte', locais: [js(H(575), 'children:[')] },
  { id: 'regras.creditos.finalSeparador', pagina: 'regras', grupo: 'Créditos (fim da página)', rotulo: 'Frase final, separador', locais: [js(H(576))] },
  { id: 'regras.creditos.final2', pagina: 'regras', grupo: 'Créditos (fim da página)', rotulo: 'Frase final, segunda parte', locais: [js(H(576), '}),')] },

  // ───────────── Polícia ─────────────
  { id: 'regras.policia.sobretitulo', pagina: 'policia', grupo: 'Abertura da aba', rotulo: 'Linha pequena acima do título', locais: [js(H(589))] },
  { id: 'regras.policia.titulo', pagina: 'policia', grupo: 'Abertura da aba', rotulo: 'Título', locais: [js(H(590))] },
  { id: 'regras.policia.texto', pagina: 'policia', grupo: 'Abertura da aba', rotulo: 'Texto', tipo: 'longo', locais: [js(H(591))] },
  { id: 'regras.policia.tituloMultas', pagina: 'policia', grupo: 'Multas', rotulo: 'Título das multas', locais: [js(H(601))] },
  { id: 'regras.policia.nota', pagina: 'policia', grupo: 'Multas', rotulo: 'Observação abaixo do título', locais: [js(',PA=', '')] },
  { id: 'regras.policia.colunaInfracao', pagina: 'policia', grupo: 'Multas', rotulo: 'Nome da 1ª coluna', locais: [js(H(619))] },
  { id: 'regras.policia.colunaValor', pagina: 'policia', grupo: 'Multas', rotulo: 'Nome da 2ª coluna', locais: [js(H(620))] },
  { id: 'regras.policia.colunaPontos', pagina: 'policia', grupo: 'Multas', rotulo: 'Nome da 3ª coluna', locais: [js(H(621))] },
  {
    id: 'regras.policia.abreviacaoPontos',
    pagina: 'policia',
    grupo: 'Multas',
    rotulo: 'Abreviação de "pontos" na tabela',
    locais: [
      { arquivo: 'js', modelo: ['${$.points} ', 'pts', '`'] },
      { arquivo: 'js', modelo: ['${r.points} ', 'pts', '`'] },
    ],
  },
  {
    id: 'regras.policia.semPontos',
    pagina: 'policia',
    grupo: 'Multas',
    rotulo: 'O que aparece quando a multa não tem pontos',
    locais: [js('$.points===void 0?', ''), js('r.points===void 0?', '')],
  },
  {
    id: 'regras.policia.tituloAplicacao',
    pagina: 'policia',
    grupo: 'Listas',
    rotulo: 'Título da primeira lista',
    locais: [js(H(678)), js('id:"police-application",title:', '')],
  },
  {
    id: 'regras.policia.tituloCnh',
    pagina: 'policia',
    grupo: 'Listas',
    rotulo: 'Título da segunda lista',
    locais: [js(H(700)), js('id:"police-cnh",title:', '')],
  },

  // ───────────── Página não encontrada e erro ─────────────
  { id: 'regras.naoEncontrada.numero', pagina: 'regras', grupo: 'Página não encontrada', rotulo: 'Número grande', locais: [js(NF(44))] },
  { id: 'regras.naoEncontrada.titulo', pagina: 'regras', grupo: 'Página não encontrada', rotulo: 'Título', locais: [js(NF(46))] },
  { id: 'regras.naoEncontrada.texto1', pagina: 'regras', grupo: 'Página não encontrada', rotulo: 'Texto, primeira linha', locais: [js(NF(50), 'children:[')] },
  { id: 'regras.naoEncontrada.texto2', pagina: 'regras', grupo: 'Página não encontrada', rotulo: 'Texto, segunda linha', locais: [js(NF(52), '}),')] },
  { id: 'regras.naoEncontrada.botao', pagina: 'regras', grupo: 'Página não encontrada', rotulo: 'Botão', locais: [js(NF(64), '}),')] },
  { id: 'regras.erro.titulo', pagina: 'regras', grupo: 'Tela de erro', rotulo: 'Mensagem', locais: [js(EB(34))] },
  { id: 'regras.erro.botao', pagina: 'regras', grupo: 'Tela de erro', rotulo: 'Botão', locais: [js(EB(50), '}),')] },

  // ───────────── Textos lidos por leitores de tela ─────────────
  { id: 'regras.acess.marca', pagina: 'regras', grupo: 'Leitores de tela (não aparecem na tela)', rotulo: 'Link do logo no topo', locais: [js(H(278), '"aria-label":')] },
  { id: 'regras.acess.logoTopo', pagina: 'regras', grupo: 'Leitores de tela (não aparecem na tela)', rotulo: 'Descrição do logo no topo', locais: [js(H(283), 'alt:')] },
  { id: 'regras.acess.logoAbertura', pagina: 'regras', grupo: 'Leitores de tela (não aparecem na tela)', rotulo: 'Descrição do logo na abertura', locais: [js(H(438), 'alt:')] },
  { id: 'regras.acess.menu', pagina: 'regras', grupo: 'Leitores de tela (não aparecem na tela)', rotulo: 'Menu de seções', locais: [js(H(287))] },
  { id: 'regras.acess.menuDescricao', pagina: 'regras', grupo: 'Leitores de tela (não aparecem na tela)', rotulo: 'Menu de seções (descrição)', locais: [js(H(288), '"aria-label":')] },
  { id: 'regras.acess.busca', pagina: 'regras', grupo: 'Leitores de tela (não aparecem na tela)', rotulo: 'Campo de busca', locais: [js(H(305))] },
  { id: 'regras.acess.primeiroResultado', pagina: 'regras', grupo: 'Leitores de tela (não aparecem na tela)', rotulo: 'Botão de busca', locais: [js(H(336), '"aria-label":')] },
  { id: 'regras.acess.setas', pagina: 'regras', grupo: 'Leitores de tela (não aparecem na tela)', rotulo: 'Grupo das setas de resultado', locais: [js(H(344), '"aria-label":')] },
  { id: 'regras.acess.anterior', pagina: 'regras', grupo: 'Leitores de tela (não aparecem na tela)', rotulo: 'Seta para o resultado anterior', locais: [js(H(348), '"aria-label":')] },
  { id: 'regras.acess.anteriorDica', pagina: 'regras', grupo: 'Leitores de tela (não aparecem na tela)', rotulo: 'Seta anterior (dica ao passar o mouse)', locais: [js(H(348), 'title:')] },
  { id: 'regras.acess.proxima', pagina: 'regras', grupo: 'Leitores de tela (não aparecem na tela)', rotulo: 'Seta para o próximo resultado', locais: [js(H(357), '"aria-label":')] },
  { id: 'regras.acess.proximaDica', pagina: 'regras', grupo: 'Leitores de tela (não aparecem na tela)', rotulo: 'Seta próxima (dica ao passar o mouse)', locais: [js(H(357), 'title:')] },
  { id: 'regras.acess.abas', pagina: 'regras', grupo: 'Leitores de tela (não aparecem na tela)', rotulo: 'Grupo das abas', locais: [js(H(371), '"aria-label":')] },
  { id: 'regras.acess.indice', pagina: 'regras', grupo: 'Leitores de tela (não aparecem na tela)', rotulo: 'Índice', locais: [js(H(444), '"aria-label":')] },
  {
    id: 'regras.acess.ocorrencia',
    pagina: 'regras',
    grupo: 'Leitores de tela (não aparecem na tela)',
    rotulo: 'Palavra antes do número de cada resultado da busca',
    locais: [{ arquivo: 'js', modelo: ['"aria-label":`', 'Ocorrência', ' ${d.index+1}`'] }],
  },

  // ───────────── Convite ─────────────
  // Estes textos aparecem na página /convite/ e, com a opção `conviteNoInicio`
  // ligada, também no bloco do início da página de regras (convite-no-inicio.mjs).
  { id: 'convite.sobretitulo', pagina: 'convite', grupo: 'Texto do convite', rotulo: 'Linha pequena acima do título', locais: [texto('convite', '<span class="eyebrow">', '</span>')] },
  { id: 'convite.titulo', pagina: 'convite', grupo: 'Texto do convite', rotulo: 'Título', locais: [texto('convite', '<h1 id="title">', '</h1>')] },
  { id: 'convite.texto', pagina: 'convite', grupo: 'Texto do convite', rotulo: 'Texto', tipo: 'longo', locais: [texto('convite', '<p>', '</p>')] },
  { id: 'convite.botao', pagina: 'convite', grupo: 'Botão', rotulo: 'Texto do botão', locais: [texto('convite', '<a class="button" href="/">', '</a>')] },
  {
    id: 'convite.botaoLink',
    pagina: 'convite',
    grupo: 'Botão',
    rotulo: 'Para onde o botão leva',
    tipo: 'link',
    ajuda: 'Use / para as regras, ou um endereço completo começando com https://. Com /, o botão do início da página de regras desce até as regras. Clicar na imagem faz o mesmo que o botão.',
    locais: [attr('convite', '<a class="button" href="')],
  },
  {
    id: 'convite.imagemDescricao',
    pagina: 'convite',
    grupo: 'Imagem',
    rotulo: 'Descrição da imagem (para quem não consegue ver)',
    tipo: 'longo',
    locais: [attr('convite', '<img class="poster" src="/fronteira-sul-convite-preview.jpg" alt="')],
  },

  // ───────────── Compartilhamento ─────────────
  {
    id: 'compartilhar.convite.titulo',
    pagina: 'compartilhar',
    grupo: 'Página do convite',
    rotulo: 'Título (aba do navegador e prévia do link)',
    locais: [texto('convite', '<title>', '</title>'), meta('convite', 'og:title'), meta('convite', 'twitter:title')],
  },
  { id: 'compartilhar.convite.descricao', pagina: 'compartilhar', grupo: 'Página do convite', rotulo: 'Descrição para buscadores', tipo: 'longo', locais: [meta('convite', 'description')] },
  // No convite, o site original usa textos diferentes para o X (Twitter); por isso são campos separados.
  {
    id: 'compartilhar.convite.previa',
    pagina: 'compartilhar',
    grupo: 'Página do convite',
    rotulo: 'Descrição na prévia do link (Discord, WhatsApp, Facebook)',
    tipo: 'longo',
    locais: [meta('convite', 'og:description')],
  },
  {
    id: 'compartilhar.convite.previaX',
    pagina: 'compartilhar',
    grupo: 'Página do convite',
    rotulo: 'Descrição na prévia do link no X (Twitter)',
    tipo: 'longo',
    locais: [meta('convite', 'twitter:description')],
  },
  {
    id: 'compartilhar.convite.imagem',
    pagina: 'compartilhar',
    grupo: 'Página do convite',
    rotulo: 'Descrição da imagem na prévia (Discord, WhatsApp, Facebook)',
    tipo: 'longo',
    locais: [meta('convite', 'og:image:alt')],
  },
  {
    id: 'compartilhar.convite.imagemX',
    pagina: 'compartilhar',
    grupo: 'Página do convite',
    rotulo: 'Descrição da imagem na prévia no X (Twitter)',
    tipo: 'longo',
    locais: [meta('convite', 'twitter:image:alt')],
  },
  {
    id: 'compartilhar.regras.titulo',
    pagina: 'compartilhar',
    grupo: 'Página de regras',
    rotulo: 'Título (aba do navegador e prévia do link)',
    locais: [texto('index', '<title>', '</title>'), meta('index', 'og:title'), meta('index', 'twitter:title')],
  },
  { id: 'compartilhar.regras.descricao', pagina: 'compartilhar', grupo: 'Página de regras', rotulo: 'Descrição para buscadores', tipo: 'longo', locais: [meta('index', 'description')] },
  {
    id: 'compartilhar.regras.previa',
    pagina: 'compartilhar',
    grupo: 'Página de regras',
    rotulo: 'Descrição na prévia do link',
    tipo: 'longo',
    locais: [meta('index', 'og:description'), meta('index', 'twitter:description')],
  },
  {
    id: 'compartilhar.regras.imagem',
    pagina: 'compartilhar',
    grupo: 'Página de regras',
    rotulo: 'Descrição da imagem na prévia',
    tipo: 'longo',
    locais: [meta('index', 'og:image:alt'), meta('index', 'twitter:image:alt')],
  },
  {
    id: 'compartilhar.nomeDoSite',
    pagina: 'compartilhar',
    grupo: 'Nome do site',
    rotulo: 'Nome do site na prévia do link',
    locais: [meta('index', 'og:site_name'), meta('convite', 'og:site_name')],
  },
  {
    id: 'compartilhar.nomeDoApp',
    pagina: 'compartilhar',
    grupo: 'Nome do site',
    rotulo: 'Nome ao instalar o site no celular',
    locais: [{ arquivo: 'manifesto', chaves: ['name', 'short_name'] }],
  },
];

/** Opções do site, com o valor que cada uma tem enquanto ninguém mexe. */
export const OPCOES_PADRAO = {
  /** Mostra o convite (imagem, texto e botão) no início da página de regras, antes de tudo. */
  conviteNoInicio: true,
  /** Mostra a aba "Admin" ao lado das abas da página de regras. */
  abaAdmin: true,
  /** Mostra o bloco de créditos no fim da página de regras. */
  mostrarCreditos: true,
  /** Mostra o destaque no começo do regulamento. */
  mostrarDestaque: true,
  /** Tira das páginas o selo e as estatísticas da hospedagem original (Manus). */
  removerManus: false,
  /** Endereço público deste site; vazio mantém o endereço do site original nos links de compartilhamento. */
  enderecoPublico: '',
  /** CSS acrescentado às duas páginas. */
  cssExtra: '',
};

/** Opções de ligar e desligar que o painel mostra dentro de um grupo de campos. */
export const INTERRUPTORES = [
  {
    opcao: 'conviteNoInicio',
    pagina: 'convite',
    grupo: 'Texto do convite',
    rotulo: 'Mostrar o convite no início da página de regras',
    ajuda: 'A imagem, o texto e o botão aparecem antes das regras. Desligado, o convite fica só na página /convite/.',
  },
  {
    opcao: 'abaAdmin',
    pagina: 'regras',
    grupo: 'Abas',
    rotulo: 'Mostrar a aba “Admin” para os visitantes',
    ajuda: 'Desligada, o painel continua abrindo pelo endereço /admin/.',
  },
  { opcao: 'mostrarDestaque', pagina: 'regras', grupo: 'Destaque no começo do regulamento', rotulo: 'Mostrar este destaque na página', ajuda: '' },
  { opcao: 'mostrarCreditos', pagina: 'regras', grupo: 'Créditos (fim da página)', rotulo: 'Mostrar os créditos na página', ajuda: '' },
];

/** Identificadores que uma seção do regulamento não pode usar (já existem na página). */
export const IDS_RESERVADOS = new Set([
  'root',
  'inicio',
  'fs-convite-titulo',
  'integridade',
  'integridade-heading',
  'autor',
  'hero-title',
  'panel-general',
  'panel-police',
  'tab-general',
  'tab-police',
  'rules-search',
  'police-fines-title',
  'police-application-title',
  'police-cnh-title',
  'not-found-button-group',
]);
