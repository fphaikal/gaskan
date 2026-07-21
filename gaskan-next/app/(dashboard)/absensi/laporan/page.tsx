'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { ExportButtons } from '@/components/shared/ExportButtons';
import { CustomSelect } from '@/components/shared/CustomSelect';

export default function AbsensiLaporanPage() {
  const [selectedMonth, setSelectedMonth] = useState('7');
  const [selectedYear, setSelectedYear] = useState('2026');

  const reportData = [
    { nis: '25101001', name: 'Ahmad Dahlan', className: 'X AK 1', hadir: 20, izin: 1, sakit: 0, alpa: 0, persentase: '95%' },
    { nis: '25101002', name: 'Siti Sarah', className: 'X AK 1', hadir: 21, izin: 0, sakit: 0, alpa: 0, persentase: '100%' },
  ];

  const exportCols = [
    { header: 'NIS', key: 'nis' },
    { header: 'Nama Siswa', key: 'name' },
    { header: 'Kelas', key: 'className' },
    { header: 'Hadir', key: 'hadir' },
    { header: 'Izin', key: 'izin' },
    { header: 'Sakit', key: 'sakit' },
    { header: 'Alpa', key: 'alpa' },
    { header: 'Persentase', key: 'persentase' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Laporan Rekapitulasi Absensi
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Cetak dan unduh laporan rekapitulasi kehadiran siswa bulanan / semesteran
          </p>
        </div>

        <ExportButtons
          data={reportData}
          columns={exportCols}
          fileName={`Laporan_Absensi_${selectedMonth}_${selectedYear}`}
          title="Laporan Rekapitulasi Absensi Siswa"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 bg-card p-4 rounded-3xl border border-border shadow-sm">
        <div className="w-full sm:w-48">
          <CustomSelect
            options={[
              { value: '1', label: 'Januari' },
              { value: '2', label: 'Februari' },
              { value: '7', label: 'Juli' },
              { value: '8', label: 'Agustus' },
            ]}
            value={selectedMonth}
            onChange={setSelectedMonth}
          />
        </div>
        <div className="w-full sm:w-44">
          <CustomSelect
            options={[
              { value: '2025', label: '2025' },
              { value: '2026', label: '2026' },
            ]}
            value={selectedYear}
            onChange={setSelectedYear}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="divide-y divide-border">
          {reportData.map((item, idx) => (
            <div key={idx} className="p-4 sm:px-6 flex items-center justify-between text-xs font-bold">
              <div>
                <p className="text-sm font-black text-foreground">{item.name}</p>
                <p className="text-muted-foreground font-mono">NIS: {item.nis} • {item.className}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-emerald-500">{item.hadir} Hadir</span>
                <span className="text-sky-500">{item.izin} Izin</span>
                <span className="text-amber-500">{item.sakit} Sakit</span>
                <span className="text-rose-500">{item.alpa} Alpa</span>
                <span className="px-3 py-1 bg-primary/10 text-primary font-black rounded-xl">{item.persentase}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
