'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CompanyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function login() {
    if (!email || !password) { setError('Enter email and password'); return; }
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/company/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!d.success) { setError(d.message); setLoading(false); return; }
      localStorage.setItem('genois_company_token', d.data.token);
      localStorage.setItem('genois_company', JSON.stringify(d.data.company));
      router.push('/company/dashboard');
    } catch { setError('Something went wrong'); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020812', color: '#e8e8ed', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
            <span style={{ color: '#00f0ff' }}>GEN</span><span style={{ color: '#e8e8ed' }}>OIS</span>
            <span style={{ color: '#5a7a9a', fontSize: 16, fontWeight: 400, marginLeft: 8 }}>for Companies</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: '#e8e8ed', marginBottom: 8 }}>Company Login</h1>
        </div>

        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.12)', borderRadius: 14, padding: 28 }}>
          {[
            { label: 'WORK EMAIL', value: email, set: setEmail, type: 'email', placeholder: 'hiring@company.com' },
            { label: 'PASSWORD', value: password, set: setPassword, type: 'password', placeholder: 'Your password' },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
              <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} onKeyDown={e => e.key === 'Enter' && login()} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8e8ed', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}

          {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.2)', color: '#ff2d78', fontSize: 13, marginBottom: 14 }}>{error}</div>}

          <button onClick={login} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: loading ? 'rgba(0,240,255,0.2)' : 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            {loading ? 'Logging in...' : 'Login →'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <Link href="/company/signup" style={{ color: '#5a7a9a', textDecoration: 'none', fontSize: 13 }}>
              No account? Sign up free →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
