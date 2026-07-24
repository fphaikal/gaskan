'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { goeyToast as toast } from 'goey-toast';

export function DashboardShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  if (!mounted) {
    return (
      <div
        className="flex min-h-dvh w-full min-w-0 bg-background text-foreground"
        aria-label="Memuat dashboard"
        aria-busy="true"
        suppressHydrationWarning
      >
        <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-border bg-card p-4 lg:flex">
          <div className="flex h-12 items-center gap-3 border-b border-border pb-4">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex-1 space-y-3 py-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-14 w-full rounded-2xl" />
        </aside>

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <header className="flex h-[calc(4rem+env(safe-area-inset-top))] shrink-0 items-center justify-between border-b border-border px-3 pt-[env(safe-area-inset-top)] sm:px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <Skeleton className="h-11 w-11 rounded-xl lg:hidden" />
              <Skeleton className="h-8 w-8 rounded-xl lg:hidden" />
              <Skeleton className="hidden h-5 w-36 sm:block" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-11 w-11 rounded-xl sm:h-8 sm:w-8" />
              <Skeleton className="h-11 w-11 rounded-full sm:h-8 sm:w-8" />
            </div>
          </header>

          <main className="min-w-0 max-w-full flex-1 overflow-hidden p-3 sm:p-4 lg:p-6">
            <div className="mx-auto max-w-7xl space-y-5">
              <div className="rounded-3xl border border-border bg-card p-4 sm:p-6">
                <Skeleton className="h-8 w-64 max-w-full" />
                <Skeleton className="mt-3 h-4 w-96 max-w-full" />
                <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-11 w-full rounded-xl" />
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-border bg-card p-4 sm:p-6">
                <Skeleton className="h-11 w-full rounded-2xl" />
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full rounded-2xl" />
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full min-w-0 bg-background text-foreground" suppressHydrationWarning>
      <Sidebar />
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-w-0 max-w-full flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
