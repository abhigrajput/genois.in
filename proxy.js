import { NextResponse } from 'next/server';
import { csrfCheck } from '@/lib/security';

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

// Routes that receive legitimate cross-origin or no-Origin POSTs:
// - /api/cron/*       — Vercel cron, gated by CRON_SECRET bearer token
// - /api/auth/        — NextAuth callbacks (Google OAuth redirect, NextAuth's
//                       own CSRF endpoint); NextAuth has its own CSRF handling.
// - /api/payment/     — payment webhooks (Razorpay etc.) when re-enabled must
//                       validate signatures, not rely on Origin.
const CSRF_EXEMPT_PREFIXES = [
  '/api/cron/',
  '/api/auth/',
  '/api/payment/',
];

function isCsrfExempt(pathname) {
  return CSRF_EXEMPT_PREFIXES.some(p => pathname.startsWith(p));
}

// Admin route IP allowlist — opt-in. If ADMIN_IPS env var is unset or set to
// "*", the IP gate is disabled and access is governed entirely by the
// is_admin / admin_users check inside getAdminFromRequest at the API layer.
// To re-enable IP allowlisting, set ADMIN_IPS to a comma-separated list.
const ADMIN_IPS_RAW = process.env.ADMIN_IPS || '';
const ADMIN_IPS_ENFORCED = ADMIN_IPS_RAW && ADMIN_IPS_RAW.trim() !== '*';
const ADMIN_IPS = new Set(
  ADMIN_IPS_RAW
    .split(',')
    .map(ip => ip.trim())
    .filter(Boolean)
);

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // ── CSRF: enforce Origin/Referer match on state-changing API requests ──
  if (pathname.startsWith('/api/') && !isCsrfExempt(pathname)) {
    const csrfBlock = csrfCheck(request);
    if (csrfBlock) return csrfBlock;
  }

  // ── Auth: redirect unauthenticated users from protected pages to /login ──
  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get('genois_token')?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route — optional IP allowlist gate. The authoritative check happens
  // inside the /api/admin handler via getAdminFromRequest(); this gate is
  // belt-and-suspenders, only enforced when ADMIN_IPS is explicitly configured.
  if (ADMIN_IPS_ENFORCED && pathname.startsWith('/admin')) {
    const ip =
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';

    if (!ADMIN_IPS.has(ip)) {
      console.warn(`[Admin] Blocked access from IP: ${ip}`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // NOTE: Full JWT signature verification + blacklist check happens inside each
  // API route handler via getUserFromRequest(). Proxy only checks cookie
  // presence to avoid Edge Runtime crypto limitations.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
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
