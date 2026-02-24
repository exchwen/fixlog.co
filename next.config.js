import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
  // 🚀 KİLİT NOKTA: Otomatik kaydı kapatıyoruz ki senin özel dosyan çalışsın
  register: false, 
  skipWaiting: false,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/dosya-deposu/:path*",
        destination: "https://pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev/:path*",
      },
    ];
  },
};

export default withPWA(nextConfig);