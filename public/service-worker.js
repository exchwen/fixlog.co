// 🚀 Pusher Beams SDK'sını En Başa Alıyoruz
importScripts("https://js.pusher.com/beams/service-worker.js");

const CACHE_NAME = 'isdokumu-cache-v4-final';

// Kurulumda hemen aktif ol
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Aktif olunca eski cache'leri temizle ve kontrolü ele al
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

// 🚀 FETCH STRATEJİSİ: R2 GÖRSELLERİ İÇİN ÖZEL KORUMA
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. KURAL: R2 (Cloudflare) Görselleri
  if (url.hostname.includes('r2.dev') || event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Cache'te varsa ver, yoksa ağdan çek
        if (cachedResponse) return cachedResponse;

        // Ağdan çekerken CORS modunu 'cors' olarak zorla (Canvas için gerekli)
        // Eğer bu hata verirse, 'no-cors' moduna düşecek bir yapı kuruyoruz.
        return fetch(event.request, { 
            mode: 'cors', 
            credentials: 'omit',
            cache: 'no-cache' 
        }).then((networkResponse) => {
            // Sadece başarılı yanıtları cache'le
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
            });
            return networkResponse;
        }).catch(() => {
            // Eğer CORS hatası yüzünden fetch patlarsa, 'no-cors' (opaque) dene
            // Not: Bu resim Canvas'ta "tainted" hatası verebilir ama en azından ekranda görünür.
            return fetch(event.request, { mode: 'no-cors' });
        });
      })
    );
    return;
  }

  // 2. KURAL: Diğer her şey (Standart Network First stratejisi)
  // Pusher veya API isteklerine dokunma, bırak geçsinler.
  if (url.pathname.startsWith('/api') || url.hostname.includes('pusher.com')) {
     return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});