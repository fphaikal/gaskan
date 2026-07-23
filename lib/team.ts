import { cache } from "react";

export const TEAM_API_ORIGIN = "https://gaskan-api.smtijogja.my.id";

const TEAM_REVALIDATE_SECONDS = 3600;
const TEAM_REQUEST_TIMEOUT_MS = 5000;

export type TeamCustomLink = {
  label: string;
  url: string;
  icon: string | null;
};

export type PublicTeamMember = {
  id: string;
  name: string;
  role: string;
  photoUrl: string | null;
  github: string | null;
  linkedin: string | null;
  instagram: string | null;
  bio: string | null;
  customLinks: TeamCustomLink[];
  year: string | null;
  order: number;
};

type FetchPublicTeamMembersOptions = {
  apiBase?: string;
  fetcher?: typeof fetch;
};

function normalizeText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function normalizePublicUrl(value: unknown): string | null {
  const candidate = normalizeText(value);

  if (!candidate) {
    return null;
  }

  try {
    const url = new URL(candidate);

    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function resolveTeamPhotoUrl(
  value: unknown,
  apiBase = TEAM_API_ORIGIN,
): string | null {
  const candidate = normalizeText(value);

  if (!candidate || candidate.includes("0000")) {
    return null;
  }

  try {
    const url = new URL(candidate, `${apiBase.replace(/\/+$/, "")}/`);

    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function normalizeCustomLinks(value: unknown): TeamCustomLink[] {
  let parsed = value;

  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const url = normalizePublicUrl(record.url);

    if (!url) {
      return [];
    }

    return [
      {
        label: normalizeText(record.label) ?? "Tautan",
        url,
        icon: normalizeText(record.icon),
      },
    ];
  });
}

export function normalizeTeamMembers(
  payload: unknown,
  apiBase = TEAM_API_ORIGIN,
): PublicTeamMember[] {
  const source =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: unknown }).data
      : payload;

  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .flatMap((entry) => {
      if (!entry || typeof entry !== "object") {
        return [];
      }

      const member = entry as Record<string, unknown>;

      if (member.isActive === false) {
        return [];
      }

      const id = normalizeText(member.id);
      const name = normalizeText(member.name);

      if (!id || !name) {
        return [];
      }

      const orderValue = Number(member.order);

      return [
        {
          id,
          name,
          role: normalizeText(member.role) ?? "Anggota Tim",
          photoUrl: resolveTeamPhotoUrl(member.photoUrl, apiBase),
          github: normalizePublicUrl(member.github),
          linkedin: normalizePublicUrl(member.linkedin),
          instagram: normalizePublicUrl(member.instagram),
          bio: normalizeText(member.bio),
          customLinks: normalizeCustomLinks(member.customLinks),
          year: normalizeText(member.year),
          order: Number.isFinite(orderValue) ? orderValue : 0,
        },
      ];
    })
    .sort(
      (left, right) =>
        left.order - right.order || left.name.localeCompare(right.name),
    );
}

export async function fetchPublicTeamMembers({
  apiBase = process.env.NEXT_PUBLIC_API_BASE || TEAM_API_ORIGIN,
  fetcher = fetch,
}: FetchPublicTeamMembersOptions = {}): Promise<PublicTeamMember[]> {
  const baseUrl = apiBase.replace(/\/+$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    TEAM_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetcher(`${baseUrl}/api/team`, {
      headers: {
        accept: "application/json",
      },
      next: {
        revalidate: TEAM_REVALIDATE_SECONDS,
        tags: ["public-team"],
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return [];
    }

    return normalizeTeamMembers(await response.json(), baseUrl);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export const getPublicTeamMembers = cache(fetchPublicTeamMembers);
