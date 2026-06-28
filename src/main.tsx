import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Clear all old caches programmatically on load to ensure stale resources are purged immediately
    if ('caches' in window) {
      caches.keys().then(names => {
        for (const name of names) {
          caches.delete(name).then(() => {
            console.log('Old cache deleted:', name);
          });
        }
      });
    }

    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Service Worker registrado com sucesso:', reg.scope);
        // Force update of service worker to prevent waiting
        reg.update();
      })
      .catch(err => console.error('Erro ao registrar Service Worker:', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
