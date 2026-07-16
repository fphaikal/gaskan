<script setup>
import { ref, onMounted, computed } from 'vue';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const { $toast } = useNuxtApp();

useSeoMeta({
  title: 'Laporan Absensi | GASKAN',
  description: 'Preview dan export rekapitulasi kehadiran siswa',
});

// -- Data ----------------------------------------------
const classes   = ref([]);
const semesters = ref([]);
const loading   = ref(true);
const exporting = ref(false);
const previewing = ref(false);
const previewData = ref(null);

const filters = ref({ classId: '', semesterId: '', startDate: '', endDate: '' });

onMounted(async () => {
  try {
    const [classRes, semRes] = await Promise.all([
      $fetch('/api/classes'),
      $fetch('/api/semester'),
    ]);
    classes.value   = classRes?.data  || [];
    semesters.value = semRes?.data    || [];

    // Default date range: current month (safely formatted)
    const now = new Date();
    filters.value.startDate = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
    filters.value.endDate   = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');
  } catch (e) {
    console.error('Failed to fetch filters:', e);
  } finally {
    loading.value = false;
  }
});

// -- Preview -------------------------------------------
const handlePreview = async () => {
  previewing.value = true;
  previewData.value = null;
  try {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(filters.value).filter(([, v]) => v))).toString();
    const res = await $fetch(`/api/attendance/preview?${q}`);
    if (res?.data) previewData.value = res.data;
    else $toast?.error('Tidak ada data untuk filter yang dipilih');
  } catch (e) {
    $toast?.error('Gagal memuat preview');
  } finally {
    previewing.value = false;
  }
};

// -- Export --------------------------------------------
const exportingPdf = ref(false);

