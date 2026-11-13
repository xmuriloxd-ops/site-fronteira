/**
 * O site começa pelo convite.
 *
 * No site original, a página de regras fica no endereço principal ("/") e o
 * convite em "/convite/". Neste projeto o convite passa a ser a primeira
 * página: quem chega ao site vê só ele — a imagem, o texto e o botão
 * "Consultar regras oficiais" —, e é por esse botão que se chega às regras,
 * que ficam em outra página.
 *
 *   /            o convite            (site/convite/index.html)
 *   /regras/     a página de regras   (site/index.html e o aplicativo dela)
 *   /convite/    leva para "/"        (o endereço antigo do convite continua valendo)
 *
 * Da página de regras volta-se ao convite por um link no topo dela (ver
 * linkDeVolta, mais abaixo).
 *
 * Os arquivos de ../site não mudam: o servidor faz a troca na hora de
 * responder, e só enquanto a opção `conviteNoInicio` (mapa.mjs) estiver
 * ligada. Desligada, as páginas ficam onde estavam no site original, e
 * "/regras/" leva para "/": um link para as regras vale nos dois casos.
 *
 * Quem aplica o que está aqui é o conteudo.mjs.
 *
 * Os endereços deste arquivo são os do site na raiz de um endereço
 * ("https://meusite.com.br/"). Quando o site é publicado dentro de uma pasta
 * ("https://usuario.github.io/projeto/site/"), o que muda está no fim do
 * arquivo, em "O site dentro de uma pasta".
 */

/** Onde fica cada página: com o site começando pelo convite, ou como no site original. */
export const enderecos = (comecaPeloConvite) =>
  comecaPeloConvite ? { inicio: '/', convite: '/', regras: '/regras/' } : { inicio: '/', convite: '/convite/', regras: '/' };

/**
 * O que responde em um endereço, além do que já está em ../site:
 *   { pagina: 'convite' | 'index' }   uma das duas páginas (nomes de ARQUIVOS, no mapa.mjs);
 *   { ir: '/...' }                    a página está em outro endereço: o navegador é mandado para lá;
 *   null                              vale o que está em ../site.
 *
 * Maiúsculas não importam (no celular o teclado costuma pôr uma no começo).
 */
export function paginaDoEndereco(caminho, comecaPeloConvite) {
  const c = String(caminho).toLowerCase();
  const pedeAsRegras = c === '/regras' || c === '/regras/';
  if (!comecaPeloConvite) return pedeAsRegras ? { ir: '/' } : null;
  if (c === '/' || c === '/index.html') return { pagina: 'convite' };
  if (pedeAsRegras) return { pagina: 'index' };
  if (c === '/convite' || c === '/convite/' || c === '/convite/index.html') return { ir: '/' };
  return null;
}

/**
 * A página de regras é um aplicativo já compilado (site/assets/index-*.js), e
 * ele decide o que mostrar pelo endereço: em "/" mostra as regras, em qualquer
 * outro manda para "/404", a tela de "página não encontrada". Para as regras
 * aparecerem em /regras/, duas coisas mudam nele quando é enviado:
 *
 *   1. A raiz dos endereços. É uma opção do roteador que vem dentro do
 *      aplicativo (o wouter), e no original é vazia. Passa a ser "/regras"
 *      quando a página está em /regras/, e continua vazia nos outros
 *      endereços, para a tela "não encontrada" seguir em "/404", como sempre.
 *      (Com a raiz fixa em "/regras", o aplicativo não desenharia nada fora
 *      dela: "/404" ficaria em branco.)
 *      MARCA_DA_BASE é o trecho onde a opção está (aparece uma vez só);
 *      BASE_ORIGINAL é o começo dele, trocado pelo que baseDoAplicativo()
 *      devolve.
 *
 *   2. O botão "Go Home" da tela "não encontrada". No original ele mostra as
 *      regras sem recarregar a página, porque elas eram o início do site. Agora
 *      o início é o convite, que é outro arquivo: o botão passa a abrir "/" de
 *      verdade. MARCA_DO_VOLTAR é o trecho desse botão (aparece uma vez só);
 *      VOLTAR_ORIGINAL é a parte dele trocada pelo que voltarParaOInicio()
 *      devolve.
 *
 * As duas funções estão no fim do arquivo, em "O site dentro de uma pasta":
 * são elas que escrevem o que entra no aplicativo, com a pasta ou sem ela.
 */
