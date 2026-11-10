import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

/* ------------------------------------------------------------------ */
/* Persistência simples em arquivo JSON                                */
/* ------------------------------------------------------------------ */

const DATA_FILE = path.join(process.cwd(), 'portal-data.json');
const SECRET_FILE = path.join(process.cwd(), '.portal-secret');
const SESSION_TTL = 1000 * 60 * 60 * 8; // 8 horas

/**
 * Variações de login sempre aceitas, além do login atual definido no painel.
 * Corrige o desencontro entre "comando", "comandopmpr" e "comnadopmpr".
 */
const APELIDOS_LOGIN = ['comando', 'comandopmpr', 'comnadopmpr'];

/**
 * Segredo usado para assinar os tokens do comando.
 * Fica em arquivo próprio (fora do portal-data.json) e é criado uma única vez,
 * para que o login continue válido mesmo depois de reiniciar o servidor.
 */
function carregarSegredo(): string {
  if (process.env.PORTAL_SECRET) return process.env.PORTAL_SECRET;
  try {
    if (fs.existsSync(SECRET_FILE)) {
      const salvo = fs.readFileSync(SECRET_FILE, 'utf8').trim();
      if (salvo.length >= 32) return salvo;
    }
    const novo = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SECRET_FILE, novo, { encoding: 'utf8', mode: 0o600 });
    return novo;
  } catch {
    // último recurso: segredo em memória (sessões caem no próximo reinício)
    return crypto.randomBytes(32).toString('hex');
  }
}

const SECRET = carregarSegredo();

interface Interessado {
  id: string;
  nome: string;
  discord: string;
  editais: string[];
  criadoEm: string;
  vinculado: boolean;
}

interface EnvioDiscord {
  id: string;
  editalId: string;
  titulo: string;
  destino: string;
  status: 'sucesso' | 'erro';
  detalhe?: string;
  criadoEm: string;
}

interface DiscordConfig {
  webhook: string;
  convite: string;
  canal: string;
  autoEnviar: boolean;
  mencionarHere: boolean;
}

interface InscricaoRecrutamento {
  id: string;
  formularioId: string;
  nome: string;
  idade: string;
  idRp: string;
  respostas: Record<string, string>;
  criadoEm: string;
  status: 'novo' | 'em-analise' | 'aprovado' | 'reprovado';
  observacaoComando?: string;
}

interface Store {
  auth: { login: string; senha: string };
  discord: DiscordConfig;
  interessados: Interessado[];
  envios: EnvioDiscord[];
  overrides: Record<string, { status?: string; aviso?: string; publicacao?: string }>;
  logs: { id: string; criadoEm: string; ip: string; ua: string }[];
  sessions?: Record<string, { login: string; expiraEm: number }>;
  /** Tokens encerrados manualmente (logout) que precisam ser recusados. */
  revogados?: string[];
  /** Incrementa a cada troca de credenciais para invalidar tokens antigos. */
  versaoSessao?: number;
  inscricoes: InscricaoRecrutamento[];
}

const DEFAULT_STORE: Store = {
  auth: { login: 'comando', senha: '1234' },
  discord: {
    webhook: '',
    convite: '',
    canal: 'editais-pmpr',
    autoEnviar: false,
    mencionarHere: true,
  },
  interessados: [],
  envios: [],
  overrides: {},
  logs: [],
  sessions: {},
  revogados: [],
  versaoSessao: 0,
  inscricoes: [],
};