const handleExport = async () => {
  if (!previewData.value) return;
  exporting.value = true;
  try {
    const dates = previewData.value.dates;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Rekap Absensi');

    // Kop Surat
    ws.mergeCells('A1:K1');
    ws.getCell('A1').value = 'KEMENTERIAN PERINDUSTRIAN REPUBLIK INDONESIA';
    ws.getCell('A1').font = { size: 12, bold: true };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    ws.mergeCells('A2:K2');
    ws.getCell('A2').value = 'SMK SMTI YOGYAKARTA';
    ws.getCell('A2').font = { size: 16, bold: true };
    ws.getCell('A2').alignment = { horizontal: 'center' };

    ws.mergeCells('A3:K3');
    ws.getCell('A3').value = 'Jl. Kusumanegara No.3, Semaki, Umbulharjo, Kota Yogyakarta, DIY 55166';
    ws.getCell('A3').font = { size: 10 };
    ws.getCell('A3').alignment = { horizontal: 'center' };

    // Border line (dummy row for visual separation)
    ws.mergeCells('A4:K4');
    ws.getCell('A4').border = { bottom: { style: 'double', color: { argb: 'FF000000' } } };

    ws.addRow([]); // empty row

    // Title & Subtitle
    ws.mergeCells('A6:E6');
    ws.getCell('A6').value = `LAPORAN KEHADIRAN SISWA - KELAS ${selectedClassName.value.toUpperCase()}`;
    ws.getCell('A6').font = { size: 12, bold: true };
    ws.mergeCells('A7:E7');
    ws.getCell('A7').value = `Periode: ${monthRange.value}`;
    ws.getCell('A7').font = { italic: true };

    ws.addRow([]); // empty row

    // Headers
    const headerRow = ['No', 'Nama Siswa', 'Kelas'];
    dates.forEach(d => headerRow.push(formatDateShort(d).toString()));
    headerRow.push('H', 'T', 'I', 'S', 'A');
    
    const rowHeader = ws.addRow(headerRow);
    rowHeader.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } }; // Orange
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });

    // Set columns width
    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 30;
    ws.getColumn(3).width = 15;
    for(let i=4; i<=3+dates.length; i++) ws.getColumn(i).width = 5; // Date columns
    for(let i=4+dates.length; i<=8+dates.length; i++) ws.getColumn(i).width = 5; // Summary columns

    // Data
    previewData.value.rows.forEach(r => {
      const row = [r.no, r.name, r.className];
      dates.forEach(d => {
        row.push(r.cells[d] ? statusStyle[r.cells[d]]?.short || '' : '');
      });
      row.push(r.summary.hadir, r.summary.terlambat, r.summary.izin, r.summary.sakit, r.summary.alpha);
      
      const addedRow = ws.addRow(row);
      addedRow.eachCell((cell, colNum) => {
        cell.alignment = { horizontal: colNum > 3 ? 'center' : 'left', vertical: 'middle' };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        
        // Emphasize summary columns
        if (colNum > 3 + dates.length) {
          cell.font = { bold: true };
          if (colNum === 4 + dates.length) cell.font.color = { argb: 'FF10B981' }; // H (Green)
          if (colNum === 5 + dates.length) cell.font.color = { argb: 'FFF59E0B' }; // T (Amber)
          if (colNum === 6 + dates.length) cell.font.color = { argb: 'FF0EA5E9' }; // I (Blue)
          if (colNum === 7 + dates.length) cell.font.color = { argb: 'FFF97316' }; // S (Orange)
          if (colNum === 8 + dates.length) cell.font.color = { argb: 'FFF43F5E' }; // A (Rose)
        }
      });
    });

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Rekap_Absensi_${selectedClassName.value.replace(/ /g, '_')}_${filters.value.startDate}.xlsx`);
    $toast?.success('File Excel berhasil diunduh');
  } catch (e) {
    console.error(e);
    $toast?.error('Gagal mengekspor Excel');
  } finally {
    exporting.value = false;
  }
};

const handleExportPdf = () => {
  if (!previewData.value) return;
  exportingPdf.value = true;
  try {
    const doc = new jsPDF({ orientation: 'landscape' });
    const dates = previewData.value.dates;

    const pageWidth = doc.internal.pageSize.getWidth();

    // Kop Surat
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('KEMENTERIAN PERINDUSTRIAN REPUBLIK INDONESIA', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text('SMK SMTI YOGYAKARTA', pageWidth / 2, 22, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text('Jl. Kusumanegara No.3, Semaki, Umbulharjo, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55166', pageWidth / 2, 28, { align: 'center' });

    // Garis Kop
    doc.setLineWidth(0.5);
    doc.line(14, 32, pageWidth - 14, 32);
    doc.setLineWidth(0.2);
    doc.line(14, 33, pageWidth - 14, 33);

    // Judul
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`LAPORAN KEHADIRAN SISWA - KELAS ${selectedClassName.value.toUpperCase()}`, 14, 43);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Periode: ${monthRange.value}`, 14, 49);

    const head = [['No', 'Nama Siswa', 'Kelas', ...dates.map(d => formatDateShort(d).toString()), 'H', 'T', 'I', 'S', 'A']];
    
    const body = previewData.value.rows.map(r => {
      const row = [r.no, r.name, r.className];
      dates.forEach(d => {
        row.push(r.cells[d] ? statusStyle[r.cells[d]]?.short || '' : '');
      });
      row.push(r.summary.hadir, r.summary.terlambat, r.summary.izin, r.summary.sakit, r.summary.alpha);
      return row;
    });

    autoTable(doc, {
      head: head,
      body: body,
      startY: 55,
      styles: { fontSize: 7, cellPadding: 1, halign: 'center' },
      columnStyles: { 1: { halign: 'left', minCellWidth: 30 } },
      headStyles: { fillColor: [249, 115, 22] } 
    });

    doc.save(`Rekap_Absensi_${selectedClassName.value.replace(/ /g, '_')}_${filters.value.startDate}.pdf`);
    $toast?.success('File PDF berhasil diunduh');
  } catch (e) {
    console.error(e);
    $toast?.error('Gagal mengekspor PDF');
  } finally {
    exportingPdf.value = false;
  }
};

// -- Helpers -------------------------------------------
const selectedClassName = computed(() => {
  if (!filters.value.classId) return 'Semua Kelas';
  return classes.value.find(c => c.id === filters.value.classId)?.className || 'Kelas';
});

const formatDateShort = (iso) => {
  const d = new Date(iso);
  return d.getDate();          // just the day number
};
const formatDateHeader = (iso) => {
  const d = new Date(iso);
  return format(d, 'EEE', { locale: id }).toUpperCase().substring(0, 3); // MON TUE etc
};
const isWeekend = (iso) => {
  const day = new Date(iso).getDay();
  return day === 0 || day === 6;
};

const statusStyle = {
  HADIR:     { bg: 'bg-emerald-500',  text: 'text-white', short: 'H' },
  TERLAMBAT: { bg: 'bg-amber-400',    text: 'text-white', short: 'T' },
  IZIN:      { bg: 'bg-sky-400',      text: 'text-white', short: 'I' },
  SAKIT:     { bg: 'bg-orange-400',   text: 'text-white', short: 'S' },
  ALPHA:     { bg: 'bg-rose-500',     text: 'text-white', short: 'A' },
};
const cellStyle = (status) => statusStyle[status] || { bg: 'bg-base-200', text: 'text-base-content/20', short: '' };

