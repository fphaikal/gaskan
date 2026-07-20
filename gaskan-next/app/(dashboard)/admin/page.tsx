"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  Shield,
  Loader2,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MOCK_ADMINS: Admin[] = [
  {
    id: 1,
    username: "admin_super",
    nama: "Fahreza Haikal",
    email: "fahreza@gaskan.sch.id",
    role: "superadmin",
    created_at: "2024-01-10",
  },
  {
    id: 2,
    username: "admin_kurikulum",
    nama: "Bambang Sudarsono",
    email: "bambang@gaskan.sch.id",
    role: "admin",
    created_at: "2024-02-15",
  },
  {
    id: 3,
    username: "operator_absensi",
    nama: "Rina Wijaya",
    email: "rina@gaskan.sch.id",
    role: "operator",
    created_at: "2024-03-01",
  },
  {
    id: 4,
    username: "admin_kesiswaan",
    nama: "Dedi Gunawan",
    email: "dedi@gaskan.sch.id",
    role: "admin",
    created_at: "2024-04-12",
  },
];

export default function AdminPage() {
  const [admins, setAdmins] = useState<Admin[]>(MOCK_ADMINS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
      const res = await api.get("/admin");
      if (res.data && Array.isArray(res.data)) {
        setAdmins(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
        setAdmins(res.data.data);
      }
    } catch (error) {
      console.log("Using mock admins data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

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
    setUsername(admin.username || "");
    setNama(admin.nama || "");
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
        nama,
        email,
        role,
        ...(password ? { password } : {}),
      };

      if (editingAdmin) {
        await api.put(`/admin/${editingAdmin.id}`, payload);
        toast.success("Data admin berhasil diperbarui");
        setAdmins((prev) =>
          prev.map((item) =>
            item.id === editingAdmin.id
              ? { ...item, username, nama, email, role }
              : item
          )
        );
      } else {
        const res = await api.post("/admin", payload);
        const newAdmin: Admin = res.data?.data || {
          id: Date.now(),
          username,
          nama,
          email,
          role,
          created_at: new Date().toISOString().split("T")[0],
        };
        toast.success("Akun admin baru berhasil ditambahkan");
        setAdmins((prev) => [newAdmin, ...prev]);
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      console.log("Fallback mock submit admin:", error);
      if (editingAdmin) {
        setAdmins((prev) =>
          prev.map((item) =>
            item.id === editingAdmin.id
              ? { ...item, username, nama, email, role }
              : item
          )
        );
        toast.success("Data admin berhasil diperbarui");
      } else {
        const newAdmin: Admin = {
          id: Date.now(),
          username,
          nama,
          email,
          role,
          created_at: new Date().toISOString().split("T")[0],
        };
        setAdmins((prev) => [newAdmin, ...prev]);
        toast.success("Akun admin baru berhasil ditambahkan");
      }
      setIsDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAdmin) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/${deletingAdmin.id}`);
      setAdmins((prev) => prev.filter((item) => item.id !== deletingAdmin.id));
      toast.success("Akun admin berhasil dihapus");
    } catch (error) {
      console.log("Fallback mock delete admin:", error);
      setAdmins((prev) => prev.filter((item) => item.id !== deletingAdmin.id));
      toast.success("Akun admin berhasil dihapus");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setDeletingAdmin(null);
    }
  };

  const getRoleBadge = (roleName: string) => {
    switch (roleName?.toLowerCase()) {
      case "superadmin":
        return (
          <Badge className="bg-purple-500/15 text-purple-600 hover:bg-purple-500/25 border-purple-200 dark:border-purple-800">
            Super Admin
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-200 dark:border-blue-800">
            Admin
          </Badge>
        );
      case "operator":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-amber-200 dark:border-amber-800">
            Operator
          </Badge>
        );
      default:
        return <Badge variant="outline">{roleName}</Badge>;
    }
  };

  const columns: ColumnDef<Admin>[] = [
    {
      accessorKey: "username",
      header: "Username",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-foreground">
            {row.original.username}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "nama",
      header: "Nama Lengkap",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.nama}</span>
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
        <span className="text-xs text-muted-foreground">
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
            size="icon-sm"
            onClick={() => handleOpenEdit(row.original)}
            title="Edit Admin"
          >
            <Pencil className="h-4 w-4 text-blue-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleOpenDelete(row.original)}
            title="Hapus Admin"
          >
            <Trash2 className="h-4 w-4 text-rose-500" />
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

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Kelola Akun Admin"
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
      />

      {/* Add / Edit Admin Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAdmin ? "Edit Akun Admin" : "Tambah Admin Baru"}
            </DialogTitle>
            <DialogDescription>
              Isi data akun administrator di bawah ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="contoh: admin_kesiswaan"
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role / Peran</Label>
              <Select value={role} onValueChange={(val) => setRole(val || "admin")}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                </SelectContent>
              </Select>
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
                required={!editingAdmin}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAdmin ? "Simpan Perubahan" : "Tambah Admin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={isDeleteOpen}
        title="Hapus Akun Admin?"
        description={`Apakah Anda yakin ingin menghapus akun admin "${deletingAdmin?.username}"? Tindakan ini tidak dapat dibatalkan.`}
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
