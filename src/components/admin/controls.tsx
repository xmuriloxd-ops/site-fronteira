import React, { useRef, useState } from 'react';
import { AlertCircle, ImagePlus, Loader2, Link2, Upload, X } from 'lucide-react';
import { api, ApiError } from '../../lib/api';

export function Field({
  label,
  hint,
  children,
  required,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-fumaca">
        {label}
        {required && <span className="text-vermelho">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[0.68rem] text-fumaca-escura">{hint}</span>}
    </label>
  );
}

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function TextInput({ className = '', ...props }, ref) {
  return <input ref={ref} className={`field ${className}`} {...props} />;
});

export function TextArea({
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`field resize-y ${className}`} {...props} />;
}

export function Select({
  className = '',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`field ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 border border-borda bg-[#0d0b0c] px-3.5 py-2.5 text-left transition-colors hover:border-ouro/40"
      aria-pressed={checked}
    >
      <span>
        <span className="block text-[0.8rem] font-medium text-white">{label}</span>
        {description && <span className="text-[0.68rem] text-fumaca-escura">{description}</span>}
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-ouro' : 'bg-[#3a3132]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#0a0909] transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}

export function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 border border-vermelho/40 bg-vermelho/10 px-3 py-2.5 text-xs text-[#ffd9da]">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-vermelho" />
      <span>{children}</span>
    </div>
  );
}

export function ImageField({
  value,
  onChange,
  label = 'Imagem',
  hint = 'Envie um arquivo do seu computador ou cole o link de uma imagem.',
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await api.upload(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao enviar a imagem.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <span className="mb-1.5 flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-fumaca">
        {label}
      </span>

      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <div className="relative flex h-28 items-center justify-center overflow-hidden border border-borda bg-[#0d0b0c]">
          {value ? (
            <img src={value} alt="Pré-visualização" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-fumaca-escura" />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <Loader2 className="h-5 w-5 animate-spin text-ouro" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fumaca-escura" />
            <TextInput
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="/uploads/2026-10/foto.jpg ou https://..."
              className="!py-2 pl-9 text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn btn-outline !px-3 !py-2 !text-[0.7rem] disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Enviar imagem
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="btn btn-ghost !px-3 !py-2 !text-[0.7rem]"
              >
                <X className="h-3.5 w-3.5" />
                Remover
              </button>
            )}
          </div>
          <p className="text-[0.66rem] text-fumaca-escura">{hint}</p>
          {error && <p className="text-[0.68rem] text-vermelho">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative my-4 w-full ${wide ? 'max-w-4xl' : 'max-w-xl'} border border-borda bg-carvao`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="hazard h-1 w-full opacity-70" />
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="font-display text-xl uppercase tracking-wide text-white">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-fumaca">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-fumaca-escura transition-colors hover:text-ouro"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  accent = 'ouro',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent?: 'ouro' | 'vermelho';
}) {
  return (
    <div className="border border-borda bg-carvao p-5">
      <div className="flex items-center justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center border ${
            accent === 'ouro'
              ? 'border-ouro/30 bg-ouro/5 text-ouro'
              : 'border-vermelho/30 bg-vermelho/5 text-vermelho'
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-display text-3xl text-white">{value}</span>
      </div>
      <p className="mt-3 text-[0.64rem] uppercase tracking-[0.2em] text-fumaca-escura">{label}</p>
    </div>
  );
}
