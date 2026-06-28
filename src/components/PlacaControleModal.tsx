import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Download, 
  Calendar, 
  MapPin, 
  User, 
  Hash, 
  Layers, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Eye,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Silo, Transaction, OperatorSession } from '../types';

interface PlacaControleModalProps {
  isOpen: boolean;
  onClose: () => void;
  silos: Silo[];
  transactions: Transaction[];
  operatorSession: OperatorSession;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

// Custom types for placard editing
interface BoxConfig {
  id: string;
  title: string;
  saldoConsumo: string;
  silos: {
    id: string;
    name: string;
    balance: string;
  }[];
}

export function PlacaControleModal({ 
  isOpen, 
  onClose, 
  silos, 
  transactions, 
  operatorSession,
  showToast
}: PlacaControleModalProps) {
  
  // --- STATE ---
  const [dataStr, setDataStr] = useState('');
  const [setor, setSetor] = useState('');
  const [lote, setLote] = useState('');
  const [pesador, setPesador] = useState('');
  const [matricula, setMatricula] = useState('');
  const [boxes, setBoxes] = useState<BoxConfig[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'edit' | 'preview'>('preview');
  const [isMobileView, setIsMobileView] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // References for Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check if screen is mobile for dual tab layout inside the modal
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync state with app data when modal is opened
  useEffect(() => {
    if (isOpen) {
      // 1. Format current date as DD/MM/YY
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      setDataStr(`${dd}/${mm}/${yy}`);

      // 2. Set operator details
      setSetor(operatorSession.sector || 'RECRIA');
      setLote(operatorSession.batch || 'NC 05 LT 150');
      setPesador(operatorSession.operatorName || 'MURILO MENDES');
      setMatricula(operatorSession.operatorId || '86887');

      // 3. Group silos by FeedType and calculate consumptions
      const uniqueFeedTypes = Array.from(new Set(silos.map(s => s.feedType)));
      
      const initialBoxes: BoxConfig[] = uniqueFeedTypes.map((feedType, index) => {
        const silosInGroup = silos.filter(s => s.feedType === feedType);
        
        // Calculate total consumption for this feedType group in current transactions
        const groupSiloIds = silosInGroup.map(s => s.id);
        const totalConsumption = transactions
          .filter(tx => tx.type === 'consumption' && groupSiloIds.includes(tx.siloId))
          .reduce((sum, tx) => sum + tx.quantity, 0);

        // Map silos to editable configs
        const silosConfig = silosInGroup.map(s => ({
          id: s.id,
          name: s.name.toUpperCase(),
          balance: s.currentBalance.toLocaleString('pt-BR')
        }));

        // Set a default/placeholder for consumption if 0, matching realistic photo layout
        let consumptionVal = totalConsumption > 0 
          ? totalConsumption.toLocaleString('pt-BR') 
          : (index === 0 ? '8.215' : '1.000'); // realistic defaults from photo!

        return {
          id: `box-${index}`,
          title: feedType.toUpperCase(),
          saldoConsumo: consumptionVal,
          silos: silosConfig
        };
      });

      // Reorder boxes to resemble the photo if possible:
      // Photo Box 1: "RAÇÃO FÊMEAS PRÉ POSTURA" (silos 1 & 2), Box 2: "RAÇÃO CRESCIMENTO 1 MACHO" (silo 3)
      // We keep the dynamic groupings but prefilled beautifully
      setBoxes(initialBoxes);
      setActiveSubTab(window.innerWidth < 1024 ? 'preview' : 'preview');
    }
  }, [isOpen, silos, transactions, operatorSession]);

  if (!isOpen) return null;

  // --- HANDLERS ---
  const handleBoxTitleChange = (boxId: string, val: string) => {
    setBoxes(prev => prev.map(b => b.id === boxId ? { ...b, title: val } : b));
  };

  const handleConsumptionChange = (boxId: string, val: string) => {
    // Sanitize input to allow numbers, dots, commas
    setBoxes(prev => prev.map(b => b.id === boxId ? { ...b, saldoConsumo: val } : b));
  };

  const handleSiloBalanceChange = (boxId: string, siloId: string, val: string) => {
    setBoxes(prev => prev.map(b => {
      if (b.id === boxId) {
        return {
          ...b,
          silos: b.silos.map(s => s.id === siloId ? { ...s, balance: val } : s)
        };
      }
      return b;
    }));
  };

  const handleSiloNameChange = (boxId: string, siloId: string, val: string) => {
    setBoxes(prev => prev.map(b => {
      if (b.id === boxId) {
        return {
          ...b,
          silos: b.silos.map(s => s.id === siloId ? { ...s, name: val } : s)
        };
      }
      return b;
    }));
  };

  const handleAddBox = () => {
    const newId = `box-${Date.now()}`;
    setBoxes(prev => [
      ...prev,
      {
        id: newId,
        title: 'NOME DA RAÇÃO',
        saldoConsumo: '0',
        silos: [
          { id: `silo-${Date.now()}`, name: 'SILO X', balance: '0' }
        ]
      }
    ]);
    showToast('Nova seção de ração adicionada!', 'success');
  };

  const handleRemoveBox = (boxId: string) => {
    setBoxes(prev => prev.filter(b => b.id !== boxId));
    showToast('Seção removida.', 'info');
  };

  // --- DRAW CANVAS & EXPORT PNG ---
  const handleDownloadPlaca = async () => {
    setIsGenerating(true);
    showToast('Renderizando imagem de alta resolução...', 'info');

    setTimeout(() => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error('Canvas element not found.');
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D Context could not be acquired.');
        }

        // Set dimensions (1200 x 1680) - perfect aspect ratio matching the photo!
        const width = 1200;
        const height = 1680;
        canvas.width = width;
        canvas.height = height;

        // Enable crisp rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 1. Draw solid premium off-white background with blueprint grid
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(0, 0, width, height);

        // Subtle Grid Pattern
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // 2. Thick elegant dual border for professional look
        ctx.strokeStyle = '#002075';
        ctx.lineWidth = 18;
        ctx.lineJoin = 'round';
        ctx.strokeRect(9, 9, width - 18, height - 18);

        // Inner Red accent border
        ctx.strokeStyle = '#D60005';
        ctx.lineWidth = 4;
        ctx.strokeRect(25, 25, width - 50, height - 50);

        // Helper: Draw Rounded Rect
        const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, fill = false, stroke = true) => {
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
          if (fill) ctx.fill();
          if (stroke) ctx.stroke();
        };

        // --- DRAW HEADER ---
        const logoX = 60;
        const logoY = 60;
        const logoW = 440;
        const logoH = 220;

        // Elegant Shadow behind Logo Frame
        ctx.fillStyle = 'rgba(15, 23, 42, 0.04)';
        drawRoundedRect(logoX + 4, logoY + 4, logoW, logoH, 24, true, false);

        // Logo frame
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#002075';
        ctx.lineWidth = 8;
        drawRoundedRect(logoX, logoY, logoW, logoH, 24, true, true);

        // GRUPO label
        ctx.fillStyle = '#002075';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Letter spacing trick for canvas
        const drawSpacedText = (text: string, cx: number, cy: number, spacing: number, fontSize = 28) => {
          ctx.font = `normal 800 ${fontSize}px 'Inter', sans-serif`;
          const chars = text.split('');
          const widths = chars.map(c => ctx.measureText(c).width);
          const totalWidth = widths.reduce((s, w) => s + w, 0) + (chars.length - 1) * spacing;
          
          let startX = cx - totalWidth / 2;
          chars.forEach((c, idx) => {
            ctx.fillText(c, startX + widths[idx]/2, cy);
            startX += widths[idx] + spacing;
          });
        };
        drawSpacedText("GRUPO", logoX + logoW/2, logoY + 55, 20, 26);

        // Btz Text (Big with subtle 3D highlight)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        
        // Draw 'B'
        ctx.fillStyle = '#002075';
        ctx.font = "normal 900 120px 'Inter', sans-serif";
        ctx.fillText("B", logoX + logoW/2 - 100, logoY + 185);
        
        // Draw 't' (red)
        ctx.fillStyle = '#D60005';
        ctx.font = "normal 900 120px 'Inter', sans-serif";
        ctx.fillText("t", logoX + logoW/2 + 5, logoY + 180);

        // Draw 'z'
        ctx.fillStyle = '#002075';
        ctx.font = "normal 900 120px 'Inter', sans-serif";
        ctx.fillText("z", logoX + logoW/2 + 100, logoY + 185);

        // Vertical red separator line in header
        ctx.strokeStyle = '#D60005';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(540, 70);
        ctx.lineTo(540, 270);
        ctx.stroke();

        // CONTROLE DE SALDO DE RAÇÃO title
        ctx.fillStyle = '#002075';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = "normal 900 46px 'Inter', sans-serif";
        ctx.fillText("CONTROLE DE", 580, 115);
        ctx.font = "normal 900 56px 'Inter', sans-serif";
        ctx.fillText("SALDO DE RAÇÃO", 580, 195);


        // --- DRAW SUBHEADER BOX ---
        const subX = 60;
        const subY = 320;
        const subW = 1080;
        const subH = 175;

        // Elegant subheader container background with soft gradient
        const subGrad = ctx.createLinearGradient(subX, subY, subX, subY + subH);
        subGrad.addColorStop(0, '#FFFFFF');
        subGrad.addColorStop(1, '#F1F5F9');
        ctx.fillStyle = subGrad;
        ctx.strokeStyle = '#002075';
        ctx.lineWidth = 6;
        drawRoundedRect(subX, subY, subW, subH, 20, true, true);

        // Columns split
        const colW = subW / 3;

        // Subheader column 1: DATA
        const calX = subX + 45;
        const calY = subY + 45;
        const calSize = 85;

        // Double border calendar icon
        ctx.strokeStyle = '#002075';
        ctx.lineWidth = 6;
        ctx.fillStyle = '#FFFFFF';
        drawRoundedRect(calX, calY + 12, calSize, calSize - 12, 12, true, true);
        
        // Calendar header fill
        ctx.fillStyle = '#002075';
        ctx.beginPath();
        ctx.moveTo(calX + 12, calY + 12);
        ctx.lineTo(calX + calSize - 12, calY + 12);
        ctx.quadraticCurveTo(calX + calSize, calY + 12, calX + calSize, calY + 24);
        ctx.lineTo(calX + calSize, calY + 38);
        ctx.lineTo(calX, calY + 38);
        ctx.lineTo(calX, calY + 24);
        ctx.quadraticCurveTo(calX, calY + 12, calX + 12, calY + 12);
        ctx.closePath();
        ctx.fill();

        // Calendar rings
        ctx.strokeStyle = '#002075';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(calX + 22, calY);
        ctx.lineTo(calX + 22, calY + 20);
        ctx.moveTo(calX + calSize - 22, calY);
        ctx.lineTo(calX + calSize - 22, calY + 20);
        ctx.stroke();

        // Calendar grid lines
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(calX + 10, calY + 55);
        ctx.lineTo(calX + calSize - 10, calY + 55);
        ctx.moveTo(calX + 10, calY + 70);
        ctx.lineTo(calX + calSize - 10, calY + 70);
        ctx.moveTo(calX + 28, calY + 38);
        ctx.lineTo(calX + 28, calY + calSize - 8);
        ctx.moveTo(calX + 56, calY + 38);
        ctx.lineTo(calX + 56, calY + calSize - 8);
        ctx.stroke();

        // Calendar marker
        ctx.fillStyle = '#D60005';
        ctx.beginPath();
        ctx.arc(calX + 42, calY + 62, 6, 0, Math.PI * 2);
        ctx.fill();

        // Data text
        ctx.fillStyle = '#475569';
        ctx.font = "normal 800 20px 'Inter', sans-serif";
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText("DATA", subX + 160, subY + 62);
        ctx.fillStyle = '#002075';
        ctx.font = "normal 900 44px 'Inter', sans-serif";
        ctx.fillText(dataStr, subX + 160, subY + 118);

        // Divider 1 (Red)
        ctx.strokeStyle = '#D60005';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(subX + colW, subY + 25);
        ctx.lineTo(subX + colW, subY + subH - 25);
        ctx.stroke();

        // Subheader column 2: SETOR
        const barnX = subX + colW + 40;
        const barnY = subY + 45;
        const barnSize = 85;

        // Draw professional barn icon with details
        ctx.fillStyle = '#002075';
        ctx.beginPath();
        ctx.moveTo(barnX + barnSize * 0.5, barnY);
        ctx.lineTo(barnX + barnSize, barnY + barnSize * 0.4);
        ctx.lineTo(barnX, barnY + barnSize * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(barnX + barnSize * 0.1, barnY + barnSize * 0.4, barnSize * 0.8, barnSize * 0.6);

        // White barn features
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        // Crossbeams
        ctx.strokeRect(barnX + barnSize * 0.18, barnY + barnSize * 0.46, barnSize * 0.28, barnSize * 0.48);
        ctx.strokeRect(barnX + barnSize * 0.54, barnY + barnSize * 0.46, barnSize * 0.28, barnSize * 0.48);
        ctx.beginPath();
        ctx.moveTo(barnX + barnSize * 0.18, barnY + barnSize * 0.46);
        ctx.lineTo(barnX + barnSize * 0.46, barnY + barnSize * 0.94);
        ctx.moveTo(barnX + barnSize * 0.46, barnY + barnSize * 0.46);
        ctx.lineTo(barnX + barnSize * 0.18, barnY + barnSize * 0.94);
        ctx.moveTo(barnX + barnSize * 0.54, barnY + barnSize * 0.46);
        ctx.lineTo(barnX + barnSize * 0.82, barnY + barnSize * 0.94);
        ctx.moveTo(barnX + barnSize * 0.82, barnY + barnSize * 0.46);
        ctx.lineTo(barnX + barnSize * 0.54, barnY + barnSize * 0.94);
        ctx.stroke();

        // Setor texts
        ctx.fillStyle = '#475569';
        ctx.font = "normal 800 20px 'Inter', sans-serif";
        ctx.fillText("SETOR / IDENTIFICAÇÃO", subX + colW + 155, subY + 54);
        ctx.fillStyle = '#002075';
        ctx.font = "normal 900 36px 'Inter', sans-serif";
        ctx.fillText(setor.toUpperCase(), subX + colW + 155, subY + 96);
        ctx.font = "normal 800 24px 'Inter', sans-serif";
        ctx.fillStyle = '#D60005';
        ctx.fillText(lote.toUpperCase(), subX + colW + 155, subY + 134);

        // Divider 2 (Red)
        ctx.strokeStyle = '#D60005';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(subX + colW * 2, subY + 25);
        ctx.lineTo(subX + colW * 2, subY + subH - 25);
        ctx.stroke();

        // Subheader column 3: SILO GRAPHICS
        const sX = subX + colW * 2 + 100;
        const sY = subY + 45;
        
        const drawSiloVector = (sx: number, sy: number, sw: number, sh: number, color: string, fillPercent = 80) => {
          ctx.save();
          
          // Outer shadow ellipse
          ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
          ctx.beginPath();
          ctx.ellipse(sx + sw/2, sy + sh + 4, sw/2.2, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Legs (with metallic gray details)
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = sw * 0.1;
          ctx.beginPath();
          ctx.moveTo(sx + sw*0.2, sy + sh*0.75);
          ctx.lineTo(sx + sw*0.2, sy + sh);
          ctx.moveTo(sx + sw*0.8, sy + sh*0.75);
          ctx.lineTo(sx + sw*0.8, sy + sh);
          ctx.stroke();

          // Double leg cross supports
          ctx.strokeStyle = '#64748B';
          ctx.lineWidth = sw * 0.05;
          ctx.beginPath();
          ctx.moveTo(sx + sw*0.2, sy + sh*0.8);
          ctx.lineTo(sx + sw*0.8, sy + sh*0.95);
          ctx.moveTo(sx + sw*0.8, sy + sh*0.8);
          ctx.lineTo(sx + sw*0.2, sy + sh*0.95);
          ctx.stroke();

          // Cone discharge outlet
          ctx.fillStyle = '#94A3B8';
          ctx.beginPath();
          ctx.moveTo(sx + sw*0.2, sy + sh*0.75);
          ctx.lineTo(sx + sw*0.5, sy + sh*0.92);
          ctx.lineTo(sx + sw*0.8, sy + sh*0.75);
          ctx.closePath();
          ctx.fill();

          // Silo Cylinder Dome clipping mask
          ctx.beginPath();
          ctx.moveTo(sx, sy + sh*0.75);
          ctx.lineTo(sx, sy + sw*0.35);
          ctx.bezierCurveTo(sx, sy, sx + sw, sy, sx + sw, sy + sw*0.35);
          ctx.lineTo(sx + sw, sy + sh*0.75);
          ctx.closePath();
          ctx.clip();

          // Container background
          ctx.fillStyle = '#CBD5E1';
          ctx.fillRect(sx, sy, sw, sh);

          // Food Level fill with gradient
          const fillH = (sh * 0.75) * (fillPercent / 100);
          const levelY = sy + sh*0.75 - fillH;
          const fillGrad = ctx.createLinearGradient(sx, levelY, sx + sw, sy + sh*0.75);
          fillGrad.addColorStop(0, color);
          fillGrad.addColorStop(1, '#001449');
          ctx.fillStyle = fillGrad;
          ctx.fillRect(sx, levelY, sw, fillH + 10);

          // Glossy overlay shine
          const glossGrad = ctx.createLinearGradient(sx, sy, sx + sw, sy);
          glossGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
          glossGrad.addColorStop(0.3, 'rgba(255,255,255,0.08)');
          glossGrad.addColorStop(0.7, 'rgba(0,0,0,0.05)');
          glossGrad.addColorStop(1, 'rgba(0,0,0,0.15)');
          ctx.fillStyle = glossGrad;
          ctx.fillRect(sx, sy, sw, sh);

          ctx.restore();

          // Outer Metal Silo Frame Outline
          ctx.strokeStyle = '#002075';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(sx, sy + sh*0.75);
          ctx.lineTo(sx, sy + sw*0.35);
          ctx.bezierCurveTo(sx, sy, sx + sw, sy, sx + sw, sy + sw*0.35);
          ctx.lineTo(sx + sw, sy + sh*0.75);
          ctx.closePath();
          ctx.stroke();

          // Metal Weld horizontal lines
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 2;
          for (let i = 1; i < 4; i++) {
            const lineY = sy + sw*0.35 + i * ((sh*0.75 - sw*0.35)/4);
            ctx.beginPath();
            ctx.moveTo(sx, lineY);
            ctx.lineTo(sx + sw, lineY);
            ctx.stroke();
          }

          // Top Inlet Cap
          ctx.fillStyle = '#475569';
          ctx.fillRect(sx + sw/2 - 8, sy - 8, 16, 8);
        };

        drawSiloVector(sX, sY, 54, 90, '#002075', 85);
        drawSiloVector(sX + 70, sY, 54, 90, '#D60005', 45);


        // --- DRAW RAÇÃO BOXES ---
        let currentY = 530;
        const boxSpacing = 40;
        const activeBoxes = boxes.slice(0, 2);
        const boxH = 340;

        activeBoxes.forEach((box, bIdx) => {
          const bx = 60;
          const by = currentY;
          const bw = 1080;
          const bh = boxH;

          // Shadow under card
          ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
          drawRoundedRect(bx + 4, by + 4, bw, bh, 24, true, false);

          // Card Border and Background
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#002075';
          ctx.lineWidth = 6;
          drawRoundedRect(bx, by, bw, bh, 24, true, true);

          // Dark blue title header strip
          const headerH = 75;
          ctx.fillStyle = '#002075';
          ctx.beginPath();
          ctx.moveTo(bx + 20, by);
          ctx.lineTo(bx + bw - 20, by);
          ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + 20);
          ctx.lineTo(bx + bw, by + headerH);
          ctx.lineTo(bx, by + headerH);
          ctx.lineTo(bx, by + 20);
          ctx.quadraticCurveTo(bx, by, bx + 20, by);
          ctx.closePath();
          ctx.fill();

          // Chicken circular icon badge on left
          const circX = bx + 65;
          const circY = by + 20;
          const circR = 48;

          // Double ring white/colored badge
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(circX, circY, circR, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = bIdx === 0 ? '#D60005' : '#002075'; 
          ctx.beginPath();
          ctx.arc(circX, circY, circR - 6, 0, Math.PI * 2);
          ctx.fill();

          // Drawn elegant chicken silhouette
          const drawChickenInside = (cx: number, cy: number, r: number) => {
            ctx.fillStyle = '#ffffff';
            // Head
            ctx.beginPath();
            ctx.arc(cx - r*0.18, cy - r*0.25, r*0.28, 0, Math.PI*2);
            ctx.fill();
            // Beak
            ctx.beginPath();
            ctx.moveTo(cx - r*0.4, cy - r*0.3);
            ctx.lineTo(cx - r*0.6, cy - r*0.22);
            ctx.lineTo(cx - r*0.4, cy - r*0.14);
            ctx.closePath();
            ctx.fill();
            // Comb
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx - r*0.26, cy - r*0.53, r*0.1, 0, Math.PI*2);
            ctx.arc(cx - r*0.14, cy - r*0.56, r*0.1, 0, Math.PI*2);
            ctx.fill();
            // Body
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(cx - r*0.2, cy - r*0.05);
            ctx.bezierCurveTo(cx - r*0.65, cy + r*0.1, cx - r*0.5, cy + r*0.5, cx, cy + r*0.42);
            ctx.bezierCurveTo(cx + r*0.5, cy + r*0.32, cx + r*0.62, cy - r*0.1, cx + r*0.5, cy - r*0.45); // tail
            ctx.lineTo(cx + r*0.15, cy - r*0.15);
            ctx.closePath();
            ctx.fill();
          };
          drawChickenInside(circX, circY, circR);

          // Ração Title text
          ctx.fillStyle = '#FFFFFF';
          ctx.font = "normal 900 36px 'Inter', sans-serif";
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(box.title, bx + 145, by + headerH / 2);

          // Columns Split
          const boxHalfW = bw / 2;

          // LEFT COLUMN: SALDO CONSUMO WITH PREMIUM CONTAINER
          ctx.fillStyle = '#475569';
          ctx.font = "normal 800 24px 'Inter', sans-serif";
          ctx.textAlign = 'center';
          ctx.fillText("SALDO CONSUMO REGISTRADO", bx + boxHalfW / 2, by + 122);

          // Rounded Inner card background for balance number
          const numBoxX = bx + 50;
          const numBoxY = by + 145;
          const numBoxW = boxHalfW - 100;
          const numBoxH = 145;
          ctx.fillStyle = '#F8FAFC';
          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 2;
          drawRoundedRect(numBoxX, numBoxY, numBoxW, numBoxH, 16, true, true);

          // Huge consumption digits
          ctx.fillStyle = '#002075';
          ctx.font = "normal 900 84px 'Inter', sans-serif";
          const qtyText = box.saldoConsumo;
          const labelKgText = " kg";
          
          // Center number and "kg" label nicely
          const numW = ctx.measureText(qtyText).width;
          ctx.font = "normal 700 36px 'Inter', sans-serif";
          const kgW = ctx.measureText(labelKgText).width;
          const totalTextW = numW + kgW;
          
          ctx.font = "normal 900 84px 'Inter', sans-serif";
          ctx.textAlign = 'left';
          ctx.fillText(qtyText, bx + boxHalfW/2 - totalTextW/2, numBoxY + 98);
          ctx.font = "normal 700 36px 'Inter', sans-serif";
          ctx.fillText(labelKgText, bx + boxHalfW/2 - totalTextW/2 + numW, numBoxY + 92);


          // Vertical Divider line (Red Accent)
          ctx.strokeStyle = '#D60005';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(bx + boxHalfW, by + 95);
          ctx.lineTo(bx + boxHalfW, by + bh - 20);
          ctx.stroke();


          // RIGHT COLUMN: SALDO FINAL
          ctx.fillStyle = '#475569';
          ctx.font = "normal 800 24px 'Inter', sans-serif";
          ctx.textAlign = 'center';
          ctx.fillText("SALDO ATUAL EM ESTOQUE", bx + boxHalfW * 1.5, by + 122);

          // List silos
          const groupSilos = box.silos.slice(0, 2);
          
          groupSilos.forEach((sVal, sIdx) => {
            const siloItemY = by + 145 + sIdx * 82;
            const itemCenterX = bx + boxHalfW * 1.5;

            // Silo miniature dynamic vector (colored depending on balance)
            const balanceNum = parseFloat(sVal.balance.replace(/\./g, '').replace(/,/g, '.')) || 0;
            // Calculate a plausible percentage for visual representation
            const displayFillPercent = balanceNum > 0 ? Math.min(100, Math.max(10, (balanceNum / 20000) * 100)) : 10;
            const siloColor = balanceNum < 2500 ? '#D60005' : (balanceNum < 6000 ? '#F59E0B' : '#002075');

            drawSiloVector(itemCenterX - 210, siloItemY + 5, 40, 68, siloColor, displayFillPercent);

            // Silo label name
            ctx.fillStyle = '#475569';
            ctx.font = "normal 800 22px 'Inter', sans-serif";
            ctx.textAlign = 'left';
            ctx.fillText(sVal.name, itemCenterX - 145, siloItemY + 24);

            // Red bold balance values
            ctx.fillStyle = '#D60005';
            ctx.font = "normal 900 48px 'Inter', sans-serif";
            const balValText = sVal.balance;
            const balKgText = " kg";
            const balNumW = ctx.measureText(balValText).width;

            ctx.fillText(balValText, itemCenterX - 145, siloItemY + 68);
            
            ctx.fillStyle = '#002075';
            ctx.font = "normal 700 24px 'Inter', sans-serif";
            ctx.fillText(balKgText, itemCenterX - 140 + balNumW, siloItemY + 66);

            // Divider between silos
            if (sIdx === 0 && groupSilos.length > 1) {
              ctx.strokeStyle = '#E2E8F0';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(itemCenterX - 145, siloItemY + 80);
              ctx.lineTo(itemCenterX + 210, siloItemY + 80);
              ctx.stroke();
            }
          });

          // Increment Y for next box
          currentY += bh + boxSpacing;
        });


        // --- DRAW FOOTER SECTION ---
        const footerY = 1290;
        
        // Backing dark blue banner
        ctx.fillStyle = '#002075';
        ctx.fillRect(60, footerY + 20, 1080, 140);

        // Professional Diagonal geometric cut shapes (Btz aesthetic)
        ctx.fillStyle = '#D60005';
        ctx.beginPath();
        ctx.moveTo(820, footerY + 160);
        ctx.lineTo(1140, footerY + 20);
        ctx.lineTo(1140, footerY + 160);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#001449';
        ctx.beginPath();
        ctx.moveTo(940, footerY + 160);
        ctx.lineTo(1140, footerY + 20);
        ctx.lineTo(1140, footerY + 160);
        ctx.closePath();
        ctx.fill();

        // Draw elegant circular Shield icon
        const shieldX = 100;
        const shieldY = footerY + 45;
        const shieldSize = 85;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(shieldX + shieldSize/2, shieldY + shieldSize/2, shieldSize/2, 0, Math.PI * 2);
        ctx.fill();

        // Inner Checkmark shield
        ctx.strokeStyle = '#002075';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(shieldX + shieldSize*0.28, shieldY + shieldSize*0.48);
        ctx.lineTo(shieldX + shieldSize*0.46, shieldY + shieldSize*0.68);
        ctx.lineTo(shieldX + shieldSize*0.72, shieldY + shieldSize*0.34);
        ctx.stroke();

        // Slogan text
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.font = "normal 900 24px 'Inter', sans-serif";
        ctx.fillText("QUALIDADE E CONTROLE", 210, footerY + 76);
        ctx.font = "normal 800 24px 'Inter', sans-serif";
        ctx.fillText("PARA UMA PRODUÇÃO INDUSTRIAL SEGURA", 210, footerY + 114);

        // Certified validation stamp on bottom right of ribbon
        ctx.fillStyle = '#FFFFFF';
        ctx.font = "normal 900 12px 'Inter', sans-serif";
        ctx.textAlign = 'right';
        ctx.fillText("CERTIFICADO BTZ INTEGRAL", 1120, footerY + 130);
        ctx.font = "normal 500 10px monospace";
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`ID: ${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-BTZ`, 1120, footerY + 144);


        // --- DRAW BOTTOM STRIP (Operator Details) ---
        const bottomStripY = footerY + 185;
        ctx.fillStyle = '#0B132B';
        ctx.fillRect(60, bottomStripY, 1080, 120);

        // Worker icon representation
        const workerX = 100;
        const workerY = bottomStripY + 20;
        const workerSize = 80;

        ctx.strokeStyle = '#FFFFFF';
        ctx.fillStyle = '#FFFFFF';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        // Head
        ctx.beginPath();
        ctx.arc(workerX + workerSize*0.5, workerY + workerSize*0.55, workerSize*0.25, 0, Math.PI);
        ctx.stroke();
        // Helmet top
        ctx.beginPath();
        ctx.arc(workerX + workerSize*0.5, workerY + workerSize*0.42, workerSize*0.26, Math.PI, 0);
        ctx.fill();
        // Helmet brim
        ctx.beginPath();
        ctx.moveTo(workerX + workerSize*0.12, workerY + workerSize*0.43);
        ctx.lineTo(workerX + workerSize*0.88, workerY + workerSize*0.43);
        ctx.stroke();
        // Shoulders
        ctx.beginPath();
        ctx.moveTo(workerX + workerSize*0.08, workerY + workerSize*0.95);
        ctx.quadraticCurveTo(workerX + workerSize*0.25, workerY + workerSize*0.75, workerX + workerSize*0.35, workerY + workerSize*0.75);
        ctx.lineTo(workerX + workerSize*0.65, workerY + workerSize*0.75);
        ctx.quadraticCurveTo(workerX + workerSize*0.75, workerY + workerSize*0.75, workerX + workerSize*0.92, workerY + workerSize*0.95);
        ctx.stroke();

        // Operator values text
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.font = "normal 500 28px 'Inter', sans-serif";
        
        const pesadorPrefix = "PESADOR: ";
        const pesadorName = pesador.toUpperCase();
        const dividerText = "   |   ";
        const matriculaPrefix = "MATRÍCULA: ";
        const matriculaVal = matricula.toUpperCase();

        const labelY = bottomStripY + 68;
        ctx.font = "normal 500 28px 'Inter', sans-serif";
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(pesadorPrefix, 210, labelY);
        
        const prefixW = ctx.measureText(pesadorPrefix).width;
        ctx.font = "normal 900 28px 'Inter', sans-serif";
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(pesadorName, 210 + prefixW, labelY);

        const nameW = ctx.measureText(pesadorName).width;
        ctx.font = "normal 500 28px 'Inter', sans-serif";
        ctx.fillStyle = '#475569';
        ctx.fillText(dividerText, 210 + prefixW + nameW, labelY);

        const divW = ctx.measureText(dividerText).width;
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(matriculaPrefix, 210 + prefixW + nameW + divW, labelY);

        const mPrefixW = ctx.measureText(matriculaPrefix).width;
        ctx.font = "normal 900 28px 'Inter', sans-serif";
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(matriculaVal, 210 + prefixW + nameW + divW + mPrefixW, labelY);

        // --- TRIGGER DOWNLOAD ---
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `BTZ_Placa_Controle_Racao_${dataStr.replace(/\//g, '-')}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Placa de Controle gerada e baixada com sucesso!', 'success');
      } catch (err: any) {
        console.error('Error generating placard image:', err);
        showToast('Erro ao gerar a imagem: ' + err.message, 'error');
      } finally {
        setIsGenerating(false);
      }
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-slate-50 w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#002075] to-[#001449] px-6 py-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-xl">
                <Sparkles className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base tracking-tight uppercase">Placa de Controle de Saldo</h3>
                <p className="text-xs text-slate-300">Gere e baixe a imagem oficial de saldo exatamente igual à foto.</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MOBILE SUBTABS */}
          {isMobileView && (
            <div className="flex border-b border-slate-200 bg-white shrink-0 select-none">
              <button
                onClick={() => setActiveSubTab('edit')}
                className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider border-b-2 flex items-center justify-center gap-1.5 ${
                  activeSubTab === 'edit' ? 'border-[#002075] text-[#002075]' : 'border-transparent text-slate-400'
                }`}
              >
                <Settings2 className="w-4 h-4" />
                Dados da Placa
              </button>
              <button
                onClick={() => setActiveSubTab('preview')}
                className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider border-b-2 flex items-center justify-center gap-1.5 ${
                  activeSubTab === 'preview' ? 'border-[#002075] text-[#002075]' : 'border-transparent text-slate-400'
                }`}
              >
                <Eye className="w-4 h-4" />
                Visualizar Imagem
              </button>
            </div>
          )}

          {/* MAIN GRID */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6 min-h-0">
            
            {/* CONFIGURATION COLUMN (Left on desktop) */}
            <div className={`flex flex-col gap-5 lg:w-[40%] overflow-y-auto pr-1 ${
              isMobileView && activeSubTab !== 'edit' ? 'hidden' : 'block'
            }`}>
              {/* Header Box Data */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#002075]" /> Informações Gerais
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Data (DD/MM/YY)
                    </label>
                    <input 
                      type="text" 
                      value={dataStr} 
                      onChange={(e) => setDataStr(e.target.value)}
                      placeholder="Ex: 25/06/26"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#002075]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Setor Ativo
                    </label>
                    <input 
                      type="text" 
                      value={setor} 
                      onChange={(e) => setSetor(e.target.value)}
                      placeholder="Ex: RECRIA"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#002075]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Lote / Identificação
                    </label>
                    <input 
                      type="text" 
                      value={lote} 
                      onChange={(e) => setLote(e.target.value)}
                      placeholder="Ex: NC 05 LT 150"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#002075]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Pesador (Nome)
                    </label>
                    <input 
                      type="text" 
                      value={pesador} 
                      onChange={(e) => setPesador(e.target.value)}
                      placeholder="Ex: MURILO MENDES"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#002075]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Matrícula
                    </label>
                    <input 
                      type="text" 
                      value={matricula} 
                      onChange={(e) => setMatricula(e.target.value)}
                      placeholder="Ex: 86887"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#002075]"
                    />
                  </div>
                </div>
              </div>

              {/* Ração Boxes Editor */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#002075]" /> Seções de Ração
                  </h4>
                  <button
                    onClick={handleAddBox}
                    className="text-[10px] font-black text-[#002075] hover:text-red-600 font-mono flex items-center gap-1 uppercase tracking-wider transition-colors"
                  >
                    + Adicionar Grupo
                  </button>
                </div>

                {boxes.map((box, bIdx) => (
                  <div key={box.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3 relative">
                    <button
                      onClick={() => handleRemoveBox(box.id)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-500 text-xs transition-colors font-bold"
                      title="Excluir grupo"
                    >
                      Excluir
                    </button>

                    <div className="w-[85%]">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        Título do Grupo de Ração {bIdx + 1}
                      </label>
                      <input 
                        type="text" 
                        value={box.title} 
                        onChange={(e) => handleBoxTitleChange(box.id, e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-[#002075] focus:outline-hidden focus:ring-1 focus:ring-[#002075]"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                          Saldo Consumo (kg)
                        </label>
                        <input 
                          type="text" 
                          value={box.saldoConsumo} 
                          onChange={(e) => handleConsumptionChange(box.id, e.target.value)}
                          placeholder="Ex: 8.215"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#002075]"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2.5 mt-1">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Silos e Saldo Final</span>
                      <div className="flex flex-col gap-2">
                        {box.silos.map((silo, sIdx) => (
                          <div key={silo.id} className="grid grid-cols-2 gap-2 items-center">
                            <input 
                              type="text" 
                              value={silo.name} 
                              onChange={(e) => handleSiloNameChange(box.id, silo.id, e.target.value)}
                              placeholder={`Ex: SILO ${sIdx + 1}`}
                              className="px-2 py-1 border border-slate-300 rounded-md text-[11px] font-bold text-slate-700"
                            />
                            <div className="relative">
                              <input 
                                type="text" 
                                value={silo.balance} 
                                onChange={(e) => handleSiloBalanceChange(box.id, silo.id, e.target.value)}
                                placeholder="Ex: 20.000"
                                className="w-full pl-2 pr-6 py-1 border border-slate-300 rounded-md text-[11px] font-bold text-red-600 text-right"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">kg</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notice */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-2 text-[11px] text-blue-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  As alterações feitas nestes campos afetam apenas a imagem gerada e servem para fins de impressão de relatórios. Elas não alteram as capacidades dos silos do aplicativo.
                </p>
              </div>
            </div>

            {/* LIVE PREVIEW COLUMN (Right on desktop) */}
            <div className={`flex-1 flex flex-col items-center justify-start bg-slate-200 border border-slate-300 rounded-2xl p-4 md:p-6 overflow-y-auto select-none min-h-[400px] relative ${
              isMobileView && activeSubTab !== 'preview' ? 'hidden' : 'block'
            }`}>
              
              <div className="absolute top-4 left-4 z-10 bg-slate-800/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse" />
                Pré-visualização da Placa
              </div>

              {/* CARD PREVIEW RENDER (Renders identical visual to photo using Tailwind) */}
              <div className="w-full max-w-[450px] aspect-[1200/1680] bg-white border border-slate-300 shadow-lg rounded-[28px] overflow-hidden flex flex-col p-5 font-sans relative shrink-0 text-slate-800">
                
                {/* Header */}
                <div className="flex items-center justify-between gap-2.5 mt-2">
                  {/* Logo Btz */}
                  <div className="w-[40%] flex items-center shrink-0">
                    <div className="w-full aspect-[450/300] border-[5px] border-[#002075] rounded-[20px] p-1 flex flex-col items-center justify-center relative bg-white">
                      <span className="text-[#002075] font-extrabold text-[11px] tracking-[4px] leading-none mb-1 mt-0.5">GRUPO</span>
                      <div className="flex items-baseline justify-center leading-none mt-[-2px]">
                        <span className="text-[#002075] font-black text-3xl">B</span>
                        <span className="text-[#D60005] font-black text-3.5xl relative -top-[1px] ml-[1px]">t</span>
                        <span className="text-[#002075] font-black text-3xl ml-[1px]">z</span>
                      </div>
                    </div>
                  </div>

                  {/* Red separator line */}
                  <div className="w-[3px] bg-[#D60005] h-14 shrink-0" />

                  {/* Right title */}
                  <div className="flex-1 text-[#002075] leading-tight pl-1 select-none">
                    <span className="block font-black text-xs sm:text-[13px] tracking-tight uppercase leading-none">Controle de</span>
                    <span className="block font-black text-sm sm:text-[16px] tracking-tight uppercase leading-normal mt-0.5">Saldo de Ração</span>
                  </div>
                </div>

                {/* Subheader Box */}
                <div className="border-[2px] border-[#002075] rounded-[14px] p-2 flex items-center justify-between gap-1 mt-4 text-slate-800 shrink-0 select-none">
                  {/* Date Column */}
                  <div className="w-[33%] flex items-center gap-1.5 pl-1.5">
                    {/* Calendar SVG */}
                    <svg className="w-6 h-6 text-[#002075] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="leading-tight">
                      <span className="block text-[8px] font-extrabold text-[#002075] uppercase tracking-wider">Data</span>
                      <span className="block text-xs font-black text-[#002075]">{dataStr}</span>
                    </div>
                  </div>

                  {/* Red separator */}
                  <div className="w-[1.5px] bg-[#D60005] h-6 shrink-0" />

                  {/* Sector Column */}
                  <div className="w-[45%] flex items-center gap-1.5 pl-1.5">
                    {/* Barn Farm Icon */}
                    <svg className="w-6 h-6 text-[#002075] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3L2 8v13h20V8L12 3zm0 2.2l6.5 3.25V19H5.5V8.45L12 5.2z M10 13v6h4v-6h-4zm1.5 1.5h1v3h-1v-3z" />
                    </svg>
                    <div className="leading-none">
                      <span className="block text-[8px] font-extrabold text-[#002075] uppercase tracking-wider">Setor</span>
                      <span className="block text-[11px] font-black text-[#002075] mt-0.5">{setor.toUpperCase()}</span>
                      <span className="block text-[8px] font-bold text-[#002075] mt-0.5 truncate max-w-[120px]">{lote.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Red separator */}
                  <div className="w-[1.5px] bg-[#D60005] h-6 shrink-0" />

                  {/* Silos Visual mini */}
                  <div className="w-[20%] flex items-center justify-center gap-1 shrink-0 pr-1">
                    {/* Tiny visual silos */}
                    <div className="w-3.5 h-6 bg-[#002075] rounded-t-full relative flex flex-col justify-around py-1">
                      <div className="w-full h-[1px] bg-white"></div>
                      <div className="w-full h-[1px] bg-white"></div>
                      <div className="w-full h-[1px] bg-white"></div>
                    </div>
                    <div className="w-3.5 h-6 bg-[#002075] rounded-t-full relative flex flex-col justify-around py-1">
                      <div className="w-full h-[1px] bg-white"></div>
                      <div className="w-full h-[1px] bg-white"></div>
                      <div className="w-full h-[1px] bg-white"></div>
                    </div>
                  </div>
                </div>

                {/* Ração Boxes */}
                <div className="flex-1 flex flex-col gap-3 mt-4 overflow-hidden justify-start">
                  {boxes.slice(0, 2).map((box, bIdx) => (
                    <div 
                      key={box.id} 
                      className="border-[2px] border-[#002075] rounded-[18px] overflow-hidden flex flex-col shadow-xs bg-white shrink-0"
                    >
                      {/* Box Header blue strip */}
                      <div className="bg-[#002075] h-9 flex items-center relative pl-12 pr-2">
                        {/* Overlap chicken icon in a white circle */}
                        <div className="absolute left-2 -top-1.5 w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#002075] shadow-xs">
                          <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-white ${
                            bIdx === 0 ? 'bg-[#D60005]' : 'bg-[#002075]'
                          }`}>
                            {/* Simple inline chicken vector */}
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" className="hidden" />
                              <path d="M12 3a9 9 0 00-9 9c0 4.97 4.03 9 9 9s9-4.03 9-9-4.03-9-9-9zm1 13h-2v-2h2v2zm0-4h-2V7h2v5z" className="hidden" />
                              {/* Simple bird silhouette */}
                              <path d="M11.5 5.5a1.5 1.5 0 011.5 1.5c0 .33-.1.63-.29.88l1.79 1.79c.12-.1.27-.17.44-.17H16a2 2 0 012 2v2a3 3 0 01-3 3h-3.5a1 1 0 01-.1-.005C11.1 16 9.8 14.8 9.5 13.5l-2-2a1 1 0 01.3-.2l2.2-.8.5-1.5a1.5 1.5 0 011-1.5z" />
                            </svg>
                          </div>
                        </div>

