import React from 'react';
import {
  ArrowRight,
  Shield,
  Radio,
  Target,
  Calendar,
  FileText,
  Users,
  Clock,
  Crosshair,
  ChevronRight,
  Gamepad2,
  ImagePlus,
  Palette,
} from 'lucide-react';
import type { PageId, SiteConfig } from '../lib/config';
import { formatDate } from '../lib/config';
import { Crest } from '../components/Crest';

interface Props {
  config: SiteConfig;
  onNavigate: (p: PageId) => void;
}

const PILLARS = [
  {
    icon: Shield,
    titulo: 'Pronta-resposta',
    texto: 'Emprego imediato em ocorrências de alta complexidade, com frações treinadas para intervir com precisão.',
  },
  {
    icon: Target,
    titulo: 'Precisão tática',
    texto: 'Doutrina de patrulhamento ostensivo, abordagem e contenção com foco na preservação de vidas.',
  },
  {
    icon: Radio,
    titulo: 'Comando integrado',
    texto: 'Comunicação e coordenação com o Batalhão de Operações Especiais e demais frações da PMPR.',
  },
  {
    icon: Crosshair,
    titulo: 'Formação contínua',
    texto: 'Treinamento permanente em tiro, tática, direitos humanos e uso diferenciado da força.',
  },
];

