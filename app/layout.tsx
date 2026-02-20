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
  title: 'İş Dökümü | Profesyonel İş Takip Sistemi',
  description:
    'Global, ölçeklenebilir ve sürdürülebilir yeni nesil iş takip SaaS platformu.',
  manifest: "/manifest.json",
  appleWebApp: {
    // capable: true, -> Konsoldaki sarı uyarının sebebi buydu, kaldırıldı.
    statusBarStyle: "default",
    title: "İş Dökümü",
  },
  other: {
    "mobile-web-app-capable": "yes" // YENİ STANDART: Sarı uyarının istediği yeni etiket eklendi
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
      <body>
        {children}
        <OfflineSyncManager />
        <PwaRegistry />
      </body>
    </html>
  );
}