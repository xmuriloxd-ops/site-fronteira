import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, FilePlus2, Gavel, LockKeyhole } from 'lucide-react';
import type {
  AbaId,
  ConfigDiscord,
  EstadoApp,
  Mandado,
  Prisao,
  RascunhoMandado,
  RascunhoPrisao,
} from './types';
import { Header, Navegacao } from './components/Header';
import { FormularioPrisao } from './components/FormularioPrisao';
import { FormularioMandado } from './components/FormularioMandado';
import { ListaPrisoes } from './components/ListaPrisoes';
import { ListaMandados } from './components/ListaMandados';
import { AbaDiscord } from './components/AbaDiscord';
import { ModalFicha } from './components/ModalFicha';
import { ModalMandado } from './components/ModalMandado';
import { Ficha } from './components/Ficha';
import type { DadosFicha } from './components/Ficha';
import { Botao, Toast } from './components/ui';
import { useEstado } from './lib/useEstado';
import {
  enviarPacote,
  formatoEnvio,
  montarPacote,
  montarPacoteMandado,
  montarPacoteTeste,
  montarPacoteTesteMandado,
  webhookValido,
} from './lib/discord';
import type { ResultadoEnvio } from './lib/discord';
import { dadosCartazExemplo, gerarCartaz } from './lib/cartaz';
import { dadosMandadoExemplo, gerarCartazMandado } from './lib/cartazMandado';
import {
  agoraISO,
  baixarArquivo,
  dataBR,
  novoId,
  proximoNumero,
  proximoNumeroMandado,
} from './lib/format';

interface Aviso {
  mensagem: string;
  tipo: 'ok' | 'erro' | 'info';
}

interface Impressao {
  dados: DadosFicha;
  numero: string;
}

const TEXTOS: Record<AbaId, { olho: string; titulo: string; texto: string }> = {
  registrar: {
    olho: 'LAVRATURA DE OCORRÊNCIA',
    titulo: 'Registrar prisão',
    texto: 'Preencha a ficha com os dados do custodiado, os artigos e a equipe da ocorrência.',
  },
  prisoes: {
    olho: 'ACERVO DIGITAL',
    titulo: 'Prisões registradas',
    texto: 'Consulte, edite, imprima e envie as fichas ao canal do Discord.',
  },
  mandados: {
    olho: 'EXPEDIÇÃO E CUMPRIMENTO',
    titulo: 'Mandados de prisão',
    texto: 'Expedir um mandado ou consultar os cartazes já enviados ao Discord — use o botão abaixo para alternar.',
  },
  discord: {
    olho: 'INTEGRAÇÃO',
    titulo: 'Canal do Discord',
    texto: 'Vincule o canal que recebe as prisões e os mandados e acompanhe as entregas.',
  },
};

/** Webhook efetivo: canal próprio dos mandados ou o canal das prisões. */
function configMandados(estado: EstadoApp): ConfigDiscord {
  const proprio = estado.discordMandados;
  return webhookValido(proprio.webhook)
    ? proprio
    : { ...proprio, webhook: estado.discord.webhook };
}

