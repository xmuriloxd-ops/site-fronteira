import { useMemo, useState } from 'react';
import { CheckCheck, FileDown, Inbox, Search, Send, ShieldAlert, X } from 'lucide-react';
import type { Denuncia, SituacaoDenuncia } from '../types';
import { SITUACOES_DENUNCIA } from '../types';
import { CATEGORIAS } from '../data/opcoes';
import { dataHoraBR, dataBR } from '../lib/format';
import { Botao, Campo, SecaoTitulo, Selecao, Vazio } from './ui';

interface Props {
  denuncias: Denuncia[];
  pendentes: number;
  enviando: boolean;
  onAbrir: (d: Denuncia) => void;
  onNova: () => void;
  onExportar: () => void;
  onEnviarPendentes: () => void;
}

const SITUACAO_CLASSE: Record<SituacaoDenuncia, string> = {
  aberta: 'etiqueta--aberta',
  'em-analise': 'etiqueta--analise',
  procedente: 'etiqueta--procedente',
  improcedente: 'etiqueta--improcedente',
  arquivada: 'etiqueta--arquivada',
};

export function ListaDenuncias({
  denuncias,
  pendentes,
  enviando,
  onAbrir,
  onNova,
  onExportar,
  onEnviarPendentes,
}: Props) {
  const [busca, setBusca] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const stats = useMemo(() => {
    const abertas = denuncias.filter((d) => d.situacao === 'aberta').length;
    const emAnalise = denuncias.filter((d) => d.situacao === 'em-analise').length;
    const enviadas = denuncias.filter((d) => d.discordEnviadoEm).length;
    return { total: denuncias.length, abertas, emAnalise, enviadas };
  }, [denuncias]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return denuncias.filter((d) => {
      if (filtroSituacao && d.situacao !== filtroSituacao) return false;
      if (filtroCategoria && d.categoria !== filtroCategoria) return false;
      if (!termo) return true;
      return [d.numero, d.categoria, d.relato, d.denunciadoNome, d.denunciadoUnidade, d.local]
        .join(' ')
        .toLowerCase()
        .includes(termo);
    });
  }, [denuncias, busca, filtroSituacao, filtroCategoria]);

  return (
    <>
      <div className="stats">
        <div className="stat stat--dourado">
          <span className="stat__rotulo">TOTAL PROTOCOLADO</span>
          <strong>{stats.total}</strong>
          <span className="stat__rodape">denúncias no acervo</span>
        </div>
        <div className="stat">
          <span className="stat__rotulo">AGUARDANDO ANÁLISE</span>
          <strong>{stats.abertas}</strong>
          <span className="stat__rodape">denúncias abertas</span>
        </div>
        <div className="stat">
          <span className="stat__rotulo">EM APURAÇÃO</span>
          <strong>{stats.emAnalise}</strong>
          <span className="stat__rodape">em análise corregedoria</span>
        </div>
        <div className="stat stat--verde">
          <span className="stat__rotulo">PUBLICADAS NO DISCORD</span>
          <strong>{stats.enviadas}</strong>
          <span className="stat__rodape">entregues ao canal</span>
        </div>
      </div>

      <div className="filtros">
        <div className="filtros__busca">
          <Search size={17} />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por protocolo, denunciado, relato..."
            aria-label="Buscar denúncias"
          />
          {busca && (
            <button type="button" onClick={() => setBusca('')} aria-label="Limpar busca">
              ×
            </button>
          )}
        </div>
        <select
          value={filtroSituacao}
          onChange={(e) => setFiltroSituacao(e.target.value)}
          aria-label="Filtrar por situação"
        >
          <option value="">Todas as situações</option>
          {(Object.keys(SITUACOES_DENUNCIA) as SituacaoDenuncia[]).map((s) => (
            <option key={s} value={s}>
              {SITUACOES_DENUNCIA[s]}
            </option>
          ))}
        </select>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          aria-label="Filtrar por natureza"
        >
          <option value="">Todas as naturezas</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="filtros__total">
          {filtradas.length} de {denuncias.length}
        </span>
      </div>

      <div className="lista-acoes">
        <Botao variante="primario" onClick={onNova}>
          Nova denúncia
        </Botao>
        {pendentes > 0 && (
          <Botao variante="secundario" icone={<Send size={15} />} onClick={onEnviarPendentes} disabled={enviando}>
            {enviando ? 'ENVIANDO...' : `ENVIAR ${pendentes} PENDENTE${pendentes > 1 ? 'S' : ''}`}
          </Botao>
        )}
        <Botao variante="fantasma" icone={<FileDown size={15} />} onClick={onExportar}>
          Backup JSON
        </Botao>
      </div>

      {denuncias.length === 0 ? (
        <Vazio
          icone={<Inbox size={30} />}
          titulo="Nenhuma denúncia protocolada"
          texto="Assim que a primeira denúncia for protocolada, ela aparecerá aqui com o número do protocolo."
          acao={
            <Botao variante="primario" onClick={onNova}>
              Fazer a primeira denúncia
            </Botao>
          }
        />
      ) : filtradas.length === 0 ? (
        <Vazio
          icone={<Search size={28} />}
          titulo="Nada encontrado"
          texto="Nenhuma denúncia corresponde aos filtros aplicados. Ajuste a busca ou limpe os filtros."
        />
      ) : (
        <div className="grade-denuncias">
          {filtradas.map((d) => (
            <button key={d.id} className="cartao-denuncia" onClick={() => onAbrir(d)}>
              <div className="cartao-denuncia__topo">
                <span className="cartao-denuncia__numero">{d.numero}</span>
                <span className={`etiqueta ${SITUACAO_CLASSE[d.situacao]}`}>
                  {SITUACOES_DENUNCIA[d.situacao]}
                </span>
              </div>
              <h3>{d.categoria || 'Denúncia'}</h3>
              <span className="cartao-denuncia__denunciado">
                🛡️ {d.denunciadoNome || 'Denunciado não identificado'}
                {d.denunciadoPosto ? ` · ${d.denunciadoPosto}` : ''}
              </span>
              <p className="cartao-denuncia__relato">{d.relato}</p>
              <div className="cartao-denuncia__linhas">
                <div>
                  <span>LOCAL</span>
                  <b>{d.local || '—'}</b>
                </div>
                <div>
                  <span>DATA DOS FATOS</span>
                  <b>{d.dataFatos || '—'}</b>
                </div>
              </div>
              <div className="cartao-denuncia__rodape">
                <span>{dataHoraBR(d.criadoEm)}</span>
                <span className={d.discordEnviadoEm ? 'cartao-denuncia__enviado' : ''}>
                  {d.discordEnviadoEm ? (
                    <>
                      <CheckCheck size={13} /> ENVIADA
                    </>
                  ) : d.discordErro ? (
                    <>
                      <X size={13} /> FALHA
                    </>
                  ) : (
                    <>
                      <Send size={13} /> PENDENTE
                    </>
                  )}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/* ------------------------- Modal de detalhes --------------------------- */

interface ModalProps {
  denuncia: Denuncia;
  enviando: boolean;
  onFechar: () => void;
  onEditar: () => void;
  onExcluir: () => void;
  onEnviar: () => void;
  onAtualizar: (patch: Partial<Denuncia>) => void;
  onAviso: (mensagem: string, tipo?: 'ok' | 'erro' | 'info') => void;
}

export function ModalDenuncia({
  denuncia,
  enviando,
  onFechar,
  onEditar,
  onExcluir,
  onEnviar,
  onAtualizar,
  onAviso,
}: ModalProps) {
  const [confirmando, setConfirmando] = useState(false);
  const [situacao, setSituacao] = useState<SituacaoDenuncia>(denuncia.situacao);
  const [parecer, setParecer] = useState(denuncia.parecer);
  const [mostrarFotos, setMostrarFotos] = useState<string | null>(null);

  const situacaoClasse = SITUACAO_CLASSE[denuncia.situacao];

  const salvarAcompanhamento = () => {
    if (situacao === denuncia.situacao && parecer === denuncia.parecer) {
      onAviso('Nada alterado no acompanhamento.', 'info');
      return;
    }
    onAtualizar({ situacao, parecer, atualizadoEm: new Date().toISOString() });
    onAviso('Acompanhamento atualizado.', 'ok');
  };

  return (
    <>
      <div className="modal-fundo" role="presentation" onMouseDown={onFechar}>
        <div
          className="modal modal--largo"
          role="dialog"
          aria-modal="true"
          aria-label={`Denúncia ${denuncia.numero}`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <header className="modal__topo">
            <div>
              <h3>{denuncia.numero}</h3>
              <p>
                {denuncia.categoria || 'Denúncia'} · protocolada em {dataBR(denuncia.criadoEm)}
              </p>
            </div>
            <div className="modal__topo-acoes">
              <span className={`etiqueta ${situacaoClasse}`}>{SITUACOES_DENUNCIA[denuncia.situacao]}</span>
              <button className="modal__fechar" onClick={onFechar} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
          </header>

          <div className="modal__corpo">
            <div className="detalhe-grade">
              <div className="detalhe-item detalhe-item--largo">
                <span>NATUREZA</span>
                <b>{denuncia.categoria || '—'}</b>
              </div>
              <div className="detalhe-item detalhe-item--largo">
                <span>DENUNCIADO</span>
                <b>
                  {denuncia.denunciadoNome || 'Não identificado'}
                  {denuncia.denunciadoPosto ? ` · ${denuncia.denunciadoPosto}` : ''}
                  {denuncia.denunciadoUnidade ? ` · ${denuncia.denunciadoUnidade}` : ''}
                </b>
              </div>
              <div className="detalhe-item">
                <span>LOCAL</span>
                <b>{denuncia.local || '—'}</b>
              </div>
              <div className="detalhe-item">
                <span>DATA DOS FATOS</span>
                <b>{denuncia.dataFatos || '—'}</b>
              </div>
              <div className="detalhe-item">
                <span>DENUNCIANTE</span>
                <b>
                  {denuncia.anonima
                    ? 'ANÔNIMO'
                    : denuncia.denuncianteNome || 'Não identificado'}
                </b>
              </div>
              <div className="detalhe-item">
                <span>CONTATO</span>
                <b>{!denuncia.anonima && denuncia.denuncianteContato ? denuncia.denuncianteContato : '—'}</b>
              </div>
              <div className="detalhe-item">
                <span>PROTOCOLADO EM</span>
                <b>{dataHoraBR(denuncia.criadoEm)}</b>
              </div>
              <div className="detalhe-item">
                <span>ÚLTIMA ALTERAÇÃO</span>
                <b>{denuncia.atualizadoEm ? dataHoraBR(denuncia.atualizadoEm) : '—'}</b>
              </div>
            </div>

            <div className="detalhe-bloco">
              <span>RELATO DOS FATOS</span>
              <p>{denuncia.relato}</p>
            </div>

            {denuncia.fotos.length > 0 && (
              <div className="evidencias-extra">
                <span>EVIDÊNCIAS ({denuncia.fotos.length})</span>
                <div>
                  {denuncia.fotos.map((foto, i) => (
                    <button type="button" key={i} className="mini-foto" onClick={() => setMostrarFotos(foto)}>
                      <img src={foto} alt={`Evidência ${i + 1}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="acompanhamento">
              <SecaoTitulo
                titulo="Acompanhamento da corregedoria"
                descricao="Situação e parecer interno — não aparecem no canal do Discord."
              />
              <div className="grid-2">
                <Campo label="Situação">
                  <Selecao value={situacao} onChange={(e) => setSituacao(e.target.value as SituacaoDenuncia)}>
                    {(Object.keys(SITUACOES_DENUNCIA) as SituacaoDenuncia[]).map((s) => (
                      <option key={s} value={s}>
                        {SITUACOES_DENUNCIA[s]}
                      </option>
                    ))}
                  </Selecao>
                </Campo>
                <div className="detalhe-item">
                  <span>STATUS NO DISCORD</span>
                  <b>
                    {denuncia.discordEnviadoEm
                      ? `ENVIADA EM ${dataHoraBR(denuncia.discordEnviadoEm)}`
                      : denuncia.discordErro
                        ? `FALHA: ${denuncia.discordErro}`
                        : 'PENDENTE DE ENVIO'}
                  </b>
                </div>
              </div>
              <Campo label="Parecer / notas internas">
                <textarea
                  className="textarea"
                  rows={4}
                  value={parecer}
                  maxLength={4000}
                  onChange={(e) => setParecer(e.target.value)}
                  placeholder="Descrição das diligências, conclusões e providências..."
                />
              </Campo>
              <Botao variante="primario" pequeno onClick={salvarAcompanhamento}>
                Salvar acompanhamento
              </Botao>
            </div>

            {confirmando && (
              <div className="confirmar">
                <div>
                  <strong>Excluir definitivamente {denuncia.numero}?</strong>
                  <p>O registro, as evidências e o histórico deste protocolo serão apagados.</p>
                </div>
                <div className="confirmar__botoes">
                  <Botao variante="perigo" onClick={onExcluir}>
                    Sim, excluir
                  </Botao>
                  <Botao variante="fantasma" onClick={() => setConfirmando(false)}>
                    Cancelar
                  </Botao>
                </div>
              </div>
            )}
          </div>

          <footer className="modal__acoes">
            <div className="modal__botoes">
              <Botao variante="secundario" onClick={onEditar}>
                Editar denúncia
              </Botao>
              <Botao
                variante="primario"
                icone={<Send size={15} />}
                onClick={onEnviar}
                disabled={enviando}
              >
                {enviando ? 'ENVIANDO...' : 'ENVIAR AO DISCORD'}
              </Botao>
            </div>
            <div className="modal__botoes">
              {!confirmando && (
                <Botao variante="perigo" icone={<ShieldAlert size={15} />} onClick={() => setConfirmando(true)}>
                  Excluir
                </Botao>
              )}
            </div>
          </footer>
        </div>
      </div>

      {mostrarFotos && (
        <div className="lightbox" onClick={() => setMostrarFotos(null)} role="presentation">
          <img src={mostrarFotos} alt="Evidência ampliada" />
          <button type="button" onClick={() => setMostrarFotos(null)} aria-label="Fechar imagem">
            <X size={22} />
          </button>
        </div>
      )}
    </>
  );
}
