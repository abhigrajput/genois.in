'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const G = 'var(--gx-accent)';

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
    <div style={{ minHeight: '100vh', background: 'var(--gx-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 900, letterSpacing: 2, color: G, marginBottom: 4 }}>
            GENOIS
          </div>
          <div style={{ color: 'var(--gx-success)', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
            Placement Cell Portal
          </div>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 16, padding: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 6, textAlign: 'center' }}>
            HOD / Placement Director Access
          </h1>
          <p style={{ color: 'var(--gx-success)', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
            Enter your institution access PIN to view student analytics
          </p>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--gx-success)', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' }}>
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
                border: `1px solid ${error ? 'var(--gx-danger-border)' : 'var(--gx-accent-border)'}`,
                background: 'var(--gx-accent-soft)', color: 'var(--gx-text)',
                fontSize: 16, outline: 'none', boxSizing: 'border-box',
                fontFamily: 'var(--font-body)', letterSpacing: 4,
              }}
            />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--gx-danger-soft)', border: '1px solid var(--gx-danger-border)', color: 'var(--gx-danger)', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: 14, borderRadius: 12, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'var(--gx-accent-soft)' : 'var(--gx-accent)',
              color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 800,
            }}
          >
            {loading ? 'Verifying...' : 'Access Dashboard →'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, color: 'var(--gx-success)', fontSize: 12 }}>
          Students? <a href="/" style={{ color: 'var(--gx-success)', textDecoration: 'none' }}>Go to GENOIS →</a>
        </div>
      </div>
    </div>
  );
}
