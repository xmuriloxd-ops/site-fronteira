# Fronteira do Sul RP — site e área do administrador

O site da Fronteira do Sul RP: a central de regras, com o convite oficial no início, e um painel para o administrador mudar o conteúdo sem mexer em código.

O site tem duas páginas e o painel:

| Página | Endereço | Arquivo principal |
|---|---|---|
| Convite + central de regras | `/` | `site/index.html` + `site/assets/` |
| Convite oficial (página só dele) | `/convite/` | `site/convite/index.html` |
| Área do administrador | `/admin/` | `admin/painel/` |

Ele parte de uma cópia exata do site publicado em <https://fronteirasul-fmudazpm.manus.space>, feita em 11/11/2026. O que é diferente da cópia não está escrito nos arquivos dela: o servidor aplica na hora de entregar cada página. São três camadas:

| Camada | Onde fica | O que é |
|---|---|---|
| 1. A cópia | `site/` | Os arquivos do site original, sem nenhuma alteração: mesmos bytes, mesmos caminhos. |
| 2. O que este projeto mudou | `admin/mapa.mjs` e `admin/convite-no-inicio.mjs` | O convite no início da página de regras, os créditos e a aba Admin. Vale em toda instalação. |
| 3. O que o administrador muda | `dados/` | Tudo o que é salvo pelo painel. |

Esta pasta é independente do sistema PCPR que está no restante do repositório. Um não usa nada do outro.

## O que mudou em relação ao site original

Numa instalação nova, sem nada salvo pelo painel, o site difere do original em três pontos:

1. **Convite no início da página de regras.** A página `/` começa pela imagem do convite, o texto ("CONVITE OFICIAL", "Uma nova história começa aqui.", "Conheça a cidade, confira as regras oficiais e prepare-se para o roleplay.") e o botão "Consultar regras oficiais". As regras vêm logo abaixo.
   - O botão desce a página até as regras. Clicar na imagem faz o mesmo que o botão.
   - Isso vale enquanto o destino do botão for a própria página de regras: `/`, que é o padrão, ou o endereço completo do site. Se o destino for trocado no painel por outro site ou outra página, o botão abre esse endereço.
   - A imagem e os textos são os mesmos da página `/convite/`. Mudou no painel, mudou nos dois lugares.
   - O botão da página `/convite/` abre a página de regras já nas regras, para o visitante não ver o mesmo convite duas vezes. O endereço que faz isso é `/#regras`, e ele também serve para divulgar um link que abre direto nas regras.
   - Para tirar o convite do início: painel > Convite > "Mostrar o convite no início da página de regras".
2. **Créditos ("Quem criou"), no fim da página de regras.** Nome: MURILO MENDES. Discord: `sgtmendes1997_29726`. As linhas de telefone e de e-mail estão vazias e por isso não aparecem. Para mudar ou preencher: painel > Página de regras > "Créditos (fim da página)".
3. **Aba Admin**, à direita de "Regras da Polícia".

No painel, "original" quer dizer esse estado, e não a cópia: "Voltar ao original" e "Restaurar o site original" voltam para o convite no início e para os créditos acima.

Junto com o convite, a página de regras recebe dois ajustes, para o resto dela funcionar como antes com o convite em cima:

- O espaço do logo na barra do topo fica reservado antes de a imagem chegar. Sem isso a barra cresce quando o logo chega e empurra a página de quem já desceu até as regras.
- Digitar na busca não puxa a página para cima.

Com o convite desligado, nenhum dos dois é aplicado.

## Como abrir

Só precisa do Node.js 18 ou mais novo. Não há nada para instalar.

```bash
node fronteira-sul/servidor.mjs
```

Depois abra no navegador:

- Convite e regras: <http://localhost:4173/>
- Só o convite: <http://localhost:4173/convite/>
- Área do administrador: <http://localhost:4173/admin/>

Para usar outra porta: `PORT=8080 node fronteira-sul/servidor.mjs`.

Não abra os `.html` com dois cliques. As páginas pedem os arquivos por caminhos que começam em `/` (`/assets/...`, `/fronteira-sul-convite-preview.jpg`), então só funcionam quando são entregues pelo `servidor.mjs`.

## Área do administrador

