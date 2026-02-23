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
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 🚀 EKLEDİĞİMİZ KISIM BURASI (REWRITES)
  async rewrites() {
    return [
      {
        // Bizim uydurduğumuz güvenli yol
        source: "/dosya-deposu/:path*",
        // Arka plandaki gerçek (sorunlu görünen) R2 adresi
        destination: "https://pub-d332de0237ac40de84c5f5b1ee26c3ee.r2.dev/:path*",
      },
    ];
  },
};

export default withPWA(nextConfig);