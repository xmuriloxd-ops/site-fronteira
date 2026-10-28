import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck, User } from 'lucide-react';
import { api, ApiError, setToken } from '../../lib/api';
import { Link } from '../../lib/router';
import { Crest } from '../ui';

export function AdminLogin({
  onSuccess,
  notice,
}: {
  onSuccess: (token: string, user: { username: string; role: string }) => void;
  notice?: string | null;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.login(username.trim(), password);
      setToken(data.token);
      onSuccess(data.token, data.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <img
        src="/img/hero-operacao.jpg"
        alt=""
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#080707] via-[#080707]/95 to-[#141011]/80" />
      <div className="absolute -left-32 top-1/4 -z-10 h-96 w-96 rounded-full bg-ouro/10 blur-[120px]" />

      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.2em] text-fumaca-escura transition-colors hover:text-ouro"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao site
        </Link>

        <div className="border border-borda bg-[#100d0e]/95 backdrop-blur">
          <div className="hazard h-1 w-full" />
          <div className="px-6 py-7 sm:px-8">
            <div className="mb-6 flex flex-col items-center text-center">
              <Crest className="h-24 w-auto drop-shadow-[0_10px_30px_rgba(254,213,0,0.18)]" />
              <span className="mt-4 flex items-center gap-2 tag border border-ouro/30 bg-ouro/5 text-ouro">
                <ShieldCheck className="h-3.5 w-3.5" />
                Área restrita
              </span>
              <h1 className="display mt-3 text-3xl text-white">Painel do administrador</h1>
              <p className="mt-2 text-xs leading-relaxed text-fumaca">
                Acesso exclusivo do comando e da equipe de comunicação do batalhão.
              </p>
            </div>

            {notice && (
              <div className="mb-4 border border-ouro/30 bg-ouro/5 px-3 py-2.5 text-[0.72rem] text-ouro">
                {notice}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-fumaca">
                  Usuário
                </span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fumaca-escura" />
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    required
                    placeholder="admin"
                    className="field pl-9"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-fumaca">
                  Senha
                </span>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fumaca-escura" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="field pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-fumaca-escura transition-colors hover:text-ouro"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {error && (
                <div className="border border-vermelho/40 bg-vermelho/10 px-3 py-2.5 text-[0.72rem] text-[#ffd9da]">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-gold w-full disabled:opacity-60">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Entrar no painel
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-[0.64rem] leading-relaxed text-fumaca-escura">
              Sessão válida por 12 horas. Após 8 tentativas incorretas, o acesso é bloqueado por 10
              minutos.
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-[0.62rem] uppercase tracking-[0.2em] text-fumaca-escura">
          ROTAM GOIÁS · GTA RP — conteúdo de roleplay
        </p>
      </div>
    </div>
  );
}
