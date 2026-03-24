import type { Metadata, Viewport } from 'next';
import './globals.css';
import OfflineSyncManager from '@/components/OfflineSyncManager';
import PwaRegistry from '@/components/PwaRegistry';

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'FixLog.co | Profesyonel İş Takip Sistemi',
  description:
    'Global, ölçeklenebilir ve sürdürülebilir yeni nesil iş takip SaaS platformu.',

  // 🚀 CACHE-BUSTING İÇİN STATİK MANİFESTİ KALDIRDIK! 
  // DynamicPWA bileşeni, manifest'i dinamik zaman damgasıyla kendi basacak.

  appleWebApp: {
    statusBarStyle: "default",
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.pwaDeferredPrompt = e;
              });
            `,
          }}
        />
      </head>
      <body>
        {children}
        <OfflineSyncManager />
        <PwaRegistry />
      </body>
    </html>
  );
}