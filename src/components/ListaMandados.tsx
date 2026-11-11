import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  Download,
  FileSearch,
  Fingerprint,
  Gavel,
  Send,
  ShieldAlert,
} from 'lucide-react';
import type { Mandado, StatusMandado } from '../types';
import { STATUS_MANDADO } from '../types';
import { dataBR, diaCurto, horaBR, limitar, textoOuTraco } from '../lib/format';
import { Botao, Etiqueta, Vazio } from './ui';

interface Props {
  mandados: Mandado[];
  onAbrir: (m: Mandado) => void;
  onNovo: () => void;
  onExportar: () => void;
  onEnviarPendentes: () => void;
  pendentes: number;
}

export function ListaMandados({ mandados, onAbrir, onNovo, onExportar, onEnviarPendentes, pendentes }: Props) {
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState<'' | StatusMandado>('');
  const [unidade, setUnidade] = useState('');
  const [ordem, setOrdem] = useState<'recentes' | 'antigos'>('recentes');

  const unidades = useMemo(
    () =>
      Array.from(new Set(mandados.map((m) => m.unidade).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'pt-BR'),
      ),
    [mandados],
  );

  const totalPendentes = mandados.filter((m) => m.status === 'pendente').length;
  const totalCumpridos = mandados.filter((m) => m.status === 'cumprido').length;

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    const lista = mandados.filter((m) => {
      if (status && m.status !== status) return false;
      if (unidade && m.unidade !== unidade) return false;
      if (!termo) return true;
      return [m.nome, m.idRp, m.numero, m.artigos, m.autoridade, m.unidade, m.processo, m.origem]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(termo);
    });
    return lista.sort((a, b) => {
      const diff = new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime();
      return ordem === 'recentes' ? -diff : diff;
    });
  }, [mandados, busca, status, unidade, ordem]);

  return (
    <div className="lista">
      <div className="stats">
        <div className="stat">
          <span className="stat__rotulo">TOTAL DE MANDADOS</span>
          <strong>{String(mandados.length).padStart(3, '0')}</strong>
          <span className="stat__rodape"><Gavel size={13} /> expedidos no sistema</span>
        </div>
        <div className="stat">
          <span className="stat__rotulo">PENDENTES</span>
          <strong>{String(totalPendentes).padStart(3, '0')}</strong>
          <span className="stat__rodape"><ShieldAlert size={13} /> aguardando cumprimento</span>
        </div>
        <div className="stat">
          <span className="stat__rotulo">CUMPRIDOS</span>
          <strong>{String(totalCumpridos).padStart(3, '0')}</strong>
          <span className="stat__rodape"><CalendarDays size={13} /> {dataBR()}</span>
        </div>
        <div className="stat stat--acao">
          <span className="stat__rotulo">AÇÕES RÁPIDAS</span>
          <Botao variante="secundario" pequeno icone={<Download size={14} />} onClick={onExportar}>
            Backup JSON
          </Botao>
          {pendentes > 0 && (
            <Botao variante="secundario" pequeno icone={<Send size={14} />} onClick={onEnviarPendentes}>
              Enviar pendentes ({pendentes})
            </Botao>
          )}
        </div>
      </div>

      <div className="filtros">
        <div className="filtros__busca">
          <FileSearch size={17} />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por procurado, ID, artigo, autoridade, processo..."
            aria-label="Buscar mandados"
          />
          {busca && <button onClick={() => setBusca('')} aria-label="Limpar busca">×</button>}
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as '' | StatusMandado)} aria-label="Filtrar por situação">
          <option value="">Todas as situações</option>
          {(Object.keys(STATUS_MANDADO) as StatusMandado[]).map((s) => (
            <option key={s} value={s}>{STATUS_MANDADO[s]}</option>
          ))}
        </select>
        <select value={unidade} onChange={(e) => setUnidade(e.target.value)} aria-label="Filtrar por unidade">
          <option value="">Todas as unidades</option>
          {unidades.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <select value={ordem} onChange={(e) => setOrdem(e.target.value as 'recentes' | 'antigos')} aria-label="Ordenar">
          <option value="recentes">Mais recentes</option>
          <option value="antigos">Mais antigas</option>
        </select>
        <span className="filtros__total">{filtrados.length} {filtrados.length === 1 ? 'resultado' : 'resultados'}</span>
      </div>

      {filtrados.length === 0 ? (
        <Vazio
          icone={mandados.length ? <FileSearch size={30} /> : <Gavel size={30} />}
          titulo={mandados.length ? 'Nenhum mandado encontrado' : 'Nenhum mandado expedido'}
          texto={
            mandados.length
              ? 'Ajuste a busca ou os filtros para encontrar o mandado.'
              : 'Expedir o primeiro mandado na aba Mandados de prisão. O cartaz será enviado ao Discord.'
          }
          acao={!mandados.length && <Botao variante="primario" onClick={onNovo}>Expedir primeiro mandado</Botao>}
        />
      ) : (
        <div className="grade-prisoes">
          {filtrados.map((m) => (
            <button key={m.id} className={`cartao-prisao cartao-mandado cartao-mandado--${m.status}`} onClick={() => onAbrir(m)}>
              <div className="cartao-prisao__foto">
                {m.fotos?.[0] ? (
                  <img src={m.fotos[0]} alt={`Foto de ${m.nome}`} />
                ) : (
                  <div className="cartao-prisao__sem-foto"><Fingerprint size={34} /></div>
                )}
                <span className="cartao-prisao__numero">{m.numero}</span>
              </div>
              <div className="cartao-prisao__corpo">
                <div className="cartao-prisao__topo">
                  <span>{diaCurto(m.criadoEm)} · {dataBR(m.criadoEm)} · {horaBR(m.criadoEm)}</span>
                  {m.status === 'pendente' ? (
                    <Etiqueta>PENDENTE</Etiqueta>
                  ) : m.status === 'cumprido' ? (
                    <Etiqueta claro>CUMPRIDO</Etiqueta>
                  ) : (
                    <Etiqueta>REVOGADO</Etiqueta>
                  )}
                </div>
                <h3>{textoOuTraco(m.nome)}</h3>
                <div className="cartao-prisao__id">ID RP · {textoOuTraco(m.idRp)} · {STATUS_MANDADO[m.status]}</div>
                <div className="cartao-prisao__linhas">
                  <div>
                    <span>ARTIGOS</span>
                    <b>{limitar(textoOuTraco(m.artigos).replace(/\n/g, ' · '), 70)}</b>
                  </div>
                  <div>
                    <span>AUTORIDADE</span>
                    <b>{textoOuTraco(m.autoridade)}</b>
                  </div>
                  <div>
                    <span>UNIDADE RESPONSÁVEL</span>
                    <b>{limitar(textoOuTraco(m.unidade), 70)}</b>
                  </div>
                </div>
                <div className="cartao-prisao__rodape">
                  <span>{m.discordEnviadoEm ? 'CARTAZ ENVIADO ✓' : 'CARTAZ PENDENTE'}</span>
                  <ArrowUpRight size={16} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
