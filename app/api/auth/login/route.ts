import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = (body.NIS || body.identifier || '').toString();
    const password = (body.Password || body.password || '').toString();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'NIS/Email dan Password wajib diisi' },
        { status: 400 }
      );
    }

    // Call Express backend /api/auth/login (or /api/login)
    let upstreamRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier,
        password,
      }),
    });

    if (!upstreamRes.ok && upstreamRes.status === 404) {
      // Legacy fallback
      upstreamRes = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          NIS: identifier,
          Password: password,
          force: body.force || false,
        }),
      });
    }

    const json = await upstreamRes.json().catch(() => null);

    if (!upstreamRes.ok || !json) {
      const errMsg = json?.message || json?.error || 'NIS/Email atau password salah';
      return NextResponse.json(
        { success: false, message: errMsg, errors: json?.errors },
        { status: upstreamRes.status || 401 }
      );
    }

    // Extract user & token structure matching Nuxt session
    const token = json?.data?.token || json?.token || json?.sessionId || 'session_' + Date.now();
    const rawUser = json?.data?.user || json?.user || json;

    const formattedUser = {
      id: String(rawUser?.id || rawUser?.nis || identifier),
      name: rawUser?.name || rawUser?.nama || rawUser?.Nama || identifier,
      email: rawUser?.email || (identifier.includes('@') ? identifier : `${identifier}@smtijogja.sch.id`),
      role: String(rawUser?.role || rawUser?.Kelas || 'siswa').toLowerCase(),
      avatar: rawUser?.photoUrl || rawUser?.url_picture,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: formattedUser,
      data: {
        token,
        user: formattedUser,
      },
    });

    // Set HTTP cookie
    response.cookies.set('auth_token', token, {
      httpOnly: false,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
