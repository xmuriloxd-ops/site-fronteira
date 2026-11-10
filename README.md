# RONE · Edital de Ingresso (PMPR)

Site institucional fictício criado para divulgar o processo seletivo de ingresso na **RONE — Rondas
Ostensivas de Natureza Especial** (Batalhão de Operações Especiais / Polícia Militar do Paraná), com
galeria de fotos e logos editável, troca de cores do tema e o mini-jogo **Operação RONE · Patrulha
Noturna**.

> Projeto demonstrativo. Não é uma página oficial do Governo do Paraná nem da PMPR.

## O que tem no site

| Área | Descrição |
| --- | --- |
| **Início** | Hero com capa personalizável, resumo do edital, pilares da unidade e prévia da galeria. |
| **Edital** | Documento completo (disposições, requisitos, etapas, cronograma, avisos), painel lateral para editar datas/vagas/taxa/banca e botão de impressão. |
| **Pré-inscrição** | Formulário em 4 etapas com validação (CPF, idade 21–35, e-mail, telefone), resumo e comprovante com protocolo. |
| **Fotos & Logos** | Upload de várias fotos e do logo/brasão do cabeçalho, edição de título e legenda, definição da capa, exclusão e visualização ampliada. |
| **Cores** | 5 paletas prontas + ajuste fino de 7 cores, prévia em tempo real, cópia/exportação do CSS do tema. |
| **Jogo** | "Operação RONE · Patrulha Noturna": arcade em canvas (setas, A/D ou arraste na tela), vidas, níveis, combos e recorde salvo no navegador. |

Tudo que você personaliza (cores, fotos, logo, dados do edital) é salvo no `localStorage` do navegador.

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de produção (dist/)
npm start        # serve o build
```

## Estrutura

```
src/
  App.tsx              # rota por hash + estado da configuração
  lib/config.ts        # tipos, defaults do edital, paletas, upload otimizado
  components/
    SiteHeader.tsx     # navegação + logo personalizável
    Footer.tsx
    Crest.tsx          # brasão genérico em SVG (não é o brasão oficial)
    Game.tsx           # jogo em canvas
  sections/
    Home.tsx
    Edital.tsx
    Galeria.tsx
    Identidade.tsx
public/images/         # fotos ilustrativas geradas para o site
server.ts              # Express + Vite (dev) / estático (produção)
```

## Personalizando para valer

1. **Logo/brasão oficial:** aba *Fotos & Logos* → *Enviar logo / brasão* (PNG transparente, ~512×512).
2. **Fotos reais:** aba *Fotos & Logos* → *Enviar fotos*. Para produção, também é possível salvar os
   arquivos em `public/images/` e ajustar os caminhos em `src/lib/config.ts`.
3. **Cores oficiais:** aba *Cores* → presets ou ajuste fino → *Baixar tema .css*.
4. **Dados do edital:** aba *Edital* → painel "Dados do edital" (datas, vagas, taxa, banca, local).
