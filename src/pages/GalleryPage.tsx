import { useCallback, useEffect, useMemo, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, Images, X } from 'lucide-react';
import type { Photo } from '../types';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/ui';
import { formatDate } from '../lib/format';

export function GalleryPage({ photos }: { photos: Photo[] }) {
  const [tag, setTag] = useState('Todas');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const tags = useMemo(
    () => ['Todas', ...Array.from(new Set(photos.map((photo) => photo.tag)))],
    [photos],
  );

  const filtered = useMemo(
    () => (tag === 'Todas' ? photos : photos.filter((photo) => photo.tag === tag)),
    [photos, tag],
  );

  const close = useCallback(() => setActiveIndex(null), []);
  const step = useCallback(
    (direction: number) => {
      setActiveIndex((current) => {
        if (current === null || filtered.length === 0) return current;
        return (current + direction + filtered.length) % filtered.length;
      });
    },
    [filtered.length],
  );

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [activeIndex, close, step]);

  const active = activeIndex !== null ? filtered[activeIndex] : null;

  return (
    <>
      <PageHero
        kicker="Acervo fotográfico"
        title={
          <>
            Registros da <span className="gold-text">tropa</span>
          </>
        }
        description="Instruções, patrulhamentos e cerimônias. Todo o acervo é produzido pela equipe de comunicação do batalhão."
      >
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setTag(item);
                setActiveIndex(null);
              }}
              className={`tag border transition-all ${
                tag === item
                  ? 'border-ouro bg-ouro text-preto'
                  : 'border-borda bg-carvao text-fumaca hover:border-ouro/40 hover:text-ouro'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </PageHero>

      <section className="py-14">
        <div className="container-page">
          <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fumaca-escura">
            <Images className="h-3.5 w-3.5" />
            {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 border border-dashed border-borda bg-carvao/40 px-6 py-20 text-center">
              <Camera className="h-8 w-8 text-ouro/40" />
              <p className="font-display text-2xl uppercase tracking-wide text-white">
                Galeria vazia
              </p>
              <p className="text-sm text-fumaca">Nenhuma foto publicada nesta categoria.</p>
            </div>
          ) : (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {filtered.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="group relative mb-4 block w-full break-inside-avoid overflow-hidden border border-borda bg-grafite text-left"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70 transition-opacity group-hover:opacity-95" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <span className="tag bg-ouro/90 text-preto">{photo.tag}</span>
                    <p className="mt-2 text-sm leading-snug text-white/95">{photo.caption}</p>
                    <p className="mt-1 text-[0.62rem] uppercase tracking-[0.18em] text-fumaca-escura">
                      {photo.author} · {formatDate(photo.createdAt)}
                    </p>
                  </div>
                  <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center border border-white/25 bg-black/40 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                    <Images className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Visualizar imagem"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center border border-white/20 text-white transition-colors hover:border-ouro hover:text-ouro"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              step(-1);
            }}
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/20 text-white transition-colors hover:border-ouro hover:text-ouro sm:left-8"
            aria-label="Imagem anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <figure
            className="max-h-[88vh] w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={active.url}
              alt={active.caption}
              className="mx-auto max-h-[74vh] w-auto border border-white/10 object-contain"
            />
            <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
              <div>
                <p className="text-sm text-white">{active.caption}</p>
                <p className="mt-1 text-[0.64rem] uppercase tracking-[0.2em] text-fumaca-escura">
                  {active.tag} · {active.author} · {formatDate(active.createdAt)}
                </p>
              </div>
              <span className="font-display text-xs uppercase tracking-[0.25em] text-fumaca-escura">
                {(activeIndex ?? 0) + 1} / {filtered.length}
              </span>
            </figcaption>
          </figure>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              step(1);
            }}
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/20 text-white transition-colors hover:border-ouro hover:text-ouro sm:right-8"
            aria-label="Próxima imagem"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
}
