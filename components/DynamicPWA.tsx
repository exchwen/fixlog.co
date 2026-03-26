'use client';

import { useEffect } from 'react';

interface DynamicPWAProps {
  companyName?: string;
  companyLogo?: string;
}

export default function DynamicPWA({ companyName, companyLogo }: DynamicPWAProps) {
  
  // 🚀 GÜVENLİ LİNK DÖNÜŞÜTÜRÜCÜ (PROXY)
  const getSafeImageUrl = (url: string | undefined) => {
    if (!url) return '';
    // Eğer link bizim R2 bucket ise, onu Vercel proxy'sine çevir
    if (url.includes('pub-a78064a5e9304242b0982c01b5778197.r2.dev')) {
       return url.replace('https://pub-a78064a5e9304242b0982c01b5778197.r2.dev', '/dosya-deposu');
    }
    return url;
  };

  useEffect(() => {
    const currentSlug = window.location.pathname.split('/')[1];
    let pwaStartUrl = window.location.origin + "/login?pwa=true";
    if (currentSlug === 'masterboss') {
        pwaStartUrl = window.location.origin + "/masterboss?pwa=true";
    } else if (currentSlug && currentSlug !== 'login' && currentSlug !== 'register' && currentSlug !== '') {
        pwaStartUrl = window.location.origin + `/${currentSlug}/login?pwa=true`;
    }

    const safeLogoUrl = getSafeImageUrl(companyLogo);

    const applyFallbackManifest = () => {
      const fallbackManifest = {
        name: companyName || "FixLog.co",
        short_name: companyName || "FixLog.co",
        description: "Saha operasyonları, personel ve iş takibi uygulaması.",
        start_url: pwaStartUrl,
        scope: window.location.origin + "/",
        id: window.location.origin + "/",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#0f172a",
        orientation: "portrait-primary",
        icons: [
          {
            src: companyLogo ? safeLogoUrl : "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: companyLogo ? safeLogoUrl : "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      };
      const stringManifest = JSON.stringify(fallbackManifest);
      const blob = new Blob([stringManifest], { type: 'application/json' });
      updateManifestTag(URL.createObjectURL(blob) + '#v=' + new Date().getTime());
      updateThemeColorMeta('#0f172a');
    };

    if (!companyLogo) {
      applyFallbackManifest();
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onerror = () => {
      applyFallbackManifest();
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue; 
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        
        let finalColor = '#0f172a';

        if (count > 0) {
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);

          const palette = [
            { name: 'white', rgb: [255, 255, 255], hex: '#ffffff' },
            { name: 'black', rgb: [15, 23, 42], hex: '#0f172a' }, 
            { name: 'blue', rgb: [37, 99, 235], hex: '#2563eb' }
          ];

          let maxDist = -1;
          for (const color of palette) {
            const dist = Math.sqrt(Math.pow(r - color.rgb[0], 2) + Math.pow(g - color.rgb[1], 2) + Math.pow(b - color.rgb[2], 2));
            if (dist > maxDist) {
              maxDist = dist;
              finalColor = color.hex;
            }
          }
        }

        const bgColorForIcon = finalColor === '#ffffff' ? '#f8fafc' : finalColor;

        const generateIcon = (size: number) => {
          const iconCanvas = document.createElement('canvas');
          iconCanvas.width = size;
          iconCanvas.height = size;
          const iconCtx = iconCanvas.getContext('2d');
          if (!iconCtx) return '';

          iconCtx.fillStyle = bgColorForIcon;
          iconCtx.fillRect(0, 0, size, size);

          const padding = size * 0.2;
          const maxDrawSize = size - (padding * 2);
          
          let drawWidth = maxDrawSize;
          let drawHeight = maxDrawSize;

          if (img.width > img.height) {
            drawHeight = (img.height / img.width) * maxDrawSize;
          } else {
            drawWidth = (img.width / img.height) * maxDrawSize;
          }

          const x = (size - drawWidth) / 2;
          const y = (size - drawHeight) / 2;

          iconCtx.drawImage(img, x, y, drawWidth, drawHeight);

          return iconCanvas.toDataURL('image/png');
        };

        const icon192 = generateIcon(192);
        const icon512 = generateIcon(512);

        const dynamicManifest = {
          name: companyName || "FixLog.co",
          short_name: companyName || "FixLog.co",
          description: "Saha operasyonları, personel ve iş takibi uygulaması.",
          start_url: pwaStartUrl,
          scope: window.location.origin + "/",
          id: window.location.origin + "/",
          display: "standalone",
          background_color: finalColor,
          theme_color: finalColor,
          orientation: "portrait-primary",
          gcm_sender_id: "103953800507",
          icons: [
            {
              src: icon192,
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable"
            },
            {
              src: icon512,
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ]
        };

        const stringManifest = JSON.stringify(dynamicManifest);
        const blob = new Blob([stringManifest], { type: 'application/json' });
        // 🚀 CACHE-BUSTING: İşletim sistemini yeni manifest olduğuna inandır
        const manifestUrl = URL.createObjectURL(blob) + '#v=' + new Date().getTime();

        updateManifestTag(manifestUrl);
        updateThemeColorMeta(finalColor);

      } catch (e) {
        console.error("Dinamik PWA icon oluşturulamadı, basit manifest basılıyor:", e);
        applyFallbackManifest();
      }
    };
    
    // 🚀 KESİN ÇÖZÜM: Güvenli link kullanılıyor
    img.src = safeLogoUrl + (safeLogoUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
  }, [companyName, companyLogo]);

  const updateManifestTag = (url: string) => {
    let linkTag = document.querySelector('link[rel="manifest"]');
    if (!linkTag) {
      linkTag = document.createElement('link');
      linkTag.setAttribute('rel', 'manifest');
      document.head.appendChild(linkTag);
    }
    linkTag.setAttribute('href', url);
  };

  const updateThemeColorMeta = (color: string) => {
    let metaTag = document.querySelector('meta[name="theme-color"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', color);

    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!appleMeta) {
      appleMeta = document.createElement('meta');
      appleMeta.setAttribute('name', 'apple-mobile-web-app-capable');
      appleMeta.setAttribute('content', 'yes');
      document.head.appendChild(appleMeta);
    }

    let appleStatusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleStatusMeta) {
      appleStatusMeta = document.createElement('meta');
      appleStatusMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      appleStatusMeta.setAttribute('content', 'default');
      document.head.appendChild(appleStatusMeta);
    }
  };

  return null;
}