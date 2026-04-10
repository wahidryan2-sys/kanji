const CACHE_NAME = 'kanji-pro-v4-cache';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
  // Jika kamu punya file logo, tambahkan juga di sini:
  // './icon-192.png',
  // './icon-512.png'
];

// Menginstal Service Worker dan menyimpan file ke Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Mencegat request jaringan. Jika ada di cache, pakai yang dari cache (Bisa Offline)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - kembalikan response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Update Service Worker jika ada versi baru
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});