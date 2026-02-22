import { NextResponse } from 'next/server';

const API_URL = 'https://backend.isdokumu.workers.dev';

export async function GET(request, { params }) {
  const slug = params.slug;
  
  // Varsayılan (Fallback) PWA bilgileri
  let companyName = slug ? slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'İş Dökümü';
  let companyLogo192 = '/icon-192x192.png'; // Projendeki varsayılan standart icon yolları
  let companyLogo512 = '/icon-512x512.png'; 

  try {
    // Backend'den firmanın bilgilerini çek
    const res = await fetch(`${API_URL}/public/company-info?slug=${slug}`);
    
    if (res.ok) {
      const data = await res.json();
      if (data.company_name) companyName = data.company_name;
      
      // Eğer firmanın kendi logosu varsa onu kullan. PWA ikonları için ideal olan kare bir görseldir.
      if (data.logo) {
        // Not: Çoğu cihaz harici bir URL'yi ikon olarak kabul eder, 
        // ancak CORS veya HTTPS kurallarına uygun olmalıdır.
        companyLogo192 = data.logo; 
        companyLogo512 = data.logo; 
      }
    }
  } catch (err) {
    console.error("Manifest çekilirken hata:", err);
  }

  // Dinamik Manifest JSON'ı oluştur
  const manifest = {
    name: companyName,
    short_name: companyName.length > 12 ? companyName.substring(0, 12) : companyName, // Kısaltılmış ad (Uygulama simgesi altındaki yazı)
    description: `${companyName} Saha Yönetim Portalı`,
    start_url: `/${slug}/login`, // Uygulama açıldığında hangi URL'ye gitsin? (Personel Giriş Ekranı)
    display: "standalone", // Tam ekran uygulama hissi
    background_color: "#F8FAFC",
    theme_color: "#2563EB",
    icons: [
      {
        src: companyLogo192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: companyLogo512,
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };

  // Response olarak JSON döndür
  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      // Cache'i kısa tutalım ki firma logosunu/adını değiştirirse güncellensin
      'Cache-Control': 's-maxage=3600, stale-while-revalidate' 
    },
  });
}