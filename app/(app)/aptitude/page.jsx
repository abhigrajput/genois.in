'use client';
import { useState, useEffect, useMemo } from 'react';
import { useToken, apiFetch, apiFetchWithTimeout } from '@/lib/useApi';
import toast from 'react-hot-toast';
import PermissionGate from '@/components/PermissionGate';
import { usePermission } from '@/lib/usePermission';
import { Search, Zap, BookOpen } from 'lucide-react';
import ErrorCard from '@/components/ui/ErrorCard';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

// Explicit wall-clock caps so a slow/hung backend can never leave the UI on a
// dead spinner. The dashboard read is light; AI question-generation is heavy.
const DASHBOARD_TIMEOUT_MS = 20000;
const GENERATE_TIMEOUT_MS = 45000;
const SUBMIT_TIMEOUT_MS = 30000;

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

const DIFF_BG = { easy: 'var(--gx-success-soft)', hard: 'var(--gx-danger-soft)', medium: 'var(--gx-warning-soft)' };
const DIFF_FG = { easy: 'var(--gx-success)', hard: 'var(--gx-danger)', medium: 'var(--gx-warning)' };

function ModeTabs({ mode, setMode }) {
  const tabs = [
    { key: 'train', label: 'Training', icon: Zap },
    { key: 'shortcuts', label: 'Shortcuts', icon: BookOpen },
  ];
  return (
    <div style={{ display: 'inline-flex', gap: 4, padding: 4, background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, marginBottom: 20 }}>
      {tabs.map(t => {
        const active = mode === t.key;
        const Icon = t.icon;
        return (
          <button key={t.key} onClick={() => setMode(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9,
            border: 'none', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700,
            background: active ? 'var(--gx-accent)' : 'transparent', color: active ? 'var(--gx-text-inverse)' : 'var(--gx-text-muted)',
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
    <div style={{ fontFamily: 'var(--font-body)', width: '100%' }}>
      <ModeTabs mode={mode} setMode={setMode} />

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 4 }}>Aptitude Shortcuts</h1>
        <p style={{ color: 'var(--gx-text-muted)', fontSize: 14 }}>Quick tricks for TCS NQT, Infosys SP, Wipro NLTH</p>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gx-text-muted)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search shortcuts, topics, formulas..."
          style={{
            width: '100%', padding: '12px 14px 12px 40px', borderRadius: 12,
            background: 'var(--gx-bg)', border: '1px solid var(--gx-border)',
            color: 'var(--gx-text)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 18, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {TOPICS.map(tp => {
          const active = topic === tp;
          return (
            <button key={tp} onClick={() => setTopic(tp)} style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
              fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
              background: active ? 'var(--gx-accent)' : 'transparent',
              color: active ? 'var(--gx-text-inverse)' : 'var(--gx-text-muted)',
              border: active ? '1px solid var(--gx-accent)' : '1px solid var(--gx-border)',
            }}>{tp}</button>
          );
        })}
      </div>

      <div style={{ fontSize: 12, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
        Showing {filtered.length} of {TRICKS.length} shortcuts
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          No shortcuts match your search.
        </div>
      ) : filtered.map((trick, i) => (
        <div key={i} style={{
          background: 'var(--gx-bg)',
          border: '1px solid var(--gx-border)',
          borderRadius: 14, padding: '20px 22px',
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--gx-accent-soft)', color: 'var(--gx-accent)', fontFamily: 'var(--font-mono)' }}>{trick.topic}</span>
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: DIFF_BG[trick.difficulty], color: DIFF_FG[trick.difficulty] }}>{trick.difficulty}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 8 }}>{trick.title}</div>
          <div style={{ fontSize: 14, color: 'var(--gx-text-muted)', lineHeight: 1.7, marginBottom: 12 }}>{trick.content}</div>
          <div style={{ background: 'var(--gx-accent-soft)', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--gx-accent)', fontFamily: 'var(--font-mono)' }}>EXAMPLE</span>
            <div style={{ fontSize: 13, color: 'var(--gx-text-muted)', marginTop: 4 }}>{trick.example}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {trick.companies.map(c => (
              <span key={c} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--gx-surface)', color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>{c}</span>
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
  const [loadError, setLoadError] = useState(null);  // dashboard `/api/aptitude` failed
  const [genError, setGenError] = useState(null);     // { timedOut, message } — generation failed

  useEffect(() => {
    if (!ready || !token) return;
    loadData();
  }, [ready, token]);

  async function loadData() {
    setLoadError(null);
    try {
      const r = await apiFetchWithTimeout('/api/aptitude', token, 'GET', undefined, DASHBOARD_TIMEOUT_MS);
      if (!r?.data) throw new Error('The aptitude service returned nothing.');
      setData(r.data);
    } catch (e) {
      // Never silently die on a permanent "Loading…" — record the error so the
      // render layer can offer a retry. (Refresh-after-submit failures are
      // harmless here: we keep the last good `data`.)
      setLoadError(e.timedOut ? 'Loading your aptitude dashboard timed out.' : (e.message || 'Could not load aptitude.'));
    } finally {
      setLoading(false);
    }
  }

  async function startTopic(category, topic) {
    setActiveCategory(category);
    setActiveTopic(topic);
    setGenError(null);
    setPhase('loading');
    try {
      const r = await apiFetchWithTimeout(
        `/api/aptitude/session?category=${category}&topic=${topic.slug}&difficulty=${level || 'medium'}`,
        token, 'GET', undefined, GENERATE_TIMEOUT_MS,
      );
      const qs = r?.data?.questions;
      // An empty/malformed generation used to fall through to the topic list
      // silently. Treat "no questions" as a first-class, retry-able failure.
      if (!Array.isArray(qs) || qs.length === 0) {
        throw new Error('The generator came back empty — no questions were produced.');
      }
      setSession(r.data.session);
      setQuestions(qs);
      setAnswers({});
      setCurrentQ(0);
      setStartTime(Date.now());
      setResult(null);
      setPhase('test');
    } catch (e) {
      setGenError({
        timedOut: !!e.timedOut,
        message: e.timedOut
          ? 'Question generation is taking longer than usual (the AI is busy).'
          : (e.message || 'Could not generate this test.'),
      });
      setPhase('genError');
    }
  }

  async function submitSession() {
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    setSubmitting(true);
    try {
      const r = await apiFetchWithTimeout('/api/aptitude/session', token, 'POST', {
        sessionId: session.id,
        answers,
        timeTaken,
      }, SUBMIT_TIMEOUT_MS);
      if (!r?.data) throw new Error('Scoring response was empty.');
      setResult(r.data);
      setPhase('result');
      loadData();
    } catch (e) {
      // Stay on the test with answers intact; re-enable the button so the user
      // can simply tap Submit again instead of being stuck on "Scoring…".
      toast.error(e.timedOut ? 'Scoring timed out — your answers are safe, tap Submit again.' : (e.message || 'Could not score this test.'));
    } finally {
      setSubmitting(false);
    }
  }

  // Shortcuts is static reference — render instantly, no API dependency (still plan-gated).
  if (mode === 'shortcuts') return (
    <PermissionGate feature="aptitude_training">
      <ShortcutsView mode={mode} setMode={setMode} />
    </PermissionGate>
  );

  if (loading) return <LoadingSkeleton variant="page" label="Loading your aptitude dashboard…" />;

  // Dashboard load failed → offer a retry instead of a permanent "Loading…".
  if (loadError && !data) return (
    <ErrorCard
      title="Couldn’t load aptitude"
      message={loadError + ' Check your connection and try again.'}
      primaryLabel="↻ Retry"
      onPrimary={() => { setLoading(true); loadData(); }}
    />
  );

  if (phase === 'loading') return (
    <LoadingSkeleton variant="quiz" label={`🧠 GENOIS Engine is generating 10 ${activeTopic?.name || ''} questions…`} />
  );

  // Generation failed / timed out / came back empty → never a dead spinner.
  if (phase === 'genError' && genError) return (
    <ErrorCard
      icon={genError.timedOut ? '⏳' : '⚠️'}
      title={genError.timedOut ? 'Still generating…' : 'Generation hiccuped'}
      message={genError.message + ' Nothing was lost — retry, or pick another topic.'}
      primaryLabel="↻ Retry"
      onPrimary={() => activeCategory && activeTopic && startTopic(activeCategory, activeTopic)}
      secondaryLabel="← Back to topics"
      onSecondary={() => { setGenError(null); setPhase('list'); setActiveTopic(null); }}
    />
  );

  if (phase === 'result' && result) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
        <div style={{ background: 'var(--gx-bg)', border: `1px solid ${result.score >= 70 ? 'var(--gx-success-border)' : 'var(--gx-warning-border)'}`, borderRadius: 14, padding: 28, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{result.score >= 85 ? '🏆' : result.score >= 70 ? '✅' : '💪'}</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 48, fontWeight: 800, color: result.score >= 70 ? 'var(--gx-success)' : 'var(--gx-warning)', lineHeight: 1, marginBottom: 6 }}>{result.score}%</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: 'var(--gx-text)', marginBottom: 8 }}>{result.correct}/{result.total} correct</div>
          {result.pointsEarned > 0 && (
            <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 20, background: 'var(--gx-success-soft)', color: 'var(--gx-success)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>+{result.pointsEarned} pts earned</div>
          )}
        </div>

        <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 2, marginBottom: 14 }}>ANSWER REVIEW</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {result.results.map((r, i) => (
            <div key={i} style={{ background: 'var(--gx-bg)', border: `1px solid ${r.isCorrect ? 'var(--gx-success-border)' : 'var(--gx-danger-border)'}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{r.isCorrect ? '✅' : '❌'}</span>
                <div style={{ fontSize: 13, color: 'var(--gx-text)', fontWeight: 500 }}>Q{i + 1}: {r.question}</div>
              </div>
              {!r.isCorrect && (
                <>
                  <div style={{ fontSize: 12, color: 'var(--gx-danger)', marginLeft: 22 }}>Your: {r.yourAnswer}</div>
                  <div style={{ fontSize: 12, color: 'var(--gx-success)', marginLeft: 22, marginBottom: 6 }}>Correct: {r.correct}</div>
                  <div style={{ fontSize: 12, color: 'var(--gx-text-muted)', marginLeft: 22, padding: 8, background: 'var(--gx-surface-2)', borderRadius: 6, lineHeight: 1.6 }}>💡 {r.explanation}</div>
                </>
              )}
            </div>
          ))}
        </div>

        <button onClick={() => { setPhase('list'); setActiveTopic(null); setResult(null); }} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, marginTop: 20 }}>
          Back to Topics →
        </button>
        {result.attemptId && (
          <a href={`/review/${result.attemptId}`} style={{ display: 'block', textAlign: 'center', marginTop: 12, color: 'var(--gx-accent)', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600, textDecoration: 'none' }}>
            📋 Open full review (saved to your history) →
          </a>
        )}
      </div>
    );
  }

  if (phase === 'test' && questions.length > 0) {
    const q = questions[currentQ];
    const letters = ['A', 'B', 'C', 'D'];
    const answeredCount = Object.keys(answers).length;

    return (
      <div style={{ maxWidth: 740, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => { if (confirm('Exit? Progress lost.')) setPhase('list'); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gx-text-muted)', fontSize: 18 }}>←</button>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--gx-text)' }}>{activeTopic?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>Q{currentQ + 1}/{questions.length} · {answeredCount} answered</div>
            </div>
          </div>
        </div>

        <div style={{ height: 5, background: 'var(--gx-surface)', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((currentQ + 1) / questions.length) * 100}%`, background: 'var(--gx-accent)', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>

        <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 24, marginBottom: 18 }}>
          <div style={{ fontSize: 16, color: 'var(--gx-text)', lineHeight: 1.75, fontWeight: 500, whiteSpace: 'pre-wrap' }}>{q.question}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {(q.options || []).map((opt, oi) => {
            const isSelected = answers[currentQ] === opt;
            return (
              <button key={oi} onClick={() => setAnswers(p => ({ ...p, [currentQ]: opt }))} style={{ padding: '13px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', border: `1px solid ${isSelected ? 'var(--gx-accent-border)' : 'var(--gx-border)'}`, background: isSelected ? 'var(--gx-accent-soft)' : 'var(--gx-surface)', color: isSelected ? 'var(--gx-accent)' : 'var(--gx-text)', fontSize: 14, lineHeight: 1.5 }}>
                <span style={{ color: isSelected ? 'var(--gx-accent)' : 'var(--gx-text-muted)', marginRight: 10, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{letters[oi]}.</span>{opt}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {currentQ > 0 && <button onClick={() => setCurrentQ(c => c - 1)} style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1px solid var(--gx-border)', background: 'transparent', color: 'var(--gx-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 14 }}>← Prev</button>}
          {currentQ < questions.length - 1 ? (
            <button onClick={() => setCurrentQ(c => c + 1)} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>Next →</button>
          ) : (
            <button onClick={submitSession} disabled={submitting} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', background: submitting ? 'var(--gx-accent-soft)' : 'var(--gx-success)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
              {submitting ? 'Scoring...' : `Submit ${answeredCount}/${questions.length} →`}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!data) return (
    <ErrorCard
      title="Couldn’t load aptitude"
      message="The dashboard didn’t come through. Give it another try."
      primaryLabel="↻ Retry"
      onPrimary={() => { setLoading(true); loadData(); }}
    />
  );

  const { progress = {}, categories = {} } = data;

  return (
  <PermissionGate feature="aptitude_training">
  <div style={{ fontFamily: 'var(--font-body)', width: '100%' }}>
    <ModeTabs mode={mode} setMode={setMode} />
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 4 }}>🧠 Aptitude Training</h1>
      <p style={{ color: 'var(--gx-text-muted)', fontSize: 13 }}>Quant, Logical, Verbal. Crack TCS, Infosys, Wipro placement tests.</p>
    </div>

    {!level ? (
      <div style={{ background: 'var(--gx-accent-soft)', border: '2px solid var(--gx-border)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 8 }}>
          Pick your aptitude level
        </div>
        <div style={{ color: 'var(--gx-text-muted)', fontSize: 13, marginBottom: 20 }}>
          Questions will match your level.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
          {[
            { key: 'easy', label: '🌱 Basics', desc: 'Starting from zero', color: 'var(--gx-success)' },
            { key: 'medium', label: '⚡ Intermediate', desc: 'Know basics well', color: 'var(--gx-warning)' },
            { key: 'hard', label: '🔥 Advanced', desc: 'Company-level', color: 'var(--gx-danger)' },
          ].map(l => (
            <button key={l.key} onClick={() => setLevel(l.key)} style={{ padding: '18px', borderRadius: 10, border: `1px solid color-mix(in srgb, ${l.color} 19%, transparent)`, background: 'var(--gx-surface)', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: 16, marginBottom: 6, color: l.color, fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{l.label}</div>
              <div style={{ fontSize: 12, color: 'var(--gx-text-muted)' }}>{l.desc}</div>
            </button>
          ))}
        </div>
      </div>
    ) : (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '10px 16px', background: 'var(--gx-surface)', borderRadius: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>
            LEVEL: <span style={{ color: level === 'easy' ? 'var(--gx-success)' : level === 'medium' ? 'var(--gx-warning)' : 'var(--gx-danger)', fontWeight: 700 }}>{level.toUpperCase()}</span>
          </div>
          <button onClick={() => setLevel(null)} style={{ background: 'transparent', border: 'none', color: 'var(--gx-accent)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
            Change →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Sessions', value: progress?.total_sessions ?? 0, color: 'var(--gx-accent)' },
            { label: 'Streak', value: '🔥' + (progress?.current_streak ?? 0), color: 'var(--gx-warning)' },
            { label: 'Best Quant', value: (progress?.quant_score ?? 0) + '%', color: 'var(--gx-success)' },
            { label: 'Best Logical', value: (progress?.logical_score ?? 0) + '%', color: 'var(--gx-warning)' },
            { label: 'Best Verbal', value: (progress?.verbal_score ?? 0) + '%', color: 'var(--gx-warning)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--gx-bg)', border: `1px solid color-mix(in srgb, ${s.color} 8%, transparent)`, borderRadius: 12, padding: '14px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--gx-text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {Object.entries(categories).map(([slug, cat]) => (
          <div key={slug} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>{cat.icon}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: cat.color }}>{cat.label}</div>
                <div style={{ fontSize: 11, color: 'var(--gx-text-muted)' }}>{cat.description}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
              {cat.topics.map(topic => (
                <div key={topic.slug} onClick={() => startTopic(slug, topic)} style={{ background: 'var(--gx-bg)', border: `1px solid color-mix(in srgb, ${cat.color} 8%, transparent)`, borderRadius: 10, padding: '14px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600, color: 'var(--gx-text)' }}>{topic.name}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>10 Q · Start →</div>
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
