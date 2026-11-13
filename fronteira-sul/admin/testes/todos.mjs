#!/usr/bin/env node
// Roda todos os testes da área do administrador:
//
//   node fronteira-sul/admin/testes/todos.mjs
//
// Não instala nem grava nada no projeto: cada teste usa pastas temporárias e,
// quando precisa, sobe o servidor numa porta livre.
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const TESTES = [
  ['conteudo.mjs', 'Conteúdo: guardar as alterações e montar as páginas'],
  ['acesso.mjs', 'Acesso: login, sessões e limite de tentativas'],
  ['servidor.mjs', 'Servidor: páginas, painel e imagens por HTTP'],
  ['exportacao.mjs', 'Publicação: o site gravado em arquivos, na raiz e dentro de uma pasta'],
];

let falhas = 0;
for (const [arquivo, titulo] of TESTES) {
  console.log(`\n${titulo}`);
  const { status } = spawnSync(process.execPath, [path.join(AQUI, arquivo)], { stdio: 'inherit' });
  if (status !== 0) {
    falhas += 1;
    console.log(`  FALHOU (${arquivo})`);
  }
}

console.log(falhas ? `\n${falhas} de ${TESTES.length} grupos falharam.` : '\nTudo certo.');
process.exit(falhas ? 1 : 0);
