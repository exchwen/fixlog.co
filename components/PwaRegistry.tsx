'use client';

import { useEffect } from 'react';

export default function PwaRegistry() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/service-worker.js').then(
          function (registration) {
            console.log('Service Worker başarıyla kaydedildi: ', registration.scope);
          },
          function (err) {
            console.log('Service Worker kaydı başarısız: ', err);
          }
        );
      });
    }
  }, []);

  return null; // Ekranda bir şey göstermez, sadece arkaplanda çalışır
}