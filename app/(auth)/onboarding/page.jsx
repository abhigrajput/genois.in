'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { trackSignup } from '@/lib/analytics';
import useAuthStore from '@/store/authStore';

const DOMAINS = [
  { id: 'fullstack', label: 'Full Stack', icon: '⬡', color: 'var(--gx-accent)', desc: 'HTML CSS React Node.js' },
  { id: 'dsa', label: 'DSA', icon: '◈', color: 'var(--gx-success)', desc: 'Data Structures Algorithms' },
  { id: 'aiml', label: 'AI / ML', icon: '◉', color: 'var(--gx-success)', desc: 'LLMs Python Scikit-learn' },
  { id: 'datascience', label: 'Data Science', icon: '◇', color: 'var(--gx-accent)', desc: 'Pandas Visualization SQL' },
  { id: 'cybersecurity', label: 'Cybersecurity', icon: '◆', color: 'var(--gx-success)', desc: 'Networks Pentesting Tools' },
  { id: 'devops', label: 'DevOps', icon: '○', color: 'var(--gx-accent)', desc: 'Docker Kubernetes CI/CD' },
  { id: 'android', label: 'Mobile Dev', icon: '▣', color: 'var(--gx-accent)', desc: 'React Native Expo Flutter' },
  { id: 'systemdesign', label: 'System Design', icon: '▦', color: 'var(--gx-success)', desc: 'Architecture Scalability' },
  { id: 'blockchain', label: 'Blockchain', icon: '◎', color: 'var(--gx-accent)', desc: 'Web3 Solidity Smart Contracts' },
  { id: 'gamedev', label: 'Game Dev', icon: '▷', color: 'var(--gx-success)', desc: 'Unity C# Game Design' },
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
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', college: '', year: '2' });
  const [targetCompanies, setTargetCompanies] = useState([]);
  const [monthsToPlacement, setMonthsToPlacement] = useState(8);
  const [weakSubjects, setWeakSubjects] = useState([]);
  const [cgpa, setCgpa] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // "Authed mode": the user is already signed in (Google OAuth, or an email
  // account with an incomplete profile). We skip the account-creation steps and
  // just collect the missing placement details, then save via the profile API.
  const [authedMode, setAuthedMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('genois_token');
    if (params.get('from') === 'google' || hasToken) {
      setAuthedMode(true);
      setStep(1); // skip the marketing welcome — go straight to picking a domain
    }
  }, []);

  // Pre-fill from the signed-in user (Google gives us name/email; returning
  // email users may already have college/domain/placement data).
  useEffect(() => {
    if (!user) return;
    setForm(prev => ({
      ...prev,
      name: prev.name || user.name || '',
      email: prev.email || user.email || '',
      college: prev.college || user.college || '',
      year: user.year || prev.year,
    }));
    if (user.domain_slug) setSelectedDomain(d => d || user.domain_slug);
    if (Array.isArray(user.target_companies) && user.target_companies.length) {
      setTargetCompanies(c => (c.length ? c : user.target_companies));
    }
    if (user.months_to_placement) setMonthsToPlacement(m => (m !== 8 ? m : user.months_to_placement));
    if (Array.isArray(user.weak_subjects) && user.weak_subjects.length) {
      setWeakSubjects(w => (w.length ? w : user.weak_subjects));
    }
    if (user.cgpa != null) setCgpa(c => (c !== '' ? c : String(user.cgpa)));
  }, [user]);

  // Post-OAuth / incomplete-profile finish: no new account is created. We set the
  // domain (which also clears any stale roadmap), save the placement profile, then
  // land on the dashboard — where the freshly personalized roadmap awaits.
  async function finishAuthed() {
    if (!selectedDomain) { setStep(1); setError('Pick a domain'); return; }
    if (!form.name.trim()) { setStep(2); setError('Enter your name'); return; }
    if (!form.college.trim()) { setStep(2); setError('Enter your college name'); return; }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('genois_token');
      if (!token) { router.push('/login'); return; }
      const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

      // 1. Domain — sets domain_slug and resets progress + roadmap cache.
      await fetch('/api/auth/change-domain', {
        method: 'POST', headers,
        body: JSON.stringify({ domain: selectedDomain }),
      });

      // 2. Placement profile. Keep at least one target company so the profile
      // reads as "complete" and we don't bounce back into onboarding.
      const picked = targetCompanies.filter(c => c !== 'Not sure yet');
      const finalCompanies = picked.length ? picked : ['Not sure yet'];
      const profilePayload = {
        name: form.name.trim(),
        college: form.college.trim(),
        year: String(form.year),
        target_companies: finalCompanies,
        months_to_placement: monthsToPlacement,
        weak_subjects: weakSubjects,
      };
      if (cgpa && !isNaN(parseFloat(cgpa))) profilePayload.cgpa = parseFloat(cgpa);

      const pr = await fetch('/api/auth/profile', {
        method: 'PUT', headers, body: JSON.stringify(profilePayload),
      });
      const pd = await pr.json();
      if (pd?.data?.user) {
        localStorage.setItem('genois_user', JSON.stringify(pd.data.user));
        updateUser(pd.data.user);
      } else {
        // change-domain already set domain_slug; reflect the rest locally so the
        // dashboard guard sees a complete profile.
        updateUser({ domain_slug: selectedDomain, ...profilePayload });
      }

      toast.success('Profile saved. Building your roadmap…');
      router.push('/dashboard');
    } catch {
      setError('Could not save your profile. Please try again.');
      setLoading(false);
    }
  }

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
        body: JSON.stringify({ ...form, domainSlug: selectedDomain }),
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
    background: selected ? 'var(--gx-accent-soft)' : 'var(--gx-bg)',
    border: `2px solid ${selected ? 'var(--gx-accent)' : 'var(--gx-border)'}`,
    color: selected ? 'var(--gx-accent)' : 'var(--gx-text)',
    fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600,
    transition: 'all 0.15s',
  });

  const backBtn = { flex: 1, padding: '14px', borderRadius: 12, border: '1px solid var(--gx-border)', background: 'transparent', color: 'var(--gx-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 14 };
  const nextBtn = (active) => ({ flex: 2, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: active ? 'var(--gx-accent)' : 'var(--gx-surface)', color: active ? 'var(--gx-text-inverse)' : 'var(--gx-text-subtle)', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700 });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontFamily: 'var(--font-body)' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'var(--gx-accent-soft) 1px,var(--gx-accent-soft) 1px', backgroundSize: '56px 56px' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto', padding: '40px 20px' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, marginBottom: 20 }}>
            <span style={{ color: 'var(--gx-accent)' }}>GEN</span><span style={{ color: 'var(--gx-text)' }}>OIS</span>
          </div>
          <div style={{ height: 4, background: 'var(--gx-surface)', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: progress + '%', background: 'var(--gx-accent)', borderRadius: 2, transition: 'width 0.4s' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--gx-text-subtle)', fontFamily: 'var(--font-mono)' }}>
            Step {step + 1} of {STEPS.length}
          </div>
        </div>

        {/* STEP 0 — WELCOME */}
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎯</div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 12, lineHeight: 1.2 }}>
              Ready to prove your skill?
            </h1>
            <p style={{ color: 'var(--gx-text-muted)', fontSize: 16, lineHeight: 1.8, marginBottom: 12 }}>
              Every engineering student has a resume.
            </p>
            <p style={{ color: 'var(--gx-danger)', fontSize: 16, fontWeight: 600, lineHeight: 1.8, marginBottom: 12 }}>
              90% of them are fake.
            </p>
            <p style={{ color: 'var(--gx-text-muted)', fontSize: 16, lineHeight: 1.8, marginBottom: 32 }}>
              GENOIS ranks you on real daily performance. Daily coding, timed tests, actual projects. No shortcuts.
            </p>
            <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 20, marginBottom: 28, textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 2, marginBottom: 14 }}>WHAT YOU GET</div>
              {[
                { icon: '📅', text: '30-day AI-powered daily roadmap' },
                { icon: '🎯', text: 'Daily tests, coding challenges, AI notes' },
                { icon: '🏆', text: 'Real rank among engineers across India' },
                { icon: '💼', text: 'Public profile recruiters actually trust' },
                { icon: '🆓', text: '30 days completely free — no credit card' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
                  <span style={{ fontSize: 14, color: 'var(--gx-text)' }}>{f.text}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)} style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 800, boxShadow: 'var(--gx-shadow-sm)' }}>
              Start Free — No Card Needed →
            </button>
            <p style={{ marginTop: 12, color: 'var(--gx-text-subtle)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              Already have an account? <a href="/login" style={{ color: 'var(--gx-accent)', textDecoration: 'none' }}>Login →</a>
            </p>
          </div>
        )}

        {/* STEP 1 — DOMAIN */}
        {step === 1 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 8 }}>
                Pick your battlefield
              </h2>
              <p style={{ color: 'var(--gx-text-muted)', fontSize: 14 }}>
                Choose one domain. Master it in 30 days. Switch anytime.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 24 }}>
              {DOMAINS.map(d => (
                <div key={d.id} onClick={() => setSelectedDomain(d.id)} style={{
                  padding: '16px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  background: selectedDomain === d.id ? d.color : 'var(--gx-bg)',
                  border: `2px solid ${selectedDomain === d.id ? d.color : 'var(--gx-border)'}`,
                  transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{d.icon}</div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700, color: selectedDomain === d.id ? d.color : 'var(--gx-text)', marginBottom: 4 }}>{d.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--gx-text-muted)', lineHeight: 1.4 }}>{d.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {!authedMode && <button onClick={() => setStep(0)} style={backBtn}>← Back</button>}
              <button onClick={() => { if (!selectedDomain) { setError('Pick a domain'); return; } setError(''); setStep(2); }} style={nextBtn(!!selectedDomain)}>
                Continue →
              </button>
            </div>
            {error && <div style={{ color: 'var(--gx-danger)', fontSize: 13, textAlign: 'center', marginTop: 10 }}>{error}</div>}
          </div>
        )}

        {/* STEP 2 — DETAILS */}
        {step === 2 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 8 }}>
                Tell us about yourself
              </h2>
              <p style={{ color: 'var(--gx-text-muted)', fontSize: 14 }}>
                This helps us personalize your roadmap and show your college rank.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'YOUR NAME', key: 'name', placeholder: 'Rahul Sharma', type: 'text' },
                { label: 'COLLEGE NAME', key: 'college', placeholder: 'LNCT Bhopal', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-body)', letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--gx-border)', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-body)', letterSpacing: 1, marginBottom: 6 }}>CURRENT YEAR</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['1', '2', '3', '4'].map(y => (
                    <button key={y} onClick={() => setForm(p => ({ ...p, year: y }))} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${form.year === y ? 'var(--gx-accent-border)' : 'var(--gx-border)'}`, background: form.year === y ? 'var(--gx-accent-soft)' : 'transparent', color: form.year === y ? 'var(--gx-accent)' : 'var(--gx-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
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
            {error && <div style={{ color: 'var(--gx-danger)', fontSize: 13, textAlign: 'center', marginTop: 10 }}>{error}</div>}
          </div>
        )}

        {/* STEP 3 — PLACEMENT TARGET */}
        {step === 3 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 8 }}>
                Where do you want to get placed?
              </h2>
              <p style={{ color: 'var(--gx-text-muted)', fontSize: 14 }}>
                We&apos;ll customize your entire roadmap for these companies
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-body)', letterSpacing: 1, marginBottom: 10 }}>TARGET COMPANIES (select all that apply)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {COMPANIES.map(c => (
                  <div key={c.id} onClick={() => toggleCompany(c.id)} style={chipStyle(targetCompanies.includes(c.id))}>
                    {c.label}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-body)', letterSpacing: 1, marginBottom: 10 }}>HOW MANY MONTHS UNTIL PLACEMENT SEASON?</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {MONTH_OPTIONS.map(m => (
                  <button key={m.value} onClick={() => setMonthsToPlacement(m.value)} style={{
                    padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${monthsToPlacement === m.value ? 'var(--gx-accent)' : 'var(--gx-border)'}`,
                    background: monthsToPlacement === m.value ? 'var(--gx-accent-soft)' : 'transparent',
                    color: monthsToPlacement === m.value ? 'var(--gx-accent)' : 'var(--gx-text-muted)',
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
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 8 }}>
                Where are you weak? Be honest.
              </h2>
              <p style={{ color: 'var(--gx-text-muted)', fontSize: 14 }}>
                This is private. It helps us fix the gaps before interviews.
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-body)', letterSpacing: 1, marginBottom: 10 }}>WEAK AREAS (select all that apply)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {WEAK_SUBJECTS.map(s => (
                  <div key={s} onClick={() => toggleWeakSubject(s)} style={chipStyle(weakSubjects.includes(s) || (s === "I'm strong everywhere" && weakSubjects.length === 0))}>
                    {s}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-body)', letterSpacing: 1, marginBottom: 6 }}>YOUR APPROXIMATE CGPA</div>
              <input
                type="number" min="0" max="10" step="0.1"
                value={cgpa}
                onChange={e => setCgpa(e.target.value)}
                placeholder="e.g. 7.2"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--gx-border)', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: 11, color: 'var(--gx-text-subtle)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                Helps show companies you&apos;re eligible for. Not shared publicly.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(3)} style={backBtn}>← Back</button>
              {authedMode ? (
                <button onClick={finishAuthed} disabled={loading} style={{ ...nextBtn(true), opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Saving…' : 'Finish & Build My Roadmap →'}
                </button>
              ) : (
                <button onClick={() => { setError(''); setStep(5); }} style={nextBtn(true)}>
                  Continue →
                </button>
              )}
            </div>
            {authedMode && error && <div style={{ color: 'var(--gx-danger)', fontSize: 13, textAlign: 'center', marginTop: 10 }}>{error}</div>}
          </div>
        )}

        {/* STEP 5 — ACCOUNT */}
        {step === 5 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 8 }}>
                Create your account
              </h2>
              <p style={{ color: 'var(--gx-text-muted)', fontSize: 14 }}>
                Last step. Set your email and password.
              </p>
            </div>

            <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gx-text)' }}>{form.name} · {form.college}</div>
                <div style={{ fontSize: 12, color: 'var(--gx-text-muted)' }}>Domain: {DOMAINS.find(d => d.id === selectedDomain)?.label} · Year {form.year}</div>
                {targetCompanies.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--gx-accent)', marginTop: 2 }}>
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
                  <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-body)', letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} onKeyDown={e => e.key === 'Enter' && signup()} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--gx-border)', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--gx-danger-soft)', border: '1px solid var(--gx-danger-border)', color: 'var(--gx-danger)', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(4)} style={backBtn}>← Back</button>
              <button onClick={signup} disabled={loading} style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: loading ? 'var(--gx-accent-soft)' : 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, boxShadow: 'var(--gx-shadow-sm)' }}>
                {loading ? 'Creating account...' : 'Start Free — 30 Days →'}
              </button>
            </div>
            <p style={{ textAlign: 'center', color: 'var(--gx-text-subtle)', fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 10 }}>
              No credit card · Cancel anytime · Free for 30 days
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
