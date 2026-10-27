const CACHE_NAME = 'mensageira-app-v2.5';
const OFFLINE_URL = '/offline.html';
// Ícones das notificações (pombinha): ficam guardados para não depender da internet quando o aviso chega
const NOTIFICATION_ICON = '/icons/notification-192.png';
const NOTIFICATION_BADGE = '/icons/badge-96.png';

// URLs essenciais para cache
const ESSENTIAL_FILES = ['/', '/offline.html', '/manifest.json', NOTIFICATION_ICON, NOTIFICATION_BADGE];

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

// O Android baixa o ícone e o badge na hora de mostrar o aviso; se o celular está dormindo ou sem
// internet, a imagem não vem e aparece o sininho padrão do Chrome. Entregamos a imagem guardada
// no cache como data: URL, que não precisa de rede (se não estiver guardada, busca e guarda).
async function notificationImage(path) {
  const url = new URL(path, self.location.origin).href;
  try {
    const cache = await caches.open(CACHE_NAME);
    let res = await cache.match(url);
    if (!res) {
      res = await fetch(url);
      if (!res.ok) return url;
      await cache.put(url, res.clone());
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return `data:${res.headers.get('content-type') || 'image/png'};base64,${btoa(bin)}`;
  } catch {
    return url;
  }
}

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
  // O servidor manda o caminho da pombinha; só um ícone diferente desse é buscado direto da rede
  const customIcon = data.icon && new URL(data.icon, self.location.origin).pathname !== NOTIFICATION_ICON;

  event.waitUntil(
    Promise.all([
      customIcon ? new URL(data.icon, self.location.origin).href : notificationImage(NOTIFICATION_ICON),
      notificationImage(NOTIFICATION_BADGE),
    ]).then(([icon, badge]) =>
      self.registration
        .showNotification(title, {
          body,
          icon,
          badge,
          tag: data.tag || undefined,
          renotify: !!data.tag,
          data: { url: data.url || '/' },
        })
        .catch(() =>
          self.registration.showNotification(title, {
            body,
            icon: new URL(NOTIFICATION_ICON, self.location.origin).href,
            badge: new URL(NOTIFICATION_BADGE, self.location.origin).href,
            data: { url: data.url || '/' },
          })
        )
    )
  );
});

// O navegador pode trocar a assinatura (expiração/rotação). Re-inscreve e avisa o servidor,
// senão os envios passam a ir para um endpoint morto e a pessoa para de receber.
// O navegador trocou (ou venceu) a inscrição: inscreve de novo sozinho e avisa o servidor, que passa
// os avisos do endereço antigo para o novo. Sem isso o aparelho parava de receber em silêncio.
self.addEventListener('pushsubscriptionchange', (event) => {
  const oldSub = event.oldSubscription;
  const oldKey = oldSub && oldSub.options && oldSub.options.applicationServerKey;
  const toBytes = (b64) => {
    const s = (b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
    return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  };
  event.waitUntil(
    (oldKey
      ? Promise.resolve(oldKey)
      : fetch('/api/push/subscribe').then((r) => r.json()).then((d) => (d.key ? toBytes(d.key) : undefined))
    )
      .then((key) => (event.newSubscription ? event.newSubscription : self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })))
      .then((sub) =>
        fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            user_id: '00000000-0000-4000-8000-000000000000',
            silent: true,
            replaces: oldSub ? oldSub.endpoint : undefined,
            subscription: sub.toJSON(),
          }),
        })
      )
      .catch(() => {})
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
