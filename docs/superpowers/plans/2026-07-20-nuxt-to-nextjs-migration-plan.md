# Nuxt to Next.js App Router Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Nuxt 3 project into a new Next.js 15 App Router application in `gaskan-next/` with TypeScript, Tailwind CSS, shadcn/ui, and reusable components.

**Architecture:** The application uses Next.js App Router with route grouping `(auth)` and `(dashboard)`. Global state is handled via React Context API (`AuthContext`, `ThemeContext`, `SidebarContext`). Reusable UI components leverage shadcn/ui and a generic `ReusableDataTable` built on TanStack Table.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Lucide React / Iconify, Axios, Socket.IO Client, exceljs, jspdf, date-fns.

---

### Task 1: Initialize Next.js Project & Install Dependencies in `gaskan-next/`

**Files:**
- Create: `gaskan-next/package.json`
- Create: `gaskan-next/tsconfig.json`
- Create: `gaskan-next/components.json`

- [ ] **Step 1: Run create-next-app to scaffold `gaskan-next`**

Run:
```powershell
npx -y create-next-app@latest gaskan-next --typescript --tailwind --app --src-dir=false --import-alias="@/*" --use-npm --no-eslint
```

- [ ] **Step 2: Initialize shadcn/ui**

Run:
```powershell
cd gaskan-next
npx -y shadcn@latest init -d
```

- [ ] **Step 3: Install necessary dependencies**

Run inside `gaskan-next`:
```powershell
npm install axios socket.io-client date-fns exceljs jspdf jspdf-autotable file-saver @tanstack/react-table @iconify/react lucide-react next-themes
```

- [ ] **Step 4: Install core shadcn UI primitives**

Run inside `gaskan-next`:
```powershell
npx -y shadcn@latest add button card dialog input dropdown-menu table sheet avatar badge toast calendar select
```

- [ ] **Step 5: Verify setup and commit initial scaffold**

Run:
```powershell
npm run build
git add gaskan-next
git commit -m "chore: scaffold Next.js app in gaskan-next with shadcn/ui"
```

---

### Task 2: Core Utility Functions & Built-in React Context Providers

**Files:**
- Create: `gaskan-next/lib/utils.ts`
- Create: `gaskan-next/lib/api.ts`
- Create: `gaskan-next/types/index.ts`
- Create: `gaskan-next/context/AuthContext.tsx`
- Create: `gaskan-next/context/SidebarContext.tsx`
- Create: `gaskan-next/context/ThemeContext.tsx`
- Create: `gaskan-next/app/providers.tsx`

- [ ] **Step 1: Define TypeScript interfaces in `types/index.ts`**

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'guru' | 'siswa';
  avatar?: string;
}

export interface Jurusan {
  id: string;
  nama: string;
  kode: string;
  keterangan?: string;
}

export interface Kelas {
  id: string;
  nama: string;
  jurusanId: string;
  jurusan?: Jurusan;
}

export interface Semester {
  id: string;
  nama: string;
  tahunAjaran: string;
  isAktif: boolean;
}

export interface Siswa {
  id: string;
  nisn: string;
  nama: string;
  jenisKelamin: 'L' | 'P';
  kelasId: string;
  kelas?: Kelas;
}
```

- [ ] **Step 2: Create API client wrapper in `lib/api.ts`**

```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
```

- [ ] **Step 3: Create AuthContext in `context/AuthContext.tsx`**

```tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

- [ ] **Step 4: Create SidebarContext in `context/SidebarContext.tsx`**

```tsx
"use client";

import React, { createContext, useContext, useState } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within SidebarProvider');
  return context;
};
```

- [ ] **Step 5: Create Providers component in `app/providers.tsx`**

```tsx
"use client";

import { AuthProvider } from '@/context/AuthContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </AuthProvider>
    </NextThemesProvider>
  );
}
```

- [ ] **Step 6: Commit Core Utilities & Context Providers**

```bash
git add gaskan-next/
git commit -m "feat: add Auth, Sidebar context providers and API helpers"
```

---

### Task 3: Layout Components (Header, Sidebar, Navigation)

