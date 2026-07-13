'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { signIn } from 'next-auth/react';
import useAuthStore from '@/store/authStore';
import { authAPI } from '@/lib/api';
import { trackLogin } from '@/lib/analytics';
import { Check } from 'lucide-react';

const PURPLE = '#00d9a3';
const PURPLE_LIGHT = '#2ee6b0';
const BG = '#0a0a0f';
const CARD = '#12121a';
const MUTED = '#8b93a1';

const BRAND_BULLETS = ['Free 30-day trial', 'No credit card needed', '10 career domains'];

// RFC-lite email check — enough to catch typos client-side before we hit the
// network. The server re-validates with Zod, so this is a UX guard, not the
// security boundary.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── OAuth error mapping ──────────────────────────────────────────────────────
// NextAuth redirects failures back to `pages.error` ('/login') with an `?error=`
// code. Our own signIn callback additionally returns '/login?error=OAuthSignIn'
// (capital I) on a Supabase failure. Map every code we can hit to a clean,
// human sentence so a cancelled or failed Google popup never dumps the user on
// a blank form. Anything unmapped falls through to `default`.
const OAUTH_ERROR_COPY = {
  OAuthSignin:          'We could not start Google sign-in. Please try again.',
  OAuthSignIn:          'We could not complete Google sign-in. Please try again.',
  OAuthCallback:        'We could not complete Google sign-in. Please try again.',
  OAuthCreateAccount:   'We could not create your account from Google. Please try again.',
  OAuthAccountNotLinked:'This email is already registered with a password. Please sign in with your email and password below.',
  Callback:             'We could not complete Google sign-in. Please try again.',
  AccessDenied:         'Google sign-in was cancelled. You can try again or use your email and password.',
  Configuration:        'Google sign-in is temporarily unavailable. Please sign in with your email and password.',
  Verification:         'That sign-in link is invalid or has expired. Please try again.',
  default:              'Something went wrong during sign-in. Please try again.',
};

// ─── Server login error mapping ───────────────────────────────────────────────
// lib/api.js throws `Error(data.message)` and discards status/code, so we map on
// the server's (already human-readable) message text and always fall back to a
// safe generic — the user never sees a raw 500 or an empty banner.
function friendlyLoginError(message) {
  const m = (message || '').toLowerCase();
  if (m.includes('incorrect') || m.includes('invalid email or password')) return 'That email or password is incorrect.';
  if (m.includes('created with google')) return 'This account uses Google. Please use “Continue with Google” above.';
  if (m.includes('too many failed') || m.includes('too many requests')) return message; // already friendly
  if (m.includes('valid email') || m.includes('password') || m.includes('check the form')) return message;
  if (m.includes('forbidden')) return 'Your session looks stale. Please refresh the page and try again.';
  return 'We could not sign you in right now. Please try again in a moment.';
}

