import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Printer,
  Download,
  List,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Search,
  BadgeCheck,
} from 'lucide-react';
import type { DocumentoEdital } from '../data/documentos';
import { TOM_COLORS } from './ui';
import type { Edital } from '../types';

const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI'];

/** Converte o documento em texto puro para download e cópia. */
function documentoParaTexto(doc: DocumentoEdital, publicacao?: string): string {
  const linhas: string[] = [];
  linhas.push(doc.orgao, doc.unidade, '', doc.numero, '', doc.titulo.toUpperCase(), '');
  doc.preambulo.forEach((p) => linhas.push(p, ''));
  doc.secoes.forEach((secao, i) => {
    linhas.push(`CAPÍTULO ${ROMANOS[i] ?? i + 1}`, secao.titulo, '');
    secao.paragrafos?.forEach((p) => linhas.push(p, ''));
    secao.tabela?.linhas.forEach((linha) => linhas.push(linha.join(' | ')));
    if (secao.tabela) linhas.push('');
    secao.itens?.forEach((item) => linhas.push(item));
    linhas.push('');
  });
  linhas.push(`${doc.cidade}, ${doc.data}.`, '');
  doc.assinaturas.forEach((a) => linhas.push('_______________________________________', a.nome, a.cargo, ''));
  if (publicacao && publicacao.trim()) {
    linhas.push('PUBLICAÇÃO COMPLEMENTAR DO COMANDO', '', publicacao.trim(), '');
  }
  linhas.push(doc.rodape);
  linhas.push('', `Versão ${doc.versao} · atualizado em ${doc.atualizadoEm}`);
  return linhas.join('\n');
}

