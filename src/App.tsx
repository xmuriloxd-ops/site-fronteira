import React, { useCallback, useEffect, useState } from 'react';
import { applyPalette, loadConfig, saveConfig, type PageId, type SiteConfig } from './lib/config';
import { SiteHeader } from './components/SiteHeader';
import { Footer } from './components/Footer';
import { Home } from './sections/Home';
import { Edital } from './sections/Edital';
import { Galeria } from './sections/Galeria';
import { Identidade } from './sections/Identidade';
import { Game } from './components/Game';

const VALID: PageId[] = ['inicio', 'edital', 'galeria', 'identidade', 'jogo'];

function pageFromHash(): PageId {
  const hash = window.location.hash.replace('#', '').split('?')[0];
  return (VALID as string[]).includes(hash) ? (hash as PageId) : 'inicio';
}

export default function App() {
  const [config, setConfig] = useState<SiteConfig>(() => loadConfig());
  const [page, setPage] = useState<PageId>(() => pageFromHash());

  useEffect(() => {
    applyPalette(config.palette);
  }, [config.palette]);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((p: PageId) => {
    setPage(p);
    if (window.location.hash !== `#${p}`) {
      history.replaceState(null, '', `#${p}`);
    }
  }, []);

  const update = useCallback((patch: Partial<SiteConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--c-ink)] text-[var(--c-paper)]">
      <SiteHeader page={page} config={config} onNavigate={navigate} />
      <main>
        {page === 'inicio' && <Home config={config} onNavigate={navigate} />}
        {page === 'edital' && <Edital config={config} onUpdate={update} />}
        {page === 'galeria' && <Galeria config={config} onUpdate={update} />}
        {page === 'identidade' && <Identidade config={config} onUpdate={update} />}
        {page === 'jogo' && <Game onExit={() => navigate('inicio')} />}
      </main>
      <Footer config={config} onNavigate={navigate} />
    </div>
  );
}
