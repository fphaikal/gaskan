import { connection } from "next/server";
import { serializeJsonLd } from "@/lib/seo";
import { getPublicTeamMembers } from "@/lib/team";
import { buildTeamPageJsonLd } from "@/lib/team-seo";
import { TeamPageClient } from "./TeamPageClient";

export default async function PublicTeamPage() {
  await connection();

  const team = await getPublicTeamMembers();
  const jsonLd = serializeJsonLd(buildTeamPageJsonLd(team));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <TeamPageClient team={team} />
    </>
  );
}
