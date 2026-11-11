#!/usr/bin/env bash
# Etapa 1 (reconhecimento): confirma que o site original responde a partir do
# runner e guarda o HTML/cabecalhos crus para planejar a copia completa.
set -u
ORIGEM="https://fronteirasul-fmudazpm.manus.space"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
OUT="fronteira-sul/_copia/saida/recon"
mkdir -p "$OUT"

echo "== ambiente =="
date -u
node -v || true
echo "CHROME_BIN=${CHROME_BIN:-}"
for b in google-chrome google-chrome-stable chromium chromium-browser; do
  if command -v "$b" >/dev/null 2>&1; then echo "$b -> $(command -v "$b") :: $("$b" --version 2>/dev/null)"; fi
done
fc-list 2>/dev/null | wc -l | sed 's/^/fontes instaladas: /'

pegar() { # nome url [user-agent]
  local nome="$1" url="$2" ua="${3:-$UA}"
  local linha
  linha=$(curl -sS --compressed -m 60 -A "$ua" -H 'Accept-Language: pt-BR,pt;q=0.9,en;q=0.8' \
    -D "$OUT/$nome.cabecalhos.txt" -o "$OUT/$nome.corpo" \
    -w '%{http_code} | %{content_type} | %{size_download} bytes | redirect=%{redirect_url}' "$url" 2>&1)
  echo "$nome | $url | $linha | sha256=$(sha256sum "$OUT/$nome.corpo" 2>/dev/null | cut -c1-16)" | tee -a "$OUT/resumo.txt"
}

echo "== paginas =="
pegar convite-v        "$ORIGEM/convite/?v=c14b569"
pegar convite-v-2      "$ORIGEM/convite/?v=c14b569"
pegar convite          "$ORIGEM/convite/"
pegar convite-semBarra "$ORIGEM/convite"
pegar convite-index    "$ORIGEM/convite/index.html"
pegar raiz             "$ORIGEM/"
pegar raiz-2           "$ORIGEM/"
pegar raiz-index       "$ORIGEM/index.html"
pegar robots           "$ORIGEM/robots.txt"
pegar sitemap          "$ORIGEM/sitemap.xml"
pegar favicon          "$ORIGEM/favicon.ico"
pegar manifest         "$ORIGEM/manifest.json"
pegar preview-jpg      "$ORIGEM/fronteira-sul-convite-preview.jpg"
pegar logo-webp        "$ORIGEM/manus-storage/fronteira-sul-logo_1b1b4c2d.webp"
echo "== caminhos inexistentes (comportamento do servidor original) =="
pegar inexistente-rota  "$ORIGEM/nao-existe-xyz123"
pegar inexistente-barra "$ORIGEM/nao-existe-xyz123/"
pegar inexistente-png   "$ORIGEM/nao-existe-xyz123.png"
pegar inexistente-js    "$ORIGEM/assets/nao-existe-xyz123.js"
pegar inexistente-sub   "$ORIGEM/convite/nao-existe-xyz123"
echo "== outros agentes =="
pegar convite-discord  "$ORIGEM/convite/?v=c14b569" "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)"
pegar raiz-googlebot   "$ORIGEM/" "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
pegar raiz-curl        "$ORIGEM/" "curl/8.5.0"

echo "== fim =="
ls -la "$OUT" | head -80
