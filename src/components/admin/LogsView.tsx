import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Monitor, RefreshCw, Smartphone, Trash2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { formatDateTime, relativeTime } from '../../lib/format';
import type { AccessLog } from '../../types';
import { StatCard } from './controls';

function deviceLabel(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/iphone|android|mobile|ipad/.test(ua)) return 'Celular';
  if (/windows|macintosh|linux/.test(ua)) return 'Computador';
  return 'Outro';
}

export function LogsView({
  onExpired,
  notify,
}: {
  onExpired: () => void;
  notify: (message: string, type?: 'ok' | 'err') => void;
}) {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.logs();
      setLogs(data.logs);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onExpired();
      notify('Não foi possível carregar os acessos.', 'err');
    } finally {
      setLoading(false);
    }
  }, [notify, onExpired]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const visitsToday = logs.filter((log) => new Date(log.timestamp) >= today).length;
    const uniqueIps = new Set(logs.map((log) => log.ip)).size;
    const last = logs[0];
    return { visitsToday, uniqueIps, last };
  }, [logs]);

  const clear = async () => {
    if (!window.confirm('Limpar todo o histórico de acessos?')) return;
    try {
      await api.clearLogs();
      setLogs([]);
      notify('Histórico de acessos limpo.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onExpired();
      notify('Não foi possível limpar o histórico.', 'err');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl uppercase tracking-wide text-white">Acessos</h2>
          <p className="text-xs text-fumaca">
            Registro de visitas recebidas pelo portal (últimas 2.000).
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="btn btn-outline !py-2.5" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar
          </button>
          <button type="button" onClick={clear} className="btn btn-ghost !py-2.5 hover:!text-vermelho">
            <Trash2 className="h-4 w-4" />
            Limpar
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Monitor} label="Visitas hoje" value={stats.visitsToday} />
        <StatCard icon={Smartphone} label="Visitantes únicos" value={stats.uniqueIps} accent="vermelho" />
        <div className="border border-borda bg-carvao p-5">
          <p className="text-[0.64rem] uppercase tracking-[0.2em] text-fumaca-escura">
            Último acesso
          </p>
          <p className="mt-2 font-display text-xl text-white">
            {stats.last ? relativeTime(stats.last.timestamp) : '—'}
          </p>
          <p className="mt-1 text-[0.68rem] text-fumaca-escura">
            {stats.last ? stats.last.path : 'Sem registros ainda'}
          </p>
        </div>
      </div>

      {loading && logs.length === 0 ? (
        <div className="flex items-center justify-center gap-3 border border-borda bg-carvao py-16 text-sm text-fumaca">
          <Loader2 className="h-5 w-5 animate-spin text-ouro" />
          Carregando acessos...
        </div>
      ) : logs.length === 0 ? (
        <div className="border border-dashed border-borda bg-carvao/40 px-6 py-16 text-center">
          <p className="font-display text-xl uppercase tracking-wide text-white">
            Nenhum acesso registrado
          </p>
          <p className="mt-1 text-sm text-fumaca">
            As visitas ao site aparecem aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-borda bg-carvao">
          <table className="w-full min-w-[42rem] text-left text-xs">
            <thead className="border-b border-white/10 bg-[#0d0b0c] text-[0.6rem] uppercase tracking-[0.18em] text-fumaca-escura">
              <tr>
                <th className="px-4 py-3 font-medium">Data / hora</th>
                <th className="px-4 py-3 font-medium">Página</th>
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.slice(0, 200).map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-4 py-2.5 text-fumaca">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="max-w-[14rem] truncate px-4 py-2.5 text-white" title={log.path}>
                    {log.path}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[0.68rem] text-fumaca-escura">
                    {log.ip}
                  </td>
                  <td className="px-4 py-2.5 text-fumaca">{deviceLabel(log.userAgent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
