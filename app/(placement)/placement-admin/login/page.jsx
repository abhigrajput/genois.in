'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const G = '#00ff41';

export default function PlacementLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!pin.trim()) { setError('Enter the access PIN'); return; }
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/placement-admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const d = await r.json();
      if (!d.success) { setError(d.message || 'Invalid PIN'); setLoading(false); return; }
      localStorage.setItem('placement_admin_token', d.token);
      router.push('/placement-admin');
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030a03', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 900, letterSpacing: 2, color: G, marginBottom: 4 }}>
            GENOIS
          </div>
          <div style={{ color: '#4ade80', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
            Placement Cell Portal
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#0a1a0a', border: '1px solid rgba(0,255,65,0.18)', borderRadius: 16, padding: 32 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#e2ffe2', marginBottom: 6, textAlign: 'center' }}>
            HOD / Placement Director Access
          </h1>
          <p style={{ color: '#4b8a4b', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
            Enter your institution access PIN to view student analytics
          </p>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#4ade80', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' }}>
              Access PIN
            </div>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Enter your PIN"
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 10,
                border: `1px solid ${error ? 'rgba(255,80,80,0.4)' : 'rgba(0,255,65,0.2)'}`,
                background: 'rgba(0,255,65,0.04)', color: '#e2ffe2',
                fontSize: 16, outline: 'none', boxSizing: 'border-box',
                fontFamily: 'JetBrains Mono, monospace', letterSpacing: 4,
              }}
            />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff8080', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: 14, borderRadius: 12, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'rgba(0,255,65,0.15)' : 'linear-gradient(135deg, #00ff41, #00cc33)',
              color: '#030a03', fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 800,
            }}
          >
            {loading ? 'Verifying...' : 'Access Dashboard →'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, color: '#2d5c2d', fontSize: 12 }}>
          Students? <a href="/" style={{ color: '#4ade80', textDecoration: 'none' }}>Go to GENOIS →</a>
        </div>
      </div>
    </div>
  );
}
