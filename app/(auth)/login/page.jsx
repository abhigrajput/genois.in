'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [focused, setFocused] = useState('');

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

      if (typeof window !== 'undefined') {
        localStorage.setItem('genois_token', token);
        localStorage.setItem('genois_plan', user?.plan || 'spectator');
        document.cookie = `genois_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      }

      setAuth(user, token, progress, score, skill);
      trackLogin('email');
      toast.success('Welcome back, ' + user.name.split(' ')[0] + '!');

      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/dashboard';
      window.location.href = redirect;
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (key) => ({
    width:'100%', padding:'12px 14px', borderRadius:10,
    border:`1px solid ${focused === key ? PURPLE : 'rgba(0,217,163,0.15)'}`,
    background: focused === key ? 'rgba(0,217,163,0.06)' : 'rgba(255,255,255,0.03)',
    color:'#f8fafc', fontSize:14, fontFamily:'var(--font-body)', outline:'none',
    boxSizing:'border-box', transition:'all 0.18s',
    boxShadow: focused === key ? '0 0 0 3px rgba(0,217,163,0.12)' : 'none',
  });

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:BG, fontFamily:'var(--font-body)' }}>

      {/* ─── LEFT BRAND PANEL (40%) ─── */}
      <div className="gen-desktop-only" style={{
        width:'40%', maxWidth:520, position:'relative', overflow:'hidden',
        display:'flex', flexDirection:'column', justifyContent:'center', padding:'56px 52px',
        background:'linear-gradient(160deg, #15152a 0%, #0a0a0f 60%)',
        borderRight:'1px solid rgba(0,217,163,0.12)',
      }}>
        <div style={{ position:'absolute', top:-120, left:-100, width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,217,163,0.22), transparent 65%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontFamily:'var(--font-heading)', fontWeight:800, fontSize:34, letterSpacing:0.5, marginBottom:28 }}>
            <span style={{ color:PURPLE }}>GEN</span><span style={{ color:'#f8fafc' }}>OIS</span>
          </div>
          <h2 style={{ fontFamily:'var(--font-heading)', fontSize:30, fontWeight:800, color:'#f8fafc', lineHeight:1.2, margin:'0 0 16px' }}>
            Your placement journey starts here
          </h2>
          <p style={{ color:'#9ca3af', fontSize:15, lineHeight:1.7, margin:'0 0 30px', maxWidth:360 }}>
            A 365-day AI roadmap personalized for your college, your target company, your timeline.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:40 }}>
            {BRAND_BULLETS.map(b => (
              <div key={b} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, color:'#d1d5db' }}>
                <span style={{ width:20, height:20, borderRadius:'50%', background:'rgba(0,217,163,0.15)', border:'1px solid rgba(0,217,163,0.4)', color:PURPLE_LIGHT, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Check size={12} strokeWidth={2.5} color={PURPLE_LIGHT} /></span>
                {b}
              </div>
            ))}
          </div>
          <div style={{ padding:'16px 18px', borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(0,217,163,0.12)', maxWidth:360 }}>
            <p style={{ color:'#d1d5db', fontSize:13.5, lineHeight:1.6, margin:'0 0 8px', fontStyle:'italic' }}>
              “Got placed at Infosys after 3 months on GENOIS.”
            </p>
            <div style={{ fontSize:12, color:MUTED, fontFamily:'var(--font-mono)' }}>— Priya S. · VTU</div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT FORM PANEL (60%) ─── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>
        <div style={{ width:'100%', maxWidth:400 }}>

          {/* Mobile logo */}
          <div className="gen-mobile-only" style={{ textAlign:'center', marginBottom:24, display:'none' }}>
            <span style={{ fontFamily:'var(--font-heading)', fontWeight:800, fontSize:28 }}>
              <span style={{ color:PURPLE }}>GEN</span><span style={{ color:'#f8fafc' }}>OIS</span>
            </span>
          </div>

          <div style={{ background:CARD, border:'1px solid rgba(0,217,163,0.14)', borderRadius:18, padding:'32px 30px', boxShadow:'0 24px 60px rgba(0,0,0,0.45)' }}>
            <h1 style={{ fontFamily:'var(--font-heading)', fontSize:24, fontWeight:800, color:'#f8fafc', margin:'0 0 6px' }}>Welcome back</h1>
            <p style={{ color:MUTED, fontSize:14, margin:'0 0 24px' }}>Sign in to continue your journey.</p>

            {verified && (
              <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:10, padding:'10px 14px', color:'#10b981', fontSize:13, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <Check size={16} strokeWidth={2.5} color="#10b981" style={{ flexShrink:0 }} />
                <span>Email verified! Please sign in.</span>
              </div>
            )}

            {error && (
              <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'10px 14px', color:'#ef4444', fontSize:13, marginBottom:16 }}>{error}</div>
            )}

            {/* Google OAuth */}
            <button onClick={handleGoogleLogin} disabled={googleLoading} type="button" style={{
              width:'100%', padding:'12px', borderRadius:10, border:'1px solid rgba(255,255,255,0.12)',
              background:'#fff', color:'#1f2937', fontFamily:'var(--font-heading)', fontSize:14, fontWeight:600,
              cursor:googleLoading ? 'wait' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              gap:10, marginBottom:20, transition:'all 0.2s', opacity:googleLoading ? 0.7 : 1,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Connecting…' : 'Continue with Google'}
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize:11, color:MUTED, fontFamily:'var(--font-mono)' }}>OR</span>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }} />
            </div>

            <form onSubmit={submit}>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:12, color:'#9ca3af', fontWeight:500, marginBottom:7 }}>Email</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm(f => ({...f, email:e.target.value}))}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                  placeholder="your@email.com" style={inputStyle('email')} />
              </div>
              <div style={{ marginBottom:22 }}>
                <label style={{ display:'block', fontSize:12, color:'#9ca3af', fontWeight:500, marginBottom:7 }}>Password</label>
                <input type="password" required value={form.password}
                  onChange={e => setForm(f => ({...f, password:e.target.value}))}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                  placeholder="Your password" style={inputStyle('password')} />
              </div>
              <button type="submit" disabled={loading} className="gen-press" style={{
                width:'100%', padding:'13px', borderRadius:10, border:'none',
                cursor:loading ? 'wait' : 'pointer',
                background: loading ? 'rgba(0,217,163,0.5)' : `linear-gradient(135deg, ${PURPLE}, ${'#00b389'})`,
                color:'#0a0a0f', fontFamily:'var(--font-heading)', fontSize:15, fontWeight:700,
                boxShadow:'0 8px 24px rgba(0,217,163,0.32)', transition:'all 0.2s',
              }}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
              <div style={{ textAlign:'center', marginTop:14 }}>
                <Link href="/forgot-password" style={{ color:MUTED, textDecoration:'none', fontSize:13 }}>Forgot password?</Link>
              </div>
            </form>
          </div>

          <div style={{ textAlign:'center', marginTop:20, fontSize:14, color:MUTED }}>
            New to GENOIS?{' '}
            <Link href="/signup" style={{ color:PURPLE_LIGHT, textDecoration:'none', fontWeight:600 }}>Create your account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
