import type { Metadata } from "next";
import { createPublicPageMetadata } from "@/lib/seo";
import { getPublicTeamMembers } from "@/lib/team";
import { buildTeamMetadataDescription } from "@/lib/team-seo";

export async function generateMetadata(): Promise<Metadata> {
  const team = await getPublicTeamMembers();

  return createPublicPageMetadata({
    title: "Tim GASKAN — Pengembang Sistem Absensi SMTI Jogja",
    description: buildTeamMetadataDescription(team),
    path: "/team",
  });
}

export default function TeamLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
