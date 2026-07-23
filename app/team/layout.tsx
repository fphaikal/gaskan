import type { Metadata } from "next";
import { createPublicPageMetadata } from "@/lib/seo";

const description =
  "Kenali pembimbing dan tim multidisiplin yang membangun serta menjaga sistem absensi digital GASKAN SMTI Jogja.";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Tim GASKAN — Pengembang Sistem Absensi SMTI Jogja",
  description,
  path: "/team",
});

export default function TeamLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
