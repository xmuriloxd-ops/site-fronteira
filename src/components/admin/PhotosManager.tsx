import { useState } from 'react';
import { ImagePlus, Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { PHOTO_TAGS, type Photo } from '../../types';
import { Alert, Field, ImageField, Modal, Select, TextInput } from './controls';

const EMPTY = {
  url: '',
  caption: '',
  tag: 'Operacional',
  author: 'Comunicação ROTAM',
};

export function PhotosManager({
  photos,
  loading,
  onReload,
  onExpired,
  notify,
}: {
  photos: Photo[];
  loading: boolean;
  onReload: () => void;
  onExpired: () => void;
  notify: (message: string, type?: 'ok' | 'err') => void;
}) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Photo | null>(null);
  const [editDraft, setEditDraft] = useState({ caption: '', tag: '' });
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleError = (err: unknown) => {
    if (err instanceof ApiError && err.status === 401) return onExpired();
    const message = err instanceof ApiError ? err.message : 'Falha na operação.';
    setError(message);
    notify(message, 'err');
  };

  const openCreate = () => {
    setDraft({ ...EMPTY });
    setError(null);
    setCreating(true);
  };

  const save = async () => {
    setError(null);
    if (!draft.url.trim()) return setError('Envie uma imagem para a galeria.');
    setSaving(true);
    try {
      await api.createPhoto({
        url: draft.url.trim(),
        caption: draft.caption.trim() || 'Registro operacional',
        tag: draft.tag,
        author: draft.author.trim() || 'Comunicação ROTAM',
      });
      notify('Foto publicada na galeria.');
      setCreating(false);
      onReload();
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (photo: Photo) => {
    setEditing(photo);
    setEditDraft({ caption: photo.caption, tag: photo.tag });
    setError(null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      await api.updatePhoto(editing.id, editDraft);
      notify('Legenda atualizada.');
      setEditing(null);
      onReload();
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (photo: Photo) => {
    if (!window.confirm('Remover esta foto da galeria?')) return;
    setBusyId(photo.id);
    try {
      await api.deletePhoto(photo.id);
      notify('Foto removida.');
      onReload();
    } catch (err) {
      handleError(err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl uppercase tracking-wide text-white">Galeria</h2>
          <p className="text-xs text-fumaca">{photos.length} fotos publicadas</p>
        </div>
        <button type="button" onClick={openCreate} className="btn btn-gold !py-2.5">
          <Plus className="h-4 w-4" />
          Enviar foto
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 border border-borda bg-carvao py-16 text-sm text-fumaca">
          <Loader2 className="h-5 w-5 animate-spin text-ouro" />
          Carregando galeria...
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-dashed border-borda bg-carvao/40 px-6 py-16 text-center">
          <ImagePlus className="h-8 w-8 text-ouro/40" />
          <p className="font-display text-xl uppercase tracking-wide text-white">Galeria vazia</p>
          <p className="text-sm text-fumaca">Envie a primeira foto do acervo.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden border border-borda bg-carvao">
              <div className="aspect-[4/3] overflow-hidden bg-grafite">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-3">
                <span className="tag bg-ouro/15 text-ouro">{photo.tag}</span>
                <p className="mt-2 line-clamp-2 text-xs leading-snug text-white">{photo.caption}</p>
                <p className="mt-1 text-[0.6rem] uppercase tracking-[0.16em] text-fumaca-escura">
                  {formatDate(photo.createdAt)}
                </p>
              </div>
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => openEdit(photo)}
                  className="flex h-8 w-8 items-center justify-center border border-white/20 bg-black/70 text-white backdrop-blur transition-colors hover:border-ouro hover:text-ouro"
                  title="Editar legenda"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(photo)}
                  disabled={busyId === photo.id}
                  className="flex h-8 w-8 items-center justify-center border border-white/20 bg-black/70 text-white backdrop-blur transition-colors hover:border-vermelho hover:text-vermelho"
                  title="Excluir"
                >
                  {busyId === photo.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Enviar foto para a galeria"
        description="A foto aparece imediatamente no site público."
        footer={
          <>
            <button type="button" onClick={() => setCreating(false)} className="btn btn-ghost !py-2">
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="btn btn-gold !py-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Publicar foto
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <ImageField
            label="Imagem"
            value={draft.url}
            onChange={(url) => setDraft((current) => ({ ...current, url }))}
          />
          <Field label="Legenda">
            <TextInput
              value={draft.caption}
              onChange={(event) => setDraft((current) => ({ ...current, caption: event.target.value }))}
              placeholder="Ex.: Operadores durante instrução noturna."
              maxLength={260}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoria">
              <Select
                value={draft.tag}
                onChange={(event) => setDraft((current) => ({ ...current, tag: event.target.value }))}
              >
                {PHOTO_TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Crédito">
              <TextInput
                value={draft.author}
                onChange={(event) => setDraft((current) => ({ ...current, author: event.target.value }))}
                maxLength={80}
              />
            </Field>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Editar foto"
        footer={
          <>
            <button type="button" onClick={() => setEditing(null)} className="btn btn-ghost !py-2">
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveEdit}
              disabled={saving}
              className="btn btn-gold !py-2 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <Alert>{error}</Alert>}
          {editing && (
            <img
              src={editing.url}
              alt={editing.caption}
              className="max-h-56 w-full border border-borda object-cover"
            />
          )}
          <Field label="Legenda">
            <TextInput
              value={editDraft.caption}
              onChange={(event) =>
                setEditDraft((current) => ({ ...current, caption: event.target.value }))
              }
              maxLength={260}
            />
          </Field>
          <Field label="Categoria">
            <Select
              value={editDraft.tag}
              onChange={(event) =>
                setEditDraft((current) => ({ ...current, tag: event.target.value }))
              }
            >
              {PHOTO_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
