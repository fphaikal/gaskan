# Instant Navigation & Progressive Skeleton Loading for Dashboard

## Executive Summary
This design doc specifies the architecture for instant page navigation and independent progressive data loading using section-level Skeleton UI fallbacks for the Gaskan Next.js application (`.worktrees/nextjs-migration/gaskan-next`). 

Initial rollout focuses on the **Dashboard (`/home`)** page for both Admin/Developer and Student roles.

---

## Objectives
1. **Instant Transition (0ms delay)**: Navigating to `/home` renders the layout and empty skeleton structure immediately without waiting for any API responses.
2. **Progressive Data Rendering**: As individual API endpoints resolve, their corresponding section UI updates immediately without waiting for other endpoints.
3. **Exact Visual Fidelity**: Skeleton states must match the exact dimensions, grid layout, rounded corners, and spacing of the existing production components. No layout shifts or design changes.
4. **Fault Isolation**: Endpoint failures or slowness in one module (e.g. system metrics) do not impede or crash other modules (e.g. stats cards or login logs).

---

## Component Architecture

### 1. Base Skeleton Primitive (`components/ui/skeleton.tsx`)
A reusable primitive leveraging existing Tailwind v4 / Shadcn styles:
```tsx
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-muted/60", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

---

### 2. Dashboard Modularization (`app/(dashboard)/home/page.tsx`)

`HomePage` acts as an instant layout shell. It renders:
- Header welcome section (using synchronized auth user data from `AuthContext`)
- **`AdminStatsCards`** (Admin/Developer/Guru)
- **`SystemMetricsSection`** (Admin/Developer)
- **`LoginLogsTableSection`** (Admin/Developer/Guru)
- **`DashboardSiswa`** (Siswa)

---

### 3. Sub-Component Specifications

#### A. `AdminStatsCards.tsx`
- **Location**: `components/dashboard/AdminStatsCards.tsx`
- **Data Endpoint**: `GET /count`
- **Loading State**: `isLoadingCount` (boolean)
- **Skeleton Component**: `AdminStatsCardsSkeleton`
  - 4 cards grid (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`)
  - Each card contains skeleton blocks for icon circle, title, value number, and trend badge.

#### B. `SystemMetricsSection.tsx`
- **Location**: `components/dashboard/SystemMetricsSection.tsx`
- **Data Endpoint**: `GET /system/metrics`
- **Loading State**: `isLoadingMetrics` (boolean)
- **Skeleton Component**: `SystemMetricsSkeleton`
  - Cards for CPU, RAM, Disk, Uptime matching exact card layout.

#### C. `LoginLogsTableSection.tsx`
- **Location**: `components/dashboard/LoginLogsTableSection.tsx`
- **Data Endpoints**: `GET /log/login`, `GET /kelas`
- **Loading State**: `isLoadingLogs` (boolean)
- **Skeleton Component**: `LoginLogsSkeleton`
  - Search input skeleton + filter dropdown skeleton + 5 table rows with skeleton text bars.

#### D. `DashboardSiswa.tsx` (Refactoring)
- **Location**: `components/dashboard/DashboardSiswa.tsx`
- **Data Endpoint**: `GET /attendance/my?month=X&year=Y`
- **Loading State**: `loadingAttendance` (boolean)
- **Skeleton Components**:
  - `AttendanceSummarySkeleton`: 5 status cards (Hadir, Terlambat, Izin, Sakit, Alpha) + progress bar skeleton.
  - `AttendanceLogSkeleton`: Monthly calendar/log grid with skeleton cards.

---

## Data Flow Diagram

```
[ User Navigates to /home ]
           |
           v
 (Instant Render Layout Shell & Skeleton UI) 
           |
   +-------+-------+-------------------+-------------------+
   |               |                   |                   |
   v               v                   v                   v
[GET /count] [GET /system/metrics] [GET /log/login] [GET /attendance/my]
   |               |                   |                   |
   v               v                   v                   v
(Stats Card    (System Metrics     (Login Logs Table   (Attendance Summary
 UI Appears)    UI Appears)         UI Appears)         UI Appears)
```

---

## Verification Plan

1. **Build Verification**: Run `npm run build` inside `gaskan-next` worktree to verify zero TypeScript or Next.js build errors.
2. **Transition & Skeleton Check**: Verify instant route transition and skeleton display under artificial network throttling (Slow 3G).
3. **Data Integrity Check**: Verify that data populates seamlessly when endpoints return.
