import { NextRequest } from 'next/server';

const PDF_API_URL = 'https://api.fixlog.co';

export const runtime = 'edge';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string; report: string } }
) {
  const tokenMatch = params.report.match(/-([a-zA-Z0-9]{10})$/);
  if (!tokenMatch) {
    return new Response('Geçersiz servis raporu bağlantısı.', { status: 400 });
  }

  const upstream = await fetch(`${PDF_API_URL}/p/${tokenMatch[1]}`, {
    cache: 'no-store'
  });
  const headers = new Headers(upstream.headers);
  headers.delete('content-length');
  headers.set('Content-Type', 'application/pdf');
  headers.set('Content-Disposition', 'inline; filename="servis-raporu.pdf"');

  return new Response(upstream.body, {
    status: upstream.status,
    headers
  });
}
