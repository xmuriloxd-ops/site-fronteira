import { Phone, MapPin, ShieldCheck } from 'lucide-react';
import { Brasao } from './ui';

export function Footer({ onAdminClick }: { onAdminClick: () => void }) {
  const ano = new Date().getFullYear();

  return (
    <footer className="relative mt-8 border-t border-pmpr-gold/15 bg-ink-950">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pmpr-gold/60 to-transparent" />

      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <Brasao size={52} />
              <div>
                <p className="font-display text-base font-bold uppercase tracking-wide text-white">
                  Polícia Militar do Paraná
                </p>
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-pmpr-gold/70">
                  Sua proteção é nosso compromisso
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-[0.8rem] leading-relaxed text-emerald-50/45">
              Portal de inscrições das seleções da PMPR, do ROTAM e da RONE. Os formulários são recebidos
              diretamente pelo comando e não substituem as publicações oficiais da corporação.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-emerald-500/25 bg-emerald-500/[0.06] px-2.5 py-1.5 text-[0.7rem] font-semibold text-emerald-300">
              <ShieldCheck size={11} />
              Inscrições recebidas pelo comando
            </p>
          </div>

          <div>
            <p className="eyebrow text-pmpr-gold/70">Navegar</p>
            <ul className="mt-3 space-y-2">
              {[
                ['Formulários ROTAM e RONE', '#fichas-unidade'],
                ['Recrutamento 13º BPM', '#recrutamento'],
                ['Unidades', '#unidades'],
                ['Discord', '#discord'],
              ].map(([label, href]) => (
                <li key={href}>
                  <a href={href} className="text-[0.8rem] text-emerald-50/55 transition hover:text-pmpr-gold">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow text-pmpr-gold/70">Emergências</p>
            <ul className="mt-3 space-y-2 text-[0.8rem] text-emerald-50/55">
              <li className="flex items-center gap-2">
                <Phone size={12} className="text-pmpr-gold/70" />
                Polícia Militar: <strong className="text-white">190</strong>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={12} className="text-pmpr-gold/70" />
                Disque-denúncia: <strong className="text-white">181</strong>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={12} className="mt-0.5 text-pmpr-gold/70" />
                <span>
                  Comando-Geral
                  <br />
                  Curitiba — Paraná
                </span>
              </li>
            </ul>
            <button
              onClick={onAdminClick}
              className="mt-4 rounded-md border border-pmpr-gold/25 px-3 py-1.5 text-[0.72rem] font-semibold text-pmpr-gold/80 transition hover:bg-pmpr-gold/10"
            >
              Aba do Comando
            </button>
          </div>
        </div>

        <div className="gold-rule my-8" />

        <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
          <p className="text-[0.7rem] text-emerald-100/30">
            © {ano} Portal de Inscrições PMPR · Projeto demonstrativo, sem vínculo oficial com a corporação.
          </p>
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-emerald-100/25">
            ROTAM · RONE · PMPR
          </p>
        </div>
      </div>
    </footer>
  );
}
