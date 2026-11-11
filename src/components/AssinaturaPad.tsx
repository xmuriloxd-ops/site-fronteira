import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Eraser, PenLine } from 'lucide-react';
import { Botao } from './ui';

/**
 * Campo onde o escrivão desenha a assinatura com mouse, touch ou caneta.
 * O resultado é um PNG de fundo transparente que entra na ficha e no cartaz.
 * Se ficar em branco, o cartaz usa o nome do escrivão em caligrafia.
 */
export function AssinaturaPad({
  valor,
  onChange,
  nomeEscrivao,
  rotulo = 'ASSINATURA DO ESCRIVÃO',
}: {
  valor?: string;
  onChange: (dataUrl: string) => void;
  /** Nome usado em caligrafia quando nada é desenhado. */
  nomeEscrivao: string;
  rotulo?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);
  const ultimoEmitido = useRef<string>('');
  const [temTraco, setTemTraco] = useState(Boolean(valor));

  // Configura a tinta uma única vez (o canvas mantém o estado entre renders).
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // O traço que acabou de ser desenhado já está no canvas: não limpar.
    if (valor === ultimoEmitido.current) {
      setTemTraco(Boolean(valor));
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';

    if (!valor) {
      setTemTraco(false);
      return;
    }
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setTemTraco(true);
    };
    img.src = valor;
  }, [valor]);

  const ponto = (evento: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (evento.clientX - rect.left) * (canvas.width / rect.width),
      y: (evento.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const iniciar = (evento: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(evento.pointerId);
    desenhando.current = true;
    const { x, y } = ponto(evento);
    ctx.beginPath();
    ctx.moveTo(x, y);
    // Um ponto isolado também vira assinatura.
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
    setTemTraco(true);
  };

  const mover = (evento: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!desenhando.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = ponto(evento);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const finalizar = () => {
    if (!desenhando.current) return;
    desenhando.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    ultimoEmitido.current = dataUrl;
    onChange(dataUrl);
  };

  const limpar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    ultimoEmitido.current = '';
    setTemTraco(false);
    onChange('');
  };

  return (
    <div className="assinatura">
      <div className="assinatura__cabecalho">
        <span>
          <PenLine size={14} /> {rotulo}
        </span>
        <Botao variante="fantasma" pequeno onClick={limpar} icone={<Eraser size={13} />} type="button">
          Limpar
        </Botao>
      </div>
      <div className="assinatura__area">
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          onPointerDown={iniciar}
          onPointerMove={mover}
          onPointerUp={finalizar}
          onPointerCancel={finalizar}
          onPointerLeave={finalizar}
          aria-label="Área para desenhar a assinatura do escrivão"
        />
        {!temTraco && <span className="assinatura__dica">Desenhe aqui com o mouse ou o dedo</span>}
      </div>
      <p className="assinatura__nota">
        {temTraco
          ? 'Assinatura capturada — ela aparece na ficha e no cartaz enviado ao Discord.'
          : `Sem desenho, o cartaz usa o nome “${nomeEscrivao.trim() || 'do escrivão'}” em caligrafia sobre a linha de assinatura.`}
      </p>
    </div>
  );
}
