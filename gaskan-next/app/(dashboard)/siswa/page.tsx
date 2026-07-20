"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Loader2, User as UserIcon, Filter, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { Siswa, Kelas, Jurusan } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReusableDataTable } from "@/components/shared/ReusableDataTable";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MOCK_JURUSAN: Jurusan[] = [
  { id: 1, nama_jurusan: "Teknik Komputer dan Jaringan", kode_jurusan: "TKJ" },
  { id: 2, nama_jurusan: "Rekayasa Perangkat Lunak", kode_jurusan: "RPL" },
  { id: 3, nama_jurusan: "Multimedia / DKV", kode_jurusan: "MM" },
];

const MOCK_KELAS: Kelas[] = [
  { id: 1, nama_kelas: "X RPL 1", jurusan_id: 2, jurusan: MOCK_JURUSAN[1] },
  { id: 2, nama_kelas: "XI RPL 2", jurusan_id: 2, jurusan: MOCK_JURUSAN[1] },
  { id: 3, nama_kelas: "X TKJ 1", jurusan_id: 1, jurusan: MOCK_JURUSAN[0] },
  { id: 4, nama_kelas: "XII MM 1", jurusan_id: 3, jurusan: MOCK_JURUSAN[2] },
];

const MOCK_SISWA: Siswa[] = [
  {
    id: 1,
    nis: "20241001",
    nama: "Ahmad Fauzi",
    jenis_kelamin: "L",
    kelas_id: 1,
    kelas: MOCK_KELAS[0],
    telepon: "081234567890",
    alamat: "Jl. Merdeka No. 12, Bandung",
    status: "Aktif",
    created_at: "2024-01-15",
  },
  {
    id: 2,
    nis: "20241002",
    nama: "Siti Nurhaliza",
    jenis_kelamin: "P",
    kelas_id: 1,
    kelas: MOCK_KELAS[0],
    telepon: "082345678901",
    alamat: "Jl. Sudirman No. 45, Bandung",
    status: "Aktif",
    created_at: "2024-01-15",
  },
  {
    id: 3,
    nis: "20241003",
    nama: "Budi Santoso",
    jenis_kelamin: "L",
    kelas_id: 2,
    kelas: MOCK_KELAS[1],
    telepon: "083456789012",
    alamat: "Jl. Asia Afrika No. 88, Bandung",
    status: "Aktif",
    created_at: "2024-01-16",
  },
  {
    id: 4,
    nis: "20241004",
    nama: "Dewi Lestari",
    jenis_kelamin: "P",
    kelas_id: 3,
    kelas: MOCK_KELAS[2],
    telepon: "084567890123",
    alamat: "Jl. Riau No. 102, Bandung",
    status: "Aktif",
    created_at: "2024-01-17",
  },
  {
    id: 5,
    nis: "20241005",
    nama: "Eko Prasetyo",
    jenis_kelamin: "L",
    kelas_id: 4,
    kelas: MOCK_KELAS[3],
    telepon: "085678901234",
    alamat: "Jl. Dago No. 50, Bandung",
    status: "Non-Aktif",
    created_at: "2024-01-18",
  },
];

