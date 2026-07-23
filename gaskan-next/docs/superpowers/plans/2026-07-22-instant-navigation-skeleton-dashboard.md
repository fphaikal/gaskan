# Instant Navigation & Progressive Skeleton Loading for Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement instant 0ms page navigation and progressive skeleton loading for each independent section on the Dashboard (`/home`) page in Next.js without modifying the current UI design or layout.

**Architecture:** Split the `/home` page data fetching into isolated section components (`AdminStatsCards`, `SystemMetricsSection`, `LoginLogsTableSection`, `DashboardSiswa`). Each component manages its own fetch state (`isLoading`, `data`) and immediately renders a 1:1 dimensionally matched `<Skeleton />` fallback while waiting for its API endpoint to resolve.

**Tech Stack:** Next.js (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, Axios (`@/lib/api`).

---

### Task 1: Create Base Skeleton Primitive Component

**Files:**
- Create: `components/ui/skeleton.tsx`

- [ ] **Step 1: Create `components/ui/skeleton.tsx`**

```tsx
import React from 'react';
import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-2xl bg-muted/60', className)}
      {...props}
    />
  );
}

export { Skeleton };
```

- [ ] **Step 2: Verify Skeleton component imports**
Verify that `cn` is properly imported from `@/lib/utils`.

- [ ] **Step 3: Commit Task 1**

```bash
git add components/ui/skeleton.tsx
git commit -m "feat: add base Skeleton component primitive"
```

---

### Task 2: Create Modular `AdminStatsCards` Component with Skeleton Loading

**Files:**
- Create: `components/dashboard/AdminStatsCards.tsx`

- [ ] **Step 1: Create `AdminStatsCards.tsx`**
Create `components/dashboard/AdminStatsCards.tsx` containing both the component and `AdminStatsCardsSkeleton`.

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminStatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border-border bg-card rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AdminStatsCards() {
  const [countData, setCountData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchCount() {
      try {
        const res = await api.get('/count');
        if (mounted && res?.data) {
          setCountData(res.data.data || res.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard count stats:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchCount();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <AdminStatsCardsSkeleton />;
  }

  const stats = [
    {
      title: 'Total Siswa Active',
      value: countData?.totalSiswa || countData?.siswa || 0,
      icon: 'Users',
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Hadir Hari Ini',
      value: countData?.presensiHariIni || countData?.hadirHariIni || 0,
      icon: 'UserCheck',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Total Guru',
      value: countData?.totalGuru || countData?.guru || 0,
      icon: 'GraduationCap',
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    },
    {
      title: 'Total Kelas Active',
      value: countData?.totalKelas || countData?.kelas || 0,
      icon: 'School',
      color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((item, idx) => (
        <Card key={idx} className="border-border bg-card rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-2xl border ${item.color} shrink-0`}>
              <Icon icon={item.icon} className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground truncate">{item.title}</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{item.value}</h3>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit Task 2**

```bash
git add components/dashboard/AdminStatsCards.tsx
git commit -m "feat: add AdminStatsCards with progressive skeleton loading"
```

---

### Task 3: Create Modular `SystemMetricsSection` Component with Skeleton Loading

**Files:**
- Create: `components/dashboard/SystemMetricsSection.tsx`

- [ ] **Step 1: Create `SystemMetricsSection.tsx`**

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';

export function SystemMetricsSkeleton() {
  return (
    <Card className="border-border bg-card rounded-2xl shadow-sm mb-6">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-muted/20 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function SystemMetricsSection() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchMetrics() {
      try {
        const res = await api.get('/system/metrics').catch(() => null);
        if (mounted && res?.data) {
          setMetrics(res.data.data || res.data);
        }
      } catch (err) {
        console.error('Error fetching system metrics:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchMetrics();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <SystemMetricsSkeleton />;
  }

  if (!metrics) return null;

  return (
    <Card className="border-border bg-card rounded-2xl shadow-sm mb-6">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Icon icon="Activity" className="w-5 h-5 text-primary" />
          Metrik Sistem Server
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <p className="text-xs text-muted-foreground font-medium">CPU Load</p>
          <p className="text-lg font-bold text-foreground mt-1">{metrics?.cpuUsage || metrics?.cpu || '0'}%</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <p className="text-xs text-muted-foreground font-medium font-medium">RAM Usage</p>
          <p className="text-lg font-bold text-foreground mt-1">{metrics?.memoryUsage || metrics?.memory || '0 MB'}</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <p className="text-xs text-muted-foreground font-medium">Uptime Server</p>
          <p className="text-lg font-bold text-foreground mt-1">{metrics?.uptime || '0h'}</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <p className="text-xs text-muted-foreground font-medium">System Status</p>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Healthy
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit Task 3**

```bash
git add components/dashboard/SystemMetricsSection.tsx
git commit -m "feat: add SystemMetricsSection with progressive skeleton loading"
```

---

### Task 4: Create Modular `LoginLogsTableSection` Component with Skeleton Loading

**Files:**
- Create: `components/dashboard/LoginLogsTableSection.tsx`

- [ ] **Step 1: Create `LoginLogsTableSection.tsx`**

```tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomSelect } from '@/components/shared/CustomSelect';
import { format, parseISO } from 'date-fns';

export function LoginLogsSkeleton() {
  return (
    <Card className="border-border bg-card rounded-2xl shadow-sm">
      <CardHeader className="pb-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function LoginLogsTableSection() {
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const [loginRes, classRes] = await Promise.allSettled([
          api.get('/log/login'),
          api.get('/kelas'),
        ]);

        if (mounted) {
          if (loginRes.status === 'fulfilled' && loginRes.value?.data) {
            setLoginLogs(Array.isArray(loginRes.value.data) ? loginRes.value.data : loginRes.value.data.data || []);
          }
          if (classRes.status === 'fulfilled' && classRes.value?.data) {
            const c = classRes.value.data.data || classRes.value.data;
            if (Array.isArray(c)) setClassList(c);
          }
        }
      } catch (err) {
        console.error('Error fetching login logs:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    return loginLogs.filter((log) => {
      const matchSearch =
        !searchQuery ||
        (log.user?.nama || log.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.user?.nisn || log.nisn || '').includes(searchQuery);
      const matchClass = !selectedClass || (log.user?.kelas_id || log.kelas_id) === selectedClass;
      return matchSearch && matchClass;
    });
  }, [loginLogs, searchQuery, selectedClass]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  if (loading) {
    return <LoginLogsSkeleton />;
  }

  return (
    <Card className="border-border bg-card rounded-2xl shadow-sm">
      <CardHeader className="pb-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Icon icon="LogIn" className="w-5 h-5 text-primary" />
          Aktivitas Login Terbaru
        </CardTitle>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <Icon icon="Search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama / NISN..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-10 rounded-xl bg-muted/30 text-xs"
            />
          </div>
          {classList.length > 0 && (
            <CustomSelect
              value={selectedClass}
              onChange={(val) => {
                setSelectedClass(val);
                setCurrentPage(1);
              }}
              options={[
                { value: '', label: 'Semua Kelas' },
                ...classList.map((c) => ({ value: c.id, label: c.nama_kelas || c.nama })),
              ]}
              className="w-full sm:w-36 h-10 text-xs"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase border-b border-border">
              <tr>
                <th className="px-4 py-3">Pengguna</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Waktu Login</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground font-medium">
                    Tidak ada aktivitas login ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log: any, idx: number) => {
                  const nama = log.user?.nama || log.nama || 'Pengguna';
                  const roleName = (log.user?.role || log.role || 'siswa').toUpperCase();
                  const timeStr = log.created_at || log.waktu || log.login_at;
                  return (
                    <tr key={log.id || idx} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {nama.charAt(0)}
                        </div>
                        <span className="truncate max-w-[150px] sm:max-w-xs">{nama}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="rounded-lg text-[10px] font-bold">
                          {roleName}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {timeStr ? format(parseISO(timeStr), 'dd MMM yyyy, HH:mm') : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30 rounded-lg text-[10px] font-bold">
                          Berhasil
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl text-xs"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl text-xs"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit Task 4**

```bash
git add components/dashboard/LoginLogsTableSection.tsx
git commit -m "feat: add LoginLogsTableSection with progressive skeleton loading"
```

---

### Task 5: Refactor `DashboardSiswa.tsx` with Independent Skeleton Loading

**Files:**
- Modify: `components/dashboard/DashboardSiswa.tsx`

- [ ] **Step 1: Add Skeleton fallbacks inside `DashboardSiswa.tsx`**
Update `DashboardSiswa.tsx` so that `summary` statistics and monthly attendance log list render dedicated Skeleton components when `loading` is true, preserving exact layout without layout shift.

```tsx
// Inside DashboardSiswa.tsx:
// Create AttendanceSummarySkeleton and AttendanceLogSkeleton
```

- [ ] **Step 2: Commit Task 5**

```bash
git add components/dashboard/DashboardSiswa.tsx
git commit -m "feat: add progressive skeleton loading states to DashboardSiswa"
```

---

### Task 6: Integrate Modular Sections into `app/(dashboard)/home/page.tsx`

**Files:**
- Modify: `app/(dashboard)/home/page.tsx`

- [ ] **Step 1: Replace monolith fetching in `HomePage` with modular sections**
Update `app/(dashboard)/home/page.tsx` to render `AdminStatsCards`, `SystemMetricsSection`, and `LoginLogsTableSection` for admin/developer roles, and `DashboardSiswa` for student role.

- [ ] **Step 2: Verify page renders instantaneously (0ms data delay)**

- [ ] **Step 3: Commit Task 6**

```bash
git add app/(dashboard)/home/page.tsx
git commit -m "refactor: integrate instant modular components and progressive skeleton in homepage"
```

---

### Task 7: Build & Type Check Verification

**Files:**
- None (Build verification)

- [ ] **Step 1: Run Next.js build check**

Run: `npm run build` in `.worktrees/nextjs-migration/gaskan-next`
Expected: `✓ Compiled successfully` with zero TypeScript or build errors.
