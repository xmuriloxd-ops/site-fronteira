import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

/* ------------------------------------------------------------------ */
/* Persistência simples em arquivo JSON                                */
/* ------------------------------------------------------------------ */

const DATA_FILE = path.join(process.cwd(), 'portal-data.json');
const SESSION_TTL = 1000 * 60 * 60 * 8; // 8 horas

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
  sessions: Record<string, { login: string; expiraEm: number }>;
  inscricoes: InscricaoRecrutamento[];
}

const DEFAULT_STORE: Store = {
  auth: { login: 'comnadopmpr', senha: '142536' },
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
  inscricoes: [],
};

function loadStore(): Store {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as Partial<Store>;
      return {
        ...DEFAULT_STORE,
        ...raw,
        auth: { ...DEFAULT_STORE.auth, ...(raw.auth ?? {}) },
        discord: { ...DEFAULT_STORE.discord, ...(raw.discord ?? {}) },
        interessados: raw.interessados ?? [],
        envios: raw.envios ?? [],
        overrides: raw.overrides ?? {},
        logs: raw.logs ?? [],
        sessions: raw.sessions ?? {},
        inscricoes: raw.inscricoes ?? [],
      };
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

function criarSessao(store: Store, login: string) {
  // limpa sessões vencidas
  for (const [chave, sessao] of Object.entries(store.sessions)) {
    if (sessao.expiraEm < Date.now()) delete store.sessions[chave];
  }
  const token = crypto.randomBytes(24).toString('hex');
  store.sessions[token] = { login, expiraEm: Date.now() + SESSION_TTL };
  saveStore(store);
  return token;
}

function validarSessao(store: Store, token: string | undefined) {
  if (!token) return null;
  const sessao = store.sessions[token];
  if (!sessao) return null;
  if (sessao.expiraEm < Date.now()) {
    delete store.sessions[token];
    saveStore(store);
    return null;
  }
  return sessao;
}

function tokenDaRequisicao(req: express.Request) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
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
    return { ok: false, detalhe: `Falha de conexão: ${(error as Error).message}` };
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

  const publicConfig = () => ({
    discordVinculado: Boolean(store.discord.webhook && webhookValido(store.discord.webhook)),
    canalDiscord: store.discord.canal,
    conviteDiscord: store.discord.convite,
    interessados: store.interessados.length,
    inscricoes: store.inscricoes.length,
    overrides: store.overrides,
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
    const loginOk = login.trim().toLowerCase() === store.auth.login.toLowerCase();
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
    res.json({ token, login: store.auth.login, expiraEmMs: SESSION_TTL });
  });

  app.post('/api/admin/logout', (req, res) => {
    const token = tokenDaRequisicao(req);
    if (token && store.sessions[token]) {
      delete store.sessions[token];
      saveStore(store);
    }
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
      if (typeof senha !== 'string' || senha.length < 6) {
        return res.status(400).json({ erro: 'A nova senha deve ter ao menos 6 caracteres.' });
      }
    }
    if (login === undefined && senha === undefined) {
      return res.status(400).json({ erro: 'Nada para alterar.' });
    }

    if (login !== undefined) store.auth.login = login.trim();
    if (senha !== undefined) store.auth.senha = senha;

    // Derruba todas as sessões antigas por segurança
    store.sessions = {};
    const token = criarSessao(store, store.auth.login);
    saveStore(store);

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
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Portal de Editais PMPR em http://0.0.0.0:${PORT}`);
  });
}

startServer();
