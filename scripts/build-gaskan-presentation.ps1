param(
  [string]$OutputPath = (Join-Path (Get-Location) "GASKAN_Project_Overview.pptx")
)

$ErrorActionPreference = "Stop"

function Rgb([int]$r, [int]$g, [int]$b) {
  return $r + ($g * 256) + ($b * 65536)
}

$C = @{
  Ink = Rgb 11 14 20
  Panel = Rgb 21 25 34
  Panel2 = Rgb 29 34 45
  Yellow = Rgb 242 195 0
  Gold = Rgb 255 174 0
  White = Rgb 248 249 251
  Muted = Rgb 174 181 193
  Green = Rgb 24 190 128
  Red = Rgb 255 75 102
  Blue = Rgb 69 151 255
}

$ppLayoutBlank = 12
$ppSaveAsOpenXMLPresentation = 24
$msoFalse = 0
$msoTrue = -1
$msoTextOrientationHorizontal = 1
$msoShapeRectangle = 1
$msoShapeRoundedRectangle = 5
$msoShapeOval = 9
$msoShapeChevron = 52
$msoShapeLine = 1

function Add-Box {
  param($Slide, [float]$X, [float]$Y, [float]$W, [float]$H, [int]$Fill, [float]$Radius = 0, [int]$Line = -1)
  $shapeType = if ($Radius -gt 0) { $msoShapeRoundedRectangle } else { $msoShapeRectangle }
  $s = $Slide.Shapes.AddShape($shapeType, $X, $Y, $W, $H)
  $s.Fill.ForeColor.RGB = $Fill
  $s.Fill.Solid()
  if ($Line -lt 0) {
    $s.Line.Visible = $msoFalse
  } else {
    $s.Line.Visible = $msoTrue
    $s.Line.ForeColor.RGB = $Line
    $s.Line.Weight = 1
  }
  return $s
}

function Add-Text {
  param(
    $Slide, [string]$Text, [float]$X, [float]$Y, [float]$W, [float]$H,
    [float]$Size = 18, [int]$Color = $C.White, [switch]$Bold,
    [string]$Font = "Aptos", [int]$Align = 1, [float]$Margin = 2
  )
  $s = $Slide.Shapes.AddTextBox($msoTextOrientationHorizontal, $X, $Y, $W, $H)
  $s.Fill.Visible = $msoFalse
  $s.Line.Visible = $msoFalse
  $tf = $s.TextFrame
  $tf.MarginLeft = $Margin
  $tf.MarginRight = $Margin
  $tf.MarginTop = $Margin
  $tf.MarginBottom = $Margin
  $tf.WordWrap = $msoTrue
  $tf.TextRange.Text = $Text
  $tf.TextRange.Font.Name = $Font
  $tf.TextRange.Font.Size = $Size
  $tf.TextRange.Font.Color.RGB = $Color
  $tf.TextRange.Font.Bold = if ($Bold) { $msoTrue } else { $msoFalse }
  $tf.TextRange.ParagraphFormat.Alignment = $Align
  return $s
}

function Add-Rule {
  param($Slide, [float]$X, [float]$Y, [float]$W, [int]$Color = $C.Yellow, [float]$Weight = 2)
  $l = $Slide.Shapes.AddLine($X, $Y, $X + $W, $Y)
  $l.Line.ForeColor.RGB = $Color
  $l.Line.Weight = $Weight
  return $l
}

function Add-PictureCrop {
  param($Slide, [string]$Path, [float]$X, [float]$Y, [float]$W, [float]$H)
  $pic = $Slide.Shapes.AddPicture($Path, $msoFalse, $msoTrue, $X, $Y, -1, -1)
  $scale = [Math]::Max($W / $pic.Width, $H / $pic.Height)
  $pic.Width = $pic.Width * $scale
  $pic.Height = $pic.Height * $scale
  $pic.Left = $X + (($W - $pic.Width) / 2)
  $pic.Top = $Y + (($H - $pic.Height) / 2)
  $pic.PictureFormat.CropLeft = [Math]::Max(0, ($pic.Width - $W) / 2 / $scale)
  $pic.PictureFormat.CropRight = $pic.PictureFormat.CropLeft
  $pic.PictureFormat.CropTop = [Math]::Max(0, ($pic.Height - $H) / 2 / $scale)
  $pic.PictureFormat.CropBottom = $pic.PictureFormat.CropTop
  return $pic
}