// Only allow same-origin relative redirects (starts with a single '/'), so a
// crafted `?redirect=//evil.com` can't turn login into an open redirect.
function safeRedirect(raw) {
  if (typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/dashboard';
}

export default function LoginPage() {
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [focused, setFocused] = useState('');

  // Read one-shot query flags on mount. We intentionally use
  // window.location.search (not useSearchParams) to avoid Next 16's Suspense
  // requirement around that hook on a page that is otherwise fully static.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') setVerified(true);
    const errCode = params.get('error');
    if (errCode) setError(OAUTH_ERROR_COPY[errCode] || OAUTH_ERROR_COPY.default);
  }, []);

  // ─── Google OAuth ───────────────────────────────────────────────────────────
  // Flow: signIn('google') → NextAuth GoogleProvider → Google consent → NextAuth
  // callback route → our /auth/google-callback page (mints + stores the custom
  // genois JWT). We pass redirect:true (the default) so NextAuth owns the full
  // browser redirect; on *failure* it returns the user to /login?error=<code>,
  // which the mount effect above turns into a banner. The try/catch here only
  // guards the rare synchronous throw (e.g. provider misconfigured client-side).
  //
  // ── Google Cloud Console › Credentials › OAuth 2.0 Client ─────────────────────
  // The provider's callback path is fixed by NextAuth: /api/auth/callback/google
  // Register BOTH of these as "Authorized redirect URIs" (exact match, no
  // trailing slash), and set NEXTAUTH_URL to the matching origin per environment:
  //   • Local dev : http://localhost:3000/api/auth/callback/google   (NEXTAUTH_URL=http://localhost:3000)
  //   • Production: https://genois.in/api/auth/callback/google        (NEXTAUTH_URL=https://genois.in)
  // "Authorized JavaScript origins" must list http://localhost:3000 and
  // https://genois.in. A mismatch here is the #1 cause of redirect_uri_mismatch.
  const handleGoogleLogin = async () => {
    if (googleLoading || loading) return;
    setError('');
    setGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/auth/google-callback' });
      // On success signIn() navigates away and never returns here.
    } catch (err) {
      console.error('Google sign-in threw:', err);
      setError('We could not start Google sign-in. Please try again.');
      toast.error('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  // ─── Client-side validation (runs before any network hit) ─────────────────────
  const validate = () => {
    const next = { email: '', password: '' };
    const email = form.email.trim();
    if (!email) next.email = 'Email is required.';
    else if (!EMAIL_RE.test(email)) next.email = 'Please enter a valid email address.';
    // Login intentionally does NOT re-enforce the full signup strength policy
    // (that would leak the policy and could block legacy accounts) — we only
    // catch an empty/obviously-truncated field so we don't waste a round-trip.
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 6) next.password = 'Please enter your full password.';
    setFieldErrors(next);
    return !next.email && !next.password;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return; // hard guard against duplicate submissions
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await authAPI.login({ email: form.email.trim().toLowerCase(), password: form.password });
      const { user, token, progress, score, skill } = res.data || {};

      if (!token || !user) {
        setError('We could not sign you in right now. Please try again in a moment.');
        return;
      }

      // ── State & routing synchronization ──
      // 1. Persist the token for the localStorage-based Bearer path. The
      //    middleware/edge cookie is now the httpOnly `genois_token` set by the
      //    /api/auth/login response (FIX P4), so we no longer write a
      //    JS-readable duplicate cookie here — that copy was XSS-exfiltratable
      //    and, being shadowed by the httpOnly cookie, was already a no-op.
      if (typeof window !== 'undefined') {
        localStorage.setItem('genois_token', token);
        localStorage.setItem('genois_plan', user.plan || 'spectator');
      }
      // 2. Hydrate the global store so any client subscriber sees the session.
      setAuth(user, token, progress, score, skill);

      trackLogin('email');
      const first = (user.name || '').trim().split(/\s+/)[0];
      toast.success(first ? `Welcome back, ${first}!` : 'Welcome back!');

      // 3. Only now navigate. A full-document assignment (not router.push)
      //    guarantees the freshly-set cookie is attached to the very next
      //    request, so the server-side guard on /dashboard sees us as authed —
      //    no race, no bounce back to /login.
      const params = new URLSearchParams(window.location.search);
      window.location.href = safeRedirect(params.get('redirect'));
    } catch (err) {
      setError(friendlyLoginError(err?.message));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (key) => ({
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: `1px solid ${fieldErrors[key] ? 'rgba(239,68,68,0.55)' : focused === key ? PURPLE : 'rgba(0,217,163,0.15)'}`,
    background: focused === key ? 'rgba(0,217,163,0.06)' : 'rgba(255,255,255,0.03)',
    color: '#f8fafc', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
    boxSizing: 'border-box', transition: 'all 0.18s',
    boxShadow: focused === key ? '0 0 0 3px rgba(0,217,163,0.12)' : 'none',
  });

  const fieldErrorStyle = { color: '#f87171', fontSize: 12, margin: '6px 2px 0' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: BG, fontFamily: 'var(--font-body)' }}>

      {/* ─── LEFT BRAND PANEL (40%) ─── */}
      <div className="gen-desktop-only" style={{
        width: '40%', maxWidth: 520, position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '56px 52px',
        background: 'linear-gradient(160deg, #15152a 0%, #0a0a0f 60%)',
        borderRight: '1px solid rgba(0,217,163,0.12)',
      }}>
        <div style={{ position: 'absolute', top: -120, left: -100, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,217,163,0.22), transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 34, letterSpacing: 0.5, marginBottom: 28 }}>
            <span style={{ color: PURPLE }}>GEN</span><span style={{ color: '#f8fafc' }}>OIS</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 30, fontWeight: 800, color: '#f8fafc', lineHeight: 1.2, margin: '0 0 16px' }}>
            Your placement journey starts here
          </h2>
          <p style={{ color: '#9ca3af', fontSize: 15, lineHeight: 1.7, margin: '0 0 30px', maxWidth: 360 }}>
            A 365-day AI roadmap personalized for your college, your target company, your timeline.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
            {BRAND_BULLETS.map((b) => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#d1d5db' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,217,163,0.15)', border: '1px solid rgba(0,217,163,0.4)', color: PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={12} strokeWidth={2.5} color={PURPLE_LIGHT} /></span>
                {b}
              </div>
            ))}
          </div>
          <div style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,217,163,0.12)', maxWidth: 360 }}>
            <p style={{ color: '#d1d5db', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 8px', fontStyle: 'italic' }}>
              “Got placed at Infosys after 3 months on GENOIS.”
            </p>
            <div style={{ fontSize: 12, color: MUTED, fontFamily: 'var(--font-mono)' }}>— Priya S. · VTU</div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT FORM PANEL (60%) ─── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <div className="gen-mobile-only" style={{ textAlign: 'center', marginBottom: 24, display: 'none' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 28 }}>
              <span style={{ color: PURPLE }}>GEN</span><span style={{ color: '#f8fafc' }}>OIS</span>
            </span>
          </div>

          <div style={{ background: CARD, border: '1px solid rgba(0,217,163,0.14)', borderRadius: 18, padding: '32px 30px', boxShadow: '0 24px 60px rgba(0,0,0,0.45)' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#f8fafc', margin: '0 0 6px' }}>Welcome back</h1>
            <p style={{ color: MUTED, fontSize: 14, margin: '0 0 24px' }}>Sign in to continue your journey.</p>

            {verified && (
              <div role="status" aria-live="polite" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '10px 14px', color: '#10b981', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={16} strokeWidth={2.5} color="#10b981" style={{ flexShrink: 0 }} />
                <span>Email verified! Please sign in.</span>
              </div>
            )}

            {error && (
              <div role="alert" aria-live="assertive" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</div>
            )}

            {/* Google OAuth */}
            <button onClick={handleGoogleLogin} disabled={googleLoading || loading} type="button" style={{
              width: '100%', padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
              background: '#fff', color: '#1f2937', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600,
              cursor: googleLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, marginBottom: 20, transition: 'all 0.2s', opacity: (googleLoading || loading) ? 0.7 : 1,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {googleLoading ? 'Connecting…' : 'Continue with Google'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 11, color: MUTED, fontFamily: 'var(--font-mono)' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <form onSubmit={submit} noValidate>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="login-email" style={{ display: 'block', fontSize: 12, color: '#9ca3af', fontWeight: 500, marginBottom: 7 }}>Email</label>
                <input
                  id="login-email" name="email" type="email" autoComplete="email"
                  value={form.email}
                  onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); if (fieldErrors.email) setFieldErrors((fe) => ({ ...fe, email: '' })); }}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                  aria-invalid={!!fieldErrors.email}
                  placeholder="your@email.com" style={inputStyle('email')}
                />
                {fieldErrors.email && <p style={fieldErrorStyle}>{fieldErrors.email}</p>}
              </div>
              <div style={{ marginBottom: 22 }}>
                <label htmlFor="login-password" style={{ display: 'block', fontSize: 12, color: '#9ca3af', fontWeight: 500, marginBottom: 7 }}>Password</label>
                <input
                  id="login-password" name="password" type="password" autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); if (fieldErrors.password) setFieldErrors((fe) => ({ ...fe, password: '' })); }}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                  aria-invalid={!!fieldErrors.password}
                  placeholder="Your password" style={inputStyle('password')}
                />
                {fieldErrors.password && <p style={fieldErrorStyle}>{fieldErrors.password}</p>}
              </div>
              <button type="submit" disabled={loading} className="gen-press" style={{
                width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                cursor: loading ? 'wait' : 'pointer',
                background: loading ? 'rgba(0,217,163,0.5)' : `linear-gradient(135deg, ${PURPLE}, ${'#00b389'})`,
                color: '#0a0a0f', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700,
                boxShadow: '0 8px 24px rgba(0,217,163,0.32)', transition: 'all 0.2s',
              }}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <Link href="/forgot-password" style={{ color: MUTED, textDecoration: 'none', fontSize: 13 }}>Forgot password?</Link>
              </div>
            </form>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: MUTED }}>
            New to GENOIS?{' '}
            <Link href="/signup" style={{ color: PURPLE_LIGHT, textDecoration: 'none', fontWeight: 600 }}>Create your account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
