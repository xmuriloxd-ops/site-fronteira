import { useEffect, useState, type ReactNode } from 'react';
import {
  X,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  LogOut,
  Trash2,
  Save,
  Link2,
  ClipboardList,
  ChevronDown,
  UserCheck,
  Clock4,
  XCircle,
  Megaphone,
} from 'lucide-react';
import { FORMULARIOS_UNIDADE } from '../data/fichas-unidade';
import { DivulgacaoTab } from './DivulgacaoTab';
import type { DivulgacaoInscricoes, Interessado, EnvioDiscord, InscricaoRecrutamento } from '../types';
import { FORMULARIO_RECRUTAMENTO } from '../data/recrutamento';

type Aba = 'divulgacao' | 'credenciais' | 'recrutamento' | 'tropa';

interface AdminData {
  login: string;
  discord: {
    webhookConfigurado: boolean;
    webhookMascarado: string;
    convite: string;
    canal: string;
    autoEnviar: boolean;
    mencionarHere: boolean;
    vinculado: boolean;
  };
  interessados: Interessado[];
  envios: EnvioDiscord[];
  divulgacao?: DivulgacaoInscricoes;
}

const API = '/api/admin';

/**
 * Token da sessão do comando.
 * Fica no módulo (e não só no estado do React) para que TODA requisição do
 * painel autentique automaticamente — inclusive as feitas pelas abas.
 * Era essa a falha: chamadas que esqueciam de passar o token recebiam 401.
 */
let tokenSessao: string | null = null;

function definirTokenSessao(token: string | null) {
  tokenSessao = token;
}

