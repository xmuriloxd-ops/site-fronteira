import { useEffect, useState } from 'react';
import { Instagram, Lock, Mail, Menu, X } from 'lucide-react';
import { Link, usePathname } from '../lib/router';
import type { Settings } from '../types';
import { Crest } from './ui';

const NAV = [
  { label: 'Início', href: '/' },
  { label: 'Notícias', href: '/noticias' },
  { label: 'Galeria', href: '/galeria' },
  { label: 'Sobre', href: '/sobre' },
];

export function SiteHeader({ settings }: { settings: Settings }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Faixa institucional */}
      <div className="hidden border-b border-white/5 bg-[#080707] md:block">
        <div className="container-page flex h-9 items-center justify-between text-[0.66rem] uppercase tracking-[0.22em] text-fumaca-escura">
          <span className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rotate-45 bg-vermelho" />
            Polícia Militar · Servidor de roleplay
          </span>
          <div className="flex items-center gap-5">
            <span className="hidden lg:inline">{settings.unit}</span>
            {settings.instagram && (
              <a
                href={settings.instagram}
                target="_blank"
                rel="noreferrer noopener"
                className="transition-colors hover:text-ouro"
                aria-label="Instagram"
              >
                <Instagram className="h-3.5 w-3.5" />
              </a>
            )}
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="flex items-center gap-1.5 transition-colors hover:text-ouro"
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">{settings.email}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="hazard h-1 w-full" />

      <div
        className={`transition-all duration-300 ${
          scrolled || open
            ? 'border-b border-white/10 bg-[#0a0909]/92 backdrop-blur-xl'
            : 'bg-gradient-to-b from-black/70 to-transparent'
        }`}
      >
        <div className="container-page flex h-[68px] items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3">
            <Crest className="h-11 w-auto drop-shadow-[0_4px_18px_rgba(254,213,0,0.25)] transition-transform duration-300 group-hover:scale-[1.04]" />
            <div className="leading-none">
              <div className="display text-[1.35rem] tracking-[0.06em] text-white">
                ROTAM<span className="text-ouro">.</span>
              </div>
              <div className="mt-1 font-display text-[0.6rem] uppercase tracking-[0.3em] text-fumaca-escura">
                Goiás · GTA RP
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 font-display text-[0.95rem] uppercase tracking-[0.16em] transition-colors ${
                  isActive(item.href) ? 'text-ouro' : 'text-fumaca hover:text-white'
                }`}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute inset-x-4 -bottom-0.5 h-0.5 bg-vermelho" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/admin" className="btn btn-outline hidden !px-4 !py-2.5 !text-[0.8rem] sm:inline-flex">
              <Lock className="h-3.5 w-3.5" />
              Área restrita
            </Link>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="btn btn-ghost !p-2.5 lg:hidden"
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={open}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        className={`fixed inset-x-0 top-[72px] bottom-0 z-40 overflow-y-auto bg-[#0a0909]/98 backdrop-blur-xl transition-all duration-300 lg:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="container-page flex flex-col py-6">
          {NAV.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between border-b border-white/5 py-4 font-display text-2xl uppercase tracking-[0.1em] text-white transition-colors hover:text-ouro"
            >
              {item.label}
              <span className="font-sans text-xs tracking-normal text-fumaca-escura">
                0{index + 1}
              </span>
            </Link>
          ))}
          <Link href="/admin" className="btn btn-gold mt-6 w-full">
            <Lock className="h-4 w-4" />
            Área restrita · administrador
          </Link>
          <div className="mt-8 flex items-center gap-3 text-sm text-fumaca-escura">
            <Crest className="h-12 w-auto opacity-80" />
            <p>
              {settings.unit}
              <br />
              <span className="text-xs uppercase tracking-[0.2em]">{settings.server}</span>
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
