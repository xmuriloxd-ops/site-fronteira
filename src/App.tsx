import { useCallback, useEffect, useState } from 'react';
import type { AppConfigPublica } from './types';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { RecrutamentoCard } from './components/RecrutamentoCard';
import { FichasUnidadeSection } from './components/FichasUnidadeSection';
import { FORMULARIOS_UNIDADE } from './data/fichas-unidade';
import { FormularioModal } from './components/FormularioModal';
import { UnidadesSection } from './components/UnidadesSection';
import { DiscordSection } from './components/DiscordSection';
import { Footer } from './components/Footer';
import { AdminPanel } from './components/AdminPanel';

const TOKEN_KEY = 'pmpr-admin-token';

export default function App() {
  const [config, setConfig] = useState<AppConfigPublica | null>(null);
  // null = fechado; 'fronteira-sul' = formulário do 13º BPM; demais = ficha de unidade
  const [formularioAberto, setFormularioAberto] = useState<string | null>(null);
  const [painelAberto, setPainelAberto] = useState(false);
  // Sessão sempre começa vazia: não há login automático.
  // O comando precisa digitar login e senha a cada acesso.
  const [token, setToken] = useState<string | null>(null);

  /* ------------------------------ Configuração ----------------------------- */

  const carregarConfig = useCallback(async () => {
    try {
      const r = await fetch('/api/public/config');
      if (!r.ok) return;
      const dados = (await r.json()) as AppConfigPublica;
      setConfig(dados);
    } catch {
      /* servidor offline: mantém os dados locais */
    }
  }, []);

  useEffect(() => {
    void carregarConfig();
  }, [carregarConfig]);

  // Versões antigas guardavam a sessão no navegador e entravam sozinhas.
  // Isso acabou: limpamos o resquício para exigir login sempre.
  useEffect(() => {
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  // Remove o service worker de versões antigas do portal: ele podia servir
  // JavaScript em cache e manter o painel do comando no código velho.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    void navigator.serviceWorker
      .getRegistrations()
      .then((registros) => Promise.all(registros.map((r) => r.unregister())))
      .catch(() => {
        /* navegador sem suporte ou bloqueado: segue sem service worker */
      });
    if ('caches' in window) {
      void caches
        .keys()
        .then((nomes) => Promise.all(nomes.map((nome) => caches.delete(nome))))
        .catch(() => {
          /* sem caches a limpar */
        });
    }
  }, []);

  /* -------------------------------- Ações UI -------------------------------- */

  const aoEntrar = (novoToken: string) => {
    setToken(novoToken);
    setPainelAberto(true);
  };

  // O painel avisa quando consegue falar com o servidor: garante que o token
  // do App fique igual ao que está funcionando (evita voltar ao login).
  const sincronizarToken = (usado: string) => {
    setToken((atual) => (atual === usado ? atual : usado));
  };

  // Limpa apenas o token, mantendo o painel aberto para o login
  const limparSessao = () => {
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
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
        <Hero
          onAbrirFormulario13={() => setFormularioAberto('fronteira-sul')}
          onAbrirFicha={(id) => setFormularioAberto(id)}
        />

        <RecrutamentoCard
          onAbrirFormulario={() => setFormularioAberto('fronteira-sul')}
          totalInscricoes={config?.inscricoes ?? 0}
        />

        <FichasUnidadeSection
          onAbrirFicha={(id) => setFormularioAberto(id)}
          totalInscricoes={config?.inscricoes ?? 0}
        />

        <UnidadesSection />

        <DiscordSection config={config} onAtualizarConfig={carregarConfig} />
      </main>

      <Footer onAdminClick={() => setPainelAberto(true)} />

      {formularioAberto && (
        <FormularioModal
          formulario={FORMULARIOS_UNIDADE[formularioAberto]}
          onClose={() => setFormularioAberto(null)}
        />
      )}

      {painelAberto && (
        <AdminPanel
          token={token}
          onLogin={aoEntrar}
          onTokenConfirmado={sincronizarToken}
          onClose={() => setPainelAberto(false)}
          onLogout={sair}
          onSessaoExpirada={limparSessao}
          onConfigChange={carregarConfig}
        />
      )}
    </div>
  );
}
