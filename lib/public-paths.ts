export const AUTH_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
] as const;

export const DISCOVERY_PATHS = [
  "/team",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
] as const;

export const PUBLIC_PATHS = [
  "/",
  ...AUTH_PATHS,
  ...DISCOVERY_PATHS,
] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path);
}
