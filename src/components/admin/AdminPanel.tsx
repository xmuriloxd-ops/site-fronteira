import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Images,
  LayoutDashboard,
  Loader2,
  LogOut,
  Newspaper,
  Plus,
  Settings as SettingsIcon,
  ShieldAlert,
  UserRound,
  XCircle,
  Zap,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { formatDate, relativeTime } from '../../lib/format';
import { Link } from '../../lib/router';
import type { AccessLog, Photo, Post, Settings } from '../../types';
import { Crest } from '../ui';
import { LogsView } from './LogsView';
import { PhotosManager } from './PhotosManager';
import { PostEditor } from './PostEditor';
import { PostsManager } from './PostsManager';
import { SettingsManager } from './SettingsManager';
import { StatCard } from './controls';

type Tab = 'visao' | 'noticias' | 'galeria' | 'config' | 'acessos';

const TABS: { id: Tab; label: string; icon: typeof Newspaper }[] = [
  { id: 'visao', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'noticias', label: 'Notícias', icon: Newspaper },
  { id: 'galeria', label: 'Galeria', icon: Images },
  { id: 'config', label: 'Configurações', icon: SettingsIcon },
  { id: 'acessos', label: 'Acessos', icon: Activity },
];

interface Toast {
  id: number;
  message: string;
  type: 'ok' | 'err';
}

