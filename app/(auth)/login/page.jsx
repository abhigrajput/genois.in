'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { signIn } from 'next-auth/react';
import useAuthStore from '@/store/authStore';
import { authAPI } from '@/lib/api';
import { trackLogin } from '@/lib/analytics';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('verified') === 'true') {
        setVerified(true);
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/auth/google-callback' });
      // signIn() handles redirect — control only returns here on error
    } catch (err) {
      toast.error('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.login(form);
      const { user, token, progress, score, skill } = res.data;
      
      // Save token to localStorage explicitly
      if (typeof window !== 'undefined') {
        localStorage.setItem('genois_token', token);
        localStorage.setItem('genois_plan', user?.plan || 'spectator');
        // Set cookie for middleware auth check
        document.cookie = `genois_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      }
      
      // Save to Zustand store
      setAuth(user, token, progress, score, skill);
      
      trackLogin('email');
      
      toast.success('Welcome back, ' + user.name.split(' ')[0] + '!');
      
      // Redirect to original destination if redirected from protected route
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/dashboard';
      window.location.href = redirect;
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:'100vh', background:'#020812',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:24, fontFamily:'Outfit,sans-serif',
      backgroundImage:'linear-gradient(rgba(0,240,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.03) 1px,transparent 1px)',
      backgroundSize:'60px 60px',
    }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:32, fontWeight:800, letterSpacing:-1, marginBottom:8 }}>
            <span style={{color:'#00f0ff'}}>GEN</span><span style={{color:'#e8f4ff'}}>OIS</span>
          </div>
          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#5a7a9a', letterSpacing:2 }}>WELCOME BACK</div>
        </div>

        <div style={{
          background:'#070f1f',
          border:'1px solid rgba(0,240,255,0.12)',
          borderRadius:16, padding:28,
          position:'relative', overflow:'hidden',
        }}>
          <div style={{
            position:'absolute', top:0, left:0, right:0, height:1,
            background:'linear-gradient(90deg,transparent,rgba(0,240,255,0.4),transparent)',
          }}/>

          {verified && (
            <div style={{
              background:'rgba(0,240,255,0.06)',
              border:'1px solid rgba(0,240,255,0.3)',
              borderRadius:8, padding:'10px 14px',
              color:'#00f0ff', fontSize:13, marginBottom:16,
              display:'flex', alignItems:'center', gap:8
            }}>
              <span style={{ fontSize: 16 }}>✓</span>
              <span>Email verified successfully! Please sign in.</span>
            </div>
          )}

          {error && (
            <div style={{
              background:'rgba(255,45,120,0.1)',
              border:'1px solid rgba(255,45,120,0.3)',
              borderRadius:8, padding:'10px 14px',
              color:'#ff2d78', fontSize:13, marginBottom:16,
            }}>{error}</div>
          )}

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            type="button"
            style={{
              width: '100%', padding: '12px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: googleLoading ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
              color: '#e8f4ff', fontFamily: 'Syne,sans-serif',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, marginBottom: 16, transition: 'all 0.2s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </button>

          {/* OR divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <form onSubmit={submit}>
            <div style={{ marginBottom:16 }}>
              <label style={{
                display:'block', fontFamily:'JetBrains Mono,monospace',
                fontSize:10, color:'#5a7a9a', letterSpacing:1,
                textTransform:'uppercase', marginBottom:6,
              }}>Email</label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm(f => ({...f, email:e.target.value}))}
                placeholder="your@email.com"
                style={{
                  width:'100%', padding:'11px 14px', borderRadius:8,
                  border:'1px solid rgba(0,240,255,0.15)',
                  background:'rgba(255,255,255,0.03)',
                  color:'#e8f4ff', fontSize:14,
                  fontFamily:'Outfit,sans-serif', outline:'none',
                  boxSizing:'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{
                display:'block', fontFamily:'JetBrains Mono,monospace',
                fontSize:10, color:'#5a7a9a', letterSpacing:1,
                textTransform:'uppercase', marginBottom:6,
              }}>Password</label>
              <input
                type="password" required
                value={form.password}
                onChange={e => setForm(f => ({...f, password:e.target.value}))}
                placeholder="Your password"
                style={{
                  width:'100%', padding:'11px 14px', borderRadius:8,
                  border:'1px solid rgba(0,240,255,0.15)',
                  background:'rgba(255,255,255,0.03)',
                  color:'#e8f4ff', fontSize:14,
                  fontFamily:'Outfit,sans-serif', outline:'none',
                  boxSizing:'border-box',
                }}
              />
            </div>

            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'13px',
              borderRadius:10, border:'none', cursor:'pointer',
              background: loading ? 'rgba(0,240,255,0.3)' : 'linear-gradient(135deg,#00f0ff,#7b5cff)',
              color:'#020812', fontFamily:'Syne,sans-serif',
              fontSize:15, fontWeight:700,
              transition:'all 0.2s',
            }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <Link href="/forgot-password" style={{ color: '#5a7a9a', textDecoration: 'none', fontSize: 13 }}>
                Forgot password?
              </Link>
            </div>
          </form>

          <div style={{ textAlign:'center', marginTop:20, fontSize:13, color:'#5a7a9a' }}>
            No account?{' '}
            <Link href="/onboarding" style={{ color:'#00f0ff', textDecoration:'none', fontWeight:600 }}>
              Start free trial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
