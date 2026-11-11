/**
 * O convite no início da página de regras.
 *
 * A página de regras é um aplicativo já compilado (site/assets/index-*.js).
 * Para o convite aparecer antes de tudo — a imagem, o texto e o botão que leva
 * às regras —, o servidor acrescenta este bloco ao aplicativo na hora de
 * entregar o arquivo, do mesmo jeito que faz com a aba "Admin". Os arquivos de
 * ../site não mudam.
 *
 * O conteúdo é o mesmo da página /convite/: quem monta o bloco é o
 * conteudo.mjs, com os textos e a imagem que estiverem valendo lá.
 */

/** O bloco entra logo depois deste trecho: é o primeiro item da página, antes da barra do topo. */
export const MARCA_DO_INICIO = 'className:"site-shell",children:[';

/** Identificador do título do bloco (seções do regulamento não podem usar o mesmo). */
export const ID_DO_TITULO = 'fs-convite-titulo';

/** No campo "para onde o botão leva", este valor quer dizer "as regras". */
export const LINK_DAS_REGRAS = '/';

/**
 * Nome que, no endereço, quer dizer "comece pelas regras": /#regras.
 *
 * De propósito, nenhum elemento da página tem este identificador (ele está em
 * IDS_RESERVADOS, no mapa.mjs, para nenhuma seção do regulamento ficar com
 * ele). Assim, quem leva a página até as regras é só o COMECAR_NAS_REGRAS,
 * mais abaixo.
 *
 * Com um identificador que existe na página — o "#inicio", que a página
 * original dá ao conteúdo — o navegador também rola até ele por conta própria,
 * e para em outro ponto: ele deixa livre no alto o espaço que a página
 * original pede (106px; 150px no celular), que não é a altura da barra do
 * topo. No celular a página terminava 54px abaixo do começo das regras, com o
 * logo cortado. Isso acontece sempre que os scripts de estatística demoram a
 * responder — o normal na internet —, porque aí o aplicativo desenha a página
 * antes de o navegador dar a leitura do HTML por terminada.
 */
export const ANCORA_DAS_REGRAS = 'regras';

/**
 * Endereço que abre a página de regras já depois do convite. É para onde vai o
 * botão da página /convite/: sem isso, quem clicasse lá cairia no mesmo
 * convite outra vez, agora no início da página de regras.
 */
export const ATALHO_DAS_REGRAS = `/#${ANCORA_DAS_REGRAS}`;

/**
 * Clique no botão. Quando o link aponta para esta mesma página — é o caso de
 * "/" e também do endereço completo do site, se o administrador escrever
 * assim —, as regras estão logo abaixo: em vez de recarregar a página (e cair
 * no convite outra vez), ela desce até o fim do convite, onde as regras
 * começam, e a barra do topo fica colada no alto da tela.
 *
 * Nos outros casos o navegador segue o link normalmente: outro site, outra
 * página, um ponto desta página que não seja o começo das regras
 * (#regras-gerais, por exemplo) ou clique com Ctrl, Shift etc., que abre em
 * outra aba.
 *
 *   a = o botão;  c = o bloco do convite
 */
const DESCER_ATE_AS_REGRAS =
  'e=>{if(e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const a=e.currentTarget,c=a.closest(".fs-convite");' +
  `if(!c||a.origin!==location.origin||a.pathname!==location.pathname||a.hash&&a.hash!=="#${ANCORA_DAS_REGRAS}")return;` +
  'e.preventDefault();window.scrollTo({top:Math.round(c.getBoundingClientRect().bottom+window.scrollY)})}';

/**
 * Quando a página é aberta pelo ATALHO_DAS_REGRAS, ela já começa nas regras,
 * sem animação. Roda uma vez só, quando o bloco entra na página.
 *
 * Só vale para quem está chegando. Ao recarregar a página ou voltar a ela
 * pelo histórico, nada aqui roda: o navegador devolve o visitante ao ponto em
 * que ele estava, como em qualquer página.
 *
 * Nos primeiros instantes a página ainda pode mudar de altura (as fontes e as
 * imagens terminam de carregar). Para o começo das regras não sair do lugar:
 *   - se o convite muda de tamanho, a posição é corrigida;
 *   - o ajuste automático de rolagem do navegador fica desligado. Ele serve
 *     para manter no lugar o que o visitante está lendo, mas aqui atrapalha:
 *     se a barra do topo cresce (um logo sem medidas conhecidas, por
 *     exemplo), ele empurra a página para baixo e corta o alto da barra.
 * Tudo isso acaba no primeiro toque, clique, tecla ou giro do mouse do
 * visitante, ou em 10 segundos, ou assim que a página aparece rolada para
 * outro lugar (pela barra de rolagem, por exemplo): daí em diante nada mais
 * mexe na rolagem.
 *
 * Este código roda enquanto o aplicativo monta a página. Um erro aqui deixaria
 * a página em branco; por isso fica dentro de um try/catch: na pior das
 * hipóteses (um navegador que não aceite algum destes comandos), a página
 * simplesmente abre pelo convite.
 *
 *   g = como a página foi aberta (chegada, recarga ou histórico)
 *   u = última posição colocada aqui (null: nenhuma ainda; undefined: acabou)
 *   f = encerra;  d = coloca a página no fim do convite (y)
 */
