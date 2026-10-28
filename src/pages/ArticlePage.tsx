import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Check, Clock, Copy, MapPin, User } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { formatDate, initials, readingTime } from '../lib/format';
import { renderMarkdown } from '../lib/markdown';
import { Link, navigate } from '../lib/router';
import type { Post } from '../types';
import { NewsCard } from '../components/NewsCard';
import { Crest, Reveal, Spinner } from '../components/ui';

export function ArticlePage({ slug }: { slug: string }) {
  const [state, setState] = useState<{
    loading: boolean;
    post: Post | null;
    related: Post[];
    error: string | null;
  }>({ loading: true, post: null, related: [], error: null });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setState({ loading: true, post: null, related: [], error: null });
    api
      .post(slug)
      .then((data) => {
        if (active) setState({ loading: false, post: data.post, related: data.related, error: null });
      })
      .catch((error) => {
        if (!active) return;
        const message =
          error instanceof ApiError && error.status === 404
            ? 'Esta notícia não existe ou foi removida.'
            : 'Não foi possível carregar a notícia.';
        setState({ loading: false, post: null, related: [], error: message });
      });
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [slug]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  if (state.loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 pt-24 text-fumaca">
        <Spinner className="h-7 w-7 text-ouro" />
        <p className="font-display text-sm uppercase tracking-[0.25em]">Carregando notícia</p>
      </div>
    );
  }

  if (state.error || !state.post) {
    return (
      <div className="container-page flex min-h-[70vh] flex-col items-center justify-center pt-24 text-center">
        <Crest className="mb-6 h-28 w-auto opacity-70" />
        <h1 className="display text-4xl text-white">Registro não localizado</h1>
        <p className="mt-3 max-w-md text-sm text-fumaca">{state.error}</p>
        <div className="mt-7 flex gap-3">
          <button type="button" onClick={() => navigate('/noticias')} className="btn btn-gold">
            <ArrowLeft className="h-4 w-4" />
            Voltar às notícias
          </button>
          <Link href="/" className="btn btn-outline">
            Página inicial
          </Link>
        </div>
      </div>
    );
  }

  const { post, related } = state;

  return (
    <>
      <article className="pb-16 pt-32">
        <div className="container-page">
          <nav className="mb-7 flex flex-wrap items-center gap-2 text-[0.7rem] uppercase tracking-[0.18em] text-fumaca-escura">
            <Link href="/" className="transition-colors hover:text-ouro">
              Início
            </Link>
            <span className="text-vermelho">/</span>
            <Link href="/noticias" className="transition-colors hover:text-ouro">
              Notícias
            </Link>
            <span className="text-vermelho">/</span>
            <span className="text-ouro">{post.category}</span>
          </nav>

          <header className="max-w-4xl">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="tag bg-ouro text-preto">{post.category}</span>
              {post.featured && (
                <span className="tag border border-vermelho/60 bg-vermelho/10 text-white">
                  Matéria de destaque
                </span>
              )}
            </div>

            <h1 className="display text-[clamp(2.2rem,5.2vw,4.1rem)] text-white text-balance">
              {post.title}
            </h1>

            <p className="mt-5 max-w-3xl text-[1.05rem] leading-relaxed text-[#cfc7c4]">
              {post.excerpt}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-white/10 py-4 text-[0.72rem] uppercase tracking-[0.16em] text-fumaca">
              <span className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center border border-ouro/40 bg-ouro/10 font-display text-[0.7rem] text-ouro">
                  {initials(post.author)}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-[0.6rem] text-fumaca-escura">Por</span>
                  <span className="normal-case tracking-normal text-white">{post.author}</span>
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-ouro" />
                {formatDate(post.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-ouro" />
                {readingTime(post.content)} min de leitura
              </span>
              {post.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-ouro" />
                  {post.location}
                </span>
              )}
              <button
                type="button"
                onClick={copyLink}
                className="ml-auto flex items-center gap-1.5 border border-borda px-2.5 py-1.5 text-[0.65rem] transition-colors hover:border-ouro/50 hover:text-ouro"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Link copiado' : 'Copiar link'}
              </button>
            </div>
          </header>

          {post.coverImage && (
            <Reveal className="relative mt-9">
              <div className="absolute -left-2 -top-2 hidden h-full w-full border border-ouro/25 lg:block" />
              <div className="relative overflow-hidden border border-borda bg-grafite">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="max-h-[34rem] w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <p className="mt-2 text-[0.66rem] uppercase tracking-[0.18em] text-fumaca-escura">
                Imagem: Assessoria de Comunicação · ROTAM
              </p>
            </Reveal>
          )}

          <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="prose-rotam max-w-3xl">{renderMarkdown(post.content)}</div>

            <aside className="space-y-6">
              <div className="border border-borda bg-carvao p-5">
                <div className="mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-ouro" />
                  <span className="label">Ficha da publicação</span>
                </div>
                <dl className="space-y-3 text-xs">
                  {[
                    ['Categoria', post.category],
                    ['Autor', post.author],
                    ['Publicado em', formatDate(post.createdAt)],
                    ['Atualizado em', formatDate(post.updatedAt)],
                    ['Local', post.location || 'Goiânia · GO'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-fumaca-escura">
                        {label}
                      </dt>
                      <dd className="mt-0.5 text-[0.82rem] text-white">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="relative overflow-hidden border border-ouro/25 bg-gradient-to-br from-[#171213] to-[#0d0b0b] p-5">
                <div className="hazard-thin absolute inset-x-0 top-0 h-1 opacity-70" />
                <div className="flex items-center gap-3">
                  <Crest className="h-12 w-auto" />
                  <p className="font-display text-lg uppercase leading-tight tracking-wide text-white">
                    Raio <span className="text-ouro">Imortal</span>
                  </p>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-fumaca">
                  Conteúdo produzido pela equipe de comunicação do Batalhão ROTAM no servidor de
                  roleplay. Acompanhe as operações e cursos da unidade.
                </p>
                <Link href="/noticias" className="btn btn-outline mt-4 w-full !py-2 !text-[0.72rem]">
                  Ver mais notícias
                </Link>
              </div>
            </aside>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-white/10 pt-8">
            <button type="button" onClick={() => navigate('/noticias')} className="btn btn-outline">
              <ArrowLeft className="h-4 w-4" />
              Todas as notícias
            </button>
            <Link href="/" className="btn btn-ghost">
              Página inicial
            </Link>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-white/5 bg-[#0c0a0a] py-16">
          <div className="container-page">
            <div className="mb-8 flex items-center gap-3">
              <span className="h-px w-8 bg-vermelho" />
              <span className="label">Continue lendo</span>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item, index) => (
                <Reveal key={item.id} delay={index * 80}>
                  <NewsCard post={item} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
