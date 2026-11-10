import { ShieldCheck } from 'lucide-react';
import { Brasao } from './ui';

/**
 * Abertura do portal.
 * Sem atalhos: os formulários são acessados apenas pelas abas do topo.
 */
export function Hero() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-green" />
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="hero-stripes absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-pmpr-gold/10 blur-3xl animate-slow-pulse" />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="animate-fade-up">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-pmpr-gold/70" />
              <p className="eyebrow text-pmpr-gold">Corporação desde 1854</p>
            </div>

            <h1 className="display-title mt-5 text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              Portal de Inscrições
              <br />
              <span className="gold-text">Polícia Militar</span>
              <br />
              do Paraná
            </h1>
          </div>

          {/* Cartão do brasão */}
          <div className="relative animate-fade-up" style={{ animationDelay: '120ms' }}>
            <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border border-pmpr-gold/20 bg-gradient-to-b from-ink-800/90 to-ink-950 p-8 text-center backdrop-blur">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-pmpr-gold to-transparent" />
              <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-pmpr-gold/10 blur-2xl" />
                <Brasao size={150} className="relative" />
              </div>
              <p className="font-display mt-4 text-lg font-bold uppercase tracking-[0.12em] text-white">
                Polícia Militar do Paraná
              </p>
              <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-pmpr-gold/80">
                Sua proteção é nosso compromisso
              </p>
              <div className="gold-rule my-5" />
              <div className="flex items-center justify-center gap-2 text-[0.7rem] text-emerald-100/50">
                <ShieldCheck size={13} className="text-emerald-400" />
                Inscrições recebidas pelo comando
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
