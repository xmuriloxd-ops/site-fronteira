import { useMemo, useState } from 'react';
import { Check, X, RotateCcw, Trophy, ChevronRight, Lightbulb, Timer, Shuffle } from 'lucide-react';
import { BANCO_QUESTOES, TODAS_QUESTOES, montarSimulado } from '../data/questoes';
import type { QuestaoSimulado } from '../types';
import { Section, SectionHeading } from './ui';

const QUANTIDADES = [5, 10, 20];

export function SimuladoSection() {
  const [materia, setMateria] = useState('todas');
  const [quantidade, setQuantidade] = useState(10);
  const [questoes, setQuestoes] = useState<QuestaoSimulado[]>(() =>
    montarSimulado(10),
  );
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [atual, setAtual] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  const questao = questoes[atual];
  const respondidas = Object.keys(respostas).length;
  const acertos = useMemo(
    () => questoes.filter((q) => respostas[q.id] === q.correta).length,
    [questoes, respostas],
  );

  const iniciar = () => {
    setQuestoes(montarSimulado(quantidade, materia === 'todas' ? undefined : materia));
    setRespostas({});
    setAtual(0);
    setFinalizado(false);
  };

  const responder = (indice: number) => {
    if (finalizado || !questao) return;
    setRespostas((r) => ({ ...r, [questao.id]: indice }));
  };

  if (!questao) {
    return (
      <Section id="simulado" className="py-16 sm:py-24">
        <SectionHeading eyebrow="Simulado" title="Nenhuma questão disponível" />
      </Section>
    );
  }

  return (
    <Section id="simulado" className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="Simulado cronometrado"
        title={
          <>
            Teste seu <span className="gold-text">nível agora</span>
          </>
        }
        description="Monte um simulado com as questões do banco do portal. A correção é imediata e vem com explicação comentada — sem redirecionar para nenhum site externo."
      />

      {/* Configuração */}
      <div className="card-surface mt-8 rounded-xl p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[10rem]">
            <span className="label">Disciplina</span>
            <select
              className="field py-2 text-[0.8rem]"
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
            >
              <option value="todas" className="bg-ink-900">
                Todas as disciplinas
              </option>
              {BANCO_QUESTOES.map((m) => (
                <option key={m.id} value={m.id} className="bg-ink-900">
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="label">Questões</span>
            <div className="flex gap-1.5">
              {QUANTIDADES.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuantidade(q)}
                  className={`rounded-md border px-3 py-2 text-[0.78rem] font-bold transition ${
                    quantidade === q
                      ? 'border-pmpr-gold/60 bg-pmpr-gold/15 text-pmpr-gold'
                      : 'border-white/10 text-emerald-50/55 hover:border-pmpr-gold/30'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <button onClick={iniciar} className="btn-gold px-4 py-2.5 text-[0.8rem]">
            <Shuffle size={14} />
            Gerar simulado
          </button>

          <p className="ml-auto text-[0.7rem] text-emerald-100/35">
            {TODAS_QUESTOES.length} questões no banco
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        {/* Questão */}
        <div className="card-surface rounded-xl p-5 sm:p-6">
          {!finalizado ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-display rounded-md bg-pmpr-gold/15 px-2 py-1 text-[0.72rem] font-bold text-pmpr-gold">
                    {String(atual + 1).padStart(2, '0')}/{questoes.length}
                  </span>
                  <span className="rounded border border-white/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-100/50">
                    {questao.disciplina}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {questoes.map((q, i) => (
                    <button
                      key={q.id}
                      onClick={() => setAtual(i)}
                      className={`h-1.5 w-4 rounded-full transition ${
                        i === atual
                          ? 'bg-pmpr-gold'
                          : respostas[q.id] !== undefined
                            ? 'bg-emerald-500/70'
                            : 'bg-white/12'
                      }`}
                      aria-label={`Ir para questão ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              <p className="mt-4 text-[0.92rem] leading-relaxed text-white/90">{questao.enunciado}</p>

              <div className="mt-4 space-y-2">
                {questao.alternativas.map((alt, i) => {
                  const escolhida = respostas[questao.id] === i;
                  const correta = i === questao.correta;
                  const temResposta = respostas[questao.id] !== undefined;

                  let estilo = 'border-white/10 bg-white/[0.02] hover:border-pmpr-gold/35 hover:bg-white/[0.05]';
                  if (temResposta && correta) estilo = 'border-emerald-500/60 bg-emerald-500/12';
                  else if (temResposta && escolhida) estilo = 'border-rose-500/50 bg-rose-500/10';

                  return (
                    <button
                      key={alt}
                      onClick={() => responder(i)}
                      disabled={temResposta}
                      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${estilo} ${
                        temResposta ? 'cursor-default' : ''
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border text-[0.7rem] font-bold ${
                          temResposta && correta
                            ? 'border-emerald-400 bg-emerald-500 text-ink-950'
                            : temResposta && escolhida
                              ? 'border-rose-400 bg-rose-500/80 text-white'
                              : 'border-white/20 text-emerald-100/60'
                        }`}
                      >
                        {temResposta && correta ? (
                          <Check size={13} strokeWidth={3} />
                        ) : temResposta && escolhida ? (
                          <X size={13} strokeWidth={3} />
                        ) : (
                          String.fromCharCode(65 + i)
                        )}
                      </span>
                      <span className="text-[0.84rem] leading-snug text-emerald-50/80">{alt}</span>
                    </button>
                  );
                })}
              </div>

              {respostas[questao.id] !== undefined && (
                <div className="mt-4 animate-fade-up rounded-lg border border-pmpr-gold/20 bg-pmpr-gold/[0.06] p-3.5">
                  <p className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-pmpr-gold">
                    <Lightbulb size={12} />
                    Comentário
                  </p>
                  <p className="mt-1 text-[0.8rem] leading-relaxed text-emerald-50/70">{questao.explicacao}</p>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  onClick={() => setAtual((a) => Math.max(0, a - 1))}
                  disabled={atual === 0}
                  className="btn-ghost px-3 py-2 text-[0.78rem] disabled:opacity-30"
                >
                  Anterior
                </button>

                {atual === questoes.length - 1 ? (
                  <button
                    onClick={() => setFinalizado(true)}
                    disabled={respondidas === 0}
                    className="btn-gold px-4 py-2 text-[0.78rem] disabled:opacity-40"
                  >
                    Ver resultado
                    <Trophy size={13} />
                  </button>
                ) : (
                  <button onClick={() => setAtual((a) => a + 1)} className="btn-gold px-4 py-2 text-[0.78rem]">
                    Próxima
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="animate-fade-up py-4 text-center">
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-pmpr-gold/12 blur-xl" />
                <Trophy size={44} className="relative text-pmpr-gold" />
              </div>
              <p className="font-display mt-3 text-4xl font-bold text-white">
                {acertos}
                <span className="text-lg text-emerald-100/40">/{questoes.length}</span>
              </p>
              <p className="mt-1 text-sm font-semibold text-pmpr-gold-soft">
                {acertos / questoes.length >= 0.8
                  ? 'Excelente desempenho — nível de aprovação.'
                  : acertos / questoes.length >= 0.6
                    ? 'Bom caminho. Reforce as disciplinas com erro.'
                    : acertos / questoes.length >= 0.4
                      ? 'Base em construção. Volte ao conteúdo programático.'
                      : 'Comece pelo conteúdo programático e refaça o simulado.'}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-[0.78rem] leading-relaxed text-emerald-50/50">
                A prova da PMPR tem 60 questões. Na última edição, era preciso acertar ao menos 32 pontos no total
                para não ser eliminado.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button onClick={iniciar} className="btn-ghost text-[0.8rem]">
                  <RotateCcw size={14} />
                  Novo simulado
                </button>
                <button
                  onClick={() => {
                    setRespostas({});
                    setAtual(0);
                    setFinalizado(false);
                  }}
                  className="btn-ghost text-[0.8rem]"
                >
                  Refazer este
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Painel lateral */}
        <div className="space-y-3">
          <div className="card-surface rounded-xl p-4">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-emerald-100/40">Progresso</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-pmpr-gold transition-all duration-500"
                style={{ width: `${(respondidas / questoes.length) * 100}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-md border border-white/8 bg-black/25 px-2.5 py-2">
                <p className="text-[0.58rem] uppercase tracking-wider text-emerald-100/35">Respondidas</p>
                <p className="font-display text-lg font-bold text-white">
                  {respondidas}
                  <span className="text-xs text-emerald-100/35">/{questoes.length}</span>
                </p>
              </div>
              <div className="rounded-md border border-white/8 bg-black/25 px-2.5 py-2">
                <p className="text-[0.58rem] uppercase tracking-wider text-emerald-100/35">Acertos</p>
                <p className="font-display text-lg font-bold text-emerald-400">{acertos}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.05] p-4">
            <p className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-amber-300">
              <Timer size={12} />
              Como é a prova
            </p>
            <ul className="mt-2 space-y-1.5 text-[0.76rem] leading-relaxed text-amber-100/65">
              <li>60 questões de múltipla escolha</li>
              <li>40 de conhecimentos gerais (1 ponto)</li>
              <li>20 de conhecimentos específicos (2 pontos)</li>
              <li>Redação de até 30 linhas</li>
              <li>Duração de 5 horas</li>
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
