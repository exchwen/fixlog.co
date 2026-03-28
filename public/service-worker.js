// 🚀 Pusher Beams SDK
importScripts("https://js.pusher.com/beams/service-worker.js");

// Versiyonu yükseltiyoruz (v8 - Yüksek performans ve maliyet optimizasyonu)
const CACHE_NAME = 'isdokumu-mobile-final-v8';

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Beklemeden yeni versiyona geç
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 👑 KRİTİK HAMLE: Sadece bizim yarattığımız eski önbellekleri siliyoruz.
          // Sistemin kendi hızlandırıcı önbelleklerine ASLA dokunmuyoruz. 
          // Bu sayede uygulama roket gibi çalışacak ve veri maliyeti düşecek.
          if (cacheName.startsWith('isdokumu-mobile-final-') && cacheName !== CACHE_NAME) {
            console.log('Eski cache temizleniyor, sistem rahatlatılıyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Tüm sekmeleri hemen kontrol altına al
  );
});

self.addEventListener('fetch', (event) => {
  // 1. GÜVENLİK DUVARI: Sadece sayfa ve dosya getirme (GET) işlemlerine odaklan.
  // Form gönderme veya veri yazma işlemlerine karışıp sistemi bozma.
  if (event.request.method !== 'GET') {
    return;
  }

  const url = event.request.url;

  // 2. DIŞ BAĞLANTILAR: API, Cloudflare, Pusher ve R2 (Resim) bağlantılarına aracı olma.
  // Tarayıcı bu işlemleri kendi doğal hızında ve sorunsuz halletsin.
  if (
    url.includes('r2.dev') || 
    url.includes('pub-d332de0237ac40de84c5f5b1ee26c3ee') ||
    url.includes('workers.dev') || 
    url.includes('pusher.com') || 
    url.includes('cloudflareinsights.com') ||
    url.includes('/api/') // API istekleri için ekstra güvenlik
  ) {
      return; 
  }

  // 3. Kendi statik dosyalarımız için standart ve güvenli strateji
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((response) => {
        return response || new Response('', { status: 404, statusText: 'Not Found' });
      });
    })
  );
});

// 🚀 BİLDİRİM GÖSTERİM KONTROLÜ
// Sadece uygulama arka plandaysa veya ekran kapalıysa üstten bildirim göster.
PusherPushNotifications.onNotificationReceived = ({ pushEvent, payload, handleNotification }) => {
  pushEvent.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      let isAppVisible = false;
      
      for (const client of clientList) {
        if (client.visibilityState === 'visible') {
          isAppVisible = true;
          break;
        }
      }

      if (!isAppVisible) {
        return handleNotification(payload);
      }
    })
  );
};

// 🚀 BİLDİRİM TIKLAMA YÖNETİCİSİ (PWA FOCUS MODU)
// Bildirime tıklayınca yeni sekme açmak yerine mevcut uygulamayı öne getir.
self.addEventListener('notificationclick', function(event) {
  const { notification } = event;
  const { data } = notification;

  notification.close(); // Bildirimi ekrandan kaldır

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      const targetUrl = (data && data.pusher && data.pusher.deep_link) ? data.pusher.deep_link : '/';

      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          if (targetUrl) client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});