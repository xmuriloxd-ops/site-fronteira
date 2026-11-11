/**
 * Servidor do Sistema de Registro de Prisões — Polícia Civil RP do Paraná.
 *
 * - Em desenvolvimento: sobe o middleware do Vite (hot reload).
 * - Em produção: serve o build de `dist/`.
 * - Guarda os registros, a config do Discord e o histórico num JSON local
 *   (`dados-pcpr-rp.json`, fora do Git). Se o servidor estiver indisponível,
 *   o navegador continua funcionando com localStorage.
 * - `/api/discord/proxy` é um fallback de entrega: alguns navegadores/rede
 *   bloqueiam a chamada direta ao Discord, então o envio também pode sair
 *   do servidor (que tem rede liberada num deploy normal).
 */
import express from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import type {
  ConfigDiscord,
  EnvioDiscord,
  EstadoApp,
  Mandado,
  OperacaoSync,
  Prisao,
} from './src/types';
import { CONFIG_DISCORD_PADRAO, CONFIG_MANDADOS_PADRAO } from './src/types';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.PC_DATA_DIR || process.cwd();
try {
  if (DATA_DIR !== process.cwd()) fs.mkdirSync(DATA_DIR, { recursive: true });
} catch {
  /* sem permissão de escrita: usa a raiz do projeto */
}
const DATA_FILE = path.join(DATA_DIR, 'dados-pcpr-rp.json');

/* ------------------------------------------------------------------ */
/* Persistência                                                        */
/* ------------------------------------------------------------------ */

function estadoVazio(): EstadoApp {
  return {
    prisoes: [],
    mandados: [],
    discord: { ...CONFIG_DISCORD_PADRAO },
    discordMandados: { ...CONFIG_MANDADOS_PADRAO },
    envios: [],
  };
}

function textoSeguro(valor: unknown, limite = 4000): string {
  return typeof valor === 'string' ? valor.slice(0, limite) : '';
}

/** Normaliza o que vem do cliente para nunca gravar lixo no JSON. */
function normalizarPrisao(bruto: unknown): Prisao | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const p = bruto as Record<string, unknown>;
  if (!textoSeguro(p.id)) return null;

  const fotos = Array.isArray(p.fotos)
    ? p.fotos
        .filter((f): f is string => typeof f === 'string' && /^data:image\//.test(f))
        .slice(0, 4)
        .map((f) => f.slice(0, 2_500_000))
    : [];

  const assinaturaBruta = textoSeguro(p.assinatura, 1_500_000);
  const assinatura = /^data:image\/png;base64,/.test(assinaturaBruta) ? assinaturaBruta : undefined;

  const criadoEm =
    typeof p.criadoEm === 'string' && !Number.isNaN(Date.parse(p.criadoEm))
      ? new Date(p.criadoEm).toISOString()
      : new Date().toISOString();

  return {
    id: textoSeguro(p.id, 80),
    numero: textoSeguro(p.numero, 60),
    fotos,
    nome: textoSeguro(p.nome, 200),
    idRp: textoSeguro(p.idRp, 100),
    artigos: textoSeguro(p.artigos),
    tempoPrisao: textoSeguro(p.tempoPrisao, 200),
    itensApreendidos: textoSeguro(p.itensApreendidos),
    agente: textoSeguro(p.agente, 200),
    unidade: textoSeguro(p.unidade, 200),
    escrivao: textoSeguro(p.escrivao, 200),
    local: textoSeguro(p.local, 300),
    observacoes: textoSeguro(p.observacoes, 2000),
    assinatura,
    criadoEm,
    discordEnviadoEm: textoSeguro(p.discordEnviadoEm, 40) || undefined,
    discordErro: textoSeguro(p.discordErro, 500) || undefined,
  };
}

function normalizarMandado(bruto: unknown): Mandado | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const m = bruto as Record<string, unknown>;
  if (!textoSeguro(m.id)) return null;

  const fotos = Array.isArray(m.fotos)
    ? m.fotos
        .filter((f): f is string => typeof f === 'string' && /^data:image\//.test(f))
        .slice(0, 4)
        .map((f) => f.slice(0, 2_500_000))
    : [];
  const assinaturaBruta = textoSeguro(m.assinatura, 1_500_000);
  const assinatura = /^data:image\/png;base64,/.test(assinaturaBruta) ? assinaturaBruta : undefined;
  const criadoEm =
    typeof m.criadoEm === 'string' && !Number.isNaN(Date.parse(m.criadoEm))
      ? new Date(m.criadoEm).toISOString()
      : new Date().toISOString();
  const status: Mandado['status'] =
    m.status === 'cumprido' || m.status === 'revogado' ? m.status : 'pendente';

  return {
    id: textoSeguro(m.id, 80),
    numero: textoSeguro(m.numero, 60),
    fotos,
    nome: textoSeguro(m.nome, 200),
    idRp: textoSeguro(m.idRp, 100),
    artigos: textoSeguro(m.artigos),
    fundamento: textoSeguro(m.fundamento),
    processo: textoSeguro(m.processo, 200),
    autoridade: textoSeguro(m.autoridade, 200),
    origem: textoSeguro(m.origem, 300),
    unidade: textoSeguro(m.unidade, 200),
    agente: textoSeguro(m.agente, 200),
    validade: textoSeguro(m.validade, 200),
    status,
    observacoes: textoSeguro(m.observacoes, 2000),
    assinatura,
    criadoEm,
    cumpridoEm: textoSeguro(m.cumpridoEm, 40) || undefined,
    discordEnviadoEm: textoSeguro(m.discordEnviadoEm, 40) || undefined,
    discordErro: textoSeguro(m.discordErro, 500) || undefined,
  };
}

