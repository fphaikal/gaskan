import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization') || '';
    const cookieToken = req.cookies.get('auth_token')?.value || req.cookies.get('token')?.value || '';

    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['authorization'] = authHeader;
    } else if (cookieToken) {
      headers['authorization'] = `Bearer ${cookieToken}`;
    }

    const res = await fetch(`${API_BASE}/api/semesters/${id}/activate`, {
      method: 'PUT',
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