### Como entrar

Na página de regras há uma aba **Admin**, à direita de "Regras da Polícia". Ela leva para `/admin/`, que pede usuário e senha.

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
| Página de regras | Os textos fixos da página: topo, abas, abertura, índice, destaque, créditos (nome, Discord, telefone, e-mail), página "não encontrada". Também liga e desliga a aba Admin, o destaque e os créditos. |
| Regras da Polícia | Textos da aba, grupos de multas (infração, valor, pontos) e as duas listas. |
| Convite | Textos do convite, o botão e para onde ele leva. Valem para o convite do início da página de regras e para a página `/convite/`. Também liga e desliga o convite no início. |
| Imagens | Imagem do convite, logo e ícone da aba do navegador (PNG, JPG, WebP ou GIF, até 8 MB). |
| Compartilhamento | Título e descrição que aparecem na aba do navegador e na prévia do link no Discord e no WhatsApp, e o endereço onde o site está publicado. |
| Avançado | Tirar o selo "Made with Manus" e os scripts de estatística; CSS extra para mudar cores e tamanhos. |
| Histórico | Voltar para uma das 15 últimas versões salvas, ou desfazer tudo o que foi feito pelo painel ("Restaurar o site original"). |
| Usuário e senha | Trocar o usuário e a senha do painel. |

Como funciona:

- Textos e regras só entram no ar ao clicar em **Salvar e publicar**. Cada campo alterado fica marcado e tem um link "Voltar ao original".
- Imagens entram no ar assim que o envio termina.
- Quem está com o site aberto vê a mudança ao recarregar a página.
- "Restaurar o site original" desfaz tudo o que foi feito pelo painel, menos o usuário e a senha. O site volta a ser o de uma instalação nova: com o convite no início e os créditos descritos em "O que mudou em relação ao site original".

O painel não muda a estrutura das páginas (a ordem dos blocos, por exemplo). Para isso é preciso editar os arquivos; veja "Como editar os arquivos à mão".

### Onde ficam as alterações

Na pasta `fronteira-sul/dados/`, criada na primeira vez que algo é salvo:

| Arquivo | O que guarda |
|---|---|
| `dados/conteudo.json` | Os textos, as regras e as opções que foram alterados. |
| `dados/imagens/` | As imagens enviadas pelo painel. |
| `dados/historico/` | As 15 versões anteriores do `conteudo.json`. |
| `dados/acesso.json` | O usuário e a senha do painel. A senha não fica escrita: só o resultado de um cálculo feito com ela (scrypt). |

Essa pasta não vai para o Git (está no `.gitignore`): ela existe só no computador ou servidor onde o site roda. Para levar o conteúdo para outro lugar, copie a pasta. Para guardar em outro local, inicie o servidor com `DADOS_DIR=/caminho/da/pasta`.

### Proteções

- Depois de 5 tentativas erradas de login, é preciso esperar 30 segundos; a espera dobra a cada novo erro, até 15 minutos.
- A sessão termina depois de 12 horas sem uso (ou 7 dias depois do login), ao clicar em "Sair" ou quando o servidor reinicia.
- Trocar o usuário ou a senha encerra as sessões abertas em outros aparelhos.
- Sem login, o painel só mostra a tela de entrada: nada é lido nem alterado. A pasta `dados/` não é alcançada pelo navegador.
- O que o administrador escreve entra nas páginas como texto. Não vira HTML nem script.

## O que é cada arquivo

| Arquivo | O que é |
|---|---|
| `servidor.mjs` | O servidor. Entrega os arquivos de `site/` aplicando o que este projeto mudou e as alterações do painel, e responde como o servidor original. |
| `admin/painel/` | A tela do painel (`index.html`, `painel.css`, `painel.js`). |
| `admin/mapa.mjs` | Lista de tudo o que o painel deixa editar e onde cada texto fica nos arquivos de `site/`. Também guarda o que este projeto mudou na cópia: os créditos (`padrao`) e o que vem ligado (`OPCOES_PADRAO`). |
| `admin/convite-no-inicio.mjs` | O convite do início da página de regras: a estrutura, o visual (CSS) e o que o botão faz. |
| `admin/conteudo.mjs` | Guarda as alterações e monta as páginas com elas. |
| `admin/acesso.mjs` | Login, sessões e limite de tentativas. O usuário e a senha iniciais estão no começo deste arquivo. |
| `admin/api.mjs`, `admin/imagem.mjs` | Os endereços que o painel usa e a conferência das imagens enviadas. |
| `admin/testes/` | Testes automáticos do painel. Rodam com `node fronteira-sul/admin/testes/todos.mjs`. |
| `site/convite/index.html` | A página do convite inteira: textos, botão e visual (o CSS fica no bloco `<style>`). |
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

