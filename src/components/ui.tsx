import React, { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';

export function Crest({
  className = '',
  glow = false,
}: {
  className?: string;
  glow?: boolean;
}) {
  return (
    <img
      src="/img/marca/brasao-rotam.png"
      alt="Brasão da ROTAM — Polícia Militar"
      className={`${className} ${glow ? 'animate-glow' : ''} select-none`}
      draggable={false}
    />
  );
}

export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.04, rootMargin: '0px 0px -24px 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  kicker,
  title,
  description,
  align = 'left',
  action,
}: {
  kicker?: string;
  title: React.ReactNode;
  description?: string;
  align?: 'left' | 'center';
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-5 md:flex-row md:items-end md:justify-between ${
        align === 'center' ? 'text-center md:flex-col md:items-center' : ''
      }`}
    >
      <div className={align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl'}>
        {kicker && (
          <div
            className={`mb-3 flex items-center gap-3 ${align === 'center' ? 'justify-center' : ''}`}
          >
            <span className="h-px w-8 bg-vermelho" />
            <span className="label">{kicker}</span>
            <Zap className="h-3 w-3 fill-ouro text-ouro" />
          </div>
        )}
        <h2 className="display text-4xl text-white sm:text-5xl">{title}</h2>
        {description && (
          <p className="mt-4 text-[0.98rem] leading-relaxed text-fumaca">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CategoryBadge({
  category,
  solid = false,
  className = '',
}: {
  category: string;
  solid?: boolean;
  className?: string;
}) {
  const styles = solid
    ? 'bg-ouro text-preto'
    : 'bg-black/60 text-ouro border border-ouro/40 backdrop-blur-sm';
  return (
    <span className={`tag ${styles} ${className}`}>
      <Zap className="h-3 w-3 fill-current" />
      {category}
      </span>
  );
}

export function GoldRule({ className = '' }: { className?: string }) {
  return (
    <div className={`flex h-1.5 w-full overflow-hidden ${className}`}>
      <span className="h-full w-1/3 bg-ouro" />
      <span className="h-full w-1/5 bg-vermelho" />
      <span className="h-full flex-1 bg-grafite" />
    </div>
  );
}

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <span
      className={`${className} inline-block animate-spin rounded-full border-2 border-current border-t-transparent`}
      aria-hidden="true"
    />
  );
}
