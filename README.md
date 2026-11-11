# Corregedoria PMPR RP · Canal de Denúncias

Site da **Corregedoria-Geral da Polícia Militar do Paraná** (ambiente de
roleplay) para **protocolar denúncias** contra policiais militares: natureza do
fato, denunciado (nome, posto e unidade), relato, local, data dos fatos, até
**4 fotos de evidência** e **denúncia anônima**. Cada registro recebe um
**protocolo automático** (`DEN-AAAA-0001`) e pode ser **enviado
automaticamente ao canal do Discord** por webhook.

> Projeto de **roleplay**, sem vínculo com órgãos oficiais. O **brasão da
> PMPR** (`public/brasao-pmpr.png`) é usado como identidade visual do servidor
> de RP — escudo dourado com o falcão Nhapecani, legendas em verde e o
> payssage do Paraná. As cores do site seguem o brasão: **azul (blau da
> bandeira), dourado (escudo), verde (pinheiro) e branco**.
>
> `public/favicon-pmpr.png` e `public/icon-pmpr-512.png` são as versões
> quadradas para a aba do navegador / PWA. Os assets de identidade são
> servidos com `Cache-Control: no-store` e o `index.html` remove service
> workers/cache de versões anteriores.

## Como rodar

```bash
npm install
npm run dev      # http://localhost:3000
```

O servidor escuta **apenas** em `PORT` (padrão `3000`, em `0.0.0.0`). O HMR do
Vite fica desligado (`server.ws: false`) para não abrir um segundo listener em
`24678`, que responderia `426 Upgrade Required` em vez de servir o site. Após
editar arquivos, basta recarregar a página.

Build de produção:

```bash
npm run build
npm start        # ja força NODE_ENV=production e serve dist/
```

Em produção o servidor precisa apenas de `express` e `compression`: React,
Vite e Tailwind ficam em `devDependencies` porque o front já vai compilado em
`dist/`. Defina **`PC_SENHA`** antes de expor o site (Basic Auth embutido — sem
ela, `/api/estado` devolve a URL do webhook para qualquer visitante) e monte um
volume em `PC_DATA_DIR` para não perder os registros.

Para publicar, rode `npm run check:deploy` e veja
**[PUBLICAR.md](./PUBLICAR.md)** (Docker, VPS, Render, Fly.io, **GitHub
Pages** e checklist).

**GitHub Pages (modo estático):** o workflow `.github/workflows/deploy-pages.yml`
publica o site em
**https://xmuriloxd-ops.github.io/projetos-cidades2/**
a cada push neste branch — exigindo repositório público e
*Settings → Pages → Source: GitHub Actions*. Sem servidor, cada navegador
guarda as denúncias em `localStorage` (use *Backup JSON*); para dados
compartilhados, suba a versão com servidor (Docker/VPS).

## As três abas

| Aba | O que faz |
| --- | --- |
| **Fazer denúncia** | Formulário completo: natureza da denúncia, local, data dos fatos, relato com modelos de abertura, denunciado (nome/posto/unidade com unidades da PMPR), denunciante opcional com **interruptor de anonimato**, upload de até 4 evidências comprimidas no navegador e **prévia do protocolo** com dia/data automáticos. |
| **Denúncias** | Acervo com estatísticas, busca, filtro por situação e natureza, cartões com protocolo e situação, **modal de detalhes** com galeria de evidências (lightbox), **acompanhamento da corregedoria** (situação + parecer interno), edição, exclusão com confirmação, envio avulso ao Discord e **backup JSON**. |
| **Canal do Discord** | Cadastro do webhook, formato de envio (**embed + fotos / resumo + fotos / só texto**), nome do remetente, **envio automático**, `@here`, menção a cargo, **teste de integração**, reenvio de pendentes, **prévia da mensagem** e histórico de entregas. |

### Campos da denúncia

| Campo | Observação |
| --- | --- |
| Natureza | Conduta em serviço, abuso de autoridade, desrespeito ao cidadão, uso indevido de arma, assédio, discriminação, negligência, tráfico de influência, conduta fora do serviço ou outro |
| Local / data dos fatos | Opcionais, com data máxima de hoje |
| Relato | Obrigatório (mínimo 30 caracteres), com chips de modelos de abertura |
| Denunciado | Nome ou descrição, posto/graduação e unidade/OPM (datalist com unidades da PMPR) |
| Denunciante | **Anônimo por padrão** — ao desligar o anônimo, nome e contato ficam opcionais |
| Evidências | Até 4 imagens, comprimidas no navegador (JPEG ~1200 px) |
| Situação / parecer | Preenchidos na corregedoria pelo modal (aberta, em análise, procedente, improcedente, arquivada) |

