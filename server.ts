/**
 * Servidor do Canal de Denúncias — Corregedoria-Geral da Polícia Militar do Paraná (RP).
 *
 * - Em desenvolvimento: sobe o middleware do Vite (hot reload).
 * - Em produção: serve o build de `dist/`.
 * - Guarda as denúncias, a config do Discord e o histórico num JSON local
 *   (`dados-corregedoria-pmpr.json`, fora do Git). Se o servidor estiver
 *   indisponível, o navegador continua funcionando com localStorage.
 * - `/api/discord/proxy` é um fallback de entrega: alguns navegadores/rede
 *   bloqueiam a chamada direta ao Discord, então o envio também pode sair
 *   do servidor (que tem rede liberada num deploy normal).
 */
import express from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { timingSafeEqual } from 'node:crypto';
import type {
  ConfigDiscord,
  Denuncia,
  EnvioDiscord,
  EstadoApp,
  OperacaoSync,
  SituacaoDenuncia,
} from './src/types';
import { CONFIG_DISCORD_PADRAO, SITUACOES_DENUNCIA } from './src/types';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.PC_DATA_DIR || process.cwd();
try {
  if (DATA_DIR !== process.cwd()) fs.mkdirSync(DATA_DIR, { recursive: true });
} catch {
  /* sem permissão de escrita: usa a raiz do projeto */
}
const DATA_FILE = path.join(DATA_DIR, 'dados-corregedoria-pmpr.json');

/* ------------------------------------------------------------------ */
/* Proteção opcional para produção                                     */
/* ------------------------------------------------------------------ */

// Defina PC_SENHA (e opcionalmente PC_USUARIO) antes de publicar. Sem ela o
// sistema segue aberto, como em desenvolvimento. /api/health fica público
// para os healthchecks de Docker/plataformas.
const USUARIO_ACESSO = process.env.PC_USUARIO || 'corregedoria';
const SENHA_ACESSO = process.env.PC_SENHA || '';

/** Basic Auth com comparação em tempo constante. */
function credenciaisValidas(cabecalho: string | undefined): boolean {
  if (!cabecalho?.startsWith('Basic ')) return false;
  let texto: string;
  try {
    texto = Buffer.from(cabecalho.slice(6), 'base64').toString('utf8');
  } catch {
    return false;
  }
  const separador = texto.indexOf(':');
  if (separador < 0) return false;
  const recebido = Buffer.from(texto);
  const esperado = Buffer.from(`${USUARIO_ACESSO}:${SENHA_ACESSO}`);
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}

/** Limite simples de envios ao proxy do Discord (evita abuso do relay). */
const janelas = new Map<string, { inicio: number; total: number }>();
function dentroDoLimite(chave: string, limite: number, janelaMs: number): boolean {
  const agora = Date.now();
  const atual = janelas.get(chave);
  if (!atual || agora - atual.inicio > janelaMs) {
    if (janelas.size > 1000) janelas.clear();
    janelas.set(chave, { inicio: agora, total: 1 });
    return true;
  }
  atual.total += 1;
  return atual.total <= limite;
}

/* ------------------------------------------------------------------ */
/* Persistência                                                        */
/* ------------------------------------------------------------------ */

function estadoVazio(): EstadoApp {
  return {
    denuncias: [],
    discord: { ...CONFIG_DISCORD_PADRAO },
    envios: [],
  };
}

function textoSeguro(valor: unknown, limite = 4000): string {
  return typeof valor === 'string' ? valor.slice(0, limite) : '';
}

