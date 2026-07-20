import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';
    const search = searchParams.get('search') || '';
    const date = searchParams.get('date') || '';

    const authHeader = request.headers.get('authorization') || '';

    const params = new URLSearchParams({
      action: 'LOGIN',
      page,
      limit,
    });
    if (search) params.append('search', search);
    if (date) params.append('date', date);

    // Call real Express backend /api/dashboard/logs?action=LOGIN
    const res = await fetch(`${API_BASE}/api/dashboard/logs?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json?.data || json || []);
    }

    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json([]);
  }
}
