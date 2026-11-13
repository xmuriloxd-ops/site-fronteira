# Fronteira do Sul RP — site e área do administrador

O site da Fronteira do Sul RP: o convite oficial, que é a primeira página; a central de regras, que abre pelo botão do convite; e um painel para o administrador mudar o conteúdo sem mexer em código.

O site tem duas páginas e o painel:

| Página | Endereço | Arquivo principal |
|---|---|---|
| Convite oficial (o início do site) | `/` | `site/convite/index.html` |
| Central de regras | `/regras/` | `site/index.html` + `site/assets/` |
| Área do administrador | `/admin/` | `admin/painel/` |

Ele parte de uma cópia exata do site publicado em <https://fronteirasul-fmudazpm.manus.space>, feita em 11/11/2026. O que é diferente da cópia não está escrito nos arquivos dela: o servidor aplica na hora de entregar cada página. São três camadas:

| Camada | Onde fica | O que é |
|---|---|---|
| 1. A cópia | `site/` | Os arquivos do site original, sem nenhuma alteração: mesmos bytes, mesmos caminhos. |
| 2. O que este projeto mudou | `admin/mapa.mjs` e `admin/convite-no-inicio.mjs` | O site começar pelo convite, os créditos, a entrada do painel ("Admin") nas duas páginas e a retirada do selo e das estatísticas da hospedagem original. Vale em toda instalação. |
| 3. O que o administrador muda | `dados/` | Tudo o que é salvo pelo painel. |

Esta pasta é independente do outro site que está no restante do repositório. Um não usa nada do outro. Os dois saem juntos na publicação do GitHub Pages, cada um no seu endereço (ver "Como publicar").

## O que mudou em relação ao site original

Numa instalação nova, sem nada salvo pelo painel, o site difere do original em quatro pontos:

1. **O site começa pelo convite.** No original, o endereço principal (`/`) era a página de regras e o convite ficava em `/convite/`. Aqui, quem entra no site vê só o convite: a imagem, o texto ("CONVITE OFICIAL", "Uma nova história começa aqui.", "Conheça a cidade, confira as regras oficiais e prepare-se para o roleplay.") e o botão "Consultar regras oficiais". As regras ficam em outra página, `/regras/`, e é por esse botão que se chega a elas.
   - Clicar na imagem faz o mesmo que o botão.
   - O convite inteiro, com o botão, cabe na tela sem rolar. Para isso a imagem encolhe em telas baixas (notebooks) e fica ao lado do texto em telas mais baixas ainda (celular deitado). Nas telas em que o convite original já cabia com folga, a página é igual à original, a não ser pela etiqueta Admin (item 3). Os limites e as medições estão em "Como foi conferido".
   - A página de regras é a do original, sem o convite. No topo dela há um link "Voltar ao convite". No computador ele fica na linha das abas, à esquerda da aba Admin; em telas de até 700 pixels de largura (celular em pé), fica na barra do topo, à direita do logo. O link não tira do lugar nada do que a página já tinha. Para mudar o texto ou tirar o link: painel > Página de regras > "Link para voltar ao convite".
   - Para mandar alguém direto para as regras, o link é `/regras/`.
   - `/convite/`, o endereço antigo do convite, continua valendo: leva para `/`.
   - Um endereço que não existe mostra a tela "página não encontrada" do site, como no original. O botão dela ("Go Home") leva ao início, que é o convite.
   - Para voltar aos endereços do original (regras em `/`, convite em `/convite/`): painel > Convite > "Começar o site pelo convite". Com a opção desligada, `/regras/` leva para `/`, então um link para as regras vale nos dois casos.
2. **Créditos ("Quem criou"), no fim da página de regras.** Nome: MURILO MENDES. Discord: `sgtmendes1997_29726`. As linhas de telefone e de e-mail estão vazias e por isso não aparecem. Para mudar ou preencher: painel > Página de regras > "Créditos (fim da página)".
3. **Entrada do painel ("Admin") nas duas páginas.** No convite, uma etiqueta pequena no canto de cima da tela, à direita. Na página de regras, uma aba no fim da linha das abas. As duas levam a `/admin/`.
   - A etiqueta fica na margem que a página deixa acima do convite. Ela não muda o convite de lugar nem fica por cima da imagem, do texto ou do botão.
   - Para tirar as duas: painel > Página de regras > Abas > "Mostrar “Admin” para os visitantes". O painel continua abrindo pelo endereço `/admin/`.
4. **Sem o selo nem as estatísticas da Manus.** O original mostrava o selo "Made with Manus" no canto da tela, carregava scripts que enviavam as visitas para a Manus, o Plausible e o Amplitude e pedia `/api/platform/config.js`. Numa instalação nova nada disso aparece, nada disso é carregado e o endereço não é pedido. Para voltar ao original: painel > Avançado > desmarcar "Tirar o selo “Made with Manus” e as estatísticas da hospedagem original".

Há ainda uma diferença que não aparece na tela: a página de regras pede o aplicativo dela com a versão no endereço (`/assets/index-FbaU4KfD.js?v=...`). O motivo está em "Quando há um intermediário no caminho".

No painel, "original" quer dizer esse estado, e não a cópia: "Voltar ao original" e "Restaurar o site original" voltam para o site começando pelo convite, sem o selo da Manus e com os créditos acima.

## Como abrir

Só precisa do Node.js 18 ou mais novo. Não há nada para instalar.

```bash
node fronteira-sul/servidor.mjs
```

Depois abra no navegador:

- Início do site (o convite): <http://localhost:4173/>
- Regras: <http://localhost:4173/regras/>
- Área do administrador: <http://localhost:4173/admin/>

Para usar outra porta: `PORT=8080 node fronteira-sul/servidor.mjs`.

Se o site estiver aberto por um endereço público (uma hospedagem, uma tela de prévia), informe-o para os links de compartilhamento apontarem para lá, e não para o site original:

```bash
ENDERECO_PUBLICO=https://meu-site.exemplo node fronteira-sul/servidor.mjs
```

O mesmo endereço pode ser preenchido no painel, em "Compartilhamento", e vale mais que o da linha de comando. Na publicação do GitHub Pages ele é o do próprio Pages, sem precisar configurar nada.

Não abra os `.html` com dois cliques. As páginas pedem os arquivos por caminhos que começam em `/` (`/assets/...`, `/fronteira-sul-convite-preview.jpg`), então só funcionam quando são entregues pelo `servidor.mjs`.

## Área do administrador

### Como entrar

No convite, que é o início do site, há uma etiqueta **Admin** no canto de cima da tela, à direita. Na página de regras (`/regras/`) há uma aba **Admin**, no fim da linha das abas. As duas levam para `/admin/`, que pede usuário e senha. O endereço `/admin/` também pode ser digitado direto.