**Files:**
- Create: `gaskan-next/components/layout/Header.tsx`
- Create: `gaskan-next/components/layout/Sidebar.tsx`
- Create: `gaskan-next/components/layout/UserNav.tsx`
- Create: `gaskan-next/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Build Header component in `components/layout/Header.tsx`**
- [ ] **Step 2: Build Sidebar navigation in `components/layout/Sidebar.tsx`**
- [ ] **Step 3: Build UserNav menu in `components/layout/UserNav.tsx`**
- [ ] **Step 4: Create dashboard layout in `app/(dashboard)/layout.tsx`**
- [ ] **Step 5: Verify build & commit layout components**

```bash
git add gaskan-next/
git commit -m "feat: implement main dashboard layout, Header, and Sidebar"
```

---

### Task 4: Reusable Business Components (`ReusableDataTable`, `PageHeader`, `ConfirmModal`, `FormModal`)

**Files:**
- Create: `gaskan-next/components/shared/PageHeader.tsx`
- Create: `gaskan-next/components/shared/ConfirmModal.tsx`
- Create: `gaskan-next/components/shared/ReusableDataTable.tsx`
- Create: `gaskan-next/components/shared/ProfileCard.tsx`
- Create: `gaskan-next/components/shared/ExportButtons.tsx`

- [ ] **Step 1: Create PageHeader component**
- [ ] **Step 2: Create ConfirmModal component**
- [ ] **Step 3: Create ReusableDataTable component using TanStack Table & shadcn UI**
- [ ] **Step 4: Create ProfileCard & ExportButtons components**
- [ ] **Step 5: Verify build & commit shared components**

```bash
git add gaskan-next/
git commit -m "feat: create reusable data table, modals, and shared UI components"
```

---

### Task 5: Auth Pages & Middleware Route Guard

**Files:**
- Create: `gaskan-next/middleware.ts`
- Create: `gaskan-next/app/(auth)/login/page.tsx`
- Create: `gaskan-next/app/(auth)/forgot-password/page.tsx`
- Create: `gaskan-next/app/(auth)/reset-password/page.tsx`

- [ ] **Step 1: Build Login page with AuthContext login integration**
- [ ] **Step 2: Build Forgot Password and Reset Password pages**
- [ ] **Step 3: Implement route guard middleware in `middleware.ts`**
- [ ] **Step 4: Verify Auth flow and commit**

```bash
git add gaskan-next/
git commit -m "feat: implement auth pages and route middleware guard"
```

---

### Task 6: Master Data Modules (Jurusan, Kelas, Semester)

**Files:**
- Create: `gaskan-next/app/(dashboard)/jurusan/page.tsx`
- Create: `gaskan-next/app/(dashboard)/kelas/page.tsx`
- Create: `gaskan-next/app/(dashboard)/semester/page.tsx`

- [ ] **Step 1: Implement Jurusan CRUD page using ReusableDataTable**
- [ ] **Step 2: Implement Kelas CRUD page using ReusableDataTable**
- [ ] **Step 3: Implement Semester CRUD page using ReusableDataTable**
- [ ] **Step 4: Verify CRUD operations and commit**

```bash
git add gaskan-next/
git commit -m "feat: implement master data pages for Jurusan, Kelas, and Semester"
```

---

### Task 7: Siswa, Absensi & Izin Modules

**Files:**
- Create: `gaskan-next/app/(dashboard)/siswa/page.tsx`
- Create: `gaskan-next/app/(dashboard)/absensi/page.tsx`
- Create: `gaskan-next/app/(dashboard)/izin/page.tsx`

- [ ] **Step 1: Implement Siswa directory & management page**
- [ ] **Step 2: Implement Absensi tracking & report generation**
- [ ] **Step 3: Implement Izin request approvals page**
- [ ] **Step 4: Commit student, absensi, and izin pages**

```bash
git add gaskan-next/
git commit -m "feat: implement Siswa, Absensi, and Izin management modules"
```

---

### Task 8: Dashboard Home, Profile, Admin, Log & Realtime Monitor

**Files:**
- Create: `gaskan-next/app/(dashboard)/home/page.tsx`
- Create: `gaskan-next/app/(dashboard)/profile/page.tsx`
- Create: `gaskan-next/app/(dashboard)/admin/page.tsx`
- Create: `gaskan-next/app/(dashboard)/log/page.tsx`
- Create: `gaskan-next/app/(dashboard)/monitor/page.tsx`
- Create: `gaskan-next/lib/socket.ts`

- [ ] **Step 1: Implement Dashboard Home with summary stat cards**
- [ ] **Step 2: Implement User Profile page**
- [ ] **Step 3: Implement Admin accounts & Activity Logs pages**
- [ ] **Step 4: Implement Realtime Monitor with Socket.IO client**
- [ ] **Step 5: Verify build & commit remaining modules**

```bash
git add gaskan-next/
git commit -m "feat: complete dashboard home, profile, admin, logs, and realtime monitor"
```

---

### Task 9: Final Build Verification & Documentation

**Files:**
- Modify: `gaskan-next/README.md`

- [ ] **Step 1: Run full production build inside `gaskan-next/`**

Run:
```powershell
cd gaskan-next
npm run build
```

- [ ] **Step 2: Write documentation on running and deploying `gaskan-next` in `gaskan-next/README.md`**
- [ ] **Step 3: Commit final verification**

```bash
git add gaskan-next/
git commit -m "docs: complete migration README and verify production build"
```
