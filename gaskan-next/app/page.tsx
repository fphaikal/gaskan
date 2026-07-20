'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Icon } from '@iconify/react';

export default function RootPage() {
  const router = useRouter();
  const { token, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (token) {
      router.replace('/home');
    } else {
      router.replace('/login');
    }
  }, [token, isLoading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
          <Icon icon="mingcute:key-2-fill" className="text-4xl animate-pulse" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight">GASKAN SMTI Jogja</h1>
          <p className="text-xs text-muted-foreground">Mengarahkan halaman...</p>
        </div>
      </div>
    </div>
  );
}
