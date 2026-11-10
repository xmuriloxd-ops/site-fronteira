import { useEffect, useState } from 'react';
import { Send, CheckCircle2, AlertCircle, MessageSquare, BellRing, Loader2, Link2 } from 'lucide-react';
import { EDITAIS } from '../data/editais';
import type { AppConfigPublica, Edital } from '../types';
import { Section, SectionHeading } from './ui';

type Resultado = { tipo: 'ok' | 'erro'; texto: string } | null;

export function DiscordSection({
  config,
  editalPreSelecionado,
  onAtualizarConfig,
}: {
  config: AppConfigPublica | null;
  editalPreSelecionado: string | null;
  onAtualizarConfig: () => void;
}) {
  const [nome, setNome] = useState('');
  const [discord, setDiscord] = useState('');
  const [selecionados, setSelecionados] = useState<string[]>(['pmpr-soldado']);
  const [resultado, setResultado] = useState<Resultado>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (editalPreSelecionado) {
      setSelecionados((atual) =>
        atual.includes(editalPreSelecionado) ? atual : [...atual, editalPreSelecionado],
      );
    }
  }, [editalPreSelecionado]);

  const alternar = (id: string) => {
    setSelecionados((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  };

  const enviar = async () => {
    setResultado(null);
    if (nome.trim().length < 3) {
      setResultado({ tipo: 'erro', texto: 'Informe seu nome completo.' });
      return;
    }
    if (discord.trim().length < 3) {
      setResultado({ tipo: 'erro', texto: 'Informe seu usuário do Discord.' });
      return;
    }
    if (selecionados.length === 0) {
      setResultado({ tipo: 'erro', texto: 'Selecione ao menos um edital.' });
      return;
    }

    setEnviando(true);
    try {
      const resposta = await fetch('/api/public/interesse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, discord, editais: selecionados }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setResultado({ tipo: 'erro', texto: dados.erro ?? 'Não foi possível concluir o vínculo.' });
      } else {
        setResultado({ tipo: 'ok', texto: dados.aviso });
        setNome('');
        setDiscord('');
        onAtualizarConfig();
      }
    } catch {
      setResultado({ tipo: 'erro', texto: 'Falha de conexão com o servidor.' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Section id="discord" className="py-16 sm:py-24">
      <div className="overflow-hidden rounded-2xl border border-[#5865F2]/25 bg-gradient-to-br from-[#1a1f3a]/70 via-ink-900 to-ink-950">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          {/* Texto */}
          <div className="border-b border-white/8 p-6 sm:p-9 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5865F2]/15 ring-1 ring-[#5865F2]/35">
                <MessageSquare size={22} className="text-[#8b95f7]" />
              </div>
              <div>
                <p className="eyebrow text-[#8b95f7]/80">Integração</p>
                <p className="font-display text-xl font-bold uppercase tracking-wide text-white">Discord PMPR</p>
              </div>
            </div>

            <h2 className="display-title mt-6 text-3xl text-white sm:text-4xl">
              Receba cada edital <span className="gold-text">direto no Discord</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-emerald-50/60">
              Vincule seu usuário e escolha quais seleções quer acompanhar. Sempre que o comando publicar uma
              atualização, o portal envia a notificação para o canal da tropa.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                { Icon: BellRing, titulo: 'Avisos de abertura', texto: 'Notificação assim que as inscrições abrirem.' },
                { Icon: Send, titulo: 'Edital completo', texto: 'Requisitos, etapas e cronograma resumidos no canal.' },
                { Icon: Link2, titulo: 'Vínculo por usuário', texto: 'O comando vê quem está acompanhando cada edital.' },
              ].map(({ Icon, titulo, texto }) => (
                <li key={titulo} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[#8b95f7]">
                    <Icon size={15} />
                  </div>
                  <div>
                    <p className="text-[0.82rem] font-semibold text-white">{titulo}</p>
                    <p className="text-[0.76rem] text-emerald-50/50">{texto}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span
                className={`badge-pill ${
                  config?.discordVinculado
                    ? 'border border-emerald-400/35 bg-emerald-500/12 text-emerald-300'
                    : 'border border-amber-400/30 bg-amber-500/10 text-amber-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    config?.discordVinculado ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                {config?.discordVinculado ? 'Bot conectado ao servidor' : 'Aguardando configuração do comando'}
              </span>
              {config?.canalDiscord && (
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[0.68rem] text-emerald-100/50">
                  #{config.canalDiscord}
                </span>
              )}
              {config?.conviteDiscord && (
                <a
                  href={config.conviteDiscord}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-full border border-[#5865F2]/40 px-2.5 py-1 text-[0.68rem] font-semibold text-[#8b95f7] transition hover:bg-[#5865F2]/15"
                >
                  Entrar no servidor
                </a>
              )}
            </div>
          </div>

          {/* Formulário */}
          <div className="p-6 sm:p-9">
            <p className="font-display text-lg font-bold uppercase tracking-wide text-white">Vincular meu Discord</p>
            <p className="mt-1 text-[0.78rem] text-emerald-50/50">
              Leva menos de um minuto. Nenhum dado sensível é solicitado.
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <label className="label" htmlFor="nome">
                  Nome completo
                </label>
                <input
                  id="nome"
                  className="field"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: João Batista da Silva"
                />
              </div>
              <div>
                <label className="label" htmlFor="discord">
                  Usuário do Discord
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-emerald-100/35">
                    @
                  </span>
                  <input
                    id="discord"
                    className="field pl-7"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    placeholder="seu.usuario"
                  />
                </div>
              </div>

              <div>
                <span className="label">Editais de interesse</span>
                <div className="grid gap-1.5">
                  {EDITAIS.map((e: Edital) => {
                    const ativo = selecionados.includes(e.id);
                    return (
                      <button
                        key={e.id}
                        onClick={() => alternar(e.id)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                          ativo
                            ? 'border-pmpr-gold/45 bg-pmpr-gold/10'
                            : 'border-white/8 bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded border ${
                              ativo ? 'border-pmpr-gold bg-pmpr-gold text-ink-950' : 'border-white/25'
                            }`}
                          >
                            {ativo && <CheckCircle2 size={11} strokeWidth={3} />}
                          </span>
                          <span className="text-[0.8rem] font-semibold text-white/90">{e.sigla}</span>
                          <span className="text-[0.72rem] text-emerald-50/45">{e.nome}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button onClick={enviar} disabled={enviando} className="btn-gold w-full text-sm disabled:opacity-60">
                {enviando ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {enviando ? 'Vinculando...' : 'Vincular e receber editais'}
              </button>

              {resultado && (
                <div
                  className={`flex items-start gap-2 rounded-lg border p-3 text-[0.78rem] leading-relaxed ${
                    resultado.tipo === 'ok'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                  }`}
                >
                  {resultado.tipo === 'ok' ? (
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  )}
                  {resultado.texto}
                </div>
              )}

              <p className="text-center text-[0.68rem] text-emerald-100/30">
                {config?.interessados ?? 0} pessoa(s) já vinculadas ao portal
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
