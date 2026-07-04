'use client';
import { useState, useEffect, useMemo } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';
import PermissionGate from '@/components/PermissionGate';
import { usePermission } from '@/lib/usePermission';
import { Search, Zap, BookOpen } from 'lucide-react';

const TRICKS = [
  { topic: 'Ratio & Proportion', title: 'Splitting a Number', content: 'To divide N in ratio a:b → First = N×a/(a+b), Second = N×b/(a+b)', example: '720 in 2:3 → 288, 432', companies: ['TCS NQT', 'Infosys SP'], difficulty: 'easy' },
  { topic: 'Ratio & Proportion', title: 'Direct & Inverse Proportion', content: 'Direct: A1/A2 = B1/B2. Inverse: A1/A2 = B2/B1', example: '2kg = ₹500, 6kg = ₹500×6/2 = ₹1500', companies: ['TCS NQT'], difficulty: 'easy' },
  { topic: 'Percentage', title: 'X% of Y = Y% of X', content: 'Always flip to easier side. 37% of 50 = 50% of 37 = 18.5', example: '24% of 50 = 50% of 24 = 12', companies: ['TCS NQT', 'Infosys SP', 'Wipro'], difficulty: 'easy' },
  { topic: 'Percentage', title: 'Successive % Change', content: 'a% then b% net = (a+b+ab/100)%', example: '20% + 30% = 56% not 50%', companies: ['TCS NQT'], difficulty: 'medium' },
  { topic: 'Profit & Loss', title: 'Same SP Profit+Loss = Net Loss', content: 'If sold at same SP with X% profit and X% loss → Net loss = X²/100 %', example: '20% each → Net loss = 4%', companies: ['TCS NQT', 'Infosys SP'], difficulty: 'medium' },
  { topic: 'Profit & Loss', title: 'Successive Discounts', content: 'A% + B% ≠ (A+B)%. Real = A+B-AB/100', example: '20%+10% = 28% not 30%', companies: ['Wipro NLTH'], difficulty: 'medium' },
  { topic: 'Speed & Distance', title: 'Conversion + Average Speed', content: 'km/hr→m/s: ×5/18. Average speed (same dist) = 2ab/(a+b)', example: '72 km/hr = 20 m/s', companies: ['TCS NQT', 'Infosys SP'], difficulty: 'easy' },
  { topic: 'Speed & Distance', title: 'Relative Speed', content: 'Same dir: |S1-S2|. Opposite: S1+S2. Meet time = D/(S1+S2)', example: '150km apart, 60+40 opposite → 1.5 hrs', companies: ['TCS NQT'], difficulty: 'medium' },
  { topic: 'Trains', title: 'Train Crossing', content: 'Pole: T=L/S. Platform: T=(L₁+L₂)/S. Two trains: T=(L₁+L₂)/Relative', example: '200m train at 72km/hr crosses pole in 10s', companies: ['TCS NQT', 'Infosys SP'], difficulty: 'medium' },
  { topic: 'Boats', title: 'Upstream & Downstream', content: 'Down=B+S, Up=B-S. Boat=(D+U)/2, Stream=(D-U)/2', example: 'D=24, U=16 → Boat=20, Stream=4', companies: ['TCS NQT'], difficulty: 'medium' },
  { topic: 'Time & Work', title: 'LCM Method', content: 'LCM of days → assign units → add rates → Total/Combined', example: 'A:10d B:15d → LCM=30, rates 3+2=5 → 6 days', companies: ['TCS NQT', 'Infosys', 'Wipro'], difficulty: 'medium' },
  { topic: 'Time & Work', title: 'Pipes & Cisterns', content: 'Inlet = +rate, Outlet = -rate. Net = sum of all', example: 'Fill 6hr, Empty 8hr → 1/6-1/8=1/24 → 24hrs', companies: ['TCS NQT'], difficulty: 'medium' },
  { topic: 'Interest', title: 'CI-SI Shortcut (2 years)', content: 'CI - SI = P × (R/100)²', example: '₹5000 at 10% → CI-SI = ₹50', companies: ['TCS NQT', 'Infosys SP'], difficulty: 'medium' },
  { topic: 'Numbers', title: 'Divisibility Rules', content: 'By 3: digit sum. By 4: last 2 digits. By 8: last 3. By 9: digit sum. By 11: alternating sum', example: '2376: ÷2✓ ÷3✓ ÷4✓ ÷8✓', companies: ['TCS NQT'], difficulty: 'easy' },
  { topic: 'Numbers', title: 'Remainder Cycle', content: 'For a^n mod d: find repeating pattern in remainders', example: '2^100 mod 3: cycle 2,1 → even power → rem 1', companies: ['TCS NQT', 'Infosys'], difficulty: 'hard' },
  { topic: 'HCF & LCM', title: 'HCF × LCM = Product', content: 'HCF×LCM = A×B. Fractions: HCF(num)/LCM(den)', example: '12,18: HCF=6, LCM=36. 6×36=216=12×18', companies: ['TCS NQT'], difficulty: 'easy' },
  { topic: 'Ages', title: 'Ratio + Years Method', content: 'Ages in ratio a:b → assume aK, bK. Use years condition to find K', example: 'Father 3×son, after 12yrs 2×son → son=12', companies: ['TCS NQT', 'Infosys'], difficulty: 'medium' },
  { topic: 'Calendar', title: 'Odd Days Method', content: '1yr=1odd, Leap=2, 100yrs=5, 200=3, 300=1, 400=0', example: 'Count odd days to find weekday of any date', companies: ['TCS NQT'], difficulty: 'medium' },
  { topic: 'Clocks', title: 'Angle Formula', content: 'Angle = |30H - 5.5M|°. Overlap 11 times/12hrs', example: '3:30 → |90-165| = 75°', companies: ['TCS NQT', 'Wipro'], difficulty: 'medium' },
  { topic: 'P & C', title: 'Permutation vs Combination', content: 'nPr = n!/(n-r)! order matters. nCr = n!/(r!(n-r)!) no order', example: '5P3=60, 5C3=10', companies: ['TCS NQT', 'Infosys'], difficulty: 'hard' },
  { topic: 'Probability', title: 'Basic Rules', content: 'P=fav/total. P(A∪B)=P(A)+P(B)-P(A∩B). Independent: multiply', example: 'Two dice both even: 1/2 × 1/2 = 1/4', companies: ['TCS NQT', 'Infosys', 'Wipro'], difficulty: 'medium' },
  { topic: 'Averages', title: 'Add/Remove Formula', content: 'Add X: new avg = (NA+X)/(N+1). Remove: (NA-X)/(N-1)', example: 'Avg of 5 = 20, add 32 → 132/6 = 22', companies: ['TCS NQT'], difficulty: 'easy' },
  { topic: 'Mixtures', title: 'Allegation Cross', content: 'Ratio = (P2-Pm):(Pm-P1). Cross diagram for any mixing problem', example: '₹40+₹60 tea for ₹45 → ratio 3:1', companies: ['TCS NQT', 'Infosys'], difficulty: 'medium' },
  { topic: 'Partnership', title: 'Investment × Time', content: 'Profit ratio = I₁×T₁ : I₂×T₂', example: '₹5000×12m : ₹8000×9m = 5:6', companies: ['Infosys SP'], difficulty: 'medium' },
  { topic: 'Progressions', title: 'AP & GP Formulas', content: 'AP: nth=a+(n-1)d, Sum=n/2×(first+last). GP: nth=ar^(n-1)', example: 'Sum 1 to 100 = 5050', companies: ['TCS NQT', 'Infosys'], difficulty: 'medium' },
];

