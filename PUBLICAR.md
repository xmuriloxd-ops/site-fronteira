# Colocando o portal no ar

O portal é um site **Node.js + Express** que serve o front em React. Em produção
ele roda como **um único processo** (`node dist/server.cjs`) na porta definida
por `PORT`.

Antes de publicar, faça **uma troca de senha** (veja o fim deste guia).

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
| `dist/index.html` + `dist/assets/` | front compilado (JS/CSS com hash) |
| `dist/fontes/`, `dist/divulgacao/`, `dist/*.png` | imagens e fontes do cartaz |
| `dist/server.cjs` | servidor Express já compilado |

---

## 2. Variáveis de ambiente

Todas são opcionais. Copie `.env.example` para `.env` se quiser ajustar.

| Variável | Para que serve | Padrão |
| --- | --- | --- |
| `PORT` | porta HTTP | `3000` |
| `NODE_ENV` | `production` serve o build e não abre a porta de preview | — |
| `PORTAL_DATA_DIR` | pasta dos dados (use um volume) | raiz do projeto |
| `PORTAL_SECRET` | segredo que assina as sessões | criado em `.portal-secret` |

**Dados que precisam sobreviver ao deploy:**

- `portal-data.json` — formulários recebidos, documento de divulgação, canais do Discord, login e senha.
- `.portal-secret` — assinatura das sessões do comando.
- `.portal-sessao.json` — sessões encerradas.

Sem um volume ou disco persistente, esses arquivos somem a cada publicação.

---

## 3. Opção A — Docker (funciona em VPS, Fly.io, Render, Railway, EasyPanel…)

O repositório já tem `Dockerfile` e `.dockerignore`.

```bash
docker build -t portal-pmpr .
docker run -d --name portal \
  -p 3000:3000 \
  -v portal-dados:/app/dados \
  -e NODE_ENV=production \
  portal-pmpr
```

O volume `portal-dados` guarda os dados entre subidas. Para atualizar:

```bash
git pull && docker build -t portal-pmpr . && docker rm -f portal && docker run ... (mesmo comando)
```

### Fly.io

```bash
fly launch --no-deploy
fly volumes create dados --size 1
fly secrets set PORTAL_SECRET="uma-frase-longa-e-aleatoria"
fly deploy
```

No `fly.toml`, aponte o volume para `/app/dados` e defina `PORTAL_DATA_DIR=/app/dados`.

### Render / Railway

- **Build:** `npm ci && npm run build`
- **Start:** `NODE_ENV=production node dist/server.cjs`
- Adicione um **disco persistente** montado na pasta de `PORTAL_DATA_DIR` (ex.: `/dados`) e defina a variável com esse caminho.

---

## 4. Opção B — VPS com Node + Nginx

```bash
# no servidor
git clone <repo> /var/www/portal-pmpr
cd /var/www/portal-pmpr
npm ci && npm run build
```

Mantenha no ar com PM2:

```bash
npm i -g pm2
PORT=3000 NODE_ENV=production PORTAL_DATA_DIR=/var/lib/portal-pmpr pm2 start dist/server.cjs --name portal-pmpr
pm2 save && pm2 startup
```

Nginx (proxy + HTTPS via Certbot):

```nginx
server {
  server_name seu-dominio.com.br;

  client_max_body_size 5m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
sudo certbot --nginx -d seu-dominio.com.br
```

---

## 5. Depois de publicar — checklist

1. Abrir o site e conferir a página inicial (título, brasão, abas do topo).
2. **painel → Divulgação**: trocar a senha em **Login e senha**.
3. Cadastrar o **webhook do canal das fichas** e o **canal das divulgações**.
   Use **Enviar teste** nos dois para conferir que a mensagem chega.
4. Publicar um cartaz de teste (ROTAM ou RONE) e ver a imagem no Discord.
5. Enviar uma ficha de teste e conferir se ela cai no canal das fichas.
6. Apagar os dados de teste (`portal-data.json`) **somente** se quiser começar
   do zero — isso também apaga o login e os webhooks.

---

## 6. Antes de abrir para o público

- **Troque a senha** `comando` / `1234` no painel (aba *Login e senha*).
- O Discord recebe as mensagens pelo **navegador** de quem usa o painel, não
  pelo servidor: a pessoa que publica precisa ter acesso à internet normal, e
  o navegador precisa alcançar `discord.com`.
- O certificado HTTPS deve ser do domínio final; sem HTTPS o cartaz e o envio ao
  Discord continuam funcionando, mas não são recomendados.
- Backup: copie a pasta de dados (`portal-data.json` e `.portal-secret`) com
  regularidade.
