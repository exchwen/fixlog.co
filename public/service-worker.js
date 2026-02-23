// 🚀 Pusher Arka Plan Dinleyicisi
importScripts("https://js.pusher.com/beams/service-worker.js");

const CACHE_VERSION = 'v3-pusher-cors-fix'; 

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // 🚀 HAYAT KURTARAN DOKUNUŞ: R2 Linklerine SW karışmasın, doğrudan ağdan çekilsin!
  if (event.request.url.includes('r2.dev')) {
      return; 
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
          return cachedResponse;
      }
      // Eğer resim bulunamazsa panik yapıp çökmek yerine boş/sahte bir yanıt dön (Kırmızı hatayı önler)
      return new Response('', { status: 404, statusText: 'Not Found' });
    })
  );
});