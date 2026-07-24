"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  Pencil,
  Trash2,
  Mail,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { Admin } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReusableDataTable } from "@/components/shared/ReusableDataTable";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { DataMasterTablePageSkeleton } from "@/components/shared/DataMasterSkeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const [pageCount, setPageCount] = useState(-1);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);

  // Form State
  const [username, setUsername] = useState<string>("");
  const [nama, setNama] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<string>("admin");
  const [password, setPassword] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete Confirm State
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [deletingAdmin, setDeletingAdmin] = useState<Admin | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize)
      });
      const res = await api.get(`/users?${params.toString()}`).catch(() => api.get("/admin"));
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setAdmins(data);
        if (res.data?.pagination) {
          setPageCount(Math.ceil(res.data.pagination.total / res.data.pagination.limit));
        }
      }
    } catch (error) {
      console.log("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins, pagination.pageIndex, pagination.pageSize]);

  const handleOpenAdd = () => {
    setEditingAdmin(null);
    setUsername("");
    setNama("");
    setEmail("");
    setRole("admin");
    setPassword("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setUsername(admin.username || (admin as any).nis || "");
    setNama(admin.nama || (admin as any).name || "");
    setEmail(admin.email || "");
    setRole(admin.role || "admin");
    setPassword("");
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (admin: Admin) => {
    setDeletingAdmin(admin);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !nama.trim()) {
      toast.error("Username dan Nama wajib diisi");
      return;
    }

    if (!editingAdmin && !password.trim()) {
      toast.error("Password wajib diisi untuk akun baru");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        username,
        name: nama,
        email,
        role: role.toUpperCase(),
        ...(password ? { password } : {}),
      };

      if (editingAdmin) {
        await api.put(`/users/${editingAdmin.id}`, payload).catch(() => api.put(`/admin/${editingAdmin.id}`, payload));
        toast.success("Data admin berhasil diperbarui");
      } else {
        await api.post("/users", payload).catch(() => api.post("/admin", payload));
        toast.success("Akun admin baru berhasil ditambahkan");
      }
      setIsDialogOpen(false);
      await fetchAdmins();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menyimpan akun admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAdmin) return;
    setIsDeleting(true);
    try {
      await api.delete(`/users/${deletingAdmin.id}`).catch(() => api.delete(`/admin/${deletingAdmin.id}`));
      toast.success("Akun admin berhasil dihapus");
      await fetchAdmins();
    } catch (error: any) {
      toast.error("Gagal menghapus akun admin");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setDeletingAdmin(null);
    }
  };

  const getRoleBadge = (roleName: string) => {
    switch (roleName?.toLowerCase()) {
      case "superadmin":
      case "developer":
        return (
          <Badge className="bg-purple-500/15 text-purple-600 border-purple-500/30 text-xs font-bold">
            {roleName.toUpperCase()}
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 text-xs font-bold">
            ADMIN
          </Badge>
        );
      case "operator":
      case "guru":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs font-bold">
            {roleName.toUpperCase()}
          </Badge>
        );
      default:
        return <Badge variant="outline">{roleName}</Badge>;
    }
  };

  const columns: ColumnDef<Admin>[] = [
    {
      accessorKey: "username",
      header: "Username / ID",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-bold text-foreground">
            {row.original.username || (row.original as any).nis || "-"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "nama",
      header: "Nama Lengkap",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.nama || (row.original as any).name}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <Mail className="h-3.5 w-3.5" />
          <span>{row.original.email || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role / Hak Akses",
      cell: ({ row }) => getRoleBadge(row.original.role),
    },
    {
      accessorKey: "created_at",
      header: "Tanggal Dibuat",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-mono">
          {row.original.created_at || "-"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-sky-500"
            onClick={() => handleOpenEdit(row.original)}
            title="Edit Admin"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-rose-500"
            onClick={() => handleOpenDelete(row.original)}
            title="Hapus Admin"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const exportColumns = [
    { header: "Username", key: "username" },
    { header: "Nama Lengkap", key: "nama" },
    { header: "Email", key: "email" },
    { header: "Role", key: "role" },
    { header: "Tanggal Dibuat", key: "created_at" },
  ];

  if (isLoading && admins.length === 0) {
    return <DataMasterTablePageSkeleton actionCount={2} />;
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Kelola Akun Admin & Pengguna"
        subtitle="Manajemen akun administrator, staf operator, dan hak akses pengguna sistem"
        actionLabel="Tambah Admin"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={handleOpenAdd}
        actions={
          <ExportButtons
            data={admins}
            columns={exportColumns}
            fileName="data_admin_gaskan"
            title="Data Administrator Gaskan"
          />
        }
      />

      {/* Main Table */}
      <ReusableDataTable
        columns={columns}
        data={admins}
        searchKey="username"
        searchPlaceholder="Cari username atau nama admin..."
        isLoading={isLoading}
        manualPagination
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
        mobileColumnIds={["username", "nama", "role"]}
        mobileActionColumnId="actions"
        stickyColumnId="username"
        actionColumnId="actions"
        emptyLabel="Tidak ada akun admin ditemukan."
      />

      {/* Add / Edit Admin Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card">
            <DialogTitle className="text-xl font-black text-foreground">
              {editingAdmin ? "Edit Akun Admin" : "Tambah Admin Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
              <div className="space-y-2">
                <Label htmlFor="username">Username / NIS</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="contoh: admin_kesiswaan"
                  className="rounded-2xl bg-muted/30 font-bold h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input
                  id="nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="rounded-2xl bg-muted/30 font-bold h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gaskan.sch.id"
                  className="rounded-2xl bg-muted/30 font-bold h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Role / Peran</Label>
                <CustomSelect
                  options={[
                    { value: "superadmin", label: "Super Admin" },
                    { value: "admin", label: "Admin" },
                    { value: "operator", label: "Operator" },
                    { value: "guru", label: "Guru" },
                  ]}
                  value={role}
                  onChange={setRole}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {editingAdmin
                    ? "Password Baru (Opsional)"
                    : "Password Akun"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    editingAdmin
                      ? "Kosongkan jika tidak ingin mengubah"
                      : "Masukkan password"
                  }
                  className="rounded-2xl bg-muted/30 font-bold h-11"
                  required={!editingAdmin}
                />
              </div>
            </div>

            <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3">
              <Button
                type="button"
                variant="ghost"
                className="rounded-2xl flex-1 font-bold"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Memproses..." : editingAdmin ? "Simpan Perubahan" : "Tambah Admin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={isDeleteOpen}
        title="Hapus Akun Admin?"
        description={`Apakah Anda yakin ingin menghapus akun admin "${deletingAdmin?.username || (deletingAdmin as any)?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingAdmin(null);
        }}
      />
    </div>
  );
}
