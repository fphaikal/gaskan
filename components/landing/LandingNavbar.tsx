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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { label: 'Fitur', href: '/#fitur' },
    { label: 'Statistik', href: '/#statistik' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'Tim', href: '/team' },
  ];

  return (
    <nav
      aria-label="Navigasi publik"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-md shadow-sm border-b border-border bg-background/80'
          : 'bg-transparent'
      }`}
    >
      <div className="relative max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
        {/* Logo */}
        <Link href="/" className="flex min-w-0 items-center gap-2 group">
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
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-full md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          >
            <Icon icon={mobileMenuOpen ? 'mingcute:close-line' : 'mingcute:menu-line'} className="text-xl" />
          </Button>

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
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold px-3 sm:px-4 py-2 text-xs sm:text-sm shadow-md hover:shadow-primary/30 transition-all"
          >
            {mounted && user ? 'Dashboard' : 'Masuk'}
          </Link>
        </div>

        {mobileMenuOpen && (
          <div
            id="landing-mobile-menu"
            className="absolute left-4 right-4 top-[calc(100%+0.5rem)] grid grid-cols-2 gap-2 rounded-2xl border border-border bg-background/95 p-2 shadow-xl backdrop-blur-xl md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex min-h-11 items-center rounded-xl px-3 text-sm font-bold transition-colors hover:bg-primary/10 hover:text-primary ${
                  pathname === link.href ? 'bg-primary/10 text-primary' : 'text-foreground/75'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
