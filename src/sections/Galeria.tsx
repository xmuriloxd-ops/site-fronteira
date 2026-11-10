import React, { useRef, useState } from 'react';
import { ImagePlus, Trash2, Upload, X, Maximize2, Camera, Info, ArrowUp } from 'lucide-react';
import type { Photo, SiteConfig } from '../lib/config';
import { fileToOptimizedDataUrl } from '../lib/config';

interface Props {
  config: SiteConfig;
  onUpdate: (patch: Partial<SiteConfig>) => void;
}

export function Galeria({ config, onUpdate }: Props) {
  const [zoom, setZoom] = useState<Photo | null>(null);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement | null>(null);
  const logoInput = useRef<HTMLInputElement | null>(null);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setErro(null);
    try {
      const novas: Photo[] = [];
      for (const file of Array.from(files).slice(0, 8)) {
        const src = await fileToOptimizedDataUrl(file, 1400, 0.82);
        novas.push({
          id: `p${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          src,
          title: file.name.replace(/\.[^.]+$/, '').slice(0, 60),
          caption: 'Enviada por você — clique em editar para ajustar a legenda.',
        });
      }
      onUpdate({ photos: [...novas, ...config.photos] });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao carregar imagem.');
    } finally {
      setBusy(false);
    }
  };

  const addLogo = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setErro(null);
    try {
      const dataUrl = await fileToOptimizedDataUrl(files[0], 480, 0.9);
      onUpdate({ logoDataUrl: dataUrl });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao carregar o logo.');
    } finally {
      setBusy(false);
    }
  };

  const updatePhoto = (id: string, patch: Partial<Photo>) =>
    onUpdate({ photos: config.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)) });

  const removePhoto = (id: string) => onUpdate({ photos: config.photos.filter((p) => p.id !== id) });

  const moveToCover = (id: string) => {
    const photo = config.photos.find((p) => p.id === id);
    if (!photo) return;
    onUpdate({ photos: [photo, ...config.photos.filter((p) => p.id !== id)] });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--c-gold)]">Mídia da unidade</p>
          <h1 className="font-display mt-2 text-4xl font-extrabold uppercase leading-none tracking-wide sm:text-5xl">
            Fotos, brasões e logos
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--c-paper)]/60">
            Envie imagens do seu computador ou celular. Elas ficam salvas neste navegador e podem ser usadas como
            capa, galeria e logo do cabeçalho.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(ev) => addPhotos(ev.target.files)}
          />
          <input
            ref={logoInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(ev) => addLogo(ev.target.files)}
          />
          <button
            onClick={() => photoInput.current?.click()}
            disabled={busy}
            className="clip-btn inline-flex items-center gap-2 bg-[var(--c-gold)] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.16em] text-black disabled:opacity-60"
          >
            <Upload className="h-4 w-4" /> Enviar fotos
          </button>
          <button
            onClick={() => logoInput.current?.click()}
            disabled={busy}
            className="clip-btn inline-flex items-center gap-2 border border-white/25 px-5 py-3 text-xs uppercase tracking-[0.16em] transition hover:border-[var(--c-gold)] hover:text-[var(--c-gold)] disabled:opacity-60"
          >
            <ImagePlus className="h-4 w-4" /> Enviar logo / brasão
          </button>
        </div>
      </div>

      {erro && (
        <p className="mt-4 border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{erro}</p>
      )}
      {busy && <p className="mt-4 text-sm text-[var(--c-gold)]">Processando imagens…</p>}

      {/* logo atual */}
      <div className="mt-8 flex flex-wrap items-center gap-5 border border-white/12 bg-black/20 p-5">
        <div className="flex h-24 w-24 items-center justify-center border border-dashed border-white/25 bg-black/40">
          {config.logoDataUrl ? (
            <img src={config.logoDataUrl} alt="Logo atual" className="h-full w-full object-contain p-2" />
          ) : (
            <Camera className="h-7 w-7 text-[var(--c-paper)]/30" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--c-gold)]">Logo do cabeçalho</p>
          <p className="mt-1 max-w-lg text-sm text-[var(--c-paper)]/60">
            Use PNG com fundo transparente para o melhor resultado. Recomendado 512×512 px.
          </p>
        </div>
        {config.logoDataUrl && (
          <button
            onClick={() => onUpdate({ logoDataUrl: null })}
            className="inline-flex items-center gap-2 border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.14em] text-[var(--c-paper)]/70 hover:border-red-400/60 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" /> Remover
          </button>
        )}
      </div>

      {/* grade de fotos */}
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {config.photos.map((photo, index) => (
          <figure key={photo.id} className="group card overflow-hidden">
            <div className="relative aspect-[4/3] overflow-hidden bg-black/40">
              <img
                src={photo.src}
                alt={photo.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-start justify-between bg-gradient-to-b from-black/50 via-transparent to-black/60 p-2 opacity-0 transition group-hover:opacity-100">
                <span className="bg-[var(--c-gold)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-black">
                  {index === 0 ? 'Capa do site' : `Foto ${index + 1}`}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setZoom(photo)}
                    className="bg-black/70 p-1.5 text-white/90 hover:bg-[var(--c-gold)] hover:text-black"
                    aria-label="Ampliar"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                  {index !== 0 && (
                    <button
                      onClick={() => moveToCover(photo.id)}
                      className="bg-black/70 p-1.5 text-white/90 hover:bg-[var(--c-gold)] hover:text-black"
                      aria-label="Usar como capa"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="bg-black/70 p-1.5 text-white/90 hover:bg-red-500 hover:text-white"
                    aria-label="Remover foto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <figcaption className="space-y-2 p-4">
              <input
                className="field !py-1.5 !text-[13px] font-semibold"
                value={photo.title}
                onChange={(ev) => updatePhoto(photo.id, { title: ev.target.value })}
                placeholder="Título da foto"
              />
              <input
                className="field !py-1.5 !text-[12px]"
                value={photo.caption}
                onChange={(ev) => updatePhoto(photo.id, { caption: ev.target.value })}
                placeholder="Legenda / crédito"
              />
            </figcaption>
          </figure>
        ))}

        <button
          onClick={() => photoInput.current?.click()}
          className="flex min-h-[260px] flex-col items-center justify-center gap-3 border border-dashed border-white/20 bg-black/20 p-6 text-center transition hover:border-[var(--c-gold)] hover:bg-[var(--c-gold)]/5"
        >
          <ImagePlus className="h-8 w-8 text-[var(--c-gold)]" />
          <span className="text-sm font-semibold">Adicionar mais fotos</span>
          <span className="max-w-[220px] text-[11px] leading-relaxed text-[var(--c-paper)]/45">
            JPG, PNG ou WEBP. As imagens são redimensionadas automaticamente para não pesar.
          </span>
        </button>
      </div>

      <div className="mt-8 flex gap-3 border border-dashed border-white/15 p-4 text-[12px] leading-relaxed text-[var(--c-paper)]/50">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--c-gold)]" />
        <p>
          As imagens ficam no armazenamento local do navegador (localStorage). Se você limpar os dados do site,
          elas voltam ao padrão. Para publicar em produção, coloque os arquivos na pasta <code>public/images</code>{' '}
          do projeto.
        </p>
      </div>

      {zoom && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoom(null)}
        >
          <button
            className="absolute right-5 top-5 border border-white/25 p-2 text-white/80 hover:bg-white/10"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          <figure className="max-h-full max-w-6xl" onClick={(ev) => ev.stopPropagation()}>
            <img src={zoom.src} alt={zoom.title} className="max-h-[80vh] w-auto object-contain" />
            <figcaption className="mt-3 text-center">
              <p className="font-display text-xl font-bold uppercase tracking-wide">{zoom.title}</p>
              <p className="text-xs text-white/55">{zoom.caption}</p>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
