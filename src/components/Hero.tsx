import { ArrowRight, Camera, Sparkles, Zap } from 'lucide-react';
import { Link } from '../lib/router';
import type { Settings } from '../types';
import { Crest } from './ui';

export function Hero({ settings, postCount, photoCount }: { settings: Settings; postCount: number; photoCount: number }) {
  const stats = [
    { label: 'Notícias publicadas', value: String(postCount).padStart(2, '0') },
    { label: 'Registros na galeria', value: String(photoCount).padStart(2, '0') },
    { label: 'Doutrina desde', value: settings.foundedYear || '1981' },
    { label: 'Patrulhamento', value: '24h' },
  ];

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pt-28">
      <div className="absolute inset-0 -z-20">
        <img
          src={settings.heroImage || '/img/hero-operacao.jpg'}
          alt="Operador da ROTAM em patrulhamento noturno"
          className="h-full w-full object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#080707] via-[#080707]/85 to-[#080707]/20" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#080707] via-transparent to-[#080707]/70" />
      <div className="absolute -left-40 top-1/3 -z-10 h-[34rem] w-[34rem] rounded-full bg-ouro/10 blur-[130px]" />
      <div className="absolute -right-32 top-10 -z-10 h-96 w-96 rounded-full bg-vermelho/20 blur-[120px]" />

      <Crest className="pointer-events-none absolute right-2 top-24 h-56 w-auto opacity-[0.13] sm:h-64 lg:hidden" />

      <div className="container-page relative grid flex-1 items-center gap-10 pb-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="animate-rise">
          <div className="mb-6 inline-flex items-center gap-3 border border-ouro/25 bg-black/40 px-3.5 py-1.5 backdrop-blur">
            <Zap className="h-3.5 w-3.5 fill-ouro text-ouro" />
            <span className="font-display text-[0.7rem] uppercase tracking-[0.28em] text-ouro">
              Polícia Militar · {settings.server}
            </span>
          </div>

          <h1 className="display text-[clamp(3.4rem,10vw,7.4rem)] text-white">
            <span className="block text-[0.3em] font-semibold tracking-[0.42em] text-fumaca">
              ROTAM GOIÁS
            </span>
            <span className="gold-text block drop-shadow-[0_10px_40px_rgba(254,213,0,0.18)]">
              {settings.heroTitle || 'Raio Imortal'}
            </span>
          </h1>

          <div className="mt-5 flex items-center gap-3">
            <span className="h-1 w-14 bg-vermelho" />
            <span className="font-display text-xs uppercase tracking-[0.3em] text-fumaca-escura">
              Rondas Ostensivas Táticas Metropolitanas
            </span>
          </div>

          <p className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-[#cfc7c4] text-pretty">
            {settings.heroSubtitle}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/noticias" className="btn btn-gold">
              Últimas notícias
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/galeria" className="btn btn-outline">
              <Camera className="h-4 w-4" />
              Galeria de operações
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-fumaca-escura">
            <Sparkles className="h-3.5 w-3.5 text-ouro" />
            <span>Portfólio oficial do batalhão no roleplay</span>
          </div>
        </div>

        {/* Brasão */}
        <div className="relative hidden justify-center lg:flex">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-[26rem] w-[26rem] rounded-full border border-ouro/15" />
            <div className="absolute h-[33rem] w-[33rem] rounded-full border border-ouro/10" />
            <div className="absolute h-[20rem] w-[20rem] rounded-full border border-dashed border-vermelho/25" />
          </div>
          <Crest
            glow
            className="relative h-[24rem] w-auto drop-shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
          />
          <div className="absolute -right-2 top-6 hidden flex-col items-end gap-1 xl:flex">
            <span className="font-display text-[0.62rem] uppercase tracking-[0.3em] text-fumaca-escura">
              Heráldica
            </span>
            <span className="h-px w-16 bg-ouro/40" />
            <span className="font-display text-[0.62rem] uppercase tracking-[0.3em] text-fumaca-escura">
              Raio · Ouro · Vermelho
            </span>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="relative border-t border-white/10 bg-[#080707]/70 backdrop-blur-md">
        <div className="container-page grid grid-cols-2 gap-y-5 py-6 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`flex flex-col gap-1 px-2 md:px-6 ${
                index !== 0 ? 'md:border-l md:border-white/10' : ''
              }`}
            >
              <span className="display text-3xl text-ouro md:text-4xl">{stat.value}</span>
              <span className="text-[0.66rem] uppercase tracking-[0.2em] text-fumaca-escura">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Marquee() {
  const items = [
    'Raio Imortal',
    'Patrulhamento tático',
    'Disciplina',
    'Tropa de pronto-emprego',
    'GTA RP',
    'Legalidade',
    'ROTAM Goiás',
  ];
  const loop = [...items, ...items, ...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-ouro/20 bg-[#0d0b0b] py-3">
      <div className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap">
        {loop.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-8">
            <span className="font-display text-sm uppercase tracking-[0.32em] text-fumaca">
              {item}
            </span>
            <Zap className="h-3.5 w-3.5 fill-vermelho text-vermelho" />
          </span>
        ))}
      </div>
    </div>
  );
}
