'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';
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
import {
  LayoutDashboard,
  Building2,
  School,
  Calendar,
  Users,
  ClipboardCheck,
  FileText,
  UserCog,
  History,
  Activity,
  LogOut,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  roles?: string[];
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    groupName: 'MENU UTAMA',
    items: [
      { title: 'Home', href: '/home', icon: LayoutDashboard },
      { title: 'Monitor', href: '/monitor', icon: Activity },
    ],
  },
  {
    groupName: 'DATA MASTER',
    items: [
      { title: 'Jurusan', href: '/jurusan', icon: Building2 },
      { title: 'Kelas', href: '/kelas', icon: School },
      { title: 'Semester', href: '/semester', icon: Calendar },
      { title: 'Siswa', href: '/siswa', icon: Users },
    ],
  },
  {
    groupName: 'PRESENSI & KEHADIRAN',
    items: [
      { title: 'Absensi', href: '/absensi', icon: ClipboardCheck },
      { title: 'Izin', href: '/izin', icon: FileText },
      { title: 'Log', href: '/log', icon: History },
    ],
  },
  {
    groupName: 'ADMINISTRASI',
    items: [
      { title: 'Admin', href: '/admin', icon: UserCog },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { user, logout } = useAuth();

  const isLinkActive = (href: string) => {
    if (href === '/home') {
      return pathname === '/home' || pathname === '/';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const displayName = user?.nama || user?.username || 'User';
  const displayRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Siswa';
  const initial = displayName.charAt(0).toUpperCase();

  const renderNavItems = (collapsed: boolean, onItemClick?: () => void) => (
    <div className="flex flex-col gap-6 p-3">
      {navGroups.map((group) => (
        <div key={group.groupName} className="flex flex-col gap-1">
          {!collapsed && (
            <h2 className="px-3 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
              {group.groupName}
            </h2>
          )}
          {group.items.map((item) => {
            const IconComponent = item.icon;
            const active = isLinkActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                  active
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.title : undefined}
              >
                <IconComponent className={cn('h-5 w-5 shrink-0', active && 'text-primary-foreground')} />
                {!collapsed && (
                  <span className="flex-1 truncate">{item.title}</span>
                )}
                {!collapsed && item.badge && (
                  <Badge variant={active ? 'secondary' : 'outline'} className="ml-auto text-[10px]">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      ))}
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
              <Image src="/smti_logo.svg" alt="Gaskan Logo" width={22} height={22} />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold tracking-tight text-primary whitespace-nowrap">
                GASKAN
              </span>
            )}
          </Link>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {renderNavItems(isCollapsed)}
        </div>

        {/* User Footer */}
        <div className="border-t border-border p-3 shrink-0">
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl p-2 bg-muted/40 hover:bg-muted/70 transition-colors',
              isCollapsed && 'justify-center p-1.5'
            )}
          >
            <Avatar className="h-9 w-9 shrink-0">
              {user?.avatar ? <AvatarImage src={user.avatar} alt={displayName} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{initial}</AvatarFallback>
            </Avatar>

            {!isCollapsed && (
              <div className="flex flex-1 flex-col overflow-hidden text-left min-w-0">
                <span className="text-xs font-semibold truncate text-foreground">{displayName}</span>
                <span className="text-[10px] text-muted-foreground truncate">{displayRole}</span>
              </div>
            )}

            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={isCollapsed} onOpenChange={(open) => setIsCollapsed(open)}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col h-full lg:hidden">
          <SheetHeader className="h-16 border-b border-border px-4 flex flex-row items-center gap-3 space-y-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Image src="/smti_logo.svg" alt="Gaskan Logo" width={22} height={22} />
            </div>
            <SheetTitle className="text-lg font-bold text-primary">GASKAN</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {renderNavItems(false, () => setIsCollapsed(false))}
          </div>

          <div className="border-t border-border p-4 shrink-0">
            <div className="flex items-center gap-3 rounded-xl p-2 bg-muted/40">
              <Avatar className="h-9 w-9 shrink-0">
                {user?.avatar ? <AvatarImage src={user.avatar} alt={displayName} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary font-bold">{initial}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col overflow-hidden text-left min-w-0">
                <span className="text-xs font-semibold truncate text-foreground">{displayName}</span>
                <span className="text-[10px] text-muted-foreground truncate">{displayRole}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default Sidebar;