| | Valor inicial |
|---|---|
| Usuário | `adm` |
| Senha | `142536` |

Troque os dois em **Usuário e senha**, dentro do painel. Enquanto a senha inicial estiver em uso, o painel mostra um aviso no topo, porque qualquer pessoa que a conheça consegue editar o site.

Se esquecer a senha: apague o arquivo `dados/acesso.json` e reinicie o servidor. O acesso volta a ser o inicial e o conteúdo do site não muda.

### O que dá para mudar

| Seção do painel | O que tem |
|---|---|
| Regulamento | As seções da aba "Regulamento geral": criar, excluir, mudar a ordem, o título e o texto. |
| Página de regras | Os textos fixos da página: topo, abas, link para voltar ao convite, abertura, índice, destaque, créditos (nome, Discord, telefone, e-mail), página "não encontrada". Também liga e desliga a entrada "Admin" (a aba desta página e a etiqueta do convite), o destaque e os créditos. |
| Regras da Polícia | Textos da aba, grupos de multas (infração, valor, pontos) e as duas listas. |
| Convite | Textos do convite, o botão e para onde ele leva. Também liga e desliga a opção de o site começar pelo convite. |
| Imagens | Imagem do convite, logo e ícone da aba do navegador (PNG, JPG, WebP ou GIF, até 8 MB). |
| Compartilhamento | Título e descrição que aparecem na aba do navegador e na prévia do link no Discord e no WhatsApp, e o endereço onde o site está publicado. |
| Avançado | O selo "Made with Manus" e as estatísticas da hospedagem original: já vêm tirados, e a opção os traz de volta; CSS extra para mudar cores e tamanhos. |
| Histórico | Voltar para uma das 15 últimas versões salvas, ou desfazer tudo o que foi feito pelo painel ("Restaurar o site original"). |
| Usuário e senha | Trocar o usuário e a senha do painel. |

Como funciona:

- Textos e regras só entram no ar ao clicar em **Salvar e publicar**. Cada campo alterado fica marcado e tem um link "Voltar ao original".
- Imagens entram no ar assim que o envio termina. O convite se ajusta ao formato da imagem enviada (quadrada ou em pé, por exemplo); o ideal continua sendo 1200 × 675. A mesma imagem aparece na prévia quando o link é colado no Discord ou no WhatsApp.
- Quem está com o site aberto vê a mudança ao recarregar a página.
- "Restaurar o site original" desfaz tudo o que foi feito pelo painel, menos o usuário e a senha. O site volta a ser o de uma instalação nova: começando pelo convite, sem o selo da Manus e com os créditos descritos em "O que mudou em relação ao site original".
- Os links "Ver regras" e "Ver convite", no topo do painel, abrem cada página no endereço em que ela está no momento.

O painel não muda a estrutura das páginas (a ordem dos blocos, por exemplo). Para isso é preciso editar os arquivos; veja "Como editar os arquivos à mão".

### Onde ficam as alterações

Na pasta `fronteira-sul/dados/`, criada na primeira vez que algo é salvo:

| Arquivo | O que guarda |
|---|---|
| `dados/conteudo.json` | Os textos, as regras e as opções que foram alterados. |
| `dados/imagens/` | As imagens enviadas pelo painel. |
| `dados/historico/` | As 15 versões anteriores do `conteudo.json`. |
| `dados/acesso.json` | O usuário e a senha do painel. A senha não fica escrita: só o resultado de um cálculo feito com ela (scrypt). |

Os dois primeiros vão para o Git: é deles que sai o site publicado no GitHub Pages (ver "Como publicar"). O histórico e o acesso não vão (estão no `.gitignore`): existem só no computador ou servidor onde o painel roda. Para levar tudo para outro lugar, copie a pasta. Para guardar em outro local, inicie o servidor com `DADOS_DIR=/caminho/da/pasta`.

### Proteções

- Depois de 5 tentativas erradas de login, é preciso esperar 30 segundos; a espera dobra a cada novo erro, até 15 minutos.
- A sessão termina depois de 12 horas sem uso (ou 7 dias depois do login), ao clicar em "Sair" ou quando o servidor reinicia.
- Trocar o usuário ou a senha encerra as sessões abertas em outros aparelhos.
- Sem login, o painel só mostra a tela de entrada: nada é lido nem alterado. A pasta `dados/` não é alcançada pelo navegador.
- O que o administrador escreve entra nas páginas como texto. Não vira HTML nem script.
- A sessão do painel não fica em cookie: uma página de outro site não consegue fazer o navegador do administrador mandar pedidos em nome dele.

### Quando há um intermediário no caminho

Entre o navegador e este servidor quase sempre há um intermediário: o da hospedagem, ou o de uma tela de prévia. Alguns não entregam tudo o que o navegador manda. Alguns guardam arquivos por um tempo e não perguntam ao servidor se eles mudaram. O painel e as páginas foram feitos para funcionar mesmo assim:

- **O painel fala com o servidor de um jeito só**: pedidos POST com o conteúdo em JSON, que é o formato do próprio login. A sessão vai dentro do pedido. Se o login chega ao servidor, o resto chega do mesmo jeito.
- **O que muda pelo painel é pedido com a versão no endereço** (`...js?v=abc`). Isso vale para o aplicativo de regras, para as imagens trocadas pelo painel e para os dois arquivos da tela do painel. Quando o conteúdo muda, o endereço muda, e nenhum intermediário tem o endereço novo guardado. As páginas em si são pedidas a cada visita, e a do painel nunca é guardada.
- A exceção é o ícone da aba do navegador: o navegador pede `/favicon.ico` por conta própria, sem versão. Depois de trocar o ícone, a aba pode demorar a mostrar o novo.
- Um painel de antes dessa mudança (uma aba que ficou aberta, ou um arquivo antigo guardado no caminho) mostra, ao entrar, um aviso para recarregar a página.

Se o painel disser que o servidor não reconheceu a sessão, olhe o terminal do servidor. O pedido recusado (com o número 401) traz o motivo ao lado:

| No terminal | O que quer dizer |
|---|---|
| `(pedido sem sessão)` | O pedido chegou sem a sessão: algo no caminho mexeu nele. |
| `(sessão desconhecida ou vencida)` | Chegou uma sessão que não vale mais. Acontece quando o servidor reinicia, quando alguém troca a senha ou quando a sessão vence. Basta entrar de novo. |

