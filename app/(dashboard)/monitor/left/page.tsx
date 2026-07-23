'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import socket from '@/lib/socket';

export default function GateMonitorLeftPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
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
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('attendance:scan_left');
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 space-y-6 animate-in fade-in duration-500">
      {/* Kiosk Header */}
      <div className="flex items-center justify-between bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-500 border border-orange-500/30 flex items-center justify-center font-black">
            <Icon icon="mingcute:arrow-left-line" className="text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              Kiosk Presensi Gerbang KIRI (Left Gate)
              <Badge className={isConnected ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}>
                {isConnected ? 'LIVE WEBSOCKET' : 'OFFLINE'}
              </Badge>
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Monitor Real-Time Hasil Scan Wajah & Gate Terminal Kiri · SMK SMTI Yogyakarta
            </p>
          </div>
        </div>

        <span className="font-mono text-xs text-slate-400 font-bold">
          {new Date().toLocaleTimeString('id-ID')}
        </span>
      </div>

      {/* Real-time Scan Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {logs.length > 0 ? (
          logs.map((item, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
              <div className="flex justify-between items-center">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                  VERIFIED
                </Badge>
                <span className="text-[10px] font-mono text-slate-400">{item.time || 'Baru Saja'}</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{item.studentName || item.name || 'Siswa'}</h3>
                <p className="text-xs font-mono text-slate-400">{item.nis || 'NIS: -'}</p>
                <p className="text-xs text-orange-400 font-bold mt-1">{item.className || 'Kelas'}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-16 text-center text-slate-500 font-semibold bg-slate-900/50 rounded-3xl border border-slate-800">
            Menunggu event presensi scan wajah dari Gerbang Kiri...
          </div>
        )}
      </div>
    </div>
  );
}
