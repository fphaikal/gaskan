import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
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

    const params = new URLSearchParams();
    ['page', 'limit', 'search', 'class', 'classId', 'status'].forEach((key) => {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    });

    // Forward dashboard filters and pagination to the Express backend.
    const query = params.toString();
    const res = await fetch(`${API_BASE}/api/dashboard/stats${query ? `?${query}` : ''}`, {
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      const data = json?.data || json;

      if (data) {
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
          pagination: data.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 1,
          },
          onsite_siswa: (data.today?.present || 0) + (data.today?.late || 0),
        });
      }
    }

    // Return empty dashboard structure if 401/403 or server empty
    return NextResponse.json({
      total: 0,
      klasifikasi: { developer: 1, admin: 0, siswa: 0, guru: 0 },
      today: { present: 0, late: 0, absent: 0, izin: 0, sakit: 0, attendancePercentage: 0 },
      pendingLeaves: 0,
      recentAttendances: [],
      recentLogs: [],
      recentFaceFailures: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      onsite_siswa: 0,
    });
  } catch (error: any) {
    return NextResponse.json({
      total: 0,
      klasifikasi: { developer: 1, admin: 0, siswa: 0, guru: 0 },
      today: { present: 0, late: 0, absent: 0, izin: 0, sakit: 0, attendancePercentage: 0 },
      pendingLeaves: 0,
      recentAttendances: [],
      recentLogs: [],
      recentFaceFailures: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      onsite_siswa: 0,
    });
  }
}
