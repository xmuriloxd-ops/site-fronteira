# PCPR RP · Sistema de Registro de Prisões — imagem de produção
# Build em dois estágios: compila o front (Vite) e o servidor (esbuild).

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

# Só as dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Build do front + servidor compilado
COPY --from=build /app/dist ./dist

# Monte um volume aqui para não perder prisões, fotos e o webhook entre deploys.
VOLUME ["/app/dados"]

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
