import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';

    const res = await fetch(`${API_BASE}/api/dev/system`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json?.data || json);
    }

    // Fallback response for dev telemetry widget
    return NextResponse.json({
      osInfo: { hostname: 'smti-server', distro: 'Ubuntu 24.04 LTS' },
      memory: { used: '3.8 GB', total: '16 GB' },
      disk: { used: '42%', total: '256 GB' },
    });
  } catch (error) {
    return NextResponse.json({
      osInfo: { hostname: 'smti-server', distro: 'Ubuntu 24.04 LTS' },
      memory: { used: '3.8 GB', total: '16 GB' },
      disk: { used: '42%', total: '256 GB' },
    });
  }
}
