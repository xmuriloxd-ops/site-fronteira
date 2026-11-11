# Colocando o sistema no ar

O sistema é um site **Node.js + Express** com front em React. Em produção roda
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
hash e cache, estado completo, gravação/leitura/exclusão via `/api/sync`,
proteção do proxy do Discord e fallback de rotas. Ele **não mexe** nos seus dados
locais. Se imprimir `PRONTO PARA PUBLICAR`, pode seguir.

> ✅ **Defina `PC_SENHA` antes de expor o site.** Sem ela, qualquer visitante
> lê a URL do webhook do Discord em `/api/estado`, pode apagar registros e usar
> o proxy de envio. Veja a seção 2.

> ✅ **Use HTTPS** na frente (Nginx, Caddy ou a própria plataforma). O envio
> direto do navegador ao Discord e a prévia do logo nos embeds dependem de
> origem segura.

> ✅ **Monte um volume** em `PC_DATA_DIR`. Sem disco persistente, prisões,
> mandados, fotos e webhooks somem a cada deploy.

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
| `dist/fontes/`, `dist/*.png`, `dist/manifest.json` | logo, fontes e manifesto |
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
| `PC_DATA_DIR` | pasta de `dados-pcpr-rp.json` — **aponte para volume** | raiz do projeto |
| `PC_USUARIO` | usuário do Basic Auth | `pcpr` |
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

**O que precisa sobreviver ao deploy:** `dados-pcpr-rp.json` — prisões,
mandados, fotos, assinaturas, configurações dos webhooks e histórico de envios.

Se publicar **atrás de várias instâncias**, saiba que o estado é um cache em
memória + arquivo local: rode **uma única réplica** ou use storage
compartilhado, senão as instâncias divergem.

---

## 3. Opção A — Docker (VPS, Fly.io, Render, Railway, EasyPanel…)

```bash
docker build -t pcpr-prisoes .
docker run -d --name pcpr-prisoes \
  -p 3000:3000 \
  -v pcpr-dados:/app/dados \
  -e NODE_ENV=production \
  -e PC_SENHA="uma-senha-longa-e-aleatoria" \
  pcpr-prisoes
```

O `Dockerfile`:

- compila em dois estágios e roda com usuário **não-root** (`node`);
- define `PC_DATA_DIR=/app/dados` e declara o `VOLUME`;
- tem `HEALTHCHECK` em `/api/health`;
- instala só as dependências de produção.

Com **bind mount** (`-v /srv/pcpr:/app/dados`), acerte o dono da pasta no
host antes de subir: `sudo chown -R 1000:1000 /srv/pcpr`.

Se usar um reverse proxy com a própria autenticação (Cloudflare Access,
Authelia, Basic Auth no Nginx), pode deixar `PC_SENHA` vazia — mas nunca
publique sem **nenhuma** das duas camadas.

---

## 4. Opção B — VPS com Node

```bash
git clone <seu-repo> && cd Btz-contrile
npm ci
npm run build
PC_DATA_DIR=/var/lib/pcpr-rp \
PC_SENHA="uma-senha-longa-e-aleatoria" \
NODE_ENV=production PORT=3000 node dist/server.cjs
```

Use `systemd`, `pm2` ou `supervisor` para manter o processo no ar e um
**reverse proxy** (Nginx/Caddy) com HTTPS. Exemplo de unidade systemd:

```ini
[Service]
WorkingDirectory=/srv/pcpr
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=PC_DATA_DIR=/var/lib/pcpr-rp
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

## 6. Conferindo a instalação

```bash
curl https://seu-dominio/api/health
# {"ok":true,"servico":"PCPR RP · Registro de Prisões e Mandados","registros":0,"mandados":0}
```

Depois, já autenticado no navegador:

1. Aba **Canal do Discord** → cole a URL do webhook → **Enviar teste**:
   deve chegar um **cartaz de exemplo** com marca d'água `EXEMPLO`.
2. Registre uma prisão de teste com foto e assinatura do escrivão; confira se
   o **cartaz** chegou no canal no mesmo modelo da ficha impressa.
3. **Mandados de prisão → Expedir mandado**: deve chegar o **cartaz do
   mandado** com situação, assinatura da autoridade e dia/data automáticos.
   Use **Enviar cartaz de teste** na aba Discord para conferir o canal
   exclusivo sem criar um mandado real.
4. Teste **Ver cartaz / Baixar PNG** na ficha e no mandado, e **Imprimir**.
5. Faça um **Backup JSON** periodicamente.
6. Reinicie o container e confirme que os registros continuam lá (testa o volume).

---

## 7. Solução de problemas

| Sintoma | O que checar |
| --- | --- |
| Pede senha e não aceita | `PC_USUARIO`/`PC_SENHA` no container; o padrão é usuário `pcpr`. Limpe credenciais antigas do navegador |
| `401` em `/api/*` mas a página abre | Navegador não reenviou o `Authorization`; recarregue a página e informe a senha novamente |
| Discord não recebe | URL do webhook completa, canal ainda existe, `@here`/cargo com permissão, bloqueadores de extensão, HTTPS no site |
| Chega só texto, sem cartaz | *Formato da ficha no canal* está em "Ficha em texto"; mude para "Cartaz em imagem" ou "Cartaz + texto" |
| Cartaz sem assinatura | Desenhe a assinatura no formulário ou preencha o nome do escrivão / autoridade (usado em caligrafia) |
| Mandado não chegou no Discord | Verifique o *webhook dos mandados* (vazio = usa o das prisões), o envio automático e **Enviar pendentes** na lista de mandados |
| "Discord respondeu 404/401" | Webhook apagado ou regenerado: copie a URL de novo |
| "Muitos envios seguidos" (429) | Limite de 180 envios/minuto por IP no proxy; aguarde um minuto |
| Fotos/registros somem depois do deploy | `PC_DATA_DIR` apontando para volume persistente |
| Container não escreve em `/app/dados` | Com bind mount, `chown -R 1000:1000` na pasta do host |
| "DADOS NESTE NAVEGADOR" no cabeçalho | A API não respondeu; veja se o processo Node está no ar |
| Ficha de impressão sai em branco | Use o botão **Imprimir** da própria ficha (ele monta a folha dedicada) |
| Logo antigo ainda aparece no site | Recarregue com Ctrl+F5. O `index.html` limpa service workers e Cache Storage de versões antigas, e os arquivos de logo usam nomes novos servidos com `no-store` |
