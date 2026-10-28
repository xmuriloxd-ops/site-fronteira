import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import sharp from 'sharp';
import { createServer as createViteServer } from 'vite';
import { seedPosts, seedPhotos, defaultSettings } from './seed';

/* ------------------------------------------------------------------ *
 *  Caminhos e armazenamento local
 * ------------------------------------------------------------------ */

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const UPLOADS_DIR = path.join(ROOT, 'uploads');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const PHOTOS_FILE = path.join(DATA_DIR, 'photos.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const LOGS_FILE = path.join(DATA_DIR, 'access-logs.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const SECRET_FILE = path.join(DATA_DIR, 'secret.key');

for (const dir of [DATA_DIR, UPLOADS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`[dados] falha ao ler ${path.basename(file)}:`, err);
    return fallback;
  }
}

function writeJson(file: string, value: unknown) {
  try {
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8');
    fs.renameSync(tmp, file);
  } catch (err) {
    console.error(`[dados] falha ao gravar ${path.basename(file)}:`, err);
  }
}

/* ------------------------------------------------------------------ *
 *  Tipos
 * ------------------------------------------------------------------ */

interface Post {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  location?: string;
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Photo {
  id: string;
  url: string;
  caption: string;
  tag: string;
  author: string;
  createdAt: string;
}

interface Settings {
  siteName: string;
  unit: string;
  server: string;
  heroTitle: string;
  heroSubtitle: string;
  about: string;
  instagram: string;
  discord: string;
  email: string;
  whatsapp: string;
  heroImage: string;
  foundedYear: string;
}

interface AccessLog {
  id: string;
  timestamp: string;
  path: string;
  userAgent: string;
  ip: string;
  referrer: string;
}

interface AdminAccount {
  username: string;
  passwordHash: string;
  salt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ *
 *  Dados iniciais + conta de administrador
 * ------------------------------------------------------------------ */

const posts: Post[] = readJson<Post[]>(POSTS_FILE, seedPosts as Post[]);
const photos: Photo[] = readJson<Photo[]>(PHOTOS_FILE, seedPhotos as Photo[]);
const settings: Settings = readJson<Settings>(SETTINGS_FILE, defaultSettings as Settings);
let accessLogs: AccessLog[] = readJson<AccessLog[]>(LOGS_FILE, []);

writeJson(POSTS_FILE, posts);
writeJson(PHOTOS_FILE, photos);
writeJson(SETTINGS_FILE, settings);

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function getSecret(): string {
  try {
    if (fs.existsSync(SECRET_FILE)) return fs.readFileSync(SECRET_FILE, 'utf8').trim();
    const secret = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(SECRET_FILE, secret, { mode: 0o600 });
    return secret;
  } catch {
    return 'rotam-gta-fallback-secret';
  }
}

function loadAdmin(): AdminAccount {
  try {
    if (fs.existsSync(ADMIN_FILE)) {
      const acc = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8')) as AdminAccount;
      if (acc?.passwordHash && acc?.salt) return acc;
    }
  } catch (err) {
    console.error('[auth] falha ao ler conta de administrador:', err);
  }
  const username = (process.env.ADMIN_USER || 'admin').trim();
  const password = process.env.ADMIN_PASSWORD || 'rotam123';
  const salt = crypto.randomBytes(16).toString('hex');
  const account: AdminAccount = {
    username,
    salt,
    passwordHash: hashPassword(password, salt),
    updatedAt: new Date().toISOString(),
  };
  writeJson(ADMIN_FILE, account);
  console.log(`[auth] conta administrativa criada · usuário: ${username}`);
  return account;
}

let adminAccount = loadAdmin();
const SECRET = getSecret();

/* ------------------------------------------------------------------ *
 *  Tokens de sessão (HMAC assinado)
 * ------------------------------------------------------------------ */

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

const b64 = (input: string | Buffer) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const unb64 = (input: string) =>
  Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');

function sign(payload: string): string {
  return b64(crypto.createHmac('sha256', SECRET).update(payload).digest());
}

function createToken(username: string): string {
  const payload = b64(
    JSON.stringify({ sub: username, exp: Date.now() + TOKEN_TTL_MS, iss: 'rotam-go-gta' }),
  );
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token?: string): { sub: string; exp: number } | null {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(unb64(payload)) as { sub: string; exp: number };
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

function getTokenFromRequest(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
  return undefined;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = verifyToken(getTokenFromRequest(req));
  if (!session) {
    return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  }
  next();
}

// Proteção simples contra força bruta no login
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 8;
const BLOCK_MS = 10 * 60 * 1000;

function clientIp(req: Request): string {
  let ip = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress || '';
  if (ip.includes(',')) ip = ip.split(',')[0].trim();
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  return ip || 'desconhecido';
}

/* ------------------------------------------------------------------ *
 *  Utilidades de conteúdo
 * ------------------------------------------------------------------ */

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function uniqueSlug(base: string, ignoreId?: string): string {
  const clean = base || 'noticia';
  let candidate = clean;
  let counter = 2;
  while (posts.some((p) => p.slug === candidate && p.id !== ignoreId)) {
    candidate = `${clean}-${counter++}`;
  }
  return candidate;
}

const text = (value: unknown, max = 4000): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

function normalizePost(body: any, existing?: Post): Post {
  const nowIso = new Date().toISOString();
  const title = text(body?.title, 180) || existing?.title || 'Sem título';
  const content = typeof body?.content === 'string' ? body.content.slice(0, 60000) : existing?.content || '';
  const excerpt =
    text(body?.excerpt, 400) ||
    existing?.excerpt ||
    content.replace(/[#>*_`-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 220);
  const slugSource = text(body?.slug, 120) || title;

  return {
    id: existing?.id || crypto.randomBytes(8).toString('hex'),
    slug: uniqueSlug(slugify(slugSource), existing?.id),
    title,
    category: text(body?.category, 40) || existing?.category || 'Notícia',
    excerpt,
    content,
    coverImage: text(body?.coverImage, 800) || existing?.coverImage || '',
    author: text(body?.author, 80) || existing?.author || 'Comunicação ROTAM',
    location: text(body?.location, 80) || existing?.location || '',
    featured: typeof body?.featured === 'boolean' ? body.featured : existing?.featured ?? false,
    published: typeof body?.published === 'boolean' ? body.published : existing?.published ?? true,
    createdAt: existing?.createdAt || nowIso,
    updatedAt: nowIso,
  };
}

/* ------------------------------------------------------------------ *
 *  Upload de imagens
 * ------------------------------------------------------------------ */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif|avif)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('Envie apenas arquivos de imagem (JPG, PNG, WEBP, GIF ou AVIF).'));
  },
});