Cada denúncia recebe um número sequencial por ano, por exemplo
`DEN-2026-0007`. Dia, data e horário do protocolo são gerados automaticamente
no servidor (horário de Brasília) e não podem ser digitados.

## Discord (envio automático)

1. No Discord: **Configurações do canal → Integrações → Webhooks → Novo webhook → Copiar URL do webhook**.
2. Cole a URL na aba **Canal do Discord**, ajuste formato/opções e clique em **Salvar configuração**.
3. Clique em **Enviar teste**. Com *Envio automático* ligado, **toda denúncia protocolada já cai no canal** como embed completo + fotos de evidência (ou no formato escolhido).
4. Na lista, use **Enviar pendentes** para reenviar em lote o que ainda não foi entregue.

A mensagem chega como embed institucional (azul) com protocolo, natureza,
denunciado, relato, local, data dos fatos e denunciante (ou `ANÔNIMO`), com o
brasão da PMPR como thumbnail e as evidências anexadas. O envio sai primeiro do
**navegador** de quem registra (o webhook aceita POST `multipart/form-data`
com `payload_json` + `files[0]`); se a rede ou uma extensão bloquear, o
sistema reenvia pelo **servidor** (`/api/discord/proxy`). Não é preciso criar
bot nem token; só a URL do webhook. **Quem tem essa URL pode postar no canal —
trate-a como segredo.**

## Dados

- Com o servidor rodando, tudo fica em `dados-corregedoria-pmpr.json` (fora do
  Git) e é **compartilhado** entre os agentes que acessam o site. Em Docker,
  use a variável `PC_DATA_DIR` e monte um volume para não perder registros.
- Se a API não responder (hospedando só o build estático), o navegador passa a
  usar `localStorage` automaticamente — o site continua funcionando, com dados
  apenas naquele navegador. O cabeçalho mostra o modo ativo.
- **Backup JSON** na aba *Denúncias* exporta denúncias, configuração do
  Discord e histórico de envios.

## API

| Rota | O que faz |
| --- | --- |
| `GET /api/health` | status do serviço |
| `GET /api/estado` | denúncias, config do Discord e histórico |
| `POST /api/sync` | operação atômica: `criar`, `atualizar`, `excluir`, `discord`, `envio` |
| `POST /api/discord/proxy` | fallback de envio pelo servidor (`anexos`: fotos de evidência) |

## Verificações

```bash
npm run lint          # tsc --noEmit
npm run build         # Vite + bundle do servidor
npm run check:deploy  # lint + build + 16 checagens em producao isolada
```

O `check:deploy` sobe `dist/server.cjs` com `NODE_ENV=production`, Basic Auth
ligada e dados temporários, e valida healthcheck, autenticação, assets com
hash/cache, persistência via `/api/sync`, proteção do proxy do Discord e
fallback de rotas. Não altera os dados locais.

## Estrutura

```
.github/workflows/           deploy automático no GitHub Pages
scripts/verificar-deploy.mjs  smoke de produção usado por check:deploy
server.ts                    Express: API, auth opcional, persistência JSON, estáticos/Vite
src/App.tsx                  shell, abas, regras de protocolo e envio
src/components/              cabeçalho (brasão PMPR), formulário, lista/modal, Discord, UI
src/lib/discord.ts           montagem do embed/anexos e entrega ao webhook
src/lib/format.ts            datas pt-BR, compressão de imagem, protocolo DEN-AAAA
src/lib/useEstado.ts         servidor com fallback para localStorage
src/data/opcoes.ts           naturezas, postos, unidades PMPR e sugestões de relato
src/index.css                tema azul/dourado/verde (cores do brasão)
public/                      brasão PMPR, favicon, ícone PWA, fontes, manifest
```

Fontes **Anton** e **Barlow Condensed** self-hosted em `public/fontes`
(SIL Open Font License — arquivos `OFL-*.txt`).
