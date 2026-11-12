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
| 2. O que este projeto mudou | `admin/mapa.mjs` e `admin/convite-no-inicio.mjs` | O site começar pelo convite, os créditos e a aba Admin. Vale em toda instalação. |
| 3. O que o administrador muda | `dados/` | Tudo o que é salvo pelo painel. |

Esta pasta é independente do sistema PCPR que está no restante do repositório. Um não usa nada do outro.

## O que mudou em relação ao site original

Numa instalação nova, sem nada salvo pelo painel, o site difere do original em três pontos:

1. **O site começa pelo convite.** No original, o endereço principal (`/`) era a página de regras e o convite ficava em `/convite/`. Aqui, quem entra no site vê só o convite: a imagem, o texto ("CONVITE OFICIAL", "Uma nova história começa aqui.", "Conheça a cidade, confira as regras oficiais e prepare-se para o roleplay.") e o botão "Consultar regras oficiais". As regras ficam em outra página, `/regras/`, e é por esse botão que se chega a elas.
   - Clicar na imagem faz o mesmo que o botão.
   - O convite inteiro, com o botão, cabe na tela sem rolar. Para isso a imagem encolhe em telas baixas (notebooks) e fica ao lado do texto em telas mais baixas ainda (celular deitado). Nas telas em que o convite original já cabia com folga, a página é igual à original. Os limites e as medições estão em "Como foi conferido".
   - A página de regras é a do original, sem o convite. Ela não tem um botão para voltar ao convite: volta-se pelo "voltar" do navegador.
   - Para mandar alguém direto para as regras, o link é `/regras/`.
   - `/convite/`, o endereço antigo do convite, continua valendo: leva para `/`.
   - Um endereço que não existe mostra a tela "página não encontrada" do site, como no original. O botão dela ("Go Home") leva ao início, que é o convite.
   - Para voltar aos endereços do original (regras em `/`, convite em `/convite/`): painel > Convite > "Começar o site pelo convite". Com a opção desligada, `/regras/` leva para `/`, então um link para as regras vale nos dois casos.
2. **Créditos ("Quem criou"), no fim da página de regras.** Nome: MURILO MENDES. Discord: `sgtmendes1997_29726`. As linhas de telefone e de e-mail estão vazias e por isso não aparecem. Para mudar ou preencher: painel > Página de regras > "Créditos (fim da página)".
3. **Aba Admin**, na página de regras, à direita de "Regras da Polícia".

No painel, "original" quer dizer esse estado, e não a cópia: "Voltar ao original" e "Restaurar o site original" voltam para o site começando pelo convite e para os créditos acima.

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

Não abra os `.html` com dois cliques. As páginas pedem os arquivos por caminhos que começam em `/` (`/assets/...`, `/fronteira-sul-convite-preview.jpg`), então só funcionam quando são entregues pelo `servidor.mjs`.

## Área do administrador

### Como entrar

Na página de regras (`/regras/`) há uma aba **Admin**, à direita de "Regras da Polícia". Ela leva para `/admin/`, que pede usuário e senha. O endereço `/admin/` também pode ser digitado direto.

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
| Convite | Textos do convite, o botão e para onde ele leva. Também liga e desliga a opção de o site começar pelo convite. |
| Imagens | Imagem do convite, logo e ícone da aba do navegador (PNG, JPG, WebP ou GIF, até 8 MB). |
| Compartilhamento | Título e descrição que aparecem na aba do navegador e na prévia do link no Discord e no WhatsApp, e o endereço onde o site está publicado. |
| Avançado | Tirar o selo "Made with Manus" e os scripts de estatística; CSS extra para mudar cores e tamanhos. |
| Histórico | Voltar para uma das 15 últimas versões salvas, ou desfazer tudo o que foi feito pelo painel ("Restaurar o site original"). |
| Usuário e senha | Trocar o usuário e a senha do painel. |

Como funciona:

- Textos e regras só entram no ar ao clicar em **Salvar e publicar**. Cada campo alterado fica marcado e tem um link "Voltar ao original".
- Imagens entram no ar assim que o envio termina. O convite se ajusta ao formato da imagem enviada (quadrada ou em pé, por exemplo); o ideal continua sendo 1200 × 675. A mesma imagem aparece na prévia quando o link é colado no Discord ou no WhatsApp.
- Quem está com o site aberto vê a mudança ao recarregar a página.
- "Restaurar o site original" desfaz tudo o que foi feito pelo painel, menos o usuário e a senha. O site volta a ser o de uma instalação nova: começando pelo convite e com os créditos descritos em "O que mudou em relação ao site original".
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
| `admin/mapa.mjs` | Lista de tudo o que o painel deixa editar e onde cada texto fica nos arquivos de `site/`. Também guarda o que este projeto mudou na cópia: os créditos e o destino do botão do convite (`padrao`) e o que vem ligado (`OPCOES_PADRAO`). |
| `admin/convite-no-inicio.mjs` | O site começar pelo convite: em que endereço fica cada página, o que muda no aplicativo de regras para ele funcionar em `/regras/` e as regras de visual que fazem o convite caber na tela. |
| `admin/conteudo.mjs` | Guarda as alterações e monta as páginas com elas. |
| `admin/acesso.mjs` | Login, sessões e limite de tentativas. O usuário e a senha iniciais estão no começo deste arquivo. |
| `admin/api.mjs`, `admin/imagem.mjs` | Os endereços que o painel usa e a conferência das imagens enviadas. |
| `admin/testes/` | Testes automáticos do painel. Rodam com `node fronteira-sul/admin/testes/todos.mjs`. |
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