function normalizarConfig(
  bruto: unknown,
  padrao: ConfigDiscord = CONFIG_DISCORD_PADRAO,
): ConfigDiscord {
  const c = (bruto && typeof bruto === 'object' ? bruto : {}) as Record<string, unknown>;
  return {
    webhook: textoSeguro(c.webhook, 500),
    canal: textoSeguro(c.canal, 100) || padrao.canal,
    autoEnviar: c.autoEnviar === true,
    mencionarHere: c.mencionarHere === true,
    cargoId: textoSeguro(c.cargoId, 40),
    nomeBot: textoSeguro(c.nomeBot, 80) || padrao.nomeBot,
    formatoEnvio:
      c.formatoEnvio === 'texto' || c.formatoEnvio === 'ambos' ? c.formatoEnvio : 'cartaz',
  };
}

function normalizarEstado(bruto: unknown): EstadoApp {
  const estado = estadoVazio();
  if (!bruto || typeof bruto !== 'object') return estado;
  const e = bruto as Record<string, unknown>;
  if (Array.isArray(e.prisoes)) {
    estado.prisoes = e.prisoes
      .map(normalizarPrisao)
      .filter((p): p is Prisao => p !== null)
      .slice(0, 5000);
  }
  if (Array.isArray(e.mandados)) {
    estado.mandados = e.mandados
      .map(normalizarMandado)
      .filter((m): m is Mandado => m !== null)
      .slice(0, 5000);
  }
  estado.discord = normalizarConfig(e.discord);
  estado.discordMandados = normalizarConfig(e.discordMandados, CONFIG_MANDADOS_PADRAO);
  if (Array.isArray(e.envios)) {
    estado.envios = e.envios
      .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
      .slice(0, 150)
      .map((x) => ({
        id: textoSeguro(x.id, 80),
        prisaoId: textoSeguro(x.prisaoId, 80) || undefined,
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
  // Fotos vão em base64 no JSON: 15 MB dá folga para várias imagens.
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    const estado = carregar();
    res.json({
      ok: true,
      servico: 'PCPR RP · Registro de Prisões e Mandados',
      registros: estado.prisoes.length,
      mandados: estado.mandados.length,
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
      prisoes: [...estado.prisoes],
      mandados: [...estado.mandados],
      discord: { ...estado.discord },
      discordMandados: { ...estado.discordMandados },
      envios: [...estado.envios],
    };

    switch (operacao.tipo) {
      case 'criar': {
        const prisao = normalizarPrisao(operacao.prisao);
        if (!prisao) {
          res.status(400).json({ erro: 'Registro inválido.' });
          return;
        }
        estadoNovo.prisoes = [prisao, ...estadoNovo.prisoes.filter((p) => p.id !== prisao.id)];
        break;
      }
      case 'atualizar': {
        const prisao = normalizarPrisao(operacao.prisao);
        if (!prisao) {
          res.status(400).json({ erro: 'Registro inválido.' });
          return;
        }
        const existe = estadoNovo.prisoes.some((p) => p.id === prisao.id);
        estadoNovo.prisoes = existe
          ? estadoNovo.prisoes.map((p) => (p.id === prisao.id ? prisao : p))
          : [prisao, ...estadoNovo.prisoes];
        break;
      }
      case 'excluir': {
        const id = textoSeguro(operacao.id, 80);
        estadoNovo.prisoes = estadoNovo.prisoes.filter((p) => p.id !== id);
        break;
      }
      case 'criar-mandado': {
        const mandado = normalizarMandado(operacao.mandado);
        if (!mandado) {
          res.status(400).json({ erro: 'Mandado inválido.' });
          return;
        }
        estadoNovo.mandados = [mandado, ...estadoNovo.mandados.filter((m) => m.id !== mandado.id)].slice(0, 5000);
        break;
      }
      case 'atualizar-mandado': {
        const mandado = normalizarMandado(operacao.mandado);
        if (!mandado) {
          res.status(400).json({ erro: 'Mandado inválido.' });
          return;
        }
        const existe = estadoNovo.mandados.some((m) => m.id === mandado.id);
        estadoNovo.mandados = existe
          ? estadoNovo.mandados.map((m) => (m.id === mandado.id ? mandado : m))
          : [mandado, ...estadoNovo.mandados];
        break;
      }
      case 'excluir-mandado': {
        const id = textoSeguro(operacao.id, 80);
        estadoNovo.mandados = estadoNovo.mandados.filter((m) => m.id !== id);
        break;
      }
      case 'discord': {
        estadoNovo.discord = normalizarConfig(operacao.config);
        break;
      }
      case 'discord-mandados': {
        estadoNovo.discordMandados = normalizarConfig(operacao.config, CONFIG_MANDADOS_PADRAO);
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
          prisaoId: textoSeguro(envio.prisaoId, 80) || undefined,
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
    const webhook = textoSeguro(req.body?.webhook, 500);
    const payload = req.body?.payload;
    // Formato novo: anexos nomeados (cartaz + fotos). Mantém `fotos` legado.
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
          .map((f, i) => ({ nome: `foto-${i}.jpg`, dataUrl: f }));

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
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  const PORTAS =
    process.env.NODE_ENV === 'production'
      ? [PORT]
      : Array.from(new Set([PORT, Number(process.env.PREVIEW_PORT) || 24678]));

  for (const porta of PORTAS) {
    const servidor = app.listen(porta, '0.0.0.0', () => {
      console.log(`PCPR RP · Registro de Prisões em http://0.0.0.0:${porta}`);
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
