import type { Metadata } from "next";
import { connection } from "next/server";
import { createPublicPageMetadata } from "@/lib/seo";
import { getPublicTeamMembers } from "@/lib/team";
import { buildTeamMetadataDescription } from "@/lib/team-seo";

export async function generateMetadata(): Promise<Metadata> {
  await connection();

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
