import { ArrowRight, Camera, ChevronRight, Shield, Target, Zap } from 'lucide-react';
import { Link } from '../lib/router';
import type { Bootstrap } from '../types';
import { Hero, Marquee } from '../components/Hero';
import { NewsCard } from '../components/NewsCard';
import { Crest, Reveal, SectionHeading } from '../components/ui';

const HERALDRY = [
  {
    color: '#fed500',
    title: 'Ouro',
    text: 'Fundo amarelo-ouro do escudo: simboliza as ocorrências e a atuação de destaque da tropa.',
  },
  {
    color: '#ed1b24',
    title: 'Vermelho',
    text: 'Contorno e raio: energia, precisão, força e rapidez — dentro dos limites da legalidade.',
  },
  {
    color: '#231f20',
    title: 'Preto',
    text: 'Sigla ROTAM e faixa superior: a doutrina, a disciplina e o peso da farda.',
  },
];

export function HomePage({ data }: { data: Bootstrap }) {
  const { settings, posts, photos } = data;
  const featured = posts.find((post) => post.featured) ?? posts[0];
  const rest = posts.filter((post) => post.id !== featured?.id).slice(0, 3);
  const galleryPreview = photos.slice(0, 5);

  return (
    <>
      <Hero settings={settings} postCount={posts.length} photoCount={photos.length} />
      <Marquee />

      {/* Notícias */}
      <section className="relative py-20 sm:py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              kicker="Sala de imprensa"
              title={
                <>
                  Últimas do <span className="gold-text">batalhão</span>
                </>
              }
              description="Operações, cursos, formaturas e comunicados oficiais do Batalhão ROTAM no servidor."
              action={
                <Link href="/noticias" className="btn btn-outline">
                  Todas as notícias
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
          </Reveal>

          {featured ? (
            <div className="mt-10 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
              <Reveal>
                <NewsCard post={featured} variant="featured" />
              </Reveal>
              <Reveal delay={120}>
                <div className="flex h-full flex-col border border-borda bg-carvao p-6">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="h-px w-6 bg-vermelho" />
                    <span className="label">Também na pauta</span>
                  </div>
                  <div className="flex flex-1 flex-col">
                    {rest.map((post) => (
                      <NewsCard key={post.id} post={post} variant="row" />
                    ))}
                    {rest.length === 0 && (
                      <p className="py-6 text-sm text-fumaca">Nenhuma outra notícia publicada ainda.</p>
                    )}
                  </div>
                  <Link
                    href="/noticias"
                    className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 font-display text-xs uppercase tracking-[0.24em] text-fumaca transition-colors hover:text-ouro"
                  >
                    Arquivo completo
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
            </div>
          ) : (
            <p className="mt-10 text-fumaca">Nenhuma notícia publicada ainda.</p>
          )}
        </div>
      </section>

      {/* Galeria */}
      <section className="relative border-y border-white/5 bg-[#0c0a0a] py-20 sm:py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              kicker="Registros operacionais"
              title={
                <>
                  A tropa em <span className="gold-text">imagens</span>
                </>
              }
              description="Momentos de instrução, patrulhamento e cerimônias registrados pela equipe de comunicação."
              action={
                <Link href="/galeria" className="btn btn-outline">
                  <Camera className="h-4 w-4" />
                  Galeria completa
                </Link>
              }
            />
          </Reveal>

          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {galleryPreview.map((photo, index) => (
              <Reveal
                key={photo.id}
                delay={index * 80}
                className={index === 0 ? 'col-span-2 row-span-2' : ''}
              >
                <Link
                  href="/galeria"
                  className="group relative block h-full overflow-hidden border border-borda bg-grafite"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    loading="lazy"
                    className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                      index === 0 ? 'h-full min-h-[18rem]' : 'aspect-square'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="tag bg-black/50 text-ouro backdrop-blur-sm">{photo.tag}</span>
                    <p className="mt-2 hidden text-sm leading-snug text-white/90 sm:line-clamp-2">
                      {photo.caption}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Heráldica / Sobre */}
      <section className="relative overflow-hidden py-20 sm:py-24">
        <div className="absolute -right-40 top-1/4 h-[28rem] w-[28rem] rounded-full bg-ouro/5 blur-[120px]" />
        <div className="container-page grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal className="relative flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 -m-6 rounded-full border border-ouro/15" />
              <div className="absolute inset-0 -m-14 rounded-full border border-dashed border-vermelho/20" />
              <Crest className="relative h-72 w-auto drop-shadow-[0_24px_60px_rgba(0,0,0,0.65)]" />
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-8 bg-vermelho" />
              <span className="label">Sobre o batalhão</span>
              <Zap className="h-3 w-3 fill-ouro text-ouro" />
            </div>
            <h2 className="display text-4xl text-white sm:text-5xl">
              Doutrina, técnica e <span className="gold-text">presença</span>
            </h2>
            <p className="mt-5 max-w-xl text-[0.98rem] leading-relaxed text-fumaca">
              {settings.about}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {HERALDRY.map((item) => (
                <div key={item.title} className="border border-borda bg-carvao/70 p-4">
                  <span
                    className="mb-3 block h-1.5 w-10"
                    style={{ backgroundColor: item.color }}
                  />
                  <h3 className="font-display text-lg uppercase tracking-wide text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-fumaca">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/sobre" className="btn btn-gold">
                Conheça a unidade
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/galeria" className="btn btn-outline">
                <Camera className="h-4 w-4" />
                Ver registros
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Faixa de valores */}
      <section className="border-y border-white/5 bg-[#0c0a0a]">
        <div className="container-page grid gap-8 py-12 md:grid-cols-3">
          {[
            {
              icon: Shield,
              title: 'Legalidade',
              text: 'Uso diferenciado da força com respaldo técnico e jurídico em cada ação.',
            },
            {
              icon: Target,
              title: 'Precisão',
              text: 'Planejamento de inteligência e execução coordenada em ocorrências de alto risco.',
            },
            {
              icon: Zap,
              title: 'Rapidez',
              text: 'Tropa de pronto-emprego, acionada a qualquer hora, em qualquer ponto da capital.',
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-ouro/25 bg-ouro/5 text-ouro">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-xl uppercase tracking-wide text-white">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-fumaca">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-20">
        <div className="container-page">
          <div className="relative overflow-hidden border border-ouro/25 bg-gradient-to-br from-[#171213] via-[#0e0c0c] to-[#171213] px-6 py-12 sm:px-12">
            <div className="absolute inset-y-0 left-0 w-1.5 hazard-thin" />
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-ouro/10 blur-[90px]" />
            <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-2xl">
                <span className="label">Comunicação social</span>
                <h2 className="display mt-3 text-4xl text-white sm:text-5xl">
                  Acompanhe o <span className="gold-text">Raio Imortal</span>
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-fumaca">
                  Cobertura de operações, formaturas e instruções direto do batalhão. Todo o material
                  é produzido pela equipe de comunicação da unidade no servidor.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/noticias" className="btn btn-gold">
                  Ler notícias
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/sobre" className="btn btn-outline">
                  Falar com o comando
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
