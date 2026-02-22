'use client';

import { useEffect } from 'react';

interface DynamicPWAProps {
  companyName?: string;
  companyLogo?: string;
}

export default function DynamicPWA({ companyName, companyLogo }: DynamicPWAProps) {
  useEffect(() => {
    // Logo yoksa varsayılan İş Dökümü manifestine geri dön
    if (!companyLogo) {
      resetToDefaultManifest();
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onerror = () => {
      resetToDefaultManifest();
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        // 1. ADIM: Senin referans kodundaki Renk Analizini Yapıyoruz
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
        
        let finalColor = '#0f172a'; // Varsayılan renk

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

        // Beyaz renk seçildiyse ikon arka planı çok parlamasın diye hafif gri yapıyoruz
        const bgColorForIcon = finalColor === '#ffffff' ? '#f8fafc' : finalColor;

        // 2. ADIM: Dinamik İkon Çizici Fonksiyon (Canvas)
        const generateIcon = (size: number) => {
          const iconCanvas = document.createElement('canvas');
          iconCanvas.width = size;
          iconCanvas.height = size;
          const iconCtx = iconCanvas.getContext('2d');
          if (!iconCtx) return '';

          // Arka planı akıllı renkle doldur
          iconCtx.fillStyle = bgColorForIcon;
          iconCtx.fillRect(0, 0, size, size);

          // Logoyu merkeze yerleştir (Etrafında %20 boşluk kalacak şekilde ölçeklendir)
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

          // Siyah arkaplana denk geldiyse ve logo siyahsa görünmez olur. 
          // (İsteğe bağlı: CSS filter benzeri bir kontrol eklenebilir ama şu an orijinal hali korundu)
          iconCtx.drawImage(img, x, y, drawWidth, drawHeight);

          return iconCanvas.toDataURL('image/png');
        };

        // 192x192 ve 512x512 PWA ikonlarını DataURL (Base64) olarak anında oluştur
        const icon192 = generateIcon(192);
        const icon512 = generateIcon(512);

        // 3. ADIM: Dinamik Manifest JSON'ını Oluştur
        const dynamicManifest = {
          name: companyName || "İş Dökümü",
          short_name: companyName || "İş Dökümü",
          description: "Saha operasyonları, personel ve iş takibi uygulaması.",
          start_url: window.location.pathname, // Hangi sayfadaysa oradan başlasın
          display: "standalone",
          background_color: finalColor,
          theme_color: finalColor,
          orientation: "portrait-primary",
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

        // 4. ADIM: Manifesti Tarayıcıya Enjekte Et
        const stringManifest = JSON.stringify(dynamicManifest);
        const blob = new Blob([stringManifest], { type: 'application/json' });
        const manifestUrl = URL.createObjectURL(blob);

        updateManifestTag(manifestUrl);
        updateThemeColorMeta(finalColor);

      } catch (e) {
        console.error("Dinamik PWA oluşturulamadı, varsayılana dönülüyor:", e);
        resetToDefaultManifest();
      }
    };
    
    img.src = companyLogo;

  }, [companyName, companyLogo]);

  // --- YARDIMCI FONKSİYONLAR ---

  const updateManifestTag = (url: string) => {
    // Mevcut manifesti bul veya yeni yarat
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
  };

  const resetToDefaultManifest = () => {
    updateManifestTag('/manifest.json'); // public klasöründeki orijinal statik manifestin yolu
    updateThemeColorMeta('#0f172a');
  };

  // Bu bileşen arayüzde yer kaplamayacak, sadece arka planda çalışacak
  return null;
}