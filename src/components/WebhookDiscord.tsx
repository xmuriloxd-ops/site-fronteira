/**
 * Cadastro do canal do Discord usado pela divulgação.
 *
 * Fica dentro da aba Divulgação: o comando cola o webhook, escolhe o canal e
 * liga o envio automático das fichas. Sem isso, nada é publicado no Discord.
 */

import { useState } from 'react';
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
  Radio,
  Save,
  Send,
} from 'lucide-react';
import { enviarPeloNavegador } from '../lib/discord';

const API = '/api/admin';

export interface ConfigDiscordPainel {
  webhookMascarado: string;
  convite: string;
  canal: string;
  autoEnviar: boolean;
  mencionarHere: boolean;
  vinculado: boolean;
}

/** Interruptor simples, no estilo do painel. */
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
      type="button"
      onClick={() => onChange(!ativo)}
      className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition ${
        ativo ? 'border-emerald-500/40 bg-emerald-500/8' : 'border-white/10 bg-white/[0.02] hover:border-white/25'
      }`}
    >
      <span
        className={`mt-0.5 flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition ${
          ativo ? 'bg-emerald-500' : 'bg-white/20'
        }`}
      >
        <span
          className={`h-3 w-3 rounded-full bg-white transition ${ativo ? 'translate-x-3' : 'translate-x-0'}`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.78rem] font-semibold text-white/90">{titulo}</span>
        <span className="block text-[0.68rem] leading-snug text-emerald-50/45">{descricao}</span>
      </span>
    </button>
  );
}

export function WebhookDiscord({
  config,
  cabecalho,
  onAtualizar,
}: {
  config: ConfigDiscordPainel;
  cabecalho: () => Record<string, string>;
  onAtualizar: () => void;
}) {
  const [webhook, setWebhook] = useState('');
  const [canal, setCanal] = useState(config.canal);
  const [convite, setConvite] = useState(config.convite);
  const [autoEnviar, setAutoEnviar] = useState(config.autoEnviar);
  const [mencionarHere, setMencionarHere] = useState(config.mencionarHere);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);

  /** URL salva no servidor, usada para o teste sair do navegador. */
  const obterWebhook = async (): Promise<string | null> => {
    try {
      const r = await fetch(`${API}/discord/webhook`, {
        headers: cabecalho(),
        credentials: 'same-origin',
      });
      if (!r.ok) return null;
      const d = (await r.json()) as { webhook?: string };
      return d.webhook ?? null;
    } catch {
      return null;
    }
  };

  const salvar = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      const corpo: Record<string, unknown> = { convite, canal, autoEnviar, mencionarHere };
      if (webhook.trim()) corpo.webhook = webhook.trim();

      const r = await fetch(`${API}/discord`, {
        method: 'PATCH',
        headers: { ...cabecalho(), 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(corpo),
      });
      const d = (await r.json().catch(() => ({}))) as { mensagem?: string; erro?: string; vinculado?: boolean };

      if (!r.ok) {
        setMsg({ tipo: 'erro', texto: d.erro ?? `O servidor respondeu ${r.status}. Tente novamente.` });
        return;
      }

      setMsg({
        tipo: 'ok',
        texto: d.vinculado
          ? 'Webhook cadastrado. As fichas e as divulgações já podem ir para este canal.'
          : (d.mensagem ?? 'Configuração salva.'),
      });
      setWebhook('');
      onAtualizar();
    } catch {
      setMsg({ tipo: 'erro', texto: 'Falha de conexão ao salvar o webhook.' });
    } finally {
      setSalvando(false);
    }
  };

  const testar = async () => {
    setTestando(true);
    setMsg(null);
    try {
      const url = (await obterWebhook()) ?? webhook.trim();
      if (!url) {
        setMsg({ tipo: 'erro', texto: 'Cadastre e salve o webhook do canal antes de testar.' });
        return;
      }

      const resultado = await enviarPeloNavegador(url, {
        titulo: '✅ Canal conectado ao portal',
        descricao:
          'Teste de conexão do comando. As fichas preenchidas e as divulgações de inscrições vão aparecer neste canal.',
        cor: 0x0b6b3a,
        campos: [{ name: 'Canal', value: canal || 'não informado', inline: true }],
      });

      setMsg({ tipo: resultado.ok ? 'ok' : 'erro', texto: resultado.detalhe });
      if (resultado.ok) onAtualizar();
    } catch {
      setMsg({ tipo: 'erro', texto: 'Falha inesperada ao enviar o teste.' });
    } finally {
      setTestando(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-[#5865F2]/30 bg-gradient-to-br from-[#1a1f3a]/60 to-ink-950 p-4">
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            config.vinculado ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
          }`}
        >
          <Radio size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.84rem] font-semibold text-white">
            {config.vinculado ? 'Webhook cadastrado' : 'Cadastre o webhook do Discord'}
          </p>
          <p className="truncate text-[0.7rem] text-emerald-50/45">
            {config.webhookMascarado || 'Cole a URL do webhook do canal onde as divulgações serão publicadas.'}
          </p>
        </div>
        {config.vinculado && (
          <span className="badge-pill border border-emerald-400/35 bg-emerald-500/12 text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Ativo
          </span>
        )}
      </div>

      <div>
        <label className="label" htmlFor="webhook-url">
          <Link2 size={11} className="mr-1 inline" />
          URL do webhook
        </label>
        <input
          id="webhook-url"
          className="field"
          value={webhook}
          onChange={(e) => setWebhook(e.target.value)}
          placeholder="https://discord.com/api/webhooks/..."
          type="url"
          autoComplete="off"
        />
        <p className="mt-1 text-[0.66rem] leading-relaxed text-emerald-100/35">
          No Discord: Configurações do canal → Integrações → Webhooks → Copiar URL do webhook. A URL fica
          guardada no servidor e não é exibida novamente.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="webhook-canal">
            Nome do canal
          </label>
          <input
            id="webhook-canal"
            className="field"
            value={canal}
            onChange={(e) => setCanal(e.target.value)}
            placeholder="inscricoes-pmpr"
          />
        </div>
        <div>
          <label className="label" htmlFor="webhook-convite">
            Convite do servidor
          </label>
          <input
            id="webhook-convite"
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
          titulo="Envio automático das fichas"
          descricao="Toda ficha preenchida cai no canal."
        />
        <Toggle
          ativo={mencionarHere}
          onChange={setMencionarHere}
          titulo="Mencionar @here"
          descricao="Avisa os membros online."
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={salvar} disabled={salvando} className="btn-gold px-4 py-2 text-[0.8rem] disabled:opacity-60">
          {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salvar webhook
        </button>
        <button onClick={testar} disabled={testando} className="btn-ghost px-4 py-2 text-[0.8rem] disabled:opacity-60">
          {testando ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />}
          Enviar teste
        </button>
        {config.convite && (
          <a
            href={config.convite}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-ghost px-3 py-2 text-[0.78rem]"
          >
            <ExternalLink size={13} />
            Abrir servidor
          </a>
        )}
      </div>

      {msg && (
        <div
          className={`flex items-start gap-2 rounded-lg border p-2.5 text-[0.76rem] leading-relaxed ${
            msg.tipo === 'ok'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
          }`}
        >
          {msg.tipo === 'ok' ? (
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
          )}
          {msg.texto}
        </div>
      )}

      <p className="flex items-center gap-1.5 text-[0.66rem] text-emerald-100/30">
        <Send size={10} />
        As mensagens saem do navegador do comando, então funcionam mesmo sem acesso do servidor ao Discord.
      </p>
    </div>
  );
}