Por que isso existe: até 12/11/2026 o painel mandava a sessão em um cabeçalho do pedido (`Authorization`) e usava também pedidos GET, PUT e DELETE. Na tela de prévia em que o site estava sendo visto, o login era aceito e o pedido seguinte era recusado. O painel mostrava "Sua sessão terminou" logo depois de entrar. Abrindo o servidor direto, sem intermediário, o defeito não aparecia. O que foi visto e o que foi testado está em "Como foi conferido".

## O que é cada arquivo

| Arquivo | O que é |
|---|---|
| `servidor.mjs` | O servidor. Entrega os arquivos de `site/` aplicando o que este projeto mudou e as alterações do painel, e responde como o servidor original. |
| `exportar.mjs` | Grava em uma pasta o site como o servidor o entrega, sem o painel, para uma hospedagem que só guarda arquivos (o GitHub Pages). |
| `conferir-publicado.mjs` | Pede ao site que está no ar cada arquivo gravado pelo `exportar.mjs` e compara byte a byte. |
| `admin/painel/` | A tela do painel (`index.html`, `painel.css`, `painel.js`). |
| `admin/mapa.mjs` | Lista de tudo o que o painel deixa editar e onde cada texto fica nos arquivos de `site/`. Também guarda o que este projeto mudou na cópia: os créditos, o destino do botão do convite e o texto do link de volta ao convite (`padrao`), e o que vem ligado (`OPCOES_PADRAO`). |
| `admin/convite-no-inicio.mjs` | O site começar pelo convite: em que endereço fica cada página, o que muda no aplicativo de regras para ele funcionar em `/regras/`, o link de volta ao convite, a etiqueta Admin do convite e as regras de visual que fazem o convite caber na tela. No fim, o que muda quando o site é publicado dentro de uma pasta do endereço. |
| `admin/conteudo.mjs` | Guarda as alterações e monta as páginas com elas. |
| `admin/acesso.mjs` | Login, sessões e limite de tentativas. O usuário e a senha iniciais estão no começo deste arquivo. |
| `admin/api.mjs`, `admin/imagem.mjs` | Os endereços que o painel usa (e a forma de falar com eles: só POST, com a sessão dentro do pedido) e a conferência das imagens enviadas. |
| `admin/testes/` | Testes automáticos do painel e da publicação. Rodam com `node fronteira-sul/admin/testes/todos.mjs`. |
| `site/convite/index.html` | A página do convite inteira: textos, botão e visual (o CSS fica no bloco `<style>`). É a primeira página do site. |
| `site/fronteira-sul-convite-preview.jpg` | Imagem do convite (1200×675). |
| `site/index.html` | "Casca" da página de regras: título, descrição e as chamadas para os dois arquivos abaixo. |
| `site/assets/index-FbaU4KfD.js` | O aplicativo da página de regras, já compilado. Todos os textos das regras estão aqui. |
| `site/assets/index-DMP8NyHf.css` | Visual da página de regras. |
| `site/manus-storage/fronteira-sul-logo_1b1b4c2d.webp` | Logo usado na página de regras. |
| `site/fronteira-sul-logo.webp` | O mesmo logo. A página usa este se o de cima falhar. |
| `site/favicon.ico` | Ícone da aba. É o mesmo logo; apesar do nome, é um arquivo WebP, como no original. |
| `site/__manus/pwa/manifest.webmanifest` | Nome e ícone usados quando o site é "instalado" no celular. |
| `site/robots.txt`, `site/sitemap.xml` | Arquivos para buscadores. |

## Como editar os arquivos à mão

Só é preciso para o que o painel não cobre, como a estrutura das páginas. Edite o arquivo, salve e recarregue a página; o servidor percebe a mudança sozinho.

- Convite (o início do site): `site/convite/index.html` é HTML comum, com o visual no bloco `<style>` do começo. Na hora de entregar, o servidor acrescenta a ele o destino do botão (`/regras/`), o clique na imagem, a etiqueta Admin e as regras de visual que fazem o convite caber na tela. Essas regras ficam em `admin/convite-no-inicio.mjs`; depois de editar esse arquivo, reinicie o servidor.
  - As regras contam com a altura do cartão do texto como ele é hoje (`CARTAO_AO_LADO` e `CARTAO_EMBAIXO`, no mesmo arquivo). Se você mudar à mão o tamanho das letras ou os espaços do cartão, ajuste esses dois números.
  - Os testes automáticos guardam essas regras por extenso (`admin/testes/apoio.mjs`) e falham se elas mudarem. É de propósito: eles não abrem um navegador, e o que garante que o convite cabe na tela são as medições de "Como foi conferido". Depois de mudar as regras, confira a página em vários tamanhos de janela (as ferramentas de desenvolvedor do navegador têm um modo para isso) e atualize o texto do teste.
- Etiqueta Admin do convite: o link e as regras de visual dela estão em `admin/convite-no-inicio.mjs` (`LINK_DO_ADMIN` e `ESTILO_DO_LINK_DO_ADMIN`). Ela tem 16 pixels de altura porque essa é a menor margem que a página deixa acima do convite. Mais alta que isso, ela passa a cobrir o convite em telas pequenas. Os testes guardam o link e as regras por extenso, como as regras do convite.
- Endereço de cada página (`/`, `/regras/`, `/convite/`): também em `admin/convite-no-inicio.mjs`.
- Link de volta ao convite, na página de regras: o elemento e as regras de visual dele estão em `admin/convite-no-inicio.mjs` (`linkDeVolta` e `ESTILO_DO_LINK_DE_VOLTA`). O texto que vem numa instalação nova está em `admin/mapa.mjs`. Os testes também guardam o elemento e as regras por extenso, pelo mesmo motivo: depois de mudar, confira a página de regras em telas largas e estreitas e atualize o texto do teste.
- Créditos e o que vem ligado numa instalação nova: `admin/mapa.mjs` (procure por `padrao` e por `OPCOES_PADRAO`); reinicie o servidor depois.
- Regras: o site original só publica a versão compilada desta página, não o código-fonte. O aplicativo está em `site/assets/index-FbaU4KfD.js` (poucas linhas, todas enormes: use a busca do editor) e o visual em `site/assets/index-DMP8NyHf.css`.

Três cuidados:

- Uma aspa ou vírgula errada no arquivo `.js` deixa a página em branco. Este comando devolve o original: `git checkout -- fronteira-sul/site/assets/index-FbaU4KfD.js`
- O painel acha cada texto pelo que está escrito em volta dele no arquivo. Se uma edição à mão apagar esse trecho, o painel avisa que aquele campo não pode mais ser editado; o resto continua funcionando. Um texto alterado pelo painel vale mais que o do arquivo.
- Para a página de regras funcionar em `/regras/`, o servidor troca dois trechos do aplicativo na hora de entregar (estão descritos em `admin/convite-no-inicio.mjs`). Se uma edição à mão apagar o primeiro deles, o site volta aos endereços do original, com as regras em `/`, e o painel avisa. O link de volta ao convite e a aba Admin também entram em pontos marcados do aplicativo (depois do logo e depois das duas abas), e a etiqueta Admin entra onde o convite termina na página dele (`</main>`). Se uma edição apagar um desses pontos, o que entraria ali fica de fora, e o painel avisa.