export default function App() {
  const { estado, modo, aplicar, sincronizar } = useEstado();
  const [aba, setAba] = useState<AbaId>('registrar');
  const [subAbaMandados, setSubAbaMandados] = useState<'formulario' | 'lista'>('formulario');
  const [editando, setEditando] = useState<Prisao | null>(null);
  const [aberta, setAberta] = useState<Prisao | null>(null);
  const [editandoMandado, setEditandoMandado] = useState<Mandado | null>(null);
  const [mandadoAbertoId, setMandadoAbertoId] = useState<string | null>(null);
  const [impressao, setImpressao] = useState<Impressao | null>(null);
  const [impressaoCartaz, setImpressaoCartaz] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [testando, setTestando] = useState(false);
  const estadoRef = useRef<EstadoApp>(estado);
  estadoRef.current = estado;

  useEffect(() => {
    if (!aviso) return;
    const id = window.setTimeout(() => setAviso(null), 5500);
    return () => window.clearTimeout(id);
  }, [aviso]);

  // Versões antigas deste repositório registravam service worker. Remove o
  // resquício para o navegador não servir arquivos em cache do portal anterior.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    void navigator.serviceWorker
      .getRegistrations()
      .then((lista) => Promise.all(lista.map((r) => r.unregister())))
      .catch(() => undefined);
  }, []);

  const avisar = (mensagem: string, tipo: Aviso['tipo'] = 'info') => setAviso({ mensagem, tipo });

  const pendentes = useMemo(
    () => estado.prisoes.filter((p) => !p.discordEnviadoEm).length,
    [estado.prisoes],
  );
  const mandadosPendentes = useMemo(
    () => estado.mandados.filter((m) => !m.discordEnviadoEm).length,
    [estado.mandados],
  );

  /* --------------------------- Discord --------------------------- */

  const registrarEnvio = async (titulo: string, prisaoId: string | undefined, resultado: ResultadoEnvio) => {
    const envio = {
      id: novoId(),
      prisaoId,
      titulo,
      status: (resultado.ok ? 'sucesso' : 'erro') as 'sucesso' | 'erro',
      detalhe: resultado.detalhe,
      via: (resultado.via === 'servidor' ? 'servidor' : 'navegador') as 'servidor' | 'navegador',
      criadoEm: agoraISO(),
    };
    aplicar((atual) => ({ ...atual, envios: [envio, ...atual.envios].slice(0, 150) }));
    await sincronizar({ tipo: 'envio', envio });
  };

  const enviarPrisao = async (prisao: Prisao, cfg: ConfigDiscord): Promise<ResultadoEnvio> => {
    if (!webhookValido(cfg.webhook)) {
      const resultado: ResultadoEnvio = {
        ok: false,
        detalhe: 'Nenhum webhook válido configurado na aba Canal do Discord.',
        via: 'local',
      };
      avisar(resultado.detalhe, 'erro');
      return resultado;
    }

    // O cartaz é gerado no navegador no mesmo modelo da ficha impressa.
    // Se o canvas falhar, o envio continua no formato de texto.
    let cartaz: string | undefined;
    if (formatoEnvio(cfg) !== 'texto') {
      try {
        cartaz = (await gerarCartaz(prisao)).dataUrl;
      } catch {
        cartaz = undefined;
      }
    }
    const pacote = montarPacote(prisao, cfg, cartaz);
    const resultado = await enviarPacote(cfg.webhook, pacote);
    const atualizada: Prisao = {
      ...prisao,
      discordEnviadoEm: resultado.ok ? agoraISO() : undefined,
      discordErro: resultado.ok ? undefined : resultado.detalhe,
    };

    aplicar((atual) => ({
      ...atual,
      prisoes: atual.prisoes.map((p) => (p.id === prisao.id ? atualizada : p)),
    }));
    await sincronizar({ tipo: 'atualizar', prisao: atualizada });
    await registrarEnvio(`${prisao.numero} · ${prisao.nome}`, prisao.id, resultado);

    avisar(
      resultado.ok
        ? `${prisao.numero} enviado ao Discord com sucesso.`
        : `Falha no envio: ${resultado.detalhe}`,
      resultado.ok ? 'ok' : 'erro',
    );
    return resultado;
  };

  const enviarMandado = async (mandado: Mandado, cfg: ConfigDiscord): Promise<ResultadoEnvio> => {
    if (!webhookValido(cfg.webhook)) {
      const resultado: ResultadoEnvio = {
        ok: false,
        detalhe: 'Nenhum webhook válido configurado para os mandados na aba Canal do Discord.',
        via: 'local',
      };
      avisar(resultado.detalhe, 'erro');
      return resultado;
    }

    // Por definição desta aba, o mandado vai em cartaz: mesmo que o canal
    // esteja em "texto", geramos a imagem para montarPacoteMandado.
    let cartaz: string | undefined;
    try {
      cartaz = (await gerarCartazMandado(mandado)).dataUrl;
    } catch {
      cartaz = undefined;
    }
    const pacote = montarPacoteMandado(mandado, cfg, cartaz);
    const resultado = await enviarPacote(cfg.webhook, pacote);
    const atualizado: Mandado = {
      ...mandado,
      discordEnviadoEm: resultado.ok ? agoraISO() : undefined,
      discordErro: resultado.ok ? undefined : resultado.detalhe,
    };

    aplicar((atual) => ({
      ...atual,
      mandados: atual.mandados.map((m) => (m.id === mandado.id ? atualizado : m)),
    }));
    await sincronizar({ tipo: 'atualizar-mandado', mandado: atualizado });
    await registrarEnvio(`MANDADO ${mandado.numero} · ${mandado.nome}`, undefined, resultado);

    avisar(
      resultado.ok
        ? `Cartaz do mandado ${mandado.numero} enviado ao Discord com sucesso.`
        : `Falha no envio do cartaz: ${resultado.detalhe}`,
      resultado.ok ? 'ok' : 'erro',
    );
    return resultado;
  };

  /* --------------------------- Registros -------------------------- */

  const salvarRegistro = async (dados: RascunhoPrisao) => {
    setSalvando(true);
    const atual = estadoRef.current;

    if (editando) {
      const prisao: Prisao = {
        ...editando,
        ...dados,
        criadoEm: editando.criadoEm,
      };
      aplicar((e) => ({ ...e, prisoes: e.prisoes.map((p) => (p.id === prisao.id ? prisao : p)) }));
      await sincronizar({ tipo: 'atualizar', prisao });
      setEditando(null);
      setAba('prisoes');
      avisar(`Ficha ${prisao.numero} atualizada.`, 'ok');
      setSalvando(false);
      return;
    }

    const prisao: Prisao = {
      ...dados,
      id: novoId(),
      numero: proximoNumero(atual.prisoes),
      criadoEm: agoraISO(),
    };
    aplicar((e) => ({ ...e, prisoes: [prisao, ...e.prisoes] }));
    await sincronizar({ tipo: 'criar', prisao });
    avisar(`Prisão registrada · ficha ${prisao.numero}.`, 'ok');

    if (atual.discord.autoEnviar && webhookValido(atual.discord.webhook)) {
      await enviarPrisao(prisao, atual.discord);
    }

    setAba('prisoes');
    setSalvando(false);
  };

  const salvarMandado = async (dados: RascunhoMandado) => {
    setSalvando(true);
    const atual = estadoRef.current;

    if (editandoMandado) {
      const mandado: Mandado = {
        ...editandoMandado,
        ...dados,
        criadoEm: editandoMandado.criadoEm,
        cumpridoEm:
          dados.status === 'cumprido'
            ? (editandoMandado.cumpridoEm ?? agoraISO())
            : undefined,
      };
      aplicar((e) => ({
        ...e,
        mandados: e.mandados.map((m) => (m.id === mandado.id ? mandado : m)),
      }));
      await sincronizar({ tipo: 'atualizar-mandado', mandado });
      setEditandoMandado(null);
      setSubAbaMandados('lista');
      avisar(`Mandado ${mandado.numero} atualizado.`, 'ok');
      setSalvando(false);
      return;
    }

    const mandado: Mandado = {
      ...dados,
      id: novoId(),
      numero: proximoNumeroMandado(atual.mandados),
      criadoEm: agoraISO(),
      cumpridoEm: dados.status === 'cumprido' ? agoraISO() : undefined,
    };
    aplicar((e) => ({ ...e, mandados: [mandado, ...e.mandados] }));
    await sincronizar({ tipo: 'criar-mandado', mandado });
    avisar(`Mandado expedido · ${mandado.numero}.`, 'ok');

    const cfg = configMandados(atual);
    if (cfg.autoEnviar && webhookValido(cfg.webhook)) {
      await enviarMandado(mandado, cfg);
    }

    setSubAbaMandados('lista');
    setSalvando(false);
  };

  const excluir = async (prisao: Prisao) => {
    aplicar((e) => ({ ...e, prisoes: e.prisoes.filter((p) => p.id !== prisao.id) }));
    await sincronizar({ tipo: 'excluir', id: prisao.id });
    setAberta(null);
    if (editando?.id === prisao.id) setEditando(null);
    avisar(`Ficha ${prisao.numero} excluída.`, 'info');
  };

  const excluirMandado = async (mandado: Mandado) => {
    aplicar((e) => ({ ...e, mandados: e.mandados.filter((m) => m.id !== mandado.id) }));
    await sincronizar({ tipo: 'excluir-mandado', id: mandado.id });
    setMandadoAbertoId(null);
    if (editandoMandado?.id === mandado.id) setEditandoMandado(null);
    avisar(`Mandado ${mandado.numero} excluído.`, 'info');
  };

  const iniciarEdicao = (prisao: Prisao) => {
    setAberta(null);
    setEditando(prisao);
    setAba('registrar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const iniciarEdicaoMandado = (mandado: Mandado) => {
    setMandadoAbertoId(null);
    setEditandoMandado(mandado);
    setSubAbaMandados('formulario');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* --------------------------- Discord --------------------------- */

  const salvarConfig = async (cfg: ConfigDiscord) => {
    aplicar((e) => ({ ...e, discord: cfg }));
    await sincronizar({ tipo: 'discord', config: cfg });
    avisar('Configuração do canal salva.', 'ok');
  };

  const salvarConfigMandados = async (cfg: ConfigDiscord) => {
    aplicar((e) => ({ ...e, discordMandados: cfg }));
    await sincronizar({ tipo: 'discord-mandados', config: cfg });
    avisar('Configuração do canal de mandados salva.', 'ok');
  };

  const testar = async (cfg: ConfigDiscord) => {
    if (!webhookValido(cfg.webhook)) {
      avisar('Cole uma URL de webhook válida antes de testar.', 'erro');
      return;
    }
    setTestando(true);
    let cartaz: string | undefined;
    if (formatoEnvio(cfg) !== 'texto') {
      try {
        cartaz = (await gerarCartaz(dadosCartazExemplo(), { marcaDagua: 'EXEMPLO' })).dataUrl;
      } catch {
        cartaz = undefined;
      }
    }
    const resultado = await enviarPacote(cfg.webhook, montarPacoteTeste(cfg, cartaz));
    await registrarEnvio('Teste de integração', undefined, resultado);
    avisar(
      resultado.ok ? 'Mensagem de teste entregue no canal.' : `Falha no teste: ${resultado.detalhe}`,
      resultado.ok ? 'ok' : 'erro',
    );
    setTestando(false);
  };

  const testarMandados = async (cfg: ConfigDiscord) => {
    const efetiva = webhookValido(cfg.webhook) ? cfg : { ...cfg, webhook: estadoRef.current.discord.webhook };
    if (!webhookValido(efetiva.webhook)) {
      avisar('Cole uma URL de webhook válida antes de testar os mandados.', 'erro');
      return;
    }
    setTestando(true);
    let cartaz: string | undefined;
    try {
      cartaz = (await gerarCartazMandado(dadosMandadoExemplo(), { marcaDagua: 'EXEMPLO' })).dataUrl;
    } catch {
      cartaz = undefined;
    }
    const resultado = await enviarPacote(efetiva.webhook, montarPacoteTesteMandado(efetiva, cartaz));
    await registrarEnvio('Teste de integração · mandados', undefined, resultado);
    avisar(
      resultado.ok ? 'Cartaz de exemplo entregue no canal de mandados.' : `Falha no teste: ${resultado.detalhe}`,
      resultado.ok ? 'ok' : 'erro',
    );
    setTestando(false);
  };

  const enviarPendentes = async () => {
    const cfg = estadoRef.current.discord;
    if (!webhookValido(cfg.webhook)) {
      avisar('Configure o webhook na aba Canal do Discord primeiro.', 'erro');
      setAba('discord');
      return;
    }
    const lista = estadoRef.current.prisoes.filter((p) => !p.discordEnviadoEm);
    if (!lista.length) {
      avisar('Não há fichas pendentes de envio.', 'info');
      return;
    }
    setEnviando(true);
    let ok = 0;
    for (const prisao of lista.slice(0, 15)) {
      const r = await enviarPrisao(prisao, cfg);
      if (r.ok) ok++;
    }
    setEnviando(false);
    avisar(`${ok}/${Math.min(lista.length, 15)} fichas enviadas ao Discord.`, ok ? 'ok' : 'erro');
  };

  const enviarPendentesMandados = async () => {
    const atual = estadoRef.current;
    const cfg = configMandados(atual);
    if (!webhookValido(cfg.webhook)) {
      avisar('Configure o webhook na aba Canal do Discord primeiro.', 'erro');
      setAba('discord');
      return;
    }
    const lista = atual.mandados.filter((m) => !m.discordEnviadoEm);
    if (!lista.length) {
      avisar('Não há cartazes de mandados pendentes de envio.', 'info');
      return;
    }
    setEnviando(true);
    let ok = 0;
    for (const mandado of lista.slice(0, 15)) {
      const r = await enviarMandado(mandado, cfg);
      if (r.ok) ok++;
    }
    setEnviando(false);
    avisar(`${ok}/${Math.min(lista.length, 15)} cartazes de mandados enviados.`, ok ? 'ok' : 'erro');
  };

  /* ---------------------------- Outros --------------------------- */

  const imprimir = (dados: DadosFicha, numero: string) => {
    setImpressao({ dados, numero });
    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => setImpressao(null), 1500);
    }, 150);
  };

  const imprimirCartaz = (dataUrl: string) => {
    if (!dataUrl) return;
    setImpressaoCartaz(dataUrl);
    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => setImpressaoCartaz(null), 1500);
    }, 150);
  };

  const exportar = () => {
    baixarArquivo(
      `pcpr-rp-backup-${dataBR().replace(/\//g, '-')}.json`,
      JSON.stringify(estadoRef.current, null, 2),
    );
    avisar('Backup dos registros baixado.', 'ok');
  };

  const abrirAba = (id: AbaId) => {
    setAba(id);
    if (id !== 'mandados' && editandoMandado) setEditandoMandado(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prisaoAberta = aberta ? estado.prisoes.find((p) => p.id === aberta.id) ?? null : null;
  const mandadoAberto = mandadoAbertoId
    ? estado.mandados.find((m) => m.id === mandadoAbertoId) ?? null
    : null;
  const info = TEXTOS[aba];

  return (
    <div className="app">
      <Header modo={modo} total={estado.prisoes.length + estado.mandados.length} />
      <Navegacao
        aba={aba}
        onAba={abrirAba}
        total={estado.prisoes.length}
        pendentes={pendentes}
        mandadosPendentes={mandadosPendentes}
      />

      <main className="conteudo">
        <div className="pagina-topo">
          <div>
            <span className="pagina-topo__olho">{info.olho}</span>
            <h2>{info.titulo}</h2>
            <p>{info.texto}</p>
          </div>
          <div className="pagina-topo__direita">
            {aba !== 'registrar' && (
              <Botao variante="primario" pequeno icone={<FilePlus2 size={15} />} onClick={() => abrirAba('registrar')}>
                Nova prisão
              </Botao>
            )}
            {aba === 'mandados' && (
              <Botao
                variante="secundario"
                pequeno
                icone={<Gavel size={15} />}
                onClick={() => {
                  setEditandoMandado(null);
                  setSubAbaMandados('formulario');
                }}
              >
                Novo mandado
              </Botao>
            )}
            <span className="pagina-topo__selo">
              <LockKeyhole size={13} /> PCPR · RP <ChevronRight size={13} /> {info.olho}
            </span>
          </div>
        </div>

        {aba === 'mandados' && (
          <div className="sub-abas" role="tablist" aria-label="Mandados de prisão">
            <button
              role="tab"
              aria-selected={subAbaMandados === 'formulario'}
              className={subAbaMandados === 'formulario' ? 'ativo' : ''}
              onClick={() => setSubAbaMandados('formulario')}
            >
              <Gavel size={15} /> {editandoMandado ? 'Editar mandado' : 'Expedir mandado'}
            </button>
            <button
              role="tab"
              aria-selected={subAbaMandados === 'lista'}
              className={subAbaMandados === 'lista' ? 'ativo' : ''}
              onClick={() => setSubAbaMandados('lista')}
            >
              Mandados expedidos <span className="sub-abas__contador">{estado.mandados.length}</span>
            </button>
          </div>
        )}

        {aba === 'registrar' && (
          <FormularioPrisao
            key={editando?.id ?? 'novo'}
            editando={editando}
            numero={proximoNumero(estado.prisoes)}
            salvando={salvando}
            onSalvar={(dados) => void salvarRegistro(dados)}
            onCancelarEdicao={() => setEditando(null)}
            onAviso={avisar}
            onImprimir={imprimir}
          />
        )}

        {aba === 'prisoes' && (
          <ListaPrisoes
            prisoes={estado.prisoes}
            onAbrir={setAberta}
            onNova={() => abrirAba('registrar')}
            onExportar={exportar}
            onEnviarPendentes={() => void enviarPendentes()}
            pendentes={pendentes}
          />
        )}

        {aba === 'mandados' &&
          (subAbaMandados === 'formulario' ? (
            <FormularioMandado
              key={editandoMandado?.id ?? 'novo-mandado'}
              editando={editandoMandado}
              numero={proximoNumeroMandado(estado.mandados)}
              salvando={salvando}
              onSalvar={(dados) => void salvarMandado(dados)}
              onCancelarEdicao={() => {
                setEditandoMandado(null);
                setSubAbaMandados('lista');
              }}
              onAviso={avisar}
              onImprimir={imprimirCartaz}
            />
          ) : (
            <ListaMandados
              mandados={estado.mandados}
              onAbrir={(m) => setMandadoAbertoId(m.id)}
              onNovo={() => {
                setEditandoMandado(null);
                setSubAbaMandados('formulario');
              }}
              onExportar={exportar}
              onEnviarPendentes={() => void enviarPendentesMandados()}
              pendentes={mandadosPendentes}
            />
          ))}

        {aba === 'discord' && (
          <AbaDiscord
            config={estado.discord}
            configMandados={estado.discordMandados}
            envios={estado.envios}
            pendentes={pendentes}
            pendentesMandados={mandadosPendentes}
            testando={testando || enviando}
            onSalvar={(cfg) => void salvarConfig(cfg)}
            onSalvarMandados={(cfg) => void salvarConfigMandados(cfg)}
            onTestar={(cfg) => void testar(cfg)}
            onTestarMandados={(cfg) => void testarMandados(cfg)}
            onEnviarPendentes={() => void enviarPendentes()}
            onEnviarPendentesMandados={() => void enviarPendentesMandados()}
          />
        )}
      </main>

      <footer className="rodape">
        <div className="rodape__interno">
          <div className="rodape__marca">
            <img src="/brasao-pcpr-branco.png" alt="" />
            <div>
              <strong>POLÍCIA CIVIL DO PARANÁ · RP</strong>
              <span>Sistema de Registro de Prisões e Mandados</span>
            </div>
          </div>
          <div className="rodape__info">
            <span>Ambiente de roleplay — sem vínculo com órgãos oficiais.</span>
            <span>
              {modo === 'servidor' ? 'Dados compartilhados no servidor' : 'Dados armazenados neste navegador'} ·{' '}
              {estado.prisoes.length} prisões · {estado.mandados.length} mandados · {dataBR()}
            </span>
          </div>
        </div>
      </footer>

      {prisaoAberta && (
        <ModalFicha
          prisao={prisaoAberta}
          enviando={enviando}
          onFechar={() => setAberta(null)}
          onEnviar={() => {
            setEnviando(true);
            void enviarPrisao(prisaoAberta, estado.discord).finally(() => setEnviando(false));
          }}
          onImprimir={() => imprimir(prisaoAberta, prisaoAberta.numero)}
          onEditar={() => iniciarEdicao(prisaoAberta)}
          onExcluir={() => void excluir(prisaoAberta)}
        />
      )}

      {mandadoAberto && (
        <ModalMandado
          mandado={mandadoAberto}
          enviando={enviando}
          onFechar={() => setMandadoAbertoId(null)}
          onEditar={iniciarEdicaoMandado}
          onExcluir={(m) => void excluirMandado(m)}
          onEnviar={(m) => {
            setEnviando(true);
            void enviarMandado(m, configMandados(estadoRef.current)).finally(() => setEnviando(false));
          }}
          onImprimir={imprimirCartaz}
          onAviso={avisar}
        />
      )}

      {aviso && <Toast mensagem={aviso.mensagem} tipo={aviso.tipo} onFechar={() => setAviso(null)} />}

      {impressao && (
        <div className="somente-impressao">
          <Ficha dados={impressao.dados} numero={impressao.numero} />
        </div>
      )}
      {impressaoCartaz && (
        <div className="somente-impressao somente-impressao--cartaz">
          <img src={impressaoCartaz} alt="Cartaz do mandado de prisão" />
        </div>
      )}
    </div>
  );
}