const COMECAR_NAS_REGRAS =
  `e=>{try{if(!e||e.dataset.visto)return;e.dataset.visto="1";if(location.hash!=="#${ANCORA_DAS_REGRAS}")return;` +
  'const g=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];if(g&&(g.type==="reload"||g.type==="back_forward"))return;' +
  'const h=document.documentElement,a=h.style.overflowAnchor,t=["wheel","touchstart","pointerdown","keydown"];let u=null,o=null;' +
  'const f=()=>{if(u===void 0)return;u=void 0;h.style.overflowAnchor=a;o&&o.disconnect();removeEventListener("scroll",d);t.forEach(n=>removeEventListener(n,f,!0))},' +
  'd=()=>{if(u===void 0)return;const y=Math.round(e.getBoundingClientRect().bottom+window.scrollY);' +
  'if(u!==null&&Math.abs(window.scrollY-u)>2&&Math.abs(window.scrollY-y)>2)return f();' +
  'window.scrollTo({top:y,behavior:"instant"});u=window.scrollY};' +
  'h.style.overflowAnchor="none";t.forEach(n=>addEventListener(n,f,{capture:!0,passive:!0}));addEventListener("scroll",d,{passive:!0});setTimeout(f,1e4);' +
  'd();window.ResizeObserver&&(o=new ResizeObserver(d),o.observe(e))}catch(x){}}';

/**
 * Clique na imagem: faz o mesmo que o botão. A imagem do convite traz um
 * "CONSULTE AS REGRAS" desenhado, com cara de botão, e é nele que muita gente
 * clica (no celular deitado, o botão de verdade nem aparece sem rolar).
 * Para quem usa teclado ou leitor de tela nada muda: o botão continua sendo o
 * único link do bloco.
 */
const CLICAR_NO_BOTAO = 'e=>{const b=e.currentTarget.closest(".fs-convite")?.querySelector(".fs-convite-botao");b&&b.click()}';

const literal = (valor) => JSON.stringify(String(valor));

/**
 * O trecho de código que desenha o bloco, pronto para entrar depois de
 * MARCA_DO_INICIO. Textos vazios simplesmente não aparecem.
 *
 *   imagem  { endereco, descricao, largura, altura }
 *   link    para onde o botão leva; "/" são as regras, que ficam nesta mesma
 *           página (ver DESCER_ATE_AS_REGRAS).
 */
