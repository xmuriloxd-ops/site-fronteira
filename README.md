# Portal de Inscrições · Polícia Militar do Paraná

Portal de inscrições da **PMPR**, da **ROTAM** e da **RONE**: cada unidade tem
seu formulário próprio, aberto pelas abas do topo, e toda ficha preenchida cai
no canal do Discord do comando. O comando ainda publica **cartazes de
divulgação em imagem** direto no Discord.

Não há editais, banco de questões nem simulado: o portal é de inscrições.

## Como rodar

```bash
npm install
npm run dev      # http://localhost:3000 (Vite + servidor)
```

Build de produção:

```bash
npm run build
npm start        # NODE_ENV=production node dist/server.cjs
```

Para colocar no ar (Docker, VPS, Fly.io, Render), siga **[PUBLICAR.md](./PUBLICAR.md)**.

## Abas do topo

| Aba | O que faz |
| --- | --- |
| **13º BPM** | abre a ficha de recrutamento do batalhão |
| **ROTAM** | abre a ficha da ROTAM |
| **RONE** | abre a ficha da RONE |
| **Unidades** | apresenta as três tropas e o documento de divulgação |

Os formulários **só** são acessados por essas abas. A seção *Unidades* mostra o
documento de divulgação publicado pelo comando.

## Aba do Comando

Acesso pelo botão **Aba do Comando** no cabeçalho.

| Campo | Valor inicial |
| --- | --- |
| Login | `comando` |
| Senha | `1234` |

> **Troque a senha antes de publicar** (aba *Login e senha*).

Dentro do painel:

- **Divulgação** — documento das inscrições abertas (unidades, texto, data,
  horário, responsável) e o **cartaz em imagem**, com prévia ao vivo. Clicar na
  unidade troca a arte: foto, faixa, palavra em destaque e blocos.
  - **PMPR** — *Edital Aberto / Soldado*
  - **ROTAM** — foto real da viatura; inclui **data, horário e local da prova**
  - **RONE** — foto real da tropa; inclui **data, horário e local da prova**
  - O local da prova é escolhido numa lista de **batalhões da PMPR** e entra
    no cartaz automaticamente.
  - **Enviar só o cartaz ao Discord** publica a imagem, sem texto junto.
- **Canais do Discord** — dois cadastros independentes:
  | Canal | Recebe |
  | --- | --- |
  | **Canal das fichas** | toda ficha preenchida |
  | **Canal das divulgações** | os cartazes publicados |

  Cada um tem URL de webhook, nome do canal e opção de `@here`. Se o canal das
  divulgações ficar vazio, os cartazes usam o das fichas.
- **Recrutamento** — fichas recebidas, com respostas e status do envio.
- **Tropa** — quem vinculou o Discord e o histórico de envios.
- **Login e senha** — troca as credenciais e encerra as sessões.

### Como pegar o webhook do Discord

No Discord: **Configurações do canal → Integrações → Webhooks → Novo webhook →
Copiar URL do webhook**. Cole na aba *Divulgação* e use **Enviar teste**.

O envio sai do **navegador** de quem publica (o servidor do portal não acessa o
Discord): a URL do webhook nunca é usada pelo servidor para postar.

## Cartaz de divulgação

Gerado no navegador em `<canvas>`, 1600×900, na arte do modelo oficial:

- cabeçalho com brasão, lema e *“Junte-se a nós”*
- faixa amarela inclinada com o selo da unidade
- **CONCURSO PARA SOLDADO** (PMPR) ou **SELEÇÃO INTERNA ROTAM/RONE**
- frase de apoio e três blocos com ícones
- rodapé do Governo do Paraná
- **prova de ingresso** (data, horário e local) nos cartazes da ROTAM e da RONE

Fontes: **Anton** e **Barlow Condensed**, self-hosted em `public/fontes`
(SIL Open Font License — veja os arquivos `OFL-*.txt`).

## Estrutura

```
server.ts                  servidor Express: API, sessão, estáticos, SPA
src/App.tsx                portal (abas, formulários, seção de unidades)
src/components/            Header, Hero, UnidadesSection, formulários, painel
src/data/                  fichas das unidades, batalhões da PMPR
src/lib/cartaz.ts          desenho do cartaz no canvas
src/lib/discord.ts         envio ao Discord pelo navegador
src/lib/documentoTexto.ts  texto do documento de divulgação
public/                    brasão, fotos do cartaz, fontes, manifest
```

### Dados persistidos

Criados na primeira execução, fora do Git (ou em `PORTAL_DATA_DIR`):

- `portal-data.json` — fichas, divulgação, canais, login e senha
- `.portal-secret` — assinatura das sessões
- `.portal-sessao.json` — sessões encerradas

## API (resumo)

| Rota | O que faz |
| --- | --- |
| `GET /api/health` | status do portal |
| `GET /api/public/config` | dados públicos do site |
| `POST /api/public/recrutamento` | recebe a ficha e devolve o destino no Discord |
| `POST /api/admin/login` | login do comando (token) |
| `GET /api/admin/data` | dados do painel |
| `GET/PATCH /api/admin/divulgacao` | documento de divulgação |
| `GET /api/admin/discord/webhook?finalidade=divulgacao` | webhook do canal das divulgações |
| `PATCH /api/admin/discord` | cadastro dos dois canais |
| `PATCH /api/admin/credenciais` | troca login e senha |

## Verificações

```bash
npm run lint     # tsc --noEmit
npm run build    # build de produção
```
