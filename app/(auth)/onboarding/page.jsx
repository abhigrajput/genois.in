'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trackSignup } from '@/lib/analytics';

const DOMAINS = [
  { id: 'fullstack', label: 'Full Stack', icon: '⬡', color: '#7F77DD', desc: 'HTML CSS React Node.js' },
  { id: 'dsa', label: 'DSA', icon: '◈', color: '#1D9E75', desc: 'Data Structures Algorithms' },
  { id: 'aiml', label: 'AI / ML', icon: '◉', color: '#D85A30', desc: 'LLMs Python Scikit-learn' },
  { id: 'datascience', label: 'Data Science', icon: '◇', color: '#378ADD', desc: 'Pandas Visualization SQL' },
  { id: 'cybersecurity', label: 'Cybersecurity', icon: '◆', color: '#D4537E', desc: 'Networks Pentesting Tools' },
  { id: 'devops', label: 'DevOps', icon: '○', color: '#639922', desc: 'Docker Kubernetes CI/CD' },
  { id: 'android', label: 'Mobile Dev', icon: '▣', color: '#E24B4A', desc: 'React Native Expo Flutter' },
  { id: 'systemdesign', label: 'System Design', icon: '▦', color: '#534AB7', desc: 'Architecture Scalability' },
  { id: 'blockchain', label: 'Blockchain', icon: '◎', color: '#BA7517', desc: 'Web3 Solidity Smart Contracts' },
  { id: 'gamedev', label: 'Game Dev', icon: '▷', color: '#888780', desc: 'Unity C# Game Design' },
];

const COMPANIES = [
  { id: 'TCS', label: 'TCS' },
  { id: 'Infosys', label: 'Infosys' },
  { id: 'Wipro', label: 'Wipro' },
  { id: 'Accenture', label: 'Accenture' },
  { id: 'Cognizant', label: 'Cognizant' },
  { id: 'HCL', label: 'HCL' },
  { id: 'Amazon', label: 'Amazon' },
  { id: 'Flipkart', label: 'Flipkart' },
  { id: 'Startups', label: 'Startups' },
  { id: 'Other MNCs', label: 'Other MNCs' },
  { id: 'Not sure yet', label: 'Not sure yet' },
];

const MONTH_OPTIONS = [
  { label: '1-3 months', value: 2 },
  { label: '4-6 months', value: 5 },
  { label: '7-9 months', value: 8 },
  { label: '10-12 months', value: 11 },
  { label: '12+ months', value: 18 },
];

const WEAK_SUBJECTS = [
  'Arrays & Strings', 'Linked Lists', 'Trees & Graphs',
  'Dynamic Programming', 'Recursion', 'OS & DBMS',
  'Computer Networks', 'System Design', 'Math & Aptitude',
  'OOP Concepts', 'SQL Queries', "I'm strong everywhere",
];

