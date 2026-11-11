# PCPR RP · Sistema de Registro de Prisões e Mandados

Site **preto e branco** da **Polícia Civil RP do Paraná** para lavrar prisões e
expedir **mandados de prisão em cartaz**:
foto do custodiado, nome, ID, artigos, tempo de prisão, itens apreendidos,
agente que prendeu, unidade da ocorrência, escrivão, **assinatura do escrivão** e
**dia, data e horário gerados automaticamente**. A ficha vira um **cartaz em imagem**
(no modelo do documento impresso) e é enviada ao **canal do Discord**.

> Projeto de **roleplay**, sem vínculo com órgãos oficiais. O brasão da PCPR é
> usado apenas como identidade visual do servidor de RP. O logo oficial enviado
> pelo usuário fica em `public/logo-pcpr.png` (fundo transparente, cores
> originais); `public/logo-pcpr-escuro.png` é a mesma arte usada no cabeçalho
> e no rodapé escuros. `public/favicon-pcpr.png` e `public/icon-pcpr-512.png`
> são as versões quadradas para a aba do navegador / PWA. O mesmo arquivo é
> desenhado dentro dos cartazes de prisão e de mandado, preservando a
> proporção vertical do distintivo.
>
> Os nomes antigos (`brasao-pcpr*.png`, `favicon.png`, `icon-512.png`) ficam
> como cópias idênticas apenas para não quebrar páginas ainda em cache.
> Os assets de logo são servidos com `Cache-Control: no-store` e o
> `index.html` remove service workers/cache de versões anteriores.

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
npm start        # NODE_ENV=production node dist/server.cjs
```

Para publicar (Docker, VPS, Render, Fly.io), veja **[PUBLICAR.md](./PUBLICAR.md)**.

## As quatro abas

| Aba | O que faz |
| --- | --- |
| **Registrar prisão** | Formulário completo com upload de até 4 fotos, sugestões de artigos/itens/tempo de prisão, unidades da PCPR, **assinatura do escrivão desenhada na tela**, campo de data automática e prévia em tempo real da **ficha e do cartaz**. |
| **Prisões registradas** | Acervo com estatísticas, busca, filtro por unidade, ordenação, detalhes, edição, exclusão, impressão, **visualização/baixar do cartaz PNG**, envio avulso ao Discord e backup em JSON. |
| **Mandados de prisão** | Aba própria para **expedir mandados** e consultar os já expedidos. Formulário com foto do procurado, artigos, fundamento, processo, autoridade, juízo de origem, unidade/agente responsável, validade, situação (pendente / cumprido / revogado), **assinatura da autoridade**, dia/data automáticos, numeração `MDP-AAAA-0001`, prévia do **cartaz em tempo real**, download/ impressão do PNG, edição, exclusão e reenvio. Todo mandado é publicado no Discord **em formato de cartaz**. |
| **Canal do Discord** | Cadastro do webhook das prisões, **formato de envio (cartaz / texto / ambos)**, **canal próprio e opcional dos mandados**, nome do remetente, envio automático, `@here`, menção a cargo, **testes com cartaz de exemplo da ficha e do mandado**, reenvio de pendentes, prévias dos dois cartazes e histórico de entregas. |

### Campos da ficha

| Campo | Observação |
| --- | --- |
| Foto do custodiado | Até 4 imagens; comprimidas no navegador e exibidas em preto e branco |
| Nome / ID RP | Identificação do personagem |
| Artigos | Um por linha, com atalhos dos artigos mais usados |
| Tempo de prisão | Texto livre + atalhos (15 min, 1 h, preventiva...) |
| Itens apreendidos | Lista com atalhos (arma, drogas, dinheiro, veículo...) |
| Agente que prendeu | Nome do agente |
| Unidade na ocorrência | Lista de unidades da PCPR + opção “Outra unidade” |
| Nome do escrivão | Responsável pela lavratura |
| Local / observações | Opcionais |
| Assinatura do escrivão | O escrivão desenha com mouse/toque/caneta; sem desenho, o nome é escrito em caligrafia |
| **Dia da semana, data, horário e nº do registro** | **Gerados automaticamente** no ato do registro (horário de Brasília). Não podem ser digitados. |

Cada registro recebe um número sequencial por ano, por exemplo `PCPR-2026-0007`.
Os mandados usam a sequência independente `MDP-2026-0001`.

## Cartaz (o que vai para o Discord)

A ficha é transformada numa **imagem PNG 1200 px de largura** desenhada em `<canvas>`,
no mesmo modelo do documento impresso: brasão da PCPR, faixa preta com o número
do registro, foto em preto e branco, identificação, bloco de dia/data automáticos,
tabela com todos os campos e, no rodapé, a **assinatura do escrivão** sobre a linha
de assinatura. Nenhuma biblioteca externa é usada, então a arte sai igual em
qualquer navegador.

O cartaz pode ser visto/baixado na prévia do formulário, na tela de detalhes da
prisão e na aba do Discord (exemplo com marca d'água `EXEMPLO`). O **Enviar teste**
manda esse cartaz de exemplo para o canal.

Na aba **Canal do Discord** o campo *Formato da ficha no canal* escolhe:

| Formato | O que chega |
| --- | --- |
| **Cartaz em imagem** (padrão) | o PNG da ficha + um embed curto de identificação |
| **Ficha em texto** | embed com todos os campos e a foto do custodiado |
| **Cartaz + texto** | o cartaz, o embed completo e as fotos em anexo |

## Cartaz do mandado de prisão

A aba **Mandados de prisão** gera um segundo cartaz PNG (1200 px de largura) no
mesmo padrão institucional da ficha, adaptado para o mandado: brasão, faixa preta
com `Nº MDP-AAAA-0001`, faixa de **situação do mandado**, foto do procurado em
preto e branco, identificação, bloco de **dia/data/hora gerados automaticamente**,
tabela com artigos, fundamento, processo, autoridade, juízo de origem, unidade
responsável, agente designado, validade e observações, e a **assinatura da
autoridade** no rodapé.

A imagem é enviada como anexo nomeado `cartaz-MDP-....png` e referenciada pelo
embed via `attachment://`. O formato é **sempre cartaz** para mandados — a opção
*Formato da ficha no canal* só afeta as prisões. Na aba Discord há um campo de
webhook exclusivo para mandados; deixando-o vazio, os cartazes usam o mesmo canal
das prisões. Também há **Enviar cartaz de teste** com marca d'água `EXEMPLO` e
reenvio em lote dos cartazes pendentes.

