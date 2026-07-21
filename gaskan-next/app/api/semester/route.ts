import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const cookieToken = req.cookies.get('auth_token')?.value || req.cookies.get('token')?.value || '';

    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['authorization'] = authHeader;
    } else if (cookieToken) {
      headers['authorization'] = `Bearer ${cookieToken}`;
    }

    const res = await fetch(`${API_BASE}/api/semesters`, {
      method: 'GET',
      headers,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('authorization') || '';
    const cookieToken = req.cookies.get('auth_token')?.value || req.cookies.get('token')?.value || '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['authorization'] = authHeader;
    } else if (cookieToken) {
      headers['authorization'] = `Bearer ${cookieToken}`;
    }

    const res = await fetch(`${API_BASE}/api/semesters`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
