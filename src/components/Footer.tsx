import React from 'react';
import type { PageId, SiteConfig } from '../lib/config';
import { Crest } from './Crest';

export function Footer({ config, onNavigate }: { config: SiteConfig; onNavigate: (p: PageId) => void }) {
  return (
    <footer className="no-print mt-16 border-t border-white/10 bg-black/40">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Crest className="h-12 w-10" />
            <div>
              <p className="font-display text-xl font-extrabold tracking-[0.18em]">{config.sigla}</p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--c-gold)]">{config.unidade}</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--c-paper)]/55">{config.slogan}</p>
        </div>

        <div>
          <h4 className="text-[10px] uppercase tracking-[0.3em] text-[var(--c-gold)]">Navegação</h4>
          <ul className="mt-4 space-y-2 text-sm text-[var(--c-paper)]/65">
            {(
              [
                ['inicio', 'Início'],
                ['edital', 'Edital de ingresso'],
                ['galeria', 'Fotos e logos'],
                ['identidade', 'Cores do site'],
                ['jogo', 'Jogo Operação RONE'],
              ] as [PageId, string][]
            ).map(([id, label]) => (
              <li key={id}>
                <button onClick={() => onNavigate(id)} className="transition hover:text-[var(--c-gold)]">
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] uppercase tracking-[0.3em] text-[var(--c-gold)]">Contato</h4>
          <ul className="mt-4 space-y-2 text-sm text-[var(--c-paper)]/65">
            <li>{config.cidade}</li>
            <li>Central de concursos: (41) 0000-0000</li>
            <li>imprensa.rone@exemplo.pr.gov.br</li>
            <li className="pt-2">
              <a
                href={config.edital.link}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[var(--c-gold)] underline decoration-dotted underline-offset-4"
              >
                Portal oficial de concursos
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-[11px] leading-relaxed text-[var(--c-paper)]/40 sm:px-6">
        <p>
          Site demonstrativo criado para fins de divulgação e estudo. Não é uma página oficial do Governo do
          Estado do Paraná nem da Polícia Militar do Paraná. Brasões, cores e dados do edital são editáveis e
          devem ser validados junto aos canais oficiais.
        </p>
        <p className="mt-2">© {new Date().getFullYear()} Projeto RONE · Edital de Ingresso</p>
      </div>
    </footer>
  );
}
