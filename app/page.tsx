import type { Metadata } from 'next';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingStats } from '@/components/landing/LandingStats';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { LandingFooter } from '@/components/landing/LandingFooter';
import {
  buildWebsiteJsonLd,
  createPublicPageMetadata,
  serializeJsonLd,
  siteConfig,
} from '@/lib/seo';

export const metadata: Metadata = createPublicPageMetadata({
  title: siteConfig.title,
  description: siteConfig.description,
  path: '/',
});

export default function RootPage() {
  const websiteJsonLd = serializeJsonLd(buildWebsiteJsonLd());

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" suppressHydrationWarning>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: websiteJsonLd }}
      />
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
