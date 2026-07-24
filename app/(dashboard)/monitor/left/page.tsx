'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import socket from '@/lib/socket';

export default function GateMonitorLeftPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateClock = () => setCurrentTime(new Date().toLocaleTimeString('id-ID'));
    updateClock();
    const clockInterval = window.setInterval(updateClock, 1000);

    if (socket) {
      setIsConnected(socket.connected);
      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));
      socket.on('attendance:scan_left', (data: any) => {
        if (data) {
          setLogs((prev) => [data, ...prev.slice(0, 19)]);
        }
      });
    }

    return () => {
      window.clearInterval(clockInterval);
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('attendance:scan_left');
      }
    };
  }, []);

  return (
    <div className="min-h-[calc(100dvh-5rem)] space-y-4 bg-slate-950 p-3 text-white animate-in fade-in duration-500 sm:space-y-6 sm:p-6 landscape:sm:space-y-3 landscape:sm:p-4 xl:p-6">
      {/* Kiosk Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl sm:p-6 md:flex-row md:items-center md:justify-between landscape:sm:p-4 xl:p-6">
        <div className="flex min-w-0 flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/20 font-black text-orange-500">
            <Icon icon="mingcute:arrow-left-line" className="text-2xl" />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-col gap-2 min-[520px]:flex-row min-[520px]:items-center">
            <h1 className="break-words text-xl font-black tracking-tight sm:text-2xl">
              Kiosk Presensi Gerbang KIRI (Left Gate)
            </h1>
              <Badge className={`w-fit shrink-0 ${isConnected ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                {isConnected ? 'LIVE WEBSOCKET' : 'OFFLINE'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Monitor Real-Time Hasil Scan Wajah & Gate Terminal Kiri · SMK SMTI Yogyakarta
            </p>
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-3 border-t border-slate-800 pt-3 text-xs md:w-auto md:border-l md:border-t-0 md:pl-4 md:pt-0">
          <span className="font-semibold text-slate-500">Waktu Lokal</span>
          <strong className="font-mono text-sm text-slate-300">{currentTime || '--:--:--'}</strong>
        </div>
      </div>

      {/* Real-time Scan Feed */}
      <div className="grid grid-cols-1 gap-3 landscape:grid-cols-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        {logs.length > 0 ? (
          logs.map((item, idx) => (
            <div key={idx} className="min-w-0 space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                  VERIFIED
                </Badge>
                <span className="text-[10px] font-mono text-slate-400">{item.time || 'Baru Saja'}</span>
              </div>
              <div>
                <h3 className="break-words text-lg font-black text-white">{item.studentName || item.name || 'Siswa'}</h3>
                <p className="break-all text-xs font-mono text-slate-400">{item.nis || 'NIS: -'}</p>
                <p className="text-xs text-orange-400 font-bold mt-1">{item.className || 'Kelas'}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-3xl border border-slate-800 bg-slate-900/50 p-8 text-center font-semibold text-slate-500 sm:p-16">
            Menunggu event presensi scan wajah dari Gerbang Kiri...
          </div>
        )}
      </div>
    </div>
  );
}
