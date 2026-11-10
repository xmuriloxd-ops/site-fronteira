# Portal de Editais · Polícia Militar do Paraná

Portal web com os editais da **PMPR**, do **ROTAM** e da **RONE**, provas anteriores
para download, simulado corrigido, integração com o Discord da tropa e uma
**aba do comando** protegida por login.

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
- **Editais** — alterar o status exibido no site (aberto, em breve, encerrado) e
  publicar um aviso que aparece no portal e no modal do edital.
- **Tropa** — ver quem vinculou o Discord, marcar como vinculado e remover.
- **Login e senha** — trocar o login e a senha (exige a senha atual). Todas as
  sessões são encerradas e um novo token é emitido.

As credenciais, o webhook e os cadastros ficam em `portal-data.json`, criado na
raiz do projeto na primeira execução (arquivo ignorado pelo Git).

### Como pegar o webhook do Discord

No servidor: **Configurações do canal → Integrações → Webhooks → Novo webhook →
Copiar URL do webhook**. Cole a URL na aba Discord e clique em *Enviar teste*.

## Estrutura

```
src/
  data/editais.ts        conteúdo dos três editais
  data/provas.ts         provas anteriores (links) e simulado
  components/            Header, Hero, EditaisSection, EditalModal,
                         UnidadesSection, ProvasSection, SimuladoSection,
                         DiscordSection, AdminPanel, Footer, ui
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
| PATCH | `/api/admin/editais/:id` | altera status/aviso do edital |
| POST | `/api/public/interesse` | vincula o Discord do candidato aos editais |

Rotas `/api/admin/*` exigem o cabeçalho `Authorization: Bearer <token>`, com
sessão de 8 horas.

## Fontes

- Dados do concurso de Soldado (2.000 vagas, banca IBFC, R$ 6.101,87, estrutura
  de 60 questões e índices do TAF): Edital 01/2025 e coberturas de imprensa
  especializada.
- Provas: QConcursos, Estratégia Concursos, DSO Concursos e Tec Concursos.
- Histórico da PMPR, ROTAM e RONE: portal oficial da PMPR e imprensa paranaense.

> Projeto demonstrativo, sem vínculo oficial com a Polícia Militar do Paraná.
> Confira sempre o edital publicado pela corporação.
