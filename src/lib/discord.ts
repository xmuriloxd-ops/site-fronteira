/**
 * Envio de mensagens a webhooks do Discord direto do navegador.
 *
 * Por que assim: o servidor onde o portal roda não tem acesso à rede do
 * Discord (bloqueada), mas o navegador do comando tem. O Discord não libera
 * CORS para requisições JSON, porém aceita `multipart/form-data` — que o
 * navegador envia como formulário simples, sem checagem de CORS.
 * Por isso o JSON vai no campo `payload_json`.
 */

export interface CampoEmbed {
  name: string;
  value: string;
  inline?: boolean;
}

export interface MensagemDiscord {
  titulo: string;
  descricao: string;
  url?: string;
  cor?: number;
  campos?: CampoEmbed[];
  mencionarHere?: boolean;
  /** Imagem anexada à mensagem (cartaz de divulgação, por exemplo). */
  arquivo?: File;
}

export interface ResultadoEnvio {
  ok: boolean;
  detalhe: string;
}

/** Só aceita webhooks oficiais do Discord (evita envio para hosts arbitrários). */
export function webhookPermitido(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === 'https:' &&
      ['discord.com', 'discordapp.com', 'ptb.discord.com', 'canary.discord.com', 'discord.co'].includes(
        u.hostname,
      )
    );
  } catch {
    return false;
  }
}

/**
 * Monta o corpo multipart. O boundary é obrigatório e o Discord espera
 * exatamente esta estrutura: `payload_json` como campo de formulário e os
 * arquivos em `files[0]`, `files[1]`...
 */
function montarFormulario(payload: unknown, arquivo?: File): FormData {
  const form = new FormData();
  form.append('payload_json', JSON.stringify(payload));
  if (arquivo) form.append('files[0]', arquivo, arquivo.name);
  return form;
}

/**
 * Envia a mensagem ao webhook pelo navegador.
 * Retorna `ok: false` sempre que o Discord recusa ou a rede falha, com um
 * detalhe legível para o comando entender o que aconteceu.
 */
export async function enviarPeloNavegador(
  webhook: string,
  mensagem: MensagemDiscord,
): Promise<ResultadoEnvio> {
  if (!webhookPermitido(webhook)) {
    return { ok: false, detalhe: 'Endereço de webhook inválido. Ele deve começar com https://discord.com/api/webhooks/' };
  }

  const comAnexo = Boolean(mensagem.arquivo);

  const payload = {
    username: 'Portal de Inscrições PMPR',
    content: mensagem.mencionarHere ? '@here' : undefined,
    allowed_mentions: { parse: mensagem.mencionarHere ? ['everyone'] : [] },
    embeds: [
      {
        title: mensagem.titulo,
        description: mensagem.descricao,
        url: mensagem.url,
        color: mensagem.cor ?? 0x0b6b3a,
        fields: mensagem.campos ?? [],
        // Com o cartaz anexado, a imagem aparece dentro da mensagem.
        ...(comAnexo && mensagem.arquivo
          ? { image: { url: `attachment://${encodeURIComponent(mensagem.arquivo.name)}` } }
          : {}),
        footer: { text: 'Polícia Militar do Paraná · Portal de Inscrições' },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const resposta = await fetch(webhook, {
      method: 'POST',
      body: montarFormulario(payload, mensagem.arquivo),
      // sem cabeçalho Content-Type: o navegador define o boundary sozinho
    });

    if (resposta.ok) {
      return { ok: true, detalhe: 'Mensagem entregue ao canal.' };
    }

    const texto = await resposta.text().catch(() => '');
    // 404/401 = webhook apagado, regenerado ou token errado
    if (resposta.status === 404) {
      return {
        ok: false,
        detalhe: 'O Discord não encontrou este webhook. Ele pode ter sido apagado ou recriado no canal.',
      };
    }
    if (resposta.status === 401 || resposta.status === 403) {
      return {
        ok: false,
        detalhe: 'O Discord recusou o webhook (sem permissão). Copie a URL novamente no canal.',
      };
    }
    if (resposta.status === 429) {
      return { ok: false, detalhe: 'O Discord limitou os envios temporariamente. Aguarde alguns segundos.' };
    }
    return { ok: false, detalhe: `O Discord respondeu ${resposta.status}: ${texto.slice(0, 160)}` };
  } catch {
    return {
      ok: false,
      detalhe:
        'Não foi possível alcançar o Discord a partir deste navegador. Verifique a conexão, extensões de bloqueio ou firewall da rede.',
    };
  }
}
