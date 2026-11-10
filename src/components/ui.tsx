import type { ReactNode } from 'react';
/** Identidade visual das unidades do portal. */
export type TomUnidade = 'rotam' | 'rone' | 'pmpr';

/* ------------------------------------------------------------------ */
/* Selo / brasão                                                       */
/* ------------------------------------------------------------------ */

export function Brasao({ size = 56, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/pmpr-brasao.png"
      alt="Brasão da Polícia Militar do Paraná"
      width={size}
      height={size}
      className={`object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Cores por unidade                                                   */
/* ------------------------------------------------------------------ */

export const TOM_COLORS: Record<TomUnidade, { cor: string; brilho: string; texto: string; chip: string }> = {
  pmpr: {
    cor: '#0b6b3a',
    brilho: 'rgba(11,107,58,0.55)',
    texto: '#4ade80',
    chip: 'bg-emerald-500/12 text-emerald-300 border-emerald-400/30',
  },
  rotam: {
    cor: '#b8860b',
    brilho: 'rgba(233,196,106,0.38)',
    texto: '#e9c46a',
    chip: 'bg-amber-500/12 text-amber-300 border-amber-400/30',
  },
  rone: {
    cor: '#475569',
    brilho: 'rgba(148,163,184,0.3)',
    texto: '#cbd5e1',
    chip: 'bg-slate-400/12 text-slate-300 border-slate-400/30',
  },
};

/* ------------------------------------------------------------------ */
/* Estruturas                                                          */
/* ------------------------------------------------------------------ */

export function Section({
  id,
  children,
  className = '',
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-3xl'}>
      <p className="eyebrow text-pmpr-gold/80">{eyebrow}</p>
      <h2 className="display-title mt-3 text-3xl text-white sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-sm leading-relaxed text-emerald-50/60 sm:text-base">{description}</p>}
    </div>
  );
}

export function StatBox({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-pmpr-gold/12 bg-black/20 px-4 py-3">
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-emerald-100/45">{label}</p>
      <p className="font-display mt-1 text-lg font-semibold text-white">{value}</p>
      {hint && <p className="mt-0.5 text-[0.7rem] text-emerald-100/40">{hint}</p>}
    </div>
  );
}

export function Divider() {
  return <div className="gold-rule my-12 w-full" />;
}
