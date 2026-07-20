'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setIsCollapsed: (collapsed: boolean) => void;
  setIsMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsedState] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpenState] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sidebar-collapsed');
      if (stored !== null) {
        setIsCollapsedState(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load sidebar state:', error);
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(next));
      } catch (error) {
        console.error('Failed to save sidebar state:', error);
      }
      return next;
    });
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpenState((prev) => !prev);
  };

  const setIsCollapsed = (collapsed: boolean) => {
    setIsCollapsedState(collapsed);
    try {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
    } catch (error) {
      console.error('Failed to save sidebar state:', error);
    }
  };

  const setIsMobileOpen = (open: boolean) => {
    setIsMobileOpenState(open);
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobileOpen,
        toggleSidebar,
        toggleMobileSidebar,
        setIsCollapsed,
        setIsMobileOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
