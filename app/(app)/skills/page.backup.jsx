'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  Frontend: '#7F77DD', Backend: '#1D9E75', Programming: '#D85A30',
  Database: '#378ADD', Tools: '#EF9F27', DevOps: '#888780',
  Systems: '#534AB7', DSA: '#1D9E75', Architecture: '#BA7517',
  'AI/ML': '#D4537E', Cloud: '#639922',
};

const BADGES = {
  bronze: { icon: '🥉', label: 'Bronze', color: '#cd7f32' },
  silver: { icon: '🥈', label: 'Silver', color: '#c0c0c0' },
  gold: { icon: '🥇', label: 'Gold', color: '#ffd700' },
};

const LEVEL_INFO = {
  1: { name: 'Foundation', passScore: 85, points: 25 },
  2: { name: 'Practitioner', passScore: 87, points: 40 },
  3: { name: 'Expert', passScore: 90, points: 75 },
};

export default function SkillsPage() {
  const { token, ready } = useToken();
  const [skills, setSkills] = useState([]);
  const [stats, setStats] = useState({ masterCount: 0, totalBadges: 0 });
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('list');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showExplanation, setShowExplanation] = useState(false);
  const [detailSkill, setDetailSkill] = useState(null);

  useEffect(() => {
    if (!ready || !token) return;
    loadSkills();
  }, [ready, token]);

  async function loadSkills() {
    try {
      const r = await apiFetch('/api/skills', token);
      setSkills(r.data?.skills || []);
      setStats({ masterCount: r.data?.masterCount || 0, totalBadges: r.data?.totalBadges || 0 });
      setLoading(false);
    } catch { setLoading(false); }
  }

  async function startLevel(skill, level) {
    setSelectedSkill(skill);
    setSelectedLevel(level);
    setPhase('loading');
    try {
      const r = await apiFetch(`/api/skills/verify?skill=${skill.slug}&name=${encodeURIComponent(skill.name)}&level=${level}`, token);
      setQuestions(r.data.questions);
      setAnswers({});
      setCurrentQ(0);
      setResult(null);
      setShowExplanation(false);
      setPhase('test');
    } catch (e) { toast.error(e.message); setPhase('list'); setDetailSkill(null); }
  }

  async function submitLevel() {
    setSubmitting(true);
    try {
      const r = await apiFetch('/api/skills/verify', token, 'POST', {
        skillSlug: selectedSkill.slug,
        skillName: selectedSkill.name,
        level: selectedLevel,
        answers,
        questions,
      });
      setResult(r.data);
      setPhase('result');
      if (r.data.verified) loadSkills();
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  }

  const categories = ['all', ...new Set(skills.map(s => s.category))];
  const filtered = filter === 'all' ? skills : skills.filter(s => s.category === filter);
  const q = questions[currentQ];
  const letters = ['A', 'B', 'C', 'D'];

  if (loading) return <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>Loading...</div>;

  if (phase === 'loading') return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚒️</div>
      <div style={{ fontSize: 16, marginBottom: 8, color: '#e8e8ed', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
        Forging Level {selectedLevel} Trial
      </div>
      <div style={{ fontSize: 13 }}>15 questions for {selectedSkill?.name}...</div>
    </div>
  );

  if (phase === 'result' && result) {
    const badge = BADGES[result.badge] || null;
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
        <div style={{ background: '#070f1f', border: `1px solid ${result.verified ? (badge?.color || '#1D9E75') + '40' : 'rgba(255,45,120,0.2)'}`, borderRadius: 16, padding: 28, marginBottom: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,transparent,${result.verified ? (badge?.color || '#1D9E75') : '#ff2d78'},transparent)` }} />
          <div style={{ fontSize: 72, marginBottom: 12 }}>{result.verified ? (badge?.icon || '✅') : '💪'}</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 52, fontWeight: 800, color: result.verified ? (badge?.color || '#1D9E75') : '#ff2d78', lineHeight: 1, marginBottom: 8 }}>
            {result.score}%
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#e8e8ed', marginBottom: 4 }}>
            {result.verified ? `${badge?.label} Badge Earned!` : `Not Passed — Need ${result.passScore}%+`}
          </div>
          <div style={{ color: '#5a7a9a', fontSize: 14, marginBottom: 12 }}>
            Level {result.level} · {result.levelName} · {selectedSkill?.name}
          </div>
          {result.verified && (
            <div style={{ display: 'inline-flex', gap: 12, marginTop: 8 }}>
              <div style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(29,158,117,0.15)', border: '1px solid rgba(29,158,117,0.3)', color: '#1D9E75', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                +{result.pointsEarned} pts
              </div>
              <div style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', color: '#5a7a9a', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                Expires: {new Date(result.expiresAt).toLocaleDateString('en-IN')}
              </div>
            </div>
          )}
          {result.allLevelsComplete && (
            <div style={{ marginTop: 20, padding: '14px 20px', background: 'linear-gradient(135deg,rgba(255,215,0,0.1),rgba(192,192,192,0.05))', borderRadius: 12, color: '#ffd700', fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700 }}>
              🏆 MASTER STATUS UNLOCKED · All 3 levels passed for {selectedSkill?.name}
            </div>
          )}
          {result.nextLevelUnlocked && (
            <div style={{ marginTop: 16, padding: '12px 18px', background: 'rgba(0,240,255,0.08)', borderRadius: 10, color: '#00f0ff', fontSize: 14 }}>
              🔓 Level {result.level + 1} — {LEVEL_INFO[result.level + 1].name} unlocked!
            </div>
          )}
        </div>

        {(result.strongAreas?.length > 0 || result.weakAreas?.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {result.strongAreas?.length > 0 && (
              <div style={{ background: '#070f1f', border: '1px solid rgba(29,158,117,0.15)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#1D9E75', letterSpacing: 2, marginBottom: 10 }}>✓ STRONG</div>
                {result.strongAreas.map((a, i) => <div key={i} style={{ fontSize: 13, color: '#c8d8e8', padding: '4px 0' }}>• {a}</div>)}
              </div>
            )}
            {result.weakAreas?.length > 0 && (
              <div style={{ background: '#070f1f', border: '1px solid rgba(255,45,120,0.15)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ff2d78', letterSpacing: 2, marginBottom: 10 }}>✗ STUDY THESE</div>
                {result.weakAreas.map((a, i) => <div key={i} style={{ fontSize: 13, color: '#c8d8e8', padding: '4px 0' }}>• {a}</div>)}
              </div>
            )}
          </div>
        )}

        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <button onClick={() => setShowExplanation(!showExplanation)} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 2 }}>
              ANSWER REVIEW ({result.detailedResults?.filter(r => !r.isCorrect).length} wrong)
            </div>
            <span style={{ color: '#00f0ff', fontSize: 14 }}>{showExplanation ? '▲' : '▼'}</span>
          </button>
          {showExplanation && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {result.detailedResults?.map((r, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 8, background: r.isCorrect ? 'rgba(29,158,117,0.04)' : 'rgba(255,45,120,0.04)', border: `1px solid ${r.isCorrect ? 'rgba(29,158,117,0.15)' : 'rgba(255,45,120,0.15)'}` }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{r.isCorrect ? '✅' : '❌'}</span>
                    <div style={{ fontSize: 13, color: '#c8d8e8', fontWeight: 500 }}>Q{i + 1}: {r.question}</div>
                  </div>
                  {r.code && (
                    <pre style={{ background: '#050d1a', padding: '8px 12px', borderRadius: 6, fontSize: 11, color: '#00f0ff', fontFamily: 'var(--font-mono)', margin: '6px 0 6px 22px', overflowX: 'auto' }}>{r.code}</pre>
                  )}
                  {!r.isCorrect && (
                    <>
                      <div style={{ fontSize: 12, color: '#ff2d78', marginLeft: 22, marginBottom: 4 }}>Your: {r.yourAnswer}</div>
                      <div style={{ fontSize: 12, color: '#1D9E75', marginLeft: 22, marginBottom: 6 }}>Correct: {r.correctAnswer}</div>
                      <div style={{ fontSize: 12, color: '#5a7a9a', lineHeight: 1.6, marginLeft: 22, padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>💡 {r.explanation}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setPhase('list'); setSelectedSkill(null); setDetailSkill(null); }} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 14 }}>Back</button>
          {result.nextLevelUnlocked && (
            <button onClick={() => { const next = result.level + 1; setTimeout(() => startLevel(selectedSkill, next), 100); }} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
              Start Level {result.level + 1} →
            </button>
          )}
          {!result.verified && result.attemptsLeft > 0 && (
            <button onClick={() => startLevel(selectedSkill, result.level)} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
              Retry in 24h ({result.attemptsLeft} left) →
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'test' && q) {
    const answeredCount = Object.keys(answers).length;
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => { if (confirm('Exit? Progress lost.')) { setPhase('list'); setSelectedSkill(null); } }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5a7a9a', fontSize: 18 }}>←</button>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#e8e8ed' }}>
                {selectedSkill?.name} — Level {selectedLevel}
              </div>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>
                Q{currentQ + 1}/{questions.length} · {answeredCount} answered · Need {LEVEL_INFO[selectedLevel].passScore}%+
              </div>
            </div>
          </div>
          <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,240,255,0.08)', color: '#00f0ff', fontFamily: 'var(--font-mono)' }}>
            {(q.type || '').replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 8, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((currentQ + 1) / questions.length) * 100}%`, background: 'linear-gradient(90deg,#00f0ff,#ff6b4a)', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>

        <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>
          {questions.map((_, i) => (
            <div key={i} onClick={() => setCurrentQ(i)} style={{ flex: 1, height: 4, borderRadius: 2, cursor: 'pointer', background: answers[i] ? '#1D9E75' : i === currentQ ? '#00f0ff' : 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>

        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 16, color: '#e8e8ed', lineHeight: 1.75, fontWeight: 500, marginBottom: q.code ? 16 : 0 }}>{q.question}</div>
          {q.code && (
            <pre style={{ background: '#050d1a', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: '#00f0ff', fontFamily: 'var(--font-mono)', overflowX: 'auto', margin: 0, lineHeight: 1.6 }}>{q.code}</pre>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {(q.options || []).map((opt, oi) => {
            const isSelected = answers[currentQ] === opt;
            return (
              <button key={oi} onClick={() => setAnswers(p => ({ ...p, [currentQ]: opt }))} style={{ padding: '13px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', border: `1px solid ${isSelected ? 'rgba(0,240,255,0.5)' : 'rgba(255,255,255,0.06)'}`, background: isSelected ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.01)', color: isSelected ? '#00f0ff' : '#c8d8e8', fontSize: 14, lineHeight: 1.5 }}>
                <span style={{ color: isSelected ? '#00f0ff' : '#5a7a9a', marginRight: 10, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{letters[oi]}.</span>{opt}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {currentQ > 0 && <button onClick={() => setCurrentQ(c => c - 1)} style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 14 }}>← Prev</button>}
          {currentQ < questions.length - 1 ? (
            <button onClick={() => setCurrentQ(c => c + 1)} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>Next →</button>
          ) : (
            <button onClick={submitLevel} disabled={submitting} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', background: submitting ? 'rgba(0,240,255,0.2)' : 'linear-gradient(135deg,#1D9E75,#00f0ff)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
              {submitting ? 'Evaluating...' : `Submit ${answeredCount}/${questions.length} →`}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (detailSkill) {
    const color = CATEGORY_COLORS[detailSkill.category] || '#00f0ff';
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
        <button onClick={() => setDetailSkill(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#00f0ff', fontSize: 14, marginBottom: 16 }}>← All Skills</button>

        <div style={{ background: '#070f1f', border: `1px solid ${color}25`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color, letterSpacing: 2, marginBottom: 8 }}>MASTERY TRIALS</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: '#e8e8ed', marginBottom: 4 }}>{detailSkill.name}</div>
          <div style={{ color: '#5a7a9a', fontSize: 13 }}>{detailSkill.category} · 3 levels · 45 total questions</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {detailSkill.levels.map(lvl => {
            const info = LEVEL_INFO[lvl.level];
            const badge = BADGES[lvl.badge] || null;
            const locked = !lvl.unlocked;
            const isVerified = lvl.status === 'verified' && !lvl.isExpired;
            const isExpired = lvl.isExpired;

            return (
              <div key={lvl.level} style={{ background: '#070f1f', border: `2px solid ${isVerified ? (badge?.color || '#1D9E75') + '50' : isExpired ? 'rgba(239,159,39,0.3)' : locked ? 'rgba(255,255,255,0.04)' : 'rgba(0,240,255,0.15)'}`, borderRadius: 14, padding: 20, opacity: locked ? 0.5 : 1, position: 'relative', overflow: 'hidden' }}>
                {isVerified && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${badge?.color},transparent)` }} />}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ fontSize: 36 }}>{isVerified ? (badge?.icon || '✅') : isExpired ? '⚠️' : locked ? '🔒' : '○'}</div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#e8e8ed' }}>
                        Level {lvl.level} — {info.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>
                        15 questions · Pass {info.passScore}%+ · +{info.points} pts
                      </div>
                    </div>
                  </div>
                  {isVerified && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: badge?.color, fontFamily: 'var(--font-heading)' }}>{lvl.score}%</div>
                      <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>
                        Expires {new Date(lvl.expiresAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  )}
                </div>

                {isExpired && (
                  <div style={{ padding: '8px 12px', background: 'rgba(239,159,39,0.08)', borderRadius: 8, fontSize: 12, color: '#EF9F27', marginBottom: 12 }}>
                    ⚠️ Badge expired. Retake to renew.
                  </div>
                )}

                {locked ? (
                  <div style={{ fontSize: 12, color: '#5a7a9a' }}>🔒 Pass Level {lvl.level - 1} first</div>
                ) : lvl.status === 'failed' ? (
                  <div style={{ fontSize: 12, color: '#ff2d78' }}>❌ Maximum attempts reached</div>
                ) : (
                  <button onClick={() => startLevel(detailSkill, lvl.level)} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer', background: isVerified && !isExpired ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: isVerified && !isExpired ? '#5a7a9a' : '#020812', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>
                    {isVerified && !isExpired ? 'Already Earned' : isExpired ? 'Renew Badge →' : lvl.attempts > 0 ? `Attempt ${lvl.attempts + 1}/3 →` : 'Start Level →'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {detailSkill.allPassed && (
          <div style={{ marginTop: 20, padding: 20, background: 'linear-gradient(135deg,rgba(255,215,0,0.08),rgba(192,192,192,0.03))', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: '#ffd700', marginBottom: 4 }}>Master of {detailSkill.name}</div>
            <div style={{ fontSize: 13, color: '#c8d8e8' }}>All 3 levels passed. +140 total pts earned.</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)', width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: '#e8e8ed', marginBottom: 4 }}>⚒️ Mastery Trials</h1>
        <p style={{ color: '#5a7a9a', fontSize: 13 }}>3 levels. 45 questions per skill. Earn Bronze, Silver, Gold badges. Renew every 3 months.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Master Skills', value: stats.masterCount, color: '#ffd700', icon: '🏆' },
          { label: 'Total Badges', value: stats.totalBadges, color: '#00f0ff', icon: '🎖️' },
          { label: 'Pass Scores', value: '85/87/90%', color: '#EF9F27', icon: '🎯' },
          { label: 'Badge Expiry', value: '3 months', color: '#ff6b4a', icon: '⏰' },
        ].map(s => (
          <div key={s.label} style={{ background: '#070f1f', border: `1px solid ${s.color}15`, borderRadius: 12, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#5a7a9a', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 600, background: filter === cat ? '#00f0ff' : 'rgba(255,255,255,0.05)', color: filter === cat ? '#020812' : '#5a7a9a' }}>
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
        {filtered.map((skill, i) => {
          const color = CATEGORY_COLORS[skill.category] || '#00f0ff';
          return (
            <div key={i} onClick={() => setDetailSkill(skill)} style={{ background: '#070f1f', border: `2px solid ${skill.allPassed ? '#ffd700' + '40' : skill.highestPassed > 0 ? color + '30' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, padding: '18px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              {skill.allPassed && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#ffd700,transparent)' }} />}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${color}15`, color, fontFamily: 'var(--font-mono)' }}>{skill.category}</span>
                {skill.allPassed && <span style={{ fontSize: 16 }}>🏆</span>}
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#e8e8ed', marginBottom: 10 }}>{skill.name}</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {skill.levels.map(lvl => {
                  const badge = BADGES[lvl.badge];
                  const active = lvl.status === 'verified' && !lvl.isExpired;
                  return (
                    <div key={lvl.level} style={{ flex: 1, padding: '6px 4px', borderRadius: 6, background: active ? (badge?.color || '#1D9E75') + '15' : lvl.isExpired ? 'rgba(239,159,39,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? (badge?.color || '#1D9E75') + '30' : 'rgba(255,255,255,0.04)'}`, textAlign: 'center' }}>
                      <div style={{ fontSize: 14 }}>{active ? badge?.icon : lvl.isExpired ? '⚠️' : lvl.unlocked ? '○' : '🔒'}</div>
                      <div style={{ fontSize: 9, color: active ? badge?.color : '#5a7a9a', fontFamily: 'var(--font-mono)', marginTop: 2 }}>L{lvl.level}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>
                {skill.highestPassed}/3 levels passed →
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