- Página do convite (`/convite/`): `site/convite/index.html` é HTML comum, com o visual no bloco `<style>` do começo.
- Convite do início da página de regras: não está em `site/`. A estrutura e o visual ficam em `admin/convite-no-inicio.mjs`; depois de editar esse arquivo, reinicie o servidor.
- Créditos e o que vem ligado numa instalação nova: `admin/mapa.mjs` (procure por `padrao` e por `OPCOES_PADRAO`); reinicie o servidor depois.
- Regras: o site original só publica a versão compilada desta página, não o código-fonte. O aplicativo está em `site/assets/index-FbaU4KfD.js` (poucas linhas, todas enormes: use a busca do editor) e o visual em `site/assets/index-DMP8NyHf.css`.

Dois cuidados:

- Uma aspa ou vírgula errada no arquivo `.js` deixa a página em branco. Este comando devolve o original: `git checkout -- fronteira-sul/site/assets/index-FbaU4KfD.js`
- O painel acha cada texto pelo que está escrito em volta dele no arquivo. Se uma edição à mão apagar esse trecho, o painel avisa que aquele campo não pode mais ser editado; o resto continua funcionando. Um texto alterado pelo painel vale mais que o do arquivo.

## O que ainda aponta para o site original

A cópia traz junto o que a hospedagem original (Manus) colocava nas páginas. Os dois primeiros itens se resolvem pelo painel:

- O selo "Made with Manus" no canto da tela e os scripts de estatística (Manus, Plausible e Amplitude). Com internet, as visitas feitas à cópia são enviadas para esses serviços. Para tirar: painel > Avançado.
- Os endereços oficiais das páginas (`canonical`, `og:url`, `og:image`, `twitter:image`), o `robots.txt` e o `sitemap.xml` apontam para `fronteirasul-fmudazpm.manus.space`. Ao colar o link da cópia, a imagem de prévia ainda vem do site original. Para trocar: painel > Compartilhamento > "Endereço onde este site está publicado".
- A página de regras pede `/api/platform/config.js`. No site original esse endereço responde com erro 500; a cópia responde com o mesmo erro e a página funciona do mesmo jeito. Ao tirar o selo da Manus pelo painel, esse pedido também sai.

## Como publicar

O site precisa do `servidor.mjs` rodando, então a hospedagem tem que rodar Node.js (18 ou mais novo): `node fronteira-sul/servidor.mjs`.

Não publique a pasta `site/` sozinha numa hospedagem só de arquivos estáticos. Ela é a cópia do site original como ele era: sem o convite no início, com os créditos antigos, sem a aba Admin, sem o painel e sem nada do que foi alterado por ele.

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

### A cópia

Em 11/11/2026 o site original e a cópia foram abertos no Chrome 156, em tela de computador (1440×900) e de celular (390×844), repetindo os mesmos passos nos dois: as duas páginas de cima a baixo, as duas abas das regras, a busca, o menu de seções, o índice, o botão de copiar o Discord, o link do convite para as regras e a página de "não encontrado".

- Os arquivos que o navegador recebeu do site original são os mesmos bytes gravados em `site/`.
- O texto, o HTML e a posição e o estilo de cada elemento ficaram iguais em todos os passos.
- As 98 fotos de tela ficaram idênticas pixel a pixel. Em 2 delas, com o campo de busca em uso, isso só aconteceu na segunda carga: na primeira havia 33 pixels diferentes.
- A cópia não fez nenhum pedido ao site original.

Duas respostas mudam a cada pedido no site original e por isso ficaram com o valor do momento da cópia: o código `nonce` de um dos scripts de estatística nos dois `.html` e a data `lastmod` do `sitemap.xml`.

