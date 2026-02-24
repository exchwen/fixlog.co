// 🚀 Pusher Beams SDK
importScripts("https://js.pusher.com/beams/service-worker.js");

// Versiyonu yükselttik (v6) ki tarayıcılar değişikliği hemen anlasın
const CACHE_NAME = 'isdokumu-mobile-final-v6';

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

// 🚀 BİLDİRİM TIKLAMA YÖNETİCİSİ (PWA FOCUS MODU)
// Bu kod sayesinde bildirime tıklayınca Chrome sekmesi değil, Uygulama açılır.
self.addEventListener('notificationclick', function(event) {
  const { notification } = event;
  const { data } = notification;

  notification.close(); // Bildirimi ekrandan kaldır

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // 1. Hedef URL'yi al (Pusher'dan gelen deep_link)
      const targetUrl = (data && data.pusher && data.pusher.deep_link) ? data.pusher.deep_link : '/';

      // 2. Zaten açık bir uygulama penceresi var mı kontrol et
      for (const client of clientList) {
        // Eğer uygulama açıksa (URL bizim domain ise)
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          // Sayfayı hedefe yönlendir ve öne getir
          if (targetUrl) client.navigate(targetUrl);
          return client.focus();
        }
      }

      // 3. Açık pencere yoksa, PWA modunda yeni pencere aç
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});