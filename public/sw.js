const CACHE_NAME = 'mensageira-app-v2.2';
const OFFLINE_URL = '/offline.html';

// URLs essenciais para cache
const ESSENTIAL_FILES = ['/', '/offline.html', '/manifest.json'];

// Instalar service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ESSENTIAL_FILES))
      .then(() => self.skipWaiting())
  );
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(cacheNames.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
      .then(() =>
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) =>
            client.postMessage({ type: 'SW_UPDATED', message: 'Service Worker atualizado com sucesso!' })
          );
        })
      )
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // Nunca cachear Next.js internals, API nem auth
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/api/')) {
    if (url.pathname.startsWith('/api/')) {
      // Network first para dados da API, cache como fallback offline
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => caches.match(request))
      );
    }
    return;
  }

  // Streaming de áudio: rede primeiro
  if (request.destination === 'audio' || /\.(mp3|m3u8)$/.test(url.pathname) || url.pathname.includes('stream')) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Páginas: network first, offline fallback
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // Imagens e estáticos: cache first com atualização em background
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response && response.status === 200) cache.put(request, response.clone());
              return response;
            })
            .catch(() => cached);
          return cached || network;
        })
      )
    );
  }
});

// Mensagens do app
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE' || event.data.type === 'CLEAR_ALL_CACHE') {
    caches
      .keys()
      .then((names) => Promise.all(names.map((n) => caches.delete(n))))
      .then(() => event.ports && event.ports[0] && event.ports[0].postMessage({ success: true }))
      .catch((error) => event.ports && event.ports[0] && event.ports[0].postMessage({ success: false, error: error.message }));
  }
});

// Notificações push
// Regra do Chrome: todo push PRECISA exibir uma notificação; se falhar, o navegador mostra
// uma genérica em branco ("site atualizado em segundo plano"). Por isso sempre mostramos algo.
const DEFAULT_ICON = new URL('/icons/notification-192.png', self.location.origin).href;
const DEFAULT_BADGE = new URL('/icons/badge-96.png', self.location.origin).href;

self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) data = event.data.json() || {};
  } catch {
    try {
      data = { body: event.data ? event.data.text() : '' };
    } catch {
      data = {};
    }
  }

  const title = (data.title && String(data.title).trim()) || 'Mensageira de Deus';
  const body = (data.body && String(data.body).trim()) || 'Toque para abrir o app.';
  const options = {
    body,
    icon: data.icon ? new URL(data.icon, self.location.origin).href : DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    tag: data.tag || undefined,
    renotify: !!data.tag,
    data: { url: data.url || '/' },
  };

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .catch(() => self.registration.showNotification(title, { body, data: { url: data.url || '/' } }))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