Essa comparação foi feita antes de o painel e o convite no início existirem, e continua valendo para os arquivos de `site/`. Numa instalação nova, as diferenças para o original são as três de "O que mudou em relação ao site original". Desligando o convite no início e a aba Admin no painel e escrevendo de volta os créditos da cópia, todos os arquivos saem byte a byte iguais aos de `site/` (os testes automáticos conferem isso).

### O convite no início e os créditos

Em 11/11/2026 a página de regras foi aberta no Chromium 153 em sete tamanhos de tela, de 320×568 (celular pequeno) a 1920×1080, incluindo celular deitado. Em todos:

- O convite é a primeira coisa da página, a imagem aparece inteira e sem distorção, e não há rolagem para os lados.
- O botão "Consultar regras oficiais" (com o mouse, com o toque ou pelo teclado) e o clique na imagem param a página exatamente no começo das regras.
- Em seis dos sete tamanhos o convite inteiro, com o botão, cabe na tela sem rolar. A exceção é o celular deitado (844×390), em que é preciso rolar um pouco para ver o botão; a imagem, que também é clicável, aparece inteira.

Em tela de computador (1440×900) e de celular (390×844) também foi conferido:

- O botão da página `/convite/` abre a página de regras já nas regras, e o visitante consegue subir até o convite.
- Com a rede lenta, a página continua parada no começo das regras. Foram dois casos: o logo chegando depois do clique, e os scripts de estatística demorando 0,4 s e 1,5 s para responder ao chegar por `/#regras` (este também em 800×600).
- Ao recarregar uma página aberta por `/#regras`, ou voltar a ela pelo histórico, o convite não mexe na rolagem: quem devolve o visitante ao ponto em que ele estava é o navegador, como em qualquer página.
- O destino do botão, trocado pelo painel: com o endereço completo do próprio site, o botão desce até as regras sem recarregar a página; com outra página ou outro site, o navegador abre o endereço. Ctrl+clique abre outra aba, que já começa nas regras.
- A busca, o menu de seções e o logo do topo funcionam com o convite acima; digitar na busca não move a página.
- Os créditos mostram MURILO MENDES e o Discord novo, o botão de copiar copia `sgtmendes1997_29726`, e nenhum dado dos créditos antigos aparece na página.
- No painel: os créditos novos aparecem como texto original; mudar o texto do convite muda nos dois lugares; a opção desliga e religa o convite no início; "Voltar ao original" e "Restaurar o site original" voltam para este estado.

Não foi testado em Firefox nem em Safari.

### O painel

Há dois conjuntos de testes.

Os testes automáticos ficam em `admin/testes/` e podem ser repetidos a qualquer momento, sem instalar nada:

```bash
node fronteira-sul/admin/testes/todos.mjs
```

Eles usam pastas temporárias e não mexem em `site/` nem em `dados/`. Conferem, entre outras coisas:

- Cada um dos 93 campos de texto, trocado sozinho, muda só o próprio trecho, e o aplicativo continua válido. Textos com aspas, barras, tags e emoji não quebram a página nem viram HTML.
- Login, sessões, limite de tentativas e troca de usuário e senha; a senha antiga para de valer.
- Depois de reiniciar o servidor, o conteúdo, as imagens e o novo acesso continuam.
- O convite no início: o que entra na página, o que sai quando ele é desligado, o botão com cada tipo de destino e a troca da imagem.
- Os créditos novos: nada dos créditos da cópia é entregue em nenhum arquivo.
- Histórico e "restaurar o site original", que devolve os arquivos byte a byte ao estado de uma instalação nova.
- Sem login, os pedidos para ler ou alterar o conteúdo são recusados, e arquivos fora de `site/` e da tela do painel não são entregues.

Além disso, em 11/11/2026 o painel foi usado de ponta a ponta no Chromium, em tela de computador (1440×900) e de celular (390×844): entrar pela aba Admin, mudar regulamento, textos fixos, multas, convite, imagens, endereço de compartilhamento e opções, conferindo cada mudança no site aberto como visitante; trocar usuário e senha; duas pessoas salvando ao mesmo tempo; sessão que cai no meio de uma edição. Esse roteiro precisa de um navegador e não está no repositório.
