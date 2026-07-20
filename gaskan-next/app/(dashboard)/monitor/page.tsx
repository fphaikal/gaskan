"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Wifi,
  WifiOff,
  Radio,
  Clock,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Server,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import socket from "@/lib/socket";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DeviceStatus {
  id: string;
  name: string;
  location: string;
  ip: string;
  status: "online" | "offline";
  lastPing: string;
}

interface LiveScanFeed {
  id: string | number;
  nis: string;
  nama: string;
  kelas: string;
  waktu: string;
  device: string;
  status: "hadir" | "terlambat" | "izin" | string;
}

const INITIAL_DEVICES: DeviceStatus[] = [
  {
    id: "DEV-01",
    name: "RFID Reader - Gate Utama",
    location: "Gerbang Depan Sekolah",
    ip: "192.168.1.101",
    status: "online",
    lastPing: "Baru saja",
  },
  {
    id: "DEV-02",
    name: "RFID Reader - Lobi Gedung A",
    location: "Gedung Teori Lt 1",
    ip: "192.168.1.102",
    status: "online",
    lastPing: "1 menit yang lalu",
  },
  {
    id: "DEV-03",
    name: "Scanner Barcode - Lab Komputer 1",
    location: "Gedung Praktikum Lt 2",
    ip: "192.168.1.103",
    status: "offline",
    lastPing: "15 menit yang lalu",
  },
];

