'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { signIn } from 'next-auth/react';
import { trackSignup } from '@/lib/analytics';

const PURPLE = '#6366f1';
const PURPLE_LIGHT = '#818cf8';
const BG = '#0d0d14';
const CARD = '#13131f';
const MUTED = '#6b7280';

const BRAND_BULLETS = ['Free 30-day trial', 'No credit card needed', '10 career domains'];

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState('');

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/auth/google-callback' });
    } catch (err) {
      toast.error('Google sign-up failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Enter your name'); return; }
    if (!form.email.trim()) { setError('Enter your email'); return; }
    if (!form.password || form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!d.success) { setError(d.message || 'Signup failed'); setLoading(false); return; }

      const { user, token } = d.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('genois_token', token);
        localStorage.setItem('genois_user', JSON.stringify(user));
        localStorage.setItem('genois_plan', user?.subscription_plan || 'spectator');
        document.cookie = `genois_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      }
      trackSignup('email');
      toast.success('Account created! Welcome to GENOIS 🎉');
      router.push('/welcome');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const inputStyle = (key) => ({
    width:'100%', padding:'12px 14px', borderRadius:10,
    border:`1px solid ${focused === key ? PURPLE : 'rgba(99,102,241,0.15)'}`,
    background: focused === key ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.03)',
    color:'#f8fafc', fontSize:14, fontFamily:'Outfit,sans-serif', outline:'none',
    boxSizing:'border-box', transition:'all 0.18s',
    boxShadow: focused === key ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
  });

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:BG, fontFamily:'Outfit,sans-serif' }}>

      {/* ─── LEFT BRAND PANEL (40%) ─── */}
      <div className="gen-desktop-only" style={{
        width:'40%', maxWidth:520, position:'relative', overflow:'hidden',
        display:'flex', flexDirection:'column', justifyContent:'center', padding:'56px 52px',
        background:'linear-gradient(160deg, #15152a 0%, #0d0d14 60%)',
        borderRight:'1px solid rgba(99,102,241,0.12)',
      }}>
        <div style={{ position:'absolute', top:-120, left:-100, width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.22), transparent 65%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:34, letterSpacing:0.5, marginBottom:28 }}>
            <span style={{ color:PURPLE }}>GEN</span><span style={{ color:'#f8fafc' }}>OIS</span>
          </div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:30, fontWeight:800, color:'#f8fafc', lineHeight:1.2, margin:'0 0 16px' }}>
            Your placement journey starts here
          </h2>
          <p style={{ color:'#9ca3af', fontSize:15, lineHeight:1.7, margin:'0 0 30px', maxWidth:360 }}>
            Join 500+ engineering students building real skills with a personalized 365-day roadmap.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:40 }}>
            {BRAND_BULLETS.map(b => (
              <div key={b} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, color:'#d1d5db' }}>
                <span style={{ width:20, height:20, borderRadius:'50%', background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.4)', color:PURPLE_LIGHT, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, flexShrink:0 }}>✓</span>
                {b}
              </div>
            ))}
          </div>
          <div style={{ padding:'16px 18px', borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(99,102,241,0.12)', maxWidth:360 }}>
            <p style={{ color:'#d1d5db', fontSize:13.5, lineHeight:1.6, margin:'0 0 8px', fontStyle:'italic' }}>
              “Got placed at Infosys after 3 months on GENOIS.”
            </p>
            <div style={{ fontSize:12, color:MUTED, fontFamily:'JetBrains Mono,monospace' }}>— Priya S. · VTU</div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT FORM PANEL (60%) ─── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>
        <div style={{ width:'100%', maxWidth:400 }}>

          <div className="gen-mobile-only" style={{ textAlign:'center', marginBottom:24 }}>
            <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:28 }}>
              <span style={{ color:PURPLE }}>GEN</span><span style={{ color:'#f8fafc' }}>OIS</span>
            </span>
          </div>

          <div style={{ background:CARD, border:'1px solid rgba(99,102,241,0.14)', borderRadius:18, padding:'32px 30px', boxShadow:'0 24px 60px rgba(0,0,0,0.45)' }}>
            <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:800, color:'#f8fafc', margin:'0 0 6px' }}>Create your account</h1>
            <p style={{ color:MUTED, fontSize:14, margin:'0 0 24px' }}>Start your 30-day free trial today.</p>

            {error && (
              <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'10px 14px', color:'#ef4444', fontSize:13, marginBottom:16 }}>{error}</div>
            )}

            <button onClick={handleGoogleSignup} disabled={googleLoading} type="button" style={{
              width:'100%', padding:'12px', borderRadius:10, border:'1px solid rgba(255,255,255,0.12)',
              background:'#fff', color:'#1f2937', fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:600,
              cursor:googleLoading ? 'wait' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              gap:10, marginBottom:20, transition:'all 0.2s', opacity:googleLoading ? 0.7 : 1,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Connecting…' : 'Sign up with Google'}
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize:11, color:MUTED, fontFamily:'JetBrains Mono,monospace' }}>OR</span>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }} />
            </div>

            <form onSubmit={submit}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, color:'#9ca3af', fontWeight:500, marginBottom:7 }}>Full name</label>
                <input type="text" required value={form.name}
                  onChange={e => setForm(f => ({...f, name:e.target.value}))}
                  onFocus={() => setFocused('name')} onBlur={() => setFocused('')}
                  placeholder="Abhishek Rajput" style={inputStyle('name')} />
              </div>
              <div style={{ marginBottom:14 }}>
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
                  placeholder="At least 8 characters" style={inputStyle('password')} />
              </div>
              <button type="submit" disabled={loading} style={{
                width:'100%', padding:'13px', borderRadius:10, border:'none',
                cursor:loading ? 'wait' : 'pointer',
                background: loading ? 'rgba(99,102,241,0.5)' : `linear-gradient(135deg, ${PURPLE}, #4f46e5)`,
                color:'#fff', fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700,
                boxShadow:'0 8px 24px rgba(99,102,241,0.32)', transition:'all 0.2s',
              }}>
                {loading ? 'Creating account…' : 'Create account →'}
              </button>
            </form>

            <p style={{ fontSize:11.5, color:MUTED, textAlign:'center', margin:'16px 0 0', lineHeight:1.5 }}>
              By signing up you agree to our{' '}
              <Link href="/terms" style={{ color:'#9ca3af', textDecoration:'underline' }}>Terms</Link> &{' '}
              <Link href="/privacy" style={{ color:'#9ca3af', textDecoration:'underline' }}>Privacy Policy</Link>.
            </p>
          </div>

          <div style={{ textAlign:'center', marginTop:20, fontSize:14, color:MUTED }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color:PURPLE_LIGHT, textDecoration:'none', fontWeight:600 }}>Sign in</Link>
          </div>

          <div style={{ textAlign:'center', marginTop:14 }}>
            <Link href="/onboarding" style={{ color:MUTED, textDecoration:'none', fontSize:12.5 }}>
              Want a personalized roadmap? Take the full setup →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