## O que ainda aponta para o site original

Só os endereços das páginas. O selo "Made with Manus", os scripts de estatística (Manus, Plausible e Amplitude) e o pedido a `/api/platform/config.js` já vêm tirados numa instalação nova; painel > Avançado desfaz isso.

Os endereços oficiais das páginas (`canonical`, `og:url`, `og:image`, `twitter:image`), o `robots.txt` e o `sitemap.xml` apontam para `fronteirasul-fmudazpm.manus.space` enquanto ninguém disser onde o site está. Para trocar, use um destes (o de cima vale mais que o de baixo):

1. `--endereco` na publicação em arquivos, que o fluxo do GitHub Pages preenche sozinho com o endereço do Pages;
2. painel > Compartilhamento > "Endereço onde este site está publicado";
3. `ENDERECO_PUBLICO=https://meu-site.exemplo` ao abrir o servidor.

Com o endereço, o convite é anunciado em `/`, as regras em `/regras/`, o `sitemap.xml` lista as duas páginas e a imagem de prévia vem do próprio site.

## Como publicar

Há dois jeitos, e um não impede o outro:

| | No GitHub Pages | Com o servidor |
|---|---|---|
| O que vai ao ar | O convite e as regras | O convite, as regras e o painel |
| O painel | Não vai. As mudanças são feitas no painel onde o servidor roda, e o site é publicado de novo | Funciona no próprio site |
| Custo | Grátis | Depende da hospedagem, que precisa rodar Node.js e ter um disco permanente |

Nos dois casos, não publique a pasta `site/` sozinha. Ela é a cópia do site original como ele era: com as regras no endereço principal e o convite em `/convite/`, com os créditos antigos e sem nada do que foi alterado pelo painel.

### No GitHub Pages

O site fica em:

- Convite: <https://xmuriloxd-ops.github.io/projetos-cidades2/fronteira-sul/>
- Regras: <https://xmuriloxd-ops.github.io/projetos-cidades2/fronteira-sul/regras/>

O endereço `https://xmuriloxd-ops.github.io/projetos-cidades2/` é do outro site do repositório. Um repositório tem um site só no Pages, e por isso os dois saem na mesma publicação.

**O que precisa ser feito uma vez**, nas configurações do repositório no GitHub. Só o dono do repositório consegue:

1. Deixar o repositório público. Em Settings, na parte "Danger Zone", que fica no fim da página: ao lado de "Change repository visibility", clicar em Change visibility, escolher a opção pública e confirmar. O GitHub pede para clicar em "I have read and understand these effects" e depois em "Make this repository public". Numa conta gratuita do GitHub, o Pages só funciona em repositório público; numa conta paga ele funciona também em repositório privado, e este passo não é necessário.
2. Ligar o Pages. Em Settings > Pages, na parte "Build and deployment", em Source, escolher GitHub Actions.

Com o repositório público, qualquer pessoa pode ver:

- o código e o histórico dos dois sites, e os registros das execuções na aba Actions;
- o usuário e a senha iniciais do painel, que estão em `admin/acesso.mjs` e neste guia;
- os arquivos de `site/` como vieram do site original, com os créditos de quem o criou.

O site publicado não leva o painel nem os créditos do site original. Troque a senha do painel antes de hospedar o servidor em qualquer lugar, e não use a senha inicial em mais nada.

**Como a publicação acontece.** A cada mudança na versão principal do repositório (`main`), o fluxo `.github/workflows/deploy-pages.yml` roda sozinho:

1. Roda os testes desta pasta. Se algum falhar, nada é publicado, nem do outro site, e o que já estava no ar continua.
2. Grava o site com o `exportar.mjs`, dentro da pasta `/fronteira-sul` do site do Pages.
3. Publica junto com o outro site.
4. Confere o que foi ao ar com o `conferir-publicado.mjs`: os arquivos têm de ter sido gravados para o endereço em que ficaram, e cada um, pedido ao site, tem de voltar byte a byte igual. Logo depois de publicar o Pages pode demorar a entregar os arquivos novos, então a conferência tenta de novo por até 5 minutos antes de dar erro.

O andamento aparece na aba Actions do repositório. Quando dá certo, o resumo da execução mostra os endereços do convite e das regras. Quando um desses passos falha, a execução fica marcada com erro e o motivo aparece no resumo dela, em "Annotations", com o título "Fronteira do Sul RP". Enquanto o Pages não estiver ligado, o erro que aparece é "Nada foi publicado · o GitHub Pages está ligado?", com o que fazer.

Para publicar de novo sem mudar nada: Actions > "Deploy · GitHub Pages" > Run workflow.

**Uma publicação feita por outro ramo tira este site do ar.** O ramo `arena/06f46c0d-projetos-cidades2` também dispara a publicação, com o arquivo de fluxo que está nele, e ele não tem esta pasta. Uma mudança enviada para lá publica só o outro site, e a Fronteira do Sul fica fora do ar até a próxima publicação pela `main`. Para voltar, rode o fluxo pela `main` (o "Run workflow" acima). Para impedir, nas configurações do repositório, em Environments > github-pages, limite à `main` os ramos que podem publicar.

**Como mudar o site publicado:**

1. Faça a mudança pelo painel, onde o servidor roda (a prévia, ou `node fronteira-sul/servidor.mjs` no seu computador).
2. O que foi salvo fica em `dados/conteudo.json` e em `dados/imagens/`. Mande esses arquivos para a `main` do repositório.

A publicação sai em seguida. Até lá, a mudança aparece só onde o servidor roda.

**O que é diferente do site com o servidor:**

- Não há painel, nem a aba e a etiqueta "Admin". A opção "Mostrar “Admin” para os visitantes" não vale para a publicação.
- `/convite/`, o endereço antigo do convite, é uma página pequena que leva ao começo do site. O servidor manda o navegador direto.
- Um endereço que não existe mostra a página "não encontrada" do GitHub, e não a do site. A do site continua existindo em `/404`.
- As duas páginas dizem onde fica o ícone da aba. Na raiz de um endereço o navegador acha o ícone sozinho; dentro de uma pasta, não.
- Os links de compartilhamento (a prévia que o Discord e o WhatsApp mostram) e o `sitemap.xml` usam o endereço do Pages, mesmo sem o "Endereço onde este site está publicado" preenchido no painel.