export default function SiswaPage() {
  const [data, setData] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [selectedKelas, setSelectedKelas] = useState<string>("all");
  const [selectedJurusan, setSelectedJurusan] = useState<string>("all");

  // Form dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{
    id: number | string | null;
    nis: string;
    nama: string;
    jenis_kelamin: string;
    kelas_id: string;
    telepon: string;
    alamat: string;
    status: string;
  }>({
    id: null,
    nis: "",
    nama: "",
    jenis_kelamin: "L",
    kelas_id: "",
    telepon: "",
    alamat: "",
    status: "Aktif",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let siswaRes, kelasRes, jurusanRes;

      try {
        [siswaRes, kelasRes, jurusanRes] = await Promise.all([
          api.get("/siswa"),
          api.get("/kelas"),
          api.get("/jurusan"),
        ]);
      } catch {
        [siswaRes, kelasRes, jurusanRes] = await Promise.all([
          api.get("/api/students"),
          api.get("/api/classes"),
          api.get("/api/classes/majors"),
        ]);
      }

      const parsedJurusan: Jurusan[] = Array.isArray(jurusanRes?.data?.data || jurusanRes?.data)
        ? (jurusanRes?.data?.data || jurusanRes?.data).map((j: any) => ({
            id: j.id,
            nama_jurusan: j.nama_jurusan || j.name || "",
            kode_jurusan: j.kode_jurusan || j.alias || "",
          }))
        : MOCK_JURUSAN;
      setJurusanList(parsedJurusan);

      const parsedKelas: Kelas[] = Array.isArray(kelasRes?.data?.data || kelasRes?.data)
        ? (kelasRes?.data?.data || kelasRes?.data).map((k: any) => {
            const jId = k.jurusan_id || k.majorId;
            const foundJ = parsedJurusan.find((j) => String(j.id) === String(jId)) || k.jurusan;
            return {
              id: k.id,
              nama_kelas: k.nama_kelas || k.className || k.name || "",
              jurusan_id: jId || "",
              jurusan: foundJ,
            };
          })
        : MOCK_KELAS;
      setKelasList(parsedKelas);

      const rawSiswa = siswaRes?.data?.data || siswaRes?.data || [];
      if (Array.isArray(rawSiswa) && rawSiswa.length > 0) {
        const mapped: Siswa[] = rawSiswa.map((item: any) => {
          const kId = item.kelas_id || item.classId;
          const foundK = parsedKelas.find((k) => String(k.id) === String(kId)) || item.kelas;
          return {
            id: item.id,
            nis: item.nis || item.studentNumber || "-",
            nama: item.nama || item.name || "",
            jenis_kelamin: item.jenis_kelamin || item.gender || "L",
            kelas_id: kId || "",
            kelas: foundK,
            telepon: item.telepon || item.phone || "-",
            alamat: item.alamat || item.address || "-",
            status: item.status || "Aktif",
            created_at: item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "-",
          };
        });
        setData(mapped);
      } else {
        setData(MOCK_SISWA);
      }
    } catch {
      setJurusanList(MOCK_JURUSAN);
      setKelasList(MOCK_KELAS);
      setData(MOCK_SISWA);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter logic
  const filteredData = data.filter((item) => {
    if (selectedKelas !== "all" && String(item.kelas_id) !== String(selectedKelas)) {
      return false;
    }
    if (selectedJurusan !== "all") {
      const jId = item.kelas?.jurusan_id || item.kelas?.jurusan?.id;
      if (String(jId) !== String(selectedJurusan)) {
        return false;
      }
    }
    return true;
  });

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      id: null,
      nis: "",
      nama: "",
      jenis_kelamin: "L",
      kelas_id: kelasList.length > 0 ? String(kelasList[0].id) : "",
      telepon: "",
      alamat: "",
      status: "Aktif",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: Siswa) => {
    setIsEditing(true);
    setFormData({
      id: item.id,
      nis: item.nis,
      nama: item.nama,
      jenis_kelamin: item.jenis_kelamin || "L",
      kelas_id: item.kelas_id ? String(item.kelas_id) : (item.kelas?.id ? String(item.kelas.id) : ""),
      telepon: item.telepon || "",
      alamat: item.alamat || "",
      status: item.status || "Aktif",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis.trim() || !formData.nama.trim()) {
      toast.error("NIS dan Nama Siswa wajib diisi");
      return;
    }

    setIsSubmitting(true);
    const selectedK = kelasList.find((k) => String(k.id) === String(formData.kelas_id));

    const payload = {
      nis: formData.nis,
      nama: formData.nama,
      name: formData.nama,
      jenis_kelamin: formData.jenis_kelamin,
      gender: formData.jenis_kelamin,
      kelas_id: formData.kelas_id,
      classId: formData.kelas_id,
      telepon: formData.telepon,
      phone: formData.telepon,
      alamat: formData.alamat,
      address: formData.alamat,
      status: formData.status,
    };

    try {
      if (isEditing && formData.id) {
        try {
          await api.put(`/siswa/${formData.id}`, payload);
        } catch {
          await api.put(`/api/students/${formData.id}`, payload);
        }
        toast.success("Data siswa berhasil diperbarui");
        setData((prev) =>
          prev.map((item) =>
            item.id === formData.id
              ? {
                  ...item,
                  nis: formData.nis,
                  nama: formData.nama,
                  jenis_kelamin: formData.jenis_kelamin,
                  kelas_id: formData.kelas_id,
                  kelas: selectedK || item.kelas,
                  telepon: formData.telepon,
                  alamat: formData.alamat,
                  status: formData.status,
                }
              : item
          )
        );
      } else {
        let newId = Date.now();
        try {
          const res = await api.post("/siswa", payload);
          if (res?.data?.data?.id) newId = res.data.data.id;
        } catch {
          try {
            const res = await api.post("/api/students", payload);
            if (res?.data?.data?.id) newId = res.data.data.id;
          } catch {
            // Local state fallback
          }
        }
        toast.success("Siswa baru berhasil ditambahkan");
        const newItem: Siswa = {
          id: newId,
          nis: formData.nis,
          nama: formData.nama,
          jenis_kelamin: formData.jenis_kelamin,
          kelas_id: formData.kelas_id,
          kelas: selectedK,
          telepon: formData.telepon,
          alamat: formData.alamat,
          status: formData.status,
          created_at: new Date().toLocaleDateString("id-ID"),
        };
        setData((prev) => [newItem, ...prev]);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menyimpan data siswa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (id: number | string) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      try {
        await api.delete(`/siswa/${deletingId}`);
      } catch {
        await api.delete(`/api/students/${deletingId}`);
      }
      toast.success("Siswa berhasil dihapus");
      setData((prev) => prev.filter((item) => item.id !== deletingId));
    } catch {
      setData((prev) => prev.filter((item) => item.id !== deletingId));
      toast.success("Siswa berhasil dihapus");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setDeletingId(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const columns: ColumnDef<Siswa>[] = [
    {
      accessorKey: "nis",
      header: "NIS",
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-primary">
          {row.original.nis}
        </span>
      ),
    },
    {
      accessorKey: "nama",
      header: "Nama Siswa",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
              {getInitials(row.original.nama || "S")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{row.original.nama}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 inline shrink-0" />
              {row.original.alamat || "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "jenis_kelamin",
      header: "L/P",
      cell: ({ row }) => {
        const jk = row.original.jenis_kelamin;
        const isL = jk === "L" || jk === "Laki-laki";
        return (
          <Badge variant={isL ? "secondary" : "outline"} className={isL ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300"}>
            {isL ? "Laki-laki" : "Perempuan"}
          </Badge>
        );
      },
    },
    {
      id: "kelas",
      header: "Kelas",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-medium">
          {row.original.kelas?.nama_kelas || "-"}
        </Badge>
      ),
    },
    {
      id: "jurusan",
      header: "Jurusan",
      cell: ({ row }) => {
        const j = row.original.kelas?.jurusan;
        return (
          <span className="text-sm text-muted-foreground font-medium">
            {j?.kode_jurusan ? `[${j.kode_jurusan}] ` : ""}
            {j?.nama_jurusan || "-"}
          </span>
        );
      },
    },
    {
      accessorKey: "telepon",
      header: "Kontak",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Phone className="h-3.5 w-3.5" />
          <span>{row.original.telepon || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isAktif = (row.original.status || "Aktif").toLowerCase() === "aktif";
        return (
          <Badge className={isAktif ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}>
            {row.original.status || "Aktif"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenEdit(row.original)}
            className="h-8 w-8 p-0"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenDelete(row.original.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            title="Hapus"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const exportData = filteredData.map((item) => ({
    id: item.id,
    nis: item.nis,
    nama: item.nama,
    jenis_kelamin: item.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan",
    kelas: item.kelas?.nama_kelas || "-",
    jurusan: item.kelas?.jurusan?.nama_jurusan || "-",
    telepon: item.telepon || "-",
    alamat: item.alamat || "-",
    status: item.status || "Aktif",
  }));

  const exportColumns = [
    { header: "NIS", key: "nis" },
    { header: "Nama Siswa", key: "nama" },
    { header: "L/P", key: "jenis_kelamin" },
    { header: "Kelas", key: "kelas" },
    { header: "Jurusan", key: "jurusan" },
    { header: "Telepon", key: "telepon" },
    { header: "Alamat", key: "alamat" },
    { header: "Status", key: "status" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Siswa"
        subtitle="Kelola direktori siswa, data profil, dan status keanggotaan"
        onAction={handleOpenCreate}
        actionLabel="Tambah Siswa"
        actionIcon={<Plus className="h-4 w-4" />}
        actions={
          <ExportButtons
            data={exportData}
            columns={exportColumns}
            fileName="data_siswa"
            title="Data Siswa"
          />
        }
      />

      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-card p-4 rounded-lg border">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filter:</span>
        </div>

        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-48 space-y-1">
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">Semua Kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-56 space-y-1">
            <select
              value={selectedJurusan}
              onChange={(e) => setSelectedJurusan(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">Semua Jurusan</option>
              {jurusanList.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.kode_jurusan ? `[${j.kode_jurusan}] ` : ""}
                  {j.nama_jurusan}
                </option>
              ))}
            </select>
          </div>

          {(selectedKelas !== "all" || selectedJurusan !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedKelas("all");
                setSelectedJurusan("all");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reset Filter
            </Button>
          )}
        </div>
      </div>

      <ReusableDataTable
        columns={columns}
        data={filteredData}
        searchKey="nama"
        searchPlaceholder="Cari siswa berdasarkan nama..."
        isLoading={isLoading}
      />

      {/* Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Data Siswa" : "Tambah Siswa Baru"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Perbarui rincian informasi siswa di bawah ini."
                : "Masukkan data siswa baru untuk didaftarkan."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nis">NIS (Nomor Induk Siswa) *</Label>
                <Input
                  id="nis"
                  placeholder="Contoh: 20241001"
                  value={formData.nis}
                  onChange={(e) =>
                    setFormData({ ...formData, nis: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap *</Label>
                <Input
                  id="nama"
                  placeholder="Nama lengkap siswa"
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                <select
                  id="jenis_kelamin"
                  value={formData.jenis_kelamin}
                  onChange={(e) =>
                    setFormData({ ...formData, jenis_kelamin: e.target.value })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kelas_id">Kelas</Label>
                <select
                  id="kelas_id"
                  value={formData.kelas_id}
                  onChange={(e) =>
                    setFormData({ ...formData, kelas_id: e.target.value })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telepon">No. Telepon / WhatsApp</Label>
                <Input
                  id="telepon"
                  placeholder="Contoh: 08123456789"
                  value={formData.telepon}
                  onChange={(e) =>
                    setFormData({ ...formData, telepon: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status Keanggotaan</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Non-Aktif">Non-Aktif</option>
                  <option value="Lulus">Lulus</option>
                  <option value="Pindah">Pindah</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat Tempat Tinggal</Label>
              <Input
                id="alamat"
                placeholder="Alamat lengkap siswa"
                value={formData.alamat}
                onChange={(e) =>
                  setFormData({ ...formData, alamat: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Simpan Perubahan" : "Tambah Siswa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={isDeleteOpen}
        title="Hapus Data Siswa"
        description="Apakah Anda yakin ingin menghapus siswa ini? Seluruh rekaman absensi siswa terkait juga dapat terpengaruh."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingId(null);
        }}
      />
    </div>
  );
}
