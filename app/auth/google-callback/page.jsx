'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { apiFetch } from '@/lib/useApi';
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
      const token = session?.genoisToken;

      if (!token) {
        // JWT callback ran but failed to attach genoisToken (Supabase error etc.)
        didRedirect.current = true;
        router.replace('/login?error=OAuthSignIn');
        return;
      }

      didRedirect.current = true;

      // 1. Set cookie for middleware
      document.cookie = `genois_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

      // 2. Set localStorage
      localStorage.setItem('genois_token', token);
      if (session.plan) localStorage.setItem('genois_plan', session.plan);

      setMessage('Loading your profile...');

      // 3. Fetch the FULL profile — /api/auth/profile returns the complete user
      // row (college, target_companies, …) plus progress/score/skill. /api/user/me
      // omits college & target_companies, so isProfileComplete() could never see
      // them and every OAuth user was misrouted.
      apiFetch('/api/auth/profile', token)
        .then(r => {
          const { user, progress, score, skill } = r.data;
          setAuth(user, token, progress, score, skill);

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
          setAuth({ email: session.userEmail, name: session.userName }, token, null, null, null);
          router.replace(session.isNewUser ? '/onboarding?from=google' : '/dashboard');
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
