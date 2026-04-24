'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) { setError('Invalid reset link. Request a new one.'); return; }
    setToken(t);
  }, []);

  async function submit() {
    if (!password) { setError('Enter a new password'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const d = await r.json();
      if (d.success) {
        setDone(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(d.message || 'Something went wrong');
      }
    } catch { setError('Something went wrong. Try again.'); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020812', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Outfit,sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            <span style={{ color: '#00f0ff' }}>GEN</span><span style={{ color: '#e8f4ff' }}>OIS</span>
          </div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: '#e8f4ff', marginBottom: 8 }}>
            Set New Password
          </h1>
        </div>

        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.12)', borderRadius: 14, padding: 28 }}>
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#1D9E75', marginBottom: 8 }}>Password Reset!</div>
              <div style={{ color: '#5a7a9a', fontSize: 14 }}>Redirecting to login in 3 seconds...</div>
            </div>
          ) : (
            <>
              {[
                { label: 'NEW PASSWORD', value: password, set: setPassword, placeholder: 'Min 6 characters' },
                { label: 'CONFIRM PASSWORD', value: confirm, set: setConfirm, placeholder: 'Repeat your password' },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', marginBottom: 6 }}>{f.label}</div>
                  <input type="password" value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8f4ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.2)', color: '#ff2d78', fontSize: 13, marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <button onClick={submit} disabled={loading || !token} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: loading ? 'rgba(0,240,255,0.2)' : 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
                {loading ? 'Resetting...' : 'Reset Password →'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Link href="/login" style={{ color: '#5a7a9a', textDecoration: 'none', fontSize: 13 }}>← Back to Login</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