export const MARCA_DA_BASE = 'base:"",ssrPath:';
export const BASE_ORIGINAL = 'base:""';

export const MARCA_DO_VOLTAR = 'const r=()=>{a("/")}';
export const VOLTAR_ORIGINAL = 'a("/")';

/**
 * No campo "para onde o botão leva", estes valores querem dizer "a página de
 * regras", esteja ela onde estiver: a página do convite recebe o endereço em
 * que as regras estão no momento. "/regras/" é o que o painel mostra; "/" é o
 * que veio na cópia, e "/#regras" foi o atalho de uma versão anterior deste
 * projeto. Sem isso, um botão salvo com "/" passaria a abrir o próprio convite.
 */
const QUER_DIZER_AS_REGRAS = new Set(['/', '/regras', '/regras/', '/#regras']);
export const ehAsRegras = (link) => QUER_DIZER_AS_REGRAS.has(String(link).trim().toLowerCase());

/** O trecho da página do convite onde começa a imagem (aparece uma vez só). */
export const MARCA_DA_IMAGEM = '<img class="poster"';

/**
 * Clique na imagem: faz o mesmo que o botão. A imagem do convite traz um
 * "CONSULTE AS REGRAS" desenhado, com cara de botão, e é nele que muita gente
 * clica. Para quem usa teclado ou leitor de tela nada muda: o caminho para
 * as regras continua sendo o botão.
 *
 * É um atributo da imagem; entra logo depois de MARCA_DA_IMAGEM.
 */
export const CLIQUE_NA_IMAGEM = ` onclick="var b=document.querySelector('a.button');if(b)b.click()"`;

/**
 * A entrada do painel, no canto do convite.
 *
 * A página de regras tem a aba "Admin". O convite, que é por onde o site
 * começa, ganha uma etiqueta pequena com o mesmo texto, presa ao canto de
 * cima da tela, à direita. A mesma opção do painel (`abaAdmin`) liga e
 * desliga as duas.
 *
 * A etiqueta fica solta da página (posição absoluta): não ocupa lugar, e o
 * convite continua com o tamanho e a posição que tinha. Ela tem 16px de
 * altura, que é a menor margem que a página deixa acima do convite (a margem
 * vai de 16px a 48px, e no desenho de tela baixa é de 16px). Por isso a
 * etiqueta não fica por cima da imagem, do texto nem do botão, seja qual for
 * o tamanho da tela, a imagem ou o texto do convite. Quando a página tem
 * rolagem, a etiqueta fica no topo dela e sobe junto.
 *
 * No arquivo ela vem depois do convite, para a tecla Tab parar primeiro no
 * botão das regras.
 *
 * MARCA_DO_FIM_DO_CONVITE é onde o convite termina na página (aparece uma vez
 * só): a etiqueta entra logo depois.
 */
export const MARCA_DO_FIM_DO_CONVITE = '</main>';
export const LINK_DO_ADMIN = '<a class="admin-no-canto" href="/admin/">Admin</a>';

/**
 * As regras de visual da etiqueta; entram no <head> do convite. A letra é a
 * do "CONVITE OFICIAL" da própria página, e as cores são as do cartão do
 * texto.
 */
