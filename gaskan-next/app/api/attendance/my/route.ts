import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || '';
    const year = searchParams.get('year') || '';
    const semesterId = searchParams.get('semesterId') || '';

    let authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
    let tokenValue = '';

    if (authHeader.startsWith('Bearer ')) {
      tokenValue = authHeader.replace('Bearer ', '').trim();
    } else {
      const cookieStore = await cookies();
      tokenValue = cookieStore.get('auth_token')?.value || cookieStore.get('token')?.value || cookieStore.get('sessionId')?.value || '';
      if (tokenValue) {
        authHeader = `Bearer ${tokenValue}`;
      }
    }

    const encodedToken = encodeURIComponent(tokenValue);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
      headers['X-Session-Id'] = tokenValue;
      headers['Cookie'] = `token=${encodedToken}; sessionId=${encodedToken}`;
    }

    const params = new URLSearchParams();
    if (month) params.set('month', month);
    if (year) params.set('year', year);
    if (semesterId) params.set('semesterId', semesterId);

    const url = `${API_BASE}/api/attendance/my?${params.toString()}`;

    const res = await fetch(url, {
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json);
    }

    const errJson = await res.json().catch(() => null);
    return NextResponse.json(errJson || { success: false, message: 'Gagal mengambil data absensi' }, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