- Convite (o início do site): `site/convite/index.html` é HTML comum, com o visual no bloco `<style>` do começo. Na hora de entregar, o servidor acrescenta a ele o destino do botão (`/regras/`), o clique na imagem e as regras de visual que fazem o convite caber na tela. Essas regras ficam em `admin/convite-no-inicio.mjs`; depois de editar esse arquivo, reinicie o servidor.
  - As regras contam com a altura do cartão do texto como ele é hoje (`CARTAO_AO_LADO` e `CARTAO_EMBAIXO`, no mesmo arquivo). Se você mudar à mão o tamanho das letras ou os espaços do cartão, ajuste esses dois números.
  - Os testes automáticos guardam essas regras por extenso (`admin/testes/apoio.mjs`) e falham se elas mudarem. É de propósito: eles não abrem um navegador, e o que garante que o convite cabe na tela são as medições de "Como foi conferido". Depois de mudar as regras, confira a página em vários tamanhos de janela (as ferramentas de desenvolvedor do navegador têm um modo para isso) e atualize o texto do teste.
- Endereço de cada página (`/`, `/regras/`, `/convite/`): também em `admin/convite-no-inicio.mjs`.
- Créditos e o que vem ligado numa instalação nova: `admin/mapa.mjs` (procure por `padrao` e por `OPCOES_PADRAO`); reinicie o servidor depois.
- Regras: o site original só publica a versão compilada desta página, não o código-fonte. O aplicativo está em `site/assets/index-FbaU4KfD.js` (poucas linhas, todas enormes: use a busca do editor) e o visual em `site/assets/index-DMP8NyHf.css`.

Três cuidados:

- Uma aspa ou vírgula errada no arquivo `.js` deixa a página em branco. Este comando devolve o original: `git checkout -- fronteira-sul/site/assets/index-FbaU4KfD.js`
- O painel acha cada texto pelo que está escrito em volta dele no arquivo. Se uma edição à mão apagar esse trecho, o painel avisa que aquele campo não pode mais ser editado; o resto continua funcionando. Um texto alterado pelo painel vale mais que o do arquivo.
- Para a página de regras funcionar em `/regras/`, o servidor troca dois trechos do aplicativo na hora de entregar (estão descritos em `admin/convite-no-inicio.mjs`). Se uma edição à mão apagar o primeiro deles, o site volta aos endereços do original, com as regras em `/`, e o painel avisa.

## O que ainda aponta para o site original

A cópia traz junto o que a hospedagem original (Manus) colocava nas páginas. Os dois primeiros itens se resolvem pelo painel:

- O selo "Made with Manus" no canto da tela e os scripts de estatística (Manus, Plausible e Amplitude). Com internet, as visitas feitas à cópia são enviadas para esses serviços. Para tirar: painel > Avançado.
- Os endereços oficiais das páginas (`canonical`, `og:url`, `og:image`, `twitter:image`), o `robots.txt` e o `sitemap.xml` apontam para `fronteirasul-fmudazpm.manus.space`. Ao colar o link da cópia, a imagem de prévia ainda vem do site original. Para trocar: painel > Compartilhamento > "Endereço onde este site está publicado". Com esse endereço preenchido, o convite é anunciado em `/` e as regras em `/regras/`, e o `sitemap.xml` lista as duas páginas.
- A página de regras pede `/api/platform/config.js`. No site original esse endereço responde com erro 500; a cópia responde com o mesmo erro e a página funciona do mesmo jeito. Ao tirar o selo da Manus pelo painel, esse pedido também sai.

## Como publicar

O site precisa do `servidor.mjs` rodando, então a hospedagem tem que rodar Node.js (18 ou mais novo): `node fronteira-sul/servidor.mjs`.

Não publique a pasta `site/` sozinha numa hospedagem só de arquivos estáticos. Ela é a cópia do site original como ele era: com as regras no endereço principal e o convite em `/convite/`, com os créditos antigos, sem a aba Admin, sem o painel e sem nada do que foi alterado por ele.

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