function loadStore(): Store {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as Partial<Store>;
      const migrado = {
        ...DEFAULT_STORE,
        ...raw,
        auth: { ...DEFAULT_STORE.auth, ...(raw.auth ?? {}) },
        discord: { ...DEFAULT_STORE.discord, ...(raw.discord ?? {}) },
        interessados: raw.interessados ?? [],
        envios: raw.envios ?? [],
        overrides: raw.overrides ?? {},
        logs: raw.logs ?? [],
        sessions: raw.sessions ?? {},
        revogados: raw.revogados ?? [],
        versaoSessao: raw.versaoSessao ?? 0,
        inscricoes: raw.inscricoes ?? [],
      };

      // Migração: instalações antigas usavam "comnadopmpr". Passa a valer
      // o login pedido pelo comando ("comando") mantendo a senha existente,
      // a menos que a senha antiga seja a padrão antiga.
      const loginAntigo = (raw.auth?.login ?? '').toLowerCase();
      if (loginAntigo === 'comnadopmpr' || loginAntigo === 'comandopmpr') {
        migrado.auth = {
          login: DEFAULT_STORE.auth.login,
          senha: raw.auth?.senha === '142536' ? DEFAULT_STORE.auth.senha : (raw.auth?.senha ?? DEFAULT_STORE.auth.senha),
        };
        try {
          fs.writeFileSync(DATA_FILE, JSON.stringify(migrado, null, 2), 'utf8');
        } catch {
          /* segue com o valor em memória */
        }
      }

      return migrado;
    }
  } catch (error) {
    console.error('Falha ao ler portal-data.json:', error);
  }
  return { ...DEFAULT_STORE, auth: { ...DEFAULT_STORE.auth }, discord: { ...DEFAULT_STORE.discord } };
}

function saveStore(store: Store) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (error) {
    console.error('Falha ao gravar portal-data.json:', error);
  }
}

/* ------------------------------------------------------------------ */
/* Sessões do comando                                                  */
/* ------------------------------------------------------------------ */

interface SessaoAssinada {
  login: string;
  expiraEm: number;
  versao: number;
}

function assinar(payload: string) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

function criarSessao(store: Store, login: string) {
  const sessao: SessaoAssinada = {
    login,
    expiraEm: Date.now() + SESSION_TTL,
    versao: store.versaoSessao ?? 0,
  };
  const payload = Buffer.from(JSON.stringify(sessao), 'utf8').toString('base64url');
  // mantém o registro em disco apenas como histórico (não é mais fonte de verdade)
  store.sessions = store.sessions ?? {};
  store.sessions[payload] = sessao;
  saveStore(store);
  return `${payload}.${assinar(payload)}`;
}

/**
 * Valida o token assinado. Não depende de estado em memória nem do JSON,
 * então continua funcionando após reinícios e limpeza do portal-data.json.
 */
function validarSessao(_store: Store, token: string | undefined): SessaoAssinada | null {
  if (!token) return null;
  const [payload, assinatura] = token.split('.');
  if (!payload || !assinatura) return null;

  if ((_store.revogados ?? []).includes(payload)) return null;

  const esperada = assinar(payload);
  const a = Buffer.from(assinatura);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const sessao = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessaoAssinada;
    if (typeof sessao?.expiraEm !== 'number' || sessao.expiraEm < Date.now()) return null;
    if (typeof sessao.login !== 'string') return null;
    // token emitido antes de uma troca de credenciais deixa de valer
    if ((sessao.versao ?? 0) !== (_store.versaoSessao ?? 0)) return null;
    return sessao;
  } catch {
    return null;
  }
}

const COOKIE_SESSAO = 'pmpr_sessao';

function lerCookie(req: express.Request, nome: string): string | undefined {
  const bruto = req.headers.cookie;
  if (!bruto) return undefined;
  for (const parte of bruto.split(';')) {
    const [chave, ...resto] = parte.trim().split('=');
    if (chave === nome) return decodeURIComponent(resto.join('='));
  }
  return undefined;
}

/**
 * O token pode chegar por três caminhos: cabeçalho Authorization, cookie ou
 * query string. O cookie existe porque alguns proxies removem o cabeçalho,
 * o que fazia o painel responder "sessão expirada" mesmo com login correto.
 */
