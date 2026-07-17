'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch, apiFetchWithTimeout } from '@/lib/useApi';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ErrorCard, { friendlyError } from '@/components/ui/ErrorCard';

const MIN_CHARS = 200;

function scoreColor(score) {
  if (score >= 70) return '#1D9E75';
  if (score >= 40) return '#EF9F27';
  return '#ff2d78';
}

function scoreVerdict(score) {
  if (score >= 80) return 'Strong — this resume should pass most ATS filters';
  if (score >= 70) return 'Good — a few fixes away from strong';
  if (score >= 55) return 'Average — recruiters may skim past it';
  if (score >= 40) return 'Weak — likely filtered out for competitive roles';
  return 'Critical — needs a rework before you apply';
}

const card = { background: '#070f1f', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 14, padding: 20 };
const label = { fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: '#5a7a9a', fontWeight: 600, marginBottom: 10 };
const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,217,163,0.16)',
  background: '#030a16', color: '#e8e8ed', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable (http/permissions) — button just doesn't confirm */ }
  };
  return (
    <button
      onClick={copy}
      style={{
        padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)',
        border: `1px solid ${copied ? 'rgba(0,217,163,0.5)' : 'rgba(0,217,163,0.22)'}`,
        background: copied ? 'rgba(0,217,163,0.12)' : 'transparent',
        color: '#00d9a3', whiteSpace: 'nowrap',
      }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function SectionTitle({ icon, children, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 17 }}>{icon}</span>
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#e8e8ed' }}>{children}</span>
      {count != null && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 10 }}>{count}</span>
      )}
    </div>
  );
}