export const ESTILO_DO_LINK_DO_ADMIN = `<style id="admin-no-canto">\n${[
  // presa ao canto de cima, à direita; só o canto de dentro é arredondado
  '.admin-no-canto{position:absolute;top:0;right:0;display:flex;align-items:center;height:16px;padding:0 9px 1px 11px;',
  'border:solid rgba(234,191,78,.26);border-width:0 0 1px 1px;border-radius:0 0 0 8px;background:rgba(23,26,22,.94);',
  'color:#b8b8ac;font-size:10px;font-weight:800;line-height:1;letter-spacing:.18em;text-transform:uppercase;text-decoration:none;white-space:nowrap;',
  'transition:color .18s,border-color .18s}',
  // Com 16px de altura, a etiqueta é pequena para o dedo: a área que responde ao toque continua 8px abaixo dela
  // (24px ao todo). É uma área invisível. Quando a imagem do convite encosta na margem de cima (telas pequenas),
  // o toque nesses 8px do canto dela abre o painel, e não as regras.
  // (A conta parte da borda de dentro da etiqueta, que fica 1px acima do fim dela: 9px.)
  '.admin-no-canto::after{content:"";position:absolute;top:0;right:0;bottom:-9px;left:0}',
  '.admin-no-canto:hover{color:#eabf4e;border-color:rgba(234,191,78,.55)}',
  // (o contorno do foco fica para dentro: para fora, a borda da tela o cortaria)
  '.admin-no-canto:focus-visible{outline:2px solid #f6d77b;outline-offset:-2px}',
  '@media (prefers-reduced-motion:reduce){.admin-no-canto{transition:none}}',
].join('\n')}\n</style>`;

/**
 * O link de volta ao convite, na página de regras.
 *
 * Com o convite em outra página, a página de regras ganha um link para voltar
 * a ele: uma seta e o texto "Voltar ao convite" (o texto muda pelo painel;
 * vazio, o link não entra). O aplicativo recebe dois elementos iguais, e as
 * regras de visual mostram um de cada vez:
 *
 *   - na linha das abas, à direita, antes da aba Admin;
 *   - em telas de até 700px de largura, onde essa linha não tem espaço, na
 *     barra do topo, à direita do logo. (700px é a largura em que a própria
 *     página troca o desenho da barra do topo.)
 *
 * O link usa o visual das abas (a classe "view-tab" da página) e vem dentro
 * de uma caixa, "voltar-ao-convite", que ocupa só o espaço que já estava
 * livre: nada do que havia na página sai do lugar. Com um texto comprido, é o
 * link que quebra em linhas.
 *
 * MARCA_DO_TOPO é o trecho do aplicativo onde começam as ferramentas da barra
 * do topo (aparece uma vez só): o link entra logo antes dele, depois do logo.
 * Na linha das abas, entra no mesmo ponto que a aba Admin (ver conteudo.mjs).
 */
export const MARCA_DO_TOPO = 'R.jsxs("div",{"data-loc":"client/src/pages/Home.tsx:285",className:"topbar-tools"';

/**
 * O link dentro da caixa dele, escrito do jeito que o aplicativo escreve os
 * elementos: a seta (um desenho, que leitores de tela ignoram) e o texto.
 * `texto` e `destino` entram como textos do JavaScript, nunca como código.
 */
export const linkDeVolta = (texto, destino) =>
  `R.jsx("span",{className:"voltar-ao-convite",children:R.jsxs("a",{className:"view-tab",href:${JSON.stringify(destino)},children:[` +
  'R.jsxs("svg",{width:14,height:14,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",' +
  'children:[R.jsx("path",{d:"m12 19-7-7 7-7"}),R.jsx("path",{d:"M19 12H5"})]}),' +
  `${JSON.stringify(texto)}]})})`;

/** As regras de visual do link de volta; entram no <head> da página de regras. */
export const ESTILO_DO_LINK_DE_VOLTA = `<style id="voltar-ao-convite">\n${[
  // a caixa: o link fica encostado à direita dela
  '.voltar-ao-convite{display:flex;justify-content:flex-end}',
  // o link: a seta e o texto, lado a lado; se a caixa for estreita para o texto, ele quebra em linhas
  '.voltar-ao-convite>a{display:flex;align-items:center;gap:7px;flex:0 1 auto;min-width:0;overflow-wrap:anywhere;text-decoration:none}',
  '.voltar-ao-convite svg{flex:none}',
  // Na linha das abas, a caixa ocupa o espaço livre entre as abas e a aba Admin, que continua na ponta.
  '.view-tabs>.voltar-ao-convite{flex:1 1 0}',
  '.topbar>.voltar-ao-convite{display:none}',
  // Até 700px: some da linha das abas e aparece na barra do topo. A primeira linha da barra passa a ter
  // duas colunas (o logo e a caixa do link); as ferramentas continuam na linha de baixo, com a largura toda.
  '@media (max-width:700px){',
  '.view-tabs>.voltar-ao-convite{display:none}',
  '.topbar{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:0}',
  '.topbar>.topbar-tools{grid-column:1/-1}',
  '.topbar>.voltar-ao-convite{display:flex;align-self:center}',
  '}',
].join('\n')}\n</style>`;

