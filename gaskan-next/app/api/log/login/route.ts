import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';
    const search = searchParams.get('search') || '';
    const date = searchParams.get('date') || '';

    let authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
    if (!authHeader) {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;
      if (token) {
        authHeader = `Bearer ${token}`;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const params = new URLSearchParams({
      action: 'LOGIN',
      page,
      limit,
    });
    if (search) params.append('search', search);
    if (date) params.append('date', date);

    // Call real Express backend /api/dashboard/logs?action=LOGIN
    const res = await fetch(`${API_BASE}/api/dashboard/logs?${params.toString()}`, {
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json || { data: [], pagination: { page: 1, limit: 50, total: 0 } });
    }

    return NextResponse.json({ data: [], pagination: { page: 1, limit: 50, total: 0 } });
  } catch (error) {
    return NextResponse.json({ data: [], pagination: { page: 1, limit: 50, total: 0 } });
  }
}
