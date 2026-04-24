'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DOMAINS = [
  { id: 'fullstack', label: 'Full Stack', icon: '⬡', color: '#7F77DD', desc: 'HTML CSS React Node.js' },
  { id: 'dsa', label: 'DSA', icon: '◈', color: '#1D9E75', desc: 'Data Structures Algorithms' },
  { id: 'ml', label: 'Machine Learning', icon: '◉', color: '#D85A30', desc: 'Python NumPy Scikit-learn' },
  { id: 'ai', label: 'Artificial Intelligence', icon: '◎', color: '#BA7517', desc: 'LLMs Claude API Agents' },
  { id: 'ds', label: 'Data Science', icon: '◇', color: '#378ADD', desc: 'Pandas Visualization SQL' },
  { id: 'cybersec', label: 'Cybersecurity', icon: '◆', color: '#D4537E', desc: 'Networks Pentesting Tools' },
  { id: 'cloud', label: 'Cloud Computing', icon: '○', color: '#639922', desc: 'AWS Azure DevOps' },
  { id: 'mobile', label: 'Mobile Dev', icon: '▣', color: '#E24B4A', desc: 'React Native Expo Flutter' },
  { id: 'devops', label: 'DevOps', icon: '▷', color: '#888780', desc: 'Docker Kubernetes CI/CD' },
  { id: 'sysdesign', label: 'System Design', icon: '▦', color: '#534AB7', desc: 'Architecture Scalability' },
];

