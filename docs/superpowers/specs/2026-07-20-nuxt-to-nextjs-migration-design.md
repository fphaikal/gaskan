# Nuxt 3 to Next.js App Router Migration Design

## Project Overview
This document outlines the architecture and design specification for migrating the **Gaskan** frontend application from **Nuxt 3 (Vue 3)** to **Next.js 15 (React)** using the **App Router**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**.

The migration is conducted in a separate subfolder (`gaskan-next/`) within the workspace to ensure the existing Nuxt codebase remains completely intact for reference throughout the migration.

---

## Key Architectural Principles

1. **Isolation & Separate Folder**: Next.js project is built inside `gaskan-next/`.
2. **Reusability First**:
   - UI components (DataTable, Modal/Dialog, Form controls, Stat cards, Page headers, ConfirmDialog) will be modularized in `components/shared/` and `components/ui/`.
   - Repetitive CRUD views will leverage a reusable `DataTable` wrapper supporting sorting, pagination, search, and action triggers.
3. **Built-in React Context State**:
   - No heavy third-party state management libraries.
   - Built-in React `createContext` / `useContext` for `AuthContext`, `ThemeContext`, and `SidebarContext`.
   - Browser cookies & localStorage for persistence.
4. **App Router Paradigm**:
   - Layout-driven structure with `(auth)` and `(dashboard)` route groups.
   - Client Components (`"use client"`) scoped strictly to interactive elements while leveraging Server Components where suitable.
5. **Modern Design System**:
   - **shadcn/ui** design system replacing DaisyUI/Nuxt icons.
   - Lucide React & `@iconify/react` icons.

---

## Project Directory Structure (`gaskan-next/`)

```text
gaskan-next/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard layout (Sidebar + Header + Breadcrumb)
│   │   ├── home/page.tsx           # Dashboard main home
│   │   ├── profile/page.tsx        # User Profile
│   │   ├── jurusan/page.tsx        # CRUD Jurusan
│   │   ├── kelas/page.tsx          # CRUD Kelas
│   │   ├── semester/page.tsx       # CRUD Semester
│   │   ├── team/page.tsx           # Team / Contributors
│   │   ├── absensi/                # Absensi Management
│   │   ├── izin/                   # Izin Management
│   │   ├── siswa/                  # Siswa Management
│   │   ├── admin/                  # Admin Users
│   │   ├── log/                    # Activity Logs
│   │   └── monitor/                # Realtime Monitoring
│   ├── layout.tsx                  # Root layout + Providers (Auth, Theme, Toast)
│   └── page.tsx                    # Landing / Root redirect logic
├── components/
│   ├── ui/                         # Base primitive shadcn/ui components (Button, Dialog, Input, Table, etc.)
│   ├── layout/                     # Main Sidebar, Header, UserNav, MobileNav
│   └── shared/                     # Reusable business components
│       ├── ReusableDataTable.tsx   # Generic table for all CRUD pages (Jurusan, Kelas, Semester, Siswa, etc.)
│       ├── PageHeader.tsx          # Uniform page titles + action buttons header
│       ├── ConfirmModal.tsx        # Generic delete/action confirmation modal
│       ├── ProfileCard.tsx         # User profile card component
│       ├── StatCard.tsx            # Dashboard summary card
│       ├── DateRangePicker.tsx     # Reusable date picker
│       └── ExportButtons.tsx       # Export to Excel/PDF trigger buttons
├── context/
│   ├── AuthContext.tsx             # Authentication & User state manager
│   ├── ThemeContext.tsx            # Dark / Light theme manager
│   └── SidebarContext.tsx          # Collapsible sidebar state manager
├── lib/
│   ├── api.ts                      # Axios/Fetch wrapper with Auth bearer token interceptor
│   ├── socket.ts                   # Socket.IO client instance
│   └── utils.ts                    # Classnames merger (cn), date formatting, export excel/pdf helpers
├── types/                          # TypeScript interfaces (User, Siswa, Kelas, Jurusan, Absensi, etc.)
└── middleware.ts                   # Route guard (Auth token verification for protected dashboard routes)
```

---

## Reusable Component Architecture