export function blocoDoConvite({ imagem, sobretitulo = '', titulo = '', texto = '', botao = '', link = '/' }) {
  const medidas = imagem.largura > 0 && imagem.altura > 0;
  const proporcao = medidas ? (imagem.largura / imagem.altura).toFixed(4) : '1.7778';
  const foto =
    `R.jsx("img",{className:"fs-convite-imagem",src:${literal(imagem.endereco)},alt:${literal(imagem.descricao || '')}` +
    `${medidas ? `,width:${Math.round(imagem.largura)},height:${Math.round(imagem.altura)}` : ''},decoding:"async"` +
    `${botao ? `,style:{cursor:"pointer"},onClick:${CLICAR_NO_BOTAO}` : ''}})`;

  const linhas = [];
  if (sobretitulo) linhas.push(`R.jsx("span",{className:"fs-convite-sobretitulo",children:${literal(sobretitulo)}})`);
  if (titulo) linhas.push(`R.jsx("h2",{id:"${ID_DO_TITULO}",className:"fs-convite-titulo",children:${literal(titulo)}})`);
  if (texto) linhas.push(`R.jsx("p",{className:"fs-convite-descricao",children:${literal(texto)}})`);

  const pecas = [];
  if (linhas.length) pecas.push(`R.jsxs("div",{className:"fs-convite-texto",children:[${linhas.join(',')}]})`);
  if (botao) {
    // Para as regras, o link é "#regras": aberto em outra aba, a página já começa nelas (ver COMECAR_NAS_REGRAS).
    const paraAsRegras = link === LINK_DAS_REGRAS || link === ATALHO_DAS_REGRAS;
    pecas.push(`R.jsx("a",{className:"fs-convite-botao",href:${literal(paraAsRegras ? `#${ANCORA_DAS_REGRAS}` : link)},onClick:${DESCER_ATE_AS_REGRAS},children:${literal(botao)}})`);
  }

  const itens = [foto];
  if (pecas.length) itens.push(`R.jsxs("div",{className:"fs-convite-mensagem",children:[${pecas.join(',')}]})`);

  const nome = titulo ? `"aria-labelledby":"${ID_DO_TITULO}"` : `"aria-label":"Convite"`;
  return (
    `R.jsx("section",{className:"fs-convite",${nome},ref:${COMECAR_NAS_REGRAS},children:` +
    `R.jsxs("div",{className:"fs-convite-caixa",style:{"--fs-convite-proporcao":"${proporcao}"},children:[${itens.join(',')}]})}),`
  );
}

/**
 * Visual do bloco: o mesmo da página /convite/ (imagem com moldura dourada e,
 * embaixo, a faixa com o texto e o botão).
 *
 * A largura da imagem também depende da altura da tela: em telas baixas
 * (notebooks) ela encolhe para o convite inteiro, com o botão, caber sem
 * precisar rolar. Os 250px são o que o bloco ocupa além da imagem. Quando a
 * caixa fica estreita, o título acompanha e o botão vai para baixo do texto
 * (as regras com "cqw" e "@container" medem a caixa; as com "vw" e "@media"
 * são para navegadores mais antigos, que medem a tela).
 *
 * A última regra não é do bloco, é da busca do site. A página original manda o
 * navegador deixar 106px livres no alto ao rolar até alguma coisa (o espaço da
 * barra do topo). Por causa disso, ao digitar na busca — que fica dentro da
 * barra — o navegador sobe a página para "mostrar" o cursor. Sem o convite não
 * dava para ver, porque no começo da página não há para onde subir; com o
 * convite em cima, a página pulava 62px na primeira letra. Enquanto a busca
 * está em uso, esse espaço livre deixa de valer.
 */
const CSS = `
.fs-convite{padding:clamp(16px,min(4vw,4vh),44px) clamp(16px,4vw,48px);border-bottom:1px solid var(--line,#e8ddb821);background:radial-gradient(ellipse at 50% 0,rgba(234,191,78,.14),transparent 52%),#10120f}
.fs-convite-caixa{--fs-convite-livre:calc(100vh - 250px);container-type:inline-size;width:min(100%,1100px,max(520px,calc(var(--fs-convite-livre)*var(--fs-convite-proporcao,1.7778))));margin:0 auto;animation:fs-convite-chega .72s cubic-bezier(.2,.8,.2,1) both}
@supports (height:100svh){.fs-convite-caixa{--fs-convite-livre:calc(100svh - 250px)}}
.fs-convite-imagem{display:block;width:100%;height:auto;border:1px solid rgba(234,191,78,.35);border-radius:14px;box-shadow:0 24px 80px rgba(0,0,0,.46)}
.fs-convite-mensagem{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:22px;padding:22px 24px;border:1px solid rgba(234,191,78,.18);border-radius:12px;background:rgba(23,26,22,.94)}
.fs-convite-texto{min-width:0}
.fs-convite-sobretitulo{display:block;color:#eabf4e;font-size:10px;font-weight:800;line-height:20px;letter-spacing:.18em}
.fs-convite-titulo{margin:7px 0 6px;color:#edeae1;font-size:clamp(20px,3vw,30px);font-weight:700;line-height:1.16;letter-spacing:-.035em}
@supports (width:1cqw){.fs-convite-titulo{font-size:clamp(20px,3.2cqw,30px)}}
.fs-convite-descricao{margin:0;color:#b8b8ac;font-size:14px;line-height:1.6}
.fs-convite-botao{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;min-height:48px;margin-left:auto;padding:0 18px;border-radius:8px;background:#eabf4e;color:#18160f;font-size:13px;font-weight:800;text-align:center;text-decoration:none;transition:background .18s,transform .18s}
.fs-convite-botao:hover{background:#f6d77b;transform:translateY(-1px)}
.fs-convite-botao:focus-visible{outline:2px solid #f6d77b;outline-offset:3px}
@keyframes fs-convite-chega{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@media (max-width:680px){.fs-convite-caixa{width:100%}.fs-convite-mensagem{align-items:stretch;flex-direction:column;padding:18px}.fs-convite-botao{width:100%;margin-left:0}}
@container (max-width:600px){.fs-convite-mensagem{align-items:stretch;flex-direction:column;padding:18px}.fs-convite-botao{width:100%;margin-left:0}}
html:has(#rules-search:focus){scroll-padding-top:0}
`.trim();

const atributo = (valor) => String(valor).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * O que entra no <head> da página de regras junto com o bloco: o visual e um
 * aviso para o navegador já ir buscando a imagem (ela é a primeira coisa da
 * página, mas só aparece no HTML depois que o aplicativo carrega).
 *
 * `logo` são a largura e a altura do logo que está valendo. Com elas, a barra
 * do topo já nasce com o espaço do logo reservado. Sem isso a barra cresce
 * quando o logo chega (73px no celular) e, se o visitante já tiver descido
 * até as regras, o navegador empurra a página para baixo na mesma medida,
 * cortando o alto da barra.
 */
export function cabecaDoConvite(enderecoDaImagem, logo = null) {
  const largura = Math.round(logo?.largura || 0);
  const altura = Math.round(logo?.altura || 0);
  const espacoDoLogo = largura > 0 && altura > 0 ? `\n.topbar-brand img{aspect-ratio:auto ${largura}/${altura}}` : '';
  return `<link rel="preload" as="image" href="${atributo(enderecoDaImagem)}" />\n<style id="convite-no-inicio">\n${CSS}${espacoDoLogo}\n</style>`;
}
