const CACHE_NAME = 'isdokumu-cache-v1';
importScripts("https://js.pusher.com/beams/1.0/push-notifications-web.js");

// Uygulama kurulduğunda Service Worker'ı hemen aktif et
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Aktif olduğunda tüm sekmelerin kontrolünü anında devral
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// PWA YÜKLEME BUTONUNUN ÇIKMASI İÇİN ZORUNLU OLAN FETCH DİNLEYİCİSİ
self.addEventListener('fetch', (event) => {
  // Senin OfflineSyncManager'ın POST isteklerini (veri kaydetme) yönettiği için
  // Service Worker sadece GET (sayfa/resim yükleme) isteklerine bakar.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});