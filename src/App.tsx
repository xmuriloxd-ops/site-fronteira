import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, RefreshCw, Zap } from 'lucide-react';
import { api, ApiError, getToken, setToken } from './lib/api';
import { Link, usePathname } from './lib/router';
import type { Bootstrap } from './types';
import { SiteHeader } from './components/SiteHeader';
import { SiteFooter } from './components/SiteFooter';
import { Crest, Spinner } from './components/ui';
import { HomePage } from './pages/HomePage';
import { NewsPage } from './pages/NewsPage';
import { ArticlePage } from './pages/ArticlePage';
import { GalleryPage } from './pages/GalleryPage';
import { AboutPage } from './pages/AboutPage';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminPanel } from './components/admin/AdminPanel';

// Evita registros duplicados da mesma página na mesma sessão de navegação
const loggedPaths = new Set<string>();

interface SessionUser {
  username: string;
  role: string;
}

function LoadingScreen({ label = 'Carregando o portal' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#080707]">
      <Crest className="h-28 w-auto animate-glow" />
      <div className="flex items-center gap-2 font-display text-xs uppercase tracking-[0.3em] text-fumaca">
        <Spinner className="h-4 w-4 text-ouro" />
        {label}
      </div>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#080707] px-6 text-center">
      <Crest className="h-24 w-auto opacity-70" />
      <div className="flex items-center gap-2 text-vermelho">
        <AlertTriangle className="h-5 w-5" />
        <h1 className="font-display text-2xl uppercase tracking-wide">Falha ao carregar</h1>
      </div>
      <p className="max-w-md text-sm text-fumaca">{message}</p>
      <div className="flex gap-3">
        <button type="button" onClick={onRetry} className="btn btn-gold">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
        <Link href="/" className="btn btn-outline">
          Página inicial
        </Link>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center pt-24 text-center">
      <Crest className="mb-5 h-24 w-auto opacity-80" />
      <span className="label">Erro 404</span>
      <h1 className="display mt-2 text-5xl text-white">
        Página fora de <span className="gold-text">área</span>
      </h1>
      <p className="mt-3 max-w-md text-sm text-fumaca">
        A página que você tentou acessar não existe ou foi movida. Volte para a base.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-gold">
          <ArrowLeft className="h-4 w-4" />
          Página inicial
        </Link>
        <Link href="/noticias" className="btn btn-outline">
          <Zap className="h-4 w-4" />
          Notícias
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  const pathname = usePathname();
  const path = pathname.split('?')[0];

  const [data, setData] = useState<Bootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [session, setSession] = useState<SessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const bootstrap = await api.bootstrap();
      setData(bootstrap);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar o portal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Valida a sessão salva no navegador
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthChecked(true);
      return;
    }
    api
      .me()
      .then((response) => setSession(response.user))
      .catch(() => setToken(null))
      .finally(() => setAuthChecked(true));
  }, []);

  // Registra a visita (exceto na área administrativa)
  useEffect(() => {
    if (path.startsWith('/admin') || loggedPaths.has(path)) return;
    loggedPaths.add(path);
    api.visit(path);
  }, [path]);

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'ROTAM GOIÁS · GTA RP — Raio Imortal',
      '/noticias': 'Notícias · ROTAM GOIÁS',
      '/galeria': 'Galeria · ROTAM GOIÁS',
      '/sobre': 'Sobre a unidade · ROTAM GOIÁS',
      '/admin': 'Área restrita · ROTAM GOIÁS',
    };
    document.title = titles[path] ?? 'ROTAM GOIÁS · GTA RP';
  }, [path]);

  const handleLogin = (token: string, user: SessionUser) => {
    setToken(token);
    setSession(user);
    setNotice(null);
  };

  const handleLogout = () => {
    setToken(null);
    setSession(null);
    setNotice('Você saiu do painel com segurança.');
  };

  const handleExpire = () => {
    setToken(null);
    setSession(null);
    setNotice('Sua sessão expirou. Entre novamente para continuar.');
  };

  const refreshPublic = useCallback(async () => {
    try {
      const bootstrap = await api.bootstrap();
      setData(bootstrap);
    } catch {
      /* mantém os dados atuais */
    }
  }, []);

  /* ------------------------------ Admin ------------------------------ */

  if (path === '/admin') {
    if (!authChecked) return <LoadingScreen label="Verificando sessão" />;

    if (!session) {
      return <AdminLogin onSuccess={handleLogin} notice={notice} />;
    }

    if (!data) {
      if (loading) return <LoadingScreen label="Carregando painel" />;
      return <ErrorScreen message={error ?? 'Falha ao carregar os dados.'} onRetry={loadData} />;
    }

    return (
      <AdminPanel
        user={session}
        settings={data.settings}
        onLogout={handleLogout}
        onExpire={handleExpire}
        onPublicRefresh={refreshPublic}
      />
    );
  }

  /* ------------------------------ Site público ------------------------------ */

  if (loading && !data) return <LoadingScreen />;
  if (!data) return <ErrorScreen message={error ?? 'Falha ao carregar os dados.'} onRetry={loadData} />;

  const articleMatch = path.match(/^\/noticias\/([^/]+)$/);

  let content: ReactNode;
  if (path === '/') content = <HomePage data={data} />;
  else if (path === '/noticias') content = <NewsPage posts={data.posts} />;
  else if (articleMatch)
    content = <ArticlePage slug={decodeURIComponent(articleMatch[1])} />;
  else if (path === '/galeria') content = <GalleryPage photos={data.photos} />;
  else if (path === '/sobre') content = <AboutPage settings={data.settings} />;
  else content = <NotFound />;

  return (
    <div className="min-h-screen bg-[#080707]">
      <SiteHeader settings={data.settings} />
      <main>{content}</main>
      <SiteFooter settings={data.settings} />
    </div>
  );
}