async function saveUploadedImage(buffer: Buffer): Promise<string> {
  const now = new Date();
  const folder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dir = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}.jpg`;
  const destination = path.join(dir, filename);

  await sharp(buffer)
    .rotate()
    .resize({ width: 1900, height: 1900, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(destination);

  return `/uploads/${folder}/${filename}`;
}

/* ------------------------------------------------------------------ *
 *  Servidor
 * ------------------------------------------------------------------ */

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.set('trust proxy', true);
  app.use(express.json({ limit: '3mb' }));
  app.use(
    '/uploads',
    express.static(UPLOADS_DIR, { maxAge: '30d', fallthrough: true }),
  );

  /* ---------------------------- público ---------------------------- */

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', unit: 'ROTAM GOIÁS · GTA RP' }));

  app.get('/api/bootstrap', (_req, res) => {
    const publicPosts = posts
      .filter((p) => p.published)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    res.json({
      settings,
      posts: publicPosts,
      photos: [...photos].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    });
  });

  app.get('/api/posts', (req, res) => {
    const category = text(req.query.category, 40);
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    let list = posts
      .filter((p) => p.published)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (category && category.toLowerCase() !== 'todas') {
      list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    res.json({ posts: list.slice(0, limit) });
  });

  app.get('/api/posts/:slug', (req, res) => {
    const post = posts.find((p) => p.slug === req.params.slug && p.published);
    if (!post) return res.status(404).json({ error: 'Notícia não encontrada.' });
    const related = posts
      .filter((p) => p.published && p.id !== post.id)
      .sort((a, b) => {
        const sameA = a.category === post.category ? 1 : 0;
        const sameB = b.category === post.category ? 1 : 0;
        return sameB - sameA || +new Date(b.createdAt) - +new Date(a.createdAt);
      })
      .slice(0, 3);
    res.json({ post, related });
  });

  // Registro de visitas (usado no painel administrativo)
  app.post('/api/visit', (req, res) => {
    const log: AccessLog = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: new Date().toISOString(),
      path: text(req.body?.path, 200) || '/',
      userAgent: text(req.headers['user-agent'], 300) || 'desconhecido',
      ip: clientIp(req),
      referrer: text(req.body?.referrer, 300),
    };
    accessLogs.unshift(log);
    if (accessLogs.length > 2000) accessLogs = accessLogs.slice(0, 2000);
    writeJson(LOGS_FILE, accessLogs);
    res.status(204).end();
  });

  /* ---------------------------- autenticação ---------------------------- */

  app.post('/api/auth/login', (req, res) => {
    const ip = clientIp(req);
    const attempt = loginAttempts.get(ip);
    if (attempt && attempt.blockedUntil > Date.now()) {
      const minutes = Math.ceil((attempt.blockedUntil - Date.now()) / 60000);
      return res.status(429).json({ error: `Muitas tentativas. Tente novamente em ${minutes} minuto(s).` });
    }

    const username = text(req.body?.username, 60);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const hash = hashPassword(password, adminAccount.salt);

    const userOk = username.toLowerCase() === adminAccount.username.toLowerCase();
    const passOk =
      hash.length === adminAccount.passwordHash.length &&
      crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(adminAccount.passwordHash));

    if (!userOk || !passOk) {
      const next = { count: (attempt?.count || 0) + 1, blockedUntil: 0 };
      if (next.count >= MAX_ATTEMPTS) next.blockedUntil = Date.now() + BLOCK_MS;
      loginAttempts.set(ip, next);
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    loginAttempts.delete(ip);
    res.json({
      token: createToken(adminAccount.username),
      user: { username: adminAccount.username, role: 'administrador' },
      expiresIn: TOKEN_TTL_MS,
    });
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    const session = verifyToken(getTokenFromRequest(req))!;
    res.json({ user: { username: session.sub, role: 'administrador' } });
  });

  /* ---------------------------- administração ---------------------------- */

  app.get('/api/admin/posts', requireAuth, (_req, res) => {
    res.json({
      posts: [...posts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    });
  });

  app.post('/api/admin/posts', requireAuth, (req, res) => {
    const post = normalizePost(req.body);
    posts.unshift(post);
    writeJson(POSTS_FILE, posts);
    res.status(201).json({ post });
  });

  app.put('/api/admin/posts/:id', requireAuth, (req, res) => {
    const index = posts.findIndex((p) => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Notícia não encontrada.' });
    const updated = normalizePost(req.body, posts[index]);
    posts[index] = updated;
    writeJson(POSTS_FILE, posts);
    res.json({ post: updated });
  });

  app.delete('/api/admin/posts/:id', requireAuth, (req, res) => {
    const index = posts.findIndex((p) => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Notícia não encontrada.' });
    posts.splice(index, 1);
    writeJson(POSTS_FILE, posts);
    res.json({ success: true });
  });

  app.get('/api/admin/photos', requireAuth, (_req, res) => {
    res.json({ photos: [...photos].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)) });
  });

  app.post('/api/admin/photos', requireAuth, (req, res) => {
    const url = text(req.body?.url, 900);
    if (!url) return res.status(400).json({ error: 'Envie uma imagem ou informe uma URL.' });
    const photo: Photo = {
      id: crypto.randomBytes(8).toString('hex'),
      url,
      caption: text(req.body?.caption, 260) || 'Registro operacional',
      tag: text(req.body?.tag, 40) || 'Operacional',
      author: text(req.body?.author, 80) || 'Comunicação ROTAM',
      createdAt: new Date().toISOString(),
    };
    photos.unshift(photo);
    writeJson(PHOTOS_FILE, photos);
    res.status(201).json({ photo });
  });

  app.put('/api/admin/photos/:id', requireAuth, (req, res) => {
    const photo = photos.find((p) => p.id === req.params.id);
    if (!photo) return res.status(404).json({ error: 'Foto não encontrada.' });
    if (req.body?.caption !== undefined) photo.caption = text(req.body.caption, 260);
    if (req.body?.tag !== undefined) photo.tag = text(req.body.tag, 40);
    writeJson(PHOTOS_FILE, photos);
    res.json({ photo });
  });

  app.delete('/api/admin/photos/:id', requireAuth, (req, res) => {
    const index = photos.findIndex((p) => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Foto não encontrada.' });
    photos.splice(index, 1);
    writeJson(PHOTOS_FILE, photos);
    res.json({ success: true });
  });

  app.post('/api/admin/upload', requireAuth, (req, res) => {
    upload.single('file')(req, res, async (err: any) => {
      if (err) return res.status(400).json({ error: err.message || 'Falha no upload.' });
      if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo recebido.' });
      try {
        const url = await saveUploadedImage(req.file.buffer);
        res.status(201).json({ url });
      } catch (error) {
        console.error('[upload] erro ao processar imagem:', error);
        res.status(500).json({ error: 'Não foi possível processar a imagem.' });
      }
    });
  });

  app.get('/api/admin/logs', requireAuth, (_req, res) => {
    res.json({ logs: accessLogs, total: accessLogs.length });
  });

  app.post('/api/admin/logs/clear', requireAuth, (_req, res) => {
    accessLogs = [];
    writeJson(LOGS_FILE, accessLogs);
    res.json({ success: true });
  });

  app.put('/api/admin/settings', requireAuth, (req, res) => {
    const allowed: (keyof Settings)[] = [
      'siteName',
      'unit',
      'server',
      'heroTitle',
      'heroSubtitle',
      'about',
      'instagram',
      'discord',
      'email',
      'whatsapp',
      'heroImage',
      'foundedYear',
    ];
    for (const key of allowed) {
      if (typeof req.body?.[key] === 'string') {
        settings[key] = req.body[key].slice(0, key === 'about' || key === 'heroSubtitle' ? 1200 : 220).trim();
      }
    }
    writeJson(SETTINGS_FILE, settings);
    res.json({ settings });
  });

  app.post('/api/admin/password', requireAuth, (req, res) => {
    const current = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const next = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    const currentHash = hashPassword(current, adminAccount.salt);
    const ok =
      currentHash.length === adminAccount.passwordHash.length &&
      crypto.timingSafeEqual(Buffer.from(currentHash), Buffer.from(adminAccount.passwordHash));
    if (!ok) return res.status(401).json({ error: 'A senha atual está incorreta.' });
    if (next.length < 6) return res.status(400).json({ error: 'A nova senha precisa ter ao menos 6 caracteres.' });

    const salt = crypto.randomBytes(16).toString('hex');
    adminAccount = {
      username: adminAccount.username,
      salt,
      passwordHash: hashPassword(next, salt),
      updatedAt: new Date().toISOString(),
    };
    writeJson(ADMIN_FILE, adminAccount);
    res.json({ success: true, token: createToken(adminAccount.username) });
  });

  /* ---------------------------- front-end ---------------------------- */

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT, 'dist');
    app.use(express.static(distPath, { maxAge: '1h' }));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ ROTAM GOIÁS · GTA RP — portal online em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});
