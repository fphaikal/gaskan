import { absoluteUrl, siteConfig } from "./seo";
import type { PublicTeamMember } from "./team";

export const TEAM_FALLBACK_DESCRIPTION =
  "Kenali pembimbing dan tim multidisiplin yang membangun serta menjaga sistem absensi digital GASKAN SMTI Jogja.";

export function buildTeamMetadataDescription(
  members: Pick<PublicTeamMember, "role">[],
): string {
  if (members.length === 0) {
    return TEAM_FALLBACK_DESCRIPTION;
  }

  const mentors = members.filter((member) =>
    member.role.toLowerCase().includes("pembimbing"),
  ).length;
  const developers = members.length - mentors;

  return `Kenali ${members.length} anggota aktif Tim GASKAN SMTI Jogja: ${mentors} pembimbing dan ${developers} anggota tim pengembang sistem absensi digital.`;
}

export function buildTeamPageJsonLd(members: PublicTeamMember[]) {
  const teamUrl = absoluteUrl("/team");

  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Tim GASKAN",
    url: teamUrl,
    description: buildTeamMetadataDescription(members),
    inLanguage: siteConfig.language,
    mainEntity: {
      "@type": "Organization",
      name: siteConfig.name,
      alternateName: siteConfig.alternateName,
      url: absoluteUrl("/"),
      member: members.map((member) => {
        const sameAs = [
          member.github,
          member.linkedin,
          member.instagram,
          ...member.customLinks.map((link) => link.url),
        ].filter((url): url is string => Boolean(url));
        const description = [
          member.bio,
          member.year ? `Anggota Tim GASKAN periode ${member.year}.` : null,
        ]
          .filter((value): value is string => Boolean(value))
          .join(" ");

        return {
          "@type": "Person",
          name: member.name,
          jobTitle: member.role,
          ...(description ? { description } : {}),
          ...(member.photoUrl ? { image: member.photoUrl } : {}),
          ...(sameAs.length > 0 ? { sameAs: [...new Set(sameAs)] } : {}),
          memberOf: {
            "@type": "Organization",
            name: siteConfig.name,
            url: absoluteUrl("/"),
          },
        };
      }),
    },
  };
}
