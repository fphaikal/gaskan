'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { toast } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // 1. Redirect unauthenticated users
    if (!user) {
      router.push('/login');
      return;
    }

    const role = (user.role || '').toLowerCase();
    const path = pathname;

    // 2. Admin & Developer Only Routes
    const adminOnlyPaths = ['/semester', '/admin', '/config', '/log/error'];
    if (adminOnlyPaths.some((p) => path.startsWith(p)) && !['admin', 'developer'].includes(role)) {
      toast.error('Akses Ditolak: Halaman ini khusus untuk Role Admin & Developer');
      router.push('/home');
      return;
    }

    // 3. Staff Only Routes (Admin, Developer, Guru)
    const staffPaths = ['/absensi', '/siswa', '/log', '/kelas', '/monitor', '/jurusan'];
    if (staffPaths.some((p) => path.startsWith(p)) && !['admin', 'developer', 'guru'].includes(role)) {
      // Allow individual student profile view (/siswa/[id]) and student attendance log (/log/kehadiran)
      if (path.startsWith('/siswa/') || path === '/log/kehadiran') {
        // Allowed
      } else {
        toast.error('Akses Ditolak: Halaman ini khusus untuk Pengajar & Staff');
        router.push('/home');
        return;
      }
    }
  }, [user, isLoading, pathname, router]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
