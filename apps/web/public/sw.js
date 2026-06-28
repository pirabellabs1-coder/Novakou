/* Novakou — Service Worker (PWA v3.0)
 *
 * Stratégie optimisée pour les réseaux mobiles instables (cible Afrique) :
 *  - Navigations (pages HTML) : network-first AVEC TIMEOUT. Si une page est
 *    déjà en cache et que le réseau traîne > 3 s, on sert le cache instantané
 *    (jamais d'écran blanc figé). Premier accès sans cache : on attend le
 *    réseau (pas de coupure brutale). Échec total → page d'accueil offline.
 *  - Assets statiques Next (/_next/static, images, polices) : cache-first
 *    (immuables, hashés).
 *  - API, auth, paiement : JAMAIS mis en cache (toujours réseau).
 *  - On ne met JAMAIS en cache une réponse non-OK (503 maintenance, 5xx,
 *    redirections) — sinon on servirait une page d'erreur figée ensuite.
 *
 * Le cache est versionné : bumper CACHE_VERSION purge l'ancien cache.
 */

const NAV_TIMEOUT_MS = 3000;
const CACHE_VERSION = "novakou-v3";
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

// Assets statiques : cache-first (hashés/immuables). On ne cache que les
// réponses OK pour ne jamais figer une erreur réseau transitoire.
async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && res.ok) {
    const copy = res.clone();
    caches.open(STATIC_CACHE).then((c) => c.put(request, copy)).catch(() => {});
  }
  return res;
}

// Navigations : network-first avec timeout, fallback cache instantané.
async function networkFirstNav(request) {
  const cached = await caches.match(request);

  const network = fetch(request)
    .then((res) => {
      // On ne met en cache QUE les pages réellement servies (200 OK), jamais
      // un 503 maintenance, un 5xx ou une redirection.
      if (res && res.ok && res.type === "basic") {
        const copy = res.clone();
        caches.open(PAGE_CACHE).then((c) => c.put(request, copy)).catch(() => {});
      }
      return res;
    });

  // Pas de version en cache → on attend le réseau (ne pas couper un 1er chargement lent).
  if (!cached) {
    try {
      return await network;
    } catch {
      return (await caches.match(OFFLINE_URL)) || Response.error();
    }
  }

  // Page en cache dispo → on tente le réseau mais on bascule sur le cache
  // si ça traîne (> NAV_TIMEOUT_MS) ou si ça échoue. Jamais d'écran figé.
  try {
    return await Promise.race([
      network.catch(() => cached),
      new Promise((resolve) => setTimeout(() => resolve(cached), NAV_TIMEOUT_MS)),
    ]);
  } catch {
    return cached;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Ne traite que le même origine
  if (url.origin !== self.location.origin) return;
  // API / auth / paiement : toujours réseau, jamais de cache
  if (isNeverCache(url)) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStatic(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNav(request));
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
