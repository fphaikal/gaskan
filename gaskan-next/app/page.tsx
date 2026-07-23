'use client';

import { LandingNavbar } from '@/components/landing/LandingNavbar';

import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingStats } from '@/components/landing/LandingStats';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function RootPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" suppressHydrationWarning>
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <LandingStats />
        <LandingFAQ />
      </main>
      <LandingFooter />
    </div>
  );
}
