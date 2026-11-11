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
            <img src="/brasao-pmpr.png" alt="Brasão da Polícia Militar do Paraná" />
          </div>
          <div className="topo__textos">
            <div className="topo__linha">
              <span className="topo__estado">ESTADO DO PARANÁ</span>
              <span className="topo__sep" />
              <span className="topo__rp">AMBIENTE ROLEPLAY</span>
            </div>
            <h1>CORREGEDORIA <span>PM PR</span></h1>
            <p>POLÍCIA MILITAR DO PARANÁ · CANAL DE DENÚNCIAS E OUVIDORIA · RP</p>
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
              <ShieldCheck size={13} /> {total} {total === 1 ? 'DENÚNCIA' : 'DENÚNCIAS'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ Abas --------------------------------- */

const ABAS: { id: AbaId; rotulo: string; descricao: string; icone: ReactNode }[] = [
  { id: 'denunciar', rotulo: 'Fazer denúncia', descricao: 'Protocolar agora', icone: <span>01</span> },
  { id: 'denuncias', rotulo: 'Denúncias', descricao: 'Consultar protocolos', icone: <span>02</span> },
  { id: 'discord', rotulo: 'Canal do Discord', descricao: 'Envio automático', icone: <span>03</span> },
];

export function Navegacao({
  aba,
  onAba,
  total,
  pendentes,
}: {
  aba: AbaId;
  onAba: (id: AbaId) => void;
  total: number;
  pendentes: number;
}) {
  return (
    <nav className="abas" aria-label="Seções do sistema">
      <div className="abas__interno">
        {ABAS.map((item) => {
          const ativo = aba === item.id;
          const badge = item.id === 'denuncias' ? total : item.id === 'discord' ? pendentes : 0;
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
          <span>PM PR</span>
          <b>RP</b>
        </div>
      </div>
    </nav>
  );
}
