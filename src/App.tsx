import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, FileDown, FilePlus2, LockKeyhole, ShieldAlert } from 'lucide-react';
import type { AbaId, ConfigDiscord, Denuncia, EstadoApp, RascunhoDenuncia } from './types';
import { Header, Navegacao } from './components/Header';
import { FormularioDenuncia } from './components/FormularioDenuncia';
import { ListaDenuncias, ModalDenuncia } from './components/ListaDenuncias';
import { AbaDiscord } from './components/AbaDiscord';
import { Botao, Toast } from './components/ui';
import { useEstado } from './lib/useEstado';
import {
  enviarPacote,
  montarPacote,
  montarPacoteTeste,
  webhookValido,
} from './lib/discord';
import type { ResultadoEnvio } from './lib/discord';
import { agoraISO, baixarArquivo, dataBR, novoId, proximoNumero } from './lib/format';

interface Aviso {
  mensagem: string;
  tipo: 'ok' | 'erro' | 'info';
}

const TEXTOS: Record<AbaId, { olho: string; titulo: string; texto: string }> = {
  denunciar: {
    olho: 'PROTOCOLAMENTO DE DENÚNCIA',
    titulo: 'Fazer denúncia',
    texto: 'Descreva os fatos, identifique o militar (se possível) e anexe evidências. O protocolo é gerado automaticamente.',
  },
  denuncias: {
    olho: 'ACERVO DIGITAL',
    titulo: 'Denúncias protocoladas',
    texto: 'Consulte, acompanhe a situação, edite e envie as denúncias ao canal do Discord.',
  },
  discord: {
    olho: 'INTEGRAÇÃO',
    titulo: 'Canal do Discord',
    texto: 'Vincule o canal que recebe as denúncias automaticamente e acompanhe as entregas.',
  },
};