**Para gravar o site à mão**, num computador, para olhar o resultado ou para levar a outra hospedagem de arquivos:

```bash
node fronteira-sul/exportar.mjs --saida /tmp/site --pasta /projetos-cidades2/fronteira-sul --endereco https://xmuriloxd-ops.github.io
node fronteira-sul/conferir-publicado.mjs --arquivos /tmp/site --endereco https://xmuriloxd-ops.github.io/projetos-cidades2/fronteira-sul
```

Sem `--pasta`, o site sai pronto para a raiz de um endereço. O `exportar.mjs` não grava nada se a cópia em `site/` estiver diferente do esperado, se o `conteudo.json` estiver ilegível ou se faltar uma imagem enviada pelo painel. O segundo comando só dá certo depois que o site estiver no ar.

### Com o servidor

A hospedagem tem que rodar Node.js (18 ou mais novo): `node fronteira-sul/servidor.mjs`.

Antes de colocar no ar:

1. Troque o usuário e a senha do painel.
2. Use um endereço com HTTPS. Sem ele, a senha viaja pela rede sem proteção.
3. Garanta que a pasta de dados não seja apagada a cada nova publicação. Em muitas hospedagens o disco é zerado a cada publicação: nesse caso as alterações se perdem e o acesso volta a ser `adm` / `142536`. Aponte `DADOS_DIR` para um disco permanente.

Opções ao iniciar o servidor (todas opcionais):

| Variável | Para que serve |
|---|---|
| `PORT`, `HOST` | Porta (padrão 4173) e interface de rede (padrão `0.0.0.0`). |
| `DADOS_DIR` | Pasta onde ficam as alterações e o acesso (padrão `fronteira-sul/dados`). |
| `ADMIN_USUARIO`, `ADMIN_SENHA` | Usuário e senha iniciais, no lugar de `adm` / `142536`. Valem enquanto ninguém trocar pelo painel. |
| `CONFIAR_NO_PROXY=1` | Use quando a hospedagem coloca um proxy na frente do site (Render, Railway, nginx). O limite de tentativas de login passa a contar por visitante, e não para todos juntos. |
| `SILENCIOSO=1` | Não escreve cada pedido no terminal. |

## Como foi conferido

As datas desta seção são do horário de Brasília.

### A cópia

Em 11/11/2026 o site original e a cópia foram abertos no Chrome 156, em tela de computador (1440×900) e de celular (390×844), repetindo os mesmos passos nos dois: as duas páginas de cima a baixo, as duas abas das regras, a busca, o menu de seções, o índice, o botão de copiar o Discord, o link do convite para as regras e a página de "não encontrado".

- Os arquivos que o navegador recebeu do site original são os mesmos bytes gravados em `site/`.
- O texto, o HTML e a posição e o estilo de cada elemento ficaram iguais em todos os passos.
- As 98 fotos de tela ficaram idênticas pixel a pixel. Em 2 delas, com o campo de busca em uso, isso só aconteceu na segunda carga: na primeira havia 33 pixels diferentes.
- A cópia não fez nenhum pedido ao site original.

Duas respostas mudam a cada pedido no site original e por isso ficaram com o valor do momento da cópia: o código `nonce` de um dos scripts de estatística nos dois `.html` e a data `lastmod` do `sitemap.xml`.

Essa comparação foi feita antes de o painel existir e de o site começar pelo convite, e continua valendo para os arquivos de `site/`. Numa instalação nova, as diferenças para o original são as três de "O que mudou em relação ao site original". Desligando no painel "Começar o site pelo convite" e "Mostrar “Admin” para os visitantes" e escrevendo de volta os créditos da cópia, todos os arquivos saem byte a byte iguais aos de `site/`, nos endereços do original (os testes automáticos conferem isso).

### O site começando pelo convite

Em 11/11/2026 o site foi aberto no Chromium 153, com os textos e a imagem originais do convite. As medições e os passos abaixo foram feitos por roteiros que comandam o navegador; eles precisam de um navegador instalado e não estão no repositório.

**O convite cabe na tela.** A página foi medida em 449.751 tamanhos de janela: todas as larguras pares de 320 a 1500 pixels, com todas as alturas de 240 a 1000.

- Nessas medidas, o convite inteiro, com o botão, cabe sem rolar em toda janela a partir de 320 × 365. Com 480 ou mais de largura, cabe a partir de 301 de altura.
- Em janelas mais baixas que isso é preciso rolar.
- A página original do convite, medida do mesmo jeito, cabia em 39% desses tamanhos, e em 51,5% o botão ficava para fora da tela, inteiro ou em parte. A nova cabe em 94,9%.
- Em nenhum tamanho a página nova deixa de caber onde a original cabia.
- Onde a original cabia, a nova tem as mesmas medidas em 91,7% dos tamanhos. Nos outros 8,3% a imagem fica menor, entre 84% e 100% da largura original (na metade deles, 97% ou mais). São janelas em que a original cabia por pouco: a página nova reserva para o cartão do texto a altura dele com o parágrafo em duas linhas (e, com o botão embaixo do texto, também o título), mesmo quando o texto ocupa menos.

Essa medição foi feita com a página dentro de um quadro que muda de tamanho. Depois ela foi aberta direto em 40 tamanhos de tela, de 320×480 a 2560×1440 (celular em pé e deitado, com toque; tablet; notebook; monitor):

- Nos 40 a página mostra só o convite, e nada da página de regras é carregado. O convite cabe sem rolar, a imagem aparece inteira e sem distorção, e não há rolagem para os lados.
- A página original cabia em 14 desses 40. Em 1366×768 o botão dela ficava cortado no fim da tela (14,7 pixels para fora) e em 1366×650 ficava inteiro para fora (começava 84,7 pixels abaixo do fim da tela).
- Em dez tamanhos em que a original cabia com folga (320×568, 390×844, 412×915, 600×962, 768×1024, 820×1180, 1440×900, 1600×900, 1920×1080 e 2560×1440), a foto da página nova é idêntica à da original, pixel a pixel. O navegador de teste desenha a imagem de duas maneiras, de uma carga para outra, na original e na nova; a comparação foi entre fotos desenhadas da mesma maneira. Essa comparação é de antes de a etiqueta Admin existir. Com ela, a única diferença é o retângulo da própria etiqueta (ver "A etiqueta Admin no canto do convite", abaixo).

**O botão leva às regras.** Em dez tamanhos de tela, do celular ao monitor, com o mouse ou com o toque:

- A página mostra a imagem, os três textos e o botão "Consultar regras oficiais".
- O botão abre `/regras/`, e a página de regras aparece do começo, sem o convite. O "voltar" do navegador traz o convite de volta.

