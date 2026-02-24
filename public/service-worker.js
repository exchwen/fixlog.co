// 🚀 Pusher Beams SDK
importScripts("https://js.pusher.com/beams/service-worker.js");

const CACHE_NAME = 'isdokumu-mobile-final-v6';

// 1. Yükleme (Install)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Aktifleştirme (Activate) - Eski Cache Temizliği
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch (Ağ İstekleri) - R2 ve API hariç önbellekleme
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('r2.dev') || event.request.url.includes('pub-d332de0237ac40de84c5f5b1ee26c3ee')) {
      return; 
  }
  if (event.request.url.includes('/api') || event.request.url.includes('pusher.com')) {
     return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// 🚀 4. BİLDİRİM TIKLAMA YÖNETİCİSİ (YENİ EKLENEN KISIM)
// Bu kısım, bildirime tıklanınca yeni Chrome sekmesi açmak yerine
// Mevcut PWA uygulamasını bulup öne getirir.
self.addEventListener('notificationclick', function(event) {
  const { notification } = event;
  const { data } = notification;

  notification.close(); // Bildirimi kapat

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Pusher'dan gelen linki al, yoksa ana sayfaya git
      const targetUrl = (data && data.pusher && data.pusher.deep_link) ? data.pusher.deep_link : '/';

      // Zaten açık bir uygulama penceresi var mı?
      for (const client of clientList) {
        // Eğer uygulama açıksa (URL eşleşiyorsa)
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          if (targetUrl) client.navigate(targetUrl); // İstenen sayfaya yönlendir
          return client.focus(); // Uygulamayı öne getir
        }
      }

      // Açık değilse yeni pencere (PWA modunda) aç
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});