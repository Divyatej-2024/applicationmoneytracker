const CACHE_NAME = 'money-tracker-cache-v1';
const ASSETS = ['./', './index.html', './styles.css', './script.js', './manifest.json', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          return networkResponse;
        })
        .catch(() => caches.match('./index.html'));
    }),
  );
});

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : { title: 'Savings reminder', body: 'Open your tracker for the latest update.' };
  const options = {
    body: payload.body,
    icon: 'icon.svg',
    badge: 'icon.svg',
  };
  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('./');
      }
    }),
  );
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'reminder-sync') {
    event.waitUntil(
      self.registration.showNotification('Savings reminder', {
        body: 'Open your tracker for the latest savings update.',
        icon: 'icon.svg',
        badge: 'icon.svg',
      }),
    );
  }
});