Em tela de computador (1440×900):

- Clicar na imagem faz o mesmo que o botão. Pelo teclado, o primeiro Tab para no botão e Enter abre as regras. Ctrl+clique abre as regras em outra aba.
- `/convite/`, `/convite`, `/convite/index.html` e `/Convite/` levam para `/`, mantendo o que vem depois de `?` e de `#`. `/regras`, `/Regras/` e `/REGRAS` também abrem as regras.
- Quatro endereços que não existem (`/pagina-que-nao-existe`, `/regras/nao-existe`, `/regrasx` e `/regras/404`) mostram a tela "página não encontrada", em `/404`. O botão dela leva ao convite.

**A página de regras em `/regras/`**, em tela de computador (1440×900) e de celular (390×844):

- Começa pela barra do topo, como no original. As duas abas, a tabela de multas, a busca, o índice, o logo do topo e a aba Admin funcionam como antes.
- Os créditos mostram MURILO MENDES e o Discord novo; as linhas de telefone e de e-mail não aparecem; nenhum dado dos créditos antigos aparece neles.

**O link de volta ao convite**, conferido em 12/11/2026, no mesmo navegador e do mesmo jeito:

- A página de regras foi medida em 193 larguras de janela, de 320 a 2560 pixels, ao lado de uma cópia dela sem o link. Até 700 pixels de largura, o link aparece na barra do topo, à direita do logo; acima disso, na linha das abas, antes da aba Admin. Em todas as larguras há um link só à vista, com o texto em uma linha e sem encostar em nada.
- Em todas elas, cada elemento que a página já tinha ficou na mesma posição e com o mesmo tamanho que na página sem o link, e a altura da página é a mesma.
- Em 14 tamanhos de tela, de 320×568 a 2560×1440, com o mouse ou com o toque, o link leva ao convite. Em tela de computador (1440×900), o "voltar" e o "avançar" do navegador desfazem e refazem cada passo.
- Pelo teclado, o Tab chega ao link logo depois da aba ativa, e Enter abre o convite. Ctrl+clique abre o convite em outra aba. Com a aba "Regras da Polícia" aberta, o link continua no mesmo lugar.
- A tela "página não encontrada" não tem o link: o botão dela já leva ao convite.
- No painel: trocar o texto muda o link nas duas posições. Com o texto vazio, o link some, e não fica nenhum traço dele no aplicativo nem na página de regras. Com "Começar o site pelo convite" desligado, a página de regras não tem o link. Sem a aba Admin, o link fica na ponta direita da linha das abas.
- Com um texto de 57 letras, contando os espaços (o original tem 17), em janelas de 701 e de 320 pixels de largura: o link quebra em linhas sem passar por cima de nada, e as abas e a barra do topo não mudam de tamanho.

**A etiqueta Admin no canto do convite**, conferida em 12/11/2026, no mesmo navegador:

- O convite foi medido de novo nos mesmos 449.751 tamanhos de janela, com a etiqueta e sem ela (com a opção do painel desligada). Em todos, a imagem, o cartão, os três textos e o botão ficam na mesma posição e com o mesmo tamanho nos dois casos, e a rolagem é a mesma. O que está dito acima sobre o convite caber na tela continua valendo.
- Em nenhum desses tamanhos a etiqueta fica por cima da imagem, do cartão, dos textos ou do botão, nem sai da tela. Ela mede cerca de 64 × 16 pixels e fica encostada no canto de cima, à direita.
- Em 16 tamanhos de tela, de 320×455 a 2560×1440, a página foi fotografada com a etiqueta e com ela escondida. Só mudam pixels dentro do retângulo da etiqueta. Com ela escondida, a foto é idêntica, pixel a pixel, à da página sem a etiqueta. E sem a etiqueta (opção desligada), a página entregue é byte a byte a de antes de ela existir.
- Os 40 tamanhos de tela da medição anterior foram abertos de novo. O convite cabe em todos; os links da página são o botão e, depois dele, a etiqueta; e a etiqueta não cobre nada.
- Com a imagem do convite trocada por uma quadrada, uma em pé e uma mais comprida, em 20.587 tamanhos de janela cada: os mesmos resultados. Com textos bem mais compridos (título de 76 letras e texto de 181), em oito tamanhos de tela: a página passa a rolar em sete, a etiqueta continua sem cobrir nada e sobe junto com a página.
- Em tela de computador (1440×900): o primeiro Tab continua parando no botão; o segundo para na etiqueta, com o contorno de foco à vista, e Enter abre a tela de entrada do painel. Clicar faz o mesmo, e `adm` / `142536` entra. Da tela de entrada, "Voltar para o site" traz o convite. Na lista que o navegador entrega aos leitores de tela há dois links: o botão e "Admin" (em maiúsculas, como aparece na tela).
- No modo celular (320×455, com toque): tocar na etiqueta abre a tela de entrada. A área que responde ao toque tem 24 pixels de altura: os 16 da etiqueta e mais 8 abaixo dela, que são invisíveis. Nessa tela a imagem do convite começa logo abaixo da etiqueta, e o toque nesses 8 pixels do canto de cima da imagem abre o painel, e não as regras. O resto da imagem continua abrindo as regras.
- Nos 449.751 tamanhos, esses 8 pixels ficam sobre o canto da imagem em 0,9% (janelas de até 460 pixels de largura) e sobre o canto do cartão do texto em 5,0% (janelas baixas e largas, em que o texto fica à direita da imagem). Nunca ficam sobre os textos nem sobre o botão.
- No painel, desligar "Mostrar “Admin” para os visitantes" e salvar tira a etiqueta do convite e a aba da página de regras; ligar de novo devolve as duas. Com "Começar o site pelo convite" desligado, o convite (em `/convite/`) é o da cópia, sem a etiqueta.

**No painel:**

- A aba Admin da página de regras e a etiqueta Admin do convite levam à tela de entrada. Os links "Ver regras" e "Ver convite" apontam para `/regras/` e `/`.
- Desligar "Começar o site pelo convite" e salvar: o site fica como o original (regras em `/`, convite em `/convite/` com o botão levando a `/`, e `/regras/` levando para `/`). Ligar de novo: volta a começar pelo convite.
- Mudar os textos do convite muda o início do site. No destino do botão, `/regras/`, `/regras`, `/` e `/#regras` levam às regras; outro endereço entra como foi escrito, e a imagem passa a levar a esse mesmo endereço. Com o texto do botão vazio, o botão some e a imagem continua levando às regras.
- "Restaurar o site original" volta para o site começando pelo convite, com a imagem original.

