const CACHE_NAME = "mj-color-v3";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/globals.css",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/pagina-carregamento.png",
  "/drawings/michael-atual/desenho-19.jpg",
  "/drawings/michael-atual/desenho-01.jpg",
  "/drawings/michael-atual/desenho-02.jpg",
  "/drawings/michael-atual/desenho-03.jpg",
  "/drawings/michael-atual/desenho-04.jpg",
  "/drawings/michael-atual/desenho-05.jpg",
  "/drawings/michael-atual/desenho-06.jpg",
  "/drawings/michael-atual/desenho-07.jpg",
  "/drawings/michael-atual/desenho-08.jpg",
  "/drawings/michael-atual/desenho-09.jpg",
  "/drawings/michael-atual/desenho-10.jpg",
  "/drawings/michael-atual/desenho-11.jpg",
  "/drawings/michael-atual/desenho-12.jpg",
  "/drawings/michael-atual/desenho-13.jpg",
  "/drawings/michael-atual/desenho-14.jpg",
  "/drawings/michael-atual/desenho-15.jpg",
  "/drawings/michael-atual/desenho-16.jpg",
  "/drawings/michael-atual/desenho-17.jpg",
  "/drawings/michael-atual/desenho-18.jpg",
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
