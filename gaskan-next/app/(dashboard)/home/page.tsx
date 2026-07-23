'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardSiswa } from '@/components/dashboard/DashboardSiswa';
import { DashboardAdmin } from '@/components/dashboard/DashboardAdmin';

export default function HomePage() {
  const { user } = useAuth();
  const role = (user?.role || 'siswa').toLowerCase();
  const isAdminOrDev = ['admin', 'developer', 'guru'].includes(role);

  if (isAdminOrDev) {
    return <DashboardAdmin />;
  }

  return <DashboardSiswa user={user} />;
}