/** Normaliza o que vem do cliente para nunca gravar lixo no JSON. */
function normalizarDenuncia(bruto: unknown): Denuncia | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const d = bruto as Record<string, unknown>;
  if (!textoSeguro(d.id)) return null;

  const fotos = Array.isArray(d.fotos)
    ? d.fotos
        .filter((f): f is string => typeof f === 'string' && /^data:image\//.test(f))
        .slice(0, 4)
        .map((f) => f.slice(0, 2_500_000))
    : [];

  const criadoEm =
    typeof d.criadoEm === 'string' && !Number.isNaN(Date.parse(d.criadoEm))
      ? new Date(d.criadoEm).toISOString()
      : new Date().toISOString();

  const situacao: SituacaoDenuncia =
    typeof d.situacao === 'string' && d.situacao in SITUACOES_DENUNCIA
      ? (d.situacao as SituacaoDenuncia)
      : 'aberta';

  return {
    id: textoSeguro(d.id, 80),
    numero: textoSeguro(d.numero, 60),
    categoria: textoSeguro(d.categoria, 200),
    relato: textoSeguro(d.relato),
    local: textoSeguro(d.local, 300),
    dataFatos: textoSeguro(d.dataFatos, 40),
    denunciadoNome: textoSeguro(d.denunciadoNome, 200),
    denunciadoPosto: textoSeguro(d.denunciadoPosto, 100),
    denunciadoUnidade: textoSeguro(d.denunciadoUnidade, 200),
    anonima: d.anonima === true,
    denuncianteNome: textoSeguro(d.denuncianteNome, 200),
    denuncianteContato: textoSeguro(d.denuncianteContato, 200),
    fotos,
    situacao,
    parecer: textoSeguro(d.parecer),
    criadoEm,
    atualizadoEm:
      typeof d.atualizadoEm === 'string' && !Number.isNaN(Date.parse(d.atualizadoEm))
        ? new Date(d.atualizadoEm).toISOString()
        : undefined,
    discordEnviadoEm: textoSeguro(d.discordEnviadoEm, 40) || undefined,
    discordErro: textoSeguro(d.discordErro, 500) || undefined,
  };
}

function normalizarConfig(bruto: unknown): ConfigDiscord {
  const c = (bruto && typeof bruto === 'object' ? bruto : {}) as Record<string, unknown>;
  return {
    webhook: textoSeguro(c.webhook, 500),
    canal: textoSeguro(c.canal, 100) || CONFIG_DISCORD_PADRAO.canal,
    autoEnviar: c.autoEnviar === true,
    mencionarHere: c.mencionarHere === true,
    cargoId: textoSeguro(c.cargoId, 40),
    nomeBot: textoSeguro(c.nomeBot, 80) || CONFIG_DISCORD_PADRAO.nomeBot,
    formatoEnvio:
      c.formatoEnvio === 'texto' || c.formatoEnvio === 'fotos' ? c.formatoEnvio : 'ambos',
  };
}

function normalizarEstado(bruto: unknown): EstadoApp {
  const estado = estadoVazio();
  if (!bruto || typeof bruto !== 'object') return estado;
  const e = bruto as Record<string, unknown>;
  if (Array.isArray(e.denuncias)) {
    estado.denuncias = e.denuncias
      .map(normalizarDenuncia)
      .filter((d): d is Denuncia => d !== null)
      .slice(0, 5000);
  }
  estado.discord = normalizarConfig(e.discord);
  if (Array.isArray(e.envios)) {
    estado.envios = e.envios
      .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
      .slice(0, 150)
      .map((x) => ({
        id: textoSeguro(x.id, 80),
        denunciaId: textoSeguro(x.denunciaId, 80) || undefined,
        titulo: textoSeguro(x.titulo, 200),
        status: x.status === 'sucesso' ? ('sucesso' as const) : ('erro' as const),
        detalhe: textoSeguro(x.detalhe, 600),
        via:
          x.via === 'servidor' || x.via === 'local'
            ? x.via
            : ('navegador' as const),
        criadoEm: textoSeguro(x.criadoEm, 40) || new Date().toISOString(),
      }));
  }
  return estado;
}

let cache: EstadoApp | null = null;

