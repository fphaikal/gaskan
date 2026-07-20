'use client';

import React, { ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AuthProvider } from '@/context/AuthContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <SidebarProvider>
          {children}
          <Toaster position="top-right" richColors />
        </SidebarProvider>
      </AuthProvider>
    </NextThemesProvider>
  );
}
