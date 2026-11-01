# Pôster — CFT · Curso de Força Tática (PMGO)

Peça de divulgação do **Curso de Força Tática (CFT)** da Polícia Militar de Goiás,
com o brasão da Força Tática, o horário de início (**20:00**) e um convite aos
policiais militares interessados.

![Prévia](poster-cft-1080x1350.jpg)

## Arquivos

| Arquivo | Uso | Especificação |
|---|---|---|
| `poster-cft-1080x1350.png` | Instagram / feed / grupos | 2160 × 2700 px (4:5), PNG sem perdas |
| `poster-cft-1080x1350.jpg` | Compartilhar no WhatsApp | JPG progressivo, qualidade 92 |
| `poster-cft-1080x1350.pdf` | Impressão rápida em casa/gráfica | PDF 4:5, 150 dpi |
| `poster-cft-a4-300dpi.pdf` | **Impressão oficial A4** | 2480 × 3508 px @ 300 dpi |
| `poster-cft-a4-300dpi.jpg` | Gráfica que pede imagem | 2480 × 3508 px @ 300 dpi |
| `brasao-forca-tatica.png` | Brasão isolado (fundo transparente) | 1600 px de largura |
| `gerar-poster.py` | Gera o pôster do zero | Python + Pillow + NumPy |
| `brasao.py` | Desenha o brasão vetorialmente | Python + Pillow |
| `fontes/` | Tipografias (OFL) | Anton, Barlow Condensed, Inter |
| `fundo-operadores.png` → `fundo-operadores.jpg` | Foto de fundo | — |

## Conteúdo da arte

- **Topo:** POLÍCIA MILITAR DE GOIÁS + monograma **CFT**
- **Título:** CURSO DE FORÇA TÁTICA
- **Brasão:** escudo francês com campo xadrez preto/prata, monograma **FT** dourado e listel “FORÇA TÁTICA”
- **Destaque:** HORÁRIO DE INÍCIO — **20:00**
- **Convite:** “CONVITE AOS POLICIAIS MILITARES” + texto de chamada
- **Rodapé:** chamada de inscrições e assinatura da unidade

## Como editar o texto

Abra `gerar-poster.py` e altere as strings dentro de `build()` — os textos estão
em `d.text(...)`/`put(...)`/`metal_text(...)` (`"CFT"`, `"20:00"`,
`"CONVITE AOS POLICIAIS MILITARES"`, etc.). Depois rode:

```bash
pip install pillow numpy
python gerar-poster.py                     # 1080x1350 (4:5)
```

Para a versão A4:

```bash
POSTER_DH=1527 POSTER_SS=3 \
POSTER_FINAL_W=2480 POSTER_FINAL_H=3508 \
POSTER_OUT=poster-cft-a4-300dpi.png python gerar-poster.py
```

Para regerar só o brasão:

```bash
python brasao.py     # gera brasao-preview.png
```

## Observações

- O brasão desta peça é uma **recriação vetorial** baseada nas características
  descritas para o brevê do Curso de Força Tática da PMGO (escudo francês,
  campo xadrez preto e prata, letras **FT** estilizadas e listel “FORÇA TÁTICA”).
  Ele **não** é o brasão oficial da corporação — para uso oficial, substitua por
  `brasao-oficial.png` no mesmo tamanho e rode o gerador.
- A foto de fundo é ilustrativa, gerada por IA, sem insígnias ou identificação
  de pessoas reais.
