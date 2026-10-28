import type { ReactNode } from 'react';
import { Zap } from 'lucide-react';
import { Crest } from './ui';

export function PageHero({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/5 pb-14 pt-36 sm:pt-40">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(254,213,0,0.09),transparent_55%),radial-gradient(circle_at_85%_10%,rgba(237,27,36,0.12),transparent_45%)]" />
      <div className="hazard-thin absolute inset-x-0 bottom-0 h-1 opacity-40" />
      <Crest className="pointer-events-none absolute -right-16 top-16 hidden h-72 w-auto opacity-[0.06] lg:block" />

      <div className="container-page relative">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-vermelho" />
          <span className="label">{kicker}</span>
          <Zap className="h-3 w-3 fill-ouro text-ouro" />
        </div>
        <h1 className="display max-w-4xl text-5xl text-white sm:text-6xl lg:text-7xl">{title}</h1>
        {description && (
          <p className="mt-5 max-w-2xl text-[0.98rem] leading-relaxed text-fumaca">{description}</p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
