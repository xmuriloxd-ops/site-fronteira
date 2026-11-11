# Colocando o sistema no ar

O sistema é um site **Node.js + Express** que serve o front em React. Em
produção roda como **um único processo** (`node dist/server.cjs`) na porta
definida por `PORT`.

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
| `dist/fontes/`, `dist/*.png`, `dist/manifest.json` | brasões, fontes e manifesto |
| `dist/server.cjs` | servidor Express já compilado |

---

## 2. Variáveis de ambiente

Todas opcionais. Copie `.env.example` para `.env` se quiser ajustar.

| Variável | Para que serve | Padrão |
| --- | --- | --- |
| `PORT` | porta HTTP | `3000` |
| `NODE_ENV` | `production` serve o build de `dist/` | — |
| `PC_DATA_DIR` | pasta dos dados (aponte para um volume) | raiz do projeto |

**O que precisa sobreviver ao deploy:** `dados-pcpr-rp.json` — prisões, mandados,
fotos, assinaturas, configurações dos webhooks do Discord e histórico de envios. Sem volume ou disco
persistente, esse arquivo some a cada publicação.

> Não há login nem senha no sistema: ele foi pensado para uso interno do grupo
> de RP. Se for expor publicamente, coloque uma camada de autenticação no
> proxy/reverse proxy (Basic Auth, Cloudflare Access etc.) para proteger os
> registros e a URL do webhook.

---

## 3. Opção A — Docker (VPS, Fly.io, Render, Railway, EasyPanel…)

O repositório já tem `Dockerfile` e `.dockerignore`.

```bash
docker build -t pcpr-prisoes .
docker run -d --name pcpr-prisoes \
  -p 3000:3000 \
  -v pcpr-dados:/app/dados \
  -e NODE_ENV=production \
  pcpr-prisoes
```

O `Dockerfile` já define `PC_DATA_DIR=/app/dados` e declara o volume.

---

## 4. Opção B — VPS com Node

```bash
git clone <seu-repo> && cd Btz-contrile
npm ci
npm run build
PC_DATA_DIR=/var/lib/pcpr-rp NODE_ENV=production PORT=3000 node dist/server.cjs
```

Use `systemd`, `pm2` ou `supervisor` para manter o processo no ar, e um
**reverse proxy** (Nginx/Caddy) com HTTPS na frente. O HTTPS é importante:
o navegador só consegue enviar ao Discord a partir de uma origem segura.

---

## 5. Opção C — só o front (sem servidor)

Se publicar apenas `dist/` num host estático (Netlify, Vercel, GitHub Pages),
o site **continua funcionando**: a API não responde e ele passa a gravar tudo
em `localStorage` naquele navegador. Nesse modo os registros **não são
compartilhados** entre agentes e o botão de backup JSON é a forma de guardar
os dados. Para uso em grupo, prefira as opções A ou B.

---

## 6. Conferindo a instalação

```bash
curl https://seu-dominio/api/health
# {"ok":true,"servico":"PCPR RP · Registro de Prisões e Mandados","registros":0,"mandados":0}
```

Depois:

1. Abra a aba **Canal do Discord**, cole a URL do webhook e use **Enviar teste** —
   deve chegar um **cartaz de exemplo** com marca d'água `EXEMPLO`.
2. Registre uma prisão de teste com foto e assinatura do escrivão; confira se o
   **cartaz** chegou no canal no mesmo modelo da ficha impressa.
3. Abra **Mandados de prisão → Expedir mandado**, preencha os campos e salve:
   deve chegar um **cartaz do mandado** com situação, assinatura da autoridade
   e dia/data automáticos. Use **Enviar cartaz de teste** na aba Discord para
   conferir o canal exclusivo sem criar um mandado real.
4. Teste **Ver cartaz / Baixar PNG** na ficha e no mandado, e **Imprimir**.
5. Faça um **Backup JSON** periodicamente.

---

## 7. Solução de problemas

| Sintoma | O que checar |
| --- | --- |
| Discord não recebe | URL do webhook completa, canal ainda existe, `@here` e cargo com permissão, bloqueadores de extensão, HTTPS no site |
| Chega só texto, sem cartaz | *Formato da ficha no canal* está em "Ficha em texto"; mude para "Cartaz em imagem" ou "Cartaz + texto" |
| Cartaz sem assinatura | Desenhe a assinatura no formulário ou preencha o nome do escrivão / autoridade (usado em caligrafia) |
| Mandado não chegou no Discord | Verifique o *webhook dos mandados* na aba Discord (vazio = usa o das prisões), o envio automático e o botão **Enviar pendentes** na lista de mandados |
| "Discord respondeu 404/401" | Webhook apagado ou regenerado: copie a URL de novo |
| Fotos somem depois do deploy | `PC_DATA_DIR` apontando para volume persistente |
| "DADOS NESTE NAVEGADOR" no cabeçalho | A API não respondeu; veja se o processo Node está no ar |
| Ficha de impressão sai em branco | Use o botão **Imprimir** da própria ficha (ele monta a folha dedicada) |
