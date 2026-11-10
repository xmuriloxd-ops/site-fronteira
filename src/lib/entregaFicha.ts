/**
 * Entrega automática das fichas de inscrição no Discord.
 *
 * Roda no navegador de quem preenche o formulário, porque é o navegador que
 * tem acesso ao Discord (o servidor desta rede não alcança discord.com).
 * O servidor informa o webhook cadastrado pelo comando no painel; se o envio
 * automático estiver desligado, nenhum destino é devolvido.
 */

import { enviarPeloNavegador } from './discord';
import { FORMULARIO_RECRUTAMENTO } from '../data/recrutamento';
import { FORMULARIOS_UNIDADE } from '../data/fichas-unidade';
import type { InscricaoRecrutamento } from '../types';

export interface ResultadoEntrega {
  /** `null` quando não havia destino cadastrado (envio automático desligado). */
  tentou: boolean;
  ok: boolean;
  detalhe: string;
}

/** Formulário pelo id, com o 13º BPM como padrão. */
function acharFormulario(formularioId: string) {
  return FORMULARIOS_UNIDADE[formularioId] ?? FORMULARIO_RECRUTAMENTO;
}

/** Rótulo curto da unidade (ROTAM, RONE, 13º BPM). */
export function siglaDoFormulario(formularioId: string): string {
  return acharFormulario(formularioId).referencia || 'PMPR';
}

/**
 * Converte as respostas em campos do embed, na ordem do formulário.
 * A identificação (nome, idade, ID) entra como um campo próprio.
 */
function montarCampos(inscricao: InscricaoRecrutamento) {
  const formulario = acharFormulario(inscricao.formularioId);
  const campos: { name: string; value: string; inline?: boolean }[] = [];

  const identificacao = formulario.campos.find((c) => c.tipo === 'identificacao');
  if (identificacao) {
    campos.push({
      name: `${identificacao.numero}. ${identificacao.titulo}`,
      value: `**${inscricao.nome}** · ${inscricao.idade} anos · ID ${inscricao.idRp}`,
      inline: false,
    });
  }

  formulario.campos
    .filter((c) => c.tipo !== 'identificacao')
    .forEach((campo) => {
      const valor = inscricao.respostas[campo.id];
      if (!valor || !valor.trim()) return;
      campos.push({
        name: `${campo.numero}. ${campo.titulo}`,
        // 1024 é o limite do Discord por campo
        value: valor.trim().slice(0, 1024),
        inline: campo.tipo === 'opcoes' || campo.tipo === 'opcoes-outro',
      });
    });

  return campos;
}

/**
 * Envia a ficha completa ao canal cadastrado.
 * Nunca lança: o resultado é informado na tela de confirmação.
 */
export async function entregarFichaNoDiscord(
  inscricao: InscricaoRecrutamento,
  destino: { webhook: string; mencionarHere: boolean } | undefined,
): Promise<ResultadoEntrega> {
  if (!destino?.webhook) {
    return {
      tentou: false,
      ok: false,
      detalhe: 'O comando ainda não cadastrou o canal do Discord para receber as fichas.',
    };
  }

  const formulario = acharFormulario(inscricao.formularioId);
  const sigla = siglaDoFormulario(inscricao.formularioId);
  const protocolo = inscricao.id.slice(0, 8).toUpperCase();

  const resultado = await enviarPeloNavegador(destino.webhook, {
    titulo: `📋 Nova ficha de inscrição — ${sigla}`,
    descricao: `**${inscricao.nome}** acabou de enviar o formulário **${formulario.titulo}**.\nProtocolo \`${protocolo}\` · ${new Date(
      inscricao.criadoEm,
    ).toLocaleString('pt-BR')}`,
    cor: 0x0b6b3a,
    mencionarHere: destino.mencionarHere,
    campos: montarCampos(inscricao),
  });

  // Registra a entrega no servidor para o painel do comando (best effort).
  try {
    await fetch(`/api/public/recrutamento/${inscricao.id}/discord`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: resultado.ok, detalhe: resultado.detalhe }),
    });
  } catch {
    /* a ficha já foi entregue; o registro é secundário */
  }

  return { tentou: true, ok: resultado.ok, detalhe: resultado.detalhe };
}