function carregar(): EstadoApp {
  if (cache) return cache;
  try {
    if (fs.existsSync(DATA_FILE)) {
      cache = normalizarEstado(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
      return cache;
    }
  } catch {
    /* arquivo corrompido: começa do zero, sem apagar o arquivo */
  }
  cache = estadoVazio();
  return cache;
}

function gravar(estado: EstadoApp): void {
  cache = estado;
  try {
    const temporario = `${DATA_FILE}.tmp`;
    fs.writeFileSync(temporario, JSON.stringify(estado, null, 2), { encoding: 'utf8' });
    fs.renameSync(temporario, DATA_FILE);
  } catch (erro) {
    console.error('Não foi possível gravar os dados:', erro);
  }
}

/* ------------------------------------------------------------------ */
/* Discord                                                             */
/* ------------------------------------------------------------------ */

function webhookPermitido(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === 'https:' &&
      ['discord.com', 'discordapp.com', 'ptb.discord.com', 'canary.discord.com'].includes(
        u.hostname,
      ) &&
      /^\/api\/(v\d+\/)?webhooks\//.test(u.pathname)
    );
  } catch {
    return false;
  }
}

interface ArquivoDataUrl {
  blob: Blob;
  nome: string;
}

function nomeSeguro(nome: string, indice: number): string {
  const limpo = nome.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 60);
  return limpo || `anexo-${indice}.png`;
}

