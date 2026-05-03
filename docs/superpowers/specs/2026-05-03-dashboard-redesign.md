# GASKAN Dashboard Redesign Spec

## Objective
To overhaul the GASKAN application dashboard (`pages/home.vue`), including the Sidebar and Header (`layouts/default.vue`), transforming it from a rudimentary layout into a premium, responsive, and visually cohesive "Bento Box Grid" UI. The redesign will introduce a dedicated Siswa dashboard and elevate the Admin/Developer monitoring tools, all fully integrated with the new Light/Dark theme system.

## 1. Global Theming & Layout Architecture
*   **Semantic Colors**: Remove all hardcoded colors (e.g., `bg-dark`, `text-white`). Use DaisyUI semantics:
    *   `bg-base-100` for Header, Sidebar, and Bento Cards (pure background).
    *   `bg-base-200` for the Main Content Area wrapper (creates depth and contrast).
    *   `text-base-content` and `text-base-content/70` for typography.
*   **Layout Adjustments (`layouts/default.vue`)**:
    *   Main content area uses `bg-base-200`.
    *   Add responsive paddings (`p-4 md:p-6 2xl:p-10`) to accommodate the Bento Grid spacing.

## 2. Header Area (`HeaderArea.vue`)
*   **Aesthetic**: Glassmorphism.
*   **Implementation**: 
    *   Use `backdrop-blur-md bg-base-100/80` for the header container.
    *   Remove heavy drop shadows, replace with a subtle bottom border (`border-b border-base-300`).
*   **Features**: 
    *   Integrate the Dark/Light Mode toggle button (re-use the logic/component from Landing Page).
    *   Keep the Hamburger menu and User Dropdown (profile).

## 3. Sidebar Area (`SidebarArea.vue`)
*   **Aesthetic**: Floating Pills & Clean Lines.
*   **Implementation**:
    *   Use `bg-base-100` for the background.
    *   Add a subtle right border (`border-r border-base-300`) to separate from the content area.
*   **Menu Items (`SidebarItem.vue`)**:
    *   Items will have `rounded-xl` borders.
    *   **Hover state**: `hover:bg-base-200`.
    *   **Active state**: `bg-primary/10 text-primary` with primary icon color. 

## 4. Dashboard Content (`pages/home.vue`)
We will split the logic into two primary render blocks to keep the file maintainable. The "NAIRA SALIMA" easter egg will be completely removed.

### A. Siswa Dashboard (New)
Rendered when the user is a `siswa`.
*   **Grid Layout**: A responsive CSS Grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6`).
*   **Bento Cards (Widgets)**:
    1.  **Profil Siswa (1x1)**: Sapaan, Avatar, NIS, dan Kelas.
    2.  **Status Hari Ini (1x1)**: Indikator besar (HADIR/BELUM ABSEN) dengan background sukses/warning.
    3.  **Statistik Absensi (2x1)**: Rekap bulan ini (Hadir, Izin, Sakit, Alpa) ditampilkan dalam deretan angka bold.
    4.  **Pengumuman/Jadwal (2x2 atau span-full)**: Tempat *placeholder* elegan untuk informasi sekolah (kosong namun *styled*).

### B. Admin & Developer Dashboard (Redesign)
Rendered when the user is an `admin` or `developer`.
*   **Overview Stats (3x 1x1 Cards)**: Total Developer, Total Admin, Total Siswa. Styled as prominent metric cards with `text-4xl` font weights.
*   **Progress Metrics (2x 2x1 Cards)**: 
    *   Siswa Onsite (Progress Bar + Fractions).
    *   User Login (Progress Bar + Fractions).
    *   Implementation: Use DaisyUI `<progress>` bars customized with `progress-primary`.
*   **System Specifications (Dev Only, 2x2 or 2x span-full Cards)**:
    *   Convert the existing generic list into a sleek grid panel.
    *   Use icons alongside text (e.g., Mingcute icons for CPU, Motherboard, RAM, HDD).

## 5. Interaction & Motion Details
*   **Hover Effects**: All Bento cards will use `transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-base-300/50`.
*   **Rounded Corners**: All Bento cards will utilize `rounded-3xl` for a soft, modern aesthetic.

## 6. Implementation Steps
1.  **Refactor Sidebar & Header**: Update semantic classes and apply Glassmorphism/Floating pill styling.
2.  **Implement Theme Toggle in Header**: Add the `useThemeStore` logic to `HeaderArea.vue`.
3.  **Cleanup `home.vue`**: Remove easter egg, separate Admin and Siswa logic.
4.  **Build Siswa Bento Grid**: Scaffold the new widgets.
5.  **Rebuild Admin Bento Grid**: Port existing data bindings (`count`, `login`, `system`) into the new UI layout.
