import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/register', '/login'],
      disallow: [
        '/api/',
        '/*/dashboard',
        '/*/manager',
        '/*/worker',
        '/*/login',
        '/masterboss/',
      ],
    },
    sitemap: 'https://fixlog.co/sitemap.xml',
  };
}