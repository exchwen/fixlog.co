import type { Metadata, Viewport } from 'next';
import './globals.css';
import OfflineSyncManager from '@/components/OfflineSyncManager'; // YENİ EKLENDİ

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
    capable: true,
    statusBarStyle: "default",
    title: "İş Dökümü",
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
        <OfflineSyncManager /> {/* YENİ EKLENDİ - Arka Planda Eşitleme Yapar */}
      </body>
    </html>
  );
}