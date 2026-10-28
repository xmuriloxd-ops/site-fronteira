import React, { useEffect, useState } from 'react';

const NAVIGATE_EVENT = 'rotam:navigate';

export function usePathname(): string {
  const [path, setPath] = useState(
    typeof window === 'undefined' ? '/' : window.location.pathname + window.location.search,
  );

  useEffect(() => {
    const sync = () => setPath(window.location.pathname + window.location.search);
    window.addEventListener('popstate', sync);
    window.addEventListener(NAVIGATE_EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(NAVIGATE_EVENT, sync);
    };
  }, []);

  return path;
}

export function navigate(to: string, options: { replace?: boolean; keepScroll?: boolean } = {}) {
  const current = window.location.pathname + window.location.search;
  if (to === current) {
    if (!options.keepScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  window.history[options.replace ? 'replaceState' : 'pushState']({}, '', to);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
  if (!options.keepScroll) window.scrollTo({ top: 0, behavior: 'auto' });
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export function Link({ href, children, onClick, ...rest }: LinkProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (!href.startsWith('/')) return;
    event.preventDefault();
    navigate(href);
  };

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

export function scrollToId(id: string) {
  const element = document.getElementById(id);
  if (element) {
    const top = element.getBoundingClientRect().top + window.scrollY - 84;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}
