'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

export function LandingNavbar() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Beranda', href: '/' },
    { label: 'Tim', href: '/team' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-md shadow-sm border-b border-border bg-background/80'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Icon
            icon="Key"
            className="text-primary text-2xl transition-transform group-hover:rotate-12 duration-300"
          />
          <span className="text-xl font-extrabold tracking-tight">GASKAN</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-all duration-200 hover:text-primary ${
                pathname === link.href ? 'text-primary font-bold' : 'opacity-70 hover:opacity-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full"
            aria-label="Toggle theme"
          >
            {mounted && (
              <Icon
                icon={theme === 'dark' ? 'Sun' : 'Moon'}
                className="text-xl"
              />
            )}
          </Button>

          {/* Login / Dashboard CTA */}
          <Link
            href={mounted && user ? '/home' : '/login'}
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold px-4 py-2 text-sm shadow-md hover:shadow-primary/30 transition-all"
          >
            {mounted && user ? 'Dashboard' : 'Masuk'}
          </Link>

        </div>
      </div>
    </nav>
  );
}
