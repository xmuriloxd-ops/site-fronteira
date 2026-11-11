import { useEffect, useState } from 'react';
import { Check, Download, FileImage, FileText, Pencil, Printer, Send, Trash2, X } from 'lucide-react';
import type { Prisao } from '../types';
import { carimboCompleto, dataHoraBR } from '../lib/format';
import { gerarCartaz } from '../lib/cartaz';
import type { Cartaz } from '../lib/cartaz';
import { Botao, Modal } from './ui';
import { Ficha } from './Ficha';

interface Props {
  prisao: Prisao;
  enviando: boolean;
  onFechar: () => void;
  onEnviar: () => void;
  onImprimir: () => void;
  onEditar: () => void;
  onExcluir: () => void;
}

export function ModalFicha({ prisao, enviando, onFechar, onEnviar, onImprimir, onEditar, onExcluir }: Props) {
  const [confirmar, setConfirmar] = useState(false);
  const [mostrarCartaz, setMostrarCartaz] = useState(false);
  const [cartaz, setCartaz] = useState<Cartaz | null>(null);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    if (!mostrarCartaz || cartaz) return;
    let vivo = true;
    setGerando(true);
    void gerarCartaz(prisao)
      .then((arte) => {
        if (vivo) setCartaz(arte);
      })
      .finally(() => {
        if (vivo) setGerando(false);
      });
    return () => {
      vivo = false;
    };
  }, [mostrarCartaz, cartaz, prisao]);

  const baixarCartaz = () => {
    if (!cartaz) return;
    const a = document.createElement('a');
    a.href = cartaz.dataUrl;
    a.download = cartaz.nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Modal
      titulo={`Ficha ${prisao.numero}`}
      subtitulo={`${prisao.nome} · ID ${prisao.idRp}`}
      onFechar={onFechar}
      largo
      acoes={
        <>
          <div className="modal__status">
            {prisao.discordEnviadoEm ? (
              <span className="modal__status-ok">
                <Check size={14} /> Cartaz enviado ao Discord em {dataHoraBR(prisao.discordEnviadoEm)}
              </span>
            ) : (
              <span className="modal__status-pendente">Cartaz ainda não enviado ao Discord</span>
            )}
          </div>
          <div className="modal__botoes">
            <Botao variante="primario" pequeno icone={<Send size={15} />} onClick={onEnviar} disabled={enviando}>
              {enviando ? 'ENVIANDO...' : 'Enviar ao Discord'}
            </Botao>
            <Botao
              variante="secundario"
              pequeno
              icone={mostrarCartaz ? <FileText size={15} /> : <FileImage size={15} />}
              onClick={() => setMostrarCartaz((v) => !v)}
            >
              {mostrarCartaz ? 'Ver ficha' : 'Ver cartaz'}
            </Botao>
            {mostrarCartaz && cartaz && (
              <Botao variante="secundario" pequeno icone={<Download size={15} />} onClick={baixarCartaz}>
                Baixar PNG
              </Botao>
            )}
            <Botao variante="secundario" pequeno icone={<Printer size={15} />} onClick={onImprimir}>
              Imprimir
            </Botao>
            <Botao variante="secundario" pequeno icone={<Pencil size={15} />} onClick={onEditar}>
              Editar
            </Botao>
            <Botao variante="perigo" pequeno icone={<Trash2 size={15} />} onClick={() => setConfirmar(true)}>
              Excluir
            </Botao>
          </div>
        </>
      }
    >
      {mostrarCartaz ? (
        <div className="cartaz-na-modal">
          {cartaz ? (
            <img src={cartaz.dataUrl} alt={`Cartaz da ficha ${prisao.numero}`} />
          ) : (
            <div className="preview-carregando">{gerando ? 'Gerando cartaz...' : 'Não foi possível gerar o cartaz.'}</div>
          )}
          <p>Imagem enviada ao canal do Discord · {cartaz ? `${cartaz.largura} × ${cartaz.altura} px` : ''}</p>
        </div>
      ) : (
        <div className="ficha-na-modal">
          <Ficha dados={prisao} />
        </div>
      )}

      {prisao.fotos.length > 1 && !mostrarCartaz && (
        <div className="ficha-fotos-extra">
          <span>ANEXOS FOTOGRÁFICOS</span>
          <div>
            {prisao.fotos.slice(1).map((foto, i) => (
              <img key={`${i}-${foto.slice(-14)}`} src={foto} alt={`Foto adicional ${i + 2}`} />
            ))}
          </div>
        </div>
      )}

      <p className="ficha-rodape-info">
        Registro gerado automaticamente em {carimboCompleto(prisao.criadoEm)} (horário de Brasília).
      </p>

      {confirmar && (
        <div className="confirmar">
          <div>
            <strong>Excluir este registro?</strong>
            <p>A ficha {prisao.numero} será removida permanentemente.</p>
          </div>
          <div className="confirmar__botoes">
            <Botao variante="fantasma" pequeno onClick={() => setConfirmar(false)} icone={<X size={14} />}>
              Cancelar
            </Botao>
            <Botao variante="perigo" pequeno onClick={onExcluir} icone={<Trash2 size={14} />}>
              Excluir
            </Botao>
          </div>
        </div>
      )}
    </Modal>
  );
}
