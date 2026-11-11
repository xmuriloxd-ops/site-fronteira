/**
 * Integração com o Discord.
 *
 * A ficha vai como CARTAZ (imagem PNG gerada no navegador, no mesmo modelo da
 * ficha impressa, com a assinatura do escrivão). O formato é configurável:
 * só cartaz, só texto em embed, ou os dois.
 *
 * O envio sai primeiro do navegador; se a rede/bloqueador impedir, cai no
 * `/api/discord/proxy` do servidor. Sem bot e sem token: só a URL do webhook.
 */
import type { ConfigDiscord, Mandado, Prisao } from '../types';
import { STATUS_MANDADO } from '../types';
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
  /** Nome do arquivo do cartaz, quando houver. */
  cartaz?: string;
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

export function formatoEnvio(cfg: ConfigDiscord): 'cartaz' | 'texto' | 'ambos' {
  return cfg.formatoEnvio ?? 'cartaz';
}

function campo(nome: string, valor: string, inline = true) {
  return { name: nome, value: limitar(textoOuTraco(valor), 1000), inline };
}

function urlLogo(): string | undefined {
  try {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      return new URL('/logo-pcpr.png', window.location.origin).href;
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
    username: cfg.nomeBot?.trim() || 'PCPR · Registro de Prisões',
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
  return `foto-${indice}.${ext}`;
}

function rodape(prisao: Prisao, logo?: string) {
  return {
    text: `Polícia Civil do Paraná · RP | ${prisao.numero || 'Registro de Prisões'}`,
    ...(logo ? { icon_url: logo } : {}),
  };
}

/** Campos completos da ficha (usado nos formatos "texto" e "ambos"). */
function embedTexto(prisao: Prisao, logo?: string, comImagem = false, imagem?: string) {
  return {
    title: 'REGISTRO DE PRISÃO · PCPR RP',
    description: `**${limitar(textoOuTraco(prisao.nome), 200)}** — ficha ${prisao.numero || 'sem número'}`,
    color: 0x101010,
    fields: [
      campo('👤 Nome do custodiado', prisao.nome),
      campo('🪪 ID', prisao.idRp),
      campo('⚖️ Tempo de prisão', prisao.tempoPrisao),
      campo('📜 Artigos', prisao.artigos, false),
      campo('📦 Itens apreendidos', prisao.itensApreendidos, false),
      campo('👮 Agente que prendeu', prisao.agente),
      campo('🏛️ Unidade na ocorrência', prisao.unidade),
      campo('✍️ Escrivão', prisao.escrivao),
      ...(prisao.local?.trim() ? [campo('📍 Local', prisao.local, false)] : []),
      ...(prisao.observacoes?.trim() ? [campo('📝 Observações', prisao.observacoes, false)] : []),
      campo(
        '🗓️ Dia e data (gerado automaticamente)',
        `${diaPorExtenso(prisao.criadoEm)} · ${dataBR(prisao.criadoEm)} às ${horaBR(prisao.criadoEm)}`,
        false,
      ),
    ],
    ...(comImagem && imagem ? { image: { url: `attachment://${imagem}` } } : {}),
    ...(logo ? { thumbnail: { url: logo } } : {}),
    footer: rodape(prisao, logo),
    timestamp: prisao.criadoEm,
  };
}

/** Embed enxuto que acompanha o cartaz. */
function embedCartaz(prisao: Prisao, logo?: string, imagem?: string) {
  return {
    title: 'REGISTRO DE PRISÃO · PCPR RP',
    description: `**${limitar(textoOuTraco(prisao.nome), 200)}** · ID ${textoOuTraco(prisao.idRp)} · ficha ${prisao.numero || 'sem número'}`,
    color: 0x000000,
    fields: [
      campo('⚖️ Tempo de prisão', prisao.tempoPrisao),
      campo('👮 Agente', prisao.agente),
      campo('✍️ Escrivão', prisao.escrivao),
      campo(
        '🗓️ Dia e data',
        `${diaPorExtenso(prisao.criadoEm)} · ${dataBR(prisao.criadoEm)} às ${horaBR(prisao.criadoEm)}`,
        false,
      ),
    ],
    ...(imagem ? { image: { url: `attachment://${imagem}` } } : {}),
    ...(logo ? { thumbnail: { url: logo } } : {}),
    footer: rodape(prisao, logo),
    timestamp: prisao.criadoEm,
  };
}

/**
 * Monta a mensagem de uma prisão. `cartaz` é a data URL do PNG gerado pelo
 * `gerarCartaz()`. Sem cartaz, cai automaticamente no formato em texto.
 */
export function montarPacote(prisao: Prisao, cfg: ConfigDiscord, cartaz?: string): PacoteDiscord {
  const formato = cartaz ? formatoEnvio(cfg) : 'texto';
  const logo = urlLogo();
  const anexos: AnexoDiscord[] = [];

  const nomeCartaz = cartaz
    ? `cartaz-${(prisao.numero || 'ficha').replace(/[^a-zA-Z0-9-]/g, '-')}.png`
    : undefined;

  // O cartaz entra primeiro: é a imagem principal da mensagem.
  if (cartaz && nomeCartaz && formato !== 'texto') {
    anexos.push({ nome: nomeCartaz, dataUrl: cartaz, descricao: `Cartaz da ficha ${prisao.numero}` });
  }

  const fotos = (prisao.fotos ?? []).slice(0, 4);
  if (formato !== 'cartaz') {
    fotos.forEach((foto, i) => {
      anexos.push({
        nome: nomeFoto(foto, i),
        dataUrl: foto,
        descricao: `Foto ${i + 1} do custodiado`,
      });
    });
  }

  const primeiraFoto = fotos.length ? nomeFoto(fotos[0], 0) : undefined;
  const imagemCartaz = formato === 'texto' ? undefined : nomeCartaz;

  let embeds: Record<string, unknown>[];
  if (formato === 'cartaz') {
    embeds = [embedCartaz(prisao, logo, imagemCartaz)];
  } else if (formato === 'texto') {
    embeds = [embedTexto(prisao, logo, true, primeiraFoto)];
  } else {
    embeds = [
      embedTexto(prisao, logo, false),
      // Segundo embed só com a arte do cartaz.
      {
        color: 0x000000,
        ...(imagemCartaz ? { image: { url: `attachment://${imagemCartaz}` } } : {}),
      },
    ];
  }

  return {
    anexos,
    cartaz: nomeCartaz,
    payload: {
      ...baseMensagem(cfg),
      embeds,
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

/** Mensagem de teste: leva um cartaz de exemplo quando o formato é imagem. */
export function montarPacoteTeste(cfg: ConfigDiscord, cartaz?: string): PacoteDiscord {
  const formato = cartaz ? formatoEnvio(cfg) : 'texto';
  const logo = urlLogo();
  const nomeCartaz = 'cartaz-exemplo.png';
  const anexos: AnexoDiscord[] =
    cartaz && formato !== 'texto'
      ? [{ nome: nomeCartaz, dataUrl: cartaz, descricao: 'Cartaz de exemplo da ficha de registro' }]
      : [];

  const embed: Record<string, unknown> = {
    title: '✅ INTEGRAÇÃO ATIVA · PCPR RP',
    description:
      'Canal vinculado ao **Sistema de Registro de Prisões** da Polícia Civil do Paraná RP. ' +
      (cartaz
        ? 'Abaixo, um **cartaz de exemplo** no mesmo modelo enviado a cada prisão, já com a assinatura do escrivão.'
        : 'Toda prisão registrada pode ser publicada aqui automaticamente.'),
    color: 0xffffff,
    fields: [
      { name: 'Canal', value: limitar(textoOuTraco(cfg.canal), 100), inline: true },
      { name: 'Envio automático', value: cfg.autoEnviar ? 'Ativado' : 'Desativado', inline: true },
      {
        name: 'Formato',
        value: formato === 'cartaz' ? 'Cartaz (imagem)' : formato === 'ambos' ? 'Cartaz + texto' : 'Ficha em texto',
        inline: true,
      },
    ],
    ...(cartaz && formato !== 'texto' ? { image: { url: `attachment://${nomeCartaz}` } } : {}),
    ...(logo ? { thumbnail: { url: logo } } : {}),
    footer: { text: 'Polícia Civil do Paraná · RP · Teste de integração' },
    timestamp: new Date().toISOString(),
  };

  return {
    anexos,
    cartaz: anexos.length ? nomeCartaz : undefined,
    payload: {
      ...baseMensagem(cfg),
      embeds: [embed],
      ...(anexos.length
        ? { attachments: anexos.map((a, i) => ({ id: i, filename: a.nome, description: a.descricao })) }
        : {}),
    },
  };
}

/* ------------------------------------------------------------------ */
/* Mandados de prisão                                                  */
/* ------------------------------------------------------------------ */

function embedCartazMandado(m: Mandado, logo?: string, imagem?: string) {
  return {
    title: 'MANDADO DE PRISÃO · PCPR RP',
    description: `**${limitar(textoOuTraco(m.nome), 200)}** · ID ${textoOuTraco(m.idRp)} · ${m.numero}`,
    color: 0x000000,
    fields: [
      campo('⚖️ Situação', STATUS_MANDADO[m.status] ?? 'PENDENTE DE CUMPRIMENTO'),
      campo('📜 Artigos', m.artigos),
      campo('🏛️ Autoridade', m.autoridade),
      campo('🎯 Unidade responsável', m.unidade),
      campo(
        '🗓️ Dia e data',
        `${diaPorExtenso(m.criadoEm)} · ${dataBR(m.criadoEm)} às ${horaBR(m.criadoEm)}`,
        false,
      ),
    ],
    ...(imagem ? { image: { url: `attachment://${imagem}` } } : {}),
    ...(logo ? { thumbnail: { url: logo } } : {}),
    footer: {
      text: `Polícia Civil do Paraná · RP | ${m.numero}`,
      ...(logo ? { icon_url: logo } : {}),
    },
    timestamp: m.criadoEm,
  };
}

function embedTextoMandado(m: Mandado, logo?: string, imagem?: string) {
  return {
    title: 'MANDADO DE PRISÃO · PCPR RP',
    description: `**${limitar(textoOuTraco(m.nome), 200)}** — ${m.numero} · ${STATUS_MANDADO[m.status] ?? 'PENDENTE'}`,
    color: 0x101010,
    fields: [
      campo('👤 Procurado', m.nome),
      campo('🪪 ID RP', m.idRp),
      campo('⚖️ Situação', STATUS_MANDADO[m.status] ?? 'PENDENTE DE CUMPRIMENTO'),
      campo('📜 Artigos / tipificação', m.artigos, false),
      campo('📝 Fundamento', m.fundamento, false),
      campo('📁 Processo / inquérito', m.processo),
      campo('🏛️ Autoridade que expediu', m.autoridade),
      campo('🏢 Juízo / origem', m.origem, false),
      campo('🎯 Unidade responsável', m.unidade),
      campo('👮 Agente / equipe', m.agente),
      campo('⏳ Validade', m.validade, false),
      ...(m.observacoes?.trim() ? [campo('📝 Observações', m.observacoes, false)] : []),
      campo(
        '🗓️ Dia e data (gerado automaticamente)',
        `${diaPorExtenso(m.criadoEm)} · ${dataBR(m.criadoEm)} às ${horaBR(m.criadoEm)}`,
        false,
      ),
    ],
    ...(imagem ? { image: { url: `attachment://${imagem}` } } : {}),
    ...(logo ? { thumbnail: { url: logo } } : {}),
    footer: { text: `Polícia Civil do Paraná · RP | ${m.numero}` },
    timestamp: m.criadoEm,
  };
}

/** Monta a mensagem de um mandado com o cartaz em imagem. */
export function montarPacoteMandado(m: Mandado, cfg: ConfigDiscord, cartaz?: string): PacoteDiscord {
  // O mandado vai SEMPRE em cartaz, independentemente do formato escolhido
  // para as fichas de prisão. Só cai para texto se o canvas falhar.
  const formato = cartaz ? 'cartaz' : 'texto';
  const logo = urlLogo();
  const anexos: AnexoDiscord[] = [];
  const nomeCartaz = cartaz ? `cartaz-${m.numero.replace(/[^a-zA-Z0-9-]/g, '-')}.png` : undefined;

  if (cartaz && nomeCartaz && formato !== 'texto') {
    anexos.push({ nome: nomeCartaz, dataUrl: cartaz, descricao: `Cartaz do mandado ${m.numero}` });
  }

  const fotos = (m.fotos ?? []).slice(0, 4);
  if (formato !== 'cartaz') {
    fotos.forEach((foto, i) =>
      anexos.push({ nome: nomeFoto(foto, i), dataUrl: foto, descricao: `Foto ${i + 1} do procurado` }),
    );
  }
  const primeiraFoto = fotos.length ? nomeFoto(fotos[0], 0) : undefined;
  const imagemCartaz = formato === 'texto' ? undefined : nomeCartaz;

  let embeds: Record<string, unknown>[];
  if (formato === 'cartaz') {
    embeds = [embedCartazMandado(m, logo, imagemCartaz)];
  } else if (formato === 'texto') {
    embeds = [embedTextoMandado(m, logo, primeiraFoto)];
  } else {
    embeds = [
      embedTextoMandado(m, logo),
      { color: 0x000000, ...(imagemCartaz ? { image: { url: `attachment://${imagemCartaz}` } } : {}) },
    ];
  }

  return {
    anexos,
    cartaz: imagemCartaz,
    payload: {
      ...baseMensagem(cfg),
      embeds,
      ...(anexos.length
        ? { attachments: anexos.map((a, i) => ({ id: i, filename: a.nome, description: a.descricao })) }
        : {}),
    },
  };
}

/** Teste do canal dos mandados, com cartaz de exemplo. */
export function montarPacoteTesteMandado(cfg: ConfigDiscord, cartaz?: string): PacoteDiscord {
  const formato = cartaz ? 'cartaz' : 'texto';
  const logo = urlLogo();
  const nomeCartaz = 'cartaz-mandado-exemplo.png';
  const anexos: AnexoDiscord[] =
    cartaz && formato !== 'texto'
      ? [{ nome: nomeCartaz, dataUrl: cartaz, descricao: 'Cartaz de exemplo do mandado de prisão' }]
      : [];

  return {
    anexos,
    cartaz: anexos.length ? nomeCartaz : undefined,
    payload: {
      ...baseMensagem(cfg),
      embeds: [
        {
          title: '✅ CANAL DE MANDADOS ATIVO · PCPR RP',
          description: cartaz
            ? 'Abaixo, um **cartaz de exemplo de mandado de prisão**, no mesmo formato enviado a cada expedição.'
            : 'Canal vinculado aos mandados de prisão da Polícia Civil do Paraná RP.',
          color: 0xffffff,
          fields: [
            { name: 'Canal', value: limitar(textoOuTraco(cfg.canal), 100), inline: true },
            { name: 'Envio automático', value: cfg.autoEnviar ? 'Ativado' : 'Desativado', inline: true },
            {
              name: 'Formato',
              value: formato === 'cartaz' ? 'Cartaz (imagem)' : 'Texto (cartaz indisponível)',
              inline: true,
            },
          ],
          ...(anexos.length ? { image: { url: `attachment://${nomeCartaz}` } } : {}),
          ...(logo ? { thumbnail: { url: logo } } : {}),
          footer: { text: 'Polícia Civil do Paraná · RP · Teste de mandados' },
          timestamp: new Date().toISOString(),
        },
      ],
      ...(anexos.length
        ? { attachments: anexos.map((a, i) => ({ id: i, filename: a.nome, description: a.descricao })) }
        : {}),
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
      return { ok: true, detalhe: 'Ficha entregue no canal do Discord.', via: 'navegador' };
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
      return { ok: true, detalhe: dados.detalhe || 'Cartaz entregue pelo servidor.', via: 'servidor' };
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
