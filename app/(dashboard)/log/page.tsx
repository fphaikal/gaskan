"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Info,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReusableDataTable } from "@/components/shared/ReusableDataTable";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ActivityLog {
  id: number | string;
  created_at: string;
  username: string;
  role?: string;
  ip_address: string;
  level: "INFO" | "WARN" | "ERROR" | string;
  aktivitas: string;
  modul?: string;
}

export default function LogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/log/login").catch(() => api.get("/log"));
      const raw = res?.data?.data || res?.data || [];

      if (Array.isArray(raw)) {
        const mapped: ActivityLog[] = raw.map((item: any) => ({
          id: item.id || Math.random(),
          created_at: item.createdAt || item.created_at || item.timestamp || new Date().toISOString(),
          username: item.user?.name || item.username || item.identifier || item.details?.identifier || "System User",
          role: item.user?.role || item.role || "user",
          ip_address: item.ip || item.ip_address || item.details?.ip || "127.0.0.1",
          level: (item.level || (item.success === false ? "ERROR" : "INFO")).toUpperCase(),
          aktivitas: item.action || item.aktivitas || item.message || "Aktivitas login pengguna",
          modul: item.modul || item.module || "SYSTEM",
        }));
        setLogs(mapped);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Gagal mengambil data log aktivitas:", error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (selectedLevel === "ALL") {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(
        logs.filter(
          (log) => log.level?.toUpperCase() === selectedLevel.toUpperCase()
        )
      );
    }
  }, [selectedLevel, logs]);

  const getLogLevelBadge = (level: string) => {
    const lvl = level?.toUpperCase();
    switch (lvl) {
      case "INFO":
        return (
          <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30 font-bold flex items-center gap-1 w-fit">
            <Info className="h-3 w-3" /> INFO
          </Badge>
        );
      case "WARN":
        return (
          <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 font-bold flex items-center gap-1 w-fit">
            <AlertTriangle className="h-3 w-3" /> WARN
          </Badge>
        );
      case "ERROR":
        return (
          <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/30 font-bold flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" /> ERROR
          </Badge>
        );
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const columns: ColumnDef<ActivityLog>[] = [
    {
      accessorKey: "created_at",
      header: "Waktu",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground font-bold">
          {row.original.created_at}
        </span>
      ),
    },
    {
      accessorKey: "level",
      header: "Level",
      cell: ({ row }) => getLogLevelBadge(row.original.level),
    },
    {
      accessorKey: "username",
      header: "Pengguna",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{row.original.username}</span>
          <span className="text-[10px] text-muted-foreground uppercase font-black">
            {row.original.role}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "aktivitas",
      header: "Deskripsi Aktivitas",
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-foreground">
          {row.original.aktivitas}
        </span>
      ),
    },
    {
      accessorKey: "ip_address",
      header: "IP Address",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.ip_address}
        </span>
      ),
    },
  ];

  const exportData = filteredLogs.map((item) => ({
    waktu: item.created_at,
    level: item.level,
    username: item.username,
    role: item.role || "-",
    aktivitas: item.aktivitas,
    ip_address: item.ip_address,
  }));

  const exportColumns = [
    { header: "Waktu", key: "waktu" },
    { header: "Level", key: "level" },
    { header: "Pengguna", key: "username" },
    { header: "Role", key: "role" },
    { header: "Aktivitas", key: "aktivitas" },
    { header: "IP Address", key: "ip_address" },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <PageHeader
        title="Log Aktivitas Sistem"
        subtitle="Jejak audit seluruh aktivitas user dan sistem dari database backend"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              className="rounded-2xl gap-2 font-bold text-xs bg-card border-border"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <ExportButtons
              data={exportData}
              columns={exportColumns}
              fileName="log_aktivitas"
              title="Log Aktivitas Sistem"
            />
          </div>
        }
      />

      {/* Filter Level Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm">
        <div className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground tracking-wider">
          <span>Filter Level Log:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "INFO", "WARN", "ERROR"].map((lvl) => (
            <Button
              key={lvl}
              variant={selectedLevel === lvl ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLevel(lvl)}
              className="rounded-xl text-xs font-bold capitalize h-8"
            >
              {lvl}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <ReusableDataTable
          columns={columns}
          data={filteredLogs}
          searchKey="aktivitas"
          searchPlaceholder="Cari aktivitas..."
          isLoading={isLoading}
          mobileColumnIds={["username", "created_at", "level", "aktivitas"]}
          stickyColumnId="created_at"
          emptyLabel="Tidak ada log aktivitas ditemukan."
        />
      </div>
    </div>
  );
}
