import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  MapPin,
  Printer,
  ShieldCheck,
  Ticket,
  Users,
  AlertTriangle,
  Send,
  Clock,
} from 'lucide-react';
import type { SiteConfig } from '../lib/config';
import { formatDate } from '../lib/config';
import { Crest } from '../components/Crest';

interface Props {
  config: SiteConfig;
  onUpdate: (patch: Partial<SiteConfig>) => void;
}

interface FormState {
  nome: string;
  cpf: string;
  nascimento: string;
  email: string;
  telefone: string;
  cidade: string;
  unidade: string;
  cnh: string;
  altura: string;
  ciencia: boolean;
}

const EMPTY_FORM: FormState = {
  nome: '',
  cpf: '',
  nascimento: '',
  email: '',
  telefone: '',
  cidade: '',
  unidade: '',
  cnh: 'B',
  altura: '',
  ciencia: false,
};

const STEP_LABEL = ['Identificação', 'Contato', 'Dados funcionais', 'Confirmação'];

export function Edital({ config, onUpdate }: Props) {
  const [tab, setTab] = useState<'documento' | 'inscricao'>('documento');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [protocolo, setProtocolo] = useState<string | null>(null);

  const e = config.edital;
  const setEdital = (patch: Partial<SiteConfig['edital']>) =>
    onUpdate({ edital: { ...config.edital, ...patch } });

  const validateStep = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (form.nome.trim().split(' ').length < 2) errs.nome = 'Informe nome e sobrenome.';
      if (!/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(form.cpf)) errs.cpf = 'CPF inválido (000.000.000-00).';
      if (!form.nascimento) errs.nascimento = 'Informe a data de nascimento.';
      else {
        const age = (Date.now() - new Date(form.nascimento).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (age < 21 || age > 35) errs.nascimento = 'É necessário ter entre 21 e 35 anos.';
      }
    }
    if (s === 1) {
      if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'E-mail inválido.';
      if (form.telefone.replace(/\D/g, '').length < 10) errs.telefone = 'Telefone com DDD.';
      if (!form.cidade.trim()) errs.cidade = 'Informe a cidade.';
    }
    if (s === 2) {
      if (!form.unidade.trim()) errs.unidade = 'Informe a unidade/OPM de origem.';
      if (!form.altura || Number(form.altura) < 150) errs.altura = 'Altura em centímetros (mín. 150).';
    }
    if (s === 3 && !form.ciencia) errs.ciencia = 'É necessário declarar ciência das regras.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) return;
    if (step < 3) setStep(step + 1);
    else submit();
  };

  const submit = () => {
    const protocol = `${config.sigla}-${new Date().getFullYear()}-${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`;
    setProtocolo(protocol);
  };

  const resumo = useMemo(
    () => [
      ['Edital', e.numero],
      ['Inscrições', `${formatDate(e.abertura)} — ${formatDate(e.encerramento)}`],
      ['Prova / TAF', formatDate(e.prova)],
      ['Local', e.local],
      ['Banca', e.banca],
      ['Carga horária', e.cargaHoraria],
      ['Vagas', `${e.vagas} (${e.vagasReserva} reservadas)`],
      ['Taxa', e.taxa],
    ],
    [e],
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      {/* cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--c-gold)]">Processo seletivo</p>
          <h1 className="font-display mt-2 text-4xl font-extrabold uppercase leading-none tracking-wide sm:text-5xl">
            Edital de ingresso {e.ano}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--c-paper)]/60">
            {config.sigla} — {config.nome} · {e.numero}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="no-print clip-btn inline-flex items-center gap-2 border border-white/25 px-4 py-2.5 text-xs uppercase tracking-[0.16em] transition hover:border-[var(--c-gold)] hover:text-[var(--c-gold)]"
          >
            <Printer className="h-4 w-4" /> Imprimir
          </button>
          <a
            href={e.link}
            target="_blank"
            rel="noreferrer noopener"
            className="no-print clip-btn inline-flex items-center gap-2 bg-[var(--c-gold)] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-black"
          >
            <Download className="h-4 w-4" /> Site oficial
          </a>
        </div>
      </div>

      {/* abas */}
      <div className="no-print mt-6 flex gap-2">
        {(
          [
            ['documento', 'Documento do edital', FileText],
            ['inscricao', 'Pré-inscrição', Ticket],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`clip-btn inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition ${
              tab === id
                ? 'bg-[var(--c-gold)] text-black'
                : 'border border-white/20 text-[var(--c-paper)]/70 hover:border-white/40'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'documento' ? (
        <div className="print-area mt-8 grid gap-8 lg:grid-cols-[1.55fr_1fr]">
          <div className="space-y-8">
            {/* resumo em grade */}
            <div className="grid gap-3 sm:grid-cols-2">
              {resumo.map(([k, v]) => (
                <div key={k} className="card flex items-start justify-between gap-3 p-4">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--c-paper)]/50">{k}</span>
                  <span className="max-w-[60%] text-right text-sm font-semibold">{v}</span>
                </div>
              ))}
            </div>

            <section className="card p-6 sm:p-8">
              <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold uppercase tracking-wide">
                <ClipboardList className="h-5 w-5 text-[var(--c-gold)]" /> 1. Disposições preliminares
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--c-paper)]/70">
                O presente edital estabelece as normas do processo seletivo interno para ingresso de policiais
                militares no curso de formação de operador da {config.sigla}, unidade integrante do Batalhão de
                Operações Especiais da Polícia Militar do Paraná. A seleção observará os princípios da legalidade,
                impessoalidade, moralidade, publicidade e eficiência, bem como a política de direitos humanos da
                corporação.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--c-paper)]/70">
                O candidato aprovado será matriculado no curso com carga horária de {e.cargaHoraria}, em regime de
                dedicação integral, sendo submetido a avaliações teóricas, práticas e de conduta durante todo o
                período.
              </p>
            </section>

            <section className="card p-6 sm:p-8">
              <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold uppercase tracking-wide">
                <CheckCircle2 className="h-5 w-5 text-[var(--c-gold)]" /> 2. Dos requisitos
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {config.requisitos.map((req) => (
                  <li
                    key={req}
                    className="flex gap-2.5 border border-white/8 bg-black/20 p-3 text-sm leading-relaxed text-[var(--c-paper)]/75"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--c-gold)]" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card p-6 sm:p-8">
              <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold uppercase tracking-wide">
                <ShieldCheck className="h-5 w-5 text-[var(--c-gold)]" /> 3. Das etapas
              </h2>
              <ol className="mt-5 space-y-4">
                {config.etapas.map((etapa, i) => (
                  <li key={etapa.titulo} className="relative flex gap-4 border-b border-white/8 pb-4 last:border-0">
                    <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--c-gold)]/50 bg-[var(--c-gold)]/10 text-lg font-bold text-[var(--c-gold)]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-bold uppercase tracking-wide">{etapa.titulo}</h3>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] ${
                            etapa.peso.toLowerCase().startsWith('elim')
                              ? 'bg-[var(--c-alert)]/20 text-red-200'
                              : 'bg-emerald-500/15 text-emerald-300'
                          }`}
                        >
                          {etapa.peso}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--c-paper)]/65">{etapa.descricao}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="card p-6 sm:p-8">
              <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold uppercase tracking-wide">
                <Calendar className="h-5 w-5 text-[var(--c-gold)]" /> 4. Cronograma
              </h2>
              <div className="mt-4 overflow-hidden border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-[10px] uppercase tracking-[0.16em] text-[var(--c-paper)]/60">
                    <tr>
                      <th className="px-4 py-3">Evento</th>
                      <th className="px-4 py-3">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8">
                    {[
                      ['Abertura das inscrições', formatDate(e.abertura)],
                      ['Encerramento das inscrições', formatDate(e.encerramento)],
                      ['Divulgação dos inscritos', 'A definir em edital retificado'],
                      ['Prova escrita / TAF', formatDate(e.prova)],
                      ['Resultado preliminar', 'Até 15 dias após a prova'],
                      ['Matrícula no curso', 'Data publicada no Diário Oficial'],
                    ].map(([ev, dt]) => (
                      <tr key={ev} className="transition hover:bg-white/[0.03]">
                        <td className="px-4 py-3 text-[var(--c-paper)]/75">{ev}</td>
                        <td className="px-4 py-3 font-semibold text-[var(--c-gold)]">{dt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border border-[var(--c-alert)]/40 bg-[var(--c-alert)]/10 p-6">
              <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold uppercase tracking-wide">
                <AlertTriangle className="h-5 w-5" /> 5. Avisos importantes
              </h2>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[var(--c-paper)]/80">
                {config.avisos.map((a) => (
                  <li key={a} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--c-alert)]" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Coluna lateral editável */}
          <aside className="no-print space-y-4">
            <div className="card clip-corner p-5">
              <div className="flex items-center justify-between">
                <Crest className="h-16 w-12" />
                <span className="text-right text-[10px] uppercase leading-relaxed tracking-[0.2em] text-[var(--c-gold)]">
                  Edital
                  <br />
                  {e.numero}
                </span>
              </div>
              <h3 className="font-display mt-4 text-xl font-bold uppercase tracking-wide">Dados do edital</h3>
              <p className="mt-1 text-[11px] text-[var(--c-paper)]/50">
                Personalize as informações abaixo — as alterações aplicam-se ao site na hora.
              </p>
              <div className="mt-4 space-y-3">
                {(
                  [
                    ['numero', 'Número'],
                    ['ano', 'Ano'],
                    ['vagas', 'Vagas'],
                    ['vagasReserva', 'Vagas reservadas'],
                    ['taxa', 'Taxa'],
                    ['banca', 'Banca'],
                    ['local', 'Local da prova'],
                    ['cargaHoraria', 'Carga horária'],
                  ] as [keyof SiteConfig['edital'], string][]
                ).map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-[10px] uppercase tracking-[0.16em] text-[var(--c-paper)]/50">
                      {label}
                    </span>
                    <input className="field" value={e[key]} onChange={(ev) => setEdital({ [key]: ev.target.value })} />
                  </label>
                ))}
                <label className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-[0.16em] text-[var(--c-paper)]/50">
                    Link oficial
                  </span>
                  <input className="field" value={e.link} onChange={(ev) => setEdital({ link: ev.target.value })} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ['abertura', 'Abertura'],
                      ['encerramento', 'Encerramento'],
                      ['prova', 'Prova/TAF'],
                    ] as [keyof SiteConfig['edital'], string][]
                  ).map(([key, label]) => (
                    <label key={key} className="block">
                      <span className="mb-1 block text-[10px] uppercase tracking-[0.16em] text-[var(--c-paper)]/50">
                        {label}
                      </span>
                      <input
                        type="date"
                        className="field"
                        value={e[key]}
                        onChange={(ev) => setEdital({ [key]: ev.target.value })}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="border border-dashed border-white/20 p-4 text-[11px] leading-relaxed text-[var(--c-paper)]/45">
              <p className="mb-1 font-semibold uppercase tracking-[0.16em] text-[var(--c-paper)]/60">
                Sobre os dados
              </p>
              Os campos acima são editáveis e ficam salvos apenas neste navegador. Antes de publicar, valide datas,
              vagas e requisitos com a publicação oficial.
            </div>
          </aside>
        </div>
      ) : (
        /* ------------------- PRÉ-INSCRIÇÃO ------------------- */
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="card p-6 sm:p-8">
            {protocolo ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[var(--c-gold)]/50 bg-[var(--c-gold)]/10">
                  <CheckCircle2 className="h-8 w-8 text-[var(--c-gold)]" />
                </div>
                <h2 className="font-display mt-4 text-3xl font-extrabold uppercase tracking-wide">
                  Pré-inscrição registrada
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-[var(--c-paper)]/65">
                  Guarde seu protocolo. Esta é uma simulação: nenhum dado foi enviado a servidores.
                </p>
                <p className="font-display mt-5 inline-block border border-dashed border-[var(--c-gold)] px-6 py-3 text-2xl font-extrabold tracking-[0.2em] text-[var(--c-gold)]">
                  {protocolo}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => {
                      setProtocolo(null);
                      setForm(EMPTY_FORM);
                      setStep(0);
                    }}
                    className="clip-btn border border-white/25 px-5 py-2.5 text-xs uppercase tracking-[0.16em]"
                  >
                    Nova inscrição
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="clip-btn inline-flex items-center gap-2 bg-[var(--c-gold)] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-black"
                  >
                    <Printer className="h-4 w-4" /> Imprimir comprovante
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  {STEP_LABEL.map((label, i) => (
                    <div key={label} className="flex flex-1 items-center gap-2">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          i <= step
                            ? 'bg-[var(--c-gold)] text-black'
                            : 'border border-white/25 text-[var(--c-paper)]/50'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`hidden text-[10px] uppercase tracking-[0.14em] sm:block ${
                          i === step ? 'text-[var(--c-gold)]' : 'text-[var(--c-paper)]/45'
                        }`}
                      >
                        {label}
                      </span>
                      {i < STEP_LABEL.length - 1 && <span className="h-px flex-1 bg-white/15" />}
                    </div>
                  ))}
                </div>

                <div className="mt-7 space-y-4">
                  {step === 0 && (
                    <>
                      <Field label="Nome completo" error={errors.nome}>
                        <input
                          className="field"
                          placeholder="Ex.: João Pereira da Silva"
                          value={form.nome}
                          onChange={(ev) => setForm({ ...form, nome: ev.target.value })}
                        />
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="CPF" error={errors.cpf}>
                          <input
                            className="field"
                            placeholder="000.000.000-00"
                            value={form.cpf}
                            onChange={(ev) => setForm({ ...form, cpf: ev.target.value })}
                          />
                        </Field>
                        <Field label="Data de nascimento" error={errors.nascimento}>
                          <input
                            type="date"
                            className="field"
                            value={form.nascimento}
                            onChange={(ev) => setForm({ ...form, nascimento: ev.target.value })}
                          />
                        </Field>
                      </div>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <Field label="E-mail" error={errors.email}>
                        <input
                          className="field"
                          placeholder="nome@email.com"
                          value={form.email}
                          onChange={(ev) => setForm({ ...form, email: ev.target.value })}
                        />
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Telefone com DDD" error={errors.telefone}>
                          <input
                            className="field"
                            placeholder="(41) 99999-9999"
                            value={form.telefone}
                            onChange={(ev) => setForm({ ...form, telefone: ev.target.value })}
                          />
                        </Field>
                        <Field label="Cidade / UF" error={errors.cidade}>
                          <input
                            className="field"
                            placeholder="Curitiba / PR"
                            value={form.cidade}
                            onChange={(ev) => setForm({ ...form, cidade: ev.target.value })}
                          />
                        </Field>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Unidade / OPM de origem" error={errors.unidade}>
                          <input
                            className="field"
                            placeholder="Ex.: 1º BPM"
                            value={form.unidade}
                            onChange={(ev) => setForm({ ...form, unidade: ev.target.value })}
                          />
                        </Field>
                        <Field label="CNH" error={undefined}>
                          <select
                            className="field"
                            value={form.cnh}
                            onChange={(ev) => setForm({ ...form, cnh: ev.target.value })}
                          >
                            {['A', 'B', 'AB', 'C', 'D', 'E'].map((c) => (
                              <option key={c} value={c}>
                                Categoria {c}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                      <Field label="Altura (cm)" error={errors.altura}>
                        <input
                          className="field"
                          type="number"
                          placeholder="175"
                          value={form.altura}
                          onChange={(ev) => setForm({ ...form, altura: ev.target.value })}
                        />
                      </Field>
                    </>
                  )}

                  {step === 3 && (
                    <div className="space-y-3">
                      <h3 className="font-display text-xl font-bold uppercase tracking-wide">Confira seus dados</h3>
                      {(
                        [
                          ['Nome', form.nome],
                          ['CPF', form.cpf],
                          ['Nascimento', form.nascimento],
                          ['E-mail', form.email],
                          ['Telefone', form.telefone],
                          ['Cidade', form.cidade],
                          ['Unidade', form.unidade],
                          ['CNH', form.cnh],
                          ['Altura', `${form.altura} cm`],
                        ] as [string, string][]
                      ).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3 border-b border-white/10 pb-2 text-sm">
                          <span className="text-[var(--c-paper)]/50">{k}</span>
                          <span className="text-right font-medium">{v || '—'}</span>
                        </div>
                      ))}
                      <label className="flex cursor-pointer items-start gap-3 border border-white/15 bg-black/20 p-3 text-sm">
                        <input
                          type="checkbox"
                          checked={form.ciencia}
                          onChange={(ev) => setForm({ ...form, ciencia: ev.target.checked })}
                          className="mt-0.5 h-4 w-4 accent-[var(--c-gold)]"
                        />
                        <span className="text-[var(--c-paper)]/75">
                          Declaro que li o edital {e.numero} e estou ciente de que esta inscrição é uma simulação
                          demonstrativa.
                        </span>
                      </label>
                      {errors.ciencia && <p className="text-xs text-red-400">{errors.ciencia}</p>}
                    </div>
                  )}
                </div>

                <div className="mt-7 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setStep(Math.max(0, step - 1))}
                    disabled={step === 0}
                    className="clip-btn border border-white/25 px-5 py-2.5 text-xs uppercase tracking-[0.16em] disabled:opacity-35"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={next}
                    className="clip-btn inline-flex items-center gap-2 bg-[var(--c-gold)] px-6 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-black"
                  >
                    {step === 3 ? (
                      <>
                        <Send className="h-4 w-4" /> Enviar inscrição
                      </>
                    ) : (
                      'Continuar'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          <aside className="space-y-4">
            <div className="card p-5">
              <h3 className="font-display text-lg font-bold uppercase tracking-wide">Checklist</h3>
              <ul className="mt-3 space-y-2 text-[13px] text-[var(--c-paper)]/70">
                {[
                  'Documento de identidade e CPF',
                  'Comprovante de residência atualizado',
                  'Certidões negativas (criminal e eleitoral)',
                  'Atestado de aptidão física emitido há menos de 90 dias',
                  'Comprovante de pagamento da taxa',
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--c-gold)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-5 text-sm">
              <h3 className="font-display text-lg font-bold uppercase tracking-wide">Prazos</h3>
              <div className="mt-3 space-y-2.5">
                {[
                  [Calendar, 'Inscrições', `${formatDate(e.abertura)} → ${formatDate(e.encerramento)}`],
                  [MapPin, 'Local da prova', e.local],
                  [Clock, 'Carga horária', e.cargaHoraria],
                  [Users, 'Vagas', `${e.vagas} + ${e.vagasReserva} reservadas`],
                  [Ticket, 'Taxa', e.taxa],
                ].map(([Icon, k, v]: any) => (
                  <div key={k} className="flex items-start gap-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--c-gold)]" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--c-paper)]/45">{k}</p>
                      <p className="text-[13px] font-medium">{v}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-[var(--c-paper)]/50">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}
