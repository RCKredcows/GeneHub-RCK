// Service worker for GeneHub. Caches nothing on purpose.
//
// It exists only so Chrome will offer to install the app, which requires a
// registered fetch handler. Offline support was never real -- Supabase requests
// were always excluded and React Query keeps its cache in memory -- and the
// caching it did do duplicated nginx while serving stale shells after a deploy.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clears caches left by earlier versions, which is how a device holding a
  // stale shell recovers.
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

// No respondWith, so the browser handles every request itself.
self.addEventListener('fetch', () => {});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
