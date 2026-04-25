import { NextResponse } from 'next/server';

const PROTECTED_ROUTES = [
  '/dashboard',
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
];

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

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
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
  ],
};