const STEPS = ['welcome', 'domain', 'details', 'placement', 'assessment', 'account'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', college: '', year: '2' });
  const [targetCompanies, setTargetCompanies] = useState([]);
  const [monthsToPlacement, setMonthsToPlacement] = useState(8);
  const [weakSubjects, setWeakSubjects] = useState([]);
  const [cgpa, setCgpa] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      localStorage.setItem('genois_ref', ref);
    } else {
      const stored = localStorage.getItem('genois_ref');
      if (stored) setReferralCode(stored);
    }
  }, []);

  function toggleCompany(id) {
    if (id === 'Not sure yet') { setTargetCompanies(['Not sure yet']); return; }
    setTargetCompanies(prev => {
      const without = prev.filter(c => c !== 'Not sure yet');
      return without.includes(id) ? without.filter(c => c !== id) : [...without, id];
    });
  }

  function toggleWeakSubject(s) {
    if (s === "I'm strong everywhere") { setWeakSubjects([]); return; }
    setWeakSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

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
        body: JSON.stringify({ ...form, domainSlug: selectedDomain, referralCode }),
      });
      const d = await r.json();
      if (!d.success) { setError(d.message || 'Signup failed'); setLoading(false); return; }

      const token = d.data.token;
      localStorage.setItem('genois_token', token);
      localStorage.setItem('genois_user', JSON.stringify(d.data.user));
      trackSignup('email');

      // Save placement profile data (non-fatal if it fails)
      try {
        const profilePayload = {
          target_companies: targetCompanies.filter(c => c !== 'Not sure yet'),
          months_to_placement: monthsToPlacement,
          weak_subjects: weakSubjects,
        };
        if (cgpa && !isNaN(parseFloat(cgpa))) profilePayload.cgpa = parseFloat(cgpa);

        const pr = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify(profilePayload),
        });
        const pd = await pr.json();
        if (pd.success && pd.data?.user) {
          localStorage.setItem('genois_user', JSON.stringify(pd.data.user));
        }
      } catch { /* non-fatal */ }

      router.push('/welcome');
    } catch { setError('Something went wrong. Try again.'); }
    setLoading(false);
  }

  const progress = (step / (STEPS.length - 1)) * 100;

  const chipStyle = (selected) => ({
    padding: '10px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
    background: selected ? 'rgba(0,255,136,0.1)' : '#070f1f',
    border: `2px solid ${selected ? '#00ff88' : 'rgba(255,255,255,0.06)'}`,
    color: selected ? '#00ff88' : '#c8d8e8',
    fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600,
    transition: 'all 0.15s',
  });

  const backBtn = { flex: 1, padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 14 };
  const nextBtn = (active) => ({ flex: 2, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: active ? 'linear-gradient(135deg,#00f0ff,#ff6b4a)' : 'rgba(255,255,255,0.05)', color: active ? '#020812' : '#3a4a5a', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700 });

  return (
    <div style={{ minHeight: '100vh', background: '#020812', color: '#e8e8ed', fontFamily: 'var(--font-body)' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(0,240,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.015) 1px,transparent 1px)', backgroundSize: '56px 56px' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto', padding: '40px 20px' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, marginBottom: 20 }}>
            <span style={{ color: '#00f0ff' }}>GEN</span><span style={{ color: '#e8e8ed' }}>OIS</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: progress + '%', background: 'linear-gradient(90deg,#00f0ff,#ff6b4a)', borderRadius: 2, transition: 'width 0.4s' }} />
          </div>
          <div style={{ fontSize: 11, color: '#3a4a5a', fontFamily: 'var(--font-mono)' }}>
            Step {step + 1} of {STEPS.length}
          </div>
        </div>

        {/* STEP 0 — WELCOME */}
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎯</div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: '#e8e8ed', marginBottom: 12, lineHeight: 1.2 }}>
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
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 14 }}>WHAT YOU GET</div>
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
            <button onClick={() => setStep(1)} style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 800, boxShadow: '0 0 30px rgba(0,240,255,0.3)' }}>
              Start Free — No Card Needed →
            </button>
            <p style={{ marginTop: 12, color: '#3a4a5a', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              Already have an account? <a href="/login" style={{ color: '#00f0ff', textDecoration: 'none' }}>Login →</a>
            </p>
          </div>
        )}

        {/* STEP 1 — DOMAIN */}
        {step === 1 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 8 }}>
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
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700, color: selectedDomain === d.id ? d.color : '#e8e8ed', marginBottom: 4 }}>{d.label}</div>
                  <div style={{ fontSize: 10, color: '#5a7a9a', lineHeight: 1.4 }}>{d.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(0)} style={backBtn}>← Back</button>
              <button onClick={() => { if (!selectedDomain) { setError('Pick a domain'); return; } setError(''); setStep(2); }} style={nextBtn(!!selectedDomain)}>
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
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 8 }}>
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
                  <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8e8ed', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>CURRENT YEAR</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['1', '2', '3', '4'].map(y => (
                    <button key={y} onClick={() => setForm(p => ({ ...p, year: y }))} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${form.year === y ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.08)'}`, background: form.year === y ? 'rgba(0,240,255,0.08)' : 'transparent', color: form.year === y ? '#00f0ff' : '#5a7a9a', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                      Year {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={backBtn}>← Back</button>
              <button onClick={() => { if (!form.name.trim() || !form.college.trim()) { setError('Fill all fields'); return; } setError(''); setStep(3); }} style={nextBtn(true)}>
                Continue →
              </button>
            </div>
            {error && <div style={{ color: '#ff2d78', fontSize: 13, textAlign: 'center', marginTop: 10 }}>{error}</div>}
          </div>
        )}

        {/* STEP 3 — PLACEMENT TARGET */}
        {step === 3 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 8 }}>
                Where do you want to get placed?
              </h2>
              <p style={{ color: '#5a7a9a', fontSize: 14 }}>
                We&apos;ll customize your entire roadmap for these companies
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 10 }}>TARGET COMPANIES (select all that apply)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {COMPANIES.map(c => (
                  <div key={c.id} onClick={() => toggleCompany(c.id)} style={chipStyle(targetCompanies.includes(c.id))}>
                    {c.label}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 10 }}>HOW MANY MONTHS UNTIL PLACEMENT SEASON?</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {MONTH_OPTIONS.map(m => (
                  <button key={m.value} onClick={() => setMonthsToPlacement(m.value)} style={{
                    padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${monthsToPlacement === m.value ? '#00ff88' : 'rgba(255,255,255,0.08)'}`,
                    background: monthsToPlacement === m.value ? 'rgba(0,255,136,0.1)' : 'transparent',
                    color: monthsToPlacement === m.value ? '#00ff88' : '#5a7a9a',
                    fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600,
                  }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} style={backBtn}>← Back</button>
              <button onClick={() => { setError(''); setStep(4); }} style={nextBtn(true)}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — HONEST ASSESSMENT */}
        {step === 4 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 8 }}>
                Where are you weak? Be honest.
              </h2>
              <p style={{ color: '#5a7a9a', fontSize: 14 }}>
                This is private. It helps us fix the gaps before interviews.
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 10 }}>WEAK AREAS (select all that apply)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {WEAK_SUBJECTS.map(s => (
                  <div key={s} onClick={() => toggleWeakSubject(s)} style={chipStyle(weakSubjects.includes(s) || (s === "I'm strong everywhere" && weakSubjects.length === 0))}>
                    {s}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>YOUR APPROXIMATE CGPA</div>
              <input
                type="number" min="0" max="10" step="0.1"
                value={cgpa}
                onChange={e => setCgpa(e.target.value)}
                placeholder="e.g. 7.2"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8e8ed', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: 11, color: '#3a4a5a', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                Helps show companies you&apos;re eligible for. Not shared publicly.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(3)} style={backBtn}>← Back</button>
              <button onClick={() => { setError(''); setStep(5); }} style={nextBtn(true)}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 5 — ACCOUNT */}
        {step === 5 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 8 }}>
                Create your account
              </h2>
              <p style={{ color: '#5a7a9a', fontSize: 14 }}>
                Last step. Set your email and password.
              </p>
            </div>

            <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8ed' }}>{form.name} · {form.college}</div>
                <div style={{ fontSize: 12, color: '#5a7a9a' }}>Domain: {DOMAINS.find(d => d.id === selectedDomain)?.label} · Year {form.year}</div>
                {targetCompanies.length > 0 && (
                  <div style={{ fontSize: 11, color: '#00ff88', marginTop: 2 }}>
                    Target: {targetCompanies.slice(0, 3).join(', ')}{targetCompanies.length > 3 ? ` +${targetCompanies.length - 3}` : ''}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'EMAIL ADDRESS', key: 'email', placeholder: 'your@email.com', type: 'email' },
                { label: 'PASSWORD', key: 'password', placeholder: 'Min 6 characters', type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} onKeyDown={e => e.key === 'Enter' && signup()} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8e8ed', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.2)', color: '#ff2d78', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(4)} style={backBtn}>← Back</button>
              <button onClick={signup} disabled={loading} style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: loading ? 'rgba(0,240,255,0.2)' : 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, boxShadow: '0 0 20px rgba(0,240,255,0.2)' }}>
                {loading ? 'Creating account...' : 'Start Free — 30 Days →'}
              </button>
            </div>
            <p style={{ textAlign: 'center', color: '#3a4a5a', fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 10 }}>
              No credit card · Cancel anytime · Free for 30 days
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
