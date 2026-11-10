import {
  ArrowRight,
  CalendarDays,
  Wallet,
  Users,
  GraduationCap,
  FileText,
  Send,
  Radar,
  Crosshair,
  Shield,
} from 'lucide-react';
import type { Edital } from '../types';
import { Section, SectionHeading, StatusBadge, TOM_COLORS } from './ui';

const ICONES = {
  pmpr: Shield,
  rotam: Radar,
  rone: Crosshair,
} as const;

export function EditaisSection({
  editais,
  onAbrir,
  onLerDocumento,
  onDiscord,
}: {
  editais: Edital[];
  onAbrir: (id: string) => void;
  onLerDocumento: (id: string) => void;
  onDiscord: (id: string) => void;
}) {
  return (
    <Section id="editais" className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="Seleções em andamento"
        title={
          <>
            Três editais, <span className="gold-text">uma corporação</span>
          </>
        }
        description="Cada unidade tem requisitos, etapas e cronograma próprios. Abra o edital, confira o conteúdo programático e ative o aviso no Discord."
      />

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {editais.map((edital, idx) => {
          const tom = TOM_COLORS[edital.tom];
          const Icone = ICONES[edital.tom];
          return (
            <article
              key={edital.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-white/8 bg-gradient-to-b from-white/[0.045] to-white/[0.015] transition hover:border-pmpr-gold/30"
              style={{ animationDelay: `${idx * 90}ms` }}
            >
              <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: tom.cor }} />
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl transition group-hover:opacity-100"
                style={{ background: tom.brilho, opacity: 0.5 }}
              />

              <div className="relative flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-lg border"
                    style={{ background: `${tom.cor}26`, borderColor: `${tom.texto}33` }}
                  >
                    <Icone size={20} style={{ color: tom.texto }} />
                  </div>
                  <StatusBadge status={edital.status} />
                </div>

                <div className="mt-4">
                  <p className="font-display text-[1.6rem] font-bold leading-none tracking-wide" style={{ color: tom.texto }}>
                    {edital.sigla}
                  </p>
                  <h3 className="mt-1.5 text-[0.95rem] font-semibold leading-snug text-white">{edital.nome}</h3>
                  <p className="mt-0.5 text-[0.72rem] uppercase tracking-wider text-emerald-100/35">
                    {edital.unidade}
                  </p>
                </div>

                <p className="mt-3 line-clamp-3 text-[0.79rem] leading-relaxed text-emerald-50/50">{edital.resumo}</p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <MiniInfo Icon={Users} label="Vagas" valor={edital.vagas.toLocaleString('pt-BR')} />
                  <MiniInfo Icon={CalendarDays} label="Prova" valor={edital.prova} />
                  <MiniInfo Icon={Wallet} label="Remuneração" valor={edital.remuneracaoCurta} small />
                  <MiniInfo Icon={GraduationCap} label="Inscrições" valor={edital.inscricoes} small />
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {edital.destaque.map((d) => (
                    <span
                      key={d}
                      className="rounded border px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider"
                      style={{ borderColor: `${tom.texto}30`, color: tom.texto, background: `${tom.cor}1f` }}
                    >
                      {d}
                    </span>
                  ))}
                </div>

                <div className="mt-auto space-y-1.5 pt-5">
                  <button onClick={() => onLerDocumento(edital.id)} className="btn-gold w-full px-3 py-2.5 text-[0.8rem]">
                    <FileText size={14} />
                    Ler edital completo
                    <ArrowRight size={13} />
                  </button>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onAbrir(edital.id)}
                      className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-[0.74rem] font-semibold text-emerald-50/65 transition hover:border-pmpr-gold/30 hover:text-pmpr-gold"
                    >
                      Resumo rápido
                    </button>
                    <button
                      onClick={() => onDiscord(edital.id)}
                      title="Receber este edital no Discord"
                      className="rounded-lg border border-pmpr-gold/25 px-3 py-2 text-pmpr-gold/85 transition hover:bg-pmpr-gold/10 hover:text-pmpr-gold"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}

function MiniInfo({
  Icon,
  label,
  valor,
  small,
}: {
  Icon: typeof Users;
  label: string;
  valor: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-md border border-white/6 bg-black/25 px-2.5 py-2">
      <p className="flex items-center gap-1 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-emerald-100/35">
        <Icon size={9} />
        {label}
      </p>
      <p className={`mt-0.5 leading-snug text-white/85 ${small ? 'text-[0.7rem]' : 'font-display text-[0.95rem] font-semibold'}`}>
        {valor}
      </p>
    </div>
  );
}