// Medidas da página original do convite (site/convite/index.html), em px.
const ENTRE = 24; // entre a imagem e o cartão do texto: 22px de espaço, mais as bordas da imagem
const CARTAO_AO_LADO = 161; // altura do cartão com o botão ao lado do texto: título em uma linha, no maior tamanho, e parágrafo em duas
const CARTAO_EMBAIXO = 237; // altura do cartão com o botão embaixo do texto: título e parágrafo em duas linhas cada
const VIRA_COLUNA = 600; // numa caixa com até esta largura, o botão vai para baixo do texto
const CAIXA_MINIMA = 300; // a caixa do convite não fica mais estreita que isto (o texto precisa de espaço)
const IMAGEM_MINIMA = 120; // e a imagem, sozinha, não fica mais estreita que isto
const MARGEM_MAXIMA = 48; // a margem em volta da página vai de 16px a 48px

/**
 * As duas alturas de tela, em px, que mudam o desenho do convite, para uma
 * imagem com a proporção dada (largura ÷ altura):
 *   imagemPequena   daqui para baixo, com a imagem em cima do texto ela teria menos de 300px de largura;
 *   botaoEmbaixo    daqui para baixo, com a imagem em cima do texto o botão já não cabe ao lado dele.
 * Quanto mais alta a imagem, mais cedo isso acontece: por isso as contas levam a proporção.
 */
export function alturasDeTelaBaixa(proporcao) {
  return {
    // (49px: as duas margens da página em telas de uns 600px de largura)
    imagemPequena: Math.round(CAIXA_MINIMA / proporcao + ENTRE + CARTAO_EMBAIXO + 49),
    botaoEmbaixo: Math.floor(VIRA_COLUNA / proporcao + ENTRE + CARTAO_AO_LADO + 2 * MARGEM_MAXIMA),
  };
}

/**
 * O que entra no <head> do convite quando ele é a primeira página do site.
 *
 * O visual é o da página original, que continua valendo. Estas regras cuidam
 * de uma coisa só: o botão, que agora é o caminho para o resto do site, tem
 * que estar à vista assim que a página abre.
 *
 *   1. Telas baixas (notebooks). Na página original a imagem tem sempre a
 *      largura da página (até 1100px), e o botão ficava para fora da tela.
 *      Aqui a largura também depende da altura da tela: a imagem encolhe até
 *      o convite, com o botão, caber sem rolar. Da altura da tela saem as
 *      margens da página, o espaço entre a imagem e o cartão do texto, e o
 *      cartão; o que sobra é da imagem. O cartão tem duas alturas, e a conta
 *      é feita para as duas:
 *        --ao-lado   a largura que cabe com o botão ao lado do texto. Só
 *                    vale se passar de 600px: até aí o botão vai para baixo
 *                    do texto (a regra com "@container" mede a caixa, e não
 *                    a tela) e o cartão fica mais alto;
 *        --embaixo   a largura que cabe com o botão embaixo do texto. Em
 *                    telas de até 680px de largura é sempre esta, porque a
 *                    página original já põe o botão embaixo.
 *      O título acompanha a largura da caixa (a regra com "cqw"). A caixa
 *      para de encolher em 300px; daí em diante só a imagem encolhe, no meio.
 *      A altura do cartão é a dos textos originais: com textos bem mais
 *      compridos ele cresce, e em telas baixas a página pode precisar de
 *      rolagem.
 *   2. Telas mais baixas ainda (celular deitado, janelas baixas e largas). A
 *      imagem fica à esquerda e o cartão, com o texto e o botão, à direita
 *      (pelo menos 240px para ele). As alturas em que isso começa estão em
 *      alturasDeTelaBaixa().
 *   3. No celular, a altura que conta é a da parte visível da tela, com as
 *      barras do navegador aparecendo ("svh").
 *   4. O espaço da imagem fica reservado enquanto ela carrega, para o botão
 *      não mudar de lugar quando ela chega.
 *   5. A imagem mostra a mãozinha do mouse, porque é clicável.
 *   6. Um texto que o administrador deixou vazio não ocupa lugar (um botão
 *      sem texto, por exemplo, seria só um retângulo amarelo).
 *
 * `imagem` são a largura e a altura da imagem do convite que está valendo.
 */
