'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useSidebar } from '@/context/SidebarContext';
import { UserNav } from '@/components/layout/UserNav';
import { Button } from '@/components/ui/button';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Menu,
} from 'lucide-react';

export function Header() {
  const {
    isCollapsed,
    isMobileOpen,
    toggleSidebar,
    toggleMobileSidebar,
  } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format title from pathname
  const getPageTitle = (path: string) => {
    if (path === '/' || path === '/home' || path === '/dashboard') return 'Dashboard';
    const segment = path.split('/')[1];
    if (!segment) return 'Dashboard';
    
    const titleMap: Record<string, string> = {
      jurusan: 'Jurusan',
      kelas: 'Manajemen Kelas',
      semester: 'Semester',
      siswa: 'Daftar Siswa',
      absensi: 'Absensi',
      izin: 'Surat Izin',
      admin: 'Manajemen User',
      log: 'Log Kehadiran & Sistem',
      monitor: 'Monitor Presensi',
      profile: 'Profil Saya',
    };

    return titleMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-[calc(4rem+env(safe-area-inset-top))] w-full min-w-0 shrink-0 items-center justify-between border-b border-border bg-background/80 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:px-4 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3">
        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={toggleMobileSidebar}
          aria-label={isMobileOpen ? 'Tutup navigasi' : 'Buka navigasi'}
          aria-controls="mobile-dashboard-navigation"
          aria-expanded={isMobileOpen}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile logo */}
        <Link href="/home" className="flex min-w-0 shrink items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <Image
              src="/smti_logo.svg"
              alt="GASKAN Logo"
              width={22}
              height={22}
              className="w-5.5 h-5.5 object-contain invert dark:invert-0"
              priority
            />
          </div>
          <span className="font-black text-base text-primary tracking-tight">GASKAN</span>
        </Link>

        {/* Desktop Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden shrink-0 lg:flex"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>

        {/* Desktop Page Title */}
        <h1 className="ml-2 hidden min-w-0 truncate text-base font-semibold text-foreground sm:block">
          {pageTitle}
        </h1>
      </div>

      {/* Right side actions */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
          className="shrink-0 rounded-xl"
        >
          {mounted && theme === 'dark' ? (
            <Sun className="h-5 w-5 text-amber-400 transition-all" />
          ) : (
            <Moon className="h-5 w-5 text-slate-700 dark:text-slate-200 transition-all" />
          )}
        </Button>

        <div className="mx-0.5 hidden h-6 w-px bg-border min-[360px]:block sm:mx-1" />

        {/* User Navigation */}
        <UserNav />
      </div>
    </header>
  );
}

export default Header;
