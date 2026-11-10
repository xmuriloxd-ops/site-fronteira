import { useMemo, useState } from 'react';
import { BookOpenCheck, ChevronDown, Layers, Lightbulb, ShieldQuestion } from 'lucide-react';
import { BANCO_QUESTOES, DISTRIBUICAO_PROVA, TODAS_QUESTOES } from '../data/questoes';
import { Section, SectionHeading } from './ui';

export function ProvasSection() {
  const [materia, setMateria] = useState<string>('todas');
  const [aberta, setAberta] = useState<string | null>(null);

  const questoes = useMemo(
    () => (materia === 'todas' ? TODAS_QUESTOES : BANCO_QUESTOES.find((m) => m.id === materia)?.questoes ?? []),
    [materia],
  );

  return (
    <Section id="questoes" className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="Banco de questões do portal"
        title={
          <>
            Treine <span className="gold-text">aqui dentro</span>
          </>
        }
        description="Questões autorais escritas a partir do conteúdo programático dos editais. Filtre por disciplina, responda e veja o comentário — tudo sem sair do portal e sem link de terceiros."
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_270px]">
        <div>
          {/* Filtro por disciplina */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setMateria('todas')}
              className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold transition ${
                materia === 'todas'
                  ? 'border-pmpr-gold/60 bg-pmpr-gold/15 text-pmpr-gold'
                  : 'border-white/10 text-emerald-50/55 hover:border-pmpr-gold/30 hover:text-pmpr-gold/80'
              }`}
            >
              Todas ({TODAS_QUESTOES.length})
            </button>
            {BANCO_QUESTOES.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setMateria(m.id);
                  setAberta(null);
                }}
                className={`rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold transition ${
                  materia === m.id
                    ? 'border-pmpr-gold/60 bg-pmpr-gold/15 text-pmpr-gold'
                    : 'border-white/10 text-emerald-50/55 hover:border-pmpr-gold/30 hover:text-pmpr-gold/80'
                }`}
              >
                {m.nome} ({m.questoes.length})
              </button>
            ))}
          </div>

          {/* Lista de questões */}
          <div className="mt-4 space-y-2">
            {questoes.map((q, i) => {
              const expandida = aberta === q.id;
              return (
                <div
                  key={q.id}
                  className={`overflow-hidden rounded-xl border transition ${
                    expandida
                      ? 'border-pmpr-gold/35 bg-white/[0.055]'
                      : 'border-white/8 bg-white/[0.025] hover:border-white/15'
                  }`}
                >
                  <button
                    onClick={() => setAberta(expandida ? null : q.id)}
                    className="flex w-full items-start gap-3 p-4 text-left"
                  >
                    <span className="font-display flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-pmpr-gold/12 text-[0.72rem] font-bold text-pmpr-gold">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-emerald-100/35">
                        {q.disciplina}
                      </p>
                      <p className={`mt-1 text-[0.82rem] leading-relaxed text-white/90 ${expandida ? '' : 'line-clamp-2'}`}>
                        {q.enunciado}
                      </p>
                    </div>
                    <ChevronDown
                      size={15}
                      className={`mt-1 shrink-0 text-emerald-100/35 transition ${expandida ? 'rotate-180 text-pmpr-gold' : ''}`}
                    />
                  </button>

                  {expandida && (
                    <div className="animate-fade-up border-t border-white/8 px-4 pb-4 pt-3">
                      <ol className="space-y-1.5">
                        {q.alternativas.map((alt, j) => {
                          const correta = j === q.correta;
                          return (
                            <li
                              key={alt}
                              className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-[0.8rem] leading-snug ${
                                correta
                                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-100'
                                  : 'border-white/8 bg-black/20 text-emerald-50/70'
                              }`}
                            >
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[0.65rem] font-bold ${
                                  correta
                                    ? 'border-emerald-400 bg-emerald-500 text-ink-950'
                                    : 'border-white/20 text-emerald-100/50'
                                }`}
                              >
                                {String.fromCharCode(65 + j)}
                              </span>
                              {alt}
                            </li>
                          );
                        })}
                      </ol>
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-pmpr-gold/20 bg-pmpr-gold/[0.06] p-3">
                        <Lightbulb size={13} className="mt-0.5 shrink-0 text-pmpr-gold" />
                        <div>
                          <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-pmpr-gold/85">
                            Gabarito comentado · letra {String.fromCharCode(65 + q.correta)}
                          </p>
                          <p className="mt-0.5 text-[0.78rem] leading-relaxed text-emerald-50/70">{q.explicacao}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Painel lateral: distribuição da prova */}
        <div className="space-y-3">
          <div className="card-surface rounded-xl p-4">
            <p className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-emerald-100/40">
              <Layers size={11} />
              Distribuição da prova
            </p>
            <p className="mt-1 text-[0.7rem] leading-relaxed text-emerald-100/35">
              60 questões · 80 pontos
            </p>
            <ul className="mt-3 space-y-2">
              {DISTRIBUICAO_PROVA.map((d) => (
                <li key={d.disciplina}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[0.7rem] text-emerald-50/65">{d.disciplina}</span>
                    <span className="font-display text-[0.72rem] font-bold text-white">{d.quantidade}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-pmpr-gold"
                      style={{ width: `${(d.quantidade / 14) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <div className="gold-rule my-3" />
            <p className="text-[0.68rem] leading-relaxed text-emerald-100/35">
              Mínimo para habilitação: 12 pts em gerais, 12 pts em específicos e 32 pts no total.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
            <p className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-emerald-300">
              <BookOpenCheck size={12} />
              Banco próprio
            </p>
            <p className="mt-1.5 text-[0.75rem] leading-relaxed text-emerald-100/55">
              {TODAS_QUESTOES.length} questões autorais, com gabarito e comentário. Nenhum link externo: o conteúdo é
              publicado e mantido dentro deste portal.
            </p>
          </div>

          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-emerald-100/45">
              <ShieldQuestion size={12} />
              Como usar
            </p>
            <ol className="mt-2 space-y-1.5 text-[0.74rem] leading-relaxed text-emerald-50/50">
              <li>1. Escolha a disciplina no filtro.</li>
              <li>2. Leia o enunciado e decida antes de abrir.</li>
              <li>3. Confira o gabarito comentado.</li>
              <li>4. Refaça o simulado cronometrado.</li>
            </ol>
          </div>
        </div>
      </div>
    </Section>
  );
}
