// Service worker legado do projeto anterior. Este portal não usa cache offline
// agressivo: ao instalar, limpamos os caches antigos e nos desregistramos.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(nomes.map((nome) => caches.delete(nome)));
      await self.registration.unregister();
      const clientes = await self.clients.matchAll({ type: 'window' });
      clientes.forEach((cliente) => cliente.navigate(cliente.url));
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
