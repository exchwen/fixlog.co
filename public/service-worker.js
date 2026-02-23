// 🚀 Pusher Beams SDK
importScripts("https://js.pusher.com/beams/service-worker.js");

// Versiyonu v5 yaptık ki tarayıcılar dosyanın değiştiğini anlasın
const CACHE_NAME = 'isdokumu-mobile-fix-v5';

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Beklemeden yeni versiyona geç
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eski cache temizleniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Tüm sekmeleri hemen kontrol altına al
  );
});

self.addEventListener('fetch', (event) => {
  // 🚀 KRİTİK AYAR: R2 (Logo/Resim) linklerine ASLA karışma!
  // Tarayıcı bu istekleri doğrudan yapsın, Service Worker araya girmesin.
  // Bu sayede CORS hatası oluşmaz ve resim "tainted" (kirli) işaretlenmez.
  if (event.request.url.includes('r2.dev') || event.request.url.includes('pub-d332de0237ac40de84c5f5b1ee26c3ee')) {
      return; 
  }

  // API ve Pusher isteklerine de dokunma, onlar dinamik.
  if (event.request.url.includes('/api') || event.request.url.includes('pusher.com')) {
     return;
  }

  // Diğer statik dosyalar (CSS, JS, yerel iconlar) için standart strateji
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});