import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

export async function GET(request: Request) {
  try {
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

    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json?.data || json);
    }

    return NextResponse.json(null);
  } catch (error) {
    return NextResponse.json(null);
  }
}
