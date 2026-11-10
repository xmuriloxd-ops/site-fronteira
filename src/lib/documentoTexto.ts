/**
 * Texto do documento de divulgação das inscrições.
 *
 * Fica fora dos componentes porque é usado em três lugares: a prévia na tela,
 * o envio ao Discord e o cartaz em imagem.
 */

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