export default function RealtimeMonitorPage() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [socketId, setSocketId] = useState<string>("");
  const [devices, setDevices] = useState<DeviceStatus[]>(INITIAL_DEVICES);
  const [liveFeed, setLiveFeed] = useState<LiveScanFeed[]>([]);
  const wsUrl = process.env.NEXT_PUBLIC_WS_BASE || "wss://api.tierkun.my.id";

  useEffect(() => {
    // Connect Socket.IO on mount
    socket.connect();

    function handleConnect() {
      setIsConnected(true);
      setSocketId(socket.id || "");
      toast.success("Terhubung ke server Socket.IO Real-time");
    }

    function handleDisconnect() {
      setIsConnected(false);
      setSocketId("");
      toast.error("Koneksi Socket.IO terputus");
    }

    function handleAttendanceScan(data: any) {
      const newScan: LiveScanFeed = {
        id: data.id || Date.now(),
        nis: data.nis || "2024" + Math.floor(1000 + Math.random() * 9000),
        nama: data.nama || data.siswa_name || "Siswa Scan",
        kelas: data.kelas || "X RPL 1",
        waktu: new Date().toLocaleTimeString("id-ID"),
        device: data.device || "Gate Utama",
        status: data.status || "hadir",
      };

      setLiveFeed((prev) => [newScan, ...prev.slice(0, 49)]); // Keep last 50 scans
    }

    function handleDeviceStatusUpdate(data: DeviceStatus) {
      setDevices((prev) =>
        prev.map((d) => (d.id === data.id ? { ...d, ...data } : d))
      );
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("attendance_scanned", handleAttendanceScan);
    socket.on("absensi_baru", handleAttendanceScan);
    socket.on("device_status", handleDeviceStatusUpdate);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("attendance_scanned", handleAttendanceScan);
      socket.off("absensi_baru", handleAttendanceScan);
      socket.off("device_status", handleDeviceStatusUpdate);
      socket.disconnect();
    };
  }, []);

  const toggleSocketConnection = () => {
    if (isConnected) {
      socket.disconnect();
    } else {
      socket.connect();
    }
  };

  const handleSimulateScan = () => {
    const sampleNames = [
      "Fahreza Haikal",
      "Andi Saputra",
      "Rina Melati",
      "Daffa Prasetya",
      "Nabila Putri",
      "Rizky Ramadhan",
    ];
    const sampleClasses = ["X RPL 1", "XI TKJ 2", "XII MM 1", "X RPL 2"];
    const randomName =
      sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomClass =
      sampleClasses[Math.floor(Math.random() * sampleClasses.length)];

    const simulatedScan: LiveScanFeed = {
      id: Date.now(),
      nis: "2024" + Math.floor(1000 + Math.random() * 9000),
      nama: randomName,
      kelas: randomClass,
      waktu: new Date().toLocaleTimeString("id-ID"),
      device: "RFID Reader - Gate Utama",
      status: Math.random() > 0.2 ? "hadir" : "terlambat",
    };

    setLiveFeed((prev) => [simulatedScan, ...prev]);
    toast.info(`Simulasi Scan: ${randomName} (${randomClass})`);
  };

  const handleClearFeed = () => {
    setLiveFeed([]);
    toast.success("Feed aktivitas realtime dibersihkan");
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

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Realtime Monitoring IoT & Presensi"
        subtitle="Pemantauan status perangkat RFID/Scanner dan arus stream presensi siswa secara live"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={isConnected ? "outline" : "default"}
              size="sm"
              onClick={toggleSocketConnection}
              className="gap-2"
            >
              {isConnected ? (
                <>
                  <WifiOff className="h-4 w-4 text-rose-500" />
                  <span>Disconnect Socket</span>
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4" />
                  <span>Connect Socket</span>
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleSimulateScan}
              className="gap-1.5"
            >
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Simulasi Scan</span>
            </Button>
          </div>
        }
      />

      {/* Socket Connection Indicator Header */}
      <Card className="border shadow-sm bg-gradient-to-r from-card via-muted/30 to-card">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-full ${
                isConnected
                  ? "bg-emerald-500/15 text-emerald-500"
                  : "bg-rose-500/15 text-rose-500"
              }`}
            >
              <Radio
                className={`h-6 w-6 ${isConnected ? "animate-pulse" : ""}`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">Server WebSockets</h3>
                <Badge
                  variant={isConnected ? "default" : "destructive"}
                  className="capitalize"
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Target URL: {wsUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground border-t sm:border-t-0 sm:border-l pt-2 sm:pt-0 sm:pl-4 w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <span>Socket ID: </span>
              <strong className="font-mono text-foreground">
                {socketId || "N/A"}
              </strong>
            </div>
            <div>
              <span>Feed Total: </span>
              <strong className="text-foreground font-semibold">
                {liveFeed.length} Events
              </strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IoT Devices Status Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" /> Perangkat Scanner & Reader IoT
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {devices.map((device) => (
            <Card key={device.id} className="border shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {device.name}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {device.location}
                  </CardDescription>
                </div>
                <Badge
                  className={
                    device.status === "online"
                      ? "bg-emerald-500/15 text-emerald-600 border-emerald-200 dark:border-emerald-800"
                      : "bg-rose-500/15 text-rose-600 border-rose-200 dark:border-rose-800"
                  }
                >
                  {device.status === "online" ? "Online" : "Offline"}
                </Badge>
              </CardHeader>
              <CardContent className="pt-2 text-xs space-y-1 text-muted-foreground font-mono">
                <div>IP: {device.ip}</div>
                <div>ID: {device.id}</div>
                <div className="text-[11px] text-muted-foreground/80 font-sans mt-2">
                  Ping Terakhir: {device.lastPing}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Live Stream Attendance Activity Feed */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500 animate-pulse" /> Live
              Stream Presensi
            </CardTitle>
            <CardDescription>
              Aktivitas scan siswa yang masuk secara real-time dari Socket.IO
            </CardDescription>
          </div>
          {liveFeed.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFeed}
              className="text-xs text-rose-500 hover:text-rose-600 gap-1.5"
            >
              <Trash2 className="h-4 w-4" /> Clear Stream
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {liveFeed.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Radio className="h-10 w-10 text-muted-foreground/40 animate-pulse" />
              <p className="font-medium text-sm">Menunggu stream presensi masuk...</p>
              <p className="text-xs max-w-sm">
                Hubungkan ke WebSocket atau klik tombol "Simulasi Scan" di pojok kanan
                atas untuk mencoba event stream.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {liveFeed.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 text-xs">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {getInitials(scan.nama)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {scan.nama}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        NIS: {scan.nis} &bull; Kelas: {scan.kelas}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs text-muted-foreground font-mono">
                        {scan.device}
                      </span>
                      <p className="text-[11px] text-muted-foreground/80 flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" /> {scan.waktu}
                      </p>
                    </div>

                    <Badge
                      className={
                        scan.status === "hadir"
                          ? "bg-emerald-500/15 text-emerald-600 border-emerald-200 dark:border-emerald-800"
                          : "bg-amber-500/15 text-amber-600 border-amber-200 dark:border-amber-800"
                      }
                    >
                      {scan.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
