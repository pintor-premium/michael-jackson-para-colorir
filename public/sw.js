const CACHE_NAME = "mj-color-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/globals.css",
  "/favicon.ico",
  "/drawings/silhouettes/1.png",
  "/drawings/silhouettes/2.png",
  "/drawings/silhouettes/3.png",
  "/drawings/silhouettes/4.png",
  "/drawings/stage/1.png",
  "/drawings/stage/2.png",
  "/drawings/stage/3.png",
  "/drawings/stage/4.png",
  "/drawings/dance/1.png",
  "/drawings/dance/2.png",
  "/drawings/dance/3.png",
  "/drawings/dance/4.png",
  "/drawings/fashion/1.png",
  "/drawings/fashion/2.png",
  "/drawings/fashion/3.png",
  "/drawings/fashion/4.png",
  "/drawings/patterns/1.png",
  "/drawings/patterns/2.png",
  "/drawings/patterns/3.png",
  "/drawings/patterns/4.png",
];

// Instalar Service Worker e salvar cache inicial
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativar e limpar caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar requisições (Stale While Revalidate)
self.addEventListener("fetch", (event) => {
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {});
        
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
