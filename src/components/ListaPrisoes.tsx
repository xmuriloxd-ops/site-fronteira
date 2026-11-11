import { useMemo, useState } from 'react';
import {
  Archive,
  ArrowUpRight,
  CalendarDays,
  Download,
  FileSearch,
  Fingerprint,
  Send,
  ShieldAlert,
} from 'lucide-react';
import type { Prisao } from '../types';
import { dataBR, diaCurto, horaBR, limitar, textoOuTraco } from '../lib/format';
import { Botao, Etiqueta, Vazio } from './ui';

interface Props {
  prisoes: Prisao[];
  onAbrir: (p: Prisao) => void;
  onNova: () => void;
  onExportar: () => void;
  onEnviarPendentes: () => void;
  pendentes: number;
}

export function ListaPrisoes({ prisoes, onAbrir, onNova, onExportar, onEnviarPendentes, pendentes }: Props) {
  const [busca, setBusca] = useState('');
  const [unidade, setUnidade] = useState('');
  const [ordem, setOrdem] = useState<'recentes' | 'antigos'>('recentes');

  const unidades = useMemo(
    () => Array.from(new Set(prisoes.map((p) => p.unidade).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [prisoes],
  );

  const hoje = dataBR();
  const totalHoje = prisoes.filter((p) => dataBR(p.criadoEm) === hoje).length;
  const enviados = prisoes.filter((p) => p.discordEnviadoEm).length;

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    const resultado = prisoes.filter((p) => {
      if (unidade && p.unidade !== unidade) return false;
      if (!termo) return true;
      const alvo = [p.nome, p.idRp, p.numero, p.artigos, p.agente, p.unidade, p.escrivao, p.itensApreendidos]
        .join(' ')
        .toLocaleLowerCase('pt-BR');
      return alvo.includes(termo);
    });
    return resultado.sort((a, b) => {
      const diff = new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime();
      return ordem === 'recentes' ? -diff : diff;
    });
  }, [prisoes, busca, unidade, ordem]);

  return (
    <div className="lista">
      <div className="stats">
        <div className="stat">
          <span className="stat__rotulo">TOTAL DE PRISÕES</span>
          <strong>{String(prisoes.length).padStart(3, '0')}</strong>
          <span className="stat__rodape"><Archive size={13} /> registros no sistema</span>
        </div>
        <div className="stat">
          <span className="stat__rotulo">REGISTRADAS HOJE</span>
          <strong>{String(totalHoje).padStart(3, '0')}</strong>
          <span className="stat__rodape"><CalendarDays size={13} /> {dataBR()}</span>
        </div>
        <div className="stat">
          <span className="stat__rotulo">ENVIADAS AO DISCORD</span>
          <strong>{String(enviados).padStart(3, '0')}</strong>
          <span className="stat__rodape"><Send size={13} /> {pendentes} aguardando envio</span>
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
            placeholder="Buscar por nome, ID, artigo, agente, unidade..."
            aria-label="Buscar prisões"
          />
          {busca && (
            <button onClick={() => setBusca('')} aria-label="Limpar busca">
              ×
            </button>
          )}
        </div>
        <select value={unidade} onChange={(e) => setUnidade(e.target.value)} aria-label="Filtrar por unidade">
          <option value="">Todas as unidades</option>
          {unidades.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <select value={ordem} onChange={(e) => setOrdem(e.target.value as 'recentes' | 'antigos')} aria-label="Ordenar">
          <option value="recentes">Mais recentes</option>
          <option value="antigos">Mais antigas</option>
        </select>
        <span className="filtros__total">
          {filtradas.length} {filtradas.length === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>

      {filtradas.length === 0 ? (
        <Vazio
          icone={prisoes.length ? <FileSearch size={30} /> : <ShieldAlert size={30} />}
          titulo={prisoes.length ? 'Nenhum registro encontrado' : 'Nenhuma prisão registrada'}
          texto={
            prisoes.length
              ? 'Ajuste a busca ou o filtro de unidade para encontrar a ficha.'
              : 'Preencha a primeira ficha na aba Registrar prisão. Os dados aparecem aqui automaticamente.'
          }
          acao={
            !prisoes.length && (
              <Botao variante="primario" onClick={onNova}>
                Registrar primeira prisão
              </Botao>
            )
          }
        />
      ) : (
        <div className="grade-prisoes">
          {filtradas.map((p) => (
            <button key={p.id} className="cartao-prisao" onClick={() => onAbrir(p)}>
              <div className="cartao-prisao__foto">
                {p.fotos?.[0] ? (
                  <img src={p.fotos[0]} alt={`Foto de ${p.nome}`} />
                ) : (
                  <div className="cartao-prisao__sem-foto"><Fingerprint size={34} /></div>
                )}
                <span className="cartao-prisao__numero">{p.numero}</span>
              </div>
              <div className="cartao-prisao__corpo">
                <div className="cartao-prisao__topo">
                  <span>{diaCurto(p.criadoEm)} · {dataBR(p.criadoEm)} · {horaBR(p.criadoEm)}</span>
                  {p.discordEnviadoEm ? (
                    <Etiqueta claro>DISCORD ✓</Etiqueta>
                  ) : (
                    <Etiqueta>PENDENTE</Etiqueta>
                  )}
                </div>
                <h3>{textoOuTraco(p.nome)}</h3>
                <div className="cartao-prisao__id">ID RP · {textoOuTraco(p.idRp)}</div>
                <div className="cartao-prisao__linhas">
                  <div>
                    <span>ARTIGOS</span>
                    <b>{limitar(textoOuTraco(p.artigos).replace(/\n/g, ' · '), 70)}</b>
                  </div>
                  <div>
                    <span>TEMPO DE PRISÃO</span>
                    <b>{textoOuTraco(p.tempoPrisao)}</b>
                  </div>
                  <div>
                    <span>AGENTE / UNIDADE</span>
                    <b>{limitar(`${textoOuTraco(p.agente)} · ${textoOuTraco(p.unidade)}`, 70)}</b>
                  </div>
                </div>
                <div className="cartao-prisao__rodape">
                  <span>ESCRIVÃO: {textoOuTraco(p.escrivao)}</span>
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
