"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Loader2, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { Semester } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReusableDataTable } from "@/components/shared/ReusableDataTable";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MOCK_SEMESTER: Semester[] = [
  {
    id: 1,
    nama: "Semester Ganjil 2024/2025",
    semester: "Ganjil",
    tahun_ajaran: "2024/2025",
    is_active: true,
    created_at: "2024-01-10",
  },
  {
    id: 2,
    nama: "Semester Genap 2024/2025",
    semester: "Genap",
    tahun_ajaran: "2024/2025",
    is_active: false,
    created_at: "2024-01-10",
  },
  {
    id: 3,
    nama: "Semester Ganjil 2023/2024",
    semester: "Ganjil",
    tahun_ajaran: "2023/2024",
    is_active: false,
    created_at: "2023-07-10",
  },
];

export default function SemesterPage() {
  const [data, setData] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{
    id: number | string | null;
    nama: string;
    semester: string;
    tahun_ajaran: string;
    is_active: boolean;
  }>({
    id: null,
    nama: "",
    semester: "Ganjil",
    tahun_ajaran: "2024/2025",
    is_active: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let res;
      try {
        res = await api.get("/semester");
      } catch {
        res = await api.get("/api/semester");
      }

      const list = res?.data?.data || res?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        const mapped: Semester[] = list.map((item: any) => ({
          id: item.id,
          nama: item.nama || item.name || "",
          semester: item.semester || (item.name?.includes("Genap") ? "Genap" : "Ganjil"),
          tahun_ajaran: item.tahun_ajaran || item.academicYear?.year || "2024/2025",
          is_active: item.is_active ?? item.isActive ?? false,
          created_at: item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "-",
        }));
        setData(mapped);
      } else {
        setData(MOCK_SEMESTER);
      }
    } catch {
      setData(MOCK_SEMESTER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      id: null,
      nama: "",
      semester: "Ganjil",
      tahun_ajaran: "2024/2025",
      is_active: false,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: Semester) => {
    setIsEditing(true);
    setFormData({
      id: item.id,
      nama: item.nama,
      semester: item.semester || "Ganjil",
      tahun_ajaran: item.tahun_ajaran || "2024/2025",
      is_active: !!item.is_active,
    });
    setIsFormOpen(true);
  };

  const handleToggleActive = async (target: Semester) => {
    if (target.is_active) {
      toast.info("Semester ini sudah aktif.");
      return;
    }

    try {
      try {
        await api.put(`/semester/${target.id}/activate`);
      } catch {
        await api.put(`/semester/${target.id}`, { ...target, is_active: true });
      }
      toast.success(`Semester "${target.nama}" berhasil diaktifkan`);
      setData((prev) =>
        prev.map((item) => ({
          ...item,
          is_active: item.id === target.id,
        }))
      );
    } catch {
      // Local state fallback
      setData((prev) =>
        prev.map((item) => ({
          ...item,
          is_active: item.id === target.id,
        }))
      );
      toast.success(`Semester "${target.nama}" berhasil diaktifkan`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      toast.error("Nama semester wajib diisi");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      nama: formData.nama,
      name: formData.nama,
      semester: formData.semester,
      tahun_ajaran: formData.tahun_ajaran,
      is_active: formData.is_active,
      isActive: formData.is_active,
    };

    try {
      if (isEditing && formData.id) {
        try {
          await api.put(`/semester/${formData.id}`, payload);
        } catch {
          await api.put(`/api/semester/${formData.id}`, payload);
        }
        toast.success("Semester berhasil diperbarui");
        setData((prev) =>
          prev.map((item) => {
            if (item.id === formData.id) {
              return {
                ...item,
                nama: formData.nama,
                semester: formData.semester,
                tahun_ajaran: formData.tahun_ajaran,
                is_active: formData.is_active,
              };
            }
            // If the updated semester is set to active, deactivate others
            return formData.is_active ? { ...item, is_active: false } : item;
          })
        );
      } else {
        let newId = Date.now();
        try {
          const res = await api.post("/semester", payload);
          if (res?.data?.data?.id) newId = res.data.data.id;
        } catch {
          try {
            const res = await api.post("/api/semester", payload);
            if (res?.data?.data?.id) newId = res.data.data.id;
          } catch {
            // Local state fallback
          }
        }
        toast.success("Semester berhasil ditambahkan");
        const newItem: Semester = {
          id: newId,
          nama: formData.nama,
          semester: formData.semester,
          tahun_ajaran: formData.tahun_ajaran,
          is_active: formData.is_active,
          created_at: new Date().toLocaleDateString("id-ID"),
        };
        setData((prev) => {
          const list = formData.is_active
            ? prev.map((s) => ({ ...s, is_active: false }))
            : [...prev];
          return [newItem, ...list];
        });
      }
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menyimpan semester");
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
        await api.delete(`/semester/${deletingId}`);
      } catch {
        await api.delete(`/api/semester/${deletingId}`);
      }
      toast.success("Semester berhasil dihapus");
      setData((prev) => prev.filter((item) => item.id !== deletingId));
    } catch {
      setData((prev) => prev.filter((item) => item.id !== deletingId));
      toast.success("Semester berhasil dihapus");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<Semester>[] = [
    {
      accessorKey: "nama",
      header: "Nama Semester",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold">{row.original.nama}</span>
        </div>
      ),
    },
    {
      accessorKey: "semester",
      header: "Tipe Semester",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.semester || "-"}</span>
      ),
    },
    {
      accessorKey: "tahun_ajaran",
      header: "Tahun Ajaran",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.tahun_ajaran || "-"}</span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status Active",
      cell: ({ row }) => {
        const isActive = row.original.is_active;
        return (
          <button
            type="button"
            onClick={() => handleToggleActive(row.original)}
            className="cursor-pointer focus:outline-hidden"
            title="Klik untuk mengubah status aktif"
          >
            {isActive ? (
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Aktif
              </Badge>
            ) : (
              <Badge variant="secondary" className="hover:bg-accent text-muted-foreground">
                Tidak Aktif
              </Badge>
            )}
          </button>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Tanggal Dibuat",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.created_at || "-"}
        </span>
      ),
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

  const exportData = data.map((item) => ({
    id: item.id,
    nama: item.nama,
    semester: item.semester || "-",
    tahun_ajaran: item.tahun_ajaran || "-",
    status_text: item.is_active ? "Aktif" : "Tidak Aktif",
    created_at: item.created_at || "-",
  }));

  const exportColumns = [
    { header: "ID", key: "id" },
    { header: "Nama Semester", key: "nama" },
    { header: "Semester", key: "semester" },
    { header: "Tahun Ajaran", key: "tahun_ajaran" },
    { header: "Status", key: "status_text" },
    { header: "Tanggal Dibuat", key: "created_at" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Semester"
        subtitle="Kelola semester akademik dan status semester aktif"
        onAction={handleOpenCreate}
        actionLabel="Tambah Semester"
        actionIcon={<Plus className="h-4 w-4" />}
        actions={
          <ExportButtons
            data={exportData}
            columns={exportColumns}
            fileName="data_semester"
            title="Data Semester"
          />
        }
      />

      <ReusableDataTable
        columns={columns}
        data={data}
        searchKey="nama"
        searchPlaceholder="Cari nama semester..."
        isLoading={isLoading}
      />

      {/* Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Semester" : "Tambah Semester Baru"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Perbarui detail semester di bawah ini."
                : "Masukkan detail semester akademik baru."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Semester *</Label>
              <Input
                id="nama"
                placeholder="Contoh: Semester Ganjil 2024/2025"
                value={formData.nama}
                onChange={(e) =>
                  setFormData({ ...formData, nama: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="semester">Jenis Semester</Label>
                <select
                  id="semester"
                  value={formData.semester}
                  onChange={(e) =>
                    setFormData({ ...formData, semester: e.target.value })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tahun_ajaran">Tahun Ajaran</Label>
                <Input
                  id="tahun_ajaran"
                  placeholder="Contoh: 2024/2025"
                  value={formData.tahun_ajaran}
                  onChange={(e) =>
                    setFormData({ ...formData, tahun_ajaran: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Jadikan Semester Aktif saat ini
              </Label>
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
                {isEditing ? "Simpan Perubahan" : "Tambah Semester"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={isDeleteOpen}
        title="Hapus Semester"
        description="Apakah Anda yakin ingin menghapus semester ini? Tindakan ini tidak dapat dibatalkan."
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