Essa comparação foi feita antes de o painel existir e de o site começar pelo convite, e continua valendo para os arquivos de `site/`. Numa instalação nova, as diferenças para o original são as três de "O que mudou em relação ao site original". Desligando no painel "Começar o site pelo convite" e a aba Admin e escrevendo de volta os créditos da cópia, todos os arquivos saem byte a byte iguais aos de `site/`, nos endereços do original (os testes automáticos conferem isso).

### O site começando pelo convite

Em 11/11/2026 o site foi aberto no Chromium 153, com os textos e a imagem originais do convite. As medições e os passos abaixo foram feitos por roteiros que comandam o navegador; eles precisam de um navegador instalado e não estão no repositório.

**O convite cabe na tela.** A página foi medida em 449.751 tamanhos de janela: todas as larguras pares de 320 a 1500 pixels, com todas as alturas de 240 a 1000.

- Nessas medidas, o convite inteiro, com o botão, cabe sem rolar em toda janela a partir de 320 × 365. Com 480 ou mais de largura, cabe a partir de 301 de altura.
- Em janelas mais baixas que isso é preciso rolar.
- A página original do convite, medida do mesmo jeito, cabia em 39% desses tamanhos, e em 51,5% o botão ficava para fora da tela, inteiro ou em parte. A nova cabe em 94,9%.
- Em nenhum tamanho a página nova deixa de caber onde a original cabia.
- Onde a original cabia, a nova tem as mesmas medidas em 91,7% dos tamanhos. Nos outros 8,3% a imagem fica menor, entre 84% e 100% da largura original (na metade deles, 97% ou mais). São janelas em que a original cabia por pouco: a página nova reserva para o cartão do texto a altura dele com o parágrafo em duas linhas (e, com o botão embaixo do texto, também o título), mesmo quando o texto ocupa menos.

Essa medição foi feita com a página dentro de um quadro que muda de tamanho. Depois ela foi aberta direto em 40 tamanhos de tela, de 320×480 a 2560×1440 (celular em pé e deitado, com toque; tablet; notebook; monitor):

- Nos 40 a página mostra só o convite: o botão é o único link, e nada da página de regras é carregado. O convite cabe sem rolar, a imagem aparece inteira e sem distorção, e não há rolagem para os lados.
- A página original cabia em 14 desses 40. Em 1366×768 o botão dela ficava cortado no fim da tela (14,7 pixels para fora) e em 1366×650 ficava inteiro para fora (começava 84,7 pixels abaixo do fim da tela).
- Em dez tamanhos em que a original cabia com folga (320×568, 390×844, 412×915, 600×962, 768×1024, 820×1180, 1440×900, 1600×900, 1920×1080 e 2560×1440), a foto da página nova é idêntica à da original, pixel a pixel. O navegador de teste desenha a imagem de duas maneiras, de uma carga para outra, na original e na nova; a comparação foi entre fotos desenhadas da mesma maneira.

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

**No painel:**

- A aba Admin da página de regras leva ao login. Os links "Ver regras" e "Ver convite" apontam para `/regras/` e `/`.
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
- As medidas valem para os textos originais. Com textos bem mais compridos o cartão cresce, e a página pode precisar de rolagem em telas baixas. Num teste com um título de 79 letras e um texto de 169 (os originais têm 30 e 74), em oito tamanhos de tela, a página passou a rolar em cinco: 1366×650, 1366×768, 1440×900, 360×560 e 844×390. O botão continuou inteiro à vista em quatro deles e ficou cortado em 844×390 (celular deitado). Depois de mudar os textos, vale abrir "Ver convite" e conferir.

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
- O site começando pelo convite: o que responde em cada endereço, o que cada página recebe, o botão com cada tipo de destino e a troca da imagem. Com a opção desligada, tudo como no original. Se um arquivo de `site/` vier diferente e a troca de endereços não puder ser feita, o site fica como o original e o painel avisa.
- As regras de visual do convite: são, letra por letra, as que foram medidas no navegador; com outra imagem, só muda nelas o que depende do formato da imagem.
- Os créditos novos: nada dos créditos da cópia é entregue em nenhum arquivo.
- Histórico e "restaurar o site original", que devolve os arquivos byte a byte ao estado de uma instalação nova.
- Sem login, os pedidos para ler ou alterar o conteúdo são recusados, e arquivos fora de `site/` e da tela do painel não são entregues.

Além disso, em 11/11/2026 o painel foi usado de ponta a ponta no Chromium, em tela de computador (1440×900) e de celular (390×844): entrar pela aba Admin, mudar regulamento, textos fixos, multas, convite, imagens, endereço de compartilhamento e opções, conferindo cada mudança no site aberto como visitante; trocar usuário e senha; duas pessoas salvando ao mesmo tempo; sessão que cai no meio de uma edição. O roteiro foi repetido depois de o site passar a começar pelo convite, com as regras em `/regras/`. Ele precisa de um navegador e não está no repositório.
