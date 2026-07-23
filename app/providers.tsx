'use client';

import React, { ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { AuthProvider } from '@/context/AuthContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { GooeyToaster } from 'goey-toast';
import 'goey-toast/styles.css';

function ToasterWithTheme() {
  const { resolvedTheme } = useTheme();
  return (
    <GooeyToaster
      position="top-right"
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
    />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <SidebarProvider>
          {children}
          <ToasterWithTheme />
        </SidebarProvider>
      </AuthProvider>
    </NextThemesProvider>
  );
}
