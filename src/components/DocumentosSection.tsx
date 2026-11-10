import { FileCheck2, Printer, Download, BookOpen, ShieldCheck, CalendarDays } from 'lucide-react';
import { DOCUMENTOS } from '../data/documentos';
import type { Edital } from '../types';
import { Section, SectionHeading, TOM_COLORS } from './ui';

export function DocumentosSection({
  editais,
  onLerDocumento,
}: {
  editais: Edital[];
  onLerDocumento: (id: string) => void;
}) {
  return (
    <Section id="documentos" className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="Publicação oficial do portal"
        title={
          <>
            Editais <span className="gold-text">na íntegra</span>, sem link de terceiro
          </>
        }
        description="O texto completo dos três editais é hospedado e mantido aqui. Leia capítulo por capítulo, imprima ou baixe a cópia em texto — nenhuma etapa depende de site externo."
      />

      <div className="mt-9 space-y-3">
        {DOCUMENTOS.map((doc) => {
          const edital = editais.find((e) => e.id === doc.editalId);
          if (!edital) return null;
          const tom = TOM_COLORS[edital.tom];

          return (
            <article
              key={doc.editalId}
              className="group overflow-hidden rounded-xl border border-white/8 bg-gradient-to-r from-white/[0.045] to-white/[0.015] transition hover:border-pmpr-gold/30"
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                {/* Capa do documento */}
                <div
                  className="relative flex h-24 w-20 shrink-0 flex-col items-center justify-center rounded border-l-4 bg-[#f7f4ea] px-1.5 py-2 shadow-lg"
                  style={{ borderColor: tom.cor }}
                >
                  <img src="/pmpr-brasao.png" alt="" className="h-8 w-8" />
                  <p className="mt-1 text-center text-[0.42rem] font-bold uppercase leading-tight tracking-wide text-[#3c4a3c]">
                    Polícia Militar do Paraná
                  </p>
                  <p className="mt-1 text-center text-[0.44rem] font-bold uppercase leading-tight text-[#0b2a17]">
                    {edital.sigla}
                  </p>
                  <div className="mt-1 h-px w-8 bg-[#0b2a17]/30" />
                  <p className="mt-1 text-center text-[0.4rem] leading-tight text-[#5c6b5c]">Edital completo</p>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="font-display rounded px-2 py-0.5 text-[0.68rem] font-bold tracking-wide"
                      style={{ background: `${tom.cor}30`, color: tom.texto }}
                    >
                      {edital.sigla}
                    </span>
                    <span className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-emerald-300">
                      <FileCheck2 size={9} />
                      Publicado aqui
                    </span>
                    <span className="text-[0.66rem] text-emerald-100/35">
                      versão {doc.versao} · atualizado em {doc.atualizadoEm}
                    </span>
                  </div>

                  <h3 className="mt-1.5 text-[0.9rem] font-semibold leading-snug text-white">{doc.numero}</h3>
                  <p className="mt-0.5 line-clamp-2 text-[0.76rem] leading-relaxed text-emerald-50/45">
                    {doc.titulo}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.68rem] text-emerald-100/40">
                    <span className="flex items-center gap-1">
                      <BookOpen size={10} />
                      {doc.secoes.length} capítulos
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays size={10} />
                      {doc.data}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={10} />
                      {edital.banca}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-1.5">
                  <button onClick={() => onLerDocumento(doc.editalId)} className="btn-gold px-3.5 py-2.5 text-[0.78rem]">
                    <BookOpen size={13} />
                    Abrir documento
                  </button>
                  <button
                    onClick={() => onLerDocumento(doc.editalId)}
                    title="Abrir para imprimir ou baixar"
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2.5 text-[0.74rem] font-semibold text-emerald-50/60 transition hover:border-pmpr-gold/35 hover:text-pmpr-gold"
                  >
                    <Printer size={13} />
                    Imprimir
                    <span className="text-emerald-100/25">/</span>
                    <Download size={13} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-lg border border-white/8 bg-white/[0.02] px-4 py-3 text-[0.7rem] text-emerald-100/40">
        <span className="flex items-center gap-1.5">
          <FileCheck2 size={11} className="text-emerald-400" />
          Texto integral no portal
        </span>
        <span className="flex items-center gap-1.5">
          <Printer size={11} className="text-emerald-400" />
          Impressão em formato oficial
        </span>
        <span className="flex items-center gap-1.5">
          <Download size={11} className="text-emerald-400" />
          Cópia em texto para download
        </span>
      </div>
    </Section>
  );
}
