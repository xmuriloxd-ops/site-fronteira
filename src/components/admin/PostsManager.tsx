import { useMemo, useState } from 'react';
import {
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { formatDate } from '../../lib/format';
import type { Post } from '../../types';

export function PostsManager({
  posts,
  loading,
  onReload,
  onCreate,
  onEdit,
  onExpired,
  notify,
}: {
  posts: Post[];
  loading: boolean;
  onReload: () => void;
  onCreate: () => void;
  onEdit: (post: Post) => void;
  onExpired: () => void;
  notify: (message: string, type?: 'ok' | 'err') => void;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'todos' | 'publicados' | 'rascunhos'>('todos');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchTerm =
        !term ||
        post.title.toLowerCase().includes(term) ||
        post.category.toLowerCase().includes(term);
      const matchStatus =
        status === 'todos' ||
        (status === 'publicados' && post.published) ||
        (status === 'rascunhos' && !post.published);
      return matchTerm && matchStatus;
    });
  }, [posts, query, status]);

  const handleError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) return onExpired();
    notify(error instanceof ApiError ? error.message : 'Falha na operação.', 'err');
  };

  const togglePublished = async (post: Post) => {
    setBusyId(post.id);
    try {
      await api.updatePost(post.id, { published: !post.published });
      notify(post.published ? 'Notícia despublicada.' : 'Notícia publicada no site.');
      onReload();
    } catch (error) {
      handleError(error);
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = async (post: Post) => {
    setBusyId(post.id);
    try {
      await api.updatePost(post.id, { featured: !post.featured });
      notify(post.featured ? 'Destaque removido.' : 'Notícia marcada como destaque.');
      onReload();
    } catch (error) {
      handleError(error);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (post: Post) => {
    if (!window.confirm(`Excluir definitivamente "${post.title}"?`)) return;
    setBusyId(post.id);
    try {
      await api.deletePost(post.id);
      notify('Notícia excluída.');
      onReload();
    } catch (error) {
      handleError(error);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl uppercase tracking-wide text-white">Notícias</h2>
          <p className="text-xs text-fumaca">
            {posts.length} publicações · {posts.filter((post) => !post.published).length} rascunho(s)
          </p>
        </div>
        <button type="button" onClick={onCreate} className="btn btn-gold !py-2.5">
          <Plus className="h-4 w-4" />
          Nova notícia
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fumaca-escura" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título ou categoria..."
            className="field pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['todos', 'publicados', 'rascunhos'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`tag border capitalize ${
                status === item
                  ? 'border-ouro bg-ouro text-preto'
                  : 'border-borda bg-carvao text-fumaca hover:text-ouro'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 border border-borda bg-carvao py-16 text-sm text-fumaca">
          <Loader2 className="h-5 w-5 animate-spin text-ouro" />
          Carregando publicações...
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-borda bg-carvao/40 px-6 py-16 text-center">
          <p className="font-display text-xl uppercase tracking-wide text-white">
            Nenhuma notícia encontrada
          </p>
          <p className="mt-1 text-sm text-fumaca">Crie a primeira publicação do portal.</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5 border border-borda bg-carvao">
          {filtered.map((post) => (
            <div key={post.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="h-16 w-24 shrink-0 overflow-hidden border border-borda bg-grafite">
                {post.coverImage ? (
                  <img src={post.coverImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg text-ouro/30">
                    ⚡
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-[0.62rem] uppercase tracking-[0.16em]">
                  <span className="text-ouro">{post.category}</span>
                  <span className="h-1 w-1 rotate-45 bg-fumaca-escura" />
                  <span className="text-fumaca-escura">{formatDate(post.createdAt)}</span>
                  <span
                    className={`tag border ${
                      post.published
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {post.published ? 'publicado' : 'rascunho'}
                  </span>
                  {post.featured && (
                    <span className="tag border border-ouro/40 bg-ouro/10 text-ouro">destaque</span>
                  )}
                </div>
                <h3 className="truncate font-display text-lg text-white">{post.title}</h3>
                <p className="truncate text-xs text-fumaca">{post.excerpt}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleFeatured(post)}
                  disabled={busyId === post.id}
                  title={post.featured ? 'Remover destaque' : 'Marcar como destaque'}
                  className={`btn btn-ghost !p-2 ${post.featured ? '!text-ouro' : ''}`}
                >
                  <Star className={`h-4 w-4 ${post.featured ? 'fill-ouro' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => togglePublished(post)}
                  disabled={busyId === post.id}
                  title={post.published ? 'Despublicar' : 'Publicar'}
                  className="btn btn-ghost !p-2"
                >
                  {busyId === post.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : post.published ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(post)}
                  title="Editar"
                  className="btn btn-ghost !p-2"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(post)}
                  disabled={busyId === post.id}
                  title="Excluir"
                  className="btn btn-ghost !p-2 hover:!text-vermelho"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
