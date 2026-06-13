const CACHE_NAME = "salone-stars-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/src/main.tsx",
  "/src/App.tsx",
  "/src/index.css",
  "/manifest.json"
];

// Install Service Worker and Precache static resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Precaching app shell assets...");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[Service Worker] Local compile mode - pre-cache will expand dynamically:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate & clean stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Purging expired cache storage:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercept requests and fallback to cached copies when offline
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Bypass service worker caching for active api sync gateways so statistics remain accurate
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background refresh to keep cache fresh, but serve fast copy
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Ignore network errors */});

        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Dynamically cache non-API successful static responses
        if (
          networkResponse.status === 200 &&
          event.request.method === "GET" &&
          !url.pathname.includes("@vite") &&
          !url.pathname.includes("node_modules")
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline custom placeholder for HTML file requests
        if (event.request.headers.get("accept")?.includes("text/html")) {
          return caches.match("/");
        }
      });
    })
  );
});
