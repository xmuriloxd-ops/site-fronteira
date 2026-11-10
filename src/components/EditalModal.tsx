import { useEffect, useState } from 'react';
import {
  X,
  Building2,
  CalendarDays,
  Clock3,
  GraduationCap,
  MapPin,
  Wallet,
  Ticket,
  FileText,
  ListChecks,
  ClipboardList,
  BookOpen,
  ArrowUpRight,
  ShieldAlert,
  Send,
  Users,
  Megaphone,
} from 'lucide-react';
import type { Edital } from '../types';
import { getProvasDoEdital } from '../data/provas';
import { StatusBadge, TOM_COLORS } from './ui';

type Aba = 'visao' | 'conteudo' | 'cronograma' | 'provas';

const ABAS: { id: Aba; label: string; Icon: typeof FileText }[] = [
  { id: 'visao', label: 'Visão geral', Icon: ClipboardList },
  { id: 'conteudo', label: 'Conteúdo', Icon: BookOpen },
  { id: 'cronograma', label: 'Cronograma', Icon: CalendarDays },
  { id: 'provas', label: 'Provas', Icon: FileText },
];

export function EditalModal({
  edital,
  aviso,
  onClose,
  onDiscord,
}: {
  edital: Edital;
  aviso?: string;
  onClose: () => void;
  onDiscord: (editalId: string) => void;
}) {
  const [aba, setAba] = useState<Aba>('visao');
  const tom = TOM_COLORS[edital.tom];
  const provas = getProvasDoEdital(edital.id);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', aoTeclar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [onClose]);

  const infos = [
    { Icon: Building2, label: 'Unidade', valor: edital.unidade },
    { Icon: GraduationCap, label: 'Escolaridade', valor: edital.escolaridade },
    { Icon: Users, label: 'Público', valor: edital.publico },
    { Icon: Wallet, label: 'Remuneração', valor: edital.remuneracao },
    { Icon: Ticket, label: 'Taxa de inscrição', valor: edital.taxa },
    { Icon: Clock3, label: 'Inscrições', valor: edital.inscricoes },
    { Icon: CalendarDays, label: 'Prova', valor: edital.prova },
    { Icon: MapPin, label: 'Local', valor: edital.local },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-pmpr-gold/25 bg-ink-900 shadow-2xl sm:h-[88vh] sm:rounded-2xl">
        {/* Cabeçalho */}
        <div className="relative shrink-0 border-b border-pmpr-gold/15 px-5 pb-4 pt-5 sm:px-7">
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: `linear-gradient(90deg, ${tom.cor}, ${tom.texto})` }}
          />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-lg font-bold tracking-wide" style={{ color: tom.texto }}>
                  {edital.sigla}
                </span>
                <StatusBadge status={edital.status} />
              </div>
              <h2 className="display-title mt-1.5 text-2xl text-white sm:text-3xl">{edital.nome}</h2>
              <p className="mt-1 text-[0.8rem] text-emerald-50/50">{edital.chamada}</p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-lg border border-white/10 p-2 text-emerald-100/60 transition hover:border-pmpr-gold/40 hover:text-pmpr-gold"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 flex gap-1 overflow-x-auto pb-0.5">
            {ABAS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setAba(id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-[0.78rem] font-semibold transition ${
                  aba === id
                    ? 'bg-pmpr-gold/15 text-pmpr-gold-soft'
                    : 'text-emerald-50/55 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Corpo */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {aviso && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-pmpr-gold/30 bg-pmpr-gold/[0.08] p-3">
              <Megaphone size={15} className="mt-0.5 shrink-0 text-pmpr-gold" />
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-pmpr-gold/80">
                  Aviso do comando
                </p>
                <p className="mt-0.5 text-[0.8rem] leading-relaxed text-pmpr-gold-soft/85">{aviso}</p>
              </div>
            </div>
          )}

          {aba === 'visao' && (
            <div className="space-y-6">
              <p className="text-sm leading-relaxed text-emerald-50/70">{edital.resumo}</p>

              <div className="grid gap-2 sm:grid-cols-2">
                {infos.map(({ Icon, label, valor }) => (
                  <div key={label} className="rounded-lg border border-white/8 bg-black/25 p-3">
                    <p className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-emerald-100/40">
                      <Icon size={11} />
                      {label}
                    </p>
                    <p className="mt-1 text-[0.82rem] leading-snug text-white/90">{valor}</p>
                  </div>
                ))}
              </div>

              <div>
                <TituloBloco numero="01" titulo="Requisitos" />
                <ul className="space-y-2">
                  {edital.requisitos.map((r) => (
                    <li key={r.titulo} className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
                      <p className="text-[0.8rem] font-semibold text-pmpr-gold-soft">{r.titulo}</p>
                      <p className="mt-0.5 text-[0.8rem] leading-relaxed text-emerald-50/60">{r.detalhe}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <TituloBloco numero="02" titulo="Etapas da seleção" />
                <ol className="space-y-2">
                  {edital.etapas.map((etapa) => (
                    <li key={etapa.ordem} className="flex gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-3">
                      <span
                        className="font-display flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[0.8rem] font-bold"
                        style={{ background: `${tom.cor}33`, color: tom.texto }}
                      >
                        {etapa.ordem}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[0.82rem] font-semibold text-white">{etapa.nome}</p>
                          <span className="rounded border border-white/10 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider text-emerald-100/50">
                            {etapa.carater}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[0.78rem] leading-relaxed text-emerald-50/60">{etapa.descricao}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-lg border border-amber-400/25 bg-amber-500/[0.06] p-4">
                <p className="flex items-center gap-2 text-[0.8rem] font-bold text-amber-300">
                  <ShieldAlert size={15} />
                  Observações importantes
                </p>
                <ul className="mt-2 space-y-1.5">
                  {edital.observacoes.map((o) => (
                    <li key={o} className="flex gap-2 text-[0.78rem] leading-relaxed text-amber-100/70">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {aba === 'conteudo' && (
            <div className="space-y-5">
              <p className="text-[0.8rem] leading-relaxed text-emerald-50/55">
                Conteúdo programático cobrado na prova objetiva. Estude primeiro as disciplinas com maior peso —
                língua portuguesa e raciocínio matemático somam 19 das 60 questões.
              </p>
              {edital.materias.map((materia) => (
                <div key={materia.titulo} className="rounded-lg border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2">
                    <ListChecks size={15} style={{ color: tom.texto }} />
                    <h4 className="font-display text-base font-bold uppercase tracking-wide text-white">
                      {materia.titulo}
                    </h4>
                  </div>
                  <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                    {materia.topicos.map((t) => (
                      <li key={t} className="flex gap-2 text-[0.78rem] leading-relaxed text-emerald-50/60">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: tom.texto }} />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {aba === 'cronograma' && (
            <div className="space-y-1">
              {edital.cronograma.map((item, i) => (
                <div key={`${item.etapa}-${i}`} className="flex gap-3">
                  <div className="flex flex-col items-center pt-1.5">
                    <span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: tom.texto }} />
                    {i < edital.cronograma.length - 1 && <span className="my-1 w-px flex-1 bg-white/10" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-[0.84rem] font-semibold text-white">{item.etapa}</p>
                    <p className="text-[0.78rem] text-pmpr-gold/80">{item.periodo}</p>
                    {item.observacao && (
                      <p className="mt-0.5 text-[0.72rem] text-emerald-100/40">{item.observacao}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {aba === 'provas' && (
            <div className="space-y-3">
              <p className="text-[0.8rem] leading-relaxed text-emerald-50/55">
                Provas anteriores e materiais públicos para treinar no formato da banca. Os links abrem em uma nova
                aba.
              </p>
              {provas.map((p) => (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-start justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-3.5 transition hover:border-pmpr-gold/35 hover:bg-white/[0.05]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider"
                        style={{ background: `${tom.cor}33`, color: tom.texto }}
                      >
                        {p.tipo}
                      </span>
                      <span className="text-[0.7rem] text-emerald-100/45">
                        {p.ano} · {p.banca}
                      </span>
                    </div>
                    <p className="mt-1 text-[0.84rem] font-semibold text-white">
                      {p.cargo} — {p.orgao}
                    </p>
                    {p.observacao && <p className="text-[0.75rem] text-emerald-50/50">{p.observacao}</p>}
                    <p className="mt-1 text-[0.68rem] uppercase tracking-wider text-emerald-100/35">
                      Fonte: {p.fonte}
                    </p>
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="mt-1 shrink-0 text-emerald-100/40 transition group-hover:text-pmpr-gold"
                  />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="shrink-0 border-t border-pmpr-gold/15 bg-ink-950/60 px-5 py-3 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[0.68rem] text-emerald-100/35">
              Projeto demonstrativo · confira sempre o edital oficial da PMPR
            </p>
            <button onClick={() => onDiscord(edital.id)} className="btn-gold px-3 py-2 text-[0.78rem]">
              <Send size={13} />
              Receber no Discord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TituloBloco({ numero, titulo }: { numero: string; titulo: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className="font-display text-[0.72rem] font-bold tracking-widest text-pmpr-gold/60">{numero}</span>
      <h3 className="font-display text-base font-bold uppercase tracking-wide text-white">{titulo}</h3>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}
