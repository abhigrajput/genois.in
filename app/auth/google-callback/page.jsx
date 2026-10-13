'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { apiFetch, COOKIE_SESSION } from '@/lib/useApi';
import { isProfileComplete } from '@/lib/profile';

export default function GoogleCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [message, setMessage] = useState('Completing sign-in...');
  // Prevent double-redirect: loading→unauthenticated(transient)→authenticated race
  const didRedirect = useRef(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (didRedirect.current) return;

    if (status === 'unauthenticated') {
      didRedirect.current = true;
      setMessage('Authentication failed. Redirecting...');
      router.replace('/login?error=OAuthSignIn');
      return;
    }

    if (status === 'authenticated') {
      didRedirect.current = true;

      // 1. Have the server set the httpOnly session cookie. It reads the genois
      // token from the NextAuth JWT with getToken(), so the token never reaches
      // this page — and a JWT callback that failed to attach one (Supabase
      // error etc.) surfaces here as a 401, which fails the sign-in below.
      fetch('/api/auth/google-session', { method: 'POST' })
        .then(r => {
          if (!r.ok) throw new Error(`google-session ${r.status}`);
        })
        .then(() => {
          // 2. Non-secret preferences only — the token stays in the cookie.
          if (session.plan) localStorage.setItem('genois_plan', session.plan);

          setMessage('Loading your profile...');

          // 3. Fetch the FULL profile — /api/auth/profile returns the complete user
          // row (college, target_companies, …) plus progress/score/skill. /api/user/me
          // omits college & target_companies, so isProfileComplete() could never see
          // them and every OAuth user was misrouted.
          // COOKIE_SESSION makes apiFetch send no Authorization header, so the
          // cookie set in step 1 authenticates. It is passed, never stored.
          return apiFetch('/api/auth/profile', COOKIE_SESSION)
            .then(r => {
              const { user, progress, score, skill } = r.data;
              setAuth(user, null, progress, score, skill);

              // 4. Redirect: any incomplete profile → onboarding (college, domain,
              // target company, timeline, weak areas). Only fully-set-up returning
              // users go straight to the dashboard.
              if (!isProfileComplete(user)) {
                router.replace('/onboarding?from=google');
              } else {
                router.replace('/dashboard');
              }
            })
            .catch(() => {
              // Partial hydration — we couldn't confirm the profile, so send new
              // sign-ins through onboarding; returning users hit the dashboard guard.
              setAuth({ email: session.userEmail, name: session.userName }, null, null, null, null);
              router.replace(session.isNewUser ? '/onboarding?from=google' : '/dashboard');
            });
        })
        .catch(() => {
          // No server-set session cookie means the proxy would bounce every
          // protected page to /login anyway — fail the sign-in visibly instead.
          router.replace('/login?error=OAuthSignIn');
        });
    }
  }, [status, session]);

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--gx-surface)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          {status === 'unauthenticated' ? '❌' : '🔄'}
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: 'var(--gx-text)', marginBottom: 8 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%', background: 'var(--gx-accent)',
              animation: `bounce 1.2s ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
        <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
      </div>
    </div>
  );
}