**Com outra imagem.** A imagem do convite foi trocada, pelo painel, por imagens de quatro formatos: quadrada (900×900), 4 por 3 (1200×900), mais comprida (1200×600) e em pé (675×1200). Cada uma foi medida em 20.587 tamanhos de janela (larguras de 320 a 1500, de 10 em 10; alturas de 240 a 1100, de 5 em 5):

- Com 480 ou mais de largura, o convite cabe a partir de 305 de altura, com as quatro.
- Em janelas mais estreitas, cabe a partir de 360 de altura com a mais comprida, 390 com a 4 por 3, 420 com a quadrada e 510 com a em pé.
- A imagem nunca aparece distorcida.

**O que não foi conferido, e o que pode mudar o resultado:**

- Não foi testado em Firefox, em Safari, nem em um celular de verdade (só no modo celular do Chromium, que não tem as barras do navegador).
- O navegador de teste escreve com a letra Open Sans. Cada aparelho usa a letra do próprio sistema, com outra largura, e as linhas podem quebrar em outro ponto. As regras de visual contam com o parágrafo em duas linhas (e, com o botão embaixo do texto, também o título). Se num aparelho o texto quebrar em mais linhas que isso, a página pode precisar de rolagem em telas baixas.
- O link de volta ao convite foi medido com a mesma letra. Em 320 pixels de largura sobram 12 pixels entre ele e o logo: com uma letra mais larga, ou com um texto mais comprido, o texto do link quebra em mais de uma linha e continua no mesmo lugar, à direita do logo.
- A etiqueta Admin foi medida com a mesma letra. A largura dela muda com a letra do aparelho. A altura é fixa (16 pixels), e é a altura que a mantém dentro da margem da página. A área de toque foi conferida só no modo celular do Chromium.
- As medidas valem para os textos originais. Com textos bem mais compridos o cartão cresce, e a página pode precisar de rolagem em telas baixas. Num teste com um título de 79 letras e um texto de 169 (os originais têm 30 e 74), em oito tamanhos de tela, a página passou a rolar em cinco: 1366×650, 1366×768, 1440×900, 360×560 e 844×390. O botão continuou inteiro à vista em quatro deles e ficou cortado em 844×390 (celular deitado). Depois de mudar os textos, vale abrir "Ver convite" e conferir.

### O painel

Há dois conjuntos de testes.

Os testes automáticos ficam em `admin/testes/` e podem ser repetidos a qualquer momento, sem instalar nada:

```bash
node fronteira-sul/admin/testes/todos.mjs
```

Eles usam pastas temporárias e não mexem em `site/` nem em `dados/`. Conferem, entre outras coisas:

- Cada um dos 94 campos de texto, trocado sozinho, muda só o próprio trecho, e o aplicativo continua válido. Textos com aspas, barras, tags e emoji não quebram a página nem viram HTML.
- Login, sessões, limite de tentativas e troca de usuário e senha; a senha antiga para de valer.
- O painel fala com o servidor só por POST, com a sessão dentro do pedido. GET, PUT e DELETE são recusados, e a sessão em um cabeçalho não abre nada. Atrás de um intermediário que só repassa POST e o corpo dos pedidos, o painel inteiro funciona.
- O registro do servidor: um pedido do painel recusado traz o motivo ao lado, e nem a senha nem a sessão aparecem nele.
- Depois de reiniciar o servidor, o conteúdo, as imagens e o novo acesso continuam.
- O site começando pelo convite: o que responde em cada endereço, o que cada página recebe, o botão com cada tipo de destino e a troca da imagem. Com a opção desligada, tudo como no original. Se um arquivo de `site/` vier diferente e a troca de endereços não puder ser feita, o site fica como o original e o painel avisa.
- As regras de visual do convite: são, letra por letra, as que foram medidas no navegador; com outra imagem, só muda nelas o que depende do formato da imagem.
- O link de volta ao convite: entra na página de regras nos dois lugares, com o texto do painel; vazio, não entra; e só existe enquanto o site começa pelo convite. O elemento e as regras de visual são, letra por letra, os que foram conferidos no navegador.
- A etiqueta Admin do convite: entra logo depois do convite, liga e desliga junto com a aba Admin, e só existe enquanto o site começa pelo convite. O link e as regras de visual são, letra por letra, os que foram conferidos no navegador.
- Endereços com versão: a página de regras pede o aplicativo pela versão dele, que muda quando um texto das regras muda; cada imagem trocada é pedida pela versão do arquivo enviado; a página do painel nunca é guardada e pede os arquivos dela pela versão.
- Os créditos novos: nada dos créditos da cópia é entregue em nenhum arquivo.
- Histórico e "restaurar o site original", que devolve os arquivos byte a byte ao estado de uma instalação nova.
- Sem login, os pedidos para ler ou alterar o conteúdo são recusados, e arquivos fora de `site/` e da tela do painel não são entregues.

Além disso, em 11/11/2026 o painel foi usado de ponta a ponta no Chromium, em tela de computador (1440×900) e de celular (390×844): entrar pela aba Admin, mudar regulamento, textos fixos, multas, convite, imagens, endereço de compartilhamento e opções, conferindo cada mudança no site aberto como visitante; trocar usuário e senha; duas pessoas salvando ao mesmo tempo; sessão que cai no meio de uma edição. O roteiro foi repetido depois de o site passar a começar pelo convite, com as regras em `/regras/`, e de novo em 12/11/2026, depois de a página de regras ganhar o link de volta ao convite. Ele precisa de um navegador e não está no repositório.

Nessas três vezes o navegador de teste abriu o servidor direto, sem nada no caminho. Por isso o defeito do login pela tela de prévia, descrito a seguir, não apareceu.

### A publicação em arquivos

Os testes automáticos da publicação estão em `admin/testes/exportacao.mjs` e rodam junto com os outros. Conferem, entre outras coisas:

- Na raiz de um endereço, cada arquivo gravado é, byte a byte, o que o servidor entrega no mesmo endereço com a entrada do Admin desligada. A comparação é feita com o servidor de verdade, por HTTP, em três situações: instalação nova; com textos, opções e imagens salvos pelo painel; e com a opção "Começar o site pelo convite" desligada.
- Dentro de uma pasta, o que muda em relação à raiz está escrito por extenso no teste, e nada mais muda: os endereços nas duas páginas, no aplicativo e na lista de ícones, o ícone da aba e os links de compartilhamento.
- O aplicativo gravado continua sendo JavaScript válido e procura as regras em `<pasta>/regras/` e a tela "não encontrada" em `<pasta>/404`.
- Nada do painel nem dos créditos da cópia vai para os arquivos.
- A exportação para, sem gravar nada, quando a cópia em `site/` vem diferente, quando o `conteudo.json` está ilegível e quando falta uma imagem enviada pelo painel. Ela não mexe na pasta de dados.
- O `conferir-publicado.mjs` aponta um arquivo com conteúdo diferente (mesmo que do mesmo tamanho) e um arquivo que falta, e tenta de novo enquanto a hospedagem ainda entrega a publicação anterior.
- Ele recusa, antes de pedir qualquer coisa, arquivos gravados para outra pasta do endereço: mais rasa, mais funda, de nome parecido ou nenhuma. Nesse caso todos os arquivos estariam no ar, iguais aos gravados, e as páginas não os achariam.

