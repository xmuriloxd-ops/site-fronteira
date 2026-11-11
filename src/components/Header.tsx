import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Radio, ShieldCheck } from 'lucide-react';
import type { AbaId } from '../types';
import { dataBR, diaCurto, horaBR } from '../lib/format';

/* ----------------------------- Cabeçalho ------------------------------ */

export function Header({ modo, total }: { modo: 'carregando' | 'servidor' | 'local'; total: number }) {
  const [agora, setAgora] = useState(() => new Date().toISOString());

  useEffect(() => {
    const id = window.setInterval(() => setAgora(new Date().toISOString()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const rotuloModo =
    modo === 'servidor' ? 'DADOS COMPARTILHADOS' : modo === 'local' ? 'DADOS NESTE NAVEGADOR' : 'CONECTANDO';

  return (
    <header className="topo">
      <div className="topo__interno">
        <div className="topo__identidade">
          <div className="topo__logo">
            <img src="/brasao-pcpr-branco.png" alt="Logo da Polícia Civil do Paraná" />
          </div>
          <div className="topo__textos">
            <div className="topo__linha">
              <span className="topo__estado">ESTADO DO PARANÁ</span>
              <span className="topo__sep" />
              <span className="topo__rp">AMBIENTE ROLEPLAY</span>
            </div>
            <h1>POLÍCIA CIVIL <span>DO PARANÁ</span></h1>
            <p>SISTEMA DE REGISTRO DE PRISÕES E APREENSÕES · PCPR RP</p>
          </div>
        </div>

        <div className="topo__lado">
          <div className="topo__relogio">
            <span className="topo__dia">{diaCurto(agora)}</span>
            <strong>{horaBR(agora)}</strong>
            <span>{dataBR(agora)}</span>
          </div>
          <div className="topo__status">
            <span className={`topo__status-item ${modo === 'carregando' ? 'topo__status-item--fraco' : ''}`}>
              <Radio size={13} /> {rotuloModo}
            </span>
            <span className="topo__status-item">
              <ShieldCheck size={13} /> {total} {total === 1 ? 'REGISTRO' : 'REGISTROS'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ Abas --------------------------------- */

const ABAS: { id: AbaId; rotulo: string; descricao: string; icone: ReactNode }[] = [
  { id: 'registrar', rotulo: 'Registrar prisão', descricao: 'Nova ficha', icone: <span>01</span> },
  { id: 'prisoes', rotulo: 'Prisões registradas', descricao: 'Consultar fichas', icone: <span>02</span> },
  { id: 'mandados', rotulo: 'Mandados de prisão', descricao: 'Expedir e cumprir', icone: <span>03</span> },
  { id: 'discord', rotulo: 'Canal do Discord', descricao: 'Envio automático', icone: <span>04</span> },
];

export function Navegacao({
  aba,
  onAba,
  total,
  pendentes,
  mandadosPendentes,
}: {
  aba: AbaId;
  onAba: (id: AbaId) => void;
  total: number;
  pendentes: number;
  mandadosPendentes: number;
}) {
  return (
    <nav className="abas" aria-label="Seções do sistema">
      <div className="abas__interno">
        {ABAS.map((item) => {
          const ativo = aba === item.id;
          const badge =
            item.id === 'prisoes'
              ? total
              : item.id === 'mandados'
                ? mandadosPendentes
                : item.id === 'discord'
                  ? pendentes
                  : 0;
          return (
            <button
              key={item.id}
              className={`aba ${ativo ? 'aba--ativa' : ''}`}
              onClick={() => onAba(item.id)}
              aria-current={ativo ? 'page' : undefined}
            >
              <span className="aba__numero">{item.icone}</span>
              <span className="aba__textos">
                <strong>{item.rotulo}</strong>
                <small>{item.descricao}</small>
              </span>
              {badge > 0 && <span className="aba__badge">{badge}</span>}
            </button>
          );
        })}
        <div className="abas__selo">
          <span>PCPR</span>
          <b>RP</b>
        </div>
      </div>
    </nav>
  );
}
