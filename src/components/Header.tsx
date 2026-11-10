import { useEffect, useState } from 'react';
import { Menu, X, ShieldCheck, LockKeyhole, LogOut } from 'lucide-react';
import { Brasao } from './ui';

export interface AbaPortal {
  /** id do formulário, ou 'unidades' para a seção de unidades. */
  id: string;
  label: string;
}

/** Abas do topo: cada inscrição abre o formulário direto, sem rolar a página. */
export const ABAS_PORTAL: AbaPortal[] = [
  { id: 'fronteira-sul', label: '13º BPM' },
  { id: 'rotam-operacional-2026', label: 'ROTAM' },
  { id: 'rone-operacional-2026', label: 'RONE' },
  { id: 'unidades', label: 'Unidades' },
];

export function Header({
  adminLogado,
  onAdminClick,
  onSair,
  onAbrirAba,
}: {
  adminLogado: boolean;
  onAdminClick: () => void;
  onSair: () => void;
  /** Abre o formulário da aba escolhida (ou rola até as unidades). */
  onAbrirAba: (id: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 24);
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => window.removeEventListener('scroll', aoRolar);
  }, []);

  const abrirAba = (id: string) => {
    setAberto(false);
    if (id === 'unidades') {
      document.getElementById('unidades')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    onAbrirAba(id);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        rolou ? 'border-b border-pmpr-gold/15 bg-ink-950/92 backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3 text-left"
          aria-label="Voltar ao início"
        >
          <Brasao size={44} />
          <div className="leading-tight">
            <p className="font-display text-[0.98rem] font-bold uppercase tracking-wide text-white">
              Polícia Militar <span className="text-pmpr-gold">do Paraná</span>
            </p>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-emerald-100/45">
              Portal de Inscrições · PMPR
            </p>
          </div>
        </button>

        <nav className="hidden items-center gap-1 lg:flex">
          {ABAS_PORTAL.map((aba) => (
            <button
              key={aba.id}
              onClick={() => abrirAba(aba.id)}
              className="rounded-md px-3 py-2 text-[0.8rem] font-semibold text-emerald-50/70 transition hover:bg-pmpr-gold/8 hover:text-pmpr-gold"
            >
              {aba.label}
            </button>
          ))}
          <div className="mx-2 h-5 w-px bg-pmpr-gold/20" />
          {adminLogado ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onAdminClick}
                className="flex items-center gap-1.5 rounded-md bg-emerald-500/12 px-3 py-2 text-[0.8rem] font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
              >
                <ShieldCheck size={15} />
                Comando
              </button>
              <button
                onClick={onSair}
                title="Sair do painel"
                className="rounded-md p-2 text-emerald-100/50 transition hover:bg-white/5 hover:text-white"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={onAdminClick}
              className="flex items-center gap-1.5 rounded-md border border-pmpr-gold/35 px-3 py-2 text-[0.8rem] font-semibold text-pmpr-gold-soft transition hover:bg-pmpr-gold/10"
            >
              <LockKeyhole size={14} />
              Aba do Comando
            </button>
          )}
        </nav>

        <button
          className="rounded-md border border-pmpr-gold/25 p-2 text-pmpr-gold lg:hidden"
          onClick={() => setAberto((v) => !v)}
          aria-label="Abrir menu"
        >
          {aberto ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {aberto && (
        <div className="border-t border-pmpr-gold/15 bg-ink-900/98 px-5 pb-4 pt-2 lg:hidden">
          {ABAS_PORTAL.map((aba) => (
            <button
              key={aba.id}
              onClick={() => abrirAba(aba.id)}
              className="block w-full rounded-md px-2 py-2.5 text-left text-sm font-semibold text-emerald-50/75 hover:bg-white/5"
            >
              {aba.label}
            </button>
          ))}
          <button
            onClick={() => {
              setAberto(false);
              onAdminClick();
            }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-pmpr-gold/35 px-3 py-2.5 text-sm font-bold text-pmpr-gold-soft"
          >
            <LockKeyhole size={15} />
            {adminLogado ? 'Painel do Comando' : 'Aba do Comando'}
          </button>
        </div>
      )}
    </header>
  );
}
