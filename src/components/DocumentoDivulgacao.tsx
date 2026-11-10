/**
 * Documento de divulgação das inscrições abertas.
 *
 * O comando edita texto, data, horário e quem está divulgando; o documento é
 * montado na hora, no formato de publicação oficial, e pode ser enviado ao
 * Discord ou impresso/baixado.
 */

import { CalendarDays, Clock4, Megaphone, ShieldCheck, UserCog } from 'lucide-react';
import type { DivulgacaoInscricoes } from '../types';

/** Rótulos das unidades que podem ser divulgadas. */
export const UNIDADES_DIVULGACAO: { id: string; sigla: string; nome: string }[] = [
  { id: 'pmpr', sigla: 'PMPR', nome: 'Polícia Militar do Paraná' },
  { id: 'rotam', sigla: 'ROTAM', nome: 'Rondas Táticas Metropolitanas' },
  { id: 'rone', sigla: 'RONE', nome: 'Rondas Ostensivas de Natureza Especial' },
];

/** Data e hora em texto brasileiro, tolerando campos vazios. */
export function formatarQuando(data: string, horario: string): string {
  const partes: string[] = [];
  if (data) {
    const [ano, mes, dia] = data.split('-');
    if (ano && mes && dia) partes.push(`${dia}/${mes}/${ano}`);
  }
  if (horario) partes.push(`às ${horario}`);
  return partes.join(' ');
}

/** Título do documento, com as unidades escolhidas. */
export function tituloDivulgacao(divulgacao: DivulgacaoInscricoes): string {
  const siglas = divulgacao.unidades
    .map((id) => UNIDADES_DIVULGACAO.find((u) => u.id === id)?.sigla ?? id.toUpperCase())
    .filter(Boolean);
  const lista = siglas.length > 1 ? `${siglas.slice(0, -1).join(', ')} e ${siglas.slice(-1)}` : siglas[0];
  return lista ? `INSCRIÇÕES ABERTAS — ${lista}` : 'INSCRIÇÕES ABERTAS';
}

/** Texto corrido do documento, usado na prévia e no envio ao Discord. */
export function corpoDivulgacao(divulgacao: DivulgacaoInscricoes): string[] {
  const linhas: string[] = [];
  const quando = formatarQuando(divulgacao.data, divulgacao.horario);

  if (divulgacao.texto.trim()) linhas.push(divulgacao.texto.trim());

  const unidades = divulgacao.unidades
    .map((id) => UNIDADES_DIVULGACAO.find((u) => u.id === id))
    .filter(Boolean) as { sigla: string; nome: string }[];

  unidades.forEach((u) => linhas.push(`• ${u.sigla} — ${u.nome}`));

  if (quando) linhas.push(`Data e horário: ${quando}`);
  if (divulgacao.responsavel.trim()) linhas.push(`Divulgado por: ${divulgacao.responsavel.trim()}`);
  if (divulgacao.link.trim()) linhas.push(`Inscrições: ${divulgacao.link.trim()}`);
  if (divulgacao.observacoes.trim()) linhas.push(divulgacao.observacoes.trim());

  return linhas;
}

/** Campos do embed enviado ao Discord. */
export function camposDivulgacao(divulgacao: DivulgacaoInscricoes) {
  const quando = formatarQuando(divulgacao.data, divulgacao.horario);
  const campos: { name: string; value: string; inline?: boolean }[] = [];

  const unidades = divulgacao.unidades
    .map((id) => UNIDADES_DIVULGACAO.find((u) => u.id === id)?.sigla)
    .filter(Boolean)
    .join(' · ');
  if (unidades) campos.push({ name: 'Inscrições abertas', value: unidades, inline: true });
  if (quando) campos.push({ name: 'Data e horário', value: quando, inline: true });
  if (divulgacao.responsavel.trim()) {
    campos.push({ name: 'Divulgado por', value: divulgacao.responsavel.trim(), inline: true });
  }
  if (divulgacao.link.trim()) {
    campos.push({ name: 'Formulário', value: divulgacao.link.trim(), inline: false });
  }
  if (divulgacao.observacoes.trim()) {
    campos.push({ name: 'Observações', value: divulgacao.observacoes.trim().slice(0, 1024), inline: false });
  }
  return campos;
}

/**
 * Prévia do documento — o mesmo texto que vai para o Discord,
 * diagramado como publicação do comando.
 */
export function DocumentoDivulgacao({
  divulgacao,
  className = '',
}: {
  divulgacao: DivulgacaoInscricoes;
  className?: string;
}) {
  const quando = formatarQuando(divulgacao.data, divulgacao.horario);
  const siglas = divulgacao.unidades
    .map((id) => UNIDADES_DIVULGACAO.find((u) => u.id === id)?.sigla)
    .filter(Boolean) as string[];

  return (
    <article
      className={`documento-divulgacao rounded-xl border border-pmpr-gold/30 bg-gradient-to-b from-[#0a2418] to-[#061710] p-5 text-emerald-50 ${className}`}
    >
      <header className="border-b border-pmpr-gold/25 pb-3 text-center">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-pmpr-gold/70">
          Polícia Militar do Paraná
        </p>
        <h3 className="font-display mt-1 text-base font-bold uppercase leading-tight text-white">
          {tituloDivulgacao(divulgacao)}
        </h3>
        {siglas.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {siglas.map((s) => (
              <span
                key={s}
                className="rounded-full border border-pmpr-gold/35 bg-pmpr-gold/10 px-2 py-0.5 text-[0.62rem] font-bold tracking-wide text-pmpr-gold"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="mt-3 space-y-2.5 text-[0.78rem] leading-relaxed text-emerald-50/80">
        {divulgacao.texto.trim() && <p className="whitespace-pre-line">{divulgacao.texto.trim()}</p>}

        {quando && (
          <p className="flex items-center gap-1.5 text-emerald-50/65">
            <CalendarDays size={12} className="text-pmpr-gold/70" />
            {quando}
            <Clock4 size={12} className="ml-1 text-pmpr-gold/70" />
          </p>
        )}

        {divulgacao.link.trim() && (
          <p className="break-all rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[0.72rem] text-emerald-100/70">
            <Megaphone size={11} className="mr-1 inline text-pmpr-gold/70" />
            {divulgacao.link.trim()}
          </p>
        )}

        {divulgacao.observacoes.trim() && (
          <p className="whitespace-pre-line border-l-2 border-pmpr-gold/40 pl-2 text-[0.72rem] italic text-emerald-50/55">
            {divulgacao.observacoes.trim()}
          </p>
        )}
      </div>

      <footer className="mt-4 flex items-center justify-between gap-2 border-t border-pmpr-gold/20 pt-2.5 text-[0.66rem] text-emerald-100/45">
        <span className="flex items-center gap-1.5">
          <UserCog size={11} className="text-pmpr-gold/60" />
          {divulgacao.responsavel.trim() || 'Divulgação do comando'}
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck size={11} className="text-emerald-400/70" />
          Inscrições pelo portal
        </span>
      </footer>
    </article>
  );
}
