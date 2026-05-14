const CACHE_NAME = 'kanji-pro-v5-cache'; // 💡 Naik ke v5 biar HP sadar ada update!
const DYNAMIC_CACHE = 'kanji-pro-v5-dynamic'; 

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './tailwind.css' // 💡 File CSS lokalmu masuk ke bunker utama!
];

// 💡 Daftar server luar yang wajib dicegat dan disimpan ke HP
const externalDomainsToCache = [
  // cdn.tailwindcss.com sudah dihapus dari sini karena kita pakai lokal
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'api.dicebear.com' // Bonus: Avatar mu juga bakal kesimpan biar gak error pecah tulisan "Avata..." pas offline!
];

// Menginstal Service Worker dan menyimpan file inti ke Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Bunker Utama dibuka');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Memaksa update sw.js langsung aktif
});

// Update Service Worker jika ada versi baru, dan hapus brankas lama
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(self.clients.claim());
});

// Mencegat request jaringan!
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Abaikan request ke Google Translate agar suara tidak error/diblokir cache
  if (url.includes('translate.google.com')) {
    return;
  }

  // Cek apakah request ini menuju ke server luar (Ikon, Avatar, Font)
  const isExternalAsset = externalDomainsToCache.some(domain => url.includes(domain));

  if (isExternalAsset) {
    // 💡 STRATEGI DYNAMIC CACHING (Network First, lalu simpan ke Cache)
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return fetch(event.request)
          .then((networkResponse) => {
            // Berhasil ke internet? Ambil datanya, COPY (clone), lalu masukkan ke brankas dinamis
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          })
          .catch(() => {
            // Gagal ke internet (OFFLINE)? Buka brankas dinamis dan kasih datanya ke layar!
            return cache.match(event.request);
          });
      })
    );
  } else {
    // 💡 STRATEGI NORMAL LOKAL (Cache First, fallback to Network)
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Kalau ada di cache lokal (index.html, tailwind.css), pakai itu
          if (response) {
            return response;
          }
          // Kalau nggak ada, terpaksa minta ke internet
          return fetch(event.request);
        })
    );
  }
});