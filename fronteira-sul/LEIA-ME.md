# Fronteira do Sul RP — cópia do site

Cópia exata do site publicado em <https://fronteirasul-fmudazpm.manus.space>, feita em 11/11/2026.
Nenhum arquivo foi alterado: cada um está em `site/` com os mesmos bytes e no mesmo caminho que tinha no site original.

O site tem duas páginas:

| Página | Endereço | Arquivo principal |
|---|---|---|
| Convite oficial | `/convite/` | `site/convite/index.html` |
| Central de regras | `/` | `site/index.html` + `site/assets/` |

Esta pasta é independente do sistema PCPR que está no restante do repositório. Um não usa nada do outro.

## Como abrir

Só precisa do Node.js 18 ou mais novo. Não há nada para instalar.

```bash
node fronteira-sul/servidor.mjs
```

Depois abra no navegador:

- Convite: <http://localhost:4173/convite/>
- Regras: <http://localhost:4173/>

Para usar outra porta: `PORT=8080 node fronteira-sul/servidor.mjs`.

Não abra os `.html` com dois cliques. As páginas pedem os arquivos por caminhos que começam em `/` (`/assets/...`, `/fronteira-sul-convite-preview.jpg`), então só funcionam quando a pasta `site/` é servida como raiz de um endereço. É isso que o `servidor.mjs` faz.

## O que é cada arquivo

| Arquivo | O que é |
|---|---|
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
| `servidor.mjs` | Servidor local. Entrega os arquivos de `site/` sem modificar nada e responde como o servidor original. |

## Como editar

Edite o arquivo, salve e recarregue a página. O servidor não guarda versão antiga.

### Convite

Tudo fica em `site/convite/index.html`, que é HTML comum.

- Textos: procure por `CONVITE OFICIAL`, `Uma nova história começa aqui.` e `Consultar regras oficiais`.
- Cores e tamanhos: bloco `<style>` no começo do arquivo (fundo `#10120f`, dourado `#eabf4e`).
- Imagem: troque o arquivo `site/fronteira-sul-convite-preview.jpg` mantendo o mesmo nome.
- Título, descrição e imagem que aparecem quando o link é colado no Discord ou no WhatsApp: linhas `og:` e `twitter:` no `<head>`.

### Regras

O site original só publica a versão compilada desta página, não o código-fonte. Por isso a edição é feita direto em `site/assets/index-FbaU4KfD.js`. O arquivo tem poucas linhas, todas enormes: use a busca do editor.

- Regulamento geral: é uma lista que começa logo depois de `QA=JSON.parse('`. Cada seção tem `"id"`, `"title"` e `"paragraphs"` (um parágrafo por item entre aspas). Dentro dos textos, quebra de linha se escreve `\\n` e aspas se escrevem `\\"`. Não use apóstrofo (`'`) nos textos.
- Regras da Polícia (multas e CNH) e os outros textos da tela, como `Roleplay justo.`, `Buscar palavra ou regra...` e o Discord `@sr__black_`: procure o texto e troque só o que está entre as aspas.
- Visual: `site/assets/index-DMP8NyHf.css`.
- Título e descrição da aba e do compartilhamento: `site/index.html`.

Uma aspa ou vírgula errada nesse arquivo deixa a página em branco. Se acontecer, este comando devolve o arquivo original:

```bash
git checkout -- fronteira-sul/site/assets/index-FbaU4KfD.js
```

## O que ainda aponta para o site original

Como nada foi alterado, a cópia traz junto o que a hospedagem original (Manus) colocava nas páginas:

- O selo "Made with Manus" no canto da tela e os scripts de estatística (Manus, Plausible e Amplitude). Com internet, as visitas feitas à cópia são enviadas para esses serviços.
- Os endereços oficiais das páginas (`canonical`, `og:url`, `og:image`, `twitter:image`), o `robots.txt` e o `sitemap.xml` apontam para `fronteirasul-fmudazpm.manus.space`. Ao colar o link da cópia, a imagem de prévia ainda vem do site original.
- A página de regras pede `/api/platform/config.js`. No site original esse endereço responde com erro 500; a cópia responde com o mesmo erro e a página funciona do mesmo jeito.

Esses são os pontos a trocar ou remover antes de publicar a cópia em outro endereço.

## Como publicar

Qualquer hospedagem de site estático serve. Envie o conteúdo de `site/` como raiz do site e configure para que endereços desconhecidos abram o `index.html`. Outra opção é rodar `node fronteira-sul/servidor.mjs` em um servidor com Node.

## Como a cópia foi conferida

Em 11/11/2026 o site original e a cópia foram abertos no Chrome 156, em tela de computador (1440×900) e de celular (390×844), repetindo os mesmos passos nos dois: as duas páginas de cima a baixo, as duas abas das regras, a busca, o menu de seções, o índice, o botão de copiar o Discord, o link do convite para as regras e a página de "não encontrado".

- Os arquivos que o navegador recebeu do site original são os mesmos bytes gravados em `site/`.
- O texto, o HTML e a posição e o estilo de cada elemento ficaram iguais em todos os passos.
- As 98 fotos de tela ficaram idênticas pixel a pixel. Em 2 delas, com o campo de busca em uso, isso só aconteceu na segunda carga: na primeira havia 33 pixels diferentes.
- A cópia não fez nenhum pedido ao site original.

Duas respostas mudam a cada pedido no site original e por isso ficaram com o valor do momento da cópia: o código `nonce` de um dos scripts de estatística nos dois `.html` e a data `lastmod` do `sitemap.xml`.