const STEPS = ['welcome', 'domain', 'details', 'account'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', college: '', year: '2' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function signup() {
    if (!form.name.trim()) { setError('Enter your name'); return; }
    if (!form.email.trim()) { setError('Enter your email'); return; }
    if (!form.password || form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!form.college.trim()) { setError('Enter your college name'); return; }
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, domainSlug: selectedDomain }),
      });
      const d = await r.json();
      if (!d.success) { setError(d.message || 'Signup failed'); setLoading(false); return; }
      localStorage.setItem('genois_token', d.data.token);
      localStorage.setItem('genois_user', JSON.stringify(d.data.user));
      router.push('/welcome');
    } catch { setError('Something went wrong. Try again.'); }
    setLoading(false);
  }

  const progress = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#020812', color: '#e8f4ff', fontFamily: 'Outfit,sans-serif' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(0,240,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.015) 1px,transparent 1px)', backgroundSize: '56px 56px' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto', padding: '40px 20px' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 20 }}>
            <span style={{ color: '#00f0ff' }}>GEN</span><span style={{ color: '#e8f4ff' }}>OIS</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: progress + '%', background: 'linear-gradient(90deg,#00f0ff,#7b5cff)', borderRadius: 2, transition: 'width 0.4s' }} />
          </div>
          <div style={{ fontSize: 11, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace' }}>
            Step {step + 1} of {STEPS.length}
          </div>
        </div>

        {/* STEP 0 — WELCOME */}
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎯</div>
            <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: '#e8f4ff', marginBottom: 12, lineHeight: 1.2 }}>
              Ready to prove your skill?
            </h1>
            <p style={{ color: '#5a7a9a', fontSize: 16, lineHeight: 1.8, marginBottom: 12 }}>
              Every engineering student has a resume.
            </p>
            <p style={{ color: '#ff2d78', fontSize: 16, fontWeight: 600, lineHeight: 1.8, marginBottom: 12 }}>
              90% of them are fake.
            </p>
            <p style={{ color: '#5a7a9a', fontSize: 16, lineHeight: 1.8, marginBottom: 32 }}>
              GENOIS ranks you on real daily performance. Daily coding, timed tests, actual projects. No shortcuts.
            </p>
            <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 20, marginBottom: 28, textAlign: 'left' }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 14 }}>WHAT YOU GET</div>
              {[
                { icon: '📅', text: '30-day AI-powered daily roadmap' },
                { icon: '🎯', text: 'Daily tests, coding challenges, AI notes' },
                { icon: '🏆', text: 'Real rank among engineers across India' },
                { icon: '💼', text: 'Public profile recruiters actually trust' },
                { icon: '🆓', text: '30 days completely free — no credit card' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
                  <span style={{ fontSize: 14, color: '#c8d8e8' }}>{f.text}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)} style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 17, fontWeight: 800, boxShadow: '0 0 30px rgba(0,240,255,0.3)' }}>
              Start Free — No Card Needed →
            </button>
            <p style={{ marginTop: 12, color: '#3a4a5a', fontSize: 12, fontFamily: 'JetBrains Mono,monospace' }}>
              Already have an account? <a href="/login" style={{ color: '#00f0ff', textDecoration: 'none' }}>Login →</a>
            </p>
          </div>
        )}

        {/* STEP 1 — DOMAIN */}
        {step === 1 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 8 }}>
                Pick your battlefield
              </h2>
              <p style={{ color: '#5a7a9a', fontSize: 14 }}>
                Choose one domain. Master it in 30 days. Switch anytime.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 24 }}>
              {DOMAINS.map(d => (
                <div key={d.id} onClick={() => setSelectedDomain(d.id)} style={{
                  padding: '16px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  background: selectedDomain === d.id ? `${d.color}15` : '#070f1f',
                  border: `2px solid ${selectedDomain === d.id ? d.color : 'rgba(255,255,255,0.06)'}`,
                  transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{d.icon}</div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700, color: selectedDomain === d.id ? d.color : '#e8f4ff', marginBottom: 4 }}>{d.label}</div>
                  <div style={{ fontSize: 10, color: '#5a7a9a', lineHeight: 1.4 }}>{d.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(0)} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 14 }}>← Back</button>
              <button onClick={() => { if (!selectedDomain) { setError('Pick a domain'); return; } setError(''); setStep(2); }} style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: selectedDomain ? 'linear-gradient(135deg,#00f0ff,#7b5cff)' : 'rgba(255,255,255,0.05)', color: selectedDomain ? '#020812' : '#3a4a5a', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
                Continue →
              </button>
            </div>
            {error && <div style={{ color: '#ff2d78', fontSize: 13, textAlign: 'center', marginTop: 10 }}>{error}</div>}
          </div>
        )}

        {/* STEP 2 — DETAILS */}
        {step === 2 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 8 }}>
                Tell us about yourself
              </h2>
              <p style={{ color: '#5a7a9a', fontSize: 14 }}>
                This helps us personalize your roadmap and show your college rank.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'YOUR NAME', key: 'name', placeholder: 'Rahul Sharma', type: 'text' },
                { label: 'COLLEGE NAME', key: 'college', placeholder: 'LNCT Bhopal', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8f4ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', letterSpacing: 1, marginBottom: 6 }}>CURRENT YEAR</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['1', '2', '3', '4'].map(y => (
                    <button key={y} onClick={() => setForm(p => ({ ...p, year: y }))} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${form.year === y ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.08)'}`, background: form.year === y ? 'rgba(0,240,255,0.08)' : 'transparent', color: form.year === y ? '#00f0ff' : '#5a7a9a', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 600 }}>
                      Year {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 14 }}>← Back</button>
              <button onClick={() => { if (!form.name.trim() || !form.college.trim()) { setError('Fill all fields'); return; } setError(''); setStep(3); }} style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
                Continue →
              </button>
            </div>
            {error && <div style={{ color: '#ff2d78', fontSize: 13, textAlign: 'center', marginTop: 10 }}>{error}</div>}
          </div>
        )}

        {/* STEP 3 — ACCOUNT */}
        {step === 3 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 8 }}>
                Create your account
              </h2>
              <p style={{ color: '#5a7a9a', fontSize: 14 }}>
                Last step. Set your email and password.
              </p>
            </div>

            <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4ff' }}>{form.name} · {form.college}</div>
                <div style={{ fontSize: 12, color: '#5a7a9a' }}>Domain: {DOMAINS.find(d => d.id === selectedDomain)?.label} · Year {form.year}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'EMAIL ADDRESS', key: 'email', placeholder: 'your@email.com', type: 'email' },
                { label: 'PASSWORD', key: 'password', placeholder: 'Min 6 characters', type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} onKeyDown={e => e.key === 'Enter' && signup()} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8f4ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.2)', color: '#ff2d78', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 14 }}>← Back</button>
              <button onClick={signup} disabled={loading} style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: loading ? 'rgba(0,240,255,0.2)' : 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, boxShadow: '0 0 20px rgba(0,240,255,0.2)' }}>
                {loading ? 'Creating account...' : 'Start Free — 30 Days →'}
              </button>
            </div>
            <p style={{ textAlign: 'center', color: '#3a4a5a', fontSize: 11, fontFamily: 'JetBrains Mono,monospace', marginTop: 10 }}>
              No credit card · Cancel anytime · Free for 30 days
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
