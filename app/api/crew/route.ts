import { NextResponse } from 'next/server';

// open-notify is HTTP-only, so we proxy it server-side to keep the page on HTTPS.
export const revalidate = 60;

export async function GET() {
  try {
    const res = await fetch('http://api.open-notify.org/astros.json', {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('open-notify ' + res.status);
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' },
    });
  } catch {
    return NextResponse.json({ error: 'open-notify unreachable', people: [] }, { status: 502 });
  }
}
