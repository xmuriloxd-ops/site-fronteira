import { ArrowUpRight, Instagram, Lock, Mail, MessageCircle, Zap } from 'lucide-react';
import { Link } from '../lib/router';
import type { Settings } from '../types';
import { Crest } from './ui';

export function SiteFooter({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10 bg-[#080707]">
      <div className="hazard h-1 w-full opacity-80" />

      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <Crest className="h-14 w-auto" />
            <div className="leading-none">
              <div className="display text-2xl tracking-[0.05em] text-white">
                {settings.siteName || 'ROTAM GOIÁS'}
              </div>
              <div className="mt-1.5 font-display text-[0.6rem] uppercase tracking-[0.28em] text-fumaca-escura">
                {settings.server}
              </div>
            </div>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-fumaca">
            Portal oficial de comunicação do Batalhão de Rondas Ostensivas Táticas Metropolitanas no
            servidor de roleplay. Notícias, operações e registros da tropa.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {settings.instagram && (
              <a
                href={settings.instagram}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center border border-borda text-fumaca transition-colors hover:border-ouro hover:text-ouro"
              >
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {settings.discord && (
              <a
                href={settings.discord}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Discord"
                className="flex h-9 w-9 items-center justify-center border border-borda text-fumaca transition-colors hover:border-ouro hover:text-ouro"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            )}
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                aria-label="E-mail"
                className="flex h-9 w-9 items-center justify-center border border-borda text-fumaca transition-colors hover:border-ouro hover:text-ouro"
              >
                <Mail className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-4 flex items-center gap-2 font-display text-sm uppercase tracking-[0.24em] text-ouro">
            <Zap className="h-3 w-3 fill-current" />
            Navegação
          </h3>
          <ul className="space-y-2.5 text-sm">
            {[
              ['Início', '/'],
              ['Notícias', '/noticias'],
              ['Galeria', '/galeria'],
              ['Sobre a unidade', '/sobre'],
              ['Área restrita', '/admin'],
            ].map(([label, href]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group inline-flex items-center gap-1.5 text-fumaca transition-colors hover:text-ouro"
                >
                  {label}
                  <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 flex items-center gap-2 font-display text-sm uppercase tracking-[0.24em] text-ouro">
            <Zap className="h-3 w-3 fill-current" />
            Unidade
          </h3>
          <p className="text-sm leading-relaxed text-fumaca">{settings.unit}</p>
          <div className="mt-4 space-y-1.5 text-[0.72rem] uppercase tracking-[0.18em] text-fumaca-escura">
            <p>Doutrina desde {settings.foundedYear || '1981'}</p>
            <p>Goiânia · Goiás</p>
            <p>Patrulhamento 24 horas</p>
          </div>
          <Link href="/admin" className="btn btn-outline mt-5 !px-3 !py-2 !text-[0.7rem]">
            <Lock className="h-3 w-3" />
            Painel do administrador
          </Link>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-[0.66rem] uppercase tracking-[0.18em] text-fumaca-escura sm:flex-row">
          <p>
            © {year} {settings.siteName || 'ROTAM GOIÁS'} · {settings.server}
          </p>
          <p className="text-center normal-case tracking-normal">
            Portal de roleplay — sem vínculo oficial com a PMGO.
          </p>
        </div>
      </div>
    </footer>
  );
}
