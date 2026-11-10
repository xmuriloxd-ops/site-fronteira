import { ArrowRight, BadgeCheck, ClipboardList, MapPin, ShieldCheck } from 'lucide-react';
import { Brasao } from './ui';

/** Abertura do portal com os formulários de inscrição abertos. */
export function Hero({
  onAbrirFormulario13,
  onAbrirFicha,
}: {
  onAbrirFormulario13: () => void;
  onAbrirFicha: (editalId: string) => void;
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

            <h1 className="display-title mt-5 text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              Portal de Inscrições
              <br />
              <span className="gold-text">Polícia Militar</span>
              <br />
              do Paraná
            </h1>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="#fichas-unidade" className="btn-gold text-sm">
                Formulários ROTAM e RONE
                <ArrowRight size={16} />
              </a>
              <button onClick={onAbrirFormulario13} className="btn-ghost text-sm">
                Inscrição 13º BPM
              </button>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
              {[
                { Icon: ClipboardList, valor: '3', label: 'Formulários abertos' },
                { Icon: ShieldCheck, valor: '100%', label: 'Campos obrigatórios' },
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
                Inscrições recebidas pelo comando
              </div>
            </div>
          </div>
        </div>

        {/* Cartões das inscrições abertas */}
        <div className="mt-14 grid gap-3 sm:mt-20 sm:grid-cols-3">
          {[
            {
              id: '13bpm',
              sigla: '13º BPM',
              nome: 'Recrutamento Fronteira Sul · Nov/2026',
              campos: '9',
              cor: '#4ade80',
              classe:
                'border-emerald-400/25 bg-emerald-500/[0.06] hover:border-emerald-400/60 hover:bg-emerald-500/10',
              botao: 'text-emerald-300/90',
              acao: 'Preencher inscrição',
              abrir: onAbrirFormulario13,
            },
            {
              id: 'rotam',
              sigla: 'ROTAM',
              nome: 'Curso Operacional · Rondas Táticas Metropolitanas',
              campos: '6',
              cor: '#d4af37',
              classe: 'border-pmpr-gold/25 bg-pmpr-gold/[0.05] hover:border-pmpr-gold/60 hover:bg-pmpr-gold/10',
              botao: 'text-pmpr-gold/90',
              acao: 'Preencher formulário',
              abrir: () => onAbrirFicha('rotam-operacional-2026'),
            },
            {
              id: 'rone',
              sigla: 'RONE',
              nome: 'Curso de Operações Especiais · Rondas Ostensivas',
              campos: '6',
              cor: '#60a5fa',
              classe: 'border-sky-400/25 bg-sky-500/[0.05] hover:border-sky-400/60 hover:bg-sky-500/10',
              botao: 'text-sky-300/90',
              acao: 'Preencher formulário',
              abrir: () => onAbrirFicha('rone-operacional-2026'),
            },
          ].map((card, idx) => (
            <button
              key={card.id}
              onClick={card.abrir}
              style={{ animationDelay: `${180 + idx * 80}ms` }}
              className={`group animate-fade-up relative overflow-hidden rounded-xl border p-5 text-left transition ${card.classe}`}
            >
              <div
                className="absolute inset-x-0 top-0 h-0.5 opacity-70 transition group-hover:opacity-100"
                style={{ background: card.cor }}
              />
              <div className="flex items-start justify-between gap-2">
                <span className="font-display text-xl font-bold tracking-wide" style={{ color: card.cor }}>
                  {card.sigla}
                </span>
                <span className="badge-pill border border-white/12 bg-white/[0.04] text-emerald-100/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Formulário
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-[0.8rem] leading-snug text-emerald-50/55">{card.nome}</p>
              <p className="font-display mt-3 text-2xl font-bold text-white">
                {card.campos}
                <span className="ml-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-emerald-100/40">
                  campos
                </span>
              </p>
              <span
                className={`mt-3 inline-flex items-center gap-1 text-[0.72rem] font-semibold transition group-hover:gap-2 ${card.botao}`}
              >
                {card.acao} <ArrowRight size={13} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