/** Cabeçalhos de autenticação no formato esperado pelas abas. */
function cabecalho() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenSessao ?? ''}`,
    'x-admin-token': tokenSessao ?? '',
  };
}

/**
 * Requisição autenticada ao painel. O token vai por três canais ao mesmo tempo
 * (Authorization, x-admin-token e query string) porque o proxy do preview pode
 * remover cabeçalhos e cookies. Qualquer um que chegue já autentica.
 */
async function apiFetch(caminho: string, opcoes: RequestInit = {}, token?: string | null) {
  const passados = (opcoes.headers as Record<string, string>) ?? {};
  const efetivo =
    token ??
    (passados['x-admin-token'] ||
      (passados.Authorization?.startsWith('Bearer ') ? passados.Authorization.slice(7) : null) ||
      tokenSessao);

  const url = efetivo
    ? `${API}${caminho}${caminho.includes('?') ? '&' : '?'}token=${encodeURIComponent(efetivo)}`
    : `${API}${caminho}`;
  const cabecalhos: Record<string, string> = { 'Content-Type': 'application/json', ...passados };
  if (efetivo) {
    cabecalhos.Authorization = `Bearer ${efetivo}`;
    cabecalhos['x-admin-token'] = efetivo;
  }
  return fetch(url, { ...opcoes, headers: cabecalhos, credentials: 'same-origin' });
}

/** Webhook salvo no servidor, usando o token da sessão atual. */
async function obterWebhookGlobal(): Promise<string | null> {
  try {
    const r = await apiFetch('/discord/webhook');
    if (!r.ok) return null;
    const d = (await r.json()) as { webhook?: string };
    return d.webhook ?? null;
  } catch {
    return null;
  }
}

export function AdminPanel({
  token,
  onLogin,
  onClose,
  onLogout,
  onSessaoExpirada,
  onConfigChange,
  onTokenConfirmado,
}: {
  token: string | null;
  onLogin: (token: string) => void;
  onClose: () => void;
  onLogout: () => void;
  onSessaoExpirada: () => void;
  onConfigChange: () => void;
  onTokenConfirmado?: (token: string) => void;
}) {
  // campos vazios de propósito: não há preenchimento automático
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [erroLogin, setErroLogin] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);
  const [aba, setAba] = useState<Aba>('divulgacao');
  const [dados, setDados] = useState<AdminData | null>(null);
  const [carregando, setCarregando] = useState(false);
  // mantido para a lógica de sessão; a mensagem não é mais exibida
  const [, setSessaoExpirada] = useState(false);
  const [erroConexao, setErroConexao] = useState<string | null>(null);
  // token em uso pelo painel: começa com o token salvo e passa a valer
  // imediatamente após o login, sem depender de um novo render do App.
  const [tokenAtivo, setTokenAtivo] = useState<string | null>(token);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', aoTeclar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [onClose]);

  // mantém o token do módulo sempre sincronizado com o estado do painel,
  // para que as abas autentiquem sem precisar receber o token por prop
  useEffect(() => {
    setTokenAtivo(token);
    definirTokenSessao(token);
  }, [token]);

  useEffect(() => {
    definirTokenSessao(tokenAtivo);
  }, [tokenAtivo]);

  const carregarDados = async (paraToken?: string | null) => {
    const uso = paraToken ?? tokenAtivo;
    setCarregando(true);
    try {
      const r = await apiFetch('/data', {}, uso);
      if (r.status === 401) {
        // A sessão não vale mais. Não fecha o painel: mostra o login no lugar
        // dos dados, preservando o que o comando já estava fazendo.
        setDados(null);
        setTokenAtivo(null);
        setSessaoExpirada(true);
        setErroConexao(null);
        onSessaoExpirada();
        return;
      }
      if (!r.ok) {
        setErroConexao(`O servidor respondeu ${r.status}. Tente novamente em instantes.`);
        return;
      }
      setSessaoExpirada(false);
      setErroConexao(null);
      setDados(await r.json());
      // mantém o App com o mesmo token que acabou de funcionar
      if (uso) onTokenConfirmado?.(uso);
    } catch {
      setErroConexao('Não foi possível carregar os dados do painel. Clique em "Tentar novamente".');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (tokenAtivo) void carregarDados(tokenAtivo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenAtivo]);

  const entrar = async () => {
    setErroLogin(null);
    setEntrando(true);
    try {
      const r = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, senha }),
        credentials: 'same-origin',
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErroLogin(d.erro ?? 'Não foi possível entrar.');
        return;
      }
      if (!d.token) {
        setErroLogin('O servidor não devolveu a sessão. Tente novamente.');
        return;
      }
      // Login aceito: a sessão passa a valer imediatamente e NUNCA é desfeita
      // por uma falha de leitura depois. Era isso que devolvia ao login.
      setTokenAtivo(d.token);
      setSessaoExpirada(false);
      setErroConexao(null);
      onLogin(d.token);
      setSenha('');
      // busca os dados do painel sem bloquear a entrada
      void carregarDados(d.token);
    } catch {
      setErroLogin('Falha de conexão com o servidor. Tente novamente.');
    } finally {
      setEntrando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-pmpr-gold/25 bg-ink-900 shadow-2xl sm:h-[86vh] sm:rounded-2xl">
        <div className="relative shrink-0 border-b border-pmpr-gold/15 px-5 py-4 sm:px-7">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-700 via-pmpr-gold to-emerald-700" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-pmpr-gold/25 bg-pmpr-gold/10">
                <ShieldCheck size={19} className="text-pmpr-gold" />
              </div>
              <div>
                <p className="font-display text-lg font-bold uppercase tracking-wide text-white">Aba do Comando</p>
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-emerald-100/40">
                  Acesso restrito · PMPR
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {tokenAtivo && (
                <button
                  onClick={() => {
                    setTokenAtivo(null);
                    setDados(null);
                    onLogout();
                  }}
                  className="flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1.5 text-[0.7rem] font-semibold text-emerald-100/50 transition hover:border-rose-400/40 hover:text-rose-300"
                  title="Encerrar sessão"
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-md border border-white/10 p-2 text-emerald-100/50 transition hover:border-pmpr-gold/40 hover:text-pmpr-gold"
                aria-label="Fechar"
              >
                <X size={17} />
              </button>
            </div>
          </div>
        </div>

        {!tokenAtivo ? (
          /* ----------------------------- Login ----------------------------- */
          <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
            <div className="w-full max-w-sm">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-pmpr-gold/25 bg-pmpr-gold/8">
                  <KeyRound size={26} className="text-pmpr-gold" />
                </div>
                <h3 className="font-display mt-4 text-xl font-bold uppercase tracking-wide text-white">
                  Identificação
                </h3>
                <p className="mt-1 text-[0.78rem] text-emerald-50/45">
                  Informe as credenciais do comando para gerenciar as inscrições.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div>
                  <label className="label" htmlFor="admin-login">
                    Login
                  </label>
                  <input
                    id="admin-login"
                    className="field"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void entrar()}
                    placeholder="login do comando"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="admin-senha">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="admin-senha"
                      type={verSenha ? 'text' : 'password'}
                      className="field pr-10"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && void entrar()}
                      placeholder="••••••"
                      autoComplete="current-password"
                    />
                    <button
                      onClick={() => setVerSenha((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-100/40 hover:text-pmpr-gold"
                      type="button"
                      aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {verSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {erroLogin && (
                  <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 text-[0.78rem] text-rose-200">
                    <AlertCircle size={14} className="shrink-0" />
                    {erroLogin}
                  </div>
                )}

                <button onClick={entrar} disabled={entrando} className="btn-gold w-full text-sm disabled:opacity-60">
                  {entrando ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                  {entrando ? 'Verificando...' : 'Entrar no painel'}
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                <p className="text-[0.68rem] text-emerald-100/35">Problemas para entrar?</p>
                <button
                  onClick={() => {
                    setTokenAtivo(null);
                    setDados(null);
                    onSessaoExpirada();
                    setSessaoExpirada(false);
                    setErroLogin(null);
                    setLogin('');
                    setSenha('');
                  }}
                  className="rounded border border-white/10 px-2 py-1 text-[0.68rem] font-semibold text-emerald-100/60 transition hover:border-pmpr-gold/40 hover:text-pmpr-gold"
                >
                  Limpar sessão
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ----------------------------- Painel ----------------------------- */
          <>
            <div className="shrink-0 border-b border-white/8 px-3 pt-2 sm:px-5">
              <div className="flex gap-1 overflow-x-auto">
                {(
                  [
                    { id: 'divulgacao', label: 'Divulgação', Icon: Megaphone },
                    { id: 'recrutamento', label: 'Recrutamento', Icon: ClipboardList },
                    { id: 'tropa', label: 'Tropa', Icon: Users },
                    { id: 'credenciais', label: 'Login e senha', Icon: KeyRound },
                  ] as { id: Aba; label: string; Icon: typeof Users }[]
                ).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setAba(id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-t-md px-3 py-2.5 text-[0.78rem] font-semibold transition ${
                      aba === id
                        ? 'border-b-2 border-pmpr-gold text-pmpr-gold'
                        : 'border-b-2 border-transparent text-emerald-50/50 hover:text-white'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
              {carregando && !dados && (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-emerald-100/40">
                  <Loader2 size={22} className="animate-spin" />
                  <p className="text-[0.74rem]">Carregando dados do comando...</p>
                </div>
              )}

              {!carregando && !dados && erroConexao && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-center">
                  <AlertCircle size={20} className="mx-auto text-rose-300" />
                  <p className="mt-2 text-[0.8rem] font-semibold text-rose-200">Falha ao carregar o painel</p>
                  <p className="mt-1 text-[0.74rem] leading-relaxed text-rose-200/70">{erroConexao}</p>
                  <button onClick={() => void carregarDados()} className="btn-ghost mx-auto mt-3 text-[0.76rem]">
                    Tentar novamente
                  </button>
                </div>
              )}

              {dados && aba === 'divulgacao' && (
                <DivulgacaoTab
                  cabecalho={cabecalho}
                  onAtualizar={() => {
                    void carregarDados();
                    onConfigChange();
                  }}
                  obterWebhook={obterWebhookGlobal}
                  inicial={dados.divulgacao}
                  discord={{
                    webhookMascarado: dados.discord.webhookMascarado,
                    convite: dados.discord.convite,
                    canal: dados.discord.canal,
                    autoEnviar: dados.discord.autoEnviar,
                    mencionarHere: dados.discord.mencionarHere,
                    vinculado: dados.discord.vinculado,
                  }}
                  envios={dados.envios}
                />
              )}

              {dados && aba === 'recrutamento' && (
                <RecrutamentoTab cabecalho={cabecalho} />
              )}

              {dados && aba === 'tropa' && (
                <TropaTab dados={dados} cabecalho={cabecalho} onAtualizar={carregarDados} />
              )}

              {dados && aba === 'credenciais' && (
                <CredenciaisTab
                  dados={dados}
                  cabecalho={cabecalho}
                  onLoginAtualizado={(novoToken, novoLogin) => {
                    onLogin(novoToken);
                    setDados({ ...dados, login: novoLogin });
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Aba: Tropa (interessados)                                           */
/* ------------------------------------------------------------------ */

function TropaTab({
  dados,
  cabecalho,
  onAtualizar,
}: {
  dados: AdminData;
  cabecalho: () => Record<string, string>;
  onAtualizar: () => void;
}) {
  const [filtro, setFiltro] = useState('');

  const lista = dados.interessados.filter((i) =>
    `${i.nome} ${i.discord}`.toLowerCase().includes(filtro.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MiniStat label="Interessados" valor={String(dados.interessados.length)} />
        <MiniStat label="Vinculados" valor={String(dados.interessados.filter((i) => i.vinculado).length)} />
        <MiniStat label="Envios" valor={String(dados.envios.length)} />
      </div>

      <input
        className="field"
        placeholder="Buscar por nome ou usuário do Discord"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />

      {lista.length === 0 ? (
        <p className="rounded-lg border border-white/8 bg-white/[0.02] p-6 text-center text-[0.78rem] text-emerald-100/35">
          Ninguém vinculado ainda. Compartilhe o convite do servidor com a tropa.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {lista.map((i) => (
            <li
              key={i.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-[0.8rem] font-semibold text-white/90">{i.nome}</p>
                <p className="truncate text-[0.7rem] text-emerald-100/40">
                  @{i.discord} · {i.editais.map((x) => x.toUpperCase()).join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={async () => {
                    await fetch(`${API}/interessados/${i.id}`, {
                      method: 'PATCH',
                      headers: cabecalho(),
                      credentials: 'same-origin',
                      body: JSON.stringify({ vinculado: !i.vinculado }),
                    });
                    onAtualizar();
                  }}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-[0.65rem] font-bold uppercase ${
                    i.vinculado
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-white/5 text-emerald-100/45 hover:bg-white/10'
                  }`}
                >
                  <CheckCircle2 size={10} />
                  {i.vinculado ? 'Vinculado' : 'Pendente'}
                </button>
                <button
                  onClick={async () => {
                    await apiFetch(`/interessados/${i.id}`, { method: 'DELETE' });
                    onAtualizar();
                  }}
                  className="rounded p-1.5 text-emerald-100/30 hover:bg-rose-500/10 hover:text-rose-300"
                  aria-label="Remover"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Aba: Recrutamento (13º BPM - Fronteira Sul)                         */
