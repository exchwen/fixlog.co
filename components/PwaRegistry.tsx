'use client';

import { useEffect } from 'react';

export default function PwaRegistry() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const registerServiceWorker = () => {
      navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' }).then(
        (registration) => console.log('Service Worker registered:', registration.scope),
        (error) => console.error('Service Worker registration failed:', error)
      );
    };

    if (document.readyState === 'complete') {
      registerServiceWorker();
      return;
    }

    window.addEventListener('load', registerServiceWorker, { once: true });
    return () => window.removeEventListener('load', registerServiceWorker);
  }, []);

  return null;
}