export function cabecaDoInicio(imagem = null) {
  const largura = Math.round(imagem?.largura || 0);
  const altura = Math.round(imagem?.altura || 0);
  const medidas = largura > 0 && altura > 0;
  // (os limites só evitam números absurdos no CSS se a imagem for um fio de tão comprida)
  const proporcao = (medidas ? Math.min(20, Math.max(0.1, largura / altura)) : 16 / 9).toFixed(4);
  const baixa = alturasDeTelaBaixa(Number(proporcao));
  const cabe = (cartao) => `calc((var(--tela) - 2*clamp(16px,4vw,${MARGEM_MAXIMA}px) - ${ENTRE + cartao}px)*${proporcao})`;
  const css = [
    // 1
    'main{--tela:100vh;',
    `--ao-lado:${cabe(CARTAO_AO_LADO)};`,
    `--embaixo:${cabe(CARTAO_EMBAIXO)};`,
    // (o clamp vale --ao-lado quando ela passa de 600px, e zero quando não passa)
    `--largura:max(clamp(0px,(var(--ao-lado) - ${VIRA_COLUNA}px)*99999,var(--ao-lado)),var(--embaixo));`,
    `container-type:inline-size;width:min(100%,1100px,max(${CAIXA_MINIMA}px,var(--largura)))}`,
    '@media (max-width:680px){main{--largura:var(--embaixo)}}',
    `.poster{width:min(100%,max(${IMAGEM_MINIMA}px,var(--largura)));margin-left:auto;margin-right:auto}`,
    '@supports (width:1cqw){h1{font-size:clamp(20px,min(3vw,3.3cqw),30px)}}',
    `@container (max-width:${VIRA_COLUNA}px){.message{align-items:stretch;flex-direction:column;padding:18px}.button{width:100%}}`,
    // 2
    `@media (min-width:480px) and (max-height:${baixa.imagemPequena}px),(min-width:640px) and (max-height:${baixa.botaoEmbaixo}px) and (min-aspect-ratio:4/3){`,
    'body{padding-top:16px;padding-bottom:16px}',
    'main{display:flex;align-items:center;gap:16px;width:min(100%,1100px)}',
    `.poster{flex:none;width:min(60%,calc(100% - 256px),calc((var(--tela) - 34px)*${proporcao}));margin:0}`,
    '.message{flex:1;min-width:0;margin-top:0;align-items:stretch;flex-direction:column;padding:18px}',
    'h1{text-wrap:balance}',
    '.button{width:100%}',
    '}',
    // 3
    '@supports (height:100svh){body{min-height:100svh}main{--tela:100svh}}',
    // 4 e 5
    `.poster{cursor:pointer${medidas ? `;aspect-ratio:auto ${largura}/${altura}` : ''}}`,
    // 6
    '.eyebrow:empty,h1:empty,p:empty,.button:empty{display:none}',
  ];
  return `<style id="convite-no-inicio">\n${css.join('\n')}\n</style>`;
}

