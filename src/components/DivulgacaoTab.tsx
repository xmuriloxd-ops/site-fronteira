/**
 * Aba de divulgação: o comando edita o documento das inscrições abertas
 * (unidades, texto, data, horário, responsável) e publica no Discord.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock4,
  Download,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Megaphone,
  Printer,
  Save,
  Send,
  Trash2,
  UserCog,
} from 'lucide-react';
import { enviarPeloNavegador } from '../lib/discord';
import { TEMAS_CARTAZ, gerarCartaz, temaDoCartaz, urlPreviaCartaz } from '../lib/cartaz';
import { WebhookDiscord } from './WebhookDiscord';
import type { ConfigDiscordPainel } from './WebhookDiscord';
import { DocumentoDivulgacao } from './DocumentoDivulgacao';
import {
  UNIDADES_DIVULGACAO,
  corpoDivulgacao,
  tituloDivulgacao,
} from '../lib/documentoTexto';
import type { DivulgacaoInscricoes, EnvioDiscord } from '../types';

const API = '/api/admin';

export function DivulgacaoTab({
  cabecalho,
  onAtualizar,
  obterWebhook,
  inicial,
  discord,
  envios = [],
}: {
  cabecalho: () => Record<string, string>;
  onAtualizar: () => void;
  obterWebhook: () => Promise<string | null>;
  inicial?: DivulgacaoInscricoes;
  /** Configuração do canal salva no servidor. */
  discord: ConfigDiscordPainel;
  /** Histórico de publicações. */
  envios?: EnvioDiscord[];
}) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [doc, setDoc] = useState<DivulgacaoInscricoes>(
    inicial ?? {
      unidades: ['pmpr', 'rotam', 'rone'],
      texto:
        'Estão abertas as inscrições da Polícia Militar do Paraná, da ROTAM e da RONE. Preencha o formulário da unidade pretendida no portal; todas as fichas são analisadas pelo comando.',
      data: hoje,
      horario: '20:00',
      responsavel: 'Comando do 13º BPM',
      link: '',
      observacoes: 'Inscrições gratuitas. Leia os requisitos antes de enviar a ficha.',
    },
  );
  const [carregado, setCarregado] = useState(Boolean(inicial));
  // Cartaz em imagem: prévia e anexo enviado ao Discord
  const [previaCartaz, setPreviaCartaz] = useState<string | null>(null);
  // Unidade cuja arte aparece no cartaz. Clicar na unidade troca o cartaz.
  const [unidadeCartaz, setUnidadeCartaz] = useState<string | null>(inicial?.unidades[0] ?? null);
  const [gerandoCartaz, setGerandoCartaz] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro' | 'info'; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [publicando, setPublicando] = useState(false);

  // Busca a versão salva no servidor (o painel abre na aba sem os dados ainda)
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await fetch(`${API}/divulgacao`, { headers: cabecalho(), credentials: 'same-origin' });
        if (!r.ok) return;
        const d = (await r.json()) as { divulgacao?: DivulgacaoInscricoes };
        if (vivo && d.divulgacao) {
          setDoc(d.divulgacao);
          setUnidadeCartaz((u) => u ?? d.divulgacao!.unidades[0] ?? null);
          setCarregado(true);
        }
      } catch {
        /* mantém os valores locais */
      }
    })();
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alterar = <K extends keyof DivulgacaoInscricoes>(campo: K, valor: DivulgacaoInscricoes[K]) =>
    setDoc((d) => ({ ...d, [campo]: valor }));

  // Redesenha a prévia do cartaz um instante depois de cada edição
  useEffect(() => {
    let cancelado = false;
    let revogar: (() => void) | undefined;
    const t = setTimeout(async () => {
      setGerandoCartaz(true);
      try {
        const previa = await urlPreviaCartaz(doc, { unidade: unidadeCartaz ?? undefined });
        if (cancelado) {
          previa.revogar();
          return;
        }
        revogar = previa.revogar;
        setPreviaCartaz(previa.url);
      } catch {
        /* imagem ainda indisponível: segue com o documento em texto */
      } finally {
        if (!cancelado) setGerandoCartaz(false);
      }
    }, 450);

    return () => {
      cancelado = true;
      clearTimeout(t);
      revogar?.();
    };
  }, [doc, unidadeCartaz]);

  const alternarUnidade = (id: string) => {
    // Clicar na unidade também troca a arte do cartaz (foto e texto).
    setUnidadeCartaz(id);
    setDoc((d) => {
      const tem = d.unidades.includes(id);
      const proximas = tem ? d.unidades.filter((u) => u !== id) : [...d.unidades, id];
      return { ...d, unidades: proximas.length ? proximas : d.unidades };
    });
  };

  const textoCompleto = useMemo(() => {
    const linhas = corpoDivulgacao(doc);
    return `${tituloDivulgacao(doc)}\n\n${linhas.join('\n')}`;
  }, [doc]);

  const salvar = async (avisar = true) => {
    setSalvando(true);
    if (avisar) setMsg(null);
    try {
      const r = await fetch(`${API}/divulgacao`, {
        method: 'PATCH',
        headers: { ...cabecalho(), 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(doc),
      });
      const d = (await r.json().catch(() => ({}))) as { divulgacao?: DivulgacaoInscricoes; erro?: string };
      if (!r.ok) {
        setMsg({ tipo: 'erro', texto: d.erro ?? 'Não foi possível salvar o documento.' });
        return false;
      }
      if (d.divulgacao) setDoc(d.divulgacao);
      if (avisar) setMsg({ tipo: 'ok', texto: 'Documento de divulgação salvo. Ele já aparece no portal.' });
      onAtualizar();
      return true;
    } catch {
      setMsg({ tipo: 'erro', texto: 'Falha de conexão ao salvar o documento.' });
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const publicar = async () => {
    setPublicando(true);
    setMsg(null);
    try {
      // salva antes de publicar, para o portal mostrar o mesmo texto
      const salvou = await salvar(false);
      if (!salvou) return;

      const url = await obterWebhook();
      if (!url) {
        setMsg({
          tipo: 'erro',
          texto: 'Cadastre e salve o webhook do canal antes de divulgar.',
        });
        return;
      }

      // Gera o cartaz em imagem: é a única coisa enviada ao canal
      setGerandoCartaz(true);
      let cartaz: File;
      try {
        cartaz = await gerarCartaz(doc, { unidade: unidadeCartaz ?? undefined });
      } catch {
        setMsg({ tipo: 'erro', texto: 'Não foi possível gerar o cartaz neste navegador.' });
        return;
      } finally {
        setGerandoCartaz(false);
      }

      const resultado = await enviarPeloNavegador(url, {
        arquivo: cartaz,
        somenteImagem: true,
      });

      await fetch(`${API}/envios/registrar`, {
        method: 'POST',
        headers: { ...cabecalho(), 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          editalId: doc.unidades.join('-'),
          titulo: `Divulgação de inscrições — ${doc.unidades.join(' · ').toUpperCase()}`,
          ok: resultado.ok,
          detalhe: resultado.detalhe,
        }),
      }).catch(() => {
        /* o envio já aconteceu */
      });

      setMsg({
        tipo: resultado.ok ? 'ok' : 'erro',
        texto: resultado.ok
          ? 'Cartaz da divulgação publicado no canal.'
          : resultado.detalhe,
      });
      if (resultado.ok) onAtualizar();
    } finally {
      setPublicando(false);
    }
  };

  /** Baixa o cartaz em PNG para uso fora do Discord. */
  const baixarCartaz = async () => {
    try {
      const arquivo = await gerarCartaz(doc, { unidade: unidadeCartaz ?? undefined });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(arquivo);
      link.download = arquivo.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 4000);
      setMsg({ tipo: 'ok', texto: 'Cartaz baixado em PNG.' });
    } catch {
      setMsg({ tipo: 'erro', texto: 'Não foi possível gerar o cartaz neste navegador.' });
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(textoCompleto);
      setMsg({ tipo: 'ok', texto: 'Texto da divulgação copiado.' });
    } catch {
      setMsg({ tipo: 'erro', texto: 'O navegador não permitiu copiar. Selecione o texto na prévia.' });
    }
  };

  const imprimir = () => window.print();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-pmpr-gold/30 bg-pmpr-gold/[0.06] p-3 text-[0.76rem] leading-relaxed text-pmpr-gold-soft/90">
        <p className="flex items-center gap-1.5 font-semibold text-pmpr-gold">
          <Megaphone size={13} /> Documento de divulgação das inscrições
        </p>
        <p className="mt-1 opacity-85">
          Escolha as unidades, edite o texto, a data e o horário e quem está divulgando. O documento é salvo no
          portal. Ao publicar, o canal do Discord recebe{' '}
          <strong className="font-semibold text-pmpr-gold">somente o cartaz em imagem</strong> — sem o texto do
          documento. O @here segue a configuração do canal.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        {/* ------------------------------- Editor ------------------------------- */}
        <div className="space-y-3">
          <div>
            <span className="label">Unidades da divulgação</span>
            <div className="mt-1 grid gap-1.5 sm:grid-cols-3">
              {UNIDADES_DIVULGACAO.map((u) => {
                const ativo = doc.unidades.includes(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => alternarUnidade(u.id)}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${
                      ativo
                        ? 'border-pmpr-gold/50 bg-pmpr-gold/12'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        ativo ? 'border-pmpr-gold bg-pmpr-gold text-ink-950' : 'border-white/25'
                      }`}
                    >
                      {ativo && <CheckCircle2 size={11} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.76rem] font-bold text-white/90">{u.sigla}</span>
                      <span className="block truncate text-[0.62rem] text-emerald-50/40">{u.nome}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="div-texto">
              Texto da divulgação
            </label>
            <textarea
              id="div-texto"
              className="field min-h-[110px] resize-y text-[0.82rem]"
              value={doc.texto}
              maxLength={1200}
              onChange={(e) => alterar('texto', e.target.value)}
              placeholder="Escreva a chamada da divulgação..."
            />
            <p className="mt-1 text-right text-[0.62rem] text-emerald-100/30">{doc.texto.length}/1200</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="div-data">
                <CalendarDays size={11} className="mr-1 inline" />
                Data
              </label>
              <input
                id="div-data"
                type="date"
                className="field"
                value={doc.data}
                onChange={(e) => alterar('data', e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="div-hora">
                <Clock4 size={11} className="mr-1 inline" />
                Horário
              </label>
              <input
                id="div-hora"
                type="time"
                className="field"
                value={doc.horario}
                onChange={(e) => alterar('horario', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="div-responsavel">
              <UserCog size={11} className="mr-1 inline" />
              Quem está divulgando
            </label>
            <input
              id="div-responsavel"
              className="field"
              value={doc.responsavel}
              maxLength={120}
              onChange={(e) => alterar('responsavel', e.target.value)}
              placeholder="Ex.: Cap. Oliveira — Cmt do 13º BPM"
            />
          </div>

          <div>
            <label className="label" htmlFor="div-link">
              Link do formulário (opcional)
            </label>
            <input
              id="div-link"
              className="field"
              value={doc.link}
              maxLength={300}
              onChange={(e) => alterar('link', e.target.value)}
              placeholder="https://... (deixe vazio para usar o portal)"
            />
          </div>

          <div>
            <label className="label" htmlFor="div-obs">
              Observações (opcional)
            </label>
            <textarea
              id="div-obs"
              className="field min-h-[56px] resize-y text-[0.82rem]"
              value={doc.observacoes}
              maxLength={600}
              onChange={(e) => alterar('observacoes', e.target.value)}
              placeholder="Avisos que aparecem em itálico no fim do documento"
            />
          </div>

          {/* Prova de ingresso: só a arte da ROTAM e da RONE mostra estes dados */}
          {temaDoCartaz(unidadeCartaz).mostraProva && (
            <div className="rounded-lg border border-pmpr-gold/25 bg-pmpr-gold/[0.05] p-3">
              <p className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-pmpr-gold">
                <MapPin size={12} />
                Prova de ingresso
              </p>
              <p className="mt-1 text-[0.64rem] leading-relaxed text-emerald-100/40">
                Data, horário e local do dia da prova. Aparecem no cartaz da{' '}
                {temaDoCartaz(unidadeCartaz).nome.toUpperCase()}.
              </p>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="prova-data">
                    <CalendarDays size={11} className="mr-1 inline" />
                    Data da prova
                  </label>
                  <input
                    id="prova-data"
                    type="date"
                    className="field"
                    value={doc.provaData ?? ''}
                    onChange={(e) => alterar('provaData', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="prova-hora">
                    <Clock4 size={11} className="mr-1 inline" />
                    Horário da prova
                  </label>
                  <input
                    id="prova-hora"
                    type="time"
                    className="field"
                    value={doc.provaHorario ?? ''}
                    onChange={(e) => alterar('provaHorario', e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-2">
                <label className="label" htmlFor="prova-local">
                  <MapPin size={11} className="mr-1 inline" />
                  Local da prova
                </label>
                <input
                  id="prova-local"
                  className="field text-[0.82rem]"
                  value={doc.provaLocal ?? ''}
                  maxLength={160}
                  onChange={(e) => alterar('provaLocal', e.target.value)}
                  placeholder="Ex.: Batalhão de Rondas Ostensivas — Curitiba/PR"
                />
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------- Prévia ------------------------------- */}
        <div className="space-y-2">
          <p className="eyebrow text-emerald-100/40">Prévia do documento</p>
          <DocumentoDivulgacao divulgacao={doc} className="print:border-0" />
          {!carregado && (
            <p className="text-[0.68rem] text-emerald-100/35">Carregando o documento salvo...</p>
          )}

          {/* Cartaz em imagem enviado junto do texto */}
          <div className="rounded-xl border border-pmpr-gold/25 bg-ink-950/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="eyebrow text-emerald-100/45">
                Cartaz da divulgação ·{' '}
                <span className="text-pmpr-gold">{temaDoCartaz(unidadeCartaz).nome.toUpperCase()}</span>
              </p>
              <button
                onClick={baixarCartaz}
                className="flex items-center gap-1 rounded border border-white/12 px-2 py-1 text-[0.66rem] font-semibold text-emerald-100/60 transition hover:border-pmpr-gold/40 hover:text-pmpr-gold"
              >
                <Download size={10} />
                Baixar PNG
              </button>
            </div>

            <div className="relative mt-2 overflow-hidden rounded-lg border border-white/10 bg-black/40">
              {previaCartaz ? (
                <img src={previaCartaz} alt="Prévia do cartaz de divulgação" className="w-full" />
              ) : (
                <div className="flex h-40 items-center justify-center text-emerald-100/30">
                  <ImageIcon size={18} />
                </div>
              )}
              {gerandoCartaz && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                  <Loader2 size={18} className="animate-spin text-pmpr-gold" />
                </div>
              )}
            </div>

            <p className="mt-2 text-[0.66rem] leading-relaxed text-emerald-100/35">
              A arte acompanha a unidade: clique em PMPR, ROTAM ou RONE para trocar a foto e os textos do
              cartaz. O texto dentro da arte é automático.
            </p>

            <div className="mt-2 grid grid-cols-3 gap-1">
              {(Object.keys(TEMAS_CARTAZ) as (keyof typeof TEMAS_CARTAZ)[]).map((id) => {
                const tema = TEMAS_CARTAZ[id];
                const ativo = temaDoCartaz(unidadeCartaz).id === id;
                return (
                  <button
                    key={id}
                    onClick={() => setUnidadeCartaz(id)}
                    className={`rounded border px-1.5 py-1 text-[0.64rem] font-bold transition ${
                      ativo
                        ? 'border-pmpr-gold/60 bg-pmpr-gold/15 text-pmpr-gold'
                        : 'border-white/10 text-emerald-100/50 hover:border-white/25 hover:text-white'
                    }`}
                    title={`Cartaz da ${tema.nome}`}
                  >
                    {tema.id === 'pmpr' ? 'PMPR' : tema.id.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="gold-rule" />

      <div className="flex flex-wrap gap-2">
        <button onClick={() => void salvar()} disabled={salvando} className="btn-ghost px-4 py-2 text-[0.8rem] disabled:opacity-60">
          {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salvar documento
        </button>
        <button onClick={publicar} disabled={publicando} className="btn-gold px-4 py-2 text-[0.8rem] disabled:opacity-60">
          {publicando ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
          Enviar só o cartaz ao Discord
        </button>
        <button onClick={copiar} className="btn-ghost px-3 py-2 text-[0.78rem]">
          <Download size={13} />
          Copiar texto
        </button>
        <button onClick={imprimir} className="btn-ghost px-3 py-2 text-[0.78rem]">
          <Printer size={13} />
          Imprimir / PDF
        </button>
      </div>

      {msg && (
        <div
          className={`flex items-start gap-2 rounded-lg border p-3 text-[0.78rem] leading-relaxed ${
            msg.tipo === 'ok'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : msg.tipo === 'info'
                ? 'border-sky-500/40 bg-sky-500/10 text-sky-200'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
          }`}
        >
          {msg.tipo === 'ok' ? (
            <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
          )}
          {msg.texto}
        </div>
      )}

      <div className="gold-rule" />

      {/* Cadastro do canal do Discord usado nesta divulgação */}
      <div>
        <p className="eyebrow mb-2 text-emerald-100/40">Canal do Discord</p>
        <WebhookDiscord config={discord} cabecalho={cabecalho} onAtualizar={onAtualizar} />
      </div>

      {/* Histórico de publicações */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow text-emerald-100/40">Histórico de divulgações</p>
          {envios.length > 0 && (
            <button
              onClick={async () => {
                await fetch(`${API}/envios`, {
                  method: 'DELETE',
                  headers: cabecalho(),
                  credentials: 'same-origin',
                });
                onAtualizar();
              }}
              className="flex items-center gap-1 text-[0.68rem] text-emerald-100/35 hover:text-rose-300"
            >
              <Trash2 size={11} />
              Limpar
            </button>
          )}
        </div>
        {envios.length === 0 ? (
          <p className="rounded-lg border border-white/8 bg-white/[0.02] p-3 text-center text-[0.76rem] text-emerald-100/35">
            Nenhuma divulgação publicada ainda.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {envios.slice(0, 6).map((envio) => (
              <li
                key={envio.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-[0.76rem] font-semibold text-white/85">{envio.titulo}</p>
                  <p className="truncate text-[0.66rem] text-emerald-100/35">
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
