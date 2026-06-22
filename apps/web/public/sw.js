/* Novakou — Service Worker (PWA v2.0)
 *
 * Stratégie volontairement CONSERVATRICE pour ne jamais servir de données
 * périmées ni casser l'auth :
 *  - Navigations (pages HTML) : network-first → fallback cache → page offline.
 *  - Assets statiques Next (/_next/static, images, polices) : cache-first
 *    (immuables, hashés).
 *  - API, auth, paiement : JAMAIS mis en cache (toujours réseau).
 *
 * Le cache est versionné : à chaque déploiement on bumpe CACHE_VERSION pour
 * purger l'ancien cache et éviter tout contenu obsolète.
 */

const CACHE_VERSION = "novakou-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;
const OFFLINE_URL = "/";

self.addEventListener("install", (event) => {
  // Active immédiatement la nouvelle version
  self.skipWaiting();
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.add(OFFLINE_URL)).catch(() => {}),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Purge les anciens caches d'une version précédente
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|svg|gif|webp|ico)$/.test(url.pathname)
  );
}

function isNeverCache(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/auth/") ||
    url.pathname.startsWith("/checkout") ||
    url.pathname.startsWith("/payment")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Ne traite que le même origine
  if (url.origin !== self.location.origin) return;
  // API / auth / paiement : toujours réseau, jamais de cache
  if (isNeverCache(url)) return;

  // Assets statiques : cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy)).catch(() => {});
            return res;
          }),
      ),
    );
    return;
  }

  // Navigations (pages) : network-first → cache → offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGE_CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL);
        }),
    );
  }
});

/* ── Notifications push (v2 Phase 4) ───────────────────────────────────────
 * Le serveur envoie un payload JSON { title, body, url, tag }. On affiche la
 * notification ; au clic, on ouvre/focus l'URL associée. */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Novakou", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Novakou";
  const options = {
    body: data.body || "",
    icon: "/icon?size=192",
    badge: "/icon?size=192",
    tag: data.tag || undefined,
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if (client.url.includes(self.location.origin)) {
          await client.focus();
          if ("navigate" in client) client.navigate(target).catch(() => {});
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
