import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_PATHS = ['/login', '/forgot-password', '/reset-password'];
const DISCOVERY_PATHS = ['/team', '/robots.txt', '/sitemap.xml', '/llms.txt'];
const PUBLIC_PATHS = ['/', ...AUTH_PATHS, ...DISCOVERY_PATHS];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authToken = request.cookies.get('auth_token')?.value || request.headers.get('Authorization');
  const isAuthenticated = Boolean(authToken);

  const isAuthPath = AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path);

  // If user is authenticated and trying to visit an auth path, redirect to /home
  if (isAuthenticated && isAuthPath) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // If user is not authenticated and trying to visit a protected route, redirect to /login
  if (!isAuthenticated && !isPublicPath && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
