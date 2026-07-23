'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/icon';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string;
  roles: string[];
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    groupName: 'MENU UTAMA',
    items: [
      { title: 'Dashboard', href: '/home', icon: 'Grid', roles: ['all'] },
      { title: 'Workspace Teams', href: '/teams', icon: 'Users', roles: ['all'] },
      { title: 'Profil Saya', href: '/profile', icon: 'User', roles: ['all'] },
    ],
  },
  {
    groupName: 'DATA MASTER',
    items: [
      { title: 'Daftar Siswa', href: '/siswa', icon: 'User', roles: ['admin', 'developer', 'guru'] },
      { title: 'Manajemen Kelas', href: '/kelas', icon: 'School', roles: ['admin', 'developer', 'guru'] },
      { title: 'Semester', href: '/semester', icon: 'CalendarDays', roles: ['admin', 'developer'] },
      { title: 'Reshuffle Kelas', href: '/reshuffle', icon: 'ArrowLeftRight', roles: ['admin', 'developer'] },
      { title: 'Manajemen User', href: '/admin/users', icon: 'UserCog', roles: ['admin', 'developer'] },
      { title: 'Import Staff Excel', href: '/admin/import-staff', icon: 'Upload', roles: ['admin', 'developer'] },
      { title: 'Manajemen Tim', href: '/admin/team', icon: 'Users', roles: ['admin', 'developer'] },
      { title: 'Izin Profil Siswa', href: '/admin/field-permissions', icon: 'UserCog', roles: ['admin', 'developer'] },
    ],
  },
  {
    groupName: 'PRESENSI & KEHADIRAN',
    items: [
      { title: 'Kalender Akademik', href: '/kalender', icon: 'CalendarDays', roles: ['all'] },
      { title: 'Absensi', href: '/absensi', icon: 'Clipboard', roles: ['admin', 'developer', 'guru'] },
      { title: 'Log Kehadiran', href: '/log/kehadiran', icon: 'ListChecks', roles: ['all'] },
      { title: 'On Site', href: '/log/onsite', icon: 'MapPin', roles: ['admin', 'developer', 'guru'] },
      { title: 'Surat Izin', href: '/izin', icon: 'FileText', roles: ['all'] },
      { title: 'Laporan Absensi', href: '/absensi/laporan', icon: 'FileOutput', roles: ['admin', 'developer', 'guru'] },
      { title: 'Monitor Gate Kiri', href: '/monitor/left', icon: 'ArrowLeft', roles: ['admin', 'developer'] },
      { title: 'Monitor Gate Kanan', href: '/monitor/right', icon: 'ArrowRight', roles: ['admin', 'developer'] },
    ],
  },
  {
    groupName: 'SISTEM & LOG',
    items: [
      { title: 'Kelola Sistem', href: '/admin/system-manage', icon: 'Server', roles: ['admin', 'developer'] },
      { title: 'Explorer File', href: '/admin/file-explorer', icon: 'FolderOpen', roles: ['developer'] },
      { title: 'Konfigurasi Mesin', href: '/config/device', icon: 'Settings2', roles: ['admin', 'developer'] },
      { title: 'Log Sistem', href: '/log/login', icon: 'LogIn', roles: ['admin', 'developer'] },
      { title: 'Log Error', href: '/log/error', icon: 'Info', roles: ['developer'] },
      { title: 'Dokumentasi API', href: '/docs-api', icon: 'Code2', roles: ['admin', 'developer', 'guru'] },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const { user, logout } = useAuth();
  const [hasTeamAccess, setHasTeamAccess] = useState<boolean>(true);

  const userRole = (user?.role || 'siswa').toLowerCase();

  // Check Workspace Team Access
  useEffect(() => {
    if (!user) return;
    if (['admin', 'developer', 'guru'].includes(userRole)) {
      setHasTeamAccess(true);
      return;
    }
    api.get('/team/my-profile')
      .then((res) => setHasTeamAccess(Boolean(res?.data?.data || res?.data)))
      .catch(() => setHasTeamAccess(false));
  }, [user, userRole]);

  const isLinkActive = (href: string) => {
    if (href === '/home') {
      return pathname === '/home' || pathname === '/';
    }
    return pathname === href;
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Pengguna';
  const displayRole = user?.role ? user.role.toUpperCase() : 'SISWA';
  const avatarUrl = getImageUrl(user?.avatar);
  const initial = displayName.charAt(0).toUpperCase();

  const renderNavItems = (collapsed: boolean, onItemClick?: () => void) => (
    <div className="flex flex-col gap-5 p-3">
      {navGroups.map((group) => {
        const visibleItems = group.items.filter((item) => {
          if (item.href === '/teams' && !hasTeamAccess) {
            return false;
          }
          if (item.roles.includes('all')) return true;
          return item.roles.map((r) => r.toLowerCase()).includes(userRole);
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={group.groupName} className="flex flex-col gap-1">
            {!collapsed && (
              <h2 className="px-3 text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase mb-1">
                {group.groupName}
              </h2>
            )}
            {visibleItems.map((item) => {
              const active = isLinkActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all duration-150 relative group',
                    active
                      ? 'bg-primary/20 text-primary font-black'
                      : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon
                    icon={item.icon}
                    className={cn(
                      'text-lg shrink-0',
                      active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.title}</span>
                  )}
                  {!collapsed && active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 ml-auto" />
                  )}
                  {!collapsed && item.badge && !active && (
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out shrink-0 h-screen sticky top-0',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/home" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Image src="/smti_logo.svg" alt="Gaskan Logo" width={22} height={22} style={{ width: 'auto', height: 'auto' }} />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-black tracking-tight text-primary whitespace-nowrap">
                GASKAN
              </span>
            )}
          </Link>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {renderNavItems(isCollapsed)}
        </div>

        {/* User Footer */}
        <div className="border-t border-border p-3 shrink-0">
          <div
            className={cn(
              'flex items-center gap-3 rounded-2xl p-2 bg-muted/40 hover:bg-muted/70 transition-colors',
              isCollapsed && 'justify-center p-1.5'
            )}
          >
            <Avatar className="h-9 w-9 shrink-0">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">{initial}</AvatarFallback>
            </Avatar>

            {!isCollapsed && (
              <div className="flex flex-1 flex-col overflow-hidden text-left min-w-0">
                <span className="text-xs font-bold truncate text-foreground">{displayName}</span>
                <span className="text-[9px] font-black uppercase text-primary tracking-wider truncate">{displayRole}</span>
              </div>
            )}

            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl"
                title="Logout"
              >
                <Icon icon="mingcute:exit-line" className="text-base" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={isMobileOpen} onOpenChange={(open) => setIsMobileOpen(open)}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col h-full lg:hidden bg-card border-border">
          <SheetHeader className="h-16 border-b border-border px-4 flex flex-row items-center gap-3 space-y-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Image src="/smti_logo.svg" alt="Gaskan Logo" width={22} height={22} style={{ width: 'auto', height: 'auto' }} />
            </div>
            <SheetTitle className="text-lg font-black text-primary">GASKAN</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {renderNavItems(false, () => setIsMobileOpen(false))}
          </div>

          <div className="border-t border-border p-4 shrink-0">
            <div className="flex items-center gap-3 rounded-2xl p-2 bg-muted/40">
              <Avatar className="h-9 w-9 shrink-0">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">{initial}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col overflow-hidden text-left min-w-0">
                <span className="text-xs font-bold truncate text-foreground">{displayName}</span>
                <span className="text-[9px] font-black uppercase text-primary tracking-wider truncate">{displayRole}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-8 w-8 text-muted-foreground hover:text-rose-500"
              >
                <Icon icon="mingcute:exit-line" className="text-base" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default Sidebar;
