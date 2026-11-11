import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // O preview roda num domínio *.e2b.app gerado dinamicamente.
      allowedHosts: true as const,
      // Com middlewareMode o WS de HMR abriria um listener extra em 24678
      // (que responde 426 e nao serve o site). ws:false e o que realmente
      // desliga esse socket no Vite 6; basta recarregar para ver alteracoes.
      hmr: false,
      ws: false as const,
    },
  };
});
