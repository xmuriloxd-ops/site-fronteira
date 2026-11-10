import { ClipboardList, ArrowRight, FileText, ShieldCheck } from 'lucide-react';
import { FORMULARIOS_UNIDADE } from '../data/fichas-unidade';
import { DocumentoDivulgacao } from './DocumentoDivulgacao';
import { Section, SectionHeading } from './ui';
import type { DivulgacaoInscricoes } from '../types';

/** Campos do padrão de inscrição das unidades especializadas. */
const CAMPOS_PADRAO = [
  { nome: 'QRA', descricao: 'nome de guerra / indicativo' },
  { nome: 'Patente', descricao: 'posto ou graduação' },
  { nome: 'Unidade', descricao: 'lotação atual' },
  { nome: 'Carga horária', descricao: 'disponibilidade semanal' },
  { nome: 'Tempo de serviço', descricao: 'tempo na corporação' },
  { nome: 'Quem autorizou', descricao: 'comando responsável' },
];

/**
 * Formulários de inscrição da ROTAM e da RONE.
 * Não há edital: a inscrição é feita diretamente pelo formulário da unidade.
 */
export function FichasUnidadeSection({
  onAbrirFicha,
  totalInscricoes,
  divulgacao,
}: {
  onAbrirFicha: (editalId: string) => void;
  totalInscricoes: number;
  divulgacao?: DivulgacaoInscricoes;
}) {
  const fichas = Object.entries(FORMULARIOS_UNIDADE);

  return (
    <Section id="fichas-unidade" className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="Inscrições das unidades especializadas"
        title={
          <>
            Formulários da <span className="gold-text">ROTAM</span> e da{' '}
            <span className="gold-text">RONE</span>
          </>
        }
        description="A inscrição é feita direto no formulário da unidade. Todos os campos são obrigatórios e o envio chega imediatamente ao comando."
      />

      {/* Documento de divulgação publicado pelo comando */}
      {divulgacao && (
        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <DocumentoDivulgacao divulgacao={divulgacao} />
          <div className="flex flex-col justify-center rounded-xl border border-emerald-500/25 bg-emerald-900/20 p-5">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-pmpr-gold/80">
              Divulgação oficial
            </p>
            <p className="mt-2 text-[0.82rem] leading-relaxed text-emerald-50/60">
              Este é o documento das inscrições abertas publicado pelo comando. Confira a data, o horário e quem
              está divulgando antes de preencher a ficha.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {fichas.map(([editalId, ficha]) => {
          const perguntas = ficha.campos.filter((c) => c.tipo !== 'identificacao').length;

          return (
            <article
              key={editalId}
              className="flex flex-col overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-900/40 via-ink-900 to-ink-950"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-3">
                <span className="badge-pill border border-emerald-400/35 bg-emerald-500/12 text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Inscrições abertas
                </span>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[0.66rem] uppercase tracking-wider text-emerald-100/50">
                  {ficha.referencia}
                </span>
              </div>

              <div className="flex-1 px-5 py-5">
                <h3 className="font-display text-[1.1rem] font-bold uppercase leading-tight text-white">
                  {ficha.titulo}
                </h3>
                <p className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-pmpr-gold/80">
                  {ficha.subtitulo}
                </p>
                <p className="mt-3 text-[0.8rem] leading-relaxed text-emerald-50/55">
                  {ficha.introducao}
                </p>

                <ul className="mt-4 grid gap-1.5">
                  {CAMPOS_PADRAO.map(({ nome, descricao }) => (
                    <li
                      key={nome}
                      className="flex items-center gap-2 rounded-md border border-white/8 bg-white/[0.02] px-2.5 py-1.5"
                    >
                      <ShieldCheck size={12} className="shrink-0 text-pmpr-gold/80" />
                      <span className="text-[0.72rem] font-bold text-pmpr-gold">{nome}</span>
                      <span className="text-[0.7rem] text-emerald-50/40">{descricao}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap gap-3 text-[0.7rem] text-emerald-50/40">
                  <span className="flex items-center gap-1.5">
                    <ClipboardList size={12} /> {perguntas} campos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText size={12} /> envio imediato
                  </span>
                </div>
              </div>

              <div className="border-t border-white/8 px-5 py-4">
                <button
                  onClick={() => onAbrirFicha(ficha.id)}
                  className="btn-gold w-full justify-center text-[0.8rem]"
                >
                  Preencher formulário {ficha.referencia}
                  <ArrowRight size={14} />
                </button>
                <p className="mt-2 text-center text-[0.66rem] text-emerald-100/30">
                  {totalInscricoes > 0
                    ? `${totalInscricoes} inscrição(ões) já enviada(s) ao comando`
                    : 'Seu envio aparece na aba do comando'}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
