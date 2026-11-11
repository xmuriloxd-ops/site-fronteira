import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { X } from 'lucide-react';
import { anexarSugestao } from '../data/opcoes';

/* ------------------------------- Botão -------------------------------- */

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo';

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  pequeno?: boolean;
  bloco?: boolean;
  icone?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function Botao({
  variante = 'secundario',
  pequeno = false,
  bloco = false,
  icone,
  className = '',
  children,
  ...resto
}: BotaoProps) {
  const classes = [
    'btn',
    `btn--${variante}`,
    pequeno ? 'btn--sm' : '',
    bloco ? 'btn--bloco' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={classes} {...resto}>
      {icone}
      {children}
    </button>
  );
}

/* ------------------------------- Campo -------------------------------- */

interface CampoProps {
  label: string;
  obrigatorio?: boolean;
  dica?: string;
  className?: string;
  children: ReactNode;
}

export function Campo({ label, obrigatorio, dica, className = '', children }: CampoProps) {
  return (
    <label className={`campo ${className}`}>
      <span className="campo__label">
        {label}
        {obrigatorio && <span className="campo__obrigatorio"> *</span>}
      </span>
      {children}
      {dica && <span className="campo__hint">{dica}</span>}
    </label>
  );
}

export function Entrada(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...resto } = props;
  return <input className={`input ${className}`} {...resto} />;
}

export function AreaTexto(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...resto } = props;
  return <textarea className={`textarea ${className}`} {...resto} />;
}

export function Selecao(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', ...resto } = props;
  return <select className={`select ${className}`} {...resto} />;
}

interface SugestoesProps {
  titulo: string;
  itens: string[];
  valor: string;
  onChange: (novo: string) => void;
  separador?: string;
}

/** Chips clicáveis que acrescentam texto ao campo. */
export function Sugestoes({ titulo, itens, valor, onChange, separador = '\n' }: SugestoesProps) {
  return (
    <div className="sugestoes">
      <span className="sugestoes__titulo">{titulo}</span>
      <div className="chips">
        {itens.map((item) => (
          <button
            key={item}
            type="button"
            className="chip"
            onClick={() => onChange(anexarSugestao(valor, item, separador))}
            title={`Adicionar: ${item}`}
          >
            + {item}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Cartão -------------------------------- */

export function Cartao({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`cartao ${className}`}>{children}</section>;
}

export function SecaoTitulo({
  numero,
  titulo,
  descricao,
  acao,
}: {
  numero?: string;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="secao-titulo">
      <div>
        <div className="secao-titulo__linha">
          {numero && <span className="secao-titulo__numero">{numero}</span>}
          <h2>{titulo}</h2>
        </div>
        {descricao && <p>{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}

export function Etiqueta({ children, claro = false }: { children: ReactNode; claro?: boolean }) {
  return <span className={`etiqueta ${claro ? 'etiqueta--claro' : ''}`}>{children}</span>;
}

/* ------------------------------- Modal -------------------------------- */

export function Modal({
  titulo,
  subtitulo,
  onFechar,
  children,
  acoes,
  largo = false,
}: {
  titulo: string;
  subtitulo?: string;
  onFechar: () => void;
  children: ReactNode;
  acoes?: ReactNode;
  largo?: boolean;
}) {
  return (
    <div className="modal-fundo" role="presentation" onMouseDown={onFechar}>
      <div
        className={`modal ${largo ? 'modal--largo' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal__topo">
          <div>
            <h3>{titulo}</h3>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <button className="modal__fechar" onClick={onFechar} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>
        <div className="modal__corpo">{children}</div>
        {acoes && <footer className="modal__acoes">{acoes}</footer>}
      </div>
    </div>
  );
}

export function Vazio({ icone, titulo, texto, acao }: { icone: ReactNode; titulo: string; texto: string; acao?: ReactNode }) {
  return (
    <div className="vazio">
      <div className="vazio__icone">{icone}</div>
      <h3>{titulo}</h3>
      <p>{texto}</p>
      {acao}
    </div>
  );
}

export function Toast({ mensagem, tipo, onFechar }: { mensagem: string; tipo: 'ok' | 'erro' | 'info'; onFechar: () => void }) {
  return (
    <div className={`toast toast--${tipo}`} role="status">
      <span className="toast__marca" />
      <span>{mensagem}</span>
      <button onClick={onFechar} aria-label="Fechar aviso">
        <X size={15} />
      </button>
    </div>
  );
}
