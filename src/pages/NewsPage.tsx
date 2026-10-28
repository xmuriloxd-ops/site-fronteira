import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Post } from '../types';
import { NewsCard } from '../components/NewsCard';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/ui';

export function NewsPage({ posts }: { posts: Post[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');

  const categories = useMemo(
    () => ['Todas', ...Array.from(new Set(posts.map((post) => post.category)))],
    [posts],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = category === 'Todas' || post.category === category;
      const matchesTerm =
        !term ||
        post.title.toLowerCase().includes(term) ||
        post.excerpt.toLowerCase().includes(term) ||
        post.content.toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
  }, [posts, query, category]);

  return (
    <>
      <PageHero
        kicker="Sala de imprensa"
        title={
          <>
            Notícias da <span className="gold-text">tropa</span>
          </>
        }
        description="Todas as publicações oficiais do Batalhão ROTAM no servidor: operações, cursos, formaturas e comunicados internos."
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`tag border transition-all ${
                  category === item
                    ? 'border-ouro bg-ouro text-preto'
                    : 'border-borda bg-carvao text-fumaca hover:border-ouro/40 hover:text-ouro'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fumaca-escura" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar notícia..."
              className="field !py-2.5 pl-9 pr-9"
              aria-label="Buscar notícia"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-fumaca-escura hover:text-ouro"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </PageHero>

      <section className="py-14">
        <div className="container-page">
          <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fumaca-escura">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {filtered.length} {filtered.length === 1 ? 'publicação' : 'publicações'}
            {category !== 'Todas' && <span className="text-ouro">· {category}</span>}
          </div>

          {filtered.length === 0 ? (
            <div className="border border-dashed border-borda bg-carvao/40 px-6 py-20 text-center">
              <p className="font-display text-2xl uppercase tracking-wide text-white">
                Nada encontrado
              </p>
              <p className="mt-2 text-sm text-fumaca">
                Tente outro termo de busca ou selecione uma categoria diferente.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((post, index) => (
                <Reveal key={post.id} delay={Math.min(index, 5) * 70}>
                  <NewsCard post={post} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
