/**
 * Estado da aplicação.
 *
 * Fonte principal: o servidor (todos os agentes veem as mesmas denúncias).
 * Se a API não responder — por exemplo, hospedando só o build estático — o
 * navegador passa a usar localStorage e o site continua 100% funcional.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EstadoApp, OperacaoSync } from '../types';
import { CONFIG_DISCORD_PADRAO, ESTADO_VAZIO } from '../types';

const CHAVE = 'corregedoria-pmpr-estado-v1';

export type Modo = 'carregando' | 'servidor' | 'local';

/** Garante que todas as coleções existam, mesmo vindo de versões antigas. */
function normalizar(parcial: Partial<EstadoApp> | null | undefined): EstadoApp {
  return {
    denuncias: Array.isArray(parcial?.denuncias) ? parcial!.denuncias : [],
    discord: { ...CONFIG_DISCORD_PADRAO, ...(parcial?.discord ?? {}) },
    envios: Array.isArray(parcial?.envios) ? parcial!.envios : [],
  };
}

function lerLocal(): EstadoApp {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return ESTADO_VAZIO;
    return normalizar(JSON.parse(bruto) as Partial<EstadoApp>);
  } catch {
    return ESTADO_VAZIO;
  }
}

function escreverLocal(estado: EstadoApp) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // Sem espaço: guarda os textos, removendo fotos do espelho.
    try {
      const enxuto: EstadoApp = {
        ...estado,
        denuncias: estado.denuncias.map((d) => ({ ...d, fotos: [] })),
      };
      localStorage.setItem(CHAVE, JSON.stringify(enxuto));
    } catch {
      /* navegador sem storage: segue só em memória */
    }
  }
}

export interface ControleEstado {
  estado: EstadoApp;
  modo: Modo;
  /** Atualiza o estado local imediatamente (UI otimista) e espelha no storage. */
  aplicar: (fn: (atual: EstadoApp) => EstadoApp) => void;
  /** Envia a operação ao servidor e adota o estado devolvido por ele. */
  sincronizar: (op: OperacaoSync) => Promise<void>;
}

export function useEstado(): ControleEstado {
  const [estado, setEstado] = useState<EstadoApp>(ESTADO_VAZIO);
  const [modo, setModo] = useState<Modo>('carregando');
  const estadoRef = useRef<EstadoApp>(ESTADO_VAZIO);
  const modoRef = useRef<Modo>('carregando');

  const adotar = useCallback((novo: EstadoApp, novoModo?: Modo) => {
    estadoRef.current = novo;
    setEstado(novo);
    if (novoModo) {
      modoRef.current = novoModo;
      setModo(novoModo);
    }
    escreverLocal(novo);
  }, []);

  useEffect(() => {
    let vivo = true;
    const controlador = new AbortController();
    const timer = setTimeout(() => controlador.abort(), 5000);

    (async () => {
      try {
        const r = await fetch('/api/estado', { signal: controlador.signal, cache: 'no-store' });
        if (!r.ok) throw new Error('api indisponível');
        const dados = (await r.json()) as { estado?: EstadoApp };
        if (!vivo || !dados.estado) throw new Error('resposta inválida');
        adotar(normalizar(dados.estado), 'servidor');
      } catch {
        if (!vivo) return;
        adotar(lerLocal(), 'local');
      } finally {
        clearTimeout(timer);
      }
    })();

    return () => {
      vivo = false;
      clearTimeout(timer);
      controlador.abort();
    };
  }, [adotar]);

  const aplicar = useCallback(
    (fn: (atual: EstadoApp) => EstadoApp) => {
      adotar(fn(estadoRef.current));
    },
    [adotar],
  );

  const sincronizar = useCallback(
    async (op: OperacaoSync) => {
      if (modoRef.current !== 'servidor') return;
      try {
        const r = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op }),
        });
        if (!r.ok) throw new Error('sync falhou');
        const dados = (await r.json()) as { estado?: EstadoApp };
        if (!dados.estado) throw new Error('resposta inválida');
        adotar(normalizar(dados.estado));
      } catch {
        // Servidor caiu no meio do uso: mantém a alteração local.
        modoRef.current = 'local';
        setModo('local');
      }
    },
    [adotar],
  );

  return { estado, modo, aplicar, sincronizar };
}
