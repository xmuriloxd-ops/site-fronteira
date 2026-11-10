import { ArrowRight, BadgeCheck, CalendarDays, MapPin, Users } from 'lucide-react';
import type { Edital } from '../types';
import { Brasao, StatusBadge, TOM_COLORS } from './ui';

export function Hero({
  editais,
  onAbrir,
  onLerDocumento,
}: {
  editais: Edital[];
  onAbrir: (id: string) => void;
  onLerDocumento: (id: string) => void;
}) {
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

            <h1 className="display-title mt-5 text-[2.6rem] text-white sm:text-6xl lg:text-[4.1rem]">
              Portal de Editais
              <br />
              <span className="gold-text">Polícia Militar</span>
              <br />
              do Paraná
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-relaxed text-emerald-50/65 sm:text-base">
              Acompanhe as seleções da <strong className="font-semibold text-white">PMPR</strong>, do{' '}
              <strong className="font-semibold text-pmpr-gold-soft">ROTAM</strong> e da{' '}
              <strong className="font-semibold text-slate-200">RONE</strong> em um só lugar. Requisitos, etapas,
              cronograma, provas anteriores e envio automático dos editais para o Discord da tropa.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={() => onLerDocumento('pmpr-soldado')} className="btn-gold text-sm">
                Ler edital do Soldado
                <ArrowRight size={16} />
              </button>
              <a href="#editais" className="btn-ghost text-sm">
                Os três editais
              </a>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
              {[
                { Icon: Users, valor: '2.141', label: 'Vagas somadas' },
                { Icon: CalendarDays, valor: '2026/27', label: 'Ciclo de seleções' },
                { Icon: MapPin, valor: '399', label: 'Municípios do PR' },
              ].map(({ Icon, valor, label }) => (
                <div key={label} className="rounded-lg border border-pmpr-gold/12 bg-black/25 px-3 py-3">
                  <Icon size={15} className="text-pmpr-gold/80" />
                  <p className="font-display mt-2 text-xl font-bold text-white">{valor}</p>
                  <p className="text-[0.65rem] uppercase tracking-wider text-emerald-100/45">{label}</p>
                </div>
              ))}
            </div>
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
                <BadgeCheck size={13} className="text-emerald-400" />
                Conteúdo baseado nos editais publicados
              </div>
            </div>
          </div>
        </div>

        {/* Faixa dos três editais */}
        <div className="mt-14 grid gap-3 sm:mt-20 sm:grid-cols-3">
          {editais.map((e, idx) => {
            const tom = TOM_COLORS[e.tom];
            return (
              <button
                key={e.id}
                onClick={() => onLerDocumento(e.id)}
                style={{ animationDelay: `${180 + idx * 80}ms` }}
                className="group animate-fade-up relative overflow-hidden rounded-xl border border-white/8 bg-white/[0.03] p-5 text-left transition hover:border-pmpr-gold/35 hover:bg-white/[0.055]"
              >
                <div
                  className="absolute inset-x-0 top-0 h-0.5 opacity-70 transition group-hover:opacity-100"
                  style={{ background: tom.cor }}
                />
                <div className="flex items-start justify-between gap-2">
                  <span className="font-display text-xl font-bold tracking-wide" style={{ color: tom.texto }}>
                    {e.sigla}
                  </span>
                  <StatusBadge status={e.status} />
                </div>
                <p className="mt-2 text-[0.8rem] leading-snug text-emerald-50/55">{e.nome}</p>
                <p className="font-display mt-3 text-2xl font-bold text-white">
                  {e.vagas.toLocaleString('pt-BR')}
                  <span className="ml-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-emerald-100/40">
                    vagas
                  </span>
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-[0.72rem] font-semibold text-pmpr-gold/85 transition group-hover:gap-2">
                  Abrir edital <ArrowRight size={13} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
