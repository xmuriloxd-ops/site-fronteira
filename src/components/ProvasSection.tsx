import { useState } from 'react';
import { ArrowUpRight, FileText, Filter, Search } from 'lucide-react';
import { PROVAS } from '../data/provas';
import { Section, SectionHeading } from './ui';

const TIPOS = ['Todos', 'Prova objetiva', 'Gabarito', 'Prova completa'] as const;

export function ProvasSection() {
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>('Todos');

  const lista = PROVAS.filter((p) => {
    const combinaTipo = tipo === 'Todos' || p.tipo === tipo;
    const alvo = `${p.cargo} ${p.banca} ${p.ano} ${p.fonte} ${p.tipo}`.toLowerCase();
    return combinaTipo && alvo.includes(busca.toLowerCase().trim());
  });

  return (
    <Section id="provas" className="py-16 sm:py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Provas na internet"
          title={
            <>
              Treine com <span className="gold-text">provas reais</span>
            </>
          }
          description="Provas objetivas, gabaritos e cadernos de questões da PMPR e de outras policiais militares, organizados por ano e banca."
        />
        <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2">
          <Search size={14} className="text-emerald-100/40" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar prova, banca ou ano"
            className="w-52 bg-transparent text-[0.8rem] text-white outline-none placeholder:text-emerald-100/30"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-emerald-100/40">
          <Filter size={12} />
          Tipo
        </span>
        {TIPOS.map((t) => (
          <button
            key={t}
            onClick={() => setTipo(t)}
            className={`rounded-full border px-3 py-1 text-[0.72rem] font-semibold transition ${
              tipo === t
                ? 'border-pmpr-gold/60 bg-pmpr-gold/15 text-pmpr-gold'
                : 'border-white/10 text-emerald-50/55 hover:border-pmpr-gold/30 hover:text-pmpr-gold/80'
            }`}
          >
            {t}
          </button>
        ))}
        <span className="ml-auto text-[0.72rem] text-emerald-100/35">{lista.length} materiais</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {lista.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noreferrer noopener"
            className="group flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-4 transition hover:border-pmpr-gold/30 hover:bg-white/[0.055]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-pmpr-gold/20 bg-pmpr-gold/8 text-pmpr-gold">
              <FileText size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-emerald-500/12 px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-emerald-300">
                  {p.tipo}
                </span>
                <span className="text-[0.68rem] text-emerald-100/40">
                  {p.ano} · {p.banca}
                </span>
              </div>
              <p className="mt-1 text-[0.85rem] font-semibold leading-snug text-white">
                {p.orgao} — {p.cargo}
              </p>
              {p.observacao && (
                <p className="mt-0.5 line-clamp-2 text-[0.74rem] leading-snug text-emerald-50/45">{p.observacao}</p>
              )}
              <p className="mt-1 text-[0.65rem] uppercase tracking-wider text-emerald-100/30">via {p.fonte}</p>
            </div>
            <ArrowUpRight
              size={15}
              className="mt-1 shrink-0 text-emerald-100/30 transition group-hover:text-pmpr-gold"
            />
          </a>
        ))}
      </div>

      {lista.length === 0 && (
        <p className="mt-8 rounded-lg border border-white/8 bg-white/[0.02] p-6 text-center text-sm text-emerald-50/45">
          Nenhum material encontrado para essa busca.
        </p>
      )}
    </Section>
  );
}
