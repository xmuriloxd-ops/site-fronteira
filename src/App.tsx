import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppConfigPublica, Edital, EditalOverride } from './types';
import { EDITAIS } from './data/editais';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { EditaisSection } from './components/EditaisSection';
import { EditalModal } from './components/EditalModal';
import { UnidadesSection } from './components/UnidadesSection';
import { ProvasSection } from './components/ProvasSection';
import { SimuladoSection } from './components/SimuladoSection';
import { DiscordSection } from './components/DiscordSection';
import { Footer } from './components/Footer';
import { AdminPanel } from './components/AdminPanel';
import { Section } from './components/ui';

const TOKEN_KEY = 'pmpr-admin-token';

export default function App() {
  const [config, setConfig] = useState<AppConfigPublica | null>(null);
  const [overrides, setOverrides] = useState<Record<string, EditalOverride>>({});
  const [editalAberto, setEditalAberto] = useState<string | null>(null);
  const [painelAberto, setPainelAberto] = useState(false);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [editalDiscord, setEditalDiscord] = useState<string | null>(null);

  /* ------------------------------ Configuração ----------------------------- */

  const carregarConfig = useCallback(async () => {
    try {
      const r = await fetch('/api/public/config');
      if (!r.ok) return;
      const dados = (await r.json()) as AppConfigPublica;
      setConfig(dados);
      setOverrides(dados.overrides ?? {});
    } catch {
      /* servidor offline: mantém os dados locais */
    }
  }, []);

  useEffect(() => {
    void carregarConfig();
  }, [carregarConfig]);

  /* --------------------------------- Editais -------------------------------- */

  const editais = useMemo<Edital[]>(
    () =>
      EDITAIS.map((e) => ({
        ...e,
        status: overrides[e.id]?.status ?? e.status,
      })),
    [overrides],
  );

  const avisos = useMemo(
    () =>
      EDITAIS.flatMap((e) => {
        const texto = overrides[e.id]?.aviso?.trim();
        return texto ? [{ id: e.id, sigla: e.sigla, texto }] : [];
      }),
    [overrides],
  );

  const editalSelecionado = useMemo(
    () => editais.find((e) => e.id === editalAberto) ?? null,
    [editais, editalAberto],
  );

  /* -------------------------------- Ações UI -------------------------------- */

  const abrirEdital = (id: string) => {
    setPainelAberto(false);
    setEditalAberto(id);
  };

  const irParaDiscord = (editalId: string) => {
    setEditalDiscord(editalId);
    setEditalAberto(null);
    requestAnimationFrame(() => {
      document.getElementById('discord')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const aoEntrar = (novoToken: string) => {
    setToken(novoToken);
    localStorage.setItem(TOKEN_KEY, novoToken);
    setPainelAberto(true);
  };

  const sair = () => {
    if (token) {
      void fetch('/api/admin/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    }
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    setPainelAberto(false);
  };

  return (
    <div className="min-h-screen bg-ink-950 text-emerald-50">
      <Header
        adminLogado={Boolean(token)}
        onAdminClick={() => setPainelAberto(true)}
        onSair={sair}
      />

      <main>
        <Hero editais={editais} onAbrir={abrirEdital} />

        <EditaisSection editais={editais} onAbrir={abrirEdital} onDiscord={irParaDiscord} />

        {/* Faixa de avisos do comando */}
        {avisos.length > 0 && (
          <Section className="pb-4">
            <div className="space-y-2">
              {avisos.map((aviso) => (
                <div
                  key={aviso.id}
                  className="flex items-start gap-3 rounded-lg border border-pmpr-gold/25 bg-pmpr-gold/[0.06] px-4 py-3"
                >
                  <span className="font-display shrink-0 rounded bg-pmpr-gold/15 px-2 py-0.5 text-[0.68rem] font-bold tracking-wide text-pmpr-gold">
                    {aviso.sigla}
                  </span>
                  <p className="text-[0.8rem] leading-relaxed text-pmpr-gold-soft/85">{aviso.texto}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        <UnidadesSection />

        <div className="relative">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
          <div className="relative">
            <ProvasSection />
            <SimuladoSection />
          </div>
        </div>

        <DiscordSection
          config={config}
          editalPreSelecionado={editalDiscord}
          onAtualizarConfig={carregarConfig}
        />
      </main>

      <Footer onAdminClick={() => setPainelAberto(true)} />

      {editalSelecionado && (
        <EditalModal
          edital={editalSelecionado}
          aviso={overrides[editalSelecionado.id]?.aviso}
          onClose={() => setEditalAberto(null)}
          onDiscord={irParaDiscord}
        />
      )}

      {painelAberto && (
        <AdminPanel
          token={token}
          onLogin={aoEntrar}
          onClose={() => setPainelAberto(false)}
          onLogout={sair}
          onConfigChange={carregarConfig}
        />
      )}
    </div>
  );
}
