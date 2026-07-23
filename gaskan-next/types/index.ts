export interface User {
  id?: number | string;
  nis?: string;
  username?: string;
  nama?: string;
  role?: string;
  kelas?: string | Kelas;
  jurusan?: string | Jurusan;
  email?: string;
  avatar?: string;
  [key: string]: any;
}

export interface Jurusan {
  id: number | string;
  nama_jurusan: string;
  kode_jurusan?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Kelas {
  id: number | string;
  nama_kelas: string;
  jurusan_id?: number | string;
  jurusan?: Jurusan;
  created_at?: string;
  updated_at?: string;
}

export interface Semester {
  id: number | string;
  nama: string;
  semester: string;
  tahun_ajaran: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Siswa {
  id: number | string;
  nis: string;
  nama: string;
  kelas_id?: number | string;
  kelas?: Kelas;
  jenis_kelamin?: 'L' | 'P' | string;
  status?: string;
  alamat?: string;
  telepon?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Absensi {
  id: number | string;
  siswa_id: number | string;
  siswa?: Siswa;
  tanggal: string;
  status: 'hadir' | 'izin' | 'sakit' | 'alpa' | string;
  keterangan?: string;
  foto?: string;
  waktu_masuk?: string;
  waktu_keluar?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Izin {
  id: number | string;
  siswa_id: number | string;
  siswa?: Siswa;
  tanggal_mulai: string;
  tanggal_selesai: string;
  jenis_izin: 'izin' | 'sakit' | string;
  alasan: string;
  status: 'pending' | 'disetujui' | 'ditolak' | string;
  lampiran?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Admin {
  id: number | string;
  username: string;
  nama: string;
  role: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Log {
  id: number | string;
  user_id?: number | string;
  aktivitas: string;
  ip_address?: string;
  created_at: string;
  updated_at?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