const monthRange = computed(() => {
  if (!filters.value.startDate) return '';
  return format(parseISO(filters.value.startDate), 'MMMM yyyy', { locale: id });
});
</script>

<template>
  <div class="space-y-6 max-w-full">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-base-content">Laporan Absensi</h1>
        <p class="text-sm text-base-content/40 font-medium mt-0.5">Preview dan export rekapitulasi kehadiran siswa</p>
      </div>
      <div class="flex gap-2" v-if="previewData">
        <button @click="handleExport" :disabled="exporting || exportingPdf" class="btn bg-emerald-500 hover:bg-emerald-600 text-white border-0 rounded-2xl font-black shadow-lg shadow-emerald-500/20 gap-2">
          <span v-if="exporting" class="loading loading-spinner loading-xs"></span>
          <Icon v-else name="mingcute:file-export-fill" size="18" />
          Export Excel
        </button>
        <button @click="handleExportPdf" :disabled="exporting || exportingPdf" class="btn bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-2xl font-black shadow-lg shadow-rose-500/20 gap-2">
          <span v-if="exportingPdf" class="loading loading-spinner loading-xs"></span>
          <Icon v-else name="mingcute:file-export-fill" size="18" />
          Export PDF
        </button>
      </div>
    </div>

    <!-- Filter Card -->
    <div class="bg-base-100 rounded-3xl p-6 border border-base-200/60 shadow-sm">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-9 h-9 rounded-2xl bg-orange-500/10 flex items-center justify-center">
          <Icon name="mingcute:filter-fill" class="text-orange-500" size="20" />
        </div>
        <div>
          <h2 class="font-black text-base-content text-sm">Filter Laporan</h2>
          <p class="text-[10px] text-base-content/40 uppercase tracking-widest font-bold">Tentukan kriteria data</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- Kelas -->
        <div class="form-control">
          <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Kelas</span></label>
          <select v-model="filters.classId" class="select select-bordered w-full rounded-2xl text-sm font-bold">
            <option value="">Semua Kelas</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.className }}</option>
          </select>
        </div>
        <!-- Semester -->
        <div class="form-control">
          <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Semester</span></label>
          <select v-model="filters.semesterId" class="select select-bordered w-full rounded-2xl text-sm font-bold">
            <option value="">Semua Semester</option>
            <option v-for="s in semesters" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <!-- Start -->
        <div class="form-control">
          <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Tanggal Mulai</span></label>
          <input v-model="filters.startDate" type="date" class="input input-bordered w-full rounded-2xl text-sm font-bold" />
        </div>
        <!-- End -->
        <div class="form-control">
          <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Tanggal Akhir</span></label>
          <input v-model="filters.endDate" type="date" class="input input-bordered w-full rounded-2xl text-sm font-bold" />
        </div>
      </div>

      <div class="flex items-center justify-between pt-4 border-t border-base-200/40">
        <!-- Legend -->
        <div class="hidden md:flex items-center gap-4">
          <div v-for="(s, k) in statusStyle" :key="k" class="flex items-center gap-1.5">
            <div :class="['w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black text-white', s.bg]">{{ s.short }}</div>
            <span class="text-[9px] font-black text-base-content/40 uppercase tracking-widest">{{ k }}</span>
          </div>
        </div>
        <button @click="handlePreview" :disabled="previewing || loading" class="btn bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-2xl font-black shadow-lg shadow-orange-500/20 gap-2 ml-auto">
          <span v-if="previewing" class="loading loading-spinner loading-xs"></span>
          <Icon v-else name="mingcute:eye-2-fill" size="18" />
          Preview Laporan
        </button>
      </div>
    </div>

    <!-- -- PREVIEW TABLE -- -->
    <div v-if="previewData" class="space-y-4">
      
      <!-- Summary Stats -->
      <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div class="bg-base-100 rounded-2xl p-4 border border-base-200/60 text-center col-span-2 md:col-span-1">
          <p class="text-[9px] font-black uppercase tracking-widest text-base-content/30 mb-1">Siswa</p>
          <p class="text-2xl font-black text-base-content">{{ previewData.summary.totalSiswa }}</p>
        </div>
        <div class="bg-base-100 rounded-2xl p-4 border border-base-200/60 text-center">
          <p class="text-[9px] font-black uppercase tracking-widest text-base-content/30 mb-1">Hari Efektif</p>
          <p class="text-2xl font-black text-base-content">{{ previewData.summary.hariEfektif }}</p>
        </div>
        <div class="bg-emerald-500 rounded-2xl p-4 text-white text-center">
          <p class="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Hadir</p>
          <p class="text-2xl font-black">{{ previewData.summary.hadir }}</p>
        </div>
        <div class="bg-amber-400 rounded-2xl p-4 text-white text-center">
          <p class="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Terlambat</p>
          <p class="text-2xl font-black">{{ previewData.summary.terlambat }}</p>
        </div>
        <div class="bg-sky-400 rounded-2xl p-4 text-white text-center">
          <p class="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Izin/Sakit</p>
          <p class="text-2xl font-black">{{ previewData.summary.izin + previewData.summary.sakit }}</p>
        </div>
        <div class="bg-rose-500 rounded-2xl p-4 text-white text-center">
          <p class="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Alpha</p>
          <p class="text-2xl font-black">{{ previewData.summary.alpha }}</p>
        </div>
      </div>

      <!-- Matrix Table -->
      <div class="bg-base-100 rounded-3xl border border-base-200/60 shadow-sm overflow-hidden">
        <!-- Table heading -->
        <div class="px-6 py-4 border-b border-base-200/40 flex items-center justify-between">
          <div>
            <h3 class="font-black text-base-content text-sm uppercase tracking-widest">
              LAPORAN ABSENSI - {{ selectedClassName }}
            </h3>
            <p class="text-xs text-base-content/40 font-bold capitalize mt-0.5">{{ monthRange }}</p>
          </div>
          <div class="flex items-center gap-2 text-[10px] font-black text-base-content/30 uppercase">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            Preview Mode
          </div>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
          <table class="table table-xs border-separate border-spacing-0 min-w-max w-full">
            <!-- Date row -->
            <thead>
              <tr>
                <th class="sticky left-0 z-20 bg-base-100 min-w-[40px] text-center text-[9px] py-2 border-b border-r border-base-200/40">No</th>
                <th class="sticky left-10 z-20 bg-base-100 min-w-[180px] text-[9px] py-2 border-b border-r border-base-200/40 font-black uppercase tracking-widest text-base-content/40">Nama Siswa</th>
                <!-- Date columns -->
                <th v-for="d in previewData.dates" :key="d"
                    :class="['min-w-[32px] text-center py-1 border-b border-base-200/20', isWeekend(d) ? 'bg-base-200/50' : '']">
                  <div class="flex flex-col items-center gap-0">
                    <span class="text-[7px] font-black text-base-content/25 uppercase">{{ formatDateHeader(d) }}</span>
                    <span class="text-[10px] font-black" :class="isWeekend(d) ? 'text-base-content/30' : 'text-base-content/60'">{{ formatDateShort(d) }}</span>
                  </div>
                </th>
                <!-- Summary cols -->
                <th class="min-w-[32px] text-center text-[8px] py-2 border-b border-l border-base-200/40 text-emerald-600 font-black bg-emerald-500/5">H</th>
                <th class="min-w-[32px] text-center text-[8px] py-2 border-b border-base-200/40 text-amber-500 font-black bg-amber-400/5">T</th>
                <th class="min-w-[32px] text-center text-[8px] py-2 border-b border-base-200/40 text-sky-500 font-black bg-sky-400/5">I</th>
                <th class="min-w-[32px] text-center text-[8px] py-2 border-b border-base-200/40 text-orange-400 font-black bg-orange-400/5">S</th>
                <th class="min-w-[32px] text-center text-[8px] py-2 border-b border-base-200/40 text-rose-500 font-black bg-rose-500/5">A</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in previewData.rows" :key="row.id" class="group hover:bg-base-200/20">
                <!-- No -->
                <td class="sticky left-0 z-10 bg-base-100 group-hover:bg-base-200/20 text-center text-[10px] font-black text-base-content/30 border-r border-base-200/20 py-1.5">{{ row.no }}</td>
                <!-- Name -->
                <td class="sticky left-10 z-10 bg-base-100 group-hover:bg-base-200/20 border-r border-base-200/20 py-1.5 px-3">
                  <div>
                    <p class="text-xs font-bold text-base-content truncate max-w-[160px]">{{ row.name }}</p>
                    <p class="text-[8px] font-black text-base-content/25 uppercase tracking-wider">{{ row.className }}</p>
                  </div>
                </td>
                <!-- Status Cells -->
                <td v-for="d in previewData.dates" :key="d"
                    :class="['py-1 px-0.5 text-center', isWeekend(d) ? 'bg-base-200/30' : '']">
                  <div v-if="row.cells[d]"
                       :class="['w-7 h-7 mx-auto rounded-lg flex items-center justify-center text-[9px] font-black cursor-default', cellStyle(row.cells[d]).bg, cellStyle(row.cells[d]).text]"
                       :title="row.cells[d]">
                    {{ cellStyle(row.cells[d]).short }}
                  </div>
                  <div v-else class="w-7 h-7 mx-auto rounded-lg bg-base-200/30 border border-dashed border-base-200"></div>
                </td>
                <!-- Summary -->
                <td class="text-center border-l border-base-200/20 bg-emerald-500/5">
                  <span class="text-[10px] font-black text-emerald-600">{{ row.summary.hadir }}</span>
                </td>
                <td class="text-center bg-amber-400/5">
                  <span class="text-[10px] font-black text-amber-500">{{ row.summary.terlambat }}</span>
                </td>
                <td class="text-center bg-sky-400/5">
                  <span class="text-[10px] font-black text-sky-500">{{ row.summary.izin }}</span>
                </td>
                <td class="text-center bg-orange-400/5">
                  <span class="text-[10px] font-black text-orange-400">{{ row.summary.sakit }}</span>
                </td>
                <td class="text-center bg-rose-500/5">
                  <span class="text-[10px] font-black text-rose-500">{{ row.summary.alpha }}</span>
                </td>
              </tr>

              <!-- Totals row -->
              <tr class="border-t-2 border-base-200/60 bg-base-200/20">
                <td colspan="2" class="sticky left-0 z-10 bg-base-200/30 py-2 px-4 border-r border-base-200/40">
                  <span class="text-[9px] font-black uppercase tracking-widest text-base-content/40">Jumlah Hadir</span>
                </td>
                <td v-for="d in previewData.dates" :key="d" class="text-center py-1">
                  <span class="text-[10px] font-black text-base-content/50">{{ previewData.colTotals[d] || 0 }}</span>
                </td>
                <td colspan="5" class="bg-base-200/30"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer stats -->
        <div class="px-6 py-4 border-t border-base-200/40 flex flex-wrap items-center justify-between gap-4 bg-base-200/10">
          <div class="flex flex-wrap gap-6 text-xs font-bold">
            <span class="text-base-content/50">Hari Efektif: <strong class="text-base-content">{{ previewData.summary.hariEfektif }}</strong></span>
            <span class="text-sky-500">Sakit: <strong>{{ previewData.summary.pctSakit }}%</strong></span>
            <span class="text-amber-500">Izin: <strong>{{ previewData.summary.pctIzin }}%</strong></span>
            <span class="text-rose-500">Alpha: <strong>{{ previewData.summary.pctAlpha }}%</strong></span>
          </div>
          <div class="flex gap-2">
            <button @click="handleExport" :disabled="exporting || exportingPdf" class="btn bg-emerald-500 hover:bg-emerald-600 text-white border-0 rounded-2xl font-black shadow-md shadow-emerald-500/20 gap-2">
              <span v-if="exporting" class="loading loading-spinner loading-xs"></span>
              <Icon v-else name="mingcute:file-export-fill" size="18" />
              Export Excel
            </button>
            <button @click="handleExportPdf" :disabled="exporting || exportingPdf" class="btn bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-2xl font-black shadow-md shadow-rose-500/20 gap-2">
              <span v-if="exportingPdf" class="loading loading-spinner loading-xs"></span>
              <Icon v-else name="mingcute:file-export-fill" size="18" />
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state before preview -->
    <div v-else-if="!previewing" class="bg-base-100 rounded-3xl border border-dashed border-base-200 p-20 flex flex-col items-center justify-center opacity-40">
      <Icon name="mingcute:table-2-fill" size="64" />
      <p class="text-sm font-black uppercase tracking-widest mt-4">Klik "Preview Laporan" untuk melihat data</p>
      <p class="text-xs font-bold mt-1">Sesuaikan filter di atas terlebih dahulu</p>
    </div>

    <!-- Loading overlay -->
    <div v-if="previewing" class="bg-base-100 rounded-3xl border border-base-200/60 p-20 flex flex-col items-center justify-center">
      <span class="loading loading-dots loading-lg text-orange-500"></span>
      <p class="text-sm font-black uppercase tracking-widest mt-4 text-base-content/40">Memuat preview...</p>
    </div>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { height: 6px; width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--bc), 0.12); border-radius: 10px; }
</style>
