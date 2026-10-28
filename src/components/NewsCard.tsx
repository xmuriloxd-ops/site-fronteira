import { ArrowUpRight, Clock, MapPin } from 'lucide-react';
import { Link } from '../lib/router';
import { formatDate, readingTime } from '../lib/format';
import type { Post } from '../types';
import { CategoryBadge } from './ui';

 export function NewsCard({ post, variant = 'default' }: { post: Post; variant?: 'default' | 'featured' | 'row' }) {
  const href = `/noticias/${post.slug}`;

  if (variant === 'row') {
    return (
      <Link
        href={href}
        className="group flex items-start gap-4 border-b border-white/5 py-4 first:pt-4 last:border-0 last:pb-0"
      >
        <div className="relative h-20 w-28 shrink-0 overflow-hidden bg-grafite">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ouro/30">⚡</div>
          )}
        </div>
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.16em] text-fumaca-escura">
            <span className="text-vermelho">{post.category}</span>
            <span className="h-1 w-1 rotate-45 bg-fumaca-escura" />
            <span>{formatDate(post.createdAt)}</span>
          </div>
          <h3 className="font-display text-lg leading-tight text-white transition-colors group-hover:text-ouro">
            {post.title}
          </h3>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link
        href={href}
        className="group card-hover relative flex min-h-[26rem] flex-col justify-end overflow-hidden border border-borda bg-carvao md:min-h-[32rem]"
      >
        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080707] via-[#080707]/80 to-[#080707]/10" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
          <CategoryBadge category={post.category} solid />
          {post.featured && (
            <span className="tag border border-vermelho/50 bg-vermelho/15 text-white backdrop-blur">
              Destaque
            </span>
          )}
        </div>
        <div className="relative p-5 sm:p-7">
          <div className="mb-3 flex flex-wrap items-center gap-4 text-[0.7rem] uppercase tracking-[0.18em] text-fumaca">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-ouro" />
              {formatDate(post.createdAt)}
            </span>
            {post.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-ouro" />
                {post.location}
              </span>
            )}
            <span>{readingTime(post.content)} min de leitura</span>
          </div>
          <h3 className="display max-w-2xl text-[2rem] leading-[1.02] text-white transition-colors group-hover:text-ouro-claro sm:text-[2.6rem]">
            {post.title}
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#c9c1be] line-clamp-2">
            {post.excerpt}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 font-display text-xs uppercase tracking-[0.24em] text-ouro">
            Ler notícia
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group card-hover flex flex-col overflow-hidden border border-borda bg-carvao"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-grafite">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.07]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-grafite text-4xl text-ouro/20">
            ⚡
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0909]/80 via-transparent to-transparent opacity-70" />
        <div className="absolute left-4 top-4">
          <CategoryBadge category={post.category} solid />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.18em] text-fumaca-escura">
          <span>{formatDate(post.createdAt)}</span>
          <span className="h-1 w-1 rotate-45 bg-vermelho" />
          <span>{readingTime(post.content)} min</span>
        </div>
        <h3 className="font-display text-[1.35rem] leading-[1.15] text-white transition-colors group-hover:text-ouro">
          {post.title}
        </h3>
        <p className="mt-2.5 text-sm leading-relaxed text-fumaca line-clamp-3">{post.excerpt}</p>
        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="font-display text-[0.7rem] uppercase tracking-[0.22em] text-ouro/80">
            Ler notícia
          </span>
          <ArrowUpRight className="h-4 w-4 text-ouro transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
