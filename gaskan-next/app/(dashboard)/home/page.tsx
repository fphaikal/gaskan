"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  School,
  CalendarCheck,
  Percent,
  ArrowRight,
  UserCheck,
  FileSpreadsheet,
  Activity,
  ShieldCheck,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import api from "@/lib/api";

interface SummaryStats {
  totalSiswa: number;
  totalKelas: number;
  absensiHariIni: number;
  persentaseKehadiran: number;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
}

interface RecentActivity {
  id: string | number;
  nama: string;
  nis: string;
  kelas: string;
  waktu: string;
  status: "hadir" | "izin" | "sakit" | "alpa";
}

const MOCK_STATS: SummaryStats = {
  totalSiswa: 1248,
  totalKelas: 36,
  absensiHariIni: 1180,
  persentaseKehadiran: 94.5,
  hadir: 1120,
  izin: 35,
  sakit: 25,
  alpa: 68,
};

const MOCK_RECENT_ACTIVITIES: RecentActivity[] = [
  {
    id: 1,
    nama: "Ahmad Fauzi",
    nis: "20241001",
    kelas: "X RPL 1",
    waktu: "07:05:12",
    status: "hadir",
  },
  {
    id: 2,
    nama: "Siti Nurhaliza",
    nis: "20241002",
    kelas: "X RPL 1",
    waktu: "07:10:45",
    status: "hadir",
  },
  {
    id: 3,
    nama: "Budi Santoso",
    nis: "20241003",
    kelas: "XI TKJ 2",
    waktu: "07:14:20",
    status: "hadir",
  },
  {
    id: 4,
    nama: "Dewi Lestari",
    nis: "20241004",
    kelas: "XII MM 1",
    waktu: "-",
    status: "izin",
  },
  {
    id: 5,
    nama: "Rizky Ramadhan",
    nis: "20241005",
    kelas: "X TKJ 1",
    waktu: "-",
    status: "sakit",
  },
  {
    id: 6,
    nama: "Eka Prasetya",
    nis: "20241006",
    kelas: "XI RPL 2",
    waktu: "-",
    status: "alpa",
  },
];

export default function DashboardHomePage() {
  const [stats, setStats] = useState<SummaryStats>(MOCK_STATS);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    MOCK_RECENT_ACTIVITIES
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/dashboard/summary");
      if (res.data && res.data.stats) {
        setStats(res.data.stats);
      }
      if (res.data && res.data.recent) {
        setRecentActivities(res.data.recent);
      }
    } catch (error) {
      console.log("Using mock summary dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "hadir":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Hadir
          </Badge>
        );
      case "izin":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-200 dark:border-blue-800 flex items-center gap-1">
            <Clock3 className="h-3 w-3" /> Izin
          </Badge>
        );
      case "sakit":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Sakit
          </Badge>
        );
      case "alpa":
        return (
          <Badge className="bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 border-rose-200 dark:border-rose-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Alpa
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "S";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const quickNavCards = [
    {
      title: "Data Siswa",
      description: "Kelola data master siswa, NIS, dan status kelas",
      icon: Users,
      href: "/siswa",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Data Kelas",
      description: "Kelola rombel, wali kelas, dan jurusan",
      icon: School,
      href: "/kelas",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Absensi Presensi",
      description: "Rekap data kehadiran harian dan cetak laporan",
      icon: CalendarCheck,
      href: "/absensi",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Permohonan Izin",
      description: "Verifikasi dan kelola persetujuan surat izin/sakit",
      icon: FileSpreadsheet,
      href: "/izin",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Realtime Monitor",
      description: "Pantau perangkat IoT scan absensi secara live",
      icon: Activity,
      href: "/monitor",
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
    {
      title: "Kelola Admin",
      description: "Kelola peran pengguna dan akses akun administrator",
      icon: ShieldCheck,
      href: "/admin",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Selamat Datang di Dashboard Gaskan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sistem Informasi Presensi dan Monitoring Kehadiran Siswa Real-time.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="w-fit gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Siswa
            </CardTitle>
            <div className="p-2 rounded-md bg-blue-500/10 text-blue-500">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSiswa.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Terdaftar dalam sistem
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Kelas
            </CardTitle>
            <div className="p-2 rounded-md bg-purple-500/10 text-purple-500">
              <School className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKelas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Rombongan belajar aktif
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Absensi Hari Ini
            </CardTitle>
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-500">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.absensiHariIni}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total presensi tercatat
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Persentase Kehadiran
            </CardTitle>
            <div className="p-2 rounded-md bg-amber-500/10 text-amber-500">
              <Percent className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.persentaseKehadiran}%</div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(stats.persentaseKehadiran, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Quick Action Navigation */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Aksi Cepat & Navigasi</CardTitle>
              <CardDescription>
                Pintas ke modul manajemen dan laporan aktivitas presensi
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickNavCards.map((card) => {
                const IconComponent = card.icon;
                return (
                  <Link key={card.href} href={card.href} className="group block">
                    <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors flex items-start justify-between h-full">
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-md ${card.bgColor} ${card.color}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {card.title}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {card.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Additional breakdown overview card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Rincian Status Presensi Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/50">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Hadir</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                  {stats.hadir}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-200 dark:border-blue-900/50">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Izin</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                  {stats.izin}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-200 dark:border-amber-900/50">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Sakit</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                  {stats.sakit}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-200 dark:border-rose-900/50">
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">Alpa</p>
                <p className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-1">
                  {stats.alpa}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Recent Attendance Activity Feed */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border shadow-sm h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Aktivitas Terbaru
                </CardTitle>
                <Link href="/absensi">
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                    Lihat Semua
                  </Button>
                </Link>
              </div>
              <CardDescription>Scan presensi masuk terupdate</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 space-y-4 pt-1">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="h-8 w-8 text-xs shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getInitials(act.nama)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold truncate text-foreground">
                        {act.nama}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {act.kelas} &bull; NIS: {act.nis}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    {getStatusBadge(act.status)}
                    <span className="text-[10px] text-muted-foreground">
                      {act.waktu}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>

            <div className="p-4 pt-0">
              <Link href="/monitor" className="w-full block">
                <Button variant="outline" className="w-full text-xs gap-2">
                  <Activity className="h-3.5 w-3.5" /> Buka Live Monitor
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
