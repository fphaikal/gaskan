import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Call real Express backend /api/dashboard/stats with forwarded auth headers
    const res = await fetch(`${API_BASE}/api/dashboard/stats`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        Cookie: cookieHeader,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      const data = json?.data;

      if (!data) {
        return NextResponse.json(null, { status: 404 });
      }

      // Exact mapping of backend response matching Nuxt server/api/count.js
      return NextResponse.json({
        total: (data.totalStudents || 0) + (data.totalUsers || 0),
        klasifikasi: {
          developer: 1,
          admin: data.totalUsers || 0,
          siswa: data.totalStudents || 0,
          guru: Math.max(0, (data.totalUsers || 1) - 1),
        },
        today: data.today || {
          present: 0,
          late: 0,
          absent: 0,
          izin: 0,
          sakit: 0,
          attendancePercentage: 0,
        },
        pendingLeaves: data.pendingLeaves || 0,
        recentAttendances: data.recentAttendances || [],
        recentLogs: data.recentLogs || [],
        recentFaceFailures: data.recentFaceFailures || [],
        onsite_siswa: (data.today?.present || 0) + (data.today?.late || 0),
      });
    }

    const errJson = await res.json().catch(() => null);
    return NextResponse.json(errJson || { message: 'Gagal mengambil data dari server' }, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
