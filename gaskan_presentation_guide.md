# 🚀 Panduan & Struktur Presentasi Proyek GASKAN

> [!TIP]
> **Slide Deck Interaktif (HTML)** telah dibuat! Anda bisa membuka file presentation deck interaktif langsung di browser dengan mengklik tautan berikut:  
> 🔗 [Buka Live HTML Presentation Deck](file:///D:/Coding/gaskan/gaskan_presentation.html)  
> *(Gunakan tombol navigasi atau tombol keyboard `→` / `←` / `Space` untuk berpindah slide).*

---

## 🎨 Konsep Utama & Strategy Presentation

- **Tema Visual**: Premium Dark Mode dengan **Kuning Khas GASKAN (`#F2C300`)** dan Glassmorphism futuristik.
- **Strategi Storytelling ("Bikin Penasaran")**:
  1. **Pertanyaan Menohok (The Hook)**: Mulai dengan fakta masalah absensi sekolah yang dialami hampir semua audiens.
  2. **The Reveal**: Memperkenalkan **GASKAN** bukan sekadar "Web Absensi", melainkan **Ekosistem Pintar Real-time (IoT + AI + WebSockets)**.
  3. **Visual WOW Factor**: Menjelaskan fitur Live Attendance Feed dengan latensi kurang dari 1 detik dan otomatisasi rekap laporan (PDF/Excel).
  4. **The Impact**: Menutup dengan angka keberhasilan yang konkret (0% titip absen, 95% hemat waktu rekap).

---

## 📑 Struktur Slide-by-Slide & Script Presenter

### Slide 1: Cover & Judul Utama (The Hook)
- **Judul**: **GASKAN** — *Gerbang Akses Pintar dan Kehadiran*
- **Sub-judul**: Transformasi Ekosistem Kehadiran Sekolah Real-Time Berbasis IoT, AI Face Recognition, & WebSockets Latensi Rendah.
- **Elemen Visual**: Logo GASKAN bercahaya, badge highlight teknologi (Real-Time, 0% Titip Absen, Smart Gate).
- **Naskah Presenter (Script)**:
  > *"Bapak/Ibu dan rekan-rekan sekalian, bayangkan sebuah sekolah dengan ribuan siswa, namun saat jam masuk tiba... tidak ada antrean panjang di gerbang, tidak ada guru piket yang pusing memegang lembaran kertas, dan tidak ada lagi istilah 'titip absen'. Selamat datang di **GASKAN** — Gerbang Akses Pintar dan Kehadiran SMTI Yogyakarta."*

---

### Slide 2: Problem Statement (Tarik Perhatian Audiens)
- **Judul**: Mengapa Absensi Konvensional Sekolah **Sudah Usang**?
- **Poin Utama**:
  1. ⏳ **Antrean Panjang di Gerbang/Kelas**: Menyita 15-30 menit waktu belajar pertama.
  2. ⚠️ **Risiko Titip Absen & Manipulasi**: Paraf palsu dan tidak adanya verifikasi fisik real-time.
  3. 📑 **Rekap Lambat & Laborius**: Guru/Admin menghabiskan berjam-jam tiap akhir bulan hanya untuk merekap lembar kertas.
- **Naskah Presenter (Script)**:
  > *"Mengapa kita harus mengubah sistem yang ada? Karena sistem absensi konvensional memiliki 3 masalah fatal: membuang waktu belajar, rentan manipulasi data, dan menyedot waktu guru hanya untuk pekerjaan administratif manual."*

---

### Slide 3: The Solution (Memperkenalkan GASKAN)
- **Judul**: Satu Ekosistem untuk **Seluruh Kehadiran**
- **Fitur Kunci**:
  - 📷 **Scan Instant**: Verifikasi Wajah/RFID di Smart Gate dalam < 1 detik.
  - ⚡ **WebSocket Live Feed**: Pembaruan data presensi instan tanpa reload halaman.
  - 📊 **Laporan Otomatis**: Rekap bulanan siap cetak dalam bentuk PDF & Excel.
  - 🛡️ **Akses Multi-Role**: Hak akses terpisah untuk Siswa, Admin Sekolah, dan Pembimbing.
- **Naskah Presenter (Script)**:
  > *"GASKAN hadir sebagai jawaban komprehensif. Begitu siswa melangkah melewati Smart Gate, sistem memverifikasi identitas kurang dari 1 detik dan langsung menyinkronkan data ke seluruh dashboard sekolah secara otomatis."*

---

### Slide 4: Fitur-Fitur Unggulan Platform
- **Judul**: Pengalaman **Dashboard Modern & Serba Otomatis**
- **Poin Utama**:
  - **Multi-Gate Live Feed**: Pemantauan langsung di pintu gerbang kiri, kanan, dan pusat.
  - **Sistem Pengajuan Izin/Sakit**: Pengajuan surat izin digital oleh siswa dengan alur persetujuan (approval) berjenjang.
  - **Audit Trail & Logging**: Pencatatan log lengkap (Kehadiran, Login, Perangkat Onsite, dan System Errors).
- **Naskah Presenter (Script)**:
  > *"Bukan cuma catat hadir, GASKAN menyediakan platform manajemen kehadiran menyeluruh. Mulai dari pengajuan izin sakit via smartphone hingga log keamanan perangkat IoT terintegrasi."*

---

### Slide 5: Arsitektur & Teknologi (Tech Stack)
- **Judul**: Performa Tinggi, Keamanan, & Skalabilitas
- **Teknologi Utama**:
  - **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, base-ui / Shadcn UI.
  - **Backend & Real-Time**: Node.js REST API & Socket.io WebSockets.
  - **Hardware/IoT**: Integrated Smart Gate Face Recognition Controller.
  - **Responsiveness**: Mobile-first PWA, touch optimized & accessibility standard.
- **Naskah Presenter (Script)**:
  > *"Di balik tampilan yang elegan, GASKAN ditenagai oleh Next.js 16 dan Socket.io. Ini menjamin sistem tetap cepat, ringan, dan sanggup menangani ribuan transaksi presensi serentak tanpa kendala."*

---

### Slide 6: Hasil & Dampak (Dampak Nyata)
- **Judul**: Dampak Nyata bagi **SMTI Jogja**
- **Metrik Keberhasilan**:
  - 🎯 **100% Akurasi Data**: Bebas kecurangan & manipulasi.
  - ⏱️ **95% Penghematan Waktu**: Rekap data bulanan selesai dalam hitungan detik.
  - ⚡ **< 1 Detik Latensi**: Kecepatan tap/scan di gerbang utama.
- **Naskah Presenter (Script)**:
  > *"Hasilnya? Kami berhasil memangkas waktu rekap hingga 95% dan memastikan akurasi data presensi 100%. Sekolah tidak lagi terbebani urusan administrasi manual."*

---

### Slide 7: Penutup & Call to Action (Q&A)
- **Judul**: Siap Memulai Bersama **GASKAN**?
- **Quote Closing**: *"Mewujudkan Sekolah Cerdas, Disiplin, dan Transparan dalam Satu Sentuhan."*
- **Aksi Next Step**: Sesi Q&A & Demo Langsung.
- **Naskah Presenter (Script)**:
  > *"GASKAN bukan sekadar teknologi, melainkan langkah nyata menuju transformasi digital pendidikan yang transparan dan efisien. Terima kasih, mari kita buka sesi diskusi dan tanya jawab!"*

---

## 🛠️ Cara Menggunakan Materi Ini

1. **Untuk Presentasi Langsung**:  
   Buka file [gaskan_presentation.html](file:///D:/Coding/gaskan/gaskan_presentation.html) di Google Chrome / Edge / Firefox. Tekan `F11` untuk masuk ke mode Fullscreen.
2. **Untuk Digunakan di PowerPoint / Canva**:  
   Gunakan poin-poin dan skrip narasi di atas. Gunakan warna aksen **Kuning GASKAN (`#F2C300`)** dan background **Dark Mode (`#0A0C10`)** agar visual presentasi terlihat mewah dan profesional.
