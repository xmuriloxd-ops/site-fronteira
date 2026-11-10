import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Send,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ShieldCheck,
  User,
  IdCard,
  CalendarDays,
} from 'lucide-react';
import { FORMULARIO_RECRUTAMENTO } from '../data/recrutamento';
import { entregarFichaNoDiscord } from '../lib/entregaFicha';
import type { InscricaoRecrutamento, FormularioRecrutamento, RespostaInscricao } from '../types';

type Respostas = Record<string, string>;

/**
 * Formulário preenchível. Aceita qualquer ficha (13º BPM, ROTAM, RONE...):
 * o padrão é o formulário do 13º BPM, mas o componente não depende dele.
 */
export function FormularioModal({
  onClose,
  formulario = FORMULARIO_RECRUTAMENTO,
}: {
  onClose: () => void;
  formulario?: FormularioRecrutamento;
}) {
  const FORM = formulario;
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [idRp, setIdRp] = useState('');
  const [respostas, setRespostas] = useState<Respostas>({});
  // texto do "Outro:" de cada pergunta que permite alternativa
  const [outros, setOutros] = useState<Record<string, string>>({});
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState<InscricaoRecrutamento | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  // Estado da entrega automática no Discord, mostrado na tela de confirmação.
  const [entrega, setEntrega] = useState<{ tentou: boolean; ok: boolean; detalhe: string } | null>(null);
  const [entregando, setEntregando] = useState(false);
  const corpoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', aoTeclar);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = anterior;
    };
  }, [onClose]);

  const respondidas = useMemo(() => {
    // A identificação conta como um único bloco (nome + idade + ID).
    let total = nome.trim() && idade.trim() && idRp.trim() ? 1 : 0;

    FORM.campos.forEach((c) => {
      if (c.tipo === 'identificacao') return;
      // Na pergunta da escala, vale a opção marcada OU o campo "Outro".
      const valor = c.permiteOutro ? respostas[c.id] || outros[c.id] : respostas[c.id];
      if (!valor) return;
      if (c.minimoCaracteres && valor.trim().length < c.minimoCaracteres) return;
      total += 1;
    });

    return total;
  }, [nome, idade, idRp, respostas, outros]);

  const totalCampos = FORM.campos.length;
  const progresso = Math.round((respondidas / totalCampos) * 100);

  const validar = () => {
    const novos: Record<string, string> = {};
    if (!nome.trim()) novos.identificacao = 'Informe o nome dentro da cidade.';
    else if (!idade.trim()) novos.identificacao = 'Informe a idade (fora do RP).';
    else if (!idRp.trim()) novos.identificacao = 'Informe o ID (dentro do RP).';

    FORM.campos.forEach((c) => {
      if (c.tipo === 'identificacao') return;
      const valor = c.permiteOutro ? respostas[c.id] || outros[c.id] : respostas[c.id];
      if (c.obrigatorio && (!valor || !valor.trim())) {
        novos[c.id] = 'Esta resposta é obrigatória.';
      } else if (c.minimoCaracteres && valor && valor.trim().length < c.minimoCaracteres) {
        novos[c.id] = `Escreva ao menos ${c.minimoCaracteres} caracteres (atual: ${valor.trim().length}).`;
      }
    });

    setErros(novos);
    return Object.keys(novos).length === 0;
  };

  const enviar = async () => {
    setErroGeral(null);
    if (!validar()) {
      const primeiro = document.querySelector('[data-erro="true"]');
      primeiro?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setEnviando(true);
    try {
      // texto livre de "Outro:" por campo (substitui a opção quando preenchido)
      const outrosPreenchidos: Record<string, string> = {};
      const pares = Object.keys(outros).map((k) => [k, outros[k]] as [string, string]);
      for (const [chave, texto] of pares) {
        const limpo = texto.trim();
        if (limpo) outrosPreenchidos[chave] = respostas[chave] || limpo;
      }

      const corpo = {
        formularioId: FORM.id,
        nome: nome.trim(),
        idade: idade.trim(),
        idRp: idRp.trim(),
        respostas: {
          ...respostas,
          // o texto livre de "Outro:" entra no lugar da opção, por campo
          ...outrosPreenchidos,
        },
      };
      const r = await fetch('/api/public/recrutamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      const dados = (await r.json()) as RespostaInscricao & { erro?: string };
      if (!r.ok) {
        setErroGeral(dados.erro ?? 'Não foi possível enviar a inscrição.');
        return;
      }
      setEnviado(dados.inscricao);
      corpoRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

      // Ficha preenchida → vai automaticamente para o Discord cadastrado.
      setEntregando(true);
      try {
        const resultado = await entregarFichaNoDiscord(dados.inscricao, dados.discord);
        setEntrega(resultado);
      } finally {
        setEntregando(false);
      }
    } catch {
      setErroGeral('Falha de conexão com o servidor. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const imprimir = () => window.print();

  return (
    <div className="fixed inset-0 z-[92] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex h-[96vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-pmpr-gold/25 bg-[#f7f4ea] text-[#1a2419] shadow-2xl sm:h-[93vh] sm:rounded-2xl print:h-auto print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        {/* Barra superior */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-pmpr-green/20 bg-ink-900 px-3 py-2.5 text-emerald-50 print:hidden sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="font-display shrink-0 rounded bg-emerald-500/20 px-2 py-0.5 text-[0.68rem] font-bold tracking-wide text-emerald-300">
              13º BPM
            </span>
            <p className="truncate text-[0.78rem] font-semibold text-white/85">Recrutamento · Nov 2026</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={imprimir}
              className="flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-[0.72rem] font-semibold text-emerald-50/70 transition hover:border-pmpr-gold/40 hover:text-pmpr-gold"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-md border border-white/10 p-1.5 text-emerald-50/60 transition hover:border-rose-400/40 hover:text-rose-300"
              aria-label="Fechar"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Barra de progresso */}
        {!enviado && (
          <div className="shrink-0 border-b border-pmpr-green/15 bg-[#f1ede0] px-4 py-2 print:hidden sm:px-6">
            <div className="flex items-center justify-between text-[0.66rem] font-semibold text-[#4a5c4a]">
              <span>
                {respondidas} de {totalCampos} campos
              </span>
              <span>{progresso}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#d9d3c0]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-pmpr-gold transition-all"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        )}

        <div ref={corpoRef} className="min-h-0 flex-1 overflow-y-auto print:overflow-visible">
          {enviado ? (
            /* ------------------------- Confirmação ------------------------- */
            <div className="mx-auto max-w-xl px-5 py-12 text-center sm:px-8">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600/12">
                <CheckCircle2 size={40} className="text-emerald-700" />
              </div>
              <h2 className="font-display mt-4 text-2xl font-bold uppercase text-[#0b2a17]">
                Inscrição registrada
              </h2>
              <p className="mt-2 text-[0.84rem] leading-relaxed text-[#3c4a3c]">
                Protocolo{' '}
                <span className="rounded bg-[#e5dfcd] px-1.5 py-0.5 font-mono text-[0.78rem] font-bold text-[#0b2a17]">
                  {enviado.id.slice(0, 8).toUpperCase()}
                </span>
              </p>
              <div className="mt-5 rounded-lg border border-pmpr-green/25 bg-white/60 p-4 text-left">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#7a8a7a]">Candidato</p>
                <p className="mt-0.5 text-[0.9rem] font-semibold text-[#0b2a17]">{enviado.nome}</p>
                <p className="text-[0.78rem] text-[#4a5c4a]">
                  {enviado.idade} anos · ID {enviado.idRp}
                </p>
                <div className="gold-rule my-3" />
                <p className="text-[0.78rem] leading-relaxed text-[#3c4a3c]">
                  Suas respostas foram enviadas ao comando do 13º Batalhão e serão avaliadas considerando
                  conhecimento, coerência, disciplina e compreensão das regras de Roleplay.
                </p>
              </div>
              {/* Entrega automática no Discord */}
              {entregando && (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-[#5865F2]/30 bg-[#5865F2]/8 px-3 py-2.5 text-[0.78rem] font-semibold text-[#4b55c9]">
                  <Loader2 size={14} className="animate-spin" />
                  Enviando a ficha para o Discord do comando...
                </div>
              )}

              {!entregando && entrega?.ok && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-600/35 bg-emerald-600/8 px-3 py-2.5 text-left text-[0.78rem] leading-relaxed text-[#0b5c33]">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                  <span>
                    <strong className="font-semibold">Ficha entregue no Discord do comando.</strong> A inscrição já
                    está no canal cadastrado para análise.
                  </span>
                </div>
              )}

              {!entregando && entrega?.tentou && !entrega.ok && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-left text-[0.78rem] leading-relaxed text-[#7a5200]">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>
                    <strong className="font-semibold">Sua ficha está salva no portal</strong>, mas não foi possível
                    entregar no Discord agora. O comando ainda recebe a inscrição pelo painel.
                    <span className="mt-1 block text-[0.72rem] opacity-75">{entrega.detalhe}</span>
                  </span>
                </div>
              )}

              {!entregando && entrega && !entrega.tentou && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#d9d3c0] bg-[#efe9d8] px-3 py-2.5 text-left text-[0.78rem] leading-relaxed text-[#5c5340]">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0" />
                  <span>
                    <strong className="font-semibold">Inscrição registrada no portal.</strong> O comando ainda não
                    cadastrou o canal do Discord; a ficha já está no painel para análise.
                  </span>
                </div>
              )}

              <p className="mt-4 text-[0.78rem] leading-relaxed text-[#4a5c4a]">
                Guarde o protocolo. Os candidatos selecionados serão convocados para as próximas etapas do
                recrutamento.
              </p>
              <button
                onClick={onClose}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0b6b3a] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
              >
                Concluir
                <ChevronRight size={15} />
              </button>
            </div>
          ) : (
            <article className="mx-auto max-w-2xl px-5 py-7 sm:px-9 sm:py-9 print:max-w-none print:px-0 print:py-0">
              {/* Cabeçalho do formulário */}
              <header className="border-b-2 border-pmpr-green/40 pb-4">
                <div className="flex items-start justify-center gap-3">
                  <img src="/pmpr-brasao.png" alt="Brasão da PMPR" className="h-16 w-16 shrink-0" />
                  <div className="text-center">
                    <h1 className="font-display text-lg font-bold uppercase leading-tight text-[#0b2a17] sm:text-xl">
                      {FORM.titulo}
                    </h1>
                    <p className="mt-1 text-[0.7rem] font-bold uppercase leading-snug tracking-wide text-[#3c4a3c]">
                      {FORM.subtitulo}
                    </p>
                  </div>
                </div>
              </header>

              {/* Introdução */}
              <div className="mt-4 space-y-3">
                <p className="text-justify text-[0.8rem] leading-relaxed text-[#263326]">{FORM.introducao}</p>

                <div className="rounded border border-pmpr-green/25 bg-white/50 p-3">
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-pmpr-green">
                    Orientações aos candidatos
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {FORM.orientacoes.map((o) => (
                      <li key={o} className="flex gap-1.5 text-[0.76rem] leading-relaxed text-[#3c4a3c]">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-pmpr-green/60" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="whitespace-pre-line text-center text-[0.8rem] font-semibold leading-relaxed text-[#0b2a17]">
                  {FORM.rodape}
                </p>
              </div>

              <div className="my-5 flex items-center gap-2 border-y border-pmpr-green/25 py-2">
                <span className="rounded bg-[#0b6b3a] px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
                  Obrigatório
                </span>
                <p className="text-[0.68rem] text-[#5c6b5c]">* Indica uma pergunta obrigatória</p>
              </div>

              {/* Campo de identificação */}
              <section
                data-erro={Boolean(erros.identificacao)}
                className={`rounded-lg border p-3.5 ${
                  erros.identificacao ? 'border-rose-400 bg-rose-50' : 'border-pmpr-green/25 bg-white/55'
                }`}
              >
                <p className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-[#0b2a17]">
                  <User size={13} className="text-pmpr-green" />
                  Nome (dentro da cidade), idade (fora do RP) e ID (dentro do RP)
                  <span className="text-rose-600">*</span>
                </p>
                <div className="mt-2.5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_5rem_6rem]">
                  <label className="block">
                    <span className="text-[0.6rem] font-bold uppercase tracking-wider text-[#5c6b5c]">Nome</span>
                    <input
                      className="mt-0.5 w-full rounded border border-pmpr-green/30 bg-white px-2.5 py-2 text-[0.82rem] text-[#1a2419] outline-none focus:border-pmpr-green"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Nome na cidade"
                    />
                  </label>
                  <label className="block">
                    <span className="flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider text-[#5c6b5c]">
                      <CalendarDays size={9} />
                      Idade
                    </span>
                    <input
                      className="mt-0.5 w-full rounded border border-pmpr-green/30 bg-white px-2.5 py-2 text-[0.82rem] text-[#1a2419] outline-none focus:border-pmpr-green"
                      value={idade}
                      onChange={(e) => setIdade(e.target.value)}
                      placeholder="Ex.: 21"
                      inputMode="numeric"
                    />
                  </label>
                  <label className="block">
                    <span className="flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider text-[#5c6b5c]">
                      <IdCard size={9} />
                      ID
                    </span>
                    <input
                      className="mt-0.5 w-full rounded border border-pmpr-green/30 bg-white px-2.5 py-2 text-[0.82rem] text-[#1a2419] outline-none focus:border-pmpr-green"
                      value={idRp}
                      onChange={(e) => setIdRp(e.target.value)}
                      placeholder="Ex.: 1234"
                    />
                  </label>
                </div>
                {erros.identificacao && (
                  <p className="mt-1.5 flex items-center gap-1 text-[0.72rem] font-semibold text-rose-600">
                    <AlertCircle size={11} />
                    {erros.identificacao}
                  </p>
                )}
              </section>

              {/* Perguntas */}
              <div className="mt-4 space-y-3">
                {FORM.campos
                  .filter((c) => c.tipo !== 'identificacao')
                  .map((campo) => {
                    const valor = respostas[campo.id] ?? '';
                    const erro = erros[campo.id];
                    const contador = valor.trim().length;
                    const minimo = campo.minimoCaracteres;

                    return (
                      <section
                        key={campo.id}
                        data-erro={Boolean(erro)}
                        className={`rounded-lg border p-3.5 ${
                          erro ? 'border-rose-400 bg-rose-50' : 'border-pmpr-green/25 bg-white/55'
                        }`}
                      >
                        <p className="flex gap-1.5 text-[0.82rem] font-semibold leading-snug text-[#0b2a17]">
                          <span className="shrink-0 font-bold text-pmpr-green">{campo.numero}.</span>
                          <span>
                            {campo.titulo}
                            {campo.obrigatorio && <span className="ml-0.5 text-rose-600">*</span>}
                          </span>
                        </p>
                        {campo.ajuda && (
                          <p className="mt-1 pl-5 text-[0.7rem] leading-relaxed text-[#6b7a6b]">{campo.ajuda}</p>
                        )}

                        <div className="mt-2 pl-5">
                          {(campo.tipo === 'texto' || campo.tipo === 'texto-longo') && (
                            <>
                              {campo.tipo === 'texto' ? (
                                // resposta curta (QRA, UND): uma linha só
                                <input
                                  type="text"
                                  className="w-full rounded border border-pmpr-green/30 bg-white px-2.5 py-2 text-[0.82rem] leading-relaxed text-[#1a2419] outline-none focus:border-pmpr-green"
                                  value={valor}
                                  placeholder={campo.placeholder ?? 'Escreva sua resposta...'}
                                  onChange={(e) =>
                                    setRespostas((r) => ({ ...r, [campo.id]: e.target.value }))
                                  }
                                />
                              ) : (
                                <textarea
                                  className="w-full resize-y rounded border border-pmpr-green/30 bg-white px-2.5 py-2 text-[0.82rem] leading-relaxed text-[#1a2419] outline-none focus:border-pmpr-green"
                                  rows={4}
                                  value={valor}
                                  placeholder={campo.placeholder ?? 'Escreva sua resposta...'}
                                  onChange={(e) =>
                                    setRespostas((r) => ({ ...r, [campo.id]: e.target.value }))
                                  }
                                />
                              )}
                              <div className="mt-1 flex items-center justify-between text-[0.64rem]">
                                <span className={erro ? 'font-semibold text-rose-600' : 'text-[#7a8a7a]'}>
                                  {erro ?? (minimo ? `Mínimo de ${minimo} caracteres` : '')}
                                </span>
                                <span className={minimo && contador >= minimo ? 'text-emerald-700' : 'text-[#7a8a7a]'}>
                                  {contador}
                                  {minimo ? `/${minimo}` : ''}
                                </span>
                              </div>
                            </>
                          )}

                          {campo.tipo === 'opcoes' && (
                            <div className="space-y-1.5">
                              {campo.opcoes?.map((opcao) => {
                                const ativo = valor === opcao;
                                return (
                                  <button
                                    key={opcao}
                                    type="button"
                                    onClick={() => setRespostas((r) => ({ ...r, [campo.id]: opcao }))}
                                    className={`flex w-full items-center gap-2 rounded border px-2.5 py-2 text-left text-[0.8rem] transition ${
                                      ativo
                                        ? 'border-pmpr-green bg-pmpr-green/10 font-semibold text-[#0b2a17]'
                                        : 'border-[#d9d3c0] bg-white hover:border-pmpr-green/50'
                                    }`}
                                  >
                                    <span
                                      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 ${
                                        ativo ? 'border-pmpr-green' : 'border-[#b6bda8]'
                                      }`}
                                    >
                                      {ativo && <span className="h-1.5 w-1.5 rounded-full bg-pmpr-green" />}
                                    </span>
                                    {opcao}
                                  </button>
                                );
                              })}
                              {erro && (
                                <p className="flex items-center gap-1 text-[0.72rem] font-semibold text-rose-600">
                                  <AlertCircle size={11} />
                                  {erro}
                                </p>
                              )}
                            </div>
                          )}

                          {campo.tipo === 'opcoes-outro' && (
                            <div className="space-y-1.5">
                              {campo.opcoes?.map((opcao) => {
                                const ativo = respostas[campo.id] === opcao;
                                return (
                                  <button
                                    key={opcao}
                                    type="button"
                                    onClick={() => {
                                      setRespostas((r) => ({ ...r, [campo.id]: opcao }));
                                      setOutros((o) => ({ ...o, [campo.id]: '' }));
                                    }}
                                    className={`flex w-full items-center gap-2 rounded border px-2.5 py-2 text-left text-[0.8rem] transition ${
                                      ativo
                                        ? 'border-pmpr-green bg-pmpr-green/10 font-semibold text-[#0b2a17]'
                                        : 'border-[#d9d3c0] bg-white hover:border-pmpr-green/50'
                                    }`}
                                  >
                                    <span
                                      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 ${
                                        ativo ? 'border-pmpr-green' : 'border-[#b6bda8]'
                                      }`}
                                    >
                                      {ativo && <span className="h-1.5 w-1.5 rounded-full bg-pmpr-green" />}
                                    </span>
                                    {opcao}
                                  </button>
                                );
                              })}
                              <div>
                                <span className="text-[0.66rem] font-semibold uppercase tracking-wider text-[#5c6b5c]">
                                  Outro:
                                </span>
                                <input
                                  className="mt-1 w-full rounded border border-pmpr-green/30 bg-white px-2.5 py-2 text-[0.82rem] text-[#1a2419] outline-none focus:border-pmpr-green"
                                  value={outros[campo.id] ?? ''}
                                  placeholder="Descreva outra condição, se houver"
                                  onChange={(e) => {
                                    const texto = e.target.value;
                                    setOutros((o) => ({ ...o, [campo.id]: texto }));
                                    if (texto.trim()) {
                                      setRespostas((r) => ({ ...r, [campo.id]: '' }));
                                    }
                                  }}
                                />
                              </div>
                              {erro && (
                                <p className="flex items-center gap-1 text-[0.72rem] font-semibold text-rose-600">
                                  <AlertCircle size={11} />
                                  {erro}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </section>
                    );
                  })}
              </div>

              {erroGeral && (
                <div className="mt-4 flex items-start gap-2 rounded border border-rose-400 bg-rose-50 p-3 text-[0.78rem] text-rose-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {erroGeral}
                </div>
              )}

              <button
                onClick={enviar}
                disabled={enviando}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0b6b3a] px-4 py-3 text-[0.88rem] font-bold text-white transition hover:brightness-110 disabled:opacity-60 print:hidden"
              >
                {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {enviando ? 'Enviando...' : 'Enviar inscrição ao comando'}
              </button>

              <p className="mt-3 flex items-start gap-1.5 text-[0.68rem] leading-relaxed text-[#7a8a7a]">
                <ShieldCheck size={11} className="mt-0.5 shrink-0 text-pmpr-green" />
                As respostas são enviadas apenas para o painel do comando do 13º Batalhão. O preenchimento não garante
                aprovação nem ingresso na corporação.
              </p>
            </article>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-pmpr-green/20 bg-[#f1ede0] px-4 py-2 print:hidden sm:px-6">
          <p className="text-[0.66rem] uppercase tracking-[0.14em] text-[#6b7a6b]">
            {FORM.batalhao} · {FORM.referencia}
          </p>
          <button
            onClick={onClose}
            className="rounded border border-pmpr-green/25 px-2.5 py-1.5 text-[0.72rem] font-semibold text-[#2a3a2a] transition hover:bg-black/5"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
