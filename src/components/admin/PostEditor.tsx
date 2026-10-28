import { useEffect, useState } from 'react';
import { Eye, Loader2, Save, Wand2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { renderMarkdown } from '../../lib/markdown';
import { CATEGORIES, type Post } from '../../types';
import { Alert, Field, ImageField, Modal, Select, TextArea, TextInput, Toggle } from './controls';

interface Draft {
  title: string;
  category: string;
  customCategory: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  location: string;
  featured: boolean;
  published: boolean;
}

const EMPTY: Draft = {
  title: '',
  category: 'Operação',
  customCategory: '',
  excerpt: '',
  content: '',
  coverImage: '',
  author: 'Comunicação ROTAM',
  location: 'Goiânia · GO',
  featured: false,
  published: true,
};

function toDraft(post: Post | null): Draft {
  if (!post) return EMPTY;
  const isKnown = (CATEGORIES as readonly string[]).includes(post.category);
  return {
    title: post.title,
    category: isKnown ? post.category : 'Outra',
    customCategory: isKnown ? '' : post.category,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    author: post.author,
    location: post.location ?? '',
    featured: post.featured,
    published: post.published,
  };
}

export function PostEditor({
  open,
  post,
  onClose,
  onSaved,
  onExpired,
}: {
  open: boolean;
  post: Post | null;
  onClose: () => void;
  onSaved: (post: Post) => void;
  onExpired: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(toDraft(post));
      setError(null);
      setPreview(false);
    }
  }, [open, post]);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setError(null);
    if (!draft.title.trim()) return setError('Informe o título da notícia.');
    if (!draft.content.trim()) return setError('Escreva o conteúdo da notícia.');

    const payload = {
      title: draft.title.trim(),
      category: draft.category === 'Outra' ? draft.customCategory.trim() || 'Notícia' : draft.category,
      excerpt: draft.excerpt.trim(),
      content: draft.content,
      coverImage: draft.coverImage.trim(),
      author: draft.author.trim() || 'Comunicação ROTAM',
      location: draft.location.trim(),
      featured: draft.featured,
      published: draft.published,
    };

    setSaving(true);
    try {
      const result = post
        ? await api.updatePost(post.id, payload)
        : await api.createPost(payload);
      onSaved(result.post);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onExpired();
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar a notícia.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={post ? 'Editar notícia' : 'Nova notícia'}
      description="As notícias publicadas aparecem imediatamente no site."
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-ghost !py-2">
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn btn-gold !py-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {post ? 'Salvar alterações' : 'Publicar notícia'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Título" required>
              <TextInput
                value={draft.title}
                onChange={(event) => update('title', event.target.value)}
                placeholder="Ex.: ROTAM deflagra operação e apreende arsenal na capital"
                maxLength={180}
              />
            </Field>
          </div>

          <Field label="Categoria">
            <Select
              value={draft.category}
              onChange={(event) => update('category', event.target.value)}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
              <option value="Outra">Outra…</option>
            </Select>
          </Field>

          {draft.category === 'Outra' ? (
            <Field label="Nome da categoria">
              <TextInput
                value={draft.customCategory}
                onChange={(event) => update('customCategory', event.target.value)}
                placeholder="Ex.: Bastidores"
                maxLength={40}
              />
            </Field>
          ) : (
            <Field label="Local" hint="Aparece nos metadados da matéria.">
              <TextInput
                value={draft.location}
                onChange={(event) => update('location', event.target.value)}
                placeholder="Goiânia · GO"
                maxLength={80}
              />
            </Field>
          )}

          {draft.category === 'Outra' && (
            <Field label="Local">
              <TextInput
                value={draft.location}
                onChange={(event) => update('location', event.target.value)}
                placeholder="Goiânia · GO"
                maxLength={80}
              />
            </Field>
          )}

          <Field label="Autor">
            <TextInput
              value={draft.author}
              onChange={(event) => update('author', event.target.value)}
              placeholder="Comunicação ROTAM"
              maxLength={80}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field
              label="Resumo"
              hint="Frase curta exibida nos cards. Se ficar vazio, é gerado do conteúdo."
            >
              <TextArea
                value={draft.excerpt}
                onChange={(event) => update('excerpt', event.target.value)}
                rows={2}
                maxLength={400}
                placeholder="Um parágrafo curto que resume a notícia."
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <ImageField
              label="Imagem de capa"
              value={draft.coverImage}
              onChange={(url) => update('coverImage', url)}
              hint="Recomendado: imagens na horizontal, a partir de 1200px de largura."
            />
          </div>

          <div className="sm:col-span-2">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-fumaca">
                Conteúdo <span className="text-vermelho">*</span>
              </span>
              <button
                type="button"
                onClick={() => setPreview((value) => !value)}
                className="flex items-center gap-1.5 text-[0.66rem] uppercase tracking-[0.14em] text-ouro/80 transition-colors hover:text-ouro"
              >
                {preview ? <Wand2 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {preview ? 'Voltar ao editor' : 'Pré-visualizar'}
              </button>
            </div>

            {preview ? (
              <div className="max-h-80 overflow-y-auto border border-borda bg-[#0d0b0c] px-4 py-3">
                {draft.content.trim() ? (
                  <div className="prose-rotam text-sm">{renderMarkdown(draft.content)}</div>
                ) : (
                  <p className="text-xs text-fumaca-escura">Nada para visualizar ainda.</p>
                )}
              </div>
            ) : (
              <TextArea
                value={draft.content}
                onChange={(event) => update('content', event.target.value)}
                rows={14}
                placeholder={'Escreva a notícia aqui.\n\n## Subtítulo\nTexto do parágrafo.\n\n- item de lista\n- outro item\n\n> Citação do comando\n\nUse **negrito** para destacar trechos.'}
                className="font-mono !text-[0.82rem]"
              />
            )}
            <p className="mt-1 text-[0.66rem] text-fumaca-escura">
              Formatação: <span className="text-fumaca">## subtítulo</span>,{' '}
              <span className="text-fumaca">- lista</span>,{' '}
              <span className="text-fumaca">&gt; citação</span>,{' '}
              <span className="text-fumaca">**negrito**</span> e{' '}
              <span className="text-fumaca">[link](url)</span>.
            </p>
          </div>

          <Toggle
            checked={draft.published}
            onChange={(value) => update('published', value)}
            label="Publicado"
            description="Desligue para salvar como rascunho."
          />
          <Toggle
            checked={draft.featured}
            onChange={(value) => update('featured', value)}
            label="Destaque na capa"
            description="Aparece como matéria principal."
          />
        </div>
      </div>
    </Modal>
  );
}