// ───────────────────────────── o site dentro de uma pasta ─────────────────────────────
/**
 * O site dentro de uma pasta.
 *
 * O site original fica na raiz do endereço, e tudo nele conta com isso: as
 * páginas pedem "/assets/...", o botão do convite leva a "/", o aplicativo de
 * regras procura as telas a partir de "/". Uma hospedagem como o GitHub Pages
 * publica o site dentro de uma pasta do endereço
 * ("https://usuario.github.io/projeto/site/"), e ali "/assets/..." é de outro
 * site. Na cópia publicada, cada endereço do próprio site passa a começar pela
 * pasta (ver exportar.mjs e, no conteudo.mjs, "publicacao").
 *
 * `pasta` é a pasta sem a barra do fim ("/projeto/site"); vazia quer dizer
 * a raiz, e então nada muda em relação ao resto deste arquivo.
 *
 * No aplicativo de regras mudam três coisas:
 *
 *   1. A raiz dos endereços (a mesma opção do roteador de que o começo deste
 *      arquivo fala). Passa a ser a pasta e, na página de regras de um site
 *      que começa pelo convite, a pasta mais "/regras".
 *   2. O endereço da tela "página não encontrada". O aplicativo recarrega a
 *      página nesse endereço quando chega a uma tela que não existe; é um
 *      endereço completo, que não passa pela raiz do roteador. Na cópia é
 *      "/404", que numa pasta cairia fora do site.
 *      MARCA_DO_NAO_ENCONTRADO é o trecho onde ele está (aparece uma vez só);
 *      NAO_ENCONTRADO_ORIGINAL é a parte dele que é trocada.
 *   3. O botão "Go Home" dessa tela, que abre o início do site: a pasta mais
 *      "/".
 */
export const PASTA_VALIDA = /^(\/(?!\.+(\/|$))[A-Za-z0-9._~-]+)*$/; // (um trecho só de pontos, como "..", não é nome de pasta)

/** A pasta escrita dentro de uma expressão regular do JavaScript (entre barras). */
const pastaEmRegex = (pasta) => pasta.replace(/[^A-Za-z0-9_~-]/g, '\\$&');

/**
 * O que entra no lugar de BASE_ORIGINAL, ou null quando a raiz da cópia vale
 * como está (site na raiz do endereço, com as regras em "/").
 */
export function baseDoAplicativo(pasta, comecaPeloConvite) {
  if (comecaPeloConvite) return `base:/^${pastaEmRegex(pasta)}\\/regras(\\/|$)/i.test(location.pathname)?${JSON.stringify(`${pasta}/regras`)}:${JSON.stringify(pasta)}`;
  return pasta ? `base:${JSON.stringify(pasta)}` : null;
}

export const MARCA_DO_NAO_ENCONTRADO = ',tg="/404";function ';
export const NAO_ENCONTRADO_ORIGINAL = '"/404"';
export const naoEncontradoNaPasta = (pasta) => JSON.stringify(`${pasta}/404`);

/** O que entra no lugar de VOLTAR_ORIGINAL quando o site começa pelo convite. */
export const voltarParaOInicio = (pasta) => `location.assign(${JSON.stringify(`${pasta}/`)})`;

/**
 * Sem a pasta, o navegador procura sozinho o ícone da aba em "/favicon.ico",
 * e as páginas da cópia contam com isso: não dizem onde ele está. Numa pasta,
 * esse endereço é de outro site. As duas páginas passam a dizer onde o ícone
 * fica; entra no <head>.
 */
export const linkDoIcone = (endereco) => `<link rel="icon" href="${endereco}">`;

/**
 * A página que fica no lugar de um endereço que leva a outro. O servidor
 * responde a "/convite/" mandando o navegador para "/" (ver paginaDoEndereco).
 * Uma hospedagem de arquivos não faz isso: o endereço antigo recebe esta
 * página, que leva ao novo assim que abre e mantém o que vinha depois do
 * "?" e do "#". Sem JavaScript, vale a linha "refresh"; sem ela, o link.
 */
export const paginaQueLeva = (destino) =>
  [
    '<!doctype html>',
    '<html lang="pt-BR">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="robots" content="noindex">',
    '<title>Fronteira do Sul RP</title>',
    `<meta http-equiv="refresh" content="0; url=${destino}">`,
    `<script>location.replace(${JSON.stringify(destino)}+location.search+location.hash)</script>`,
    '</head>',
    '<body>',
    `<a href="${destino}">Continuar</a>`,
    '</body>',
    '</html>',
    '',
  ].join('\n');
