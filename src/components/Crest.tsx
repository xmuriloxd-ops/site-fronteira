import React from 'react';

interface CrestProps {
  className?: string;
  /** usa as cores atuais do tema */
  variant?: 'gold' | 'mono';
}

/**
 * Brasão genérico de inspiração militar: escudo, águia, espada e raio.
 * Não é o brasão oficial da PMPR — serve como marca visual do site.
 */
export function Crest({ className = 'h-12 w-12', variant = 'gold' }: CrestProps) {
  const gold = variant === 'gold' ? 'var(--c-gold)' : 'currentColor';
  return (
    <svg
      viewBox="0 0 100 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M50 4 L94 18 V62 C94 88 74 105 50 116 C26 105 6 88 6 62 V18 Z"
        fill="color-mix(in srgb, var(--c-brand) 80%, #000)"
        stroke={gold}
        strokeWidth="3"
      />
      <path
        d="M50 12 L86 23 V62 C86 84 70 98 50 107 C30 98 14 84 14 62 V23 Z"
        stroke={gold}
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      {/* espada */}
      <path d="M50 26 L50 88" stroke={gold} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M50 26 L46.5 34 H53.5 Z" fill={gold} />
      <path d="M40 62 H60" stroke={gold} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M50 88 L47 94 H53 Z" fill={gold} />
      {/* asas */}
      <path
        d="M50 40 C40 36 30 38 22 46 C30 46 36 50 41 56 C35 54 29 55 24 60 C33 60 40 63 45 68"
        stroke={gold}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M50 40 C60 36 70 38 78 46 C70 46 64 50 59 56 C65 54 71 55 76 60 C67 60 60 63 55 68"
        stroke={gold}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* raio */}
      <path
        d="M34 44 L46 52 L38 58 L50 70"
        stroke="var(--c-alert)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Crest className="h-12 w-10 shrink-0" />
      <div className="leading-none">
        <div className="font-display text-2xl font-extrabold tracking-[0.16em] text-[var(--c-paper)]">
          RONE
        </div>
        <div className="mt-1 text-[9px] uppercase tracking-[0.28em] text-[var(--c-gold)]">
          Polícia Militar · PR
        </div>
      </div>
    </div>
  );
}
