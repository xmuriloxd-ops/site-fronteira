/**
 * Integração com o Discord — denúncias da Corregedoria-Geral da PMPR.
 *
 * A denúncia vai como EMBED com todos os campos + fotos de evidência como
 * anexos (formato `ambos`, padrão). Também dá para enviar só em texto ou
 * só com as fotos.
 *
 * O envio sai primeiro do navegador; se a rede/bloqueador impedir, cai no
 * `/api/discord/proxy` do servidor. Sem bot e sem token: só a URL do webhook.
 */
import type { ConfigDiscord, Denuncia } from '../types';
import {
  dataBR,
  dataUrlParaBlob,
  diaPorExtenso,
  horaBR,
  limitar,
  textoOuTraco,
} from './format';

export interface AnexoDiscord {
  nome: string;
  dataUrl: string;
  descricao: string;
}

export interface PacoteDiscord {
  payload: Record<string, unknown>;
  /** Arquivos na ordem em que aparecem em `payload.attachments`. */
  anexos: AnexoDiscord[];
}

export interface ResultadoEnvio {
  ok: boolean;
  detalhe: string;
  via: 'navegador' | 'servidor' | 'local';
}

const HOSTS = ['discord.com', 'discordapp.com', 'ptb.discord.com', 'canary.discord.com'];

export function webhookValido(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return (
      u.protocol === 'https:' &&
      HOSTS.includes(u.hostname) &&
      /^\/api\/(?:v\d+\/)?webhooks\/\d+\//.test(u.pathname)
    );
  } catch {
    return false;
  }
}

export function formatoEnvio(cfg: ConfigDiscord): 'ambos' | 'texto' | 'fotos' {
  return cfg.formatoEnvio ?? 'ambos';
}

function campo(nome: string, valor: string, inline = true) {
  return { name: nome, value: limitar(textoOuTraco(valor), 1000), inline };
}

function urlLogo(): string | undefined {
  try {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      return new URL('/brasao-pmpr.png', window.location.origin).href;
    }
  } catch {
    /* origem sem URL pública */
  }
  return undefined;
}

function baseMensagem(cfg: ConfigDiscord) {
  const mencoes: string[] = [];
  const cargo = cfg.cargoId?.trim().replace(/\D/g, '') ?? '';
  if (cfg.mencionarHere) mencoes.push('@here');
  if (cargo) mencoes.push(`<@&${cargo}>`);
  return {
    username: cfg.nomeBot?.trim() || 'Corregedoria · Denúncias PMPR',
    ...(mencoes.length ? { content: mencoes.join(' ') } : {}),
    allowed_mentions: {
      parse: cfg.mencionarHere ? ['everyone'] : [],
      ...(cargo ? { roles: [cargo] } : {}),
    },
  };
}

function nomeFoto(dataUrl: string, indice: number): string {
  const m = /^data:image\/(jpeg|jpg|png|webp);base64,/.exec(dataUrl);
  const ext = m?.[1] === 'png' ? 'png' : m?.[1] === 'webp' ? 'webp' : 'jpg';
  return `evidencia-${indice + 1}.${ext}`;
}

function rodape(denuncia: Denuncia, logo?: string) {
  return {
    text: `Corregedoria-Geral · Polícia Militar do Paraná · RP | ${denuncia.numero || 'Denúncia'}`,
    ...(logo ? { icon_url: logo } : {}),
  };
}

function identificacaoDenunciado(d: Denuncia): string {
  const partes = [d.denunciadoNome, d.denunciadoPosto, d.denunciadoUnidade].map((p) => p?.trim()).filter(Boolean);
  return partes.length ? partes.join(' · ') : 'Não identificado';
}

