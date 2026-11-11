#!/usr/bin/env bash
# Prepara as ferramentas (Chrome ja vem instalado no runner) e roda a copia.
set -u
FERRAMENTAS="${RUNNER_TEMP:-/tmp}/ferramentas"
mkdir -p "$FERRAMENTAS"
(
  cd "$FERRAMENTAS" || exit 1
  [ -f package.json ] || npm init -y >/dev/null 2>&1
  npm install --no-audit --no-fund --loglevel=error puppeteer-core@24 pngjs@7
) || echo "::warning::Nao foi possivel instalar as ferramentas do navegador; a copia segue sem a conferencia visual."
export FERRAMENTAS
echo "node $(node -v) · chrome: ${CHROME_BIN:-nao definido}"
node fronteira-sul/_copia/espelhar.mjs
