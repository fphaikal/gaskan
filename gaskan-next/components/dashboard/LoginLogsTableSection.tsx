'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
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
    return () => {
      mounted = false;
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
