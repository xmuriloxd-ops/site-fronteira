/**
 * Verificação pré-deploy.
 *
 * Sobe `dist/server.cjs` exatamente como vai rodar em produção (NODE_ENV,
 * porta própria, diretório de dados temporário e Basic Auth ligado) e confere
 * páginas, assets, API, persistência, fallback SPA e proteções. Não toca nos
 * dados do ambiente de desenvolvimento.
 *
 * Uso: npm run check:deploy
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const RAIZ = process.cwd();
const PORTA = Number(process.env.PC_CHECK_PORT) || 3211;
const BASE = `http://127.0.0.1:${PORTA}`;
const USUARIO = 'pcpr';
const SENHA = 'verificacao-deploy';
const AUTORIZACAO = `Basic ${Buffer.from(`${USUARIO}:${SENHA}`).toString('base64')}`;
const dadosDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pcpr-check-'));

let falhas = 0;
let servidor = null;
let logServidor = '';

function ok(nome, condicao, detalhe = '') {
  const marca = condicao ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
  console.log(`  ${marca} ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
  if (!condicao) falhas++;
}

async function requisitar(caminho, opcoes = {}) {
  const { autorizado = true, metodo = 'GET', corpo } = opcoes;
  const cabecalhos = {};
  if (autorizado) cabecalhos.Authorization = AUTORIZACAO;
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json';
  try {
    const r = await fetch(BASE + caminho, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: AbortSignal.timeout(8000),
    });
    const texto = await r.text();
    let json = null;
    try {
      json = JSON.parse(texto);
    } catch {
      /* resposta não é JSON */
    }
    return { status: r.status, texto, json, cabecalhos: r.headers };
  } catch (erro) {
    return { status: 0, texto: String(erro), json: null, cabecalhos: new Headers() };
  }
}

async function esperarHealth() {
  for (let i = 0; i < 60; i++) {
    const r = await requisitar('/api/health', { autorizado: false });
    if (r.status === 200 && r.json?.ok) return true;
    await new Promise((resolver) => setTimeout(resolver, 250));
  }
  return false;
}

const mandadoTeste = {
  id: 'check-deploy-1',
  numero: 'MDP-2026-9999',
  fotos: [],
  nome: 'Verificação de Deploy',
  idRp: '0000',
  artigos: 'Art. 0',
  fundamento: 'Registro temporário do verificador.',
  processo: '—',
  autoridade: 'Sistema',
  origem: '—',
  unidade: '—',
  agente: '—',
  validade: '—',
  status: 'pendente',
  observacoes: '',
  criadoEm: new Date().toISOString(),
};

async function main() {
  console.log(`\nVerificando build de produção em ${BASE}\n`);

  if (!fs.existsSync(path.join(RAIZ, 'dist/server.cjs'))) {
    console.error('  dist/server.cjs não existe. Rode npm run build antes.');
    process.exitCode = 1;
    return;
  }

  servidor = spawn(process.execPath, ['dist/server.cjs'], {
    cwd: RAIZ,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(PORTA),
      PC_DATA_DIR: dadosDir,
      PC_USUARIO: USUARIO,
      PC_SENHA: SENHA,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  servidor.stdout.on('data', (d) => (logServidor += d.toString()));
  servidor.stderr.on('data', (d) => (logServidor += d.toString()));

  const noAr = await esperarHealth();
  ok('servidor de produção sobe e responde /api/health', noAr, noAr ? '' : logServidor.trim());
  if (!noAr) return;

  // Autenticação
  const health = await requisitar('/api/health', { autorizado: false });
  ok('healthcheck público (para Docker/plataformas)', health.status === 200 && health.json?.ok === true);
  const semAuth = await requisitar('/', { autorizado: false });
  ok('página exige senha quando PC_SENHA está definida', semAuth.status === 401);
  const estadoSemAuth = await requisitar('/api/estado', { autorizado: false });
  ok('webhook/registros não vazam para anônimos', estadoSemAuth.status === 401);

  // Página e cache
  const raiz = await requisitar('/');
  ok('GET / com credenciais', raiz.status === 200 && raiz.texto.includes('<div id="root">'));
  ok('HTML sem cache', /no-store/i.test(raiz.cabecalhos.get('cache-control') || ''));

  // Assets compilados
  const assets = [...raiz.texto.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
  ok('HTML referencia JS e CSS com hash', assets.length >= 2, `${assets.length} arquivos`);
  for (const asset of assets) {
    const r = await requisitar(asset);
    ok(`asset ${path.basename(asset)}`, r.status === 200 && /immutable/i.test(r.cabecalhos.get('cache-control') || ''));
  }
  const logo = await requisitar('/logo-pcpr.png');
  ok('logo servido sem cache', logo.status === 200 && /no-store/i.test(logo.cabecalhos.get('cache-control') || ''));

  // API e persistência
  const estado = await requisitar('/api/estado');
  ok(
    'estado completo (prisões, mandados, configs, envios)',
    estado.status === 200 &&
      Array.isArray(estado.json?.estado?.prisoes) &&
      Array.isArray(estado.json?.estado?.mandados) &&
      Array.isArray(estado.json?.estado?.envios) &&
      Boolean(estado.json?.estado?.discordMandados),
  );

  const criado = await requisitar('/api/sync', {
    metodo: 'POST',
    corpo: { op: { tipo: 'criar-mandado', mandado: mandadoTeste } },
  });
  ok(
    'POST /api/sync persiste registro',
    criado.status === 200 && criado.json?.estado?.mandados?.length === 1,
  );
  const persistido = await requisitar('/api/estado');
  ok('dados sobrevivem entre requisições', persistido.json?.estado?.mandados?.length === 1);
  const removido = await requisitar('/api/sync', {
    metodo: 'POST',
    corpo: { op: { tipo: 'excluir-mandado', id: mandadoTeste.id } },
  });
  ok('exclusão funciona', removido.json?.estado?.mandados?.length === 0);

  // Proteção do proxy do Discord (sem depender de rede externa)
  const proxy = await requisitar('/api/discord/proxy', {
    metodo: 'POST',
    corpo: {
      webhook: 'https://exemplo.invalid/webhook',
      payload: { content: 'teste' },
      anexos: [],
    },
  });
  ok('proxy rejeita destino que não é webhook do Discord', proxy.status === 400);

  // SPA fallback
  const fallback = await requisitar('/mandados');
  ok('fallback SPA para rotas diretas', fallback.status === 200 && fallback.texto.includes('<div id="root">'));

  console.log(
    falhas === 0
      ? '\n\x1b[32mPRONTO PARA PUBLICAR\x1b[0m — nenhuma falha encontrada.\n'
      : `\n\x1b[31m${falhas} verificação(ões) falharam\x1b[0m — corrija antes de publicar.\n`,
  );
  if (falhas) process.exitCode = 1;
}

try {
  await main();
} catch (erro) {
  console.error('Erro inesperado na verificação:', erro);
  process.exitCode = 1;
} finally {
  if (servidor && !servidor.killed) {
    servidor.kill('SIGTERM');
    await new Promise((resolver) => {
      servidor.once('exit', resolver);
      setTimeout(resolver, 3000);
    });
  }
  fs.rmSync(dadosDir, { recursive: true, force: true });
}
