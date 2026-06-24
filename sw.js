// ════════════════════════════════════════
// CHRONOS — Service Worker v1.3.0
// Stratégie : HTML toujours depuis le réseau
// ════════════════════════════════════════
const CACHE = 'chronos-v1.3.0';
const STATIC = [
  '/chronos/icon-180.png',
  '/chronos/icon-192.png',
  '/chronos/icon-512.png',
  '/chronos/manifest.webmanifest'
];

self.addEventListener('install', e => {
  // Prendre le contrôle immédiatement sans attendre
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    Promise.all([
      // Supprimer TOUS les anciens caches
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
      ),
      // Prendre le contrôle de tous les onglets ouverts
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // ── HTML principal : TOUJOURS depuis le réseau ──
  if (url.endsWith('/chronos/') ||
      url.endsWith('/chronos') ||
      url.includes('index.html')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .catch(() => caches.match('/chronos/'))
    );
    return;
  }

  // ── version.json : TOUJOURS depuis le réseau ──
  if (url.includes('version.json')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .catch(() => new Response('{}'))
    );
    return;
  }

  // ── Icônes et manifest : cache first ──
  if (url.includes('icon-') || url.includes('manifest')) {
    e.respondWith(
      caches.match(e.request)
        .then(r => r || fetch(e.request))
    );
    return;
  }

  // ── CDN (fonts, SheetJS, JSZip) : réseau first avec cache fallback ──
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r.ok) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
