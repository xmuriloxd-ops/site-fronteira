import {
  ExternalLink,
  Flag,
  Instagram,
  Mail,
  MessageCircle,
  Radio,
  Shield,
  Target,
  Zap,
} from 'lucide-react';
import type { Settings } from '../types';
import { PageHero } from '../components/PageHero';
import { Crest, Reveal } from '../components/ui';
import { Link } from '../lib/router';

const TIMELINE = [
  {
    year: '1981',
    title: 'Criação da ROTAM',
    text: 'A unidade nasce dentro da Companhia de Policiamento de Choque do 1º Batalhão, com o primeiro pelotão de patrulhamento tático.',
  },
  {
    year: '1988',
    title: 'Doutrina própria',
    text: 'Visita técnica à ROTA/SP consolida a doutrina de patrulhamento tático móvel da corporação goiana.',
  },
  {
    year: '2011',
    title: 'Atualização doutrinária',
    text: 'Revisão completa das normas de emprego da tropa, alinhando a atuação aos parâmetros legais vigentes.',
  },
  {
    year: '2012',
    title: 'Sede própria',
    text: 'A unidade recebe sua primeira sede estruturada, junto ao complexo do autódromo internacional.',
  },
  {
    year: '2024',
    title: 'Nova identidade',
    text: 'Padronização do fardamento e consolidação da identidade visual do batalhão.',
  },
  {
    year: '2026',
    title: 'ROTAM no GTA RP',
    text: 'A tropa passa a operar no servidor de roleplay, mantendo a mesma doutrina e disciplina da unidade real.',
  },
];

const DOCTRINE = [
  {
    icon: Shield,
    title: 'Escudo boleado',
    text: 'Formato clássico da heráldica policial, com a inscrição POLÍCIA MILITAR em branco na faixa superior.',
  },
  {
    icon: Zap,
    title: 'Raio vermelho',
    text: 'Energia, precisão, força e rapidez. Fica ao centro, atravessando a sigla da unidade.',
  },
  {
    icon: Flag,
    title: 'Fundo ouro',
    text: 'Amarelo-ouro representa as ocorrências e a atuação de destaque da tropa.',
  },
  {
    icon: Target,
    title: 'Contorno vermelho',
    text: 'Indica os limites da legalidade nas ações e na atuação sistemática, mesmo com risco para a vida.',
  },
];

const ACTIONS = [
  'Patrulhamento tático móvel em apoio às viaturas de área',
  'Atendimento de ocorrências de alto risco e reféns',
  'Operações de saturação em áreas críticas',
  'Cumprimento de mandados com cobertura tática',
  'Apoio a unidades especializadas em ações conjuntas',
  'Cursos operacionais e formação continuada da tropa',
];

