/* Service worker legado — apenas limpa caches antigos e é desativado.
   O portal ROTAM GOIÁS não utiliza cache offline para evitar conteúdo
   desatualizado nas notícias. */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim()),
  );
});