const TOPICS = ['All', 'Ratio & Proportion', 'Percentage', 'Profit & Loss', 'Speed & Distance', 'Trains', 'Boats', 'Time & Work', 'Interest', 'Numbers', 'HCF & LCM', 'Ages', 'Calendar', 'Clocks', 'P & C', 'Probability', 'Averages', 'Mixtures', 'Partnership', 'Progressions'];

const DIFF_BG = { easy: 'rgba(16,185,129,0.12)', hard: 'rgba(239,68,68,0.12)', medium: 'rgba(245,158,11,0.12)' };
const DIFF_FG = { easy: '#10b981', hard: '#ef4444', medium: '#f59e0b' };

function ModeTabs({ mode, setMode }) {
  const tabs = [
    { key: 'train', label: 'Training', icon: Zap },
    { key: 'shortcuts', label: 'Shortcuts', icon: BookOpen },
  ];
  return (
    <div style={{ display: 'inline-flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 12, marginBottom: 20 }}>
      {tabs.map(t => {
        const active = mode === t.key;
        const Icon = t.icon;
        return (
          <button key={t.key} onClick={() => setMode(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9,
            border: 'none', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700,
            background: active ? '#6366f1' : 'transparent', color: active ? '#fff' : '#9ca3af',
          }}>
            <Icon size={15} />{t.label}
          </button>
        );
      })}
    </div>
  );
}

function ShortcutsView({ mode, setMode }) {
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('All');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TRICKS.filter(t => {
      if (topic !== 'All' && t.topic !== topic) return false;
      if (!q) return true;
      return (
        t.topic.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        t.example.toLowerCase().includes(q) ||
        t.companies.some(c => c.toLowerCase().includes(q))
      );
    });
  }, [search, topic]);

  return (
    <div style={{ fontFamily: 'Outfit,sans-serif', width: '100%' }}>
      <ModeTabs mode={mode} setMode={setMode} />

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>Aptitude Shortcuts</h1>
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Quick tricks for TCS NQT, Infosys SP, Wipro NLTH</p>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search shortcuts, topics, formulas..."
          style={{
            width: '100%', padding: '12px 14px 12px 40px', borderRadius: 12,
            background: '#13131f', border: '1px solid rgba(99,102,241,0.12)',
            color: '#e2e8f0', fontSize: 14, fontFamily: 'Outfit,sans-serif', outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 18, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {TOPICS.map(tp => {
          const active = topic === tp;
          return (
            <button key={tp} onClick={() => setTopic(tp)} style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
              fontSize: 12, fontFamily: 'JetBrains Mono,monospace', whiteSpace: 'nowrap',
              background: active ? '#6366f1' : 'transparent',
              color: active ? '#fff' : '#9ca3af',
              border: active ? '1px solid #6366f1' : '1px solid rgba(99,102,241,0.18)',
            }}>{tp}</button>
          );
        })}
      </div>

      <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'JetBrains Mono,monospace', marginBottom: 14 }}>
        Showing {filtered.length} of {TRICKS.length} shortcuts
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontFamily: 'JetBrains Mono,monospace', fontSize: 13 }}>
          No shortcuts match your search.
        </div>
      ) : filtered.map((trick, i) => (
        <div key={i} style={{
          background: '#13131f',
          border: '1px solid rgba(99,102,241,0.12)',
          borderRadius: 14, padding: '20px 22px',
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', color: '#818cf8', fontFamily: 'JetBrains Mono,monospace' }}>{trick.topic}</span>
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: DIFF_BG[trick.difficulty], color: DIFF_FG[trick.difficulty] }}>{trick.difficulty}</span>
          </div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 17, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>{trick.title}</div>
          <div style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7, marginBottom: 12 }}>{trick.content}</div>
          <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: '#818cf8', fontFamily: 'JetBrains Mono,monospace' }}>EXAMPLE</span>
            <div style={{ fontSize: 13, color: '#d1d5db', marginTop: 4 }}>{trick.example}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {trick.companies.map(c => (
              <span key={c} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', color: '#6b7280', fontFamily: 'JetBrains Mono,monospace' }}>{c}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AptitudePage() {
  const { token, ready } = useToken();
  const { userPlan } = usePermission();
  const [mode, setMode] = useState('train');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('list');
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [level, setLevel] = useState(null);
  const [showPlacement, setShowPlacement] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    loadData();
  }, [ready, token]);

  async function loadData() {
    try {
      const r = await apiFetch('/api/aptitude', token);
      setData(r.data);
      setLoading(false);
    } catch { setLoading(false); }
  }

  async function startTopic(category, topic) {
    setActiveCategory(category);
    setActiveTopic(topic);
    setPhase('loading');
    try {
      const r = await apiFetch(`/api/aptitude/session?category=${category}&topic=${topic.slug}&difficulty=${level || 'medium'}`, token);
      setSession(r.data.session);
      setQuestions(r.data.questions);
      setAnswers({});
      setCurrentQ(0);
      setStartTime(Date.now());
      setResult(null);
      setPhase('test');
    } catch (e) { toast.error(e.message); setPhase('list'); }
  }

  async function submitSession() {
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    setSubmitting(true);
    try {
      const r = await apiFetch('/api/aptitude/session', token, 'POST', {
        sessionId: session.id,
        answers,
        timeTaken,
      });
      setResult(r.data);
      setPhase('result');
      loadData();
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  }

  // Shortcuts is static reference — render instantly, no API dependency (still plan-gated).
  if (mode === 'shortcuts') return (
    <PermissionGate feature="aptitude_training">
      <ShortcutsView mode={mode} setMode={setMode} />
    </PermissionGate>
  );

  if (loading) return <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace' }}>Loading aptitude...</div>;

  if (phase === 'loading') return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
      <div style={{ fontSize: 16, color: '#e8f4ff', fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>Generating 10 {activeTopic?.name} questions...</div>
    </div>
  );

  if (phase === 'result' && result) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
        <div style={{ background: '#070f1f', border: `1px solid ${result.score >= 70 ? 'rgba(29,158,117,0.3)' : 'rgba(239,159,39,0.3)'}`, borderRadius: 14, padding: 28, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{result.score >= 85 ? '🏆' : result.score >= 70 ? '✅' : '💪'}</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 48, fontWeight: 800, color: result.score >= 70 ? '#1D9E75' : '#EF9F27', lineHeight: 1, marginBottom: 6 }}>{result.score}%</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, color: '#e8f4ff', marginBottom: 8 }}>{result.correct}/{result.total} correct</div>
          {result.pointsEarned > 0 && (
            <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 20, background: 'rgba(29,158,117,0.1)', color: '#1D9E75', fontSize: 12, fontFamily: 'JetBrains Mono,monospace' }}>+{result.pointsEarned} pts earned</div>
          )}
        </div>

        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 14 }}>ANSWER REVIEW</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {result.results.map((r, i) => (
            <div key={i} style={{ background: '#070f1f', border: `1px solid ${r.isCorrect ? 'rgba(29,158,117,0.15)' : 'rgba(255,45,120,0.15)'}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{r.isCorrect ? '✅' : '❌'}</span>
                <div style={{ fontSize: 13, color: '#c8d8e8', fontWeight: 500 }}>Q{i + 1}: {r.question}</div>
              </div>
              {!r.isCorrect && (
                <>
                  <div style={{ fontSize: 12, color: '#ff2d78', marginLeft: 22 }}>Your: {r.yourAnswer}</div>
                  <div style={{ fontSize: 12, color: '#1D9E75', marginLeft: 22, marginBottom: 6 }}>Correct: {r.correct}</div>
                  <div style={{ fontSize: 12, color: '#8a9ab0', marginLeft: 22, padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 6, lineHeight: 1.6 }}>💡 {r.explanation}</div>
                </>
              )}
            </div>
          ))}
        </div>

        <button onClick={() => { setPhase('list'); setActiveTopic(null); setResult(null); }} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, marginTop: 20 }}>
          Back to Topics →
        </button>
      </div>
    );
  }

  if (phase === 'test' && questions.length > 0) {
    const q = questions[currentQ];
    const letters = ['A', 'B', 'C', 'D'];
    const answeredCount = Object.keys(answers).length;

    return (
      <div style={{ maxWidth: 740, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => { if (confirm('Exit? Progress lost.')) setPhase('list'); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5a7a9a', fontSize: 18 }}>←</button>
            <div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: '#e8f4ff' }}>{activeTopic?.name}</div>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>Q{currentQ + 1}/{questions.length} · {answeredCount} answered</div>
            </div>
          </div>
        </div>

        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((currentQ + 1) / questions.length) * 100}%`, background: 'linear-gradient(90deg,#00f0ff,#7b5cff)', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>

        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24, marginBottom: 18 }}>
          <div style={{ fontSize: 16, color: '#e8f4ff', lineHeight: 1.75, fontWeight: 500, whiteSpace: 'pre-wrap' }}>{q.question}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {(q.options || []).map((opt, oi) => {
            const isSelected = answers[currentQ] === opt;
            return (
              <button key={oi} onClick={() => setAnswers(p => ({ ...p, [currentQ]: opt }))} style={{ padding: '13px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', border: `1px solid ${isSelected ? 'rgba(0,240,255,0.5)' : 'rgba(255,255,255,0.06)'}`, background: isSelected ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.01)', color: isSelected ? '#00f0ff' : '#c8d8e8', fontSize: 14, lineHeight: 1.5 }}>
                <span style={{ color: isSelected ? '#00f0ff' : '#5a7a9a', marginRight: 10, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>{letters[oi]}.</span>{opt}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {currentQ > 0 && <button onClick={() => setCurrentQ(c => c - 1)} style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 14 }}>← Prev</button>}
          {currentQ < questions.length - 1 ? (
            <button onClick={() => setCurrentQ(c => c + 1)} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>Next →</button>
          ) : (
            <button onClick={submitSession} disabled={submitting} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', background: submitting ? 'rgba(0,240,255,0.2)' : 'linear-gradient(135deg,#1D9E75,#00f0ff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>
              {submitting ? 'Scoring...' : `Submit ${answeredCount}/${questions.length} →`}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!data) return <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center' }}>Loading...</div>;

  const { progress = {}, categories = {} } = data;

  return (
  <PermissionGate feature="aptitude_training">
  <div style={{ fontFamily: 'Outfit,sans-serif', width: '100%' }}>
    <ModeTabs mode={mode} setMode={setMode} />
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>🧠 Aptitude Training</h1>
      <p style={{ color: '#5a7a9a', fontSize: 13 }}>Quant, Logical, Verbal. Crack TCS, Infosys, Wipro placement tests.</p>
    </div>

    {!level ? (
      <div style={{ background: 'linear-gradient(135deg,rgba(0,240,255,0.06),rgba(123,92,255,0.03))', border: '2px solid rgba(0,240,255,0.15)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: '#e8f4ff', marginBottom: 8 }}>
          Pick your aptitude level
        </div>
        <div style={{ color: '#5a7a9a', fontSize: 13, marginBottom: 20 }}>
          Questions will match your level.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
          {[
            { key: 'easy', label: '🌱 Basics', desc: 'Starting from zero', color: '#1D9E75' },
            { key: 'medium', label: '⚡ Intermediate', desc: 'Know basics well', color: '#EF9F27' },
            { key: 'hard', label: '🔥 Advanced', desc: 'Company-level', color: '#ff2d78' },
          ].map(l => (
            <button key={l.key} onClick={() => setLevel(l.key)} style={{ padding: '18px', borderRadius: 10, border: `1px solid ${l.color}30`, background: 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: 16, marginBottom: 6, color: l.color, fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>{l.label}</div>
              <div style={{ fontSize: 12, color: '#5a7a9a' }}>{l.desc}</div>
            </button>
          ))}
        </div>
      </div>
    ) : (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '10px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
          <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
            LEVEL: <span style={{ color: level === 'easy' ? '#1D9E75' : level === 'medium' ? '#EF9F27' : '#ff2d78', fontWeight: 700 }}>{level.toUpperCase()}</span>
          </div>
          <button onClick={() => setLevel(null)} style={{ background: 'transparent', border: 'none', color: '#00f0ff', cursor: 'pointer', fontSize: 12, fontFamily: 'Syne,sans-serif', fontWeight: 600 }}>
            Change →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Sessions', value: progress?.total_sessions ?? 0, color: '#00f0ff' },
            { label: 'Streak', value: '🔥' + (progress?.current_streak ?? 0), color: '#EF9F27' },
            { label: 'Best Quant', value: (progress?.quant_score ?? 0) + '%', color: '#1D9E75' },
            { label: 'Best Logical', value: (progress?.logical_score ?? 0) + '%', color: '#7b5cff' },
            { label: 'Best Verbal', value: (progress?.verbal_score ?? 0) + '%', color: '#EF9F27' },
          ].map(s => (
            <div key={s.label} style={{ background: '#070f1f', border: `1px solid ${s.color}15`, borderRadius: 12, padding: '14px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#5a7a9a', marginTop: 4, fontFamily: 'JetBrains Mono,monospace' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {Object.entries(categories).map(([slug, cat]) => (
          <div key={slug} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>{cat.icon}</span>
              <div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: cat.color }}>{cat.label}</div>
                <div style={{ fontSize: 11, color: '#5a7a9a' }}>{cat.description}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
              {cat.topics.map(topic => (
                <div key={topic.slug} onClick={() => startTopic(slug, topic)} style={{ background: '#070f1f', border: `1px solid ${cat.color}15`, borderRadius: 10, padding: '14px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600, color: '#e8f4ff' }}>{topic.name}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>10 Q · Start →</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </>
    )}
  </div>
  </PermissionGate>
);
}
