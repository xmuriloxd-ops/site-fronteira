# Colocando o site no ar

O site da **Corregedoria-Geral da Polícia Militar do Paraná (RP)** é um projeto
**Node.js + Express** com front em React. Em produção roda
como **um único processo** (`node dist/server.cjs`), na porta `PORT` (padrão
`3000`), servindo o build de `dist/`. Não precisa de banco de dados: tudo fica
em um arquivo JSON.

---

## 0. Antes de publicar — checklist

```bash
npm ci
npm run check:deploy      # lint + build + 16 verificações em produção isolada
```

O `check:deploy` sobe o build real com `NODE_ENV=production`, Basic Auth ligada,
dados em pasta temporária e testa: healthcheck, autenticação, página, assets com
hash e cache, estado completo (denúncias), gravação/leitura/exclusão via `/api/sync`,
proteção do proxy do Discord e fallback de rotas. Ele **não mexe** nos seus dados
locais. Se imprimir `PRONTO PARA PUBLICAR`, pode seguir.

> ✅ **Defina `PC_SENHA` antes de expor o site.** Sem ela, qualquer visitante
> lê a URL do webhook do Discord em `/api/estado`, pode apagar denúncias e usar
> o proxy de envio. Veja a seção 2.

> ✅ **Use HTTPS** na frente (Nginx, Caddy ou a própria plataforma). O envio
> direto do navegador ao Discord e a prévia do logo nos embeds dependem de
> origem segura.

> ✅ **Monte um volume** em `PC_DATA_DIR`. Sem disco persistente, denúncias,
> fotos de evidência e webhooks somem a cada deploy.

---

## 1. Rodar o build

```bash
npm ci
npm run build      # gera dist/ (front + servidor)
npm start          # sobe em http://localhost:3000
```

`npm run build` produz:

| Caminho | O que é |
| --- | --- |
| `dist/index.html` + `dist/assets/` | front compilado (JS/CSS com hash, cache `immutable`) |
| `dist/fontes/`, `dist/*.png`, `dist/manifest.json` | brasão, fontes e manifesto |
| `dist/server.cjs` | servidor Express compilado |

A imagem de produção instala **apenas `express` e `compression`**
(`npm ci --omit=dev`): React, Vite e Tailwind ficam só em `devDependencies`,
pois o front já vai empacotado. O `dist/server.cjs` só carrega o Vite em modo
de desenvolvimento, por `import()` condicional.

---

## 2. Variáveis de ambiente

Copie `.env.example` para `.env` ou configure no painel da plataforma.

| Variável | Para que serve | Padrão |
| --- | --- | --- |
| `PORT` | porta HTTP (bind em `0.0.0.0`) | `3000` |
| `NODE_ENV` | `production` serve `dist/` — `npm start` e o Docker já definem | — |
| `PC_DATA_DIR` | pasta de `dados-corregedoria-pmpr.json` — **aponte para volume** | raiz do projeto |
| `PC_USUARIO` | usuário do Basic Auth | `corregedoria` |
| `PC_SENHA` | **senha do Basic Auth**; se vazia, o site fica aberto | *(vazia)* |
| `PC_CHECK_PORT` | porta do verificador local | `3211` |

**Basic Auth embutido:** com `PC_SENHA` definida, site e API exigem
usuário/senha (comparação em tempo constante). `/api/health` continua público
para healthchecks. O navegador guarda a credencial após o primeiro acesso e
todos os `fetch` para `/api/*` passam a enviá-la automaticamente.

> ⚠️ **Por que a senha é importante:** o envio ao Discord é feito primeiro
> pelo navegador, então a URL do webhook precisa chegar ao cliente via
> `/api/estado`. Com a senha, só quem tem acesso ao sistema recebe essa URL.
> Ainda assim, use um **webhook dedicado a este canal** — se vazar, bastará
> regenerá-lo no Discord sem afetar outros canais.

**O que precisa sobreviver ao deploy:** `dados-corregedoria-pmpr.json` —
denúncias, fotos de evidência, configurações dos webhooks e histórico de envios.

Se publicar **atrás de várias instâncias**, saiba que o estado é um cache em
memória + arquivo local: rode **uma única réplica** ou use storage
compartilhado, senão as instâncias divergem.

---

## 3. Opção A — Docker (VPS, Fly.io, Render, Railway, EasyPanel…)

```bash
docker build -t corregedoria-pmpr .
docker run -d --name corregedoria-pmpr \
  -p 3000:3000 \
  -v corregedoria-dados:/app/dados \
  -e NODE_ENV=production \
  -e PC_SENHA="uma-senha-longa-e-aleatoria" \
  corregedoria-pmpr
```

O `Dockerfile`:

- compila em dois estágios e roda com usuário **não-root** (`node`);
- define `PC_DATA_DIR=/app/dados` e declara o `VOLUME`;
- tem `HEALTHCHECK` em `/api/health`;
- instala só as dependências de produção.

Com **bind mount** (`-v /srv/corregedoria:/app/dados`), acerte o dono da pasta no
host antes de subir: `sudo chown -R 1000:1000 /srv/corregedoria`.

