import type { Metadata, Viewport } from 'next';
import './globals.css';
import OfflineSyncManager from '@/components/OfflineSyncManager';
import PwaRegistry from '@/components/PwaRegistry';

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Mobil uygulama (PWA) hissiyatı için zoom kapalı
};

export const metadata: Metadata = {
  title: 'FixLog.co | Profesyonel Saha ve İş Takip Sistemi',
  description: 'Asansör bakım ve saha operasyonlarınızı sıfır maliyet kaybıyla yönetin. Otonom iş atama, QR varlık takibi ve akıllı stok yönetimi.',
  keywords: ['saha servis yönetimi', 'asansör bakım programı', 'iş takip sistemi', 'teknik servis programı', 'qr barkod sistemi', 'stok takip programı', 'bakım yazılımı', 'saas', 'periyodik bakım', 'asansör', 'teknik servis', 'fixlog', 'fix', 'log', 'fixlog.co', 'fixlog.com', 'asansör bakım', 'elf asansör', 'elevator', 'lift', 'yolcu asansörü', 'asansör parçası', 'uzkan tuna', 'türkiye asansör', 'istanbul asansör', 'asansör firmaları'],
  authors: [{ name: 'FixLog.co' }],
  creator: 'FixLog.co',
  publisher: 'FixLog.co',
  robots: 'index, follow', // Google botlarının siteyi taramasına ve linkleri takip etmesine izin ver

  // WhatsApp, Twitter, Facebook vb. platformlarda paylaşıldığında çıkacak GÖRSEL ve Başlık ayarları (Open Graph)
  openGraph: {
    type: 'website',
    url: 'https://fixlog.co',
    title: 'FixLog.co | Saha Operasyonlarınızı Dijitalleştirin',
    description: 'Personelinizi, iş emirlerinizi ve müşteri ağınızı tek ekranda birleştirin. Uygulama indirmeden, sadece tarayıcınızdan yönetin.',
    siteName: 'FixLog.co',
    images: [{
      url: 'https://fixlog.co/icons/icon-512x512.png', // Büyük ve net logonu çeker
      width: 512,
      height: 512,
      alt: 'FixLog.co Saha ve İş Takip Sistemi'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FixLog.co | Saha ve İş Takip Sistemi',
    description: 'Saha servis süreçlerinizi tek ekranda toplayın. İşletmenizi uçtan uca, sıfır maliyet kaybıyla yönetin.',
    images: ['https://fixlog.co/icons/icon-512x512.png'],
  },

  // 🚀 CACHE-BUSTING İÇİN STATİK MANİFESTİ KALDIRDIK! 
  // DynamicPWA bileşeni, manifest'i dinamik zaman damgasıyla kendi basacak.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // iOS PWA'da en üstteki çentik rengini koyulaştırır
    title: "FixLog.co",
  },
  other: {
    "mobile-web-app-capable": "yes"
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        {/* 🚀 GOOGLE SEARCH CONSOLE DOĞRULAMA KODU */}
        <meta name="google-site-verification" content="OHA0sINLXAbEuPKjXi84t-Fp-X0FnZXFKE4aSOnAVus" />
      </head>
      <body>
        {children}
        <OfflineSyncManager />
        <PwaRegistry />
      </body>
    </html>
  );
}