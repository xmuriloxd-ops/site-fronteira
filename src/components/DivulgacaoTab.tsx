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
  Loader2,
  Megaphone,
  Printer,
  Save,
  Send,
  UserCog,
} from 'lucide-react';
import { enviarPeloNavegador } from '../lib/discord';
import {
  UNIDADES_DIVULGACAO,
  DocumentoDivulgacao,
  camposDivulgacao,
  corpoDivulgacao,
  tituloDivulgacao,
} from './DocumentoDivulgacao';
import type { DivulgacaoInscricoes } from '../types';

const API = '/api/admin';

export function DivulgacaoTab({
  cabecalho,
  onAtualizar,
  obterWebhook,
  inicial,
}: {
  cabecalho: () => Record<string, string>;
  onAtualizar: () => void;
  obterWebhook: () => Promise<string | null>;
  inicial?: DivulgacaoInscricoes;
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

  const alternarUnidade = (id: string) =>
    setDoc((d) => {
      const tem = d.unidades.includes(id);
      const proximas = tem ? d.unidades.filter((u) => u !== id) : [...d.unidades, id];
      return { ...d, unidades: proximas.length ? proximas : d.unidades };
    });

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

      const resultado = await enviarPeloNavegador(url, {
        titulo: `📣 ${tituloDivulgacao(doc)}`,
        descricao: [
          doc.texto.trim(),
          doc.observacoes.trim() ? `\n_${doc.observacoes.trim()}_` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        cor: 0xd4af37,
        campos: camposDivulgacao(doc),
        mencionarHere: true,
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

      setMsg({ tipo: resultado.ok ? 'ok' : 'erro', texto: resultado.detalhe });
      if (resultado.ok) onAtualizar();
    } finally {
      setPublicando(false);
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
          portal e, ao publicar, vai para o canal do Discord com o @here.
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
        </div>

        {/* ------------------------------- Prévia ------------------------------- */}
        <div className="space-y-2">
          <p className="eyebrow text-emerald-100/40">Prévia do documento</p>
          <DocumentoDivulgacao divulgacao={doc} className="print:border-0" />
          {!carregado && (
            <p className="text-[0.68rem] text-emerald-100/35">Carregando o documento salvo...</p>
          )}
        </div>
      </div>

      <div className="gold-rule" />

      <div className="flex flex-wrap gap-2">
        <button onClick={() => void salvar()} disabled={salvando} className="btn-ghost px-4 py-2 text-[0.8rem] disabled:opacity-60">
          {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salvar documento
        </button>
        <button onClick={publicar} disabled={publicando} className="btn-gold px-4 py-2 text-[0.8rem] disabled:opacity-60">
          {publicando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Publicar no Discord
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
    </div>
  );
}
