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
 * Os arquivos de ../site não mudam: o servidor faz a troca na hora de
 * responder, e só enquanto a opção `conviteNoInicio` (mapa.mjs) estiver
 * ligada. Desligada, as páginas ficam onde estavam no site original, e
 * "/regras/" leva para "/": um link para as regras vale nos dois casos.
 *
 * Quem aplica o que está aqui é o conteudo.mjs.
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
 *      BASE_ORIGINAL é o começo dele, trocado por BASE_DAS_REGRAS.
 *
 *   2. O botão "Go Home" da tela "não encontrada". No original ele mostra as
 *      regras sem recarregar a página, porque elas eram o início do site. Agora
 *      o início é o convite, que é outro arquivo: o botão passa a abrir "/" de
 *      verdade. MARCA_DO_VOLTAR é o trecho desse botão (aparece uma vez só);
 *      VOLTAR_ORIGINAL é a parte dele trocada por VOLTAR_PARA_O_INICIO.
 */
export const MARCA_DA_BASE = 'base:"",ssrPath:';
export const BASE_ORIGINAL = 'base:""';
export const BASE_DAS_REGRAS = 'base:/^\\/regras(\\/|$)/i.test(location.pathname)?"/regras":""';

export const MARCA_DO_VOLTAR = 'const r=()=>{a("/")}';
export const VOLTAR_ORIGINAL = 'a("/")';
export const VOLTAR_PARA_O_INICIO = 'location.assign("/")';

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
 * clica. Para quem usa teclado ou leitor de tela nada muda: o botão continua
 * sendo o único link da página.
 *
 * É um atributo da imagem; entra logo depois de MARCA_DA_IMAGEM.
 */
export const CLIQUE_NA_IMAGEM = ` onclick="var b=document.querySelector('a.button');if(b)b.click()"`;

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