function tokenDaRequisicao(req: express.Request) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  const alternativa = req.headers['x-admin-token'];
  if (typeof alternativa === 'string' && alternativa) return alternativa;
  const cookie = lerCookie(req, COOKIE_SESSAO);
  if (cookie) return cookie;
  const query = req.query.token;
  return typeof query === 'string' ? query : undefined;
}

/* ------------------------------------------------------------------ */
/* Discord                                                            */
/* ------------------------------------------------------------------ */

const DISCORD_HOSTS = ['discord.com', 'discordapp.com', 'ptb.discord.com', 'canary.discord.com'];

function webhookValido(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && DISCORD_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

/**
 * Verifica se o servidor consegue falar com o Discord.
 * Sem isso, "fetch failed" não diz nada ao comando sobre o que consertar.
 */
async function testarAlcanceDiscord(): Promise<{ alcancavel: boolean; motivo: string }> {
  try {
    const controle = new AbortController();
    const t = setTimeout(() => controle.abort(), 6000);
    const r = await fetch('https://discord.com/api/v10/gateway', {
      method: 'GET',
      signal: controle.signal,
    });
    clearTimeout(t);
    if (r.status >= 200 && r.status < 500) {
      return { alcancavel: true, motivo: `Discord respondeu ${r.status}.` };
    }
    return { alcancavel: false, motivo: `Discord respondeu ${r.status}.` };
  } catch (error) {
    const msg = (error as Error).message || '';
    const abortou = /abort/i.test(msg);
    return {
      alcancavel: false,
      motivo: abortou
        ? 'O servidor não conseguiu conectar ao Discord (tempo esgotado).'
        : 'O servidor não tem acesso à internet para o Discord (rede bloqueada).',
    };
  }
}

async function enviarDiscord(
  config: DiscordConfig,
  payload: { titulo: string; descricao: string; url?: string; cor?: number; fields?: EmbedField[] },
) {
  if (!config.webhook || !webhookValido(config.webhook)) {
    return { ok: false, detalhe: 'Webhook do Discord não configurado ou inválido.' };
  }

  const body = {
    username: 'Portal de Editais PMPR',
    content: config.mencionarHere ? '@here' : undefined,
    allowed_mentions: { parse: config.mencionarHere ? ['everyone'] : [] },
    embeds: [
      {
        title: payload.titulo,
        description: payload.descricao,
        url: payload.url,
        color: payload.cor ?? 0x0b6b3a,
        fields: payload.fields ?? [],
        footer: { text: 'Polícia Militar do Paraná · Portal de Editais' },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const resposta = await fetch(config.webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resposta.ok) {
      const texto = await resposta.text().catch(() => '');
      return { ok: false, detalhe: `Discord respondeu ${resposta.status}: ${texto.slice(0, 180)}` };
    }
    return { ok: true, detalhe: 'Mensagem entregue ao canal.' };
  } catch (error) {
    const msg = (error as Error).message || 'erro desconhecido';
    const rede = await testarAlcanceDiscord();
    return {
      ok: false,
      detalhe: rede.alcancavel
        ? `Não foi possível entregar a mensagem (${msg}). Confira se o webhook ainda existe no canal.`
        : `${rede.motivo} O webhook está salvo, mas o envio só funciona quando o servidor tiver acesso ao Discord.`,
      semRede: !rede.alcancavel,
    };
  }
}

/* ------------------------------------------------------------------ */
/* Servidor                                                           */
/* ------------------------------------------------------------------ */

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  let store = loadStore();

  app.use(express.json({ limit: '256kb' }));

  // Nenhuma resposta de API deve ser cacheada: um 401 antigo em cache faria
  // o painel voltar para a tela de login mesmo com sessão válida.
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

  const publicConfig = () => ({
    discordVinculado: Boolean(store.discord.webhook && webhookValido(store.discord.webhook)),
    canalDiscord: store.discord.canal,
    conviteDiscord: store.discord.convite,
    interessados: store.interessados.length,
    inscricoes: store.inscricoes.length,
    overrides: store.overrides,
  });

  app.get('/api/versao', (_req, res) => {
    res.json({
      versao: 3,
      loginPadrao: DEFAULT_STORE.auth.login,
      apelidosAceitos: APELIDOS_LOGIN,
      autoLogin: true,
    });
  });

  app.get('/api/ping', (_req, res) => {
    res.json({ ok: true, hora: new Date().toISOString() });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', editais: 3, interessados: store.interessados.length });
  });

  app.get('/api/public/config', (_req, res) => {
    res.json(publicConfig());
  });

  /* ------------------------------ Login ------------------------------ */

  app.post('/api/admin/login', (req, res) => {
    const { login, senha } = req.body ?? {};
    if (typeof login !== 'string' || typeof senha !== 'string') {
      return res.status(400).json({ erro: 'Informe login e senha.' });
    }
    const normalizar = (v: string) =>
      v
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const digitado = normalizar(login);
    const loginOk =
      digitado === normalizar(store.auth.login) ||
      APELIDOS_LOGIN.some((apelido) => normalizar(apelido) === digitado);
    const senhaOk = senha === store.auth.senha;

    if (!loginOk || !senhaOk) {
      store.logs.unshift({
        id: crypto.randomUUID(),
        criadoEm: new Date().toISOString(),
        ip: req.ip ?? '',
        ua: `tentativa de login: ${login}`,
      });
      store.logs = store.logs.slice(0, 300);
      saveStore(store);
      return res.status(401).json({ erro: 'Login ou senha incorretos.' });
    }

    const token = criarSessao(store, store.auth.login);
    res.cookie(COOKIE_SESSAO, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure,
      maxAge: SESSION_TTL,
      path: '/',
    });
    res.json({ token, login: store.auth.login, expiraEmMs: SESSION_TTL });
  });

  app.post('/api/admin/logout', (req, res) => {
    const token = tokenDaRequisicao(req);
    const payload = token?.split('.')[0];
    if (payload && validarSessao(store, token)) {
      store.revogados = [...(store.revogados ?? []), payload].slice(-200);
      saveStore(store);
    }
    res.clearCookie(COOKIE_SESSAO, { path: '/' });
    res.json({ ok: true });
  });

  const exigirAdmin: express.RequestHandler = (req, res, next) => {
    if (!validarSessao(store, tokenDaRequisicao(req))) {
      return res.status(401).json({ erro: 'Sessão expirada. Entre novamente.' });
    }
    next();
  };

  /* --------------------------- Dados do painel ----------------------- */

  app.get('/api/admin/data', exigirAdmin, (_req, res) => {
    res.json({
      login: store.auth.login,
      discord: {
        webhookConfigurado: Boolean(store.discord.webhook),
        webhookMascarado: store.discord.webhook
          ? store.discord.webhook.replace(/\/[\w-]{20,}$/, '/••••••••')
          : '',
        convite: store.discord.convite,
        canal: store.discord.canal,
        autoEnviar: store.discord.autoEnviar,
        mencionarHere: store.discord.mencionarHere,
        vinculado: Boolean(store.discord.webhook && webhookValido(store.discord.webhook)),
      },
      interessados: store.interessados,
      envios: store.envios.slice(0, 40),
      overrides: store.overrides,
    });
  });

  /* ----------------------- Login e senha do comando ------------------ */

  app.patch('/api/admin/credenciais', exigirAdmin, (req, res) => {
    const { login, senha, senhaAtual } = req.body ?? {};

    if (typeof senhaAtual !== 'string' || senhaAtual !== store.auth.senha) {
      return res.status(400).json({ erro: 'A senha atual informada não confere.' });
    }
    if (login !== undefined) {
      if (typeof login !== 'string' || login.trim().length < 4) {
        return res.status(400).json({ erro: 'O login deve ter ao menos 4 caracteres.' });
      }
    }
    if (senha !== undefined) {
      if (typeof senha !== 'string' || senha.trim().length < 4) {
        return res.status(400).json({ erro: 'A nova senha deve ter ao menos 4 caracteres.' });
      }
    }
    if (login === undefined && senha === undefined) {
      return res.status(400).json({ erro: 'Nada para alterar.' });
    }

    if (login !== undefined) store.auth.login = login.trim();
    if (senha !== undefined) store.auth.senha = senha;

    // Derruba todas as sessões antigas por segurança (troca a versão dos tokens)
    store.versaoSessao = (store.versaoSessao ?? 0) + 1;
    store.revogados = [];
    store.sessions = {};
    const token = criarSessao(store, store.auth.login);
    saveStore(store);

    res.cookie(COOKIE_SESSAO, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure,
      maxAge: SESSION_TTL,
      path: '/',
    });
    res.json({ ok: true, login: store.auth.login, token, mensagem: 'Credenciais atualizadas.' });
  });

  /* ------------------------------ Discord ---------------------------- */

  app.patch('/api/admin/discord', exigirAdmin, (req, res) => {
    const { webhook, convite, canal, autoEnviar, mencionarHere } = req.body ?? {};

    if (webhook !== undefined) {
      const limpo = String(webhook).trim();
      if (limpo && !webhookValido(limpo)) {
        return res
          .status(400)
          .json({ erro: 'Informe uma URL de webhook válida do Discord (https://discord.com/api/webhooks/...).' });
      }
      store.discord.webhook = limpo;
    }
    if (convite !== undefined) store.discord.convite = String(convite).trim();
    if (canal !== undefined) store.discord.canal = String(canal).trim();
    if (typeof autoEnviar === 'boolean') store.discord.autoEnviar = autoEnviar;
    if (typeof mencionarHere === 'boolean') store.discord.mencionarHere = mencionarHere;

    saveStore(store);
    res.json({
      ok: true,
      vinculado: Boolean(store.discord.webhook && webhookValido(store.discord.webhook)),
      mensagem: 'Configuração do Discord salva.',
    });
  });

  app.get('/api/admin/discord/diagnostico', exigirAdmin, async (_req, res) => {
    const rede = await testarAlcanceDiscord();
    const url = store.discord.webhook;
    res.json({
      redeOk: rede.alcancavel,
      motivoRede: rede.motivo,
      webhookSalvo: Boolean(url),
      webhookValido: Boolean(url && webhookValido(url)),
      canal: store.discord.canal,
      vinculado: Boolean(url && webhookValido(url)),
    });
  });

  /**
   * Entrega o webhook ao navegador do comando.
   * O envio é feito direto do navegador (multipart/form-data, que não passa por
   * CORS), porque este servidor não alcança o Discord. Só um administrador
   * autenticado recebe a URL.
   */
  app.get('/api/admin/discord/webhook', exigirAdmin, (_req, res) => {
    if (!store.discord.webhook || !webhookValido(store.discord.webhook)) {
      return res.status(404).json({ erro: 'Nenhum webhook válido configurado.' });
    }
    res.json({ webhook: store.discord.webhook, canal: store.discord.canal });
  });

  app.post('/api/admin/discord/teste', exigirAdmin, async (_req, res) => {
    const resultado = await enviarDiscord(store.discord, {
      titulo: 'Teste de integração ✅',
      descricao:
        'O Portal de Editais da Polícia Militar do Paraná está conectado a este canal. A partir de agora, os editais podem ser enviados automaticamente para a tropa.',
      cor: 0x0b6b3a,
      fields: [
        { name: 'Canal', value: store.discord.canal || 'não informado', inline: true },
        { name: 'Envio automático', value: store.discord.autoEnviar ? 'Ativado' : 'Desativado', inline: true },
      ],
    });
    res.status(resultado.ok ? 200 : 400).json(resultado);
  });

  /**
   * Registra o resultado de um envio feito pelo navegador do comando.
   * O servidor não consegue falar com o Discord, mas o navegador do usuário
   * consegue: aqui só guardamos o histórico e disparamos o modo automático.
   */
  app.post('/api/admin/envios/registrar', exigirAdmin, (req, res) => {
    const { editalId, titulo, ok, detalhe } = req.body ?? {};
    if (!editalId || typeof titulo !== 'string') {
      return res.status(400).json({ erro: 'Dados incompletos.' });
    }
    const envio: EnvioDiscord = {
      id: crypto.randomUUID(),
      editalId: String(editalId),
      titulo,
      destino: store.discord.canal || 'Discord',
      status: ok ? 'sucesso' : 'erro',
      detalhe: typeof detalhe === 'string' ? detalhe.slice(0, 300) : undefined,
      criadoEm: new Date().toISOString(),
    };
    store.envios = [envio, ...store.envios].slice(0, 100);
    saveStore(store);
    res.json({ ok: true, envio });
  });

  /* ---------------------- Envio de edital ao Discord ----------------- */

  app.post('/api/admin/envios', exigirAdmin, async (req, res) => {
    const { editalId, titulo, descricao, campos, url } = req.body ?? {};
    if (!editalId || typeof titulo !== 'string' || typeof descricao !== 'string') {
      return res.status(400).json({ erro: 'Dados do envio incompletos.' });
    }

    const resultado = await enviarDiscord(store.discord, {
      titulo,
      descricao,
      url: typeof url === 'string' ? url : undefined,
      fields: Array.isArray(campos) ? campos.slice(0, 10) : [],
    });

    const envio: EnvioDiscord = {
      id: crypto.randomUUID(),
      editalId,
      titulo,
      destino: store.discord.canal || 'Discord',
      status: resultado.ok ? 'sucesso' : 'erro',
      detalhe: resultado.detalhe,
      criadoEm: new Date().toISOString(),
    };
    store.envios.unshift(envio);
    store.envios = store.envios.slice(0, 100);
    saveStore(store);

    res.status(resultado.ok ? 200 : 400).json({ ...resultado, envio });
  });

  app.delete('/api/admin/envios', exigirAdmin, (_req, res) => {
    store.envios = [];
    saveStore(store);
    res.json({ ok: true });
  });

  /* ------------------------ Status dos editais ----------------------- */

  app.patch('/api/admin/editais/:id', exigirAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, aviso, publicacao, notificar } = req.body ?? {};

    const permitido = ['aberto', 'em-breve', 'encerrado'];
    if (status !== undefined && !permitido.includes(status)) {
      return res.status(400).json({ erro: 'Status inválido.' });
    }

    store.overrides[id] = {
      ...(store.overrides[id] ?? {}),
      ...(status !== undefined ? { status } : {}),
      ...(aviso !== undefined ? { aviso: String(aviso) } : {}),
      ...(publicacao !== undefined ? { publicacao: String(publicacao).slice(0, 4000) } : {}),
    };
    saveStore(store);

    let envio = null;
    if (notificar && store.discord.autoEnviar) {
      const resultado = await enviarDiscord(store.discord, {
        titulo: 'Atualização de edital',
        descricao: aviso || `O edital ${id.toUpperCase()} foi atualizado.`,
        fields: [{ name: 'Novo status', value: String(status ?? 'mantido'), inline: true }],
      });
      envio = {
        id: crypto.randomUUID(),
        editalId: id,
        titulo: 'Atualização de edital',
        destino: store.discord.canal,
        status: resultado.ok ? 'sucesso' : 'erro',
        detalhe: resultado.detalhe,
        criadoEm: new Date().toISOString(),
      } as EnvioDiscord;
      store.envios.unshift(envio);
      store.envios = store.envios.slice(0, 100);
      saveStore(store);
    }

    res.json({ ok: true, overrides: store.overrides, envio });
  });

  /* ------------------------ Lista de interessados -------------------- */

  app.patch('/api/admin/interessados/:id', exigirAdmin, (req, res) => {
    const { id } = req.params;
    const { vinculado } = req.body ?? {};
    const alvo = store.interessados.find((i) => i.id === id);
    if (!alvo) return res.status(404).json({ erro: 'Interessado não encontrado.' });
    if (typeof vinculado === 'boolean') alvo.vinculado = vinculado;
    saveStore(store);
    res.json({ ok: true, interessado: alvo });
  });

  app.delete('/api/admin/interessados/:id', exigirAdmin, (req, res) => {
    const { id } = req.params;
    store.interessados = store.interessados.filter((i) => i.id !== id);
    saveStore(store);
    res.json({ ok: true });
  });

  /* ---------------------- Inscrição pública no Discord --------------- */

  app.post('/api/public/interesse', async (req, res) => {
    const { nome, discord, editais } = req.body ?? {};

    if (typeof nome !== 'string' || nome.trim().length < 3) {
      return res.status(400).json({ erro: 'Informe seu nome completo.' });
    }
    if (typeof discord !== 'string' || discord.trim().length < 3) {
      return res.status(400).json({ erro: 'Informe seu usuário do Discord.' });
    }
    if (!Array.isArray(editais) || editais.length === 0) {
      return res.status(400).json({ erro: 'Selecione ao menos um edital.' });
    }

    const interessado: Interessado = {
      id: crypto.randomUUID(),
      nome: nome.trim().slice(0, 80),
      discord: discord.trim().slice(0, 60),
      editais: editais.filter((e: unknown) => typeof e === 'string').slice(0, 3),
      criadoEm: new Date().toISOString(),
      vinculado: false,
    };

    store.interessados.unshift(interessado);
    store.interessados = store.interessados.slice(0, 500);

    let aviso = 'Cadastro registrado no portal.';
    if (store.discord.webhook && webhookValido(store.discord.webhook)) {
      const resultado = await enviarDiscord(store.discord, {
        titulo: '📣 Novo interessado nos editais',
        descricao: `**${interessado.nome}** vinculou o Discord \`${interessado.discord}\` ao portal.`,
        cor: 0x1f7a4d,
        fields: [
          { name: 'Editais', value: interessado.editais.map((e) => e.toUpperCase()).join(' · '), inline: false },
          { name: 'Próximo passo', value: 'Envie `!confirmar` no canal para validar a vinculação.', inline: false },
        ],
      });
      aviso = resultado.ok
        ? 'Cadastro registrado e enviado ao Discord.'
        : 'Cadastro registrado no portal, mas o aviso ao Discord falhou.';
    }

    saveStore(store);
    res.status(201).json({ ok: true, aviso, interessado, convite: store.discord.convite });
  });

  /* --------------------- Recrutamento RP (formulário) ---------------- */

  const LIMITE_RESPOSTA = 4000;

  app.post('/api/public/recrutamento', (req, res) => {
    const { formularioId, nome, idade, idRp, respostas } = req.body ?? {};

    if (typeof nome !== 'string' || nome.trim().length < 2) {
      return res.status(400).json({ erro: 'Informe o nome dentro da cidade.' });
    }
    if (typeof idade !== 'string' || !/^\d{1,2}$/.test(idade.trim())) {
      return res.status(400).json({ erro: 'Informe uma idade válida (fora do RP).' });
    }
    const idadeNum = Number(idade.trim());
    if (idadeNum < 10 || idadeNum > 99) {
      return res.status(400).json({ erro: 'A idade deve estar entre 10 e 99 anos.' });
    }
    if (typeof idRp !== 'string' || idRp.trim().length < 1) {
      return res.status(400).json({ erro: 'Informe o ID dentro do RP.' });
    }
    if (!respostas || typeof respostas !== 'object' || Array.isArray(respostas)) {
      return res.status(400).json({ erro: 'Respostas inválidas.' });
    }

    const limpas: Record<string, string> = {};
    for (const [chave, valor] of Object.entries(respostas as Record<string, unknown>)) {
      if (typeof valor !== 'string' || !valor.trim()) continue;
      if (!/^[a-z0-9_-]{1,40}$/i.test(chave)) continue;
      limpas[chave] = valor.trim().slice(0, LIMITE_RESPOSTA);
    }

    if (Object.keys(limpas).length < 8) {
      return res.status(400).json({ erro: 'Responda todas as perguntas obrigatórias antes de enviar.' });
    }

    const inscricao: InscricaoRecrutamento = {
      id: crypto.randomUUID(),
      formularioId: typeof formularioId === 'string' ? formularioId.slice(0, 60) : 'fronteira-sul-nov-2026',
      nome: nome.trim().slice(0, 80),
      idade: String(idadeNum),
      idRp: idRp.trim().slice(0, 30),
      respostas: limpas,
      criadoEm: new Date().toISOString(),
      status: 'novo',
    };

    store.inscricoes.unshift(inscricao);
    store.inscricoes = store.inscricoes.slice(0, 800);
    saveStore(store);

    res.status(201).json({
      ok: true,
      aviso: 'Inscrição registrada. O comando do batalhão fará a análise.',
      inscricao,
    });
  });

  app.get('/api/admin/inscricoes', exigirAdmin, (_req, res) => {
    res.json({ inscricoes: store.inscricoes });
  });

  app.patch('/api/admin/inscricoes/:id', exigirAdmin, (req, res) => {
    const { id } = req.params;
    const { status, observacaoComando } = req.body ?? {};
    const alvo = store.inscricoes.find((i) => i.id === id);
    if (!alvo) return res.status(404).json({ erro: 'Inscrição não encontrada.' });

    const permitido = ['novo', 'em-analise', 'aprovado', 'reprovado'];
    if (status !== undefined && !permitido.includes(status)) {
      return res.status(400).json({ erro: 'Status inválido.' });
    }
    if (status !== undefined) alvo.status = status;
    if (observacaoComando !== undefined) {
      alvo.observacaoComando = String(observacaoComando).slice(0, 2000);
    }
    saveStore(store);
    res.json({ ok: true, inscricao: alvo });
  });

  app.delete('/api/admin/inscricoes/:id', exigirAdmin, (req, res) => {
    const { id } = req.params;
    store.inscricoes = store.inscricoes.filter((i) => i.id !== id);
    saveStore(store);
    res.json({ ok: true });
  });

  /* ------------------------------- Vite ------------------------------ */

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    // HTML e service worker nunca entram em cache: assim o navegador sempre
    // pega o bundle novo (era isso que mantinha o painel no código antigo).
    app.use((req, res, next) => {
      const url = req.path;
      if (url === '/' || url.endsWith('.html') || url === '/sw.js' || url === '/manifest.json') {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
      }
      next();
    });

    app.use(
      express.static(distPath, {
        setHeaders: (res, caminho) => {
          // assets têm hash no nome: podem ser cacheados por muito tempo
          if (/[\\/]assets[\\/]/.test(caminho)) {
            res.set('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      }),
    );
    app.get('*', (_req, res) => {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // O preview da plataforma expõe portas específicas. Escutamos na porta
  // principal e também na 24678, que é a porta acompanhada pelo preview.
  const PORTAS = Array.from(new Set([PORT, Number(process.env.PREVIEW_PORT) || 24678]));

  for (const porta of PORTAS) {
    const servidor = app.listen(porta, '0.0.0.0', () => {
      console.log(`Portal de Editais PMPR em http://0.0.0.0:${porta}`);
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

startServer();
