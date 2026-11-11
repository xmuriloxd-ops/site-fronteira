# PCPR RP · Prisões e Mandados — imagem de produção
# Dois estágios: compila o front (Vite) + servidor (esbuild), depois roda
# apenas Node com as dependências de runtime (express + compression).

FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------------------------------------------------------------------------

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV PC_DATA_DIR=/app/dados

# Só as dependências de produção. O front já vai compilado em dist/, então
# React/Vite/Tailwind não são necessários aqui.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Processo sem privilégios de root. O volume precisa ser gravável por `node`.
RUN mkdir -p /app/dados && chown -R node:node /app
USER node

# Monte um volume aqui para não perder prisões, mandados, fotos e os webhooks
# entre deploys. Com bind mount, ajuste o dono da pasta no host (uid 1000).
VOLUME ["/app/dados"]

EXPOSE 3000

# /api/health é público mesmo com PC_SENHA, justamente para este healthcheck.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.cjs"]