Em 12/11/2026 o site gravado para a pasta `/projetos-cidades2/fronteira-sul` foi aberto no Chromium 153 atrás de um servidor de teste que responde como o GitHub Pages de um repositório: o site dentro da pasta do repositório, pasta sem a barra do fim redirecionada, `nome` respondendo por `nome.html`, página "não encontrada" própria, maiúsculas diferentes de minúsculas. Em três situações (instalação nova; "Começar o site pelo convite" desligado; textos, a imagem do convite e o logo trocados pelo painel), em tela de computador (1440×900) e de celular (390×844):

- O convite e a página de regras mostram o mesmo texto que no servidor aberto na raiz, e os elementos medidos (a imagem, o cartão, os textos e o botão do convite; a barra do topo, as abas, o título e a busca das regras) têm a mesma posição e o mesmo tamanho.
- Funcionam dentro da pasta: o botão, o clique na imagem, o link "Voltar ao convite", as abas das regras, `/regras` sem a barra, o endereço antigo `/convite/` (mantendo o que vem depois do `?`) e a tela "não encontrada" em `/404`, com o botão voltando ao começo.
- Tudo o que as páginas pedem ao próprio site fica dentro da pasta, e nada é pedido a outro site: o `/api/platform/config.js` e os scripts da hospedagem original já vêm tirados. Nada aparece no console. (Com a opção do painel desmarcada, voltam os scripts de `files.manuscdn.com`, `plausible.io` e `manus-analytics.com`, como no site original.)

O outro site do repositório, montado com o mesmo comando que o fluxo do Pages usa, sai byte a byte igual com e sem esta pasta no repositório. Com os dois no mesmo conjunto de arquivos que o fluxo monta, cada um abre no seu endereço, um depois do outro, e o outro site não pede nada desta pasta.

Os passos da Fronteira do Sul no fluxo do Pages foram rodados fora do GitHub, com o mesmo roteiro que está no arquivo do fluxo e com o servidor de teste no lugar do Pages, em seis casos: tudo certo; um teste falhando; o `conteudo.json` ilegível; a pasta informada diferente da pasta da publicação; a publicação anterior ainda no ar; e nada no ar. No primeiro, o site sai gravado para o endereço informado e a execução termina com os endereços do convite e das regras no resumo. Nos outros cinco, o passo certo falha, os seguintes não rodam e o motivo sai na anotação de erro.

**O que não foi conferido:**

- O GitHub Pages de verdade. O servidor de teste imita o que se conhece do comportamento dele. Depois de cada publicação, o próprio fluxo compara o que está no ar com o que foi gravado.
- O fluxo no GitHub, do passo "Configurar Pages" em diante. Até 12/11/2026 o Pages estava desligado e o fluxo parava nesse passo: gravar, publicar e conferir nunca rodaram lá. Os valores que o Pages entrega a esses passos só existem lá.
- Firefox, Safari e celulares de verdade.
- Como o Discord e o WhatsApp mostram a prévia do link no endereço novo.

### O painel atrás de um intermediário

**O que foi visto.** Em 12/11/2026, pela tela de prévia, o registro do servidor mostrou duas vezes a mesma sequência: o login aceito (`200 POST /admin/api/entrar`) e, no mesmo segundo, o pedido seguinte recusado (`401 GET /admin/api/conteudo`). A senha estava certa, e o servidor não reiniciou entre um pedido e outro. No mesmo registro, a página de regras e a tela do painel foram abertas sem que os arquivos delas (script, estilo, imagens) fossem pedidos ao servidor, 36 minutos depois da vez anterior. O servidor manda perguntar a cada uso.

**O que foi deduzido.** Um intermediário que não entrega o cabeçalho `Authorization` produz exatamente a primeira sequência. Posto um assim na frente do servidor, o navegador de teste mostrou o mesmo registro e a mesma mensagem, numa aba e dentro de um quadro de outro site; sem ele, o login funcionava nos dois casos. A segunda observação é a de um intermediário que guarda arquivos por um tempo (ou que manda o navegador guardar). Não foi possível olhar a tela de prévia por dentro: ela só responde a quem está com ela aberta. Por isso a causa é uma dedução, e não uma observação.

**O que mudou.** O painel passou a falar com o servidor só por POST, com a sessão dentro do pedido, e o que muda pelo painel passou a ser pedido com a versão no endereço (ver "Quando há um intermediário no caminho").

**O que foi testado depois da mudança**, em 12/11/2026, no Chromium 153:

- O roteiro do painel de ponta a ponta (17 passos) e os dois roteiros do site (21 e 16 passos) foram repetidos de dois jeitos: direto no servidor, e através de um intermediário de teste. Esse intermediário tira o cabeçalho `Authorization`, recusa PUT e DELETE, só repassa os cabeçalhos mais comuns, tira os cookies e guarda para sempre tudo o que não é página, sem perguntar ao servidor se mudou. Todos os passos deram certo nos dois caminhos: cada texto e cada imagem salvos no painel apareceram no site na visita seguinte.
- Tirando do servidor a versão dos endereços, o roteiro do painel falha atrás desse intermediário no primeiro texto salvo: o site continua mostrando o texto antigo. É isso que a versão no endereço evita.
- O login foi feito numa aba e dentro de um quadro de outro site, direto e pelo intermediário. Também com o armazenamento do navegador negado ao quadro: nesse caso o painel entra, e pede a senha de novo ao recarregar a página.
- Com o `painel.js` de antes da mudança falando com o servidor novo, a tela de entrada mostra: "O painel foi atualizado e esta tela ficou antiga: recarregue a página." Recarregando, o painel novo abre.
- Com o painel novo, quando o pedido seguinte ao login é recusado (o que foi forçado no teste), a tela de entrada diz que o usuário e a senha estão certos e que o servidor não reconheceu a sessão, em vez de "Sua sessão terminou".

**O que não foi conferido:** a própria tela de prévia. Se o login ainda falhar por ela, o terminal do servidor mostra, ao lado do pedido recusado, se a sessão não chegou ou se chegou uma que não vale (a tabela está em "Quando há um intermediário no caminho").
