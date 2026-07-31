'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!email.trim()) { setError('Enter your email'); return; }
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (d.success) setSent(true);
      else setError(d.message || 'Something went wrong');
    } catch { setError('Something went wrong. Try again.'); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gx-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            <span style={{ color: 'var(--gx-accent)' }}>GEN</span><span style={{ color: 'var(--gx-text)' }}>OIS</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 8 }}>
            Forgot Password?
          </h1>
          <p style={{ color: 'var(--gx-text-muted)', fontSize: 14 }}>
            Enter your email and we will send you a reset link.
          </p>
        </div>

        {sent ? (
          <div style={{ background: 'var(--gx-success-soft)', border: '1px solid var(--gx-success-border)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--gx-success)', marginBottom: 8 }}>
              Check your email
            </div>
            <div style={{ color: 'var(--gx-text-muted)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              If <strong style={{ color: 'var(--gx-text)' }}>{email}</strong> is registered we have sent a reset link. Check your inbox and spam folder.
            </div>
            <Link href="/login" style={{ color: 'var(--gx-accent)', textDecoration: 'none', fontSize: 14, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
              ← Back to Login
            </Link>
          </div>
        ) : (
          <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 28 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>EMAIL ADDRESS</div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="your@email.com"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--gx-border)', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--gx-danger-soft)', border: '1px solid var(--gx-danger-border)', color: 'var(--gx-danger)', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button onClick={submit} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: loading ? 'var(--gx-accent-soft)' : 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
              {loading ? 'Sending...' : 'Send Reset Link →'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <Link href="/login" style={{ color: 'var(--gx-text-muted)', textDecoration: 'none', fontSize: 13 }}>
                ← Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
