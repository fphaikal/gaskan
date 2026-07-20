"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Activity,
  Info,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Globe,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReusableDataTable } from "@/components/shared/ReusableDataTable";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const MOCK_LOGS: ActivityLog[] = [
  {
    id: 1,
    created_at: "2026-07-20 09:45:12",
    username: "admin_super",
    role: "superadmin",
    ip_address: "192.168.1.10",
    level: "INFO",
    aktivitas: "Login pengguna berhasil ke dashboard",
    modul: "AUTH",
  },
  {
    id: 2,
    created_at: "2026-07-20 09:30:05",
    username: "operator_absensi",
    role: "operator",
    ip_address: "192.168.1.25",
    level: "INFO",
    aktivitas: "Menambahkan data absensi manual siswa Ahmad Fauzi",
    modul: "ABSENSI",
  },
  {
    id: 3,
    created_at: "2026-07-20 09:15:44",
    username: "admin_kurikulum",
    role: "admin",
    ip_address: "192.168.1.12",
    level: "WARN",
    aktivitas: "Percobaan akses halaman admin tanpa otorisasi penuh",
    modul: "SECURITY",
  },
  {
    id: 4,
    created_at: "2026-07-20 08:50:20",
    username: "system_device",
    role: "iot_device",
    ip_address: "10.0.0.5",
    level: "ERROR",
    aktivitas: "Koneksi RFID Reader Device-02 terputus sementara",
    modul: "IOT_MONITOR",
  },
  {
    id: 5,
    created_at: "2026-07-20 08:30:00",
    username: "admin_super",
    role: "superadmin",
    ip_address: "192.168.1.10",
    level: "INFO",
    aktivitas: "Memperbarui data kelas XII RPL 1",
    modul: "KELAS",
  },
  {
    id: 6,
    created_at: "2026-07-20 08:10:15",
    username: "operator_absensi",
    role: "operator",
    ip_address: "192.168.1.25",
    level: "INFO",
    aktivitas: "Mengkonfirmasi permohonan izin siswa Dewi Lestari",
    modul: "IZIN",
  },
  {
    id: 7,
    created_at: "2026-07-20 07:45:00",
    username: "system",
    role: "cron",
    ip_address: "127.0.0.1",
    level: "INFO",
    aktivitas: "Sinkronisasi otomatis rekap harian presensi selesai",
    modul: "SYSTEM",
  },
  {
    id: 8,
    created_at: "2026-07-20 07:00:10",
    username: "unknown",
    role: "-",
    ip_address: "203.0.113.45",
    level: "ERROR",
    aktivitas: "Gagal login: Kata sandi salah untuk user admin_kesiswaan",
    modul: "AUTH",
  },
];

export default function LogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>(MOCK_LOGS);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>(MOCK_LOGS);
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/log");
      if (res.data && Array.isArray(res.data)) {
        setLogs(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
        setLogs(res.data.data);
      }
    } catch (error) {
      console.log("Using mock log data:", error);
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
          <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-200 dark:border-blue-800 flex items-center gap-1 w-fit">
            <Info className="h-3 w-3" /> INFO
          </Badge>
        );
      case "WARN":
      case "WARNING":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-amber-200 dark:border-amber-800 flex items-center gap-1 w-fit">
            <AlertTriangle className="h-3 w-3" /> WARN
          </Badge>
        );
      case "ERROR":
        return (
          <Badge className="bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 border-rose-200 dark:border-rose-800 flex items-center gap-1 w-fit">
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
      header: "Waktu Audit",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
          <Clock className="h-3.5 w-3.5" />
          <span>{row.original.created_at}</span>
        </div>
      ),
    },
    {
      accessorKey: "level",
      header: "Level",
      cell: ({ row }) => getLogLevelBadge(row.original.level),
    },
    {
      accessorKey: "username",
      header: "Pengguna / Aktor",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-foreground flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            {row.original.username}
          </span>
          {row.original.role && (
            <span className="text-[10px] text-muted-foreground capitalize">
              {row.original.role}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "aktivitas",
      header: "Aktivitas Log",
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">
            {row.original.aktivitas}
          </p>
          {row.original.modul && (
            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
              [{row.original.modul}]
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "ip_address",
      header: "IP Address",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
          <Globe className="h-3 w-3" />
          <span>{row.original.ip_address || "-"}</span>
        </div>
      ),
    },
  ];

  const exportColumns = [
    { header: "Waktu", key: "created_at" },
    { header: "Level", key: "level" },
    { header: "Username", key: "username" },
    { header: "Modul", key: "modul" },
    { header: "Aktivitas", key: "aktivitas" },
    { header: "IP Address", key: "ip_address" },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Log Aktivitas Sistem"
        subtitle="Jejak audit aktivitas pengguna, riwayat keamanan, dan kejadian sistem"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={isLoading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <ExportButtons
              data={filteredLogs}
              columns={exportColumns}
              fileName="log_aktivitas_gaskan"
              title="Log Aktivitas Sistem Gaskan"
            />
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter Level Log:</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={selectedLevel} onValueChange={(val) => setSelectedLevel(val || "ALL")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Pilih Level" />
            </SelectTrigger>
            <SelectContent side="bottom">
              <SelectItem value="ALL">Semua Level</SelectItem>
              <SelectItem value="INFO">INFO Only</SelectItem>
              <SelectItem value="WARN">WARN Only</SelectItem>
              <SelectItem value="ERROR">ERROR Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reusable Data Table */}
      <ReusableDataTable
        columns={columns}
        data={filteredLogs}
        searchKey="aktivitas"
        searchPlaceholder="Cari riwayat aktivitas log..."
        isLoading={isLoading}
      />
    </div>
  );
}