function Add-Header {
  param($Slide, [string]$Kicker, [string]$Title, [string]$Subtitle = "", [int]$Number = 1)
  Add-Text $Slide $Kicker.ToUpperInvariant() 42 24 600 20 10 $C.Yellow -Bold | Out-Null
  Add-Text $Slide $Title 40 49 850 46 27 $C.White -Bold | Out-Null
  if ($Subtitle) {
    Add-Text $Slide $Subtitle 42 98 850 36 12 $C.Muted | Out-Null
  }
  Add-Text $Slide ("{0:D2}" -f $Number) 895 25 30 20 9 $C.Muted -Bold -Align 3 | Out-Null
  Add-Rule $Slide 42 132 876 $C.Panel2 1 | Out-Null
}

function Add-Footer {
  param($Slide, [string]$Label = "GASKAN | SMTI Yogyakarta")
  Add-Text $Slide $Label 42 515 500 13 8 $C.Muted | Out-Null
  $dot = $Slide.Shapes.AddShape($msoShapeOval, 904, 516, 7, 7)
  $dot.Fill.ForeColor.RGB = $C.Yellow
  $dot.Fill.Solid()
  $dot.Line.Visible = $msoFalse
}

function Add-Card {
  param($Slide, [string]$Title, [string]$Body, [float]$X, [float]$Y, [float]$W, [float]$H, [string]$Index = "", [int]$Accent = $C.Yellow)
  Add-Box $Slide $X $Y $W $H $C.Panel 12 $C.Panel2 | Out-Null
  if ($Index) {
    Add-Text $Slide $Index ($X + 16) ($Y + 14) 34 24 11 $Accent -Bold | Out-Null
  }
  $titleX = if ($Index) { $X + 52 } else { $X + 16 }
  Add-Text $Slide $Title $titleX ($Y + 13) ($W - ($titleX - $X) - 14) 28 15 $C.White -Bold | Out-Null
  Add-Text $Slide $Body ($X + 16) ($Y + 50) ($W - 32) ($H - 62) 11 $C.Muted | Out-Null
}

function Add-BulletList {
  param($Slide, [string[]]$Items, [float]$X, [float]$Y, [float]$W, [float]$LineH = 40, [float]$Size = 14)
  for ($i = 0; $i -lt $Items.Count; $i++) {
    $cy = $Y + ($i * $LineH)
    $d = $Slide.Shapes.AddShape($msoShapeOval, $X, $cy + 7, 8, 8)
    $d.Fill.ForeColor.RGB = $C.Yellow
    $d.Fill.Solid()
    $d.Line.Visible = $msoFalse
    Add-Text $Slide $Items[$i] ($X + 18) $cy ($W - 18) ($LineH - 2) $Size $C.White | Out-Null
  }
}

function Add-FlowNode {
  param($Slide, [string]$No, [string]$Title, [string]$Body, [float]$X, [float]$Y, [float]$W)
  Add-Box $Slide $X $Y $W 116 $C.Panel 10 $C.Panel2 | Out-Null
  $circle = $Slide.Shapes.AddShape($msoShapeOval, $X + 14, $Y + 14, 28, 28)
  $circle.Fill.ForeColor.RGB = $C.Yellow
  $circle.Fill.Solid()
  $circle.Line.Visible = $msoFalse
  Add-Text $Slide $No ($X + 14) ($Y + 18) 28 16 10 $C.Ink -Bold -Align 2 -Margin 0 | Out-Null
  Add-Text $Slide $Title ($X + 50) ($Y + 14) ($W - 62) 25 14 $C.White -Bold | Out-Null
  Add-Text $Slide $Body ($X + 16) ($Y + 51) ($W - 32) 53 10 $C.Muted | Out-Null
}

function New-Slide {
  param($Presentation)
  $slide = $Presentation.Slides.Add($Presentation.Slides.Count + 1, $ppLayoutBlank)
  $bg = Add-Box $slide 0 0 960 540 $C.Ink
  $bg.ZOrder(1)
  return $slide
}