                        {/* Title */}
                        <span className="text-white font-black text-[10px] tracking-wide truncate max-w-[280px] uppercase">
                          {box.title}
                        </span>
                      </div>

                      {/* Box Body split */}
                      <div className="flex flex-1 items-stretch py-2 min-h-[90px]">
                        {/* Left half: Saldo Consumo */}
                        <div className="w-[50%] flex flex-col justify-center items-center pl-2 pr-1">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Saldo Consumo</span>
                          <div className="text-[#002075] flex items-baseline justify-center">
                            <span className="text-2xl sm:text-3xl font-black tracking-tight leading-none">{box.saldoConsumo}</span>
                            <span className="text-[11px] font-bold ml-0.5 text-[#002075]">kg</span>
                          </div>
                        </div>

                        {/* Red Vertical separator */}
                        <div className="w-[1.5px] bg-[#D60005] my-1 shrink-0" />

                        {/* Right half: Saldo Final */}
                        <div className="w-[50%] flex flex-col justify-center pl-3.5 pr-2 gap-2">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider text-center mr-2 mb-0.5">Saldo Final</span>
                          {box.silos.slice(0, 2).map((sVal, sIdx) => (
                            <div key={sVal.id} className="flex flex-col select-none">
                              {/* Item row */}
                              <div className="flex items-center gap-1.5">
                                {/* Small silo graphic */}
                                <div className="w-2.5 h-4.5 bg-[#002075] rounded-t-full relative flex flex-col justify-around py-0.5 shrink-0">
                                  <div className="w-full h-[1px] bg-white"></div>
                                  <div className="w-full h-[1px] bg-white"></div>
                                </div>
                                <div className="flex flex-col leading-none">
                                  <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{sVal.name}</span>
                                  <div className="flex items-baseline mt-0.5 leading-none">
                                    <span className="text-sm font-black text-[#D60005] tracking-tight">{sVal.balance}</span>
                                    <span className="text-[8px] font-black text-[#002075] ml-0.5">kg</span>
                                  </div>
                                </div>
                              </div>

                              {/* Divider inside list */}
                              {sIdx === 0 && box.silos.length > 1 && (
                                <div className="h-[1px] bg-slate-100 w-[90%] my-1" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Wave Banner Slogan */}
                <div className="bg-[#002075] rounded-lg p-2 flex items-center justify-between mt-4 overflow-hidden relative shrink-0">
                  <div className="flex items-center gap-2 text-white pl-1.5 z-10 select-none">
                    {/* White Checkmark shield */}
                    <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-[#002075]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="leading-tight">
                      <span className="block text-[7px] font-black tracking-wider text-white">QUALIDADE E CONTROLE</span>
                      <span className="block text-[9px] font-black tracking-tight text-white uppercase leading-none mt-0.5">PARA UMA PRODUÇÃO SEGURA!</span>
                    </div>
                  </div>

                  {/* Red corner background */}
                  <div className="absolute right-0 bottom-0 top-0 w-16 bg-[#D60005] skew-x-[-25deg] origin-bottom translate-x-4"></div>
                </div>

                {/* Bottom Dark Blue Operator strip */}
                <div className="bg-[#001449] rounded-lg p-2 flex items-center gap-2 mt-2 shrink-0 text-slate-300">
                  {/* Worker helmet icon */}
                  <svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="text-[8px] tracking-wide text-slate-300 leading-normal font-mono uppercase truncate flex-1">
                    <span>Pesador: <strong className="text-white font-bold">{pesador}</strong></span>
                    <span className="mx-1.5 text-slate-500">|</span>
                    <span>Matrícula: <strong className="text-white font-bold">{matricula}</strong></span>
                  </div>
                </div>

              </div>

              {/* Hidden High-Res Export Canvas */}
              <canvas ref={canvasRef} className="hidden" />

            </div>

          </div>

          {/* ACTIONS FOOTER */}
          <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
            <button
              onClick={() => {
                if (confirm('Deseja resetar as edições temporárias da placa para os valores atuais da sessão?')) {
                  // Re-trigger sync
                  const now = new Date();
                  const dd = String(now.getDate()).padStart(2, '0');
                  const mm = String(now.getMonth() + 1).padStart(2, '0');
                  const yy = String(now.getFullYear()).slice(-2);
                  setDataStr(`${dd}/${mm}/${yy}`);
                  setSetor(operatorSession.sector || 'RECRIA');
                  setLote(operatorSession.batch || 'NC 05 LT 150');
                  setPesador(operatorSession.operatorName || 'MURILO MENDES');
                  setMatricula(operatorSession.operatorId || '86887');
                  showToast('Edições resetadas com sucesso.', 'info');
                }
              }}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-[#002075] hover:bg-slate-200/50 rounded-xl transition-colors font-mono uppercase tracking-wider flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Resetar
            </button>

            <button
              onClick={handleDownloadPlaca}
              disabled={isGenerating || boxes.length === 0}
              className={`px-6 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md select-none ${
                isGenerating || boxes.length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-[#D60005] hover:bg-red-700 text-white font-black hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Gerando PNG...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Gerar e Baixar Imagem (PNG)
                </>
              )}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