export function Home({ config, onNavigate }: Props) {
  const cover = config.photos[0]?.src ?? '/images/hero-viatura.jpg';
  const gallerySlice = config.photos.slice(0, 3);

  return (
    <div>
      {/* ---------------- HERO ---------------- */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={cover} alt="Viatura da RONE em patrulhamento noturno" className="h-full w-full object-cover" />
          <div className="absolute inset-0 hero-overlay" />
          <div className="absolute inset-0 grid-texture opacity-70" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="animate-rise">
              <div className="inline-flex items-center gap-2 border border-[var(--c-gold)]/40 bg-[var(--c-gold)]/10 px-3 py-1.5">
                <span className="h-1.5 w-1.5 animate-pulse-slow rounded-full bg-[var(--c-gold)]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--c-gold)]">
                  Edital de ingresso {config.edital.ano} · inscrições abertas
                </span>
              </div>

              <h1 className="font-display mt-6 text-5xl font-extrabold uppercase leading-[0.92] tracking-tight sm:text-6xl lg:text-7xl">
                {config.sigla}
                <span className="mt-2 block text-[0.42em] font-bold leading-tight tracking-[0.12em] text-[var(--c-gold)]">
                  {config.nome}
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--c-paper)]/75 sm:text-lg">
                {config.slogan} Conheça a unidade, leia o edital completo e faça sua pré-inscrição para o curso de
                formação de operador.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate('edital')}
                  className="clip-btn group inline-flex items-center gap-2 bg-[var(--c-gold)] px-7 py-3.5 text-sm font-extrabold uppercase tracking-[0.16em] text-black transition hover:brightness-110"
                >
                  Ler o edital
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => onNavigate('jogo')}
                  className="clip-btn inline-flex items-center gap-2 border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.16em] backdrop-blur transition hover:border-[var(--c-gold)] hover:text-[var(--c-gold)]"
                >
                  <Gamepad2 className="h-4 w-4" /> Jogar Operação RONE
                </button>
              </div>

              <dl className="mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-white/15 pt-6">
                {[
                  { k: 'Vagas', v: config.edital.vagas, i: Users },
                  { k: 'Inscrições até', v: formatDate(config.edital.encerramento).replace(' de ', '/').slice(0, 10), i: Calendar },
                  { k: 'Carga horária', v: config.edital.cargaHoraria, i: Clock },
                ].map(({ k, v, i: Icon }) => (
                  <div key={k}>
                    <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--c-paper)]/50">
                      <Icon className="h-3 w-3" /> {k}
                    </dt>
                    <dd className="font-display mt-1 text-xl font-bold text-[var(--c-paper)]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* painel lateral */}
            <div className="clip-corner card relative p-6 sm:p-8">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--c-gold)]/10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--c-gold)]">Identidade da unidade</p>
                  <h2 className="font-display mt-2 text-2xl font-extrabold uppercase leading-tight">
                    {config.unidade.split('·')[0]}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--c-paper)]/55">{config.cidade}</p>
                </div>
                {config.logoDataUrl ? (
                  <img src={config.logoDataUrl} alt="Logo da unidade" className="h-16 w-16 object-contain" />
                ) : (
                  <Crest className="h-20 w-16" />
                )}
              </div>

              <div className="mt-6 space-y-3">
                {[
                  ['Etapa inicial', 'Pré-inscrição online'],
                  ['Prova / TAF', formatDate(config.edital.prova)],
                  ['Banca', config.edital.banca],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 text-sm">
                    <span className="text-[var(--c-paper)]/55">{k}</span>
                    <span className="text-right font-semibold">{v}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate('galeria')}
                className="mt-6 flex w-full items-center justify-between gap-2 border border-dashed border-[var(--c-gold)]/40 px-4 py-3 text-left text-xs uppercase tracking-[0.16em] text-[var(--c-gold)] transition hover:bg-[var(--c-gold)]/10"
              >
                <span className="flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" /> Adicionar fotos e logos
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onNavigate('identidade')}
                className="mt-2 flex w-full items-center justify-between gap-2 border border-dashed border-white/20 px-4 py-3 text-left text-xs uppercase tracking-[0.16em] text-[var(--c-paper)]/70 transition hover:border-[var(--c-gold)] hover:text-[var(--c-gold)]"
              >
                <span className="flex items-center gap-2">
                  <Palette className="h-4 w-4" /> Mudar as cores do site
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="stripe-gold h-1.5 w-full opacity-80" />
      </section>

      {/* ---------------- PILARES ---------------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--c-gold)]">A unidade</p>
            <h2 className="font-display mt-2 text-4xl font-extrabold uppercase tracking-wide sm:text-5xl">
              Doutrina e emprego
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-[var(--c-paper)]/60">
            A {config.sigla} atua no policiamento ostensivo especializado, com frações motorizadas de pronto
            emprego em apoio às unidades territoriais.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ icon: Icon, titulo, texto }) => (
            <article
              key={titulo}
              className="card group relative overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:border-[var(--c-gold)]/50"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] scale-x-0 bg-[var(--c-gold)] transition-transform duration-300 group-hover:scale-x-100" />
              <Icon className="h-7 w-7 text-[var(--c-gold)]" />
              <h3 className="font-display mt-4 text-xl font-bold uppercase tracking-wide">{titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--c-paper)]/60">{texto}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------- GALERIA PREVIEW ---------------- */}
      <section className="border-y border-white/10 bg-black/25">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--c-gold)]">Galeria</p>
              <h2 className="font-display mt-2 text-4xl font-extrabold uppercase tracking-wide sm:text-5xl">
                Registros da tropa
              </h2>
            </div>
            <button
              onClick={() => onNavigate('galeria')}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-gold)] hover:underline"
            >
              Ver galeria completa <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {gallerySlice.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => onNavigate('galeria')}
                className={`group relative overflow-hidden text-left ${idx === 0 ? 'md:col-span-2 md:row-span-1' : ''}`}
              >
                <img
                  src={photo.src}
                  alt={photo.title}
                  className={`w-full object-cover transition duration-500 group-hover:scale-[1.04] ${
                    idx === 0 ? 'h-64 md:h-80' : 'h-64'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-display text-lg font-bold uppercase tracking-wide">{photo.title}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--c-paper)]/60">{photo.caption}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CTA EDITAL ---------------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="clip-corner relative overflow-hidden border border-[var(--c-gold)]/30 bg-[var(--c-ink-2)] p-8 sm:p-12">
          <div className="absolute inset-0 grid-texture opacity-40" />
          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--c-gold)]">
                Processo seletivo interno · {config.edital.numero}
              </p>
              <h2 className="font-display mt-3 text-4xl font-extrabold uppercase leading-[1] tracking-wide sm:text-5xl">
                Sua vaga na tropa de elite começa com uma decisão
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--c-paper)]/70">
                Inscrições de {formatDate(config.edital.abertura)} a {formatDate(config.edital.encerramento)}.
                Confira requisitos, etapas, tabela do TAF e o passo a passo da pré-inscrição.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate('edital')}
                  className="clip-btn inline-flex items-center gap-2 bg-[var(--c-gold)] px-6 py-3 text-sm font-extrabold uppercase tracking-[0.16em] text-black"
                >
                  <FileText className="h-4 w-4" /> Abrir edital
                </button>
                <button
                  onClick={() => onNavigate('edital')}
                  className="clip-btn inline-flex items-center gap-2 border border-white/25 px-6 py-3 text-sm font-bold uppercase tracking-[0.16em]"
                >
                  Formulário de pré-inscrição
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ['Vagas', config.edital.vagas],
                ['Reserva', config.edital.vagasReserva],
                ['Taxa', config.edital.taxa],
                ['Prova', formatDate(config.edital.prova)],
              ].map(([k, v]) => (
                <div key={k} className="border border-white/15 bg-black/25 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-paper)]/50">{k}</p>
                  <p className="font-display mt-1 text-xl font-extrabold text-[var(--c-gold)]">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