export default function App() {
  const { estado, modo, aplicar, sincronizar } = useEstado();
  const [aba, setAba] = useState<AbaId>('denunciar');
  const [editando, setEditando] = useState<Denuncia | null>(null);
  const [abertaId, setAbertaId] = useState<string | null>(null);
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
    () => estado.denuncias.filter((d) => !d.discordEnviadoEm).length,
    [estado.denuncias],
  );

  /* --------------------------- Discord --------------------------- */

  const registrarEnvio = async (titulo: string, denunciaId: string | undefined, resultado: ResultadoEnvio) => {
    const envio = {
      id: novoId(),
      denunciaId,
      titulo,
      status: (resultado.ok ? 'sucesso' : 'erro') as 'sucesso' | 'erro',
      detalhe: resultado.detalhe,
      via: (resultado.via === 'servidor' ? 'servidor' : 'navegador') as 'servidor' | 'navegador',
      criadoEm: agoraISO(),
    };
    aplicar((atual) => ({ ...atual, envios: [envio, ...atual.envios].slice(0, 150) }));
    await sincronizar({ tipo: 'envio', envio });
  };

  const enviarDenuncia = async (denuncia: Denuncia, cfg: ConfigDiscord): Promise<ResultadoEnvio> => {
    if (!webhookValido(cfg.webhook)) {
      const resultado: ResultadoEnvio = {
        ok: false,
        detalhe: 'Nenhum webhook válido configurado na aba Canal do Discord.',
        via: 'local',
      };
      avisar(resultado.detalhe, 'erro');
      return resultado;
    }

    const pacote = montarPacote(denuncia, cfg);
    const resultado = await enviarPacote(cfg.webhook, pacote);
    const atualizada: Denuncia = {
      ...denuncia,
      discordEnviadoEm: resultado.ok ? agoraISO() : undefined,
      discordErro: resultado.ok ? undefined : resultado.detalhe,
    };

    aplicar((atual) => ({
      ...atual,
      denuncias: atual.denuncias.map((d) => (d.id === denuncia.id ? atualizada : d)),
    }));
    await sincronizar({ tipo: 'atualizar', denuncia: atualizada });
    await registrarEnvio(`${denuncia.numero} · ${denuncia.categoria || 'Denúncia'}`, denuncia.id, resultado);

    avisar(
      resultado.ok
        ? `${denuncia.numero} enviada ao Discord com sucesso.`
        : `Falha no envio: ${resultado.detalhe}`,
      resultado.ok ? 'ok' : 'erro',
    );
    return resultado;
  };

  /* --------------------------- Registros -------------------------- */

  const salvarRegistro = async (dados: RascunhoDenuncia) => {
    setSalvando(true);
    const atual = estadoRef.current;

    if (editando) {
      const denuncia: Denuncia = {
        ...editando,
        ...dados,
        criadoEm: editando.criadoEm,
        atualizadoEm: agoraISO(),
      };
      aplicar((e) => ({
        ...e,
        denuncias: e.denuncias.map((d) => (d.id === denuncia.id ? denuncia : d)),
      }));
      await sincronizar({ tipo: 'atualizar', denuncia });
      setEditando(null);
      setAbertaId(denuncia.id);
      setAba('denuncias');
      avisar(`Protocolo ${denuncia.numero} atualizado.`, 'ok');
      setSalvando(false);
      return;
    }

    const denuncia: Denuncia = {
      ...dados,
      id: novoId(),
      numero: proximoNumero(atual.denuncias),
      criadoEm: agoraISO(),
    };
    aplicar((e) => ({ ...e, denuncias: [denuncia, ...e.denuncias] }));
    await sincronizar({ tipo: 'criar', denuncia });
    avisar(`Denúncia protocolada · ${denuncia.numero}.`, 'ok');

    if (atual.discord.autoEnviar && webhookValido(atual.discord.webhook)) {
      await enviarDenuncia(denuncia, atual.discord);
    }

    setAba('denuncias');
    setSalvando(false);
  };

  const atualizarAcompanhamento = async (denuncia: Denuncia, patch: Partial<Denuncia>) => {
    const atualizada: Denuncia = { ...denuncia, ...patch };
    aplicar((e) => ({ ...e, denuncias: e.denuncias.map((d) => (d.id === atualizada.id ? atualizada : d)) }));
    await sincronizar({ tipo: 'atualizar', denuncia: atualizada });
  };

  const excluir = async (denuncia: Denuncia) => {
    aplicar((e) => ({ ...e, denuncias: e.denuncias.filter((d) => d.id !== denuncia.id) }));
    await sincronizar({ tipo: 'excluir', id: denuncia.id });
    setAbertaId(null);
    if (editando?.id === denuncia.id) setEditando(null);
    avisar(`Protocolo ${denuncia.numero} excluído.`, 'info');
  };

  const iniciarEdicao = (denuncia: Denuncia) => {
    setAbertaId(null);
    setEditando(denuncia);
    setAba('denunciar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* --------------------------- Discord --------------------------- */

  const salvarConfig = async (cfg: ConfigDiscord) => {
    aplicar((e) => ({ ...e, discord: cfg }));
    await sincronizar({ tipo: 'discord', config: cfg });
    avisar('Configuração do canal salva.', 'ok');
  };

  const testar = async (cfg: ConfigDiscord) => {
    if (!webhookValido(cfg.webhook)) {
      avisar('Cole uma URL de webhook válida antes de testar.', 'erro');
      return;
    }
    setTestando(true);
    const resultado = await enviarPacote(cfg.webhook, montarPacoteTeste(cfg));
    await registrarEnvio('Teste de integração', undefined, resultado);
    avisar(
      resultado.ok ? 'Mensagem de teste entregue no canal.' : `Falha no teste: ${resultado.detalhe}`,
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
    const lista = estadoRef.current.denuncias.filter((d) => !d.discordEnviadoEm);
    if (!lista.length) {
      avisar('Não há denúncias pendentes de envio.', 'info');
      return;
    }
    setEnviando(true);
    let ok = 0;
    for (const denuncia of lista.slice(0, 15)) {
      const r = await enviarDenuncia(denuncia, cfg);
      if (r.ok) ok++;
    }
    setEnviando(false);
    avisar(`${ok}/${Math.min(lista.length, 15)} denúncias enviadas ao Discord.`, ok ? 'ok' : 'erro');
  };

  /* ---------------------------- Outros --------------------------- */

  const exportar = () => {
    baixarArquivo(
      `corregedoria-pmpr-backup-${dataBR().replace(/\//g, '-')}.json`,
      JSON.stringify(estadoRef.current, null, 2),
    );
    avisar('Backup das denúncias baixado.', 'ok');
  };

  const abrirAba = (id: AbaId) => {
    setAba(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const denunciaAberta = abertaId ? estado.denuncias.find((d) => d.id === abertaId) ?? null : null;
  const info = TEXTOS[aba];

  return (
    <div className="app">
      <Header modo={modo} total={estado.denuncias.length} />
      <Navegacao aba={aba} onAba={abrirAba} total={estado.denuncias.length} pendentes={pendentes} />

      <main className="conteudo">
        <div className="pagina-topo">
          <div>
            <span className="pagina-topo__olho">{info.olho}</span>
            <h2>{info.titulo}</h2>
            <p>{info.texto}</p>
          </div>
          <div className="pagina-topo__direita">
            {aba !== 'denunciar' && (
              <Botao variante="primario" pequeno icone={<FilePlus2 size={15} />} onClick={() => abrirAba('denunciar')}>
                Nova denúncia
              </Botao>
            )}
            {aba === 'denuncias' && (
              <Botao variante="fantasma" pequeno icone={<FileDown size={15} />} onClick={exportar}>
                Backup
              </Botao>
            )}
            <span className="pagina-topo__selo">
              <LockKeyhole size={13} /> PM PR · RP <ChevronRight size={13} /> {info.olho}
            </span>
          </div>
        </div>

        {aba === 'denunciar' && (
          <>
            <div className="destaque">
              <div className="destaque__icone">
                <ShieldAlert size={26} />
              </div>
              <div className="destaque__textos">
                <strong>CANAL OFICIAL DE DENÚNCIAS · CORREGEDORIA-GERAL PMPR</strong>
                <p>
                  Denuncie irregularidades cometidas por policiais militares: condutas em serviço, abuso de autoridade,
                  desrespeito ao cidadão e outras. <b>Anonimato garantido</b>, protocolo automático e envio opcional ao
                  canal do Discord. Ambiente de roleplay — sem vínculo com órgãos oficiais.
                </p>
              </div>
            </div>
            <FormularioDenuncia
              key={editando?.id ?? 'nova'}
              editando={editando}
              numero={proximoNumero(estado.denuncias)}
              salvando={salvando}
              onSalvar={(dados) => void salvarRegistro(dados)}
              onCancelarEdicao={() => setEditando(null)}
              onAviso={avisar}
            />
          </>
        )}

        {aba === 'denuncias' && (
          <ListaDenuncias
            denuncias={estado.denuncias}
            pendentes={pendentes}
            enviando={enviando}
            onAbrir={(d) => setAbertaId(d.id)}
            onNova={() => abrirAba('denunciar')}
            onExportar={exportar}
            onEnviarPendentes={() => void enviarPendentes()}
          />
        )}

        {aba === 'discord' && (
          <AbaDiscord
            config={estado.discord}
            envios={estado.envios}
            pendentes={pendentes}
            testando={testando || enviando}
            onSalvar={(cfg) => void salvarConfig(cfg)}
            onTestar={(cfg) => void testar(cfg)}
            onEnviarPendentes={() => void enviarPendentes()}
          />
        )}
      </main>

      <footer className="rodape">
        <div className="rodape__interno">
          <div className="rodape__marca">
            <img src="/brasao-pmpr.png" alt="" />
            <div>
              <strong>CORREGEDORIA-GERAL · POLÍCIA MILITAR DO PARANÁ</strong>
              <span>Canal de Denúncias e Ouvidoria · RP</span>
            </div>
          </div>
          <div className="rodape__info">
            <span>Ambiente de roleplay — sem vínculo com órgãos oficiais.</span>
            <span>
              {modo === 'servidor' ? 'Dados compartilhados no servidor' : 'Dados armazenados neste navegador'} ·{' '}
              {estado.denuncias.length} denúncias · {dataBR()}
            </span>
          </div>
        </div>
      </footer>

      {denunciaAberta && (
        <ModalDenuncia
          denuncia={denunciaAberta}
          enviando={enviando}
          onFechar={() => setAbertaId(null)}
          onEditar={() => iniciarEdicao(denunciaAberta)}
          onExcluir={() => void excluir(denunciaAberta)}
          onEnviar={() => {
            setEnviando(true);
            void enviarDenuncia(denunciaAberta, estado.discord).finally(() => setEnviando(false));
          }}
          onAtualizar={(patch) => void atualizarAcompanhamento(denunciaAberta, patch)}
          onAviso={avisar}
        />
      )}

      {aviso && <Toast mensagem={aviso.mensagem} tipo={aviso.tipo} onFechar={() => setAviso(null)} />}
    </div>
  );
}
