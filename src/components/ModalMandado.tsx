import { useEffect, useState } from 'react';
import { Check, Download, Edit3, Gavel, Printer, Send, Trash2 } from 'lucide-react';
import type { Mandado } from '../types';
import { STATUS_MANDADO } from '../types';
import { dataHoraBR } from '../lib/format';
import { gerarCartazMandado } from '../lib/cartazMandado';
import { Botao, Etiqueta, Modal } from './ui';

interface Props {
  mandado: Mandado;
  onFechar: () => void;
  onEditar: (m: Mandado) => void;
  onExcluir: (m: Mandado) => void;
  onEnviar: (m: Mandado) => void;
  onImprimir: (dataUrl: string) => void;
  onAviso: (mensagem: string, tipo: 'ok' | 'erro' | 'info') => void;
  enviando: boolean;
}

export function ModalMandado({
  mandado,
  onFechar,
  onEditar,
  onExcluir,
  onEnviar,
  onImprimir,
  onAviso,
  enviando,
}: Props) {
  const [confirmar, setConfirmar] = useState(false);
  const [cartaz, setCartaz] = useState('');
  const [gerando, setGerando] = useState(true);

  useEffect(() => {
    let vivo = true;
    setGerando(true);
    void gerarCartazMandado(mandado)
      .then((c) => {
        if (vivo) setCartaz(c.dataUrl);
      })
      .catch(() => {
        if (vivo) onAviso('Não foi possível gerar o cartaz deste mandado.', 'erro');
      })
      .finally(() => {
        if (vivo) setGerando(false);
      });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mandado.id]);

  const baixar = () => {
    if (!cartaz) return;
    const a = document.createElement('a');
    a.href = cartaz;
    a.download = `cartaz-${mandado.numero}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Modal
      titulo={`Mandado ${mandado.numero}`}
      subtitulo={`${mandado.nome} · ID ${mandado.idRp} · ${STATUS_MANDADO[mandado.status]}`}
      onFechar={onFechar}
      largo
      acoes={
        <>
          <div className="modal__status">
            {mandado.discordEnviadoEm ? (
              <span className="modal__status-ok">
                <Check size={14} /> Cartaz enviado ao Discord em {dataHoraBR(mandado.discordEnviadoEm)}
              </span>
            ) : (
              <span className="modal__status-pendente">Cartaz ainda não enviado ao Discord</span>
            )}
          </div>
          <div className="modal__botoes">
            <Botao variante="primario" pequeno icone={<Send size={15} />} onClick={() => onEnviar(mandado)} disabled={enviando}>
              {enviando ? 'ENVIANDO...' : 'Enviar cartaz ao Discord'}
            </Botao>
            <Botao variante="secundario" pequeno icone={<Download size={15} />} onClick={baixar} disabled={!cartaz}>
              Baixar PNG
            </Botao>
            <Botao variante="fantasma" pequeno icone={<Printer size={15} />} onClick={() => cartaz && onImprimir(cartaz)} disabled={!cartaz}>
              Imprimir
            </Botao>
            <Botao variante="fantasma" pequeno icone={<Edit3 size={15} />} onClick={() => onEditar(mandado)}>
              Editar
            </Botao>
            <Botao variante="perigo" pequeno icone={<Trash2 size={15} />} onClick={() => setConfirmar(true)}>
              Excluir
            </Botao>
          </div>
        </>
      }
    >
      <div className="cartaz-na-modal">
        {cartaz ? (
          <img src={cartaz} alt={`Cartaz do mandado ${mandado.numero}`} />
        ) : (
          <div className="preview-carregando">{gerando ? 'Gerando cartaz PNG...' : 'Cartaz indisponível'}</div>
        )}
        <p>
          <Gavel size={13} /> FORMATO DE CARTAZ · ASSINATURA DA AUTORIDADE · DIA E DATA AUTOMÁTICOS
        </p>
      </div>
      {confirmar && (
        <div className="confirmar">
          <div>
            <strong>Excluir este mandado?</strong>
            <p>O cartaz e o histórico local deste mandado serão removidos. Esta ação não pode ser desfeita.</p>
          </div>
          <div className="confirmar__botoes">
            <Botao variante="fantasma" pequeno onClick={() => setConfirmar(false)}>Cancelar</Botao>
            <Botao variante="perigo" pequeno onClick={() => onExcluir(mandado)}>Confirmar exclusão</Botao>
          </div>
        </div>
      )}
    </Modal>
  );
}
