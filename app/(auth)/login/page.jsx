'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import { authAPI } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

          {error && (
            <div style={{
              background:'rgba(255,45,120,0.1)',
              border:'1px solid rgba(255,45,120,0.3)',
              borderRadius:8, padding:'10px 14px',
              color:'#ff2d78', fontSize:13, marginBottom:16,
            }}>{error}</div>
          )}

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
