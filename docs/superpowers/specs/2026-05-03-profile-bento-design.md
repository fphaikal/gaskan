# Profile Card Redesign: Bento Grid Architecture

## 1. Overview
Merombak `ProfileCard.vue` dari struktur tabel tradisional menjadi layout **Bento Grid** modern. Tujuannya adalah untuk menyelaraskan halaman profil dengan *design language* (Bento) yang sudah digunakan pada dashboard utama GASKAN, sekaligus membuat informasi lebih mudah di-scan secara visual.

## 2. Layout Structure (Bento Grid)
Layout akan menggunakan CSS Grid untuk membentuk "bento box" yang responsif:

*   **Mobile (1 Kolom):** Semua block bento menumpuk ke bawah.
*   **Tablet/Desktop (2-3 Kolom):** Block diatur dalam grid yang proporsional.

### Distribusi Block Bento:
1.  **Identity Block (Header / Full Width / Span 2)**
    *   Berisi: `Banner`, `Avatar`, `Nama`, `Kelas`, dan `NIS`.
    *   Tampilan: Menyerupai *header card* dengan background banner dan foto profil yang *overlapping*.
2.  **Contact Block**
    *   Berisi: `Nomor Telepon` (dan tombol Edit).
    *   Visual: Menggunakan icon telepon/whatsapp, nomor ditampilkan besar.
3.  **Vehicle Block**
    *   Berisi: `Plat Nomor` (dan tombol Edit).
    *   Visual: Menggunakan icon mobil/motor, nomor plat ditampilkan layaknya plat asli (misal teks monospace).
4.  **Personal Info Block**
    *   Berisi: `Tempat Tanggal Lahir` (beserta tombol Edit), `Gender`, `Agama`, dan `Alamat`.
    *   Tampilan: *List* berderet rapi ke bawah dengan icon kecil di setiap barisnya.
5.  **Security Action Block**
    *   Berisi: Tombol "Change Password".
    *   Aturan: Mengikuti kondisi eksisting, tombol hanya bisa diklik jika `user.Nomor` sudah terisi.

## 3. Komponen & Interaktivitas
*   **Logic yang Dipertahankan:**
    *   Semua fungsi *fetch* dan API put (`editTTL`, `editNomor`, `editPlat`).
    *   DaisyUI *Modals* (`editTTL.showModal()`, dll) tetap digunakan agar tidak merusak fungsionalitas yang sudah stabil.
*   **Perubahan Visual:**
    *   Tombol Edit (<Icon name="flowbite:edit-solid">) tidak lagi *inline* di dalam tabel, melainkan diposisikan di pojok kanan atas masing-masing Bento Block (dengan efek *hover* yang elegan).
    *   Warna background bento menggunakan `bg-base-100` atau `bg-dark` menyesuaikan tema gelap/terang, dengan `shadow-md` dan radius lengkung (`rounded-2xl` atau `rounded-xl`).

## 4. Keamanan & State
Tidak ada perubahan pada struktur state, Auth Store, atau validasi API. Ini murni merupakan *UI/UX Refactoring*. Tampilan fallback (`Belum Diatur`) tetap disematkan jika data bernilai `null`.
