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
      // Com middlewareMode o WS de HMR precisaria de uma porta extra no proxy.
      // Fica desligado: basta recarregar a página para ver alterações.
      hmr: false,
    },
  };
});
