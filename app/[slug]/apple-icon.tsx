import { ImageResponse } from 'next/og';
import React from 'react'; // 🚀 VS Code JSX hatalarını susturmak için eklendi

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const API_URL = 'https://api.fixlog.co';

export default async function AppleIcon({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  let logoUrl = null;
  let finalColor = '#0f172a'; 

  try {
    const res = await fetch(`${API_URL}/public/company-info?slug=${slug}`);
    if (res.ok) {
      const data = await res.json();
      if (data.logo) {
        logoUrl = data.logo;

        try {
          // 🚀 YENİ JIMP IMPORT STRATEJİSİ: Modülü import ederken yapısını destruct (parçalama) etmiyoruz
          const jimpModule = await import('jimp');
          
          // 'default' aramak yerine modülün kendisini (veya varsa metodlarını) direkt kullanıyoruz
          // TypeScript'i tamamen susturmak için her adımı 'any' üzerinden geçiriyoruz.
          const JimpAny: any = jimpModule;

          // Eğer kütüphanenin read fonksiyonu direkt kökteyse (JimpAny.read) kullan, 
          // yoksa (çok düşük bir ihtimal de olsa) JimpAny.default.read varsa onu kullan.
          const readFunction = JimpAny.read || (JimpAny.default && JimpAny.default.read);

          if (readFunction) {
              const image = await readFunction(logoUrl);
              let r = 0, g = 0, b = 0, count = 0;

              // @ts-ignore
              image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x: any, y: any, idx: any) {
                // @ts-ignore
                const alpha = this.bitmap.data[idx + 3];
                if (alpha >= 128) {
                  // @ts-ignore
                  r += this.bitmap.data[idx];
                  // @ts-ignore
                  g += this.bitmap.data[idx + 1];
                  // @ts-ignore
                  b += this.bitmap.data[idx + 2];
                  count++;
                }
              });

              if (count > 0) {
                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);

                const palette = [
                  { name: 'white', rgb: [255, 255, 255], hex: '#f8fafc' }, 
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
          }
        } catch (imgErr) {
          console.error("Jimp logo okuma hatası:", imgErr);
        }
      }
    }
  } catch (e) {}

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: finalColor,
          padding: '20px',
        }}
      >
        {logoUrl ? (
          <img src={logoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Logo" />
        ) : (
          <div style={{ fontSize: 80, fontWeight: 'bold', color: finalColor === '#f8fafc' ? '#2563eb' : 'white' }}>
            {slug.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}