## Discord

1. No Discord: **Configurações do canal → Integrações → Webhooks → Novo webhook → Copiar URL do webhook**.
2. Cole a URL na aba **Canal do Discord**, ajuste as opções e clique em **Salvar configuração**.
3. Clique em **Enviar teste**. Com *Envio automático* ligado, toda prisão
   registrada já cai no canal como **cartaz PNG** (ou no formato escolhido), e
   todo mandado expedido cai no canal dos mandados como **cartaz PNG**.
4. Opcional: preencha o *webhook dos mandados* e use **Enviar cartaz de teste**
   para separar os dois tipos de publicação.

O cartaz é gerado e enviado primeiro do **navegador** de quem registra (o webhook
do Discord aceita POST `multipart/form-data` com `payload_json` + `files[0]`). Se a
rede ou uma extensão bloquear, o sistema reenvia pelo **servidor**
(`/api/discord/proxy`), que monta os mesmos anexos. Não é preciso criar bot nem
token; só a URL do webhook. **Quem tem essa URL pode postar no canal — trate-a
como segredo.**

A ficha também pode ser reenviada manualmente pelo botão **Enviar ao Discord**
na tela de detalhes, ou em lote por **Enviar pendentes**.

## Dados

- Com o servidor rodando, tudo fica em `dados-pcpr-rp.json` (fora do Git) e é
  **compartilhado** entre os agentes que acessam o site. Em Docker, use a
  variável `PC_DATA_DIR` e monte um volume para não perder os registros.
- Se a API não responder (hospedando só o build estático), o navegador passa a
  usar `localStorage` automaticamente — o site continua funcionando, com dados
  apenas naquele navegador. O cabeçalho mostra o modo ativo.
- **Backup JSON** na aba *Prisões registradas* exporta registros, configuração
  e histórico.

## API

| Rota | O que faz |
| --- | --- |
| `GET /api/health` | status do serviço |
| `GET /api/estado` | prisões, mandados, configs do Discord e histórico |
| `POST /api/sync` | operação atômica: `criar`, `atualizar`, `excluir`, `criar-mandado`, `atualizar-mandado`, `excluir-mandado`, `discord`, `discord-mandados`, `envio` |
| `POST /api/discord/proxy` | fallback de envio pelo servidor (`anexos`: cartaz PNG + fotos) |

## Verificações

```bash
npm run lint     # tsc --noEmit
npm run build    # Vite + bundle do servidor
```

## Estrutura

```
server.ts                    Express: API, persistência JSON, estáticos/Vite
src/App.tsx                  shell, abas, regras de registro e envio
src/components/              cabeçalho, formulário, ficha, lista, Discord, modal, UI
src/lib/cartaz.ts            desenho do cartaz PNG da ficha no canvas (modelo + assinatura)
src/lib/cartazMandado.ts     cartaz PNG do mandado de prisão
src/lib/format.ts            datas pt-BR, compressão de imagem, anexos
src/lib/discord.ts           montagem do cartaz/embed e entrega ao webhook
src/lib/useEstado.ts         servidor com fallback para localStorage
src/data/opcoes.ts           unidades, artigos, itens e tempos sugeridos
src/index.css                tema preto e branco + ficha para impressão
public/                      logo oficial (transparente), favicon, ícone PWA, fontes, manifest
```

Fontes **Anton** e **Barlow Condensed** self-hosted em `public/fontes`
(SIL Open Font License — arquivos `OFL-*.txt`).
