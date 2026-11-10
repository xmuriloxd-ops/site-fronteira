# Portal de Inscrições PMPR — imagem de produção
# Build em dois estágios: compila o front (Vite) e o servidor (esbuild) e
# deixa a imagem final só com o necessário para rodar.

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
ENV PORTAL_DATA_DIR=/app/dados

# Só as dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Build do front + servidor compilado
COPY --from=build /app/dist ./dist

# Onde ficam portal-data.json, .portal-secret e .portal-sessao.json.
# Monte um volume aqui para não perder dados do comando a cada deploy.
VOLUME ["/app/dados"]

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