function dataUrlParaArquivo(dataUrl: string, nome: string, indice: number): ArquivoDataUrl | null {
  const m = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return null;
  const tipo = m[1] === 'image/jpg' ? 'image/jpeg' : m[1];
  if (m[2].length > 6_000_000) return null;
  try {
    return {
      blob: new Blob([Buffer.from(m[2], 'base64')], { type: tipo }),
      nome: nomeSeguro(nome, indice),
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Aplicação                                                           */
/* ------------------------------------------------------------------ */

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(compression());

  // Cabeçalhos básicos. Não usamos CSP rígida nem X-Frame-Options porque o
  // painel pode rodar embutido num iframe de preview e usa <script> inline.
  app.use((_req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Basic Auth opcional, recomendado em produção: protege as denúncias e,
  // principalmente, a URL do webhook que vai para o navegador via /api/estado.
  if (SENHA_ACESSO) {
    app.use((req, res, next) => {
      if (req.path === '/api/health') return next();
      if (credenciaisValidas(req.headers.authorization)) return next();
      res.set('WWW-Authenticate', 'Basic realm="Corregedoria PMPR", charset="UTF-8"');
      res.status(401).type('text/plain; charset=utf-8').send(
        'Acesso restrito. Informe o usuário e a senha do sistema.',
      );
    });
  }

  // Fotos vão em base64 no JSON: 15 MB dá folga para várias imagens.
  app.use(express.json({ limit: '15mb' }));

  // Assets de identidade visual nunca entram em cache: trocar o brasão deve
  // aparecer no primeiro recarregamento, sem depender de Ctrl+F5.
  app.use((req, res, next) => {
    if (req.path === '/manifest.json' || /\.(png|jpe?g|webp|svg|ico)$/i.test(req.path)) {
      res.set('Cache-Control', 'no-store, must-revalidate');
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    const estado = carregar();
    res.json({
      ok: true,
      servico: 'Corregedoria · Denúncias PMPR RP',
      denuncias: estado.denuncias.length,
    });
  });

  app.get('/api/estado', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, estado: carregar() });
  });

  /** Aplica uma operação atômica e devolve o estado authoritative. */
  app.post('/api/sync', (req, res) => {
    const operacao = req.body?.op as OperacaoSync | undefined;
    if (!operacao || typeof operacao.tipo !== 'string') {
      res.status(400).json({ erro: 'Operação inválida.' });
      return;
    }
    const estado = carregar();
    let estadoNovo: EstadoApp = {
      denuncias: [...estado.denuncias],
      discord: { ...estado.discord },
      envios: [...estado.envios],
    };

    switch (operacao.tipo) {
      case 'criar': {
        const denuncia = normalizarDenuncia(operacao.denuncia);
        if (!denuncia) {
          res.status(400).json({ erro: 'Registro inválido.' });
          return;
        }
        estadoNovo.denuncias = [
          denuncia,
          ...estadoNovo.denuncias.filter((d) => d.id !== denuncia.id),
        ];
        break;
      }
      case 'atualizar': {
        const denuncia = normalizarDenuncia(operacao.denuncia);
        if (!denuncia) {
          res.status(400).json({ erro: 'Registro inválido.' });
          return;
        }
        const existe = estadoNovo.denuncias.some((d) => d.id === denuncia.id);
        estadoNovo.denuncias = existe
          ? estadoNovo.denuncias.map((d) => (d.id === denuncia.id ? denuncia : d))
          : [denuncia, ...estadoNovo.denuncias];
        break;
      }
      case 'excluir': {
        const id = textoSeguro(operacao.id, 80);
        estadoNovo.denuncias = estadoNovo.denuncias.filter((d) => d.id !== id);
        break;
      }
      case 'discord': {
        estadoNovo.discord = normalizarConfig(operacao.config);
        break;
      }
      case 'envio': {
        const envio = operacao.envio as EnvioDiscord;
        if (!envio || !textoSeguro(envio.id, 80)) {
          res.status(400).json({ erro: 'Histórico inválido.' });
          return;
        }
        const novoEnvio: EnvioDiscord = {
          id: textoSeguro(envio.id, 80),
          denunciaId: textoSeguro(envio.denunciaId, 80) || undefined,
          titulo: textoSeguro(envio.titulo, 200),
          status: envio.status === 'sucesso' ? 'sucesso' : 'erro',
          detalhe: textoSeguro(envio.detalhe, 600),
          via: envio.via === 'servidor' ? 'servidor' : 'navegador',
          criadoEm: textoSeguro(envio.criadoEm, 40) || new Date().toISOString(),
        };
        estadoNovo.envios = [novoEnvio, ...estadoNovo.envios].slice(0, 150);
        break;
      }
      default:
        res.status(400).json({ erro: 'Tipo de operação desconhecido.' });
        return;
    }

    gravar(estadoNovo);
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, estado: estadoNovo });
  });

  /** Fallback de entrega: o servidor posta no Discord quando o navegador não consegue. */
  app.post('/api/discord/proxy', async (req, res) => {
    if (!dentroDoLimite(req.ip || 'desconhecido', 180, 60_000)) {
      res.status(429).json({ ok: false, detalhe: 'Muitos envios seguidos. Aguarde um minuto.' });
      return;
    }
    const webhook = textoSeguro(req.body?.webhook, 500);
    const payload = req.body?.payload;
    // Formato novo: anexos nomeados (fotos de evidência). Mantém `fotos` legado.
    const anexosBrutos = Array.isArray(req.body?.anexos) ? req.body.anexos : null;
    const anexos: { nome: string; dataUrl: string }[] = anexosBrutos
      ? (anexosBrutos as unknown[])
          .filter((a): a is Record<string, unknown> => Boolean(a) && typeof a === 'object')
          .slice(0, 6)
          .map((a, i) => ({
            nome: nomeSeguro(textoSeguro(a.nome, 80), i),
            dataUrl: textoSeguro(a.dataUrl, 6_000_000),
          }))
      : (Array.isArray(req.body?.fotos)
          ? (req.body.fotos as unknown[])
          : []
        )
          .filter((f): f is string => typeof f === 'string')
          .slice(0, 4)
          .map((f, i) => ({ nome: `evidencia-${i + 1}.jpg`, dataUrl: f }));

    if (!webhookPermitido(webhook)) {
      res.status(400).json({
        ok: false,
        detalhe: 'Webhook inválido. Use uma URL https://discord.com/api/webhooks/...',
      });
      return;
    }
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ ok: false, detalhe: 'Mensagem inválida.' });
      return;
    }

    try {
      let corpo: BodyInit;
      let cabecalhos: Record<string, string> = {};

      if (anexos.length > 0) {
        const form = new FormData();
        const confirmados: { id: number; filename: string }[] = [];
        anexos.forEach((anexo, i) => {
          const arquivo = dataUrlParaArquivo(anexo.dataUrl, anexo.nome, i);
          if (arquivo) {
            form.append(`files[${i}]`, arquivo.blob, arquivo.nome);
            confirmados.push({ id: i, filename: arquivo.nome });
          }
        });
        const copia = {
          ...(payload as Record<string, unknown>),
          // Só preenche se o cliente não mandou a lista (compatibilidade).
          ...(Array.isArray((payload as Record<string, unknown>).attachments)
            ? {}
            : { attachments: confirmados }),
        };
        form.append('payload_json', JSON.stringify(copia));
        corpo = form;
      } else {
        cabecalhos = { 'Content-Type': 'application/json' };
        corpo = JSON.stringify(payload);
      }

      const controlador = new AbortController();
      const timer = setTimeout(() => controlador.abort(), 12000);
      const resposta = await fetch(`${webhook}${webhook.includes('?') ? '&' : '?'}wait=true`, {
        method: 'POST',
        headers: cabecalhos,
        body: corpo,
        signal: controlador.signal,
      });
      clearTimeout(timer);

      if (resposta.ok || resposta.status === 204) {
        res.json({ ok: true, detalhe: 'Mensagem entregue ao canal pelo servidor.' });
        return;
      }
      const texto = await resposta.text().catch(() => '');
      res.status(502).json({
        ok: false,
        detalhe: `Discord respondeu ${resposta.status}: ${texto.slice(0, 200)}`,
      });
    } catch (erro) {
      res.status(502).json({
        ok: false,
        detalhe: `O servidor não alcançou o Discord: ${erro instanceof Error ? erro.message : 'falha de rede'}`,
      });
    }
  });

  /* --------------------- estáticos / Vite --------------------- */

  if (process.env.NODE_ENV !== 'production') {
    // Import dinâmico: em produção o bundle nunca exige o pacote `vite`,
    // que fica apenas em devDependencies (imagem bem menor no deploy).
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      // hmr/ws desligados: o Vite nao deve abrir o WebSocket em 24678, senao
      // conflita com o preview e essa porta responde "426 Upgrade Required".
      server: { middlewareMode: true, hmr: false, ws: false as const },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use((req, res, next) => {
      if (req.path === '/' || req.path.endsWith('.html')) {
        res.set('Cache-Control', 'no-store');
      }
      next();
    });
    app.use(
      express.static(distPath, {
        setHeaders: (res, caminho) => {
          if (/[\\/]assets[\\/]/.test(caminho)) {
            res.set('Cache-Control', 'public, max-age=31536000, immutable');
          } else if (/\.(png|jpe?g|webp|svg|json)$/i.test(caminho)) {
            res.set('Cache-Control', 'no-store, must-revalidate');
          }
        },
      }),
    );
    app.use('/api', (_req, res) => {
      res.status(404).json({ erro: 'Rota da API não encontrada.' });
    });
    app.get('*', (_req, res) => {
      res.set('Cache-Control', 'no-store');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Uma unica porta HTTP (3000 por padrao). O bind extra em 24678 era legado
  // e colidia com o servidor de HMR do Vite, gerando EADDRINUSE e expondo uma
  // porta que nao servia o site.
  const PORTAS = [PORT];

  for (const porta of PORTAS) {
    const servidor = app.listen(porta, '0.0.0.0', () => {
      console.log(`Corregedoria · Denúncias PMPR em http://0.0.0.0:${porta}`);
    });
    servidor.on('error', (erro: NodeJS.ErrnoException) => {
      if (erro.code === 'EADDRINUSE') {
        console.error(`Porta ${porta} já está em uso — seguindo com as demais.`);
      } else {
        console.error(`Falha ao escutar na porta ${porta}:`, erro.message);
      }
    });
  }
}

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

startServer().catch((erro) => {
  console.error('Falha ao iniciar o servidor:', erro);
  process.exit(1);
});
