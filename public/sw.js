/* Minimal service worker for offline-ish shell caching.
 * Note: This is intentionally simple (no Workbox) to keep the MVP small.
 */
const CACHE_NAME = "devotion-streak-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll([
          "/",
          "/home",
          "/history",
          "/stats",
          "/settings",
          "/manifest.json",
          "/manifest.webmanifest"
        ])
      )
      .then(() => self.skipWaiting())
      .catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches
        .keys()
        .then((keys) =>
          Promise.all(keys.map((k) => (k === CACHE_NAME ? Promise.resolve() : caches.delete(k))))
        )
        .catch(() => undefined)
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          // Cache same-origin navigations and static assets.
          const url = new URL(req.url);
          if (url.origin === self.location.origin) {
            const shouldCache =
              req.mode === "navigate" ||
              url.pathname.startsWith("/_next/") ||
              url.pathname.startsWith("/icons/") ||
              url.pathname.startsWith("/manifest") ||
              url.pathname.startsWith("/favicon");
            if (shouldCache) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => undefined);
            }
          }
          return res;
        })
        .catch(() => cached || Response.error());

      // Stale-while-revalidate.
      return cached || fetchPromise;
    })
  );
});