export function AboutPage({ settings }: { settings: Settings }) {
  const contacts = [
    settings.instagram && {
      icon: Instagram,
      label: 'Instagram',
      value: '@' + settings.instagram.replace(/^.*instagram\.com\//, '').replace(/\/$/, ''),
      href: settings.instagram,
    },
    settings.discord && {
      icon: MessageCircle,
      label: 'Discord',
      value: settings.discord.replace(/^https?:\/\//, ''),
      href: settings.discord,
    },
    settings.email && {
      icon: Mail,
      label: 'E-mail',
      value: settings.email,
      href: `mailto:${settings.email}`,
    },
    settings.whatsapp && {
      icon: Radio,
      label: 'WhatsApp',
      value: settings.whatsapp,
      href: settings.whatsapp,
    },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href: string }[];

  return (
    <>
      <PageHero
        kicker="Institucional"
        title={
          <>
            A tropa por trás do <span className="gold-text">raio</span>
          </>
        }
        description={`${settings.unit} · ${settings.server}`}
      />

      <section className="py-16">
        <div className="container-page grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal className="relative flex justify-center lg:justify-start">
            <div className="relative">
              <div className="absolute inset-0 -m-5 border border-ouro/20" />
              <div className="absolute inset-0 -m-12 border border-dashed border-vermelho/20" />
              <Crest className="relative h-80 w-auto drop-shadow-[0_24px_60px_rgba(0,0,0,0.65)]" />
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-8 bg-vermelho" />
              <span className="label">Quem somos</span>
              <Zap className="h-3 w-3 fill-ouro text-ouro" />
            </div>
            <h2 className="display text-4xl text-white sm:text-5xl">
              Pronto-emprego, <span className="gold-text">sempre</span>
            </h2>
            <p className="mt-5 text-[0.98rem] leading-relaxed text-fumaca">{settings.about}</p>

            <blockquote className="mt-7 border-l-2 border-vermelho bg-vermelho/5 px-5 py-4 text-sm italic leading-relaxed text-white/90">
              "O raio no peito não é vaidade: é o compromisso de ser o primeiro a chegar e o último a
              sair."
            </blockquote>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="border border-borda bg-carvao p-5">
                <p className="display text-4xl text-ouro">{settings.foundedYear}</p>
                <p className="mt-1 text-[0.66rem] uppercase tracking-[0.2em] text-fumaca-escura">
                  Ano de criação da doutrina
                </p>
              </div>
              <div className="border border-borda bg-carvao p-5">
                <p className="display text-4xl text-ouro">24h</p>
                <p className="mt-1 text-[0.66rem] uppercase tracking-[0.2em] text-fumaca-escura">
                  Patrulhamento ininterrupto
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Heráldica */}
      <section className="border-y border-white/5 bg-[#0c0a0a] py-16">
        <div className="container-page">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-8 bg-vermelho" />
            <span className="label">Heráldica do brasão</span>
          </div>
          <h2 className="display max-w-3xl text-4xl text-white sm:text-5xl">
            Cada cor tem um <span className="gold-text">significado</span>
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DOCTRINE.map((item, index) => (
              <Reveal key={item.title} delay={index * 70}>
                <div className="h-full border border-borda bg-carvao p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center border border-ouro/25 bg-ouro/5 text-ouro">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-xl uppercase tracking-wide text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-fumaca">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 border border-borda bg-carvao/60 px-5 py-4">
            <Crest className="h-12 w-auto" />
            <p className="text-xs leading-relaxed text-fumaca">
              <span className="text-white">Brevê e flâmula:</span> o raio vermelho com a sigla ROTAM em
              amarelo é usado no braço e na flâmula de desfile, sempre sobre fundo preto.
            </p>
          </div>
        </div>
      </section>

      {/* Linha do tempo */}
      <section className="py-16">
        <div className="container-page">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-8 bg-vermelho" />
            <span className="label">Linha do tempo</span>
          </div>
          <h2 className="display max-w-3xl text-4xl text-white sm:text-5xl">
            Quatro décadas de <span className="gold-text">doutrina</span>
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TIMELINE.map((item, index) => (
              <Reveal key={item.year} delay={index * 60}>
                <div className="group h-full border border-borda bg-carvao p-6 transition-colors hover:border-ouro/40">
                  <div className="flex items-center justify-between">
                    <span className="display text-3xl text-ouro">{item.year}</span>
                    <span className="h-1.5 w-1.5 rotate-45 bg-vermelho" />
                  </div>
                  <h3 className="mt-3 font-display text-lg uppercase tracking-wide text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-fumaca">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Atuação */}
      <section className="border-y border-white/5 bg-[#0c0a0a] py-16">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-8 bg-vermelho" />
              <span className="label">Emprego operacional</span>
            </div>
            <h2 className="display text-4xl text-white sm:text-5xl">
              O que faz o <span className="gold-text">batalhão</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-fumaca">
              Tropa de pronto-emprego e reserva tática especial do comando, a ROTAM é acionada nos
              cenários em que a resposta precisa ser rápida, coordenada e tecnicamente precisa.
            </p>
            <div className="mt-6">
              <Link href="/noticias" className="btn btn-gold">
                Ver operações publicadas
              </Link>
            </div>
          </div>
          <ul className="space-y-3">
            {ACTIONS.map((action) => (
              <li
                key={action}
                className="flex items-start gap-3 border border-borda bg-carvao px-4 py-3 text-sm text-[#d7cfcc]"
              >
                <Zap className="mt-0.5 h-4 w-4 shrink-0 fill-vermelho text-vermelho" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contato */}
      <section className="py-16">
        <div className="container-page">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-8 bg-vermelho" />
            <span className="label">Canais oficiais</span>
          </div>
          <h2 className="display max-w-3xl text-4xl text-white sm:text-5xl">
            Fale com a <span className="gold-text">comunicação</span>
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {contacts.map((contact) => (
              <a
                key={contact.label}
                href={contact.href}
                target={contact.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer noopener"
                className="group card-hover flex flex-col gap-3 border border-borda bg-carvao p-5"
              >
                <div className="flex items-center justify-between">
                  <contact.icon className="h-5 w-5 text-ouro" />
                  <ExternalLink className="h-4 w-4 text-fumaca-escura transition-colors group-hover:text-ouro" />
                </div>
                <div>
                  <p className="text-[0.64rem] uppercase tracking-[0.2em] text-fumaca-escura">
                    {contact.label}
                  </p>
                  <p className="mt-1 truncate text-sm text-white">{contact.value}</p>
                </div>
              </a>
            ))}
            {contacts.length === 0 && (
              <p className="text-sm text-fumaca">
                Os canais oficiais ainda não foram configurados pelo administrador.
              </p>
            )}
          </div>

          <div className="mt-10 border border-borda bg-carvao/50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-xl uppercase tracking-wide text-white">
                  É da tropa?
                </h3>
                <p className="mt-1 text-sm text-fumaca">
                  Acesse a área restrita para publicar notícias e fotos no portal.
                </p>
              </div>
              <Link href="/admin" className="btn btn-outline shrink-0">
                Área do administrador
              </Link>
            </div>
          </div>

          <p className="mt-8 max-w-3xl text-[0.7rem] leading-relaxed text-fumaca-escura">
            Aviso: este é um portal de roleplay (GTA RP). A ROTAM aqui apresentada é uma unidade
            fictícia inspirada na doutrina e na heráldica da Polícia Militar de Goiás, sem vínculo
            oficial com a corporação real. Todo o conteúdo é produzido pela equipe do servidor.
          </p>
        </div>
      </section>
    </>
  );
}
