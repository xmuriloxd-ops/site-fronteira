import { useEffect, useState } from 'react';
import { KeyRound, Loader2, Save, ShieldCheck } from 'lucide-react';
import { api, ApiError, setToken } from '../../lib/api';
import type { Settings } from '../../types';
import { Alert, Field, ImageField, TextArea, TextInput } from './controls';

export function SettingsManager({
  settings,
  onSaved,
  onExpired,
  notify,
}: {
  settings: Settings;
  onSaved: (settings: Settings) => void;
  onExpired: () => void;
  notify: (message: string, type?: 'ok' | 'err') => void;
}) {
  const [form, setForm] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => setForm(settings), [settings]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const data = await api.settings(form);
      onSaved(data.settings);
      notify('Configurações salvas.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onExpired();
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    setPasswordError(null);
    if (passwords.next.length < 6)
      return setPasswordError('A nova senha precisa ter ao menos 6 caracteres.');
    if (passwords.next !== passwords.confirm)
      return setPasswordError('A confirmação não corresponde à nova senha.');

    setChangingPassword(true);
    try {
      const data = await api.changePassword(passwords.current, passwords.next);
      setToken(data.token);
      setPasswords({ current: '', next: '', confirm: '' });
      notify('Senha alterada com sucesso.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setPasswordError('A senha atual está incorreta.');
        return;
      }
      setPasswordError(err instanceof ApiError ? err.message : 'Não foi possível alterar a senha.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl uppercase tracking-wide text-white">Configurações</h2>
        <p className="text-xs text-fumaca">
          Identidade da unidade e informações exibidas no site público.
        </p>
      </div>

      <div className="border border-borda bg-carvao p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-ouro" />
          <h3 className="font-display text-lg uppercase tracking-wide text-white">Identidade</h3>
        </div>

        {error && (
          <div className="mb-4">
            <Alert>{error}</Alert>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome do site">
            <TextInput
              value={form.siteName}
              onChange={(event) => update('siteName', event.target.value)}
              maxLength={60}
            />
          </Field>
          <Field label="Servidor / cidade">
            <TextInput
              value={form.server}
              onChange={(event) => update('server', event.target.value)}
              maxLength={60}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Unidade">
              <TextInput
                value={form.unit}
                onChange={(event) => update('unit', event.target.value)}
                maxLength={120}
              />
            </Field>
          </div>
          <Field label="Título da capa">
            <TextInput
              value={form.heroTitle}
              onChange={(event) => update('heroTitle', event.target.value)}
              maxLength={40}
            />
          </Field>
          <Field label="Ano de criação da doutrina">
            <TextInput
              value={form.foundedYear}
              onChange={(event) => update('foundedYear', event.target.value)}
              maxLength={10}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Subtítulo da capa">
              <TextArea
                value={form.heroSubtitle}
                onChange={(event) => update('heroSubtitle', event.target.value)}
                rows={3}
                maxLength={1200}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Texto institucional (Sobre)">
              <TextArea
                value={form.about}
                onChange={(event) => update('about', event.target.value)}
                rows={5}
                maxLength={1200}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <ImageField
              label="Imagem de fundo da capa"
              value={form.heroImage}
              onChange={(url) => update('heroImage', url)}
            />
          </div>
        </div>
      </div>

      <div className="border border-borda bg-carvao p-5">
        <h3 className="mb-4 font-display text-lg uppercase tracking-wide text-white">
          Canais de contato
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram" hint="Link completo do perfil.">
            <TextInput
              value={form.instagram}
              onChange={(event) => update('instagram', event.target.value)}
              placeholder="https://instagram.com/..."
            />
          </Field>
          <Field label="Discord">
            <TextInput
              value={form.discord}
              onChange={(event) => update('discord', event.target.value)}
              placeholder="https://discord.gg/..."
            />
          </Field>
          <Field label="E-mail">
            <TextInput
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              placeholder="comunicacao@..."
            />
          </Field>
          <Field label="WhatsApp / telefone">
            <TextInput
              value={form.whatsapp}
              onChange={(event) => update('whatsapp', event.target.value)}
              placeholder="(62) 9....."
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn btn-gold !py-2.5 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar configurações
        </button>
      </div>

      {/* Senha */}
      <div className="border border-borda bg-carvao p-5">
        <div className="mb-1 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-ouro" />
          <h3 className="font-display text-lg uppercase tracking-wide text-white">
            Senha do administrador
          </h3>
        </div>
        <p className="mb-4 text-xs text-fumaca">
          Recomendado trocar a senha inicial após o primeiro acesso.
        </p>

        {passwordError && (
          <div className="mb-4">
            <Alert>{passwordError}</Alert>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Senha atual">
            <TextInput
              type="password"
              value={passwords.current}
              onChange={(event) =>
                setPasswords((current) => ({ ...current, current: event.target.value }))
              }
              autoComplete="current-password"
            />
          </Field>
          <Field label="Nova senha">
            <TextInput
              type="password"
              value={passwords.next}
              onChange={(event) =>
                setPasswords((current) => ({ ...current, next: event.target.value }))
              }
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirmar nova senha">
            <TextInput
              type="password"
              value={passwords.confirm}
              onChange={(event) =>
                setPasswords((current) => ({ ...current, confirm: event.target.value }))
              }
              autoComplete="new-password"
            />
          </Field>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={changePassword}
            disabled={changingPassword}
            className="btn btn-outline !py-2.5 disabled:opacity-60"
          >
            {changingPassword ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Alterar senha
          </button>
        </div>
      </div>
    </div>
  );
}