$root = Split-Path -Parent $PSScriptRoot
$shotRoot = Join-Path $root "docs\superpowers\audits\responsive-baseline-screenshots"
$landing = Join-Path $shotRoot "landing--1440x900--light--loaded.png"
$dashboard = Join-Path $shotRoot "home--1440x900--light--loaded.png"
$monitor = Join-Path $shotRoot "monitor-left--1440x900--light--loaded.png"
$calendar = Join-Path $shotRoot "kalender--1440x900--light--loaded.png"
$mobile = Join-Path $shotRoot "home--390x844--light--loaded.png"
$team = Join-Path $shotRoot "team--1440x900--light--loaded.png"
$logoSvg = Join-Path $root "public\smti_logo.svg"

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = $msoTrue
$presentation = $ppt.Presentations.Add()
$presentation.PageSetup.SlideWidth = 960
$presentation.PageSetup.SlideHeight = 540

try {
  # 1 - Cover
  $s = New-Slide $presentation
  Add-Box $s 0 0 960 540 $C.Ink | Out-Null
  Add-Box $s 0 0 16 540 $C.Yellow | Out-Null
  Add-Text $s "SISTEM ABSENSI DIGITAL SMTI YOGYAKARTA" 58 56 600 24 11 $C.Yellow -Bold | Out-Null
  Add-Text $s "GASKAN" 54 112 610 82 58 $C.White -Bold | Out-Null
  Add-Text $s "Sistem Absensi Digital`ndan Kehadiran" 58 200 560 96 28 $C.White -Bold | Out-Null
  Add-Text $s "Dari mesin absensi menjadi sumber data kehadiran yang real-time, terukur, dan dapat ditindaklanjuti." 60 315 540 66 16 $C.Muted | Out-Null
  Add-Box $s 60 413 205 42 $C.Yellow 10 | Out-Null
  Add-Text $s "PROJECT OVERVIEW 2026" 60 425 205 18 11 $C.Ink -Bold -Align 2 -Margin 0 | Out-Null
  Add-Box $s 670 76 210 338 $C.Panel 22 $C.Panel2 | Out-Null
  $c1 = $s.Shapes.AddShape($msoShapeOval, 710, 120, 130, 130)
  $c1.Fill.Visible = $msoFalse
  $c1.Line.ForeColor.RGB = $C.Yellow
  $c1.Line.Weight = 3
  Add-Text $s "SCAN" 710 170 130 28 22 $C.Yellow -Bold -Align 2 | Out-Null
  Add-Rule $s 725 272 100 $C.Yellow 5 | Out-Null
  Add-Text $s "IDENTIFY" 718 301 114 18 10 $C.Muted -Bold -Align 2 | Out-Null
  Add-Text $s "VERIFY" 718 329 114 18 10 $C.Muted -Bold -Align 2 | Out-Null
  Add-Text $s "SYNC" 718 357 114 18 10 $C.Muted -Bold -Align 2 | Out-Null
  Add-Footer $s

  # 2 - Hook
  $s = New-Slide $presentation
  Add-Header $s "The Hook" "Apa yang terjadi setelah siswa melakukan absensi di mesin?" "Satu interaksi singkat berubah menjadi data kehadiran yang dapat langsung dipantau." 2
  Add-Text $s "Siswa terdeteksi." 62 170 410 45 29 $C.White -Bold | Out-Null
  Add-Text $s "Identitas diverifikasi." 62 224 410 45 29 $C.White -Bold | Out-Null
  Add-Text $s "Kehadiran tersinkron." 62 278 410 45 29 $C.Yellow -Bold | Out-Null
  Add-Text $s "Dalam satu perjalanan data, sekolah memperoleh bukti kehadiran, status waktu, histori, serta informasi yang siap dipantau dan dilaporkan." 64 350 410 86 14 $C.Muted | Out-Null
  Add-PictureCrop $s $landing 520 162 390 250 | Out-Null
  Add-Box $s 520 426 390 40 $C.Panel 8 $C.Panel2 | Out-Null
  Add-Text $s "GASKAN menghubungkan mesin absensi, API, dashboard, dan pengguna." 532 438 366 18 11 $C.White -Bold -Align 2 | Out-Null
  Add-Footer $s

  # 3 - Problem
  $s = New-Slide $presentation
  Add-Header $s "Masalah" "Kehadiran bukan sekadar 'hadir atau tidak'" "Tantangannya muncul pada validitas, kecepatan, keterlacakan, dan tindak lanjut." 3
  Add-Card $s "Data tersebar" "Catatan dari mesin absensi, kelas, izin, dan rekap mudah terpisah sehingga konteks siswa hilang." 42 160 205 150 "01"
  Add-Card $s "Validasi lambat" "Ketika identitas dan waktu tidak diverifikasi langsung, koreksi baru muncul setelah masalah membesar." 263 160 205 150 "02"
  Add-Card $s "Monitoring reaktif" "Petugas mengetahui anomali setelah laporan dibuat, bukan saat kejadian berlangsung." 484 160 205 150 "03"
  Add-Card $s "Rekap berulang" "Data yang sama dipindahkan berkali-kali untuk kebutuhan kelas, semester, dan laporan." 705 160 213 150 "04"
  Add-Box $s 42 340 876 108 $C.Panel2 14 | Out-Null
  Add-Text $s "Pertanyaan desain GASKAN" 62 360 260 20 12 $C.Yellow -Bold | Out-Null
  Add-Text $s "Bagaimana menjadikan setiap absensi di mesin sebagai data yang langsung berguna bagi siswa, guru, admin, dan sistem?" 62 392 810 40 21 $C.White -Bold | Out-Null
  Add-Footer $s

  # 4 - Definition
  $s = New-Slide $presentation
  Add-Header $s "Solusi" "GASKAN adalah ekosistem pencatatan kehadiran" "Fase saat ini berfokus pada absensi melalui mesin dan pengelolaan datanya di platform web." 4
  Add-Card $s "Mesin absensi" "Titik masuk data saat siswa melakukan absensi dan identitasnya diverifikasi." 42 168 275 138 "M"
  Add-Card $s "Platform operasional" "Dashboard, monitor mesin, izin, kalender, data master, dan laporan berada dalam satu pengalaman." 342 168 275 138 "P"
  Add-Card $s "Sumber audit" "Log kehadiran, login, onsite, error, serta konfigurasi perangkat membantu penelusuran." 642 168 276 138 "S"
  Add-Box $s 42 335 876 105 $C.Yellow 15 | Out-Null
  Add-Text $s "NILAI INTI" 62 352 180 20 10 $C.Ink -Bold | Out-Null
  Add-Text $s "Satu peristiwa | satu identitas | satu jejak waktu | banyak keputusan" 62 382 810 38 24 $C.Ink -Bold | Out-Null
  Add-Footer $s

  # 5 - Data journey
  $s = New-Slide $presentation
  Add-Header $s "Cara Kerja" "Perjalanan satu data kehadiran" "Alur konseptual berdasarkan surface aplikasi dan integrasi API yang tersedia." 5
  $xs = @(42, 224, 406, 588, 770)
  $titles = @("Capture", "Verify", "Record", "Broadcast", "Act")
  $bodies = @(
    "Mesin absensi menangkap peristiwa dan identitas siswa.",
    "Sistem mencocokkan pengguna, waktu, serta perangkat.",
    "REST API menyimpan status dan histori kehadiran.",
    "Socket.IO memperbarui monitor dan feed tanpa reload.",
    "Admin/guru menindaklanjuti anomali, izin, dan laporan."
  )
  for ($i=0; $i -lt 5; $i++) {
    Add-FlowNode $s (($i+1).ToString()) $titles[$i] $bodies[$i] $xs[$i] 205 148
    if ($i -lt 4) {
      $ch = $s.Shapes.AddShape($msoShapeChevron, $xs[$i] + 151, 244, 26, 30)
      $ch.Fill.ForeColor.RGB = $C.Yellow
      $ch.Fill.Solid()
      $ch.Line.Visible = $msoFalse
    }
  }
  Add-Text $s "Catatan: detail penyimpanan dan algoritma verifikasi berada pada backend/perangkat; deck ini memetakan kontrak yang terlihat dari frontend GASKAN." 44 366 868 50 11 $C.Muted -Align 2 | Out-Null
  Add-Footer $s

  # 6 - Dashboard
  $s = New-Slide $presentation
  Add-Header $s "Command Center" "Dashboard mengubah data menjadi situational awareness" "Statistik ringkas, aktivitas kehadiran, deteksi wajah gagal, dan login terbaru berada dalam satu pandangan." 6
  Add-PictureCrop $s $dashboard 42 158 575 330 | Out-Null
  Add-Card $s "Status hari ini" "Alpha, izin/sakit, terlambat, hadir, dan persentase kehadiran." 645 160 273 92 "01"
  Add-Card $s "Aktivitas terbaru" "Pencarian, filter kelas, status, dan tabel yang dapat dipaginasi." 645 267 273 92 "02"
  Add-Card $s "Anomali terlihat" "Tab gagal deteksi wajah membantu operasi tidak berhenti pada angka sukses." 645 374 273 92 "03"
  Add-Footer $s

  # 7 - Attendance machine
  $s = New-Slide $presentation
  Add-Header $s "Real-time" "Dari mesin absensi ke layar monitor" "Begitu siswa selesai melakukan absensi, data dikirim agar status kehadirannya dapat terlihat di sistem." 7
  Add-FlowNode $s "1" "Siswa melakukan absensi" "Siswa hadir di depan mesin dan mengikuti proses identifikasi." 42 188 190
  Add-FlowNode $s "2" "Mesin mengenali siswa" "Perangkat mengirim identitas, waktu, dan hasil verifikasi." 266 188 190
  Add-FlowNode $s "3" "Sistem mencatat" "Backend menyimpan peristiwa menjadi status kehadiran." 490 188 190
  Add-FlowNode $s "4" "Monitor diperbarui" "Dashboard menampilkan hasil agar dapat dipantau petugas." 714 188 204
  Add-Box $s 42 345 876 95 $C.Panel2 14 | Out-Null
  Add-Text $s "Kondisi saat ini" 62 364 180 20 12 $C.Yellow -Bold | Out-Null
  Add-Text $s "Fokus utama saat ini adalah identifikasi siswa melalui mesin, pencatatan waktu, dan pembaruan status kehadiran." 62 395 820 30 18 $C.White -Bold | Out-Null
  Add-Footer $s

  # 8 - Attendance operations
  $s = New-Slide $presentation
  Add-Header $s "Operasional" "Siklus kehadiran dari kejadian hingga laporan" "Fitur saling terhubung agar koreksi dan rekap tidak menjadi proses terpisah." 8
  Add-Card $s "Absensi" "Pengelolaan data hadir, terlambat, izin/sakit, dan belum absen." 42 165 205 132 "01"
  Add-Card $s "Surat izin" "Pengajuan izin/sakit digital menjadi bagian dari konteks kehadiran siswa." 263 165 205 132 "02"
  Add-Card $s "Log kehadiran" "Jejak peristiwa digunakan untuk pemeriksaan dan pencarian histori." 484 165 205 132 "03"
  Add-Card $s "Laporan" "Ekspor operasional tersedia melalui PDF dan Excel pada surface laporan." 705 165 213 132 "04"
  Add-Text $s "Keluaran yang dicari" 42 335 250 24 14 $C.Yellow -Bold | Out-Null
  Add-BulletList $s @(
    "Rekap lebih konsisten karena sumber data sama.",
    "Kasus khusus tetap memiliki bukti dan status.",
    "Informasi dapat dibaca per siswa, kelas, dan periode."
  ) 46 375 850 36 14
  Add-Footer $s

  # 9 - Calendar and master data
  $s = New-Slide $presentation
  Add-Header $s "Konteks Akademik" "Kehadiran hanya bermakna jika kalender dan struktur sekolah benar" "GASKAN mengelola kalender akademik, siswa, kelas, jurusan, semester, dan reshuffle." 9
  Add-PictureCrop $s $calendar 42 158 525 320 | Out-Null
  Add-Card $s "Kalender akademik" "Hari efektif, fakultatif, libur, dan ujian memberi konteks pada perhitungan." 600 160 318 94 "01"
  Add-Card $s "Data master" "Siswa, kelas, jurusan, dan semester membentuk dimensi utama laporan." 600 270 318 94 "02"
  Add-Card $s "Perubahan periode" "Reshuffle dan histori menjaga perpindahan kelas tetap dapat ditelusuri." 600 380 318 94 "03"
  Add-Footer $s

  # 10 - Users and roles
  $s = New-Slide $presentation
  Add-Header $s "Multi-role" "Satu sistem, pengalaman yang berbeda sesuai tanggung jawab" "Navigasi aplikasi menerapkan pembatasan berbasis peran pada berbagai surface." 10
  Add-Card $s "Siswa" "Melihat dashboard pribadi, profil, kalender, log kehadiran, dan surat izin sesuai hak akses." 42 170 270 180 "S"
  Add-Card $s "Guru / operator" "Mengakses data siswa, kelas, absensi, onsite, laporan, dan dokumentasi API yang relevan." 345 170 270 180 "G"
  Add-Card $s "Admin / developer" "Mengelola user, semester, perangkat, sistem, tim, permission field, file, dan log teknis." 648 170 270 180 "A"
  Add-Box $s 42 382 876 67 $C.Panel2 12 | Out-Null
  Add-Text $s "Prinsip" 60 400 90 20 11 $C.Yellow -Bold | Out-Null
  Add-Text $s "Hak akses mengikuti kebutuhan kerja; surface sensitif tidak menjadi bagian dari halaman publik dan ditandai no-index." 150 397 738 30 15 $C.White -Bold | Out-Null
  Add-Footer $s

  # 11 - Auditability
  $s = New-Slide $presentation
  Add-Header $s "Auditability" "Ketika terjadi masalah, sistem menyediakan jejak untuk ditelusuri" "Observability hadir pada level pengguna, kehadiran, perangkat onsite, dan sistem." 11
  Add-Card $s "Log kehadiran" "Siapa, kapan, status apa, dan konteks siswa." 42 175 205 142 "01" $C.Green
  Add-Card $s "Log login" "Aktivitas autentikasi dan role pengguna." 263 175 205 142 "02" $C.Blue
  Add-Card $s "Log onsite" "Kejadian yang berkaitan dengan titik/perangkat di lokasi." 484 175 205 142 "03" $C.Yellow
  Add-Card $s "Log error" "Informasi teknis untuk developer saat integrasi atau proses gagal." 705 175 213 142 "04" $C.Red
  Add-Text $s "Tujuan akhirnya bukan sekadar menyimpan log, tetapi memperpendek waktu dari 'ada masalah' menjadi 'tahu penyebab dan tindakan berikutnya'." 80 365 800 64 19 $C.White -Bold -Align 2 | Out-Null
  Add-Footer $s

  # 12 - Architecture
  $s = New-Slide $presentation
  Add-Header $s "Arsitektur" "Lapisan teknologi GASKAN" "Frontend yang terlihat pada repository ini berkomunikasi dengan backend production melalui REST dan Socket.IO." 12
  $layers = @(
    @{Y=158; Name="EXPERIENCE"; Text="Next.js 16.2 | React 19 | App Router | responsive dashboard"; Color=$C.Yellow},
    @{Y=222; Name="INTERACTION"; Text="Tailwind CSS 4 | shadcn/base-ui | TanStack Table | Framer Motion"; Color=$C.Gold},
    @{Y=286; Name="DATA FLOW"; Text="Axios REST client | Next route handlers/proxy | Socket.IO client"; Color=$C.Blue},
    @{Y=350; Name="DOMAIN"; Text="Kehadiran | siswa | kelas | semester | izin | perangkat | log"; Color=$C.Green},
    @{Y=414; Name="DEVICE"; Text="Mesin absensi / perangkat identifikasi | backend API | persistent data"; Color=$C.Red}
  )
  foreach ($layer in $layers) {
    Add-Box $s 42 $layer.Y 876 48 $C.Panel 9 $C.Panel2 | Out-Null
    Add-Box $s 42 $layer.Y 145 48 $layer.Color 9 | Out-Null
    Add-Text $s $layer.Name 48 ($layer.Y + 16) 133 16 10 $C.Ink -Bold -Align 2 -Margin 0 | Out-Null
    Add-Text $s $layer.Text 208 ($layer.Y + 13) 690 22 13 $C.White -Bold | Out-Null
  }
  Add-Footer $s

  # 13 - Frontend details
  $s = New-Slide $presentation
  Add-Header $s "Engineering" "Mengapa fondasi frontend ini penting?" "Pilihan teknis diarahkan pada performa, konsistensi, maintainability, dan pengalaman lintas perangkat." 13
  Add-Card $s "App Router" "Struktur route terpisah untuk public, auth, dashboard, API proxy, metadata, sitemap, dan robots." 42 165 270 132 "01"
  Add-Card $s "Komponen reusable" "Table, pagination, skeleton, dialog, export, page header, dan shell mengurangi inkonsistensi UI." 345 165 270 132 "02"
  Add-Card $s "Data-rich UI" "TanStack Table, ExcelJS, jsPDF, dan filter mendukung operasi data yang padat." 648 165 270 132 "03"
  Add-Card $s "Progressive feedback" "Skeleton page dan toast membuat perpindahan serta aksi terasa lebih jelas." 42 325 270 132 "04"
  Add-Card $s "SEO publik" "Landing/team memakai metadata, canonical, Open Graph, JSON-LD, sitemap, dan robots." 345 325 270 132 "05"
  Add-Card $s "Private by design" "Dashboard dan auth diberi metadata no-index; route API diproksi dengan token pengguna." 648 325 270 132 "06"
  Add-Footer $s

  # 14 - Responsive
  $s = New-Slide $presentation
  Add-Header $s "Responsive" "Informasi tetap dapat digunakan di desktop maupun ponsel" "Repository menyertakan baseline screenshot lintas viewport untuk landing, login, dashboard, kalender, monitor, siswa, dan tim." 14
  Add-PictureCrop $s $dashboard 42 165 570 315 | Out-Null
  Add-PictureCrop $s $mobile 675 158 150 326 | Out-Null
  Add-Text $s "1440 x 900" 255 487 145 16 9 $C.Muted -Bold -Align 2 | Out-Null
  Add-Text $s "390 x 844" 675 487 150 16 9 $C.Muted -Bold -Align 2 | Out-Null
  Add-Text $s "Desktop: densitas data" 630 186 300 18 12 $C.Yellow -Bold -Align 2 | Out-Null
  Add-Text $s "Mobile: prioritas aksi" 630 446 300 18 12 $C.Yellow -Bold -Align 2 | Out-Null
  Add-Footer $s

  # 15 - Feature map
  $s = New-Slide $presentation
  Add-Header $s "Cakupan" "Peta kemampuan yang sudah terlihat di aplikasi" "Lebih dari sekadar modul presensi: GASKAN mencakup operasi, administrasi, dan engineering support." 15
  $cols = @(
    @{X=42; T="Operasi Harian"; Items=@("Dashboard", "Monitor kiri/kanan", "Absensi", "Log kehadiran", "Surat izin")},
    @{X=267; T="Data Akademik"; Items=@("Siswa & import foto", "Kelas & jurusan", "Semester aktif", "Kalender akademik", "Reshuffle + histori")},
    @{X=492; T="Administrasi"; Items=@("Manajemen user", "Import staff", "Manajemen tim", "Permission profil", "Laporan PDF/Excel")},
    @{X=717; T="Sistem"; Items=@("Konfigurasi mesin", "Kelola sistem", "File explorer", "Log login/error", "Dokumentasi API")}
  )
  foreach ($col in $cols) {
    Add-Box $s $col.X 163 201 308 $C.Panel 12 $C.Panel2 | Out-Null
    Add-Text $s $col.T ($col.X + 16) 181 169 25 15 $C.Yellow -Bold | Out-Null
    Add-Rule $s ($col.X + 16) 216 169 $C.Panel2 1 | Out-Null
    Add-BulletList $s $col.Items ($col.X + 18) 235 165 43 12
  }
  Add-Footer $s

  # 16 - Indicators
  $s = New-Slide $presentation
  Add-Header $s "Indikator" "Bagaimana keberhasilan GASKAN sebaiknya diukur?" "Gunakan baseline dan data produksi; hindari mengubah angka pemasaran menjadi klaim hasil tanpa bukti." 16
  Add-Card $s "Adopsi" "Jumlah siswa aktif, pengguna per role, absensi harian, dan mesin aktif." 42 170 270 132 "01"
  Add-Card $s "Keandalan" "Uptime API, keberhasilan scan, keterlambatan sinkronisasi, dan error rate perangkat." 345 170 270 132 "02"
  Add-Card $s "Efisiensi" "Waktu rekap, waktu koreksi kasus, jumlah proses manual, dan waktu respons petugas." 648 170 270 132 "03"
  Add-Card $s "Kualitas data" "Duplikasi, data tanpa identitas, status tidak konsisten, dan kelengkapan histori." 42 330 270 132 "04"
  Add-Card $s "Pengalaman" "Kecepatan halaman, usability mobile, keberhasilan task, dan dukungan aksesibilitas." 345 330 270 132 "05"
  Add-Card $s "Governance" "Kepatuhan role, audit log, retensi data, backup, dan recovery drill." 648 330 270 132 "06"
  Add-Footer $s

  # 17 - Current proof and roadmap
  $s = New-Slide $presentation
  Add-Header $s "Roadmap" "Dari platform yang lengkap menuju operasi yang terukur" "Prioritas berikut menjaga perkembangan tetap berbasis bukti dan risiko." 17
  Add-FlowNode $s "1" "Baseline produksi" "Tetapkan metrik uptime, latency, keberhasilan identifikasi, dan volume per mesin." 42 178 190
  Add-FlowNode $s "2" "Data quality" "Dashboard anomali, rekonsiliasi, serta rule koreksi yang terdokumentasi." 266 178 190
  Add-FlowNode $s "3" "Security hardening" "Review role-route, token lifecycle, audit retention, dan backup recovery." 490 178 190
  Add-FlowNode $s "4" "Gerbang parkir" "Future plan: gunakan hasil verifikasi untuk mengatur akses gerbang parkir secara terintegrasi." 714 178 204
  Add-Box $s 42 342 876 103 $C.Panel2 14 | Out-Null
  Add-Text $s "Arah pengembangan" 62 361 210 20 12 $C.Yellow -Bold | Out-Null
  Add-Text $s "Bukan menambah fitur sebanyak mungkin - melainkan membuat setiap data kehadiran semakin cepat, dapat dipercaya, aman, dan berguna." 62 392 820 40 19 $C.White -Bold | Out-Null
  Add-Footer $s

  # 18 - Closing
  $s = New-Slide $presentation
  Add-Box $s 0 0 960 540 $C.Yellow | Out-Null
  Add-Text $s "GASKAN" 55 48 300 36 24 $C.Ink -Bold | Out-Null
  Add-Text $s "Absensi bukan sekadar menekan mesin." 54 151 820 52 34 $C.Ink -Bold | Out-Null
  Add-Text $s "Ia adalah awal dari data yang dapat dipercaya." 54 213 820 60 34 $C.Ink -Bold | Out-Null
  Add-Rule $s 58 310 140 $C.Ink 5 | Out-Null
  Add-Text $s "SCAN > VERIFY > SYNC > UNDERSTAND > ACT" 56 340 760 32 18 $C.Ink -Bold | Out-Null
  Add-Box $s 56 418 300 52 $C.Ink 12 | Out-Null
  Add-Text $s "DEMO & DISKUSI" 56 434 300 20 13 $C.White -Bold -Align 2 -Margin 0 | Out-Null
  Add-Text $s "gaskan.smtijogja.sch.id" 642 445 260 18 11 $C.Ink -Bold -Align 3 | Out-Null

  $resolved = [System.IO.Path]::GetFullPath($OutputPath)
  $presentation.SaveAs($resolved, $ppSaveAsOpenXMLPresentation)
  Write-Output $resolved
}
finally {
  if ($presentation) { $presentation.Close() }
  if ($ppt) { $ppt.Quit() }
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) | Out-Null
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
