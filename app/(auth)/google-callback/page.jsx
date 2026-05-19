'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { apiFetch } from '@/lib/useApi';

/**
 * Google OAuth Callback Handler
 *
 * NextAuth completes OAuth and redirects here.
 * This page:
 * 1. Reads the NextAuth session (which contains genoisToken from JWT callback)
 * 2. Sets genois_token cookie + localStorage (so middleware sees it)
 * 3. Fetches full user data from /api/user/me
 * 4. Hydrates Zustand auth store
 * 5. Redirects to /dashboard or /onboarding for new users
 */
export default function GoogleCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [message, setMessage] = useState('Completing sign-in...');

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      setMessage('Authentication failed. Redirecting...');
      setTimeout(() => router.replace('/login?error=OAuthSignIn'), 1500);
      return;
    }

    if (status === 'authenticated' && session?.genoisToken) {
      const token = session.genoisToken;

      // 1. Set cookie for middleware
      document.cookie = `genois_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

      // 2. Set localStorage
      localStorage.setItem('genois_token', token);
      if (session.plan) localStorage.setItem('genois_plan', session.plan);

      setMessage('Loading your profile...');

      // 3. Fetch full user data
      apiFetch('/api/user/me', token)
        .then(r => {
          const { user, progress, score, skill } = r.data;
          setAuth(user, token, progress, score, skill);

          // 4. Redirect: new user → onboarding, returning user → dashboard
          if (session.isNewUser || !user?.domain_slug) {
            router.replace('/onboarding?from=google');
          } else {
            router.replace('/dashboard');
          }
        })
        .catch(() => {
          // Partial hydration — still let them in
          setAuth({ email: session.userEmail, name: session.userName }, token, null, null, null);
          router.replace('/dashboard');
        });
    }
  }, [status, session]);

  return (
    <div style={{
      minHeight: '100vh', background: '#020812',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Outfit,sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          {status === 'unauthenticated' ? '❌' : '🔄'}
        </div>
        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, color: '#e8f4ff', marginBottom: 8 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%', background: '#00f0ff',
              animation: `bounce 1.2s ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
        <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
      </div>
    </div>
  );
}