export function EditalDocumento({
  doc,
  edital,
  publicacao,
  onClose,
}: {
  doc: DocumentoEdital;
  edital: Edital;
  publicacao?: string;
  onClose: () => void;
}) {
  const [secaoAtiva, setSecaoAtiva] = useState(doc.secoes[0]?.chave ?? '');
  const [indiceAberto, setIndiceAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const corpoRef = useRef<HTMLDivElement>(null);
  const tom = TOM_COLORS[edital.tom];

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

  // Rola até a seção escolhida no índice
  const irParaSecao = (chave: string) => {
    setSecaoAtiva(chave);
    setIndiceAberto(false);
    const alvo = document.getElementById(`secao-${chave}`);
    const container = corpoRef.current;
    if (!alvo || !container) return;
    const topoContainer = container.getBoundingClientRect().top;
    const topoAlvo = alvo.getBoundingClientRect().top;
    container.scrollTo({
      top: container.scrollTop + (topoAlvo - topoContainer) - 12,
      behavior: 'smooth',
    });
  };

  const aoRolarCorpo = () => {
    const container = corpoRef.current;
    if (!container) return;
    const referencia = container.getBoundingClientRect().top + 60;
    let atual = doc.secoes[0]?.chave ?? '';
    for (const secao of doc.secoes) {
      const el = document.getElementById(`secao-${secao.chave}`);
      if (el && el.getBoundingClientRect().top <= referencia) atual = secao.chave;
    }
    setSecaoAtiva((anterior) => (anterior === atual ? anterior : atual));
  };

  const baixar = () => {
    const texto = documentoParaTexto(doc, publicacao);
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.editalId}-edital-${doc.versao.replace(/\s/g, '')}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const imprimir = () => {
    window.print();
  };

  const secoesFiltradas = useMemo(() => {
    if (!busca.trim()) return doc.secoes;
    const termo = busca.toLowerCase();
    return doc.secoes.filter(
      (s) =>
        s.titulo.toLowerCase().includes(termo) ||
        s.paragrafos?.some((p) => p.toLowerCase().includes(termo)) ||
        s.itens?.some((i) => i.toLowerCase().includes(termo)),
    );
  }, [busca, doc.secoes]);

  const indiceAtual = doc.secoes.findIndex((s) => s.chave === secaoAtiva);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-pmpr-gold/25 bg-[#f7f4ea] text-[#1a2419] shadow-2xl sm:h-[92vh] sm:rounded-2xl print:h-auto print:max-h-none print:w-full print:max-w-none print:overflow-visible print:rounded-none print:border-0 print:bg-white print:shadow-none">
        {/* Barra de ferramentas (não imprime) */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-pmpr-green/20 bg-ink-900 px-3 py-2.5 text-emerald-50 print:hidden sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="font-display shrink-0 rounded px-2 py-0.5 text-[0.68rem] font-bold tracking-wide"
              style={{ background: `${tom.cor}55`, color: tom.texto }}
            >
              {edital.sigla}
            </span>
            <p className="truncate text-[0.78rem] font-semibold text-white/85">{doc.numero}</p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => setIndiceAberto((v) => !v)}
              className="flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-[0.72rem] font-semibold text-emerald-50/70 transition hover:border-pmpr-gold/40 hover:text-pmpr-gold"
            >
              <List size={13} />
              <span className="hidden sm:inline">Sumário</span>
            </button>
            <button
              onClick={baixar}
              className="flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-[0.72rem] font-semibold text-emerald-50/70 transition hover:border-pmpr-gold/40 hover:text-pmpr-gold"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Baixar</span>
            </button>
            <button
              onClick={imprimir}
              className="flex items-center gap-1.5 rounded-md bg-pmpr-gold px-2.5 py-1.5 text-[0.72rem] font-bold text-ink-950 transition hover:brightness-105"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-md border border-white/10 p-1.5 text-emerald-50/60 transition hover:border-rose-400/40 hover:text-rose-300"
              aria-label="Fechar edital"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1">
          {/* Índice lateral */}
          <aside
            className={`absolute inset-y-0 left-0 z-20 w-72 overflow-y-auto border-r border-pmpr-green/20 bg-[#f1ede0] p-4 transition-transform print:hidden lg:static lg:translate-x-0 ${
              indiceAberto ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
            }`}
          >
            <p className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#4a5c4a]">
              <BookOpen size={11} />
              Sumário do edital
            </p>
            <div className="relative mt-2">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#6b7a6b]" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar no edital"
                className="w-full rounded border border-pmpr-green/25 bg-white/70 py-1.5 pl-6 pr-2 text-[0.72rem] text-[#1a2419] outline-none focus:border-pmpr-green/60"
              />
            </div>
            <nav className="mt-3 space-y-0.5">
              {secoesFiltradas.map((secao) => {
                const original = doc.secoes.findIndex((s) => s.chave === secao.chave);
                const ativo = secaoAtiva === secao.chave;
                return (
                  <button
                    key={secao.chave}
                    onClick={() => irParaSecao(secao.chave)}
                    className={`flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-[0.72rem] leading-snug transition ${
                      ativo
                        ? 'bg-pmpr-green/15 font-bold text-pmpr-green'
                        : 'text-[#3c4a3c] hover:bg-black/5'
                    }`}
                  >
                    <span className="mt-px shrink-0 font-mono text-[0.62rem] text-[#8a9789]">
                      {ROMANOS[original] ?? original + 1}
                    </span>
                    <span>{secao.titulo}</span>
                  </button>
                );
              })}
            </nav>
            {secoesFiltradas.length === 0 && (
              <p className="mt-3 text-[0.7rem] text-[#6b7a6b]">Nenhuma seção encontrada.</p>
            )}
          </aside>

          {/* Corpo do documento */}
          <div
            ref={corpoRef}
            onScroll={aoRolarCorpo}
            className="min-w-0 flex-1 overflow-y-auto print:overflow-visible"
          >
            <article className="mx-auto max-w-2xl px-5 py-8 sm:px-10 sm:py-12 print:max-w-none print:px-0 print:py-0">
              {/* Cabeçalho oficial */}
              <header className="border-b-2 border-pmpr-green/40 pb-4 text-center">
                <div className="flex justify-center">
                  <img src="/pmpr-brasao.png" alt="Brasão da Polícia Militar do Paraná" className="h-16 w-16" />
                </div>
                <p className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#3c4a3c]">
                  {doc.orgao}
                </p>
                <p className="text-[0.58rem] font-semibold uppercase leading-relaxed tracking-[0.12em] text-[#5c6b5c]">
                  {doc.unidade}
                </p>
                <h1 className="font-display mt-4 text-xl font-bold uppercase leading-tight text-[#0b2a17] sm:text-2xl">
                  {doc.numero}
                </h1>
                <p className="mt-1 text-[0.8rem] font-semibold leading-snug text-[#2a3a2a]">{doc.titulo}</p>
              </header>

              {/* Preâmbulo */}
              <div className="mt-5 space-y-3">
                {doc.preambulo.map((p, i) => (
                  <p key={i} className="text-justify text-[0.8rem] leading-relaxed text-[#263326]">
                    {p}
                  </p>
                ))}
              </div>

              {/* Seções */}
              <div className="mt-7 space-y-7">
                {doc.secoes.map((secao, i) => (
                  <section key={secao.chave} id={`secao-${secao.chave}`}>
                    <h2 className="border-b border-pmpr-green/25 pb-1.5">
                      <span className="block text-[0.58rem] font-bold uppercase tracking-[0.2em] text-[#7a8a7a]">
                        Capítulo {ROMANOS[i] ?? i + 1}
                      </span>
                      <span className="font-display text-[1.02rem] font-bold uppercase leading-tight text-[#0b2a17]">
                        {secao.titulo}
                      </span>
                    </h2>

                    {secao.paragrafos && (
                      <div className="mt-2.5 space-y-2">
                        {secao.paragrafos.map((p, k) => (
                          <p key={k} className="text-justify text-[0.79rem] leading-relaxed text-[#263326]">
                            {p}
                          </p>
                        ))}
                      </div>
                    )}

                    {secao.tabela && (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full border-collapse text-[0.74rem]">
                          <thead>
                            <tr className="bg-pmpr-green/12">
                              {secao.tabela.colunas.map((c) => (
                                <th
                                  key={c}
                                  className="border border-pmpr-green/25 px-2 py-1.5 text-left font-bold uppercase tracking-wide text-[#0b2a17]"
                                >
                                  {c}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {secao.tabela.linhas.map((linha, k) => (
                              <tr key={k} className={k % 2 === 1 ? 'bg-black/[0.025]' : ''}>
                                {linha.map((celula, j) => (
                                  <td
                                    key={j}
                                    className={`border border-pmpr-green/20 px-2 py-1.5 text-[#263326] ${
                                      j === 0 ? 'font-semibold' : ''
                                    }`}
                                  >
                                    {celula}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {secao.itens && (
                      <ul className="mt-2.5 space-y-1.5">
                        {secao.itens.map((item, k) => (
                          <li
                            key={k}
                            className="text-justify text-[0.79rem] leading-relaxed text-[#263326]"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>

              {/* Encerramento */}
              <div className="mt-9 border-t border-pmpr-green/25 pt-5">
                <p className="text-[0.79rem] leading-relaxed text-[#263326]">
                  {doc.cidade}, {doc.data}.
                </p>

                <div className="mt-8 grid gap-8 sm:grid-cols-2">
                  {doc.assinaturas.map((a) => (
                    <div key={a.nome} className="text-center">
                      <div className="mx-auto h-px w-full max-w-[16rem] bg-[#263326]/60" />
                      <p className="mt-1.5 text-[0.74rem] font-bold uppercase tracking-wide text-[#0b2a17]">
                        {a.nome}
                      </p>
                      <p className="text-[0.68rem] text-[#4a5c4a]">{a.cargo}</p>
                    </div>
                  ))}
                </div>

                {publicacao && publicacao.trim() && (
                  <div className="mt-6 rounded border-l-4 border-pmpr-green bg-pmpr-green/[0.07] p-3">
                    <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-pmpr-green">
                      Publicação complementar do comando
                    </p>
                    <p className="mt-1 whitespace-pre-line text-justify text-[0.76rem] leading-relaxed text-[#263326]">
                      {publicacao}
                    </p>
                  </div>
                )}

                <div className="mt-8 rounded border border-pmpr-green/25 bg-white/50 p-3">
                  <p className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-pmpr-green">
                    <BadgeCheck size={11} />
                    Publicação oficial do portal
                  </p>
                  <p className="mt-1 text-[0.68rem] leading-relaxed text-[#4a5c4a]">{doc.rodape}</p>
                  <p className="mt-1.5 text-[0.62rem] text-[#7a8a7a]">
                    Versão {doc.versao} · atualizada em {doc.atualizadoEm}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>

        {/* Navegação entre capítulos (não imprime) */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-pmpr-green/20 bg-[#f1ede0] px-3 py-2 print:hidden sm:px-5">
          <button
            onClick={() => indiceAtual > 0 && irParaSecao(doc.secoes[indiceAtual - 1].chave)}
            disabled={indiceAtual <= 0}
            className="flex items-center gap-1 rounded border border-pmpr-green/25 px-2.5 py-1.5 text-[0.72rem] font-semibold text-[#2a3a2a] transition hover:bg-black/5 disabled:opacity-30"
          >
            <ChevronLeft size={13} />
            Anterior
          </button>
          <p className="text-[0.66rem] uppercase tracking-[0.14em] text-[#6b7a6b]">
            Capítulo {ROMANOS[indiceAtual] ?? indiceAtual + 1} de {ROMANOS[doc.secoes.length - 1] ?? doc.secoes.length}
          </p>
          <button
            onClick={() =>
              indiceAtual < doc.secoes.length - 1 && irParaSecao(doc.secoes[indiceAtual + 1].chave)
            }
            disabled={indiceAtual >= doc.secoes.length - 1}
            className="flex items-center gap-1 rounded border border-pmpr-green/25 px-2.5 py-1.5 text-[0.72rem] font-semibold text-[#2a3a2a] transition hover:bg-black/5 disabled:opacity-30"
          >
            Próximo
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function documentoParaDownload(doc: DocumentoEdital, publicacao?: string) {
  return documentoParaTexto(doc, publicacao);
}