Se usar um reverse proxy com a própria autenticação (Cloudflare Access,
Authelia, Basic Auth no Nginx), pode deixar `PC_SENHA` vazia — mas nunca
publique sem **nenhuma** das duas camadas.

---

## 4. Opção B — VPS com Node

```bash
git clone <seu-repo> && cd projetos-cidades2
npm ci
npm run build
PC_DATA_DIR=/var/lib/corregedoria-pmpr \
PC_SENHA="uma-senha-longa-e-aleatoria" \
NODE_ENV=production PORT=3000 node dist/server.cjs
```

Use `systemd`, `pm2` ou `supervisor` para manter o processo no ar e um
**reverse proxy** (Nginx/Caddy) com HTTPS. Exemplo de unidade systemd:

```ini
[Service]
WorkingDirectory=/srv/corregedoria
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=PC_DATA_DIR=/var/lib/corregedoria-pmpr
Environment=PC_SENHA=uma-senha-longa-e-aleatoria
ExecStart=/usr/bin/node dist/server.cjs
Restart=always
```

Guarde a senha num arquivo de ambiente com permissão `600` em vez de
commitá-la.

---

## 5. Opção C — só o front (sem servidor)

Se publicar apenas `dist/` num host estático (Netlify, Vercel, GitHub Pages),
o site **continua funcionando**: a API não responde e ele passa a gravar tudo
em `localStorage` naquele navegador. Nesse modo os registros **não são
compartilhados** entre agentes, o envio automático ao Discord depende só do
navegador e o botão de backup JSON é a forma de guardar os dados. Para uso em
grupo, prefira as opções A ou B.

---

## 6. Opção D — GitHub Pages (modo estático, grátis)

O repositório publica **sozinho** no GitHub Pages a cada push, pelo workflow
`.github/workflows/deploy-pages.yml`. Pré-requisitos:

1. Repositório **público** (Settings → General → Danger Zone →
   *Change visibility* → Public).
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. Push no branch → aba **Actions** → o *workflow "Deploy · GitHub Pages"*
   conclui → site em **`https://xmuriloxd-ops.github.io/projetos-cidades2/`**.

O workflow roda `vite build --base=/projetos-cidades2/` (subcaminho do
repositório) e publica só o `dist/` estático. Nesse modo **não há servidor**:

- as denúncias ficam em **cada navegador** (`localStorage`) — não são
  compartilhadas entre agentes;
- a URL do webhook fica salva naquele navegador;
- o envio ao Discord sai **direto do navegador** (o webhook do Discord aceita
  isso normalmente);
- use **Backup JSON** (aba Denúncias) para guardar os registros.

Para dados compartilhados entre vários agentes, use a opção A ou B
(servidor com `dados-corregedoria-pmpr.json` em volume).

---

## 7. Conferindo a instalação

```bash
curl https://seu-dominio/api/health
# {"ok":true,"servico":"Corregedoria · Denúncias PMPR RP","denuncias":0}
```

Depois, já autenticado no navegador:

1. Aba **Canal do Discord** → cole a URL do webhook → **Enviar teste**:
   deve chegar um embed de integração ativa com o brasão da PMPR.
2. Aba **Fazer denúncia** → protocole uma denúncia de teste com evidência;
   confira se o **embed completo + fotos** chegou no canal com o protocolo.
3. Na aba **Denúncias**, use **Enviar ao Discord** no modal e **Enviar
   pendentes** para reenviar o que ficou fora.
4. Teste o **acompanhamento** (situação + parecer) no modal e o **Backup JSON**.
5. Reinicie o container e confirme que as denúncias continuam lá (testa o volume).

---

## 8. Solução de problemas

| Sintoma | O que checar |
| --- | --- |
| Pede senha e não aceita | `PC_USUARIO`/`PC_SENHA` no container; o padrão é usuário `corregedoria`. Limpe credenciais antigas do navegador |
| `401` em `/api/*` mas a página abre | Navegador não reenviou o `Authorization`; recarregue a página e informe a senha novamente |
| Discord não recebe | URL do webhook completa, canal ainda existe, `@here`/cargo com permissão, bloqueadores de extensão, HTTPS no site |
| Chega só texto, sem fotos | *Formato da denúncia no canal* está em "Só texto"; mude para "Embed completo + fotos" ou "Resumo + fotos" |
| "Discord respondeu 404/401" | Webhook apagado ou regenerado: copie a URL de novo |
| "Muitos envios seguidos" (429) | Limite de 180 envios/minuto por IP no proxy; aguarde um minuto |
| Evidências/denúncias somem depois do deploy | `PC_DATA_DIR` apontando para volume persistente |
| Container não escreve em `/app/dados` | Com bind mount, `chown -R 1000:1000` na pasta do host |
| "DADOS NESTE NAVEGADOR" no cabeçalho | A API não respondeu; veja se o processo Node está no ar |
| Brasão antigo ainda aparece no site | Recarregue com Ctrl+F5. O `index.html` limpa service workers e Cache Storage de versões antigas, e os arquivos de brasão usam nomes novos servidos com `no-store` |
