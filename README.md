# Portal de Editais · Polícia Militar do Paraná

Portal web com os editais da **PMPR**, do **ROTAM**, da **RONE** e o edital de
recrutamento do **13º Batalhão — Fronteira Sul** em formato de formulário.

Todo o conteúdo é publicado dentro do próprio site: o texto integral dos três
editais, banco de questões com gabarito comentado, simulado, integração com o
Discord da tropa e uma **aba do comando** protegida por login. Não há links para
sites de terceiros em nenhuma etapa.

## Como rodar

```bash
npm install
npm run dev      # http://localhost:3000
```

Build de produção:

```bash
npm run build
npm start
```

## Aba do Comando

Acesso pelo botão **Aba do Comando** no cabeçalho ou no rodapé.

| Campo | Valor inicial |
| ----- | ------------- |
| Login | `comnadopmpr` |
| Senha | `142536` |

Dentro do painel é possível:

- **Discord** — cadastrar o webhook do canal, definir o nome do canal, o convite
  do servidor, ligar o envio automático e a menção `@here`. Há botão de teste e
  envio manual de qualquer um dos três editais.
- **Editais** — alterar o status exibido no site (aberto, em breve, encerrado),
  publicar um aviso que aparece no portal e escrever uma **publicação
  complementar** (retificação, errata, novo prazo) que entra no fim do documento
  oficial do site.
- **Tropa** — ver quem vinculou o Discord, marcar como vinculado e remover.
- **Login e senha** — trocar o login e a senha (exige a senha atual). Todas as
  sessões são encerradas e um novo token é emitido.

As credenciais, o webhook e os cadastros ficam em `portal-data.json`, criado na
raiz do projeto na primeira execução (arquivo ignorado pelo Git).

### Como pegar o webhook do Discord

No servidor: **Configurações do canal → Integrações → Webhooks → Novo webhook →
Copiar URL do webhook**. Cole a URL na aba Discord e clique em *Enviar teste*.

## Editais publicados no próprio site

O texto integral dos três editais fica em `src/data/documentos.ts`, dividido em
capítulos, incisos e tabelas. O leitor de documento (`EditalDocumento`) oferece:

- sumário lateral com busca interna;
- navegação capítulo anterior / próximo;
- **Impressão em formato oficial** (A4, com cabeçalho, brasão, tabelas e
  assinaturas) via CSS `@media print`;
- **download em texto** gerado no navegador, sem servidor externo.

Nenhum link aponta para fora do portal. A única URL externa é a do webhook do
Discord, informada pelo próprio comando no painel.

## Recrutamento RP — 13º Batalhão

O edital de recrutamento é um formulário de 10 campos (identificação + 8 perguntas
+ redação de 8 linhas + duas perguntas de concordância com escala e ausências).
O candidato preenche no próprio site, com barra de progresso, limite mínimo de
caracteres por resposta e validação no cliente e no servidor.

As inscrições caem na aba **Recrutamento** do painel do comando, com protocolo,
filtro por status, busca e exportação visual de cada resposta. O texto do
formulário fica em `src/data/recrutamento.ts`.

## Estrutura

```
src/
  data/editais.ts        resumo estruturado dos três editais
  data/documentos.ts     TEXTO INTEGRAL dos editais (capítulos e tabelas)
  data/questoes.ts       banco de questões autorais + gabarito comentado
  data/recrutamento.ts   edital-formulário do 13º BPM (Fronteira Sul)
  components/            Header, Hero, EditaisSection, EditalModal,
                         EditalDocumento, DocumentosSection, UnidadesSection,
                         RecrutamentoCard, FormularioModal, ProvasSection,
                         SimuladoSection, DiscordSection, AdminPanel, Footer, ui
server.ts                API Express + Vite (login, Discord, dados do painel)
public/pmpr-brasao.png   brasão da PMPR (Wikimedia Commons)
```

## Endpoints principais

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| POST | `/api/admin/login` | autentica o comando e devolve um token |
| PATCH | `/api/admin/credenciais` | troca login/senha (exige `senhaAtual`) |
| GET | `/api/admin/data` | interessados, envios e status dos editais |
| PATCH | `/api/admin/discord` | salva webhook, canal, convite e opções |
| POST | `/api/admin/discord/teste` | envia mensagem de teste ao canal |
| POST | `/api/admin/envios` | publica um edital no Discord |
| PATCH | `/api/admin/editais/:id` | status, aviso e publicação complementar |
| POST | `/api/public/interesse` | vincula o Discord do candidato aos editais |
| POST | `/api/public/recrutamento` | recebe a inscrição do formulário do 13º BPM |
| GET | `/api/admin/inscricoes` | lista as inscrições recebidas |
| PATCH | `/api/admin/inscricoes/:id` | altera status e observação do comando |

Rotas `/api/admin/*` exigem o cabeçalho `Authorization: Bearer <token>`, com
sessão de 8 horas.

## Fontes

- Dados do concurso de Soldado (2.000 vagas, banca IBFC, R$ 6.101,87, estrutura
  de 60 questões e índices do TAF): Edital 01/2025 e coberturas de imprensa
  especializada.
- Histórico da PMPR, ROTAM e RONE: portal oficial da PMPR e imprensa paranaense.
- Questões e texto dos editais: produzidos para este portal, com base no
  conteúdo programático e na estrutura dos documentos originais.

> Projeto demonstrativo, sem vínculo oficial com a Polícia Militar do Paraná.
> Confira sempre o edital publicado pela corporação.
