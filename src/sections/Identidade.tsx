import React, { useState } from 'react';
import { Check, Palette, RotateCcw, Download, Contrast, Type } from 'lucide-react';
import type { Palette as PaletteType, SiteConfig } from '../lib/config';
import { DEFAULT_CONFIG, PALETTE_PRESETS } from '../lib/config';

interface Props {
  config: SiteConfig;
  onUpdate: (patch: Partial<SiteConfig>) => void;
}

const COLOR_FIELDS: { key: keyof PaletteType; label: string; hint: string }[] = [
  { key: 'ink', label: 'Fundo principal', hint: 'Cor de base do site' },
  { key: 'ink2', label: 'Fundo secundário', hint: 'Cartões e painéis' },
  { key: 'brand', label: 'Azul institucional', hint: 'Marca e viaturas' },
  { key: 'brandSoft', label: 'Azul claro', hint: 'Detalhes e bordas' },
  { key: 'gold', label: 'Dourado / destaque', hint: 'Botões e títulos' },
  { key: 'alert', label: 'Vermelho de alerta', hint: 'Avisos e giroflex' },
  { key: 'paper', label: 'Texto claro', hint: 'Leitura do conteúdo' },
];

export function Identidade({ config, onUpdate }: Props) {
  const [copiado, setCopiado] = useState(false);
  const palette = config.palette;

  const setColor = (key: keyof PaletteType, value: string) =>
    onUpdate({ palette: { ...palette, [key]: value } });

  const applyPreset = (p: PaletteType) => onUpdate({ palette: p });

  const exportTheme = () => {
    const css = `:root {\n${COLOR_FIELDS.map(
      (f) => `  --c-${f.key === 'ink2' ? 'ink-2' : f.key === 'brandSoft' ? 'brand-soft' : f.key}: ${palette[f.key]};`,
    ).join('\n')}\n}`;
    navigator.clipboard?.writeText(css);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2200);
  };

  const downloadTheme = () => {
    const css = `/* Tema gerado pelo site da RONE */\n:root {\n${COLOR_FIELDS.map(
      (f) => `  --c-${f.key === 'ink2' ? 'ink-2' : f.key === 'brandSoft' ? 'brand-soft' : f.key}: ${palette[f.key]};`,
    ).join('\n')}\n}\n`;
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tema-rone.css';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--c-gold)]">Identidade visual</p>
          <h1 className="font-display mt-2 text-4xl font-extrabold uppercase leading-none tracking-wide sm:text-5xl">
            Cores do site
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--c-paper)]/60">
            Escolha um preset ou defina cada cor. O tema é aplicado imediatamente em todas as páginas e fica salvo
            no navegador.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyPreset(DEFAULT_CONFIG.palette)}
            className="clip-btn inline-flex items-center gap-2 border border-white/25 px-4 py-2.5 text-xs uppercase tracking-[0.16em] hover:border-[var(--c-gold)] hover:text-[var(--c-gold)]"
          >
            <RotateCcw className="h-4 w-4" /> Restaurar padrão
          </button>
          <button
            onClick={downloadTheme}
            className="clip-btn inline-flex items-center gap-2 bg-[var(--c-gold)] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-black"
          >
            <Download className="h-4 w-4" /> Baixar tema .css
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* presets */}
        <div>
          <h2 className="font-display flex items-center gap-2 text-xl font-bold uppercase tracking-wide">
            <Palette className="h-5 w-5 text-[var(--c-gold)]" /> Paletas prontas
          </h2>
          <div className="mt-4 space-y-3">
            {PALETTE_PRESETS.map((preset) => {
              const ativo = JSON.stringify(preset.palette) === JSON.stringify(palette);
              return (
                <button
                  key={preset.nome}
                  onClick={() => applyPreset(preset.palette)}
                  className={`group flex w-full items-center gap-4 border p-4 text-left transition ${
                    ativo
                      ? 'border-[var(--c-gold)] bg-[var(--c-gold)]/10'
                      : 'border-white/15 bg-black/20 hover:border-white/35'
                  }`}
                >
                  <div className="flex shrink-0 overflow-hidden rounded-sm border border-white/20">
                    {['ink', 'brand', 'brandSoft', 'gold', 'alert'].map((k) => (
                      <span
                        key={k}
                        className="h-10 w-6"
                        style={{ background: preset.palette[k as keyof PaletteType] }}
                      />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-bold uppercase tracking-wide">{preset.nome}</p>
                    <p className="truncate text-[11px] text-[var(--c-paper)]/50">{preset.descricao}</p>
                  </div>
                  {ativo && <Check className="h-5 w-5 shrink-0 text-[var(--c-gold)]" />}
                </button>
              );
            })}
          </div>

          <div className="mt-6 border border-dashed border-white/15 p-4 text-[12px] leading-relaxed text-[var(--c-paper)]/50">
            <p className="mb-1 flex items-center gap-2 font-semibold uppercase tracking-[0.14em] text-[var(--c-paper)]/65">
              <Contrast className="h-3.5 w-3.5" /> Contraste
            </p>
            Textos claros sobre fundo escuro mantêm boa leitura. Se escolher um dourado muito claro ou um papel
            escuro, verifique o contraste nos cartões.
          </div>
        </div>

        {/* editor */}
        <div className="card p-6">
          <h2 className="font-display flex items-center gap-2 text-xl font-bold uppercase tracking-wide">
            <Type className="h-5 w-5 text-[var(--c-gold)]" /> Ajuste fino
          </h2>
          <div className="mt-5 space-y-4">
            {COLOR_FIELDS.map((f) => (
              <div key={f.key} className="flex items-center gap-3">
                <input
                  type="color"
                  value={palette[f.key]}
                  onChange={(ev) => setColor(f.key, ev.target.value)}
                  className="h-11 w-12 cursor-pointer rounded border border-white/25 bg-transparent p-0.5"
                  aria-label={f.label}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{f.label}</p>
                  <p className="text-[11px] text-[var(--c-paper)]/45">{f.hint}</p>
                </div>
                <input
                  className="field w-[110px] !py-1.5 font-mono !text-[12px] uppercase"
                  value={palette[f.key]}
                  onChange={(ev) => setColor(f.key, ev.target.value)}
                />
              </div>
            ))}
          </div>

          <button
            onClick={exportTheme}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 border border-white/20 px-4 py-2.5 text-xs uppercase tracking-[0.16em] hover:border-[var(--c-gold)] hover:text-[var(--c-gold)]"
          >
            {copiado ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {copiado ? 'CSS copiado!' : 'Copiar CSS do tema'}
          </button>

          {/* prévia */}
          <div className="mt-6 border border-white/12 p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--c-paper)]/45">Prévia</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="clip-btn bg-[var(--c-gold)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-black">
                Botão principal
              </span>
              <span className="clip-btn border border-white/30 px-4 py-2 text-[11px] uppercase tracking-[0.16em]">
                Secundário
              </span>
              <span className="bg-[var(--c-alert)] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                Alerta
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(['ink', 'brand', 'brandSoft', 'gold', 'alert', 'paper'] as (keyof PaletteType)[]).map((k) => (
                <div key={k} className="border border-white/10">
                  <div className="h-10" style={{ background: palette[k] }} />
                  <p className="px-1.5 py-1 font-mono text-[9px] uppercase text-[var(--c-paper)]/50">
                    {palette[k]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