/* ------------------------------------------------------------------ */

const STATUS_INSCRICAO: Record<
  InscricaoRecrutamento['status'],
  { label: string; cor: string; Icon: typeof Clock4 }
> = {
  novo: { label: 'Nova', cor: 'border-sky-400/35 bg-sky-500/12 text-sky-300', Icon: Clock4 },
  'em-analise': { label: 'Em análise', cor: 'border-amber-400/35 bg-amber-500/12 text-amber-300', Icon: Clock4 },
  aprovado: { label: 'Aprovado', cor: 'border-emerald-400/35 bg-emerald-500/12 text-emerald-300', Icon: UserCheck },
  reprovado: { label: 'Reprovado', cor: 'border-rose-400/35 bg-rose-500/12 text-rose-300', Icon: XCircle },
};

function RecrutamentoTab({ cabecalho }: { cabecalho: () => Record<string, string> }) {
  const [inscricoes, setInscricoes] = useState<InscricaoRecrutamento[] | null>(null);
  const [aberta, setAberta] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'todas' | InscricaoRecrutamento['status']>('todas');
  const [busca, setBusca] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    try {
      const r = await apiFetch('/inscricoes');
      if (!r.ok) return;
      const d = await r.json();
      setInscricoes(d.inscricoes ?? []);
    } catch {
      setInscricoes([]);
    }
  };

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const atualizar = async (id: string, corpo: Record<string, unknown>) => {
    setSalvando(true);
    try {
      await fetch(`${API}/inscricoes/${id}`, {
        method: 'PATCH',
        headers: cabecalho(),
        credentials: 'same-origin',
        body: JSON.stringify(corpo),
      });
      await carregar();
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (id: string) => {
    await apiFetch(`/inscricoes/${id}`, { method: 'DELETE' });
    setAberta(null);
    await carregar();
  };

  const lista = (inscricoes ?? [])
    .filter((i) => filtroStatus === 'todas' || i.status === filtroStatus)
    .filter((i) => `${i.nome} ${i.idRp}`.toLowerCase().includes(busca.toLowerCase()));

  const campoPorId = (id: string) => FORMULARIO_RECRUTAMENTO.campos.find((c) => c.id === id);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-3.5">
        <p className="flex items-center gap-2 text-[0.8rem] font-semibold text-emerald-200">
          <ClipboardList size={14} />
          {FORMULARIO_RECRUTAMENTO.titulo}
        </p>
        <p className="mt-1 text-[0.72rem] leading-relaxed text-emerald-50/50">
          {FORMULARIO_RECRUTAMENTO.subtitulo} · {FORMULARIO_RECRUTAMENTO.campos.length - 1} perguntas + identificação.
          As inscrições enviadas pelo site aparecem aqui.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {(['novo', 'em-analise', 'aprovado', 'reprovado'] as const).map((st) => (
          <div key={st}>
            <MiniStat
              label={STATUS_INSCRICAO[st].label}
              valor={String((inscricoes ?? []).filter((i) => i.status === st).length)}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="field flex-1"
          placeholder="Buscar por nome ou ID"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select
          className="field sm:max-w-[11rem]"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as typeof filtroStatus)}
        >
          <option value="todas" className="bg-ink-900">Todas</option>
          <option value="novo" className="bg-ink-900">Novas</option>
          <option value="em-analise" className="bg-ink-900">Em análise</option>
          <option value="aprovado" className="bg-ink-900">Aprovadas</option>
          <option value="reprovado" className="bg-ink-900">Reprovadas</option>
        </select>
      </div>

      {inscricoes === null && (
        <div className="flex justify-center py-10 text-emerald-100/40">
          <Loader2 size={20} className="animate-spin" />
        </div>
      )}

      {inscricoes !== null && lista.length === 0 && (
        <p className="rounded-lg border border-white/8 bg-white/[0.02] p-6 text-center text-[0.78rem] text-emerald-100/35">
          Nenhuma inscrição recebida ainda. Divulgue o formulário com a tropa: ele está na página inicial, em
          Recrutamento 13º BPM.
        </p>
      )}

      <ul className="space-y-1.5">
        {lista.map((inscricao) => {
          const meta = STATUS_INSCRICAO[inscricao.status];
          const expandida = aberta === inscricao.id;
          const { Icon } = meta;

          return (
            <li key={inscricao.id} className="overflow-hidden rounded-lg border border-white/8 bg-white/[0.02]">
              <button
                onClick={() => setAberta(expandida ? null : inscricao.id)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-white/[0.03]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-pmpr-gold/12 text-[0.7rem] font-bold text-pmpr-gold">
                  {inscricao.nome.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8rem] font-semibold text-white/90">{inscricao.nome}</p>
                  <p className="truncate text-[0.68rem] text-emerald-100/40">
                    {inscricao.idade} anos · ID {inscricao.idRp} ·{' '}
                    {new Date(inscricao.criadoEm).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className={`flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[0.58rem] font-bold uppercase ${meta.cor}`}>
                  <Icon size={9} />
                  {meta.label}
                </span>
                <ChevronDown
                  size={14}
                  className={`shrink-0 text-emerald-100/35 transition ${expandida ? 'rotate-180' : ''}`}
                />
              </button>

              {expandida && (
                <div className="border-t border-white/8 bg-black/20 px-3 py-3">
                  <div className="space-y-2.5">
                    {Object.entries(inscricao.respostas).map(([campoId, valor]) => {
                      const campo = campoPorId(campoId);
                      return (
                        <div key={campoId} className="rounded border border-white/6 bg-white/[0.02] p-2.5">
                          <p className="text-[0.62rem] font-bold uppercase leading-snug tracking-wider text-pmpr-gold/70">
                            {campo?.numero ? `${campo.numero}. ` : ''}
                            {campo?.titulo ?? campoId}
                          </p>
                          <p className="mt-1 whitespace-pre-line text-[0.78rem] leading-relaxed text-emerald-50/75">
                            {valor}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3">
                    <label className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-emerald-100/35">
                      Observação do comando
                    </label>
                    <textarea
                      className="field mt-1 min-h-[54px] resize-y text-[0.78rem]"
                      defaultValue={inscricao.observacaoComando ?? ''}
                      placeholder="Anotação interna sobre o candidato"
                      onBlur={(e) => {
                        if (e.target.value !== (inscricao.observacaoComando ?? '')) {
                          void atualizar(inscricao.id, { observacaoComando: e.target.value });
                        }
                      }}
                    />
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {(['em-analise', 'aprovado', 'reprovado'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => atualizar(inscricao.id, { status: st })}
                        disabled={salvando || inscricao.status === st}
                        className={`rounded border px-2.5 py-1.5 text-[0.68rem] font-bold uppercase transition disabled:opacity-40 ${
                          inscricao.status === st
                            ? STATUS_INSCRICAO[st].cor
                            : 'border-white/10 text-emerald-100/50 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        {STATUS_INSCRICAO[st].label}
                      </button>
                    ))}
                    <button
                      onClick={() => remover(inscricao.id)}
                      className="ml-auto flex items-center gap-1 rounded border border-white/10 px-2 py-1.5 text-[0.68rem] text-emerald-100/35 transition hover:border-rose-400/40 hover:text-rose-300"
                    >
                      <Trash2 size={10} />
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Aba: Credenciais                                                    */
/* ------------------------------------------------------------------ */

function CredenciaisTab({
  dados,
  cabecalho,
  onLoginAtualizado,
}: {
  dados: AdminData;
  cabecalho: () => Record<string, string>;
  onLoginAtualizado: (token: string, login: string) => void;
}) {
  const [novoLogin, setNovoLogin] = useState(dados.login);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [ver, setVer] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const forca = (() => {
    if (novaSenha.length === 0) return 0;
    let s = 0;
    if (novaSenha.length >= 6) s++;
    if (novaSenha.length >= 10) s++;
    if (/[A-Z]/.test(novaSenha) && /[a-z]/.test(novaSenha)) s++;
    if (/\d/.test(novaSenha)) s++;
    if (/[^A-Za-z0-9]/.test(novaSenha)) s++;
    return Math.min(s, 4);
  })();

  const salvar = async () => {
    setMsg(null);
    if (novaSenha && novaSenha !== confirmar) {
      setMsg({ tipo: 'erro', texto: 'A confirmação da nova senha não confere.' });
      return;
    }
    if (!senhaAtual) {
      setMsg({ tipo: 'erro', texto: 'Informe a senha atual para confirmar a alteração.' });
      return;
    }

    setSalvando(true);
    try {
      const corpo: Record<string, string> = { senhaAtual };
      if (novoLogin.trim() && novoLogin.trim() !== dados.login) corpo.login = novoLogin.trim();
      if (novaSenha) corpo.senha = novaSenha;

      const r = await apiFetch('/credenciais', { method: 'PATCH', body: JSON.stringify(corpo) });
      const d = await r.json();
      if (!r.ok) {
        setMsg({ tipo: 'erro', texto: d.erro ?? 'Não foi possível alterar.' });
        return;
      }
      setMsg({ tipo: 'ok', texto: 'Credenciais atualizadas. Guarde a nova senha.' });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmar('');
      onLoginAtualizado(d.token, d.login);
    } catch {
      setMsg({ tipo: 'erro', texto: 'Falha de conexão.' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-pmpr-gold/20 bg-pmpr-gold/[0.05] p-3.5">
        <p className="flex items-center gap-2 text-[0.8rem] font-semibold text-pmpr-gold-soft">
          <KeyRound size={14} />
          Login atual: <span className="font-mono text-white">{dados.login}</span>
        </p>
        <p className="mt-1 text-[0.72rem] leading-relaxed text-emerald-50/45">
          Ao alterar, todas as sessões abertas são encerradas e um novo acesso é emitido para este navegador.
        </p>
      </div>

      <div>
        <label className="label">Novo login</label>
        <input className="field" value={novoLogin} onChange={(e) => setNovoLogin(e.target.value)} minLength={4} />
      </div>

      <div>
        <label className="label">Nova senha</label>
        <div className="relative">
          <input
            type={ver ? 'text' : 'password'}
            className="field pr-10"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="mínimo de 6 caracteres"
            minLength={6}
          />
          <button
            onClick={() => setVer((v) => !v)}
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-100/40 hover:text-pmpr-gold"
            aria-label="Mostrar senha"
          >
            {ver ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {novaSenha && (
          <div className="mt-2 flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i < forca ? (forca >= 3 ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="label">Confirmar nova senha</label>
        <input
          type={ver ? 'text' : 'password'}
          className="field"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Senha atual (obrigatória)</label>
        <input
          type="password"
          className="field"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          placeholder="confirme sua identidade"
        />
      </div>

      {msg && <Aviso tipo={msg.tipo} texto={msg.texto} />}

      <button onClick={salvar} disabled={salvando} className="btn-gold w-full text-[0.85rem] disabled:opacity-60">
        {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Salvar credenciais
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Auxiliares                                                          */
/* ------------------------------------------------------------------ */

function Bloco({
  titulo,
  Icon,
  descricao,
  children,
}: {
  titulo: string;
  Icon: typeof Link2;
  descricao?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[0.78rem] font-semibold text-white">
        <Icon size={13} className="text-pmpr-gold/80" />
        {titulo}
      </p>
      {descricao && <p className="mb-2 mt-0.5 text-[0.7rem] leading-relaxed text-emerald-100/35">{descricao}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Toggle({
  ativo,
  onChange,
  titulo,
  descricao,
}: {
  ativo: boolean;
  onChange: (v: boolean) => void;
  titulo: string;
  descricao: string;
}) {
  return (
    <button
      onClick={() => onChange(!ativo)}
      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition ${
        ativo ? 'border-emerald-500/40 bg-emerald-500/8' : 'border-white/8 bg-white/[0.02]'
      }`}
    >
      <div>
        <p className="text-[0.78rem] font-semibold text-white">{titulo}</p>
        <p className="text-[0.68rem] text-emerald-100/40">{descricao}</p>
      </div>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${ativo ? 'bg-emerald-500' : 'bg-white/15'}`}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
          style={{ left: ativo ? '1.125rem' : '0.125rem' }}
        />
      </span>
    </button>
  );
}

function Aviso({ tipo, texto }: { tipo: 'ok' | 'erro'; texto: string }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border p-2.5 text-[0.78rem] leading-relaxed ${
        tipo === 'ok'
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
          : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
      }`}
    >
      {tipo === 'ok' ? (
        <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
      ) : (
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
      )}
      {texto}
    </div>
  );
}

function MiniStat({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5">
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-emerald-100/35">{label}</p>
      <p className="font-display text-xl font-bold text-white">{valor}</p>
    </div>
  );
}
