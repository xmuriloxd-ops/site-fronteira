import React, { useEffect, useState } from 'react';
import { Menu, X, Shield, ArrowUpRight } from 'lucide-react';
import type { PageId, SiteConfig } from '../lib/config';
import { Crest } from './Crest';

const NAV: { id: PageId; label: string }[] = [
  { id: 'inicio', label: 'Início' },
  { id: 'edital', label: 'Edital' },
  { id: 'galeria', label: 'Fotos & Logos' },
  { id: 'identidade', label: 'Cores' },
  { id: 'jogo', label: 'Jogo' },
];

interface HeaderProps {
  page: PageId;
  config: SiteConfig;
  onNavigate: (p: PageId) => void;
}

export function SiteHeader({ page, config, onNavigate }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (p: PageId) => {
    onNavigate(p);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className={`no-print sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-white/15 bg-[var(--c-ink)]/92 backdrop-blur-xl'
          : 'border-transparent bg-[var(--c-ink)]/70 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-[74px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <button onClick={() => go('inicio')} className="flex items-center gap-3 text-left">
          {config.logoDataUrl ? (
            <img
              src={config.logoDataUrl}
              alt={`Logo ${config.sigla}`}
              className="h-11 w-11 rounded-sm object-contain"
            />
          ) : (
            <Crest className="h-11 w-9" />
          )}
          <div className="leading-none">
            <div className="font-display text-[22px] font-extrabold tracking-[0.18em]">{config.sigla}</div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.26em] text-[var(--c-gold)]">
              Polícia Militar · PR
            </div>
          </div>
        </button>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              className={`relative px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                page === item.id ? 'text-[var(--c-gold)]' : 'text-[var(--c-paper)]/65 hover:text-[var(--c-paper)]'
              }`}
            >
              {item.label}
              {page === item.id && (
                <span className="absolute inset-x-2 -bottom-[1px] h-[2px] bg-[var(--c-gold)]" />
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => go('edital')}
            className="clip-btn hidden items-center gap-2 bg-[var(--c-gold)] px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-black transition hover:brightness-110 sm:inline-flex"
          >
            <Shield className="h-3.5 w-3.5" /> Quero ingressar
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center border border-white/20 lg:hidden"
            aria-label="Abrir menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[var(--c-ink)] lg:hidden">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              className={`flex w-full items-center justify-between border-b border-white/5 px-5 py-3.5 text-left text-xs uppercase tracking-[0.2em] ${
                page === item.id ? 'text-[var(--c-gold)]' : 'text-[var(--c-paper)]/75'
              }`}
            >
              {item.label}
              <ArrowUpRight className="h-4 w-4 opacity-50" />
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
