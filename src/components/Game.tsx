import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Trophy, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

type Phase = 'briefing' | 'playing' | 'paused' | 'over';

interface Entity {
  id: number;
  kind: 'ocorrencia' | 'civil' | 'suporte';
  x: number;
  y: number;
  vy: number;
  rot: number;
  rotSpeed: number;
  size: number;
}

const W = 480;
const H = 720;
const PLAYER_W = 84;
const PLAYER_H = 46;
const BEST_KEY = 'rone.game.best';

const COLORS = () => {
  const s = getComputedStyle(document.documentElement);
  return {
    ink: s.getPropertyValue('--c-ink').trim() || '#070c14',
    ink2: s.getPropertyValue('--c-ink-2').trim() || '#0d1522',
    brand: s.getPropertyValue('--c-brand').trim() || '#123a63',
    gold: s.getPropertyValue('--c-gold').trim() || '#c8a04a',
    alert: s.getPropertyValue('--c-alert').trim() || '#b81f2b',
    paper: s.getPropertyValue('--c-paper').trim() || '#e9eef4',
  };
};

export function Game({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<Phase>('briefing');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [best, setBest] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const stateRef = useRef({
    phase: 'briefing' as Phase,
    score: 0,
    lives: 3,
    level: 1,
    entities: [] as Entity[],
    spawnTimer: 0,
    spawnEvery: 900,
    playerX: W / 2,
    targetX: W / 2,
    keys: { left: false, right: false },
    last: 0,
    elapsed: 0,
    nextId: 1,
    roadOffset: 0,
    shake: 0,
    flash: 0,
    combo: 0,
    banner: null as { text: string; sub: string; life: number } | null,
    noticeTimer: 0,
  });

  useEffect(() => {
    const stored = Number(localStorage.getItem(BEST_KEY) ?? '0');
    if (!Number.isNaN(stored)) setBest(stored);
  }, []);

  useEffect(() => {
    stateRef.current.phase = phase;
    if (phase === 'playing') {
      stateRef.current.last = performance.now();
    }
  }, [phase]);

  const syncHud = useCallback(() => {
    const s = stateRef.current;
    setScore(s.score);
    setLives(s.lives);
    setLevel(s.level);
  }, []);

  const start = useCallback(() => {
    const s = stateRef.current;
    s.score = 0;
    s.lives = 3;
    s.level = 1;
    s.entities = [];
    s.spawnTimer = 0;
    s.spawnEvery = 950;
    s.playerX = W / 2;
    s.targetX = W / 2;
    s.elapsed = 0;
    s.combo = 0;
    s.shake = 0;
    s.flash = 0;
    s.banner = { text: 'DESLOCAMENTO INICIADO', sub: 'Intercepte as ocorrências. Preserve os civis.', life: 2.2 };
    setNotice(null);
    setScore(0);
    setLives(3);
    setLevel(1);
    setPhase('playing');
  }, []);

  const gameOver = useCallback(() => {
    const s = stateRef.current;
    s.lives = 0;
    setLives(0);
    setPhase('over');
    setBest((prev) => {
      const next = Math.max(prev, s.score);
      try {
        localStorage.setItem(BEST_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  /* ---------------- input ---------------- */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (s.phase === 'playing') setPhase('paused');
        else if (s.phase === 'paused') setPhase('playing');
        else if (s.phase === 'briefing' || s.phase === 'over') start();
      }
    };
    const up = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [start]);

  const pointerToX = (clientX: number) => {
    const el = canvasRef.current;
    if (!el) return W / 2;
    const rect = el.getBoundingClientRect();
    const rel = (clientX - rect.left) / rect.width;
    return Math.max(PLAYER_W / 2 + 6, Math.min(W - PLAYER_W / 2 - 6, rel * W));
  };

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      if (stateRef.current.phase !== 'playing') return;
      stateRef.current.targetX = pointerToX(e.clientX);
    };
    const onDown = (e: PointerEvent) => {
      if (stateRef.current.phase !== 'playing') return;
      stateRef.current.targetX = pointerToX(e.clientX);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerdown', onDown);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerdown', onDown);
    };
  }, []);

  /* ---------------- render loop ---------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let cssW = 480;
    let cssH = 720;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = wrap.clientWidth;
      cssH = wrap.clientHeight;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform((cssW / W) * dpr, 0, 0, (cssW / W) * dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const drawRoad = (c: ReturnType<typeof COLORS>, offset: number) => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, c.ink);
      g.addColorStop(0.55, c.ink2);
      g.addColorStop(1, c.ink);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // faixas centrais
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = c.gold;
      ctx.lineWidth = 4;
      ctx.setLineDash([38, 34]);
      ctx.lineDashOffset = -offset;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 92, 0);
      ctx.lineTo(W / 2 - 92, H);
      ctx.moveTo(W / 2 + 92, 0);
      ctx.lineTo(W / 2 + 92, H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // laterais
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = c.brand;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(12, H);
      ctx.moveTo(W - 12, 0);
      ctx.lineTo(W - 12, H);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const drawPlayer = (c: ReturnType<typeof COLORS>, x: number, t: number) => {
      const y = H - 96;
      ctx.save();
      // farol
      const beam = ctx.createLinearGradient(0, y - 170, 0, y);
      beam.addColorStop(0, 'rgba(255,255,255,0)');
      beam.addColorStop(1, 'rgba(255,255,255,0.10)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(x - 26, y - 16);
      ctx.lineTo(x - 96, y - 190);
      ctx.lineTo(x + 96, y - 190);
      ctx.lineTo(x + 26, y - 16);
      ctx.closePath();
      ctx.fill();

      // sombra
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(x, y + 22, PLAYER_W / 2 + 6, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // rodas
      ctx.fillStyle = '#0a0a0a';
      [-1, 1].forEach((sx) => {
        [-1, 1].forEach((sy) => {
          ctx.beginPath();
          ctx.roundRect(x + sx * (PLAYER_W / 2 - 12) - 7, y + sy * 12 - 6, 14, 13, 4);
          ctx.fill();
        });
      });

      // carroceria
      ctx.fillStyle = c.brand;
      ctx.beginPath();
      ctx.roundRect(x - PLAYER_W / 2, y - PLAYER_H / 2, PLAYER_W, PLAYER_H, 10);
      ctx.fill();
      ctx.strokeStyle = c.gold;
      ctx.lineWidth = 2;
      ctx.stroke();

      // capô / faixa
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.roundRect(x - PLAYER_W / 2 + 8, y - PLAYER_H / 2 + 8, PLAYER_W - 16, PLAYER_H - 26, 6);
      ctx.fill();

      // para-brisa
      ctx.fillStyle = 'rgba(180, 220, 255, 0.25)';
      ctx.beginPath();
      ctx.roundRect(x - 22, y - 4, 44, 14, 4);
      ctx.fill();

      // giroflex
      const blink = Math.floor(t * 6) % 2 === 0;
      ctx.fillStyle = blink ? c.alert : '#2a2a2a';
      ctx.beginPath();
      ctx.roundRect(x - 26, y - PLAYER_H / 2 - 3, 20, 7, 3);
      ctx.fill();
      ctx.fillStyle = blink ? '#1b3f6b' : '#5fa8ff';
      ctx.beginPath();
      ctx.roundRect(x + 6, y - PLAYER_H / 2 - 3, 20, 7, 3);
      ctx.fill();
      if (blink) {
        ctx.globalAlpha = 0.35;
        const glow = ctx.createRadialGradient(x - 18, y - PLAYER_H / 2, 0, x - 18, y - PLAYER_H / 2, 70);
        glow.addColorStop(0, c.alert);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - 90, y - 130, 180, 180);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    };

    const drawEntity = (c: ReturnType<typeof COLORS>, e: Entity) => {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.rot);
      if (e.kind === 'ocorrencia') {
        ctx.shadowColor = c.gold;
        ctx.shadowBlur = 18;
        ctx.fillStyle = c.gold;
        ctx.beginPath();
        ctx.roundRect(-e.size / 2, -e.size / 2, e.size, e.size, 8);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#10161f';
        ctx.font = `800 ${e.size * 0.62}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 0, 1);
      } else if (e.kind === 'civil') {
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#8a93a0';
        ctx.beginPath();
        ctx.roundRect(-e.size / 2, -e.size / 2, e.size, e.size, e.size / 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#20262e';
        ctx.beginPath();
        ctx.arc(-e.size * 0.15, -e.size * 0.12, e.size * 0.09, 0, Math.PI * 2);
        ctx.arc(e.size * 0.15, -e.size * 0.12, e.size * 0.09, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#20262e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, e.size * 0.1, e.size * 0.2, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      } else {
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.roundRect(-e.size / 2, -e.size / 2, e.size, e.size, 8);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#06281a';
        ctx.font = `800 ${e.size * 0.55}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', 0, 1);
      }
      ctx.restore();
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const s = stateRef.current;
      const c = COLORS();

      let dt = (now - s.last) / 1000;
      s.last = now;
      if (!Number.isFinite(dt)) dt = 0;
      dt = Math.min(dt, 0.05);

      const active = s.phase === 'playing';
      if (active) {
        s.elapsed += dt;
        s.roadOffset += 380 * dt;

        // nível a cada 18s
        const newLevel = 1 + Math.floor(s.elapsed / 18);
        if (newLevel !== s.level) {
          s.level = newLevel;
          s.banner = { text: `NÍVEL ${newLevel}`, sub: 'Tráfego mais intenso. Mantenha a disciplina.', life: 2 };
          syncHud();
        }
        s.spawnEvery = Math.max(320, 950 - (s.level - 1) * 95);

        // movimento
        if (s.keys.left) s.targetX -= 520 * dt;
        if (s.keys.right) s.targetX += 520 * dt;
        s.targetX = Math.max(PLAYER_W / 2 + 6, Math.min(W - PLAYER_W / 2 - 6, s.targetX));
        s.playerX += (s.targetX - s.playerX) * Math.min(1, dt * 14);

        // spawn
        s.spawnTimer += dt * 1000;
        if (s.spawnTimer >= s.spawnEvery) {
          s.spawnTimer = 0;
          const roll = Math.random();
          const bucket = s.elapsed < 6 ? 1 : s.level > 2 ? 0.72 : 0.78;
          let kind: Entity['kind'] = roll < bucket ? 'ocorrencia' : roll < 0.94 ? 'civil' : 'suporte';
          const size = kind === 'ocorrencia' ? 42 : kind === 'civil' ? 38 : 34;
          s.entities.push({
            id: s.nextId++,
            kind,
            x: 26 + Math.random() * (W - 52),
            y: -50,
            vy: 150 + Math.random() * 90 + s.level * 26,
            rot: (Math.random() - 0.5) * 0.6,
            rotSpeed: (Math.random() - 0.5) * 1.2,
            size,
          });
        }

        // update entities
        const py = H - 96;
        const kept: Entity[] = [];
        for (const e of s.entities) {
          e.y += e.vy * dt;
          e.rot += e.rotSpeed * dt;

          const dx = Math.abs(e.x - s.playerX);
          const dy = Math.abs(e.y - py);
          const hit = dx < PLAYER_W / 2 + e.size * 0.35 && dy < PLAYER_H / 2 + e.size * 0.4;

          if (hit) {
            if (e.kind === 'ocorrencia') {
              s.combo += 1;
              s.score += 10 + Math.min(20, (s.combo - 1) * 2);
              s.flash = 0.18;
              s.banner =
                s.combo >= 3
                  ? { text: `COMBO x${s.combo}`, sub: 'Ocorrências neutralizadas com eficiência.', life: 1.2 }
                  : null;
              syncHud();
            } else if (e.kind === 'civil') {
              s.lives -= 1;
              s.combo = 0;
              s.shake = 0.5;
              s.banner = { text: 'ABORDAGEM INCORRETA', sub: 'Civil atingido. Revise o protocolo.', life: 1.6 };
              syncHud();
              if (s.lives <= 0) {
                gameOver();
                return;
              }
            } else {
              s.score += 25;
              s.combo = 0;
              s.banner = { text: 'APOIO RECEBIDO', sub: '+25 pontos de suporte.', life: 1.2 };
              syncHud();
            }
            continue;
          }

          if (e.kind === 'ocorrencia' && e.y > H + 40) {
            s.lives -= 1;
            s.combo = 0;
            s.shake = 0.4;
            s.banner = { text: 'OCORRÊNCIA PERDIDA', sub: 'A área ficou sem cobertura.', life: 1.4 };
            syncHud();
            if (s.lives <= 0) {
              gameOver();
              return;
            }
            continue;
          }

          if (e.y < H + 70) kept.push(e);
        }
        s.entities = kept;

        if (s.banner) {
          s.banner.life -= dt;
          if (s.banner.life <= 0) s.banner = null;
        }
        s.shake = Math.max(0, s.shake - dt);
        s.flash = Math.max(0, s.flash - dt);
      }

      // ---------- draw ----------
      ctx.save();
      if (s.shake > 0) {
        const mag = s.shake * 12;
        ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
      }
      drawRoad(c, s.roadOffset);
      s.entities.forEach((e) => drawEntity(c, e));
      drawPlayer(c, s.playerX, s.elapsed);

      if (s.flash > 0) {
        ctx.fillStyle = `rgba(200,160,74,${s.flash * 0.35})`;
        ctx.fillRect(0, 0, W, H);
      }

      // HUD interno (nível / combo)
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.roundRect(16, 16, 132, 40, 8);
      ctx.fill();
      ctx.fillStyle = c.gold;
      ctx.font = '700 12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`NÍVEL ${s.level}`, 28, 30);
      ctx.fillStyle = c.paper;
      ctx.globalAlpha = 0.7;
      ctx.fillText(`COMBO x${s.combo}`, 28, 46);
      ctx.globalAlpha = 1;

      if (s.banner) {
        const alpha = Math.min(1, s.banner.life * 1.4);
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.fillStyle = c.gold;
        ctx.font = '800 26px "Barlow Condensed", Inter, sans-serif';
        ctx.fillText(s.banner.text, W / 2, H / 2 - 40);
        ctx.fillStyle = c.paper;
        ctx.globalAlpha = alpha * 0.75;
        ctx.font = '500 13px Inter, sans-serif';
        ctx.fillText(s.banner.sub, W / 2, H / 2 - 14);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    };

    stateRef.current.last = performance.now();
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [gameOver, syncHud]);

  /* aviso curto para feedback de pausa */
  useEffect(() => {
    if (phase !== 'paused') return;
    setNotice('Operação pausada — pressione ESPAÇO ou o botão para retomar.');
  }, [phase]);

  const hudLives = Math.max(0, lives);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--c-gold)]">Simulador tático</p>
              <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide sm:text-5xl">
                Operação RONE · Patrulha Noturna
              </h1>
            </div>
            <button
              onClick={onExit}
              className="clip-btn border border-white/25 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-paper)]/80 transition hover:border-[var(--c-gold)] hover:text-[var(--c-gold)]"
            >
              ← Voltar ao site
            </button>
          </div>

          <div
            ref={wrapRef}
            className="clip-corner relative w-full overflow-hidden border border-white/15 bg-black"
            style={{ aspectRatio: '2 / 3', maxHeight: '78vh' }}
          >
            <canvas ref={canvasRef} className="block h-full w-full touch-none" aria-label="Área do jogo Operação RONE" />

            {phase !== 'playing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--c-ink)]/85 p-6 text-center backdrop-blur-sm">
                {phase === 'briefing' && (
                  <div className="animate-rise max-w-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--c-gold)]/50 bg-[var(--c-gold)]/10">
                      <ShieldCheck className="h-7 w-7 text-[var(--c-gold)]" />
                    </div>
                    <h2 className="font-display text-3xl font-extrabold uppercase tracking-wide">Briefing</h2>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--c-paper)]/70">
                      Conduza a viatura da RONE pela avenida. Intercepte as{' '}
                      <span className="text-[var(--c-gold)]">ocorrências (!)</span>, recolha o{' '}
                      <span className="text-emerald-400">apoio (+)</span> e evite atingir{' '}
                      <span className="text-[var(--c-paper)]">civis</span>. Você tem 3 vidas e perde uma a cada
                      ocorrência perdida.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--c-paper)]/60">
                      <span className="rounded border border-white/15 px-2 py-1">Setas / A-D</span>
                      <span className="rounded border border-white/15 px-2 py-1">Arraste na tela</span>
                      <span className="rounded border border-white/15 px-2 py-1">Espaço = pausa</span>
                    </div>
                    <button
                      onClick={start}
                      className="clip-btn mt-6 inline-flex items-center gap-2 bg-[var(--c-gold)] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-black transition hover:brightness-110"
                    >
                      <Play className="h-4 w-4" /> Iniciar turno
                    </button>
                  </div>
                )}

                {phase === 'paused' && (
                  <div className="max-w-xs">
                    <h2 className="font-display text-3xl font-extrabold uppercase tracking-wide">Pausado</h2>
                    <p className="mt-2 text-sm text-[var(--c-paper)]/60">{notice}</p>
                    <div className="mt-5 flex justify-center gap-3">
                      <button
                        onClick={() => setPhase('playing')}
                        className="clip-btn inline-flex items-center gap-2 bg-[var(--c-gold)] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-black"
                      >
                        <Play className="h-4 w-4" /> Retomar
                      </button>
                      <button
                        onClick={start}
                        className="clip-btn inline-flex items-center gap-2 border border-white/25 px-5 py-2.5 text-xs uppercase tracking-[0.18em]"
                      >
                        <RotateCcw className="h-4 w-4" /> Reiniciar
                      </button>
                    </div>
                  </div>
                )}

                {phase === 'over' && (
                  <div className="max-w-sm">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--c-alert)]">Turno encerrado</p>
                    <h2 className="font-display mt-2 text-4xl font-extrabold uppercase tracking-wide">Fim da operação</h2>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded border border-[var(--c-gold)]/40 bg-[var(--c-gold)]/10 p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-paper)]/60">Pontuação</p>
                        <p className="font-display text-3xl font-extrabold text-[var(--c-gold)]">{score}</p>
                      </div>
                      <div className="rounded border border-white/15 p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-paper)]/60">Recorde</p>
                        <p className="font-display text-3xl font-extrabold">{best}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-[var(--c-paper)]/60">
                      Nível alcançado: {level} · Classificação:{' '}
                      {score >= 400
                        ? 'Operador de elite'
                        : score >= 250
                          ? 'Operador experiente'
                          : score >= 120
                            ? 'Operador em formação'
                            : 'Recruta'}
                    </p>
                    <button
                      onClick={start}
                      className="clip-btn mt-5 inline-flex items-center gap-2 bg-[var(--c-gold)] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-black"
                    >
                      <RotateCcw className="h-4 w-4" /> Novo turno
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* controles móveis */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                onPointerDown={() => (stateRef.current.keys.left = true)}
                onPointerUp={() => (stateRef.current.keys.left = false)}
                onPointerLeave={() => (stateRef.current.keys.left = false)}
                className="flex h-12 w-16 items-center justify-center rounded border border-white/20 bg-white/5 active:bg-white/15"
                aria-label="Mover para a esquerda"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                onPointerDown={() => (stateRef.current.keys.right = true)}
                onPointerUp={() => (stateRef.current.keys.right = false)}
                onPointerLeave={() => (stateRef.current.keys.right = false)}
                className="flex h-12 w-16 items-center justify-center rounded border border-white/20 bg-white/5 active:bg-white/15"
                aria-label="Mover para a direita"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => setPhase(phase === 'playing' ? 'paused' : phase === 'paused' ? 'playing' : phase)}
              className="inline-flex items-center gap-2 rounded border border-white/20 px-4 py-2.5 text-xs uppercase tracking-[0.18em]"
            >
              {phase === 'playing' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {phase === 'playing' ? 'Pausar' : 'Retomar'}
            </button>
          </div>
        </div>

        {/* Placar lateral */}
        <aside className="space-y-4">
          <div className="card clip-corner p-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--c-gold)]">Painel de comando</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded border border-white/10 bg-black/30 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--c-paper)]/50">Pontos</p>
                <p className="font-display text-3xl font-extrabold text-[var(--c-gold)]">{score}</p>
              </div>
              <div className="rounded border border-white/10 bg-black/30 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--c-paper)]/50">Vidas</p>
                <p className="font-display text-3xl font-extrabold">{'▮'.repeat(hudLives) || '—'}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded border border-white/10 bg-black/30 px-3 py-2 text-xs">
              <span className="flex items-center gap-2 text-[var(--c-paper)]/60">
                <Trophy className="h-4 w-4 text-[var(--c-gold)]" /> Recorde
              </span>
              <span className="font-display text-lg font-bold">{best}</span>
            </div>
          </div>

          <div className="card p-5 text-sm">
            <h3 className="font-display text-lg font-bold uppercase tracking-wide">Regras rápidas</h3>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-[var(--c-paper)]/70">
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--c-gold)]" /> Cada ocorrência
                interceptada vale 10 pontos (+ bônus de combo).
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" /> Apoio (+) soma 25 pontos.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#8a93a0]" /> Atingir civil ou perder
                ocorrência custa 1 vida.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--c-alert)]" /> A cada 18 segundos a
                velocidade aumenta.
              </li>
            </ul>
          </div>

          <div className="border border-dashed border-white/15 p-4 text-[11px] leading-relaxed text-[var(--c-paper)]/45">
            Jogo fictício, criado para entretenimento e divulgação do site. Os personagens e situações são
            ilustrativos e não retratam operações reais.
          </div>
        </aside>
      </div>
    </section>
  );
}
