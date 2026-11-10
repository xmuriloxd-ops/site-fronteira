import { Shield, Radar, Crosshair, CalendarClock, Target, MapPinned } from 'lucide-react';
import { Section, SectionHeading, TOM_COLORS } from './ui';

const UNIDADES = [
  {
    tom: 'pmpr' as const,
    Icon: Shield,
    sigla: 'PMPR',
    nome: 'Polícia Militar do Paraná',
    fundacao: '10 de agosto de 1854',
    resumo:
      'Criada como Companhia de Força Policial da Província do Paraná, é a força responsável pelo policiamento ostensivo e pela preservação da ordem pública nos 399 municípios do estado. Atua por meio de batalhões de área, companhias independentes e unidades especializadas.',
    fatos: [
      { Icon: CalendarClock, label: '1854', texto: 'ano de criação' },
      { Icon: MapPinned, label: '399', texto: 'municípios atendidos' },
      { Icon: Target, label: 'RPA', texto: 'base do policiamento' },
    ],
  },
  {
    tom: 'rotam' as const,
    Icon: Radar,
    sigla: 'ROTAM',
    nome: 'Rondas Ostensivas Tático Móveis',
    fundacao: 'pelotões nos batalhões de área',
    resumo:
      'Tropa de patrulhamento tático motorizado que atua no 2º e 3º esforço, dando suporte às guarnições de radiopatrulha. É empregada em ocorrências de alto risco, bloqueios, operações de presença, controle de distúrbios civis e grandes eventos.',
    fatos: [
      { Icon: Target, label: 'Tático', texto: 'patrulhamento motorizado' },
      { Icon: Radar, label: 'Suporte', texto: 'apoio à RPA' },
      { Icon: CalendarClock, label: '8 sem.', texto: 'curso operacional' },
    ],
  },
  {
    tom: 'rone' as const,
    Icon: Crosshair,
    sigla: 'RONE',
    nome: 'Rondas Ostensivas de Natureza Especial',
    fundacao: '13 de julho de 1992',
    resumo:
      'Unidade de elite criada para ocupar a faixa de reação entre o policiamento básico e as ações de choque. Transformada em batalhão (BPRONE) em 2022, atua contra o crime organizado, em escoltas, retomada de pontos sensíveis e crise de reféns.',
    fatos: [
      { Icon: CalendarClock, label: '1992', texto: 'ano de criação' },
      { Icon: Crosshair, label: 'BPRONE', texto: 'batalhão desde 2022' },
      { Icon: Target, label: 'Alto risco', texto: 'operações especiais' },
    ],
  },
];

export function UnidadesSection() {
  return (
    <Section id="unidades" className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="Saiba onde está pisando"
        title={
          <>
            Conheça as <span className="gold-text">três unidades</span>
          </>
        }
        description="Antes de preencher o formulário, entenda a missão de cada tropa. A rotina, o preparo físico e as exigências mudam bastante de uma unidade para outra."
        align="center"
      />

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {UNIDADES.map(({ tom, Icon, sigla, nome, fundacao, resumo, fatos }) => {
          const c = TOM_COLORS[tom];
          return (
            <article
              key={sigla}
              className="relative overflow-hidden rounded-xl border border-white/8 bg-white/[0.025] p-5 transition hover:border-pmpr-gold/25"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] opacity-80" style={{ background: c.cor }} />
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg border"
                  style={{ background: `${c.cor}26`, borderColor: `${c.texto}33` }}
                >
                  <Icon size={18} style={{ color: c.texto }} />
                </div>
                <div>
                  <p className="font-display text-lg font-bold tracking-wide" style={{ color: c.texto }}>
                    {sigla}
                  </p>
                  <p className="text-[0.66rem] uppercase tracking-wider text-emerald-100/35">{fundacao}</p>
                </div>
              </div>

              <h3 className="mt-4 text-[0.88rem] font-semibold leading-snug text-white">{nome}</h3>
              <p className="mt-2 text-[0.78rem] leading-relaxed text-emerald-50/50">{resumo}</p>

              <div className="mt-4 grid grid-cols-3 gap-1.5">
                {fatos.map(({ Icon: FIcon, label, texto }) => (
                  <div key={texto} className="rounded-md border border-white/6 bg-black/25 px-2 py-2 text-center">
                    <FIcon size={11} className="mx-auto" style={{ color: c.texto }} />
                    <p className="font-display mt-1 text-[0.82rem] font-bold leading-none text-white">{label}</p>
                    <p className="mt-1 text-[0.55rem] uppercase leading-tight tracking-wider text-emerald-100/35">
                      {texto}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