/** Embed completo com todos os campos da denúncia. */
function embedCompleto(d: Denuncia, logo?: string, imagem?: string) {
  return {
    title: '⛔ DENÚNCIA · CORREGEDORIA-GERAL PMPR',
    description: `**Protocolo ${d.numero || 'sem número'}** — ${limitar(textoOuTraco(d.categoria), 200)}`,
    color: 0x0b2d57,
    fields: [
      campo('🎯 Natureza', d.categoria),
      campo('🛡️ Denunciado', identificacaoDenunciado(d), false),
      campo('📜 Relato', d.relato, false),
      campo('📍 Local', d.local),
      campo('🗓️ Data dos fatos', d.dataFatos),
      campo(
        '👤 Denunciante',
        d.anonima ? 'ANÔNIMO (identidade preservada)' : textoOuTraco(d.denuncianteNome),
      ),
      ...(!d.anonima && d.denuncianteContato?.trim()
        ? [campo('📞 Contato', d.denuncianteContato)]
        : []),
      campo(
        '🗓️ Protocolo gerado em',
        `${diaPorExtenso(d.criadoEm)} · ${dataBR(d.criadoEm)} às ${horaBR(d.criadoEm)}`,
        false,
      ),
    ],
    ...(imagem ? { image: { url: `attachment://${imagem}` } } : {}),
    ...(logo ? { thumbnail: { url: logo } } : {}),
    footer: rodape(d, logo),
    timestamp: d.criadoEm,
  };
}

/** Embed enxuto, para quando as fotos são o foco da mensagem. */
function embedResumo(d: Denuncia, logo?: string, imagem?: string) {
  return {
    title: '⛔ DENÚNCIA RECEBIDA · CORREGEDORIA-GERAL PMPR',
    description: `**Protocolo ${d.numero || 'sem número'}** · ${limitar(textoOuTraco(d.categoria), 200)}`,
    color: 0x0b2d57,
    fields: [
      campo('🛡️ Denunciado', identificacaoDenunciado(d), false),
      campo('📍 Local', d.local),
      campo('🗓️ Data dos fatos', d.dataFatos),
    ],
    ...(imagem ? { image: { url: `attachment://${imagem}` } } : {}),
    ...(logo ? { thumbnail: { url: logo } } : {}),
    footer: rodape(d, logo),
    timestamp: d.criadoEm,
  };
}

/** Monta a mensagem de uma denúncia com as fotos de evidência. */
export function montarPacote(denuncia: Denuncia, cfg: ConfigDiscord): PacoteDiscord {
  const formato = formatoEnvio(cfg);
  const logo = urlLogo();
  const anexos: AnexoDiscord[] = [];

  const fotos = (denuncia.fotos ?? []).slice(0, 4);
  const comFotos = formato !== 'texto' && fotos.length > 0;

  if (comFotos) {
    fotos.forEach((foto, i) => {
      anexos.push({
        nome: nomeFoto(foto, i),
        dataUrl: foto,
        descricao: `Evidência ${i + 1} da denúncia ${denuncia.numero}`,
      });
    });
  }

  const primeiraFoto = anexos[0]?.nome;
  let embed: Record<string, unknown>;
  if (formato === 'fotos' && comFotos) {
    embed = embedResumo(denuncia, logo, primeiraFoto);
  } else {
    embed = embedCompleto(denuncia, logo, comFotos ? primeiraFoto : undefined);
  }

  return {
    anexos,
    payload: {
      ...baseMensagem(cfg),
      embeds: [embed],
      ...(anexos.length
        ? {
            attachments: anexos.map((a, i) => ({
              id: i,
              filename: a.nome,
              description: a.descricao,
            })),
          }
        : {}),
    },
  };
}

