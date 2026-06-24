const CACHE = 'chronos-v1.2.0';
const ASSETS = [
  '/chronos/',
  '/chronos/index.html',
  '/chronos/manifest.webmanifest',
  '/chronos/icon-180.png',
  '/chronos/icon-192.png',
  '/chronos/icon-512.png'
];

// Installation : mise en cache des ressources principales
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activation : supprimer les anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch : network first pour version.json, cache first pour le reste
self.addEventListener('fetch', e => {
  if (e.request.url.includes('version.json')) {
    // Toujours essayer le réseau pour la vérification MAJ
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  if (e.request.url.includes('fonts.googleapis') ||
      e.request.url.includes('fonts.gstatic') ||
      e.request.url.includes('jsdelivr') ||
      e.request.url.includes('cdn.')) {
    // CDN : network first avec fallback cache
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // Ressources locales : cache first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
