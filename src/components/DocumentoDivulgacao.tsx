/**
 * Documento de divulgação das inscrições abertas.
 *
 * O comando edita texto, data, horário e quem está divulgando; o documento é
 * montado na hora, no formato de publicação oficial, e pode ser enviado ao
 * Discord ou impresso/baixado.
 */

import { CalendarDays, Clock4, Megaphone, ShieldCheck, UserCog } from 'lucide-react';
import type { DivulgacaoInscricoes } from '../types';
import { UNIDADES_DIVULGACAO, formatarQuando, tituloDivulgacao } from '../lib/documentoTexto';

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
