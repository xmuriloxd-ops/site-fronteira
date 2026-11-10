import { ClipboardList, ArrowRight, Clock, Users, MapPin, FileText, CheckCircle2 } from 'lucide-react';
import { FORMULARIO_RECRUTAMENTO } from '../data/recrutamento';
import { Section, SectionHeading } from './ui';

export function RecrutamentoCard({
  onAbrirFormulario,
  totalInscricoes,
}: {
  onAbrirFormulario: () => void;
  totalInscricoes: number;
}) {
  const FORM = FORMULARIO_RECRUTAMENTO;
  const perguntas = FORM.campos.filter((c) => c.tipo !== 'identificacao').length;

  return (
    <Section id="recrutamento" className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="Recrutamento em andamento"
        title={
          <>
            Edital <span className="gold-text">13º Batalhão</span>
            <br />
            Fronteira Sul · Nov/2026
          </>
        }
        description="Processo seletivo em formato de formulário. As respostas são avaliadas pelo comando considerando conhecimento, coerência, disciplina e compreensão das regras de Roleplay."
      />

      <div className="mt-8 overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-900/40 via-ink-900 to-ink-950">
        <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          {/* Documento */}
          <div className="border-b border-white/8 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-pill border border-emerald-400/35 bg-emerald-500/12 text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Inscrições abertas
              </span>
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-[0.66rem] text-emerald-100/50">
                {FORM.referencia} · 13º BPM
              </span>
            </div>

            <h3 className="font-display mt-4 text-[1.35rem] font-bold uppercase leading-tight text-white sm:text-2xl">
              {FORM.titulo}
            </h3>
            <p className="mt-1 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-pmpr-gold/80">
              {FORM.subtitulo}
            </p>

            <p className="mt-4 text-[0.82rem] leading-relaxed text-emerald-50/60">{FORM.introducao}</p>

            <div className="mt-4 rounded-lg border border-white/8 bg-black/25 p-3.5">
              <p className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-emerald-100/40">
                <FileText size={11} />
                Orientações aos candidatos
              </p>
              <ul className="mt-2 space-y-1.5">
                {FORM.orientacoes.map((o) => (
                  <li key={o} className="flex gap-2 text-[0.76rem] leading-relaxed text-emerald-50/50">
                    <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-emerald-400/70" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 whitespace-pre-line text-center text-[0.82rem] font-semibold leading-relaxed text-pmpr-gold-soft/85">
              {FORM.rodape}
            </p>
          </div>

          {/* Painel do formulário */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-pmpr-gold/25 bg-pmpr-gold/10">
                <ClipboardList size={20} className="text-pmpr-gold" />
              </div>
              <div>
                <p className="font-display text-base font-bold uppercase tracking-wide text-white">
                  Formulário de inscrição
                </p>
                <p className="text-[0.68rem] text-emerald-100/40">{perguntas + 1} campos · obrigatório</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {[
                { Icon: MapPin, label: FORM.batalhao },
                { Icon: Users, label: 'Vagas limitadas ao efetivo do batalhão' },
                { Icon: Clock, label: 'Escala 5x2 · mínimo de 4 horas' },
              ].map(({ Icon, label }) => (
                <p key={label} className="flex items-center gap-2 text-[0.76rem] text-emerald-50/55">
                  <Icon size={12} className="shrink-0 text-emerald-400/70" />
                  {label}
                </p>
              ))}
            </div>

            <div className="gold-rule my-4" />

            <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-emerald-100/40">
              Perguntas do formulário
            </p>
            <ol className="mt-2 space-y-1">
              {FORM.campos
                .filter((c) => c.tipo !== 'identificacao')
                .map((c) => (
                  <li key={c.id} className="flex gap-1.5 text-[0.72rem] leading-snug text-emerald-50/45">
                    <span className="shrink-0 font-bold text-pmpr-gold/60">{c.numero}.</span>
                    <span className="line-clamp-1">{c.titulo}</span>
                  </li>
                ))}
            </ol>

            <button onClick={onAbrirFormulario} className="btn-gold mt-5 w-full text-sm">
              Preencher formulário
              <ArrowRight size={15} />
            </button>

            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-[0.66rem] text-emerald-100/30">
                {totalInscricoes} inscrição(ões) recebida(s)
              </p>
              <button
                onClick={onAbrirFormulario}
                className="text-[0.68rem] font-semibold text-pmpr-gold/70 underline-offset-2 hover:text-pmpr-gold hover:underline"
              >
                Ler as perguntas
              </button>
            </div>

            <p className="mt-3 rounded border border-amber-400/20 bg-amber-500/[0.06] p-2.5 text-[0.68rem] leading-relaxed text-amber-100/60">
              O preenchimento do formulário não garante a aprovação ou o ingresso na corporação.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
