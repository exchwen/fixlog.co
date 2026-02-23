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
    
  // 🚀 İŞTE EKSİK OLAN VE CHROME'U TETİKLEYECEK SATIR!
  manifest: "/manifest.json", 

  appleWebApp: {
    statusBarStyle: "default",
    title: "İş Dökümü",
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
      <body>
        {children}
        <OfflineSyncManager />
        <PwaRegistry />
      </body>
    </html>
  );
}