/** Mensagem de teste: confirma que o canal está vinculado. */
export function montarPacoteTeste(cfg: ConfigDiscord): PacoteDiscord {
  const formato = formatoEnvio(cfg);
  const logo = urlLogo();

  const embed: Record<string, unknown> = {
    title: '✅ INTEGRAÇÃO ATIVA · CORREGEDORIA PMPR',
    description:
      'Canal vinculado ao **Canal de Denúncias da Corregedoria-Geral da Polícia Militar do Paraná** (RP). ' +
      'Toda denúncia protocolada pode ser publicada aqui automaticamente, com relato, identificação do denunciado e evidências.',
    color: 0xf0b323,
    fields: [
      { name: 'Canal', value: limitar(textoOuTraco(cfg.canal), 100), inline: true },
      { name: 'Envio automático', value: cfg.autoEnviar ? 'Ativado' : 'Desativado', inline: true },
      {
        name: 'Formato',
        value: formato === 'ambos' ? 'Embed + fotos' : formato === 'fotos' ? 'Resumo + fotos' : 'Só texto',
        inline: true,
      },
    ],
    ...(logo ? { thumbnail: { url: logo } } : {}),
    footer: { text: 'Corregedoria-Geral · Polícia Militar do Paraná · RP · Teste de integração' },
    timestamp: new Date().toISOString(),
  };

  return {
    anexos: [],
    payload: {
      ...baseMensagem(cfg),
      embeds: [embed],
    },
  };
}

function interpretarStatus(status: number, texto: string): ResultadoEnvio {
  if (status === 404 || status === 401 || status === 403) {
    return {
      ok: false,
      detalhe: 'Webhook recusado (apagado, regenerado ou sem permissão). Copie a URL novamente no Discord.',
      via: 'navegador',
    };
  }
  if (status === 429) {
    return {
      ok: false,
      detalhe: 'O Discord limitou os envios. Aguarde alguns segundos e tente de novo.',
      via: 'navegador',
    };
  }
  return { ok: false, detalhe: `Discord respondeu ${status}: ${limitar(texto, 180)}`, via: 'navegador' };
}

/** Envia pelo navegador; se falhar por rede/CORS, tenta pelo servidor. */
export async function enviarPacote(webhook: string, pacote: PacoteDiscord): Promise<ResultadoEnvio> {
  if (!webhookValido(webhook)) {
    return {
      ok: false,
      detalhe: 'Cole uma URL válida de webhook: https://discord.com/api/webhooks/...',
      via: 'local',
    };
  }

  const url = `${webhook.trim()}${webhook.includes('?') ? '&' : '?'}wait=true`;

  try {
    let corpo: BodyInit;
    let cabecalhos: HeadersInit | undefined;
    if (pacote.anexos.length) {
      const form = new FormData();
      pacote.anexos.forEach((anexo, i) => {
        const arquivo = dataUrlParaBlob(anexo.dataUrl);
        if (arquivo) form.append(`files[${i}]`, arquivo.blob, anexo.nome);
      });
      form.append('payload_json', JSON.stringify(pacote.payload));
      corpo = form;
    } else {
      cabecalhos = { 'Content-Type': 'application/json' };
      corpo = JSON.stringify(pacote.payload);
    }

    const resposta = await fetch(url, { method: 'POST', headers: cabecalhos, body: corpo });
    if (resposta.ok || resposta.status === 204 || resposta.status === 0) {
      return { ok: true, detalhe: 'Denúncia entregue no canal do Discord.', via: 'navegador' };
    }
    const texto = await resposta.text().catch(() => '');
    return interpretarStatus(resposta.status, texto);
  } catch {
    /* navegador bloqueado: tenta o servidor */
  }

  try {
    const resposta = await fetch('/api/discord/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhook: webhook.trim(),
        payload: pacote.payload,
        anexos: pacote.anexos,
      }),
    });
    const dados = (await resposta.json().catch(() => ({}))) as { ok?: boolean; detalhe?: string };
    if (resposta.ok && dados.ok) {
      return { ok: true, detalhe: dados.detalhe || 'Mensagem entregue pelo servidor.', via: 'servidor' };
    }
    return {
      ok: false,
      detalhe: dados.detalhe || 'O servidor não conseguiu entregar a mensagem.',
      via: 'servidor',
    };
  } catch {
    return {
      ok: false,
      detalhe:
        'Não foi possível alcançar o Discord nem pelo navegador nem pelo servidor. Verifique a conexão e a URL do webhook.',
      via: 'local',
    };
  }
}