export default function ResumeAtsPage() {
  const { token, ready } = useToken();
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyAvailable, setHistoryAvailable] = useState(false);

  // Prefill target company from the profile + load past analyses. Both are
  // nice-to-haves — failures here never block the main flow.
  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/auth/profile', token)
      .then(r => {
        const companies = r?.data?.user?.target_companies;
        if (Array.isArray(companies) && companies.length) {
          setTargetCompany(prev => prev || companies.slice(0, 3).join(', '));
        }
      })
      .catch(() => {});
    loadHistory();
  }, [ready, token]);

  async function loadHistory() {
    try {
      const r = await apiFetch('/api/resume/analyze', token);
      setHistoryAvailable(r?.data?.available === true);
      setHistory(r?.data?.analyses || []);
    } catch { /* history is optional */ }
  }

  async function analyze() {
    setError(null);
    setLoading(true);
    try {
      const r = await apiFetchWithTimeout('/api/resume/analyze', token, 'POST', {
        resumeText, targetRole, targetCompany,
      }, 45000);
      setAnalysis(r?.data?.analysis || null);
      if (r?.data?.saved) loadHistory();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(friendlyError(e, 'analyze your resume'));
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return <LoadingSkeleton variant="page" />;
  if (loading) return <LoadingSkeleton variant="page" label="GENOIS Engine is auditing your resume against ATS filters…" />;

  if (error) return (
    <ErrorCard
      icon="📄"
      title="Analysis failed"
      message={error}
      primaryLabel="↻ Retry"
      onPrimary={analyze}
      secondaryLabel="← Back to editor"
      onSecondary={() => setError(null)}
    />
  );

  const tooShort = resumeText.trim().length > 0 && resumeText.trim().length < MIN_CHARS;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: '#e8e8ed', marginBottom: 4 }}>📄 Resume ATS Breakdown</h1>
      <p style={{ color: '#5a7a9a', fontSize: 13, marginBottom: 24 }}>
        Paste your resume text and get an honest ATS score, missing keywords, and stronger rewrites of your weakest bullets.
      </p>

      {!analysis && (
        <>
          <div style={{ ...card, marginBottom: 14 }}>
            <div style={label}>RESUME TEXT</div>
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder={'Paste the full text of your resume here — select all in your PDF/doc and copy.\n\nInclude every section: education, skills, projects, experience, achievements.'}
              rows={14}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, minHeight: 260 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: tooShort ? '#EF9F27' : '#37475a' }}>
                {tooShort ? `Need at least ${MIN_CHARS} characters of resume text` : `${resumeText.trim().length.toLocaleString()} characters`}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#37475a' }}>text only · PDF upload coming later</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginBottom: 18 }}>
            <div style={card}>
              <div style={label}>TARGET ROLE (OPTIONAL)</div>
              <input
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. SDE-1, Data Analyst, Frontend Engineer"
                maxLength={80}
                style={inputStyle}
              />
            </div>
            <div style={card}>
              <div style={label}>TARGET COMPANY (OPTIONAL)</div>
              <input
                value={targetCompany}
                onChange={e => setTargetCompany(e.target.value)}
                placeholder="e.g. Amazon, TCS Digital, Zoho"
                maxLength={80}
                style={inputStyle}
              />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#37475a', marginTop: 6 }}>prefilled from your profile — edit freely</div>
            </div>
          </div>

          <button
            onClick={analyze}
            disabled={resumeText.trim().length < MIN_CHARS}
            style={{
              width: '100%', padding: 15, borderRadius: 12, border: 'none',
              cursor: resumeText.trim().length < MIN_CHARS ? 'not-allowed' : 'pointer',
              background: resumeText.trim().length < MIN_CHARS
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg,#00d9a3,#2ee6b0)',
              color: resumeText.trim().length < MIN_CHARS ? '#5a7a9a' : '#020812',
              fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15,
            }}
          >
            🔍 Analyze My Resume
          </button>

          {historyAvailable && history.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <SectionTitle icon="🗂" count={history.length}>Past analyses</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map(h => (
                  <button
                    key={h.id}
                    onClick={() => { if (h.analysis?.ats_score != null) { setAnalysis(h.analysis); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer',
                      background: '#070f1f', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 12, padding: '12px 16px',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: scoreColor(h.ats_score) }}>{h.ats_score}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#e8e8ed', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.target_role || 'General analysis'}{h.target_company ? ` · ${h.target_company}` : ''}
                      </div>
                      <div style={{ color: '#5a7a9a', fontSize: 10, fontFamily: 'var(--font-mono)', marginTop: 2 }}>{new Date(h.created_at).toLocaleString()}</div>
                    </div>
                    <span style={{ color: '#00d9a3', fontSize: 14 }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {analysis && (
        <>
          {/* SCORE HEADER */}
          <div style={{ ...card, display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14, border: `1px solid ${scoreColor(analysis.ats_score)}44` }}>
            <div style={{ textAlign: 'center', minWidth: 110 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 52, fontWeight: 800, lineHeight: 1, color: scoreColor(analysis.ats_score) }}>
                {analysis.ats_score}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: '#5a7a9a', marginTop: 6 }}>ATS SCORE / 100</div>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#e8e8ed', marginBottom: 6 }}>
                {scoreVerdict(analysis.ats_score)}
              </div>
              <div style={{ fontSize: 13, color: '#c8d8e8', lineHeight: 1.65 }}>{analysis.score_explanation}</div>
              {(analysis.target_role || analysis.target_company) && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', marginTop: 10 }}>
                  scored against: {[analysis.target_role, analysis.target_company].filter(Boolean).join(' @ ')}
                </div>
              )}
            </div>
          </div>

          {/* MISSING KEYWORDS */}
          {analysis.missing_keywords?.length > 0 && (
            <div style={{ ...card, marginBottom: 14 }}>
              <SectionTitle icon="🔑" count={analysis.missing_keywords.length}>Missing keywords</SectionTitle>
              <div style={{ fontSize: 12.5, color: '#5a7a9a', marginBottom: 12, lineHeight: 1.6 }}>
                Terms recruiters and ATS filters expect for this role that your resume doesn&apos;t surface. Only add ones you can honestly back up.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {analysis.missing_keywords.map((k, i) => (
                  <span key={i} style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(239,159,39,0.08)', border: '1px solid rgba(239,159,39,0.3)', color: '#EF9F27', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* WEAK BULLETS: BEFORE → AFTER */}
          {analysis.weak_bullets?.length > 0 && (
            <div style={{ ...card, marginBottom: 14 }}>
              <SectionTitle icon="✍️" count={analysis.weak_bullets.length}>Weak bullets — rewritten</SectionTitle>
              <div style={{ fontSize: 12.5, color: '#5a7a9a', marginBottom: 14, lineHeight: 1.6 }}>
                Numbers in [brackets] are placeholders — replace them with your real figures before using a rewrite.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {analysis.weak_bullets.map((b, i) => (
                  <div key={i} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(255,45,120,0.05)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: '#ff2d78', marginBottom: 6 }}>BEFORE</div>
                      <div style={{ fontSize: 13, color: '#8b9bb0', lineHeight: 1.6 }}>{b.original}</div>
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(0,217,163,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 10 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: '#00d9a3' }}>AFTER</span>
                        <CopyButton text={b.rewritten} />
                      </div>
                      <div style={{ fontSize: 13, color: '#e8e8ed', lineHeight: 1.6, fontWeight: 500 }}>{b.rewritten}</div>
                      {b.why && <div style={{ fontSize: 11.5, color: '#5a7a9a', marginTop: 8, lineHeight: 1.5 }}>💬 {b.why}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MISSING IMPACT */}
          {analysis.missing_impact?.length > 0 && (
            <div style={{ ...card, marginBottom: 14 }}>
              <SectionTitle icon="📊" count={analysis.missing_impact.length}>Bullets missing measurable impact</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {analysis.missing_impact.map((m, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 13, color: '#8b9bb0', lineHeight: 1.6, marginBottom: 6 }}>&ldquo;{m.bullet}&rdquo;</div>
                    <div style={{ fontSize: 12.5, color: '#c8d8e8', lineHeight: 1.55 }}>💡 {m.suggestion}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FORMATTING FLAGS */}
          {analysis.formatting_flags?.length > 0 && (
            <div style={{ ...card, marginBottom: 14 }}>
              <SectionTitle icon="⚠️" count={analysis.formatting_flags.length}>Formatting risks for ATS parsers</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {analysis.formatting_flags.map((f, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,159,39,0.04)', border: '1px solid rgba(239,159,39,0.18)' }}>
                    <div style={{ fontSize: 13, color: '#e8e8ed', fontWeight: 600, marginBottom: 4 }}>{f.issue}</div>
                    <div style={{ fontSize: 12.5, color: '#c8d8e8', lineHeight: 1.55 }}>→ {f.fix}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.missing_keywords?.length === 0 && analysis.weak_bullets?.length === 0 &&
            analysis.missing_impact?.length === 0 && analysis.formatting_flags?.length === 0 && (
            <div style={{ ...card, textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>✨</div>
              <div style={{ color: '#e8e8ed', fontSize: 14, fontWeight: 600 }}>No specific issues found</div>
              <div style={{ color: '#5a7a9a', fontSize: 12.5, marginTop: 6 }}>The analyzer didn&apos;t flag keywords, bullets, or formatting — the score explanation above is the full picture.</div>
            </div>
          )}

          <button
            onClick={() => { setAnalysis(null); setError(null); }}
            style={{
              width: '100%', padding: 14, borderRadius: 12, cursor: 'pointer',
              border: '1px solid rgba(0,217,163,0.25)', background: 'transparent',
              color: '#00d9a3', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
            }}
          >
            ← Edit resume & re-analyze
          </button>
        </>
      )}
    </div>
  );
}