To avoid repetitive code across master data pages (Jurusan, Kelas, Semester, Siswa, Admin, Log):

1. **`ReusableDataTable<T>`**:
   - Props: `columns`, `data`, `searchKey`, `onAdd`, `onEdit`, `onDelete`, `loading`.
   - Built on top of TanStack Table (`@tanstack/react-table`) and shadcn `Table`.
   - Handles pagination, global search, column sorting, and custom action dropdowns automatically.

2. **`ConfirmModal`**:
   - Props: `isOpen`, `onClose`, `onConfirm`, `title`, `description`, `loading`.
   - Standardizes confirmation dialogs across all delete and status update actions.

3. **`PageHeader`**:
   - Props: `title`, `description`, `actionLabel`, `onAction`.
   - Keeps header layout consistent across every dashboard module.

4. **`FormModal<T>`**:
   - Props: `isOpen`, `onClose`, `title`, `onSubmit`, `children`.
   - Wraps form inputs inside a shadcn `Dialog` with built-in validation states and loading buttons.

---

## State Management Architecture

- **`AuthContext`**:
  - `user`: User object or null.
  - `token`: Bearer JWT token string.
  - `login(credentials)`: Authenticates with backend API, sets cookie/localStorage.
  - `logout()`: Clears session, redirects to `/login`.
  - `isAuthenticated`: boolean indicator.

- **`ThemeContext`**:
  - Wraps Next.js `next-themes` provider to handle system/dark/light themes smoothly with Tailwind.

- **`SidebarContext`**:
  - `isCollapsed`: boolean.
  - `toggleSidebar()`: Toggles sidebar state across mobile and desktop.

---

## Page Mapping Matrix

| Nuxt Vue Page (`/pages`) | Next.js App Router (`/app`) | Core Features / Components Used |
|---|---|---|
| `index.vue` | `app/page.tsx` | Root Landing / Smart redirect based on auth status |
| `login.vue` | `app/(auth)/login/page.tsx` | Login form, AuthContext integration, error toast |
| `forgot-password.vue` | `app/(auth)/forgot-password/page.tsx` | Password recovery request form |
| `reset-password/*` | `app/(auth)/reset-password/page.tsx` | Token-based password reset form |
| `home.vue` | `app/(dashboard)/home/page.tsx` | StatCard widgets, recent activity, summary graphs |
| `profile.vue` | `app/(dashboard)/profile/page.tsx` | ProfileCard, change password form, user detail |
| `jurusan.vue` | `app/(dashboard)/jurusan/page.tsx` | PageHeader, ReusableDataTable, FormModal (CRUD Jurusan) |
| `kelas.vue` | `app/(dashboard)/kelas/page.tsx` | PageHeader, ReusableDataTable, FormModal (CRUD Kelas) |
| `semester.vue` | `app/(dashboard)/semester/page.tsx` | PageHeader, ReusableDataTable, FormModal (CRUD Semester) |
| `team.vue` | `app/(dashboard)/team/page.tsx` | Team member cards display |
| `absensi/*` | `app/(dashboard)/absensi/page.tsx` | Attendance table, DateRangePicker, ExportButtons |
| `izin/*` | `app/(dashboard)/izin/page.tsx` | Leave requests list, status approval modals |
| `siswa/*` | `app/(dashboard)/siswa/page.tsx` | Student directory, ReusableDataTable, filter by kelas/jurusan |
| `admin/*` | `app/(dashboard)/admin/page.tsx` | Admin account management table |
| `log/*` | `app/(dashboard)/log/page.tsx` | System activity log viewer |
| `monitor/*` | `app/(dashboard)/monitor/page.tsx` | Realtime socket stream monitor |

---

## Verification Plan

### Automated Checks & Build Verification
1. `npm run build` inside `gaskan-next/` to ensure zero TypeScript or Next.js build errors.
2. `npm run lint` for code quality verification.

### Functional Verification
1. Test auth flow: login -> token save -> protected route access -> logout.
2. Verify dark/light mode toggle.
3. Test CRUD operations using reusable data tables and modals.
4. Verify layout responsiveness (mobile drawer & desktop sidebar).
