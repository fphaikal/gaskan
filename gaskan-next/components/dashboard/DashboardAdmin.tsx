'use client';

import React from 'react';
import { AdminStatsCards } from '@/components/dashboard/AdminStatsCards';
import { LiveAttendanceFeed } from '@/components/dashboard/LiveAttendanceFeed';
import { SystemMetricsSection } from '@/components/dashboard/SystemMetricsSection';
import { LoginLogsTableSection } from '@/components/dashboard/LoginLogsTableSection';

export function DashboardAdmin() {
  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <AdminStatsCards />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 flex flex-col min-h-[500px]">
          <LiveAttendanceFeed />
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <SystemMetricsSection />
          <LoginLogsTableSection />
        </div>
      </div>
    </div>
  );
}
