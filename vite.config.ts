import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // O preview roda em dominio *.e2b.app, entao liberamos a origem.
      allowedHosts: ['3000-ignkkkufdxg4kvlshz3k4.e2b.app', '.e2b.app'],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      // O HMR usa uma porta interna para nao conflitar com a porta do preview.
      hmr:
        process.env.DISABLE_HMR === 'true'
          ? false
          : { port: 24679, clientPort: 24679 },
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
