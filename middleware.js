import { NextResponse } from 'next/server';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/notes',
  '/roadmap',
  '/profile',
  '/tests',
  '/coding',
  '/projects',
  '/mentor',
  '/chatbot',
  '/anxiety',
  '/aptitude',
  '/dsa-guide',
  '/dsa-roadmap',
  '/interview-simulator',
  '/skill-levels',
  '/notifications',
  '/feedback',
  '/leaderboard',
  '/admin',
  '/certificate',
  '/subscription',
];

// FIX 04: Allowed admin IPs — extend via ADMIN_IPS env var (comma-separated)
const ADMIN_IPS = new Set(
  (process.env.ADMIN_IPS || '127.0.0.1,::1')
    .split(',')
    .map(ip => ip.trim())
    .filter(Boolean)
);

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get('genois_token')?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // FIX 04: Admin route — extra IP allowlist gate
  if (pathname.startsWith('/admin')) {
    const ip =
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';

    if (!ADMIN_IPS.has(ip)) {
      console.warn(`[Admin] Blocked access from IP: ${ip}`);
      // Redirect to dashboard instead of 403 to avoid leaking admin existence
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // NOTE: Full JWT signature verification + blacklist check happens inside each
  // API route handler via getUserFromRequest(). Middleware only checks cookie
  // presence to avoid Edge Runtime crypto limitations.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/notes/:path*',
    '/roadmap/:path*',
    '/profile/:path*',
    '/tests/:path*',
    '/coding/:path*',
    '/projects/:path*',
    '/mentor/:path*',
    '/chatbot/:path*',
    '/anxiety/:path*',
    '/aptitude/:path*',
    '/dsa-guide/:path*',
    '/dsa-roadmap/:path*',
    '/interview-simulator/:path*',
    '/skill-levels/:path*',
    '/notifications/:path*',
    '/feedback/:path*',
    '/leaderboard/:path*',
    '/admin/:path*',
    '/certificate/:path*',
    '/subscription/:path*',
  ],
};