export function AdminPanel({
  user,
  settings,
  onLogout,
  onExpire,
  onPublicRefresh,
}: {
  user: { username: string; role: string };
  settings: Settings;
  onLogout: () => void;
  onExpire: () => void;
  onPublicRefresh: () => Promise<void> | void;
}) {
  const [tab, setTab] = useState<Tab>('visao');
  const [posts, setPosts] = useState<Post[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const handleError = useCallback(
    (err: unknown, fallback: string) => {
      if (err instanceof ApiError && err.status === 401) {
        onExpire();
        return;
      }
      notify(err instanceof ApiError ? err.message : fallback, 'err');
    },
    [notify, onExpire],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [postsData, photosData, logsData] = await Promise.all([
        api.adminPosts(),
        api.adminPhotos(),
        api.logs().catch(() => ({ logs: [] as AccessLog[], total: 0 })),
      ]);
      setPosts(postsData.posts);
      setPhotos(photosData.photos);
      setLogs(logsData.logs);
    } catch (err) {
      handleError(err, 'Não foi possível carregar os dados do painel.');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refreshPosts = useCallback(async () => {
    try {
      const data = await api.adminPosts();
      setPosts(data.posts);
      await onPublicRefresh();
    } catch (err) {
      handleError(err, 'Não foi possível atualizar as notícias.');
    }
  }, [handleError, onPublicRefresh]);

  const refreshPhotos = useCallback(async () => {
    try {
      const data = await api.adminPhotos();
      setPhotos(data.photos);
      await onPublicRefresh();
    } catch (err) {
      handleError(err, 'Não foi possível atualizar a galeria.');
    }
  }, [handleError, onPublicRefresh]);

  const published = posts.filter((post) => post.published).length;
  const drafts = posts.length - published;
  const visitsToday = logs.filter((log) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return new Date(log.timestamp) >= start;
  }).length;

  return (
    <div className="min-h-screen bg-[#080707]">
      {/* Barra superior */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0909]/95 backdrop-blur">
        <div className="hazard h-1 w-full opacity-70" />
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Crest className="h-10 w-auto" />
            <div className="leading-none">
              <p className="font-display text-lg uppercase tracking-wide text-white">
                Painel ROTAM
              </p>
              <p className="mt-1 text-[0.58rem] uppercase tracking-[0.24em] text-fumaca-escura">
                Área administrativa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" className="btn btn-ghost !px-3 !py-2 !text-[0.7rem]">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ver site</span>
            </Link>
            <span className="hidden items-center gap-2 border border-borda px-3 py-1.5 text-xs text-fumaca sm:flex">
              <UserRound className="h-3.5 w-3.5 text-ouro" />
              {user.username}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="btn btn-ghost !px-3 !py-2 !text-[0.7rem] hover:!text-vermelho"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        {/* Menu lateral */}
        <aside className="lg:w-56 lg:shrink-0">
          <nav className="no-scrollbar flex gap-1 overflow-x-auto border border-borda bg-carvao p-1.5 lg:flex-col">
            {TABS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex shrink-0 items-center gap-2.5 px-3 py-2.5 text-left font-display text-[0.85rem] uppercase tracking-[0.12em] transition-colors ${
                    active
                      ? 'bg-ouro text-preto'
                      : 'text-fumaca hover:bg-white/5 hover:text-ouro'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-4 hidden border border-borda bg-carvao p-4 lg:block">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 fill-ouro text-ouro" />
              <span className="label">Sessão</span>
            </div>
            <p className="mt-2 text-[0.68rem] leading-relaxed text-fumaca">
              Logado como <span className="text-white">{user.username}</span>. A sessão expira em 12
              horas.
            </p>
            <button
              type="button"
              onClick={() => setTab('config')}
              className="mt-3 flex items-center gap-1 text-[0.66rem] uppercase tracking-[0.14em] text-ouro/80 hover:text-ouro"
            >
              Alterar senha
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </aside>

        {/* Conteúdo */}
        <main className="min-w-0 flex-1 pb-10">
          {tab === 'visao' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="display text-3xl text-white">Visão geral</h1>
                  <p className="text-xs text-fumaca">
                    Bem-vindo, {user.username}. Tudo o que você publica aparece na hora no site.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPost(null);
                    setEditorOpen(true);
                  }}
                  className="btn btn-gold !py-2.5"
                >
                  <Plus className="h-4 w-4" />
                  Nova notícia
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={Newspaper} label="Notícias publicadas" value={published} />
                <StatCard icon={ShieldAlert} label="Rascunhos" value={drafts} accent="vermelho" />
                <StatCard icon={Images} label="Fotos na galeria" value={photos.length} />
                <StatCard icon={Activity} label="Visitas hoje" value={visitsToday} accent="vermelho" />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                <div className="border border-borda bg-carvao">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <h2 className="font-display text-lg uppercase tracking-wide text-white">
                      Últimas notícias
                    </h2>
                    <button
                      type="button"
                      onClick={() => setTab('noticias')}
                      className="text-[0.66rem] uppercase tracking-[0.16em] text-ouro/80 hover:text-ouro"
                    >
                      gerenciar
                    </button>
                  </div>
                  {loading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-xs text-fumaca">
                      <Loader2 className="h-4 w-4 animate-spin text-ouro" />
                      Carregando...
                    </div>
                  ) : posts.length === 0 ? (
                    <p className="px-4 py-10 text-center text-xs text-fumaca">
                      Nenhuma notícia criada ainda.
                    </p>
                  ) : (
                    <ul className="divide-y divide-white/5">
                      {posts.slice(0, 5).map((post) => (
                        <li key={post.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPost(post);
                              setEditorOpen(true);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
                          >
                            <div className="h-11 w-16 shrink-0 overflow-hidden border border-borda bg-grafite">
                              {post.coverImage && (
                                <img
                                  src={post.coverImage}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-white">{post.title}</p>
                              <p className="text-[0.62rem] uppercase tracking-[0.16em] text-fumaca-escura">
                                {post.category} · {formatDate(post.createdAt)}
                              </p>
                            </div>
                            <span
                              className={`h-2 w-2 shrink-0 rounded-full ${
                                post.published ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="border border-borda bg-carvao p-4">
                    <h2 className="font-display text-lg uppercase tracking-wide text-white">
                      Ações rápidas
                    </h2>
                    <div className="mt-3 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPost(null);
                          setEditorOpen(true);
                        }}
                        className="flex w-full items-center justify-between border border-borda px-3 py-2.5 text-left text-xs text-fumaca transition-colors hover:border-ouro/40 hover:text-ouro"
                      >
                        <span className="flex items-center gap-2">
                          <Newspaper className="h-4 w-4" />
                          Publicar notícia
                        </span>
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab('galeria')}
                        className="flex w-full items-center justify-between border border-borda px-3 py-2.5 text-left text-xs text-fumaca transition-colors hover:border-ouro/40 hover:text-ouro"
                      >
                        <span className="flex items-center gap-2">
                          <Images className="h-4 w-4" />
                          Enviar foto
                        </span>
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab('config')}
                        className="flex w-full items-center justify-between border border-borda px-3 py-2.5 text-left text-xs text-fumaca transition-colors hover:border-ouro/40 hover:text-ouro"
                      >
                        <span className="flex items-center gap-2">
                          <SettingsIcon className="h-4 w-4" />
                          Editar identidade do site
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="border border-borda bg-carvao p-4">
                    <h2 className="font-display text-lg uppercase tracking-wide text-white">
                      Últimos acessos
                    </h2>
                    {logs.length === 0 ? (
                      <p className="mt-2 text-[0.7rem] text-fumaca">
                        Nenhuma visita registrada ainda.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {logs.slice(0, 4).map((log) => (
                          <li
                            key={log.id}
                            className="flex items-center justify-between gap-2 text-[0.68rem] text-fumaca"
                          >
                            <span className="truncate">{log.path}</span>
                            <span className="shrink-0 text-fumaca-escura">
                              {relativeTime(log.timestamp)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'noticias' && (
            <PostsManager
              posts={posts}
              loading={loading}
              onReload={refreshPosts}
              onCreate={() => {
                setEditingPost(null);
                setEditorOpen(true);
              }}
              onEdit={(post) => {
                setEditingPost(post);
                setEditorOpen(true);
              }}
              onExpired={onExpire}
              notify={notify}
            />
          )}

          {tab === 'galeria' && (
            <PhotosManager
              photos={photos}
              loading={loading}
              onReload={refreshPhotos}
              onExpired={onExpire}
              notify={notify}
            />
          )}

          {tab === 'config' && (
            <SettingsManager
              settings={settings}
              onSaved={() => onPublicRefresh()}
              onExpired={onExpire}
              notify={notify}
            />
          )}

          {tab === 'acessos' && <LogsView onExpired={onExpire} notify={notify} />}
        </main>
      </div>

      <PostEditor
        open={editorOpen}
        post={editingPost}
        onClose={() => setEditorOpen(false)}
        onSaved={async () => {
          notify(editingPost ? 'Notícia atualizada.' : 'Notícia publicada.');
          await refreshPosts();
        }}
        onExpired={onExpire}
      />

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-xs flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-2 border px-3 py-2.5 text-xs shadow-lg backdrop-blur ${
              toast.type === 'ok'
                ? 'border-emerald-500/40 bg-[#0d1a14]/95 text-emerald-200'
                : 'border-vermelho/40 bg-[#1a0d0e]/95 text-[#ffd9da]'
            }`}
          >
            {toast.type === 'ok' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
