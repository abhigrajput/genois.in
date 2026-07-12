'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];
const DOMAINS = ['Full Stack', 'AI/ML', 'Data Science', 'Cybersecurity', 'Cloud', 'Mobile', 'DevOps', 'Product', 'Multiple'];

export default function CompanySignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', website: '', size: '1-10', domainFocus: 'Full Stack', location: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function signup() {
    if (!form.name || !form.email || !form.password) { setError('Fill all required fields'); return; }
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/company/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(0,217,163,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(0,217,163,0.015) 1px,transparent 1px)', backgroundSize: '56px 56px' }} />
      <div style={{ width: '100%', maxWidth: 540, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
            <span style={{ color: '#00d9a3' }}>GEN</span><span style={{ color: '#e8e8ed' }}>OIS</span>
            <span style={{ color: '#5a7a9a', fontSize: 16, fontWeight: 400, marginLeft: 8 }}>for Companies</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: '#e8e8ed', marginBottom: 8 }}>
            Find pre-verified engineers
          </h1>
          <p style={{ color: '#5a7a9a', fontSize: 14 }}>
            Browse top students ranked by real skill. Not resumes. Free for first 3 months.
          </p>
        </div>

        <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.12)', borderRadius: 14, padding: 28 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00d9a3', letterSpacing: 2, marginBottom: 20 }}>COMPANY DETAILS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'COMPANY NAME *', key: 'name', placeholder: 'Acme Technologies', type: 'text' },
              { label: 'WORK EMAIL *', key: 'email', placeholder: 'hiring@acme.com', type: 'email' },
              { label: 'PASSWORD *', key: 'password', placeholder: 'Min 6 characters', type: 'password' },
              { label: 'WEBSITE', key: 'website', placeholder: 'https://acme.com', type: 'text' },
              { label: 'LOCATION', key: 'location', placeholder: 'Bangalore, India', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,217,163,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8e8ed', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}

            <div>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>COMPANY SIZE</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SIZES.map(s => (
                  <button key={s} onClick={() => setForm(p => ({ ...p, size: s }))} style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${form.size === s ? 'rgba(0,217,163,0.4)' : 'rgba(255,255,255,0.08)'}`, background: form.size === s ? 'rgba(0,217,163,0.08)' : 'transparent', color: form.size === s ? '#00d9a3' : '#5a7a9a', cursor: 'pointer', fontSize: 12 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>HIRING DOMAIN</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DOMAINS.map(d => (
                  <button key={d} onClick={() => setForm(p => ({ ...p, domainFocus: d }))} style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${form.domainFocus === d ? 'rgba(0,217,163,0.4)' : 'rgba(255,255,255,0.08)'}`, background: form.domainFocus === d ? 'rgba(0,217,163,0.08)' : 'transparent', color: form.domainFocus === d ? '#00d9a3' : '#5a7a9a', cursor: 'pointer', fontSize: 12 }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.2)', color: '#ff2d78', fontSize: 13, marginTop: 16 }}>
              {error}
            </div>
          )}

          <button onClick={signup} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: loading ? 'rgba(0,217,163,0.2)' : 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, marginTop: 20, boxShadow: '0 0 24px rgba(0,217,163,0.2)' }}>
            {loading ? 'Creating account...' : 'Create Company Account — Free →'}
          </button>

          <p style={{ textAlign: 'center', color: '#3a4a5a', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 10 }}>
            Free for 3 months · No credit card · Cancel anytime
          </p>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link href="/company/login" style={{ color: '#5a7a9a', textDecoration: 'none', fontSize: 13 }}>
              Already have an account? Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
