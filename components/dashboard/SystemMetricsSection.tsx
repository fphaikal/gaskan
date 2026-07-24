'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
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

    const sk = getSocket();

    function onSystemMetrics(data: any) {
      if (!mounted || !data) return;
      setMetrics(data.data || data);
      setLoading(false);
    }

    sk.on('system:metrics', onSystemMetrics);
    if (!sk.connected) sk.connect();

    return () => {
      mounted = false;
      sk.off('system:metrics', onSystemMetrics);
    };
  }, []);

  const formatted = React.useMemo(() => {
    if (!metrics) return null;
    try {
      const sys = metrics;
      const hw = sys.hardware || {};
      const osData = hw.os || {};
      const mem = hw.memory || {};
      const diskData = sys.disk || {};

      const host = osData.hostname || sys.osInfo?.hostname || 'Server Host';
      const platform = osData.platform ? String(osData.platform).toUpperCase() : (sys.osInfo?.distro || 'Linux');
      const arch = osData.arch ? ` (${osData.arch})` : '';
      const osName = `${platform}${arch}`;

      let ramStr = '-';
      if (mem.usedMB && mem.totalMB) {
        ramStr = `${(Number(mem.usedMB) / 1024).toFixed(1)} GB / ${(Number(mem.totalMB) / 1024).toFixed(1)} GB`;
      } else if (sys.memory?.used) {
        ramStr = `${sys.memory.used} ${sys.memory.unit || ''}`;
      }

      let diskStr = '-';
      if (diskData.usedGB && diskData.totalGB) {
        diskStr = `${diskData.usedGB} GB / ${diskData.totalGB} GB`;
      } else if (sys.disk?.used) {
        diskStr = `${sys.disk.used} / ${sys.disk.total}`;
      }

      return {
        HOST: host,
        OS: osName,
        RAM: ramStr,
        DISK: diskStr,
      };
    } catch {
      return null;
    }
  }, [metrics]);

  if (loading) {
    return <SystemMetricsSkeleton />;
  }

  if (!formatted) return null;

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
          <p className="text-xs text-muted-foreground font-medium">Host</p>
          <p className="text-lg font-bold text-foreground mt-1 truncate" title={formatted.HOST}>{formatted.HOST}</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <p className="text-xs text-muted-foreground font-medium">OS</p>
          <p className="text-lg font-bold text-foreground mt-1 truncate" title={formatted.OS}>{formatted.OS}</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <p className="text-xs text-muted-foreground font-medium">RAM Usage</p>
          <p className="text-lg font-bold text-foreground mt-1 truncate" title={formatted.RAM}>{formatted.RAM}</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <p className="text-xs text-muted-foreground font-medium">Disk Usage</p>
          <p className="text-lg font-bold text-foreground mt-1 truncate" title={formatted.DISK}>{formatted.DISK}</p>
        </div>
      </CardContent>
    </Card>
  );
}
