'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';

export function LoginLogsSkeleton() {
  return (
    <Card className="border-border bg-card rounded-2xl shadow-sm">
      <CardHeader className="pb-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Skeleton className="h-6 w-48 max-w-full" />
        <div className="w-full sm:w-auto">
          <Skeleton className="h-11 w-full rounded-xl sm:h-10 sm:w-48" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex min-w-0 items-center justify-between gap-3 p-3 rounded-xl bg-muted/20">
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="w-9 h-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32 max-w-full" />
                  <Skeleton className="h-3 w-24 max-w-full" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function LoginLogsTableSection() {
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(itemsPerPage),
        });
        if (debouncedSearch) params.set('search', debouncedSearch);

        const loginRes = await api.get(`/log/login?${params.toString()}`);

        if (mounted) {
          const payload = loginRes?.data;
          const logs = Array.isArray(payload) ? payload : payload?.data || [];
          setLoginLogs(Array.isArray(logs) ? logs : []);
          setTotalLogs(payload?.pagination?.total ?? logs.length);
        }
      } catch (err) {
        console.error('Error fetching login logs:', err);
        if (mounted) {
          setLoginLogs([]);
          setTotalLogs(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();

    const sk = getSocket();

    function onUserLogin(data: any) {
      if (!mounted || !data) return;
      const newLog = {
        id: data.id || `login-${Date.now()}-${Math.random()}`,
        details: {
          identifier: data.identifier || data.nama || data.user?.nama || data.username || 'Pengguna',
          role: data.role || data.user?.role || 'SISWA',
        },
        createdAt: data.createdAt || data.timestamp || new Date().toISOString(),
        action: data.action || 'LOGIN BERHASIL',
      };

      setLoginLogs((prev) => [newLog, ...prev]);
      setTotalLogs((t) => t + 1);
    }

    sk.on('user:login', onUserLogin);
    sk.on('auth:login', onUserLogin);
    sk.on('login:new', onUserLogin);

    if (!sk.connected) sk.connect();

    return () => {
      mounted = false;
      sk.off('user:login', onUserLogin);
      sk.off('auth:login', onUserLogin);
      sk.off('login:new', onUserLogin);
    };
  }, [currentPage, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(totalLogs / itemsPerPage));

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
        <div className="flex items-center gap-3 w-full sm:w-auto">
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
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-3 p-4 md:hidden">
          {loginLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-xs font-medium text-muted-foreground">
              Tidak ada aktivitas login ditemukan.
            </div>
          ) : (
            loginLogs.map((log: any, idx: number) => {
              const nama = log.details?.identifier || log.user?.nama || log.nama || 'Pengguna';
              const roleName = (log.details?.role || log.user?.role || log.role || 'siswa').toUpperCase();
              const timeStr = log.createdAt || log.created_at || log.waktu || log.login_at;
              const statusLabel = log.action || 'Berhasil';

              return (
                <article
                  key={log.id || idx}
                  className="min-w-0 rounded-2xl border border-border bg-muted/20 p-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {nama.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{nama}</p>
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        {timeStr ? format(parseISO(timeStr), 'dd MMM yyyy, HH:mm') : '-'}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 rounded-lg text-[10px] font-bold">
                      {roleName}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Status
                    </span>
                    <Badge className="rounded-lg border-emerald-500/30 bg-emerald-500/10 text-[10px] font-bold text-emerald-500 hover:bg-emerald-500/20">
                      {statusLabel}
                    </Badge>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
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
              {loginLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground font-medium">
                    Tidak ada aktivitas login ditemukan.
                  </td>
                </tr>
              ) : (
                loginLogs.map((log: any, idx: number) => {
                  const nama = log.details?.identifier || log.user?.nama || log.nama || 'Pengguna';
                  const roleName = (log.details?.role || log.user?.role || log.role || 'siswa').toUpperCase();
                  const timeStr = log.createdAt || log.created_at || log.waktu || log.login_at;
                  const statusLabel = log.action || 'Berhasil';
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
                          {statusLabel}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-border p-4 text-xs min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
            <span className="text-muted-foreground font-medium">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-11 rounded-xl text-xs sm:h-8"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-11 rounded-xl text-xs sm:h-8"
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
