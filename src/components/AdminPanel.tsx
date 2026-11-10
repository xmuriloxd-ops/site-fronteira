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
  MessageSquare,
  Send,
  Users,
  Settings2,
  LogOut,
  Link2,
  Trash2,
  Radio,
  Save,
  BellRing,
} from 'lucide-react';
import { EDITAIS } from '../data/editais';
import type { EditalStatus, Interessado, EnvioDiscord } from '../types';

type Aba = 'discord' | 'credenciais' | 'editais' | 'tropa';

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
  overrides: Record<string, { status?: EditalStatus; aviso?: string }>;
}

const API = '/api/admin';

export function AdminPanel({
  token,
  onLogin,
  onClose,
  onLogout,
  onConfigChange,
}: {
  token: string | null;
  onLogin: (token: string) => void;
  onClose: () => void;
  onLogout: () => void;
  onConfigChange: () => void;
}) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [erroLogin, setErroLogin] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);
  const [aba, setAba] = useState<Aba>('discord');
  const [dados, setDados] = useState<AdminData | null>(null);
  const [carregando, setCarregando] = useState(false);

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

  const cabecalho = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const carregarDados = async () => {
    if (!token) return;
    setCarregando(true);
    try {
      const r = await fetch(`${API}/data`, { headers: cabecalho() });
      if (r.status === 401) {
        onLogout();
        return;
      }
      setDados(await r.json());
    } catch {
      /* silencioso */
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (token) void carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const entrar = async () => {
    setErroLogin(null);
    setEntrando(true);
    try {
      const r = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, senha }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErroLogin(d.erro ?? 'Não foi possível entrar.');
        return;
      }
      onLogin(d.token);
      setSenha('');
    } catch {
      setErroLogin('Falha de conexão com o servidor.');
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
              {token && (
                <button
                  onClick={onLogout}
                  className="rounded-md border border-white/10 p-2 text-emerald-100/50 transition hover:border-rose-400/40 hover:text-rose-300"
                  title="Sair"
                >
                  <LogOut size={16} />
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

        {!token ? (
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
                  Informe as credenciais do comando para gerenciar os editais.
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

              <p className="mt-5 rounded-lg border border-white/8 bg-white/[0.02] p-3 text-center text-[0.7rem] leading-relaxed text-emerald-100/35">
                As credenciais podem ser alteradas dentro do painel, na aba{' '}
                <strong className="text-emerald-100/60">Login e senha</strong>.
              </p>
            </div>
          </div>
        ) : (
          /* ----------------------------- Painel ----------------------------- */
          <>
            <div className="shrink-0 border-b border-white/8 px-3 pt-2 sm:px-5">
              <div className="flex gap-1 overflow-x-auto">
                {(
                  [
                    { id: 'discord', label: 'Discord', Icon: MessageSquare },
                    { id: 'editais', label: 'Editais', Icon: Settings2 },
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
                <div className="flex items-center justify-center py-16 text-emerald-100/40">
                  <Loader2 size={22} className="animate-spin" />
                </div>
              )}

              {dados && aba === 'discord' && (
                <DiscordTab
                  dados={dados}
                  cabecalho={cabecalho}
                  onAtualizar={() => {
                    void carregarDados();
                    onConfigChange();
                  }}
                />
              )}

              {dados && aba === 'editais' && (
                <EditaisTab
                  dados={dados}
                  cabecalho={cabecalho}
                  onAtualizar={() => {
                    void carregarDados();
                    onConfigChange();
                  }}
                />
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
/* Aba: Discord                                                        */
/* ------------------------------------------------------------------ */

function DiscordTab({
  dados,
  cabecalho,
  onAtualizar,
}: {
  dados: AdminData;
  cabecalho: () => Record<string, string>;
  onAtualizar: () => void;
}) {
  const [webhook, setWebhook] = useState('');
  const [convite, setConvite] = useState(dados.discord.convite);
  const [canal, setCanal] = useState(dados.discord.canal);
  const [autoEnviar, setAutoEnviar] = useState(dados.discord.autoEnviar);
  const [mencionarHere, setMencionarHere] = useState(dados.discord.mencionarHere);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [envioEdital, setEnvioEdital] = useState(EDITAIS[0].id);
  const [enviando, setEnviando] = useState(false);

  const salvar = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      const corpo: Record<string, unknown> = { convite, canal, autoEnviar, mencionarHere };
      if (webhook.trim()) corpo.webhook = webhook.trim();
      const r = await fetch(`${API}/discord`, { method: 'PATCH', headers: cabecalho(), body: JSON.stringify(corpo) });
      const d = await r.json();
      setMsg({ tipo: r.ok ? 'ok' : 'erro', texto: d.mensagem ?? d.erro ?? 'Resposta inesperada.' });
      if (r.ok) {
        setWebhook('');
        onAtualizar();
      }
    } catch {
      setMsg({ tipo: 'erro', texto: 'Falha de conexão.' });
    } finally {
      setSalvando(false);
    }
  };

  const testar = async () => {
    setTestando(true);
    setMsg(null);
    try {
      const r = await fetch(`${API}/discord/teste`, { method: 'POST', headers: cabecalho() });
      const d = await r.json();
      setMsg({ tipo: r.ok ? 'ok' : 'erro', texto: d.detalhe ?? (r.ok ? 'Mensagem enviada.' : 'Falha no teste.') });
      onAtualizar();
    } catch {
      setMsg({ tipo: 'erro', texto: 'Falha de conexão.' });
    } finally {
      setTestando(false);
    }
  };

  const enviarEdital = async () => {
    const edital = EDITAIS.find((e) => e.id === envioEdital);
    if (!edital) return;
    setEnviando(true);
    setMsg(null);
    try {
      const r = await fetch(`${API}/envios`, {
        method: 'POST',
        headers: cabecalho(),
        body: JSON.stringify({
          editalId: edital.id,
          titulo: `${edital.sigla} — ${edital.nome}`,
          descricao: edital.resumo,
          campos: [
            { name: 'Vagas', value: edital.vagasDetalhe, inline: true },
            { name: 'Inscrições', value: edital.inscricoes, inline: true },
            { name: 'Prova', value: edital.prova, inline: true },
            { name: 'Requisitos', value: edital.destaque.join(' · '), inline: false },
          ],
        }),
      });
      const d = await r.json();
      setMsg({ tipo: r.ok ? 'ok' : 'erro', texto: d.detalhe ?? 'Resposta recebida.' });
      onAtualizar();
    } catch {
      setMsg({ tipo: 'erro', texto: 'Falha de conexão.' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div
        className={`flex items-center gap-3 rounded-lg border p-3 ${
          dados.discord.vinculado
            ? 'border-emerald-500/35 bg-emerald-500/8'
            : 'border-amber-400/30 bg-amber-500/8'
        }`}
      >
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            dados.discord.vinculado ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
          }`}
        >
          <Radio size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-[0.82rem] font-semibold text-white">
            {dados.discord.vinculado ? 'Webhook conectado' : 'Webhook não configurado'}
          </p>
          <p className="truncate text-[0.72rem] text-emerald-50/45">
            {dados.discord.webhookMascarado || 'Cole abaixo a URL do webhook do canal de editais.'}
          </p>
        </div>
      </div>

      <Bloco titulo="Webhook do canal" Icon={Link2} descricao="No Discord: Configurações do canal → Integrações → Webhooks → Copiar URL.">
        <input
          className="field"
          value={webhook}
          onChange={(e) => setWebhook(e.target.value)}
          placeholder="https://discord.com/api/webhooks/..."
          type="url"
        />
        <p className="mt-1 text-[0.68rem] text-emerald-100/30">
          A URL fica salva apenas no servidor e não é exibida novamente no painel.
        </p>
      </Bloco>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Nome do canal</label>
          <input className="field" value={canal} onChange={(e) => setCanal(e.target.value)} placeholder="editais-pmpr" />
        </div>
        <div>
          <label className="label">Convite do servidor</label>
          <input
            className="field"
            value={convite}
            onChange={(e) => setConvite(e.target.value)}
            placeholder="https://discord.gg/..."
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Toggle
          ativo={autoEnviar}
          onChange={setAutoEnviar}
          titulo="Envio automático"
          descricao="Notifica o canal quando um status muda."
        />
        <Toggle
          ativo={mencionarHere}
          onChange={setMencionarHere}
          titulo="Mencionar @here"
          descricao="Avisa todos os membros online."
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={salvar} disabled={salvando} className="btn-gold px-4 py-2 text-[0.8rem] disabled:opacity-60">
          {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salvar configuração
        </button>
        <button onClick={testar} disabled={testando} className="btn-ghost px-4 py-2 text-[0.8rem] disabled:opacity-60">
          {testando ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />}
          Enviar teste
        </button>
      </div>

      <div className="gold-rule" />

      <Bloco
        titulo="Enviar edital para o Discord"
        Icon={Send}
        descricao="Publica um resumo do edital com vagas, inscrições e requisitos."
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <select className="field sm:flex-1" value={envioEdital} onChange={(e) => setEnvioEdital(e.target.value)}>
            {EDITAIS.map((e) => (
              <option key={e.id} value={e.id} className="bg-ink-900">
                {e.sigla} — {e.nome}
              </option>
            ))}
          </select>
          <button onClick={enviarEdital} disabled={enviando} className="btn-gold px-4 py-2 text-[0.8rem] disabled:opacity-60">
            {enviando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Enviar agora
          </button>
        </div>
      </Bloco>

      {msg && <Aviso tipo={msg.tipo} texto={msg.texto} />}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow text-emerald-100/40">Histórico de envios</p>
          {dados.envios.length > 0 && (
            <button
              onClick={async () => {
                await fetch(`${API}/envios`, { method: 'DELETE', headers: cabecalho() });
                onAtualizar();
              }}
              className="flex items-center gap-1 text-[0.68rem] text-emerald-100/35 hover:text-rose-300"
            >
              <Trash2 size={11} />
              Limpar
            </button>
          )}
        </div>
        {dados.envios.length === 0 ? (
          <p className="rounded-lg border border-white/8 bg-white/[0.02] p-4 text-center text-[0.78rem] text-emerald-100/35">
            Nenhum envio registrado ainda.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {dados.envios.slice(0, 8).map((envio) => (
              <li
                key={envio.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-[0.78rem] font-semibold text-white/85">{envio.titulo}</p>
                  <p className="truncate text-[0.68rem] text-emerald-100/35">
                    #{envio.destino} · {new Date(envio.criadoEm).toLocaleString('pt-BR')}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[0.6rem] font-bold uppercase ${
                    envio.status === 'sucesso'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-rose-500/15 text-rose-300'
                  }`}
                >
                  {envio.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Aba: Editais                                                        */
/* ------------------------------------------------------------------ */

function EditaisTab({
  dados,
  cabecalho,
  onAtualizar,
}: {
  dados: AdminData;
  cabecalho: () => Record<string, string>;
  onAtualizar: () => void;
}) {
  const [estado, setEstado] = useState<Record<string, { status: EditalStatus; aviso: string }>>(() =>
    Object.fromEntries(
      EDITAIS.map((e) => [
        e.id,
        { status: dados.overrides[e.id]?.status ?? e.status, aviso: dados.overrides[e.id]?.aviso ?? '' },
      ]),
    ),
  );
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const salvar = async (id: string, notificar = false) => {
    setSalvandoId(id);
    setMsg(null);
    try {
      const r = await fetch(`${API}/editais/${id}`, {
        method: 'PATCH',
        headers: cabecalho(),
        body: JSON.stringify({ ...estado[id], notificar }),
      });
      const d = await r.json();
      setMsg({ tipo: r.ok ? 'ok' : 'erro', texto: r.ok ? 'Edital atualizado.' : (d.erro ?? 'Erro ao salvar.') });
      if (r.ok) onAtualizar();
    } catch {
      setMsg({ tipo: 'erro', texto: 'Falha de conexão.' });
    } finally {
      setSalvandoId(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[0.78rem] leading-relaxed text-emerald-50/50">
        Altere o status exibido no portal e publique um aviso para a tropa. Com o envio automático ativo, a
        mudança também é notificada no Discord.
      </p>

      {EDITAIS.map((e) => (
        <div key={e.id} className="rounded-lg border border-white/8 bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-display text-base font-bold tracking-wide text-white">{e.sigla}</p>
              <p className="text-[0.7rem] text-emerald-100/40">{e.nome}</p>
            </div>
            <select
              className="field max-w-[11rem] py-1.5 text-[0.78rem]"
              value={estado[e.id].status}
              onChange={(ev) =>
                setEstado((s) => ({ ...s, [e.id]: { ...s[e.id], status: ev.target.value as EditalStatus } }))
              }
            >
              <option value="aberto" className="bg-ink-900">Inscrições abertas</option>
              <option value="em-breve" className="bg-ink-900">Em breve</option>
              <option value="encerrado" className="bg-ink-900">Encerrado</option>
            </select>
          </div>

          <textarea
            className="field mt-3 min-h-[62px] resize-y text-[0.8rem]"
            value={estado[e.id].aviso}
            onChange={(ev) => setEstado((s) => ({ ...s, [e.id]: { ...s[e.id], aviso: ev.target.value } }))}
            placeholder="Aviso exibido no portal (opcional)"
          />

          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              onClick={() => salvar(e.id)}
              disabled={salvandoId === e.id}
              className="btn-ghost px-3 py-1.5 text-[0.75rem] disabled:opacity-60"
            >
              {salvandoId === e.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Salvar
            </button>
            <button
              onClick={() => salvar(e.id, true)}
              disabled={salvandoId === e.id}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#5865F2]/35 px-3 py-1.5 text-[0.75rem] font-semibold text-[#8b95f7] transition hover:bg-[#5865F2]/12 disabled:opacity-60"
            >
              <Send size={12} />
              Salvar e notificar
            </button>
          </div>
        </div>
      ))}

      {msg && <Aviso tipo={msg.tipo} texto={msg.texto} />}
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
                    await fetch(`${API}/interessados/${i.id}`, { method: 'DELETE', headers: cabecalho() });
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

      const r = await fetch(`${API}/credenciais`, { method: 'PATCH', headers: cabecalho(), body: JSON.stringify(corpo) });
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
