'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import { useRouter } from 'next/navigation';

const DOMAIN_COLORS = {
  cloud: '#378ADD', fullstack: '#7F77DD', dsa: '#1D9E75',
  ml: '#D85A30', ai: '#BA7517', ds: '#378ADD',
  cybersec: '#D4537E', mobile: '#E24B4A', devops: '#888780', sysdesign: '#534AB7',
};

export default function CorrelationPage() {
  const { token, ready } = useToken();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/correlation', token)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ready, token]);

  if (loading) return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace' }}>
      Loading correlation data...
    </div>
  );

  const s = data?.summary;

  return (
    <div style={{ fontFamily: 'Outfit,sans-serif', width: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>
          📈 Outcome Correlation
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 13 }}>
          Does GENOIS score predict interview success? Here is the data.
        </p>
      </div>

      {data?.keyInsight && (
        <div style={{ background: 'linear-gradient(135deg,rgba(0,240,255,0.06),rgba(123,92,255,0.03))', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 14, padding: 20, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#00f0ff,#7b5cff)' }} />
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00f0ff', letterSpacing: 2, marginBottom: 8 }}>KEY INSIGHT</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: '#e8f4ff' }}>{data.keyInsight}</div>
        </div>
      )}

      {s && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Reports', value: s.totalOutcomes, color: '#00f0ff' },
            { label: 'Interviews', value: s.totalInterviews, color: '#7b5cff' },
            { label: 'Hired', value: s.totalHired, color: '#1D9E75' },
            { label: 'Interview Rate', value: s.interviewRate + '%', color: '#EF9F27' },
            { label: 'Hire Rate', value: s.hireRate + '%', color: '#ff2d78' },
            { label: 'Avg CTC', value: s.avgCTC > 0 ? s.avgCTC + ' LPA' : 'N/A', color: '#378ADD' },
            { label: 'Avg Skill Lift', value: s.avgSkillLift > 0 ? '+' + s.avgSkillLift + '%' : 'N/A', color: '#1D9E75' },
            { label: 'Total Students', value: s.totalStudents, color: '#5a7a9a' },
          ].map(st => (
            <div key={st.label} style={{ background: '#070f1f', border: `1px solid ${st.color}15`, borderRadius: 12, padding: '14px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: st.color }}>{st.value}</div>
              <div style={{ fontSize: 10, color: '#5a7a9a', marginTop: 4, fontFamily: 'JetBrains Mono,monospace' }}>{st.label}</div>
            </div>
          ))}
        </div>
      )}

      {data?.correlationData && (
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00f0ff', letterSpacing: 2, marginBottom: 20 }}>
            GENOIS SCORE vs INTERVIEW SUCCESS RATE
          </div>
          {data.correlationData.every(d => d.total === 0) ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#5a7a9a', fontSize: 14 }}>
              No outcome data yet. Students need to report their interview results.
              <br />
              <button onClick={() => router.push('/outcomes')} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700 }}>
                Report Your Outcome →
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
              {data.correlationData.map((d, i) => (
                <div key={i} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, textAlign: 'center', border: '1px solid rgba(0,240,255,0.06)' }}>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00f0ff', marginBottom: 10 }}>
                    Score {d.range}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#1D9E75' }}>{d.interviewRate}%</div>
                    <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>interview rate</div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#EF9F27' }}>{d.hireRate}%</div>
                    <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>hire rate</div>
                  </div>
                  {d.avgCTC > 0 && (
                    <div>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#378ADD' }}>{d.avgCTC} LPA</div>
                      <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>avg CTC</div>
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: '#3a4a5a', marginTop: 8, fontFamily: 'JetBrains Mono,monospace' }}>
                    {d.total} reports
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {data?.domainBreakdown?.length > 0 && data.domainBreakdown.some(d => d.total > 0) && (
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 16 }}>
            OUTCOMES BY DOMAIN
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.domainBreakdown.filter(d => d.total > 0).map((d, i) => {
              const color = DOMAIN_COLORS[d.domain] || '#5a7a9a';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                  <div style={{ width: 80, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${color}15`, color, fontFamily: 'JetBrains Mono,monospace' }}>
                      {d.domain.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ height: '100%', width: `${d.interviewRate}%`, background: color, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
                      {d.interviewRate}% interview · {d.hireRate}% hire
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color }}>{d.total}</div>
                    <div style={{ fontSize: 10, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace' }}>reports</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data?.topCompanies?.length > 0 && (
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 16 }}>
            TOP HIRING COMPANIES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.topCompanies.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#3a4a5a' }}>#{i + 1}</span>
                  <span style={{ fontSize: 14, color: '#e8f4ff', fontWeight: 600 }}>{c.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#1D9E75', fontFamily: 'JetBrains Mono,monospace' }}>{c.hires} hire{c.hires > 1 ? 's' : ''}</span>
                  {c.avgCTC > 0 && <span style={{ fontSize: 12, color: '#EF9F27', fontFamily: 'JetBrains Mono,monospace' }}>{c.avgCTC} LPA avg</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {s?.skillLiftSamples > 0 && (
        <div style={{ background: '#070f1f', border: '1px solid rgba(29,158,117,0.15)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#1D9E75', letterSpacing: 2, marginBottom: 12 }}>
            SKILL LIFT — DAY 0 vs TODAY
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 36, fontWeight: 800, color: '#1D9E75' }}>+{s.avgSkillLift}%</div>
              <div style={{ fontSize: 12, color: '#5a7a9a' }}>Average skill lift</div>
            </div>
            <div style={{ fontSize: 14, color: '#8a9ab0', lineHeight: 1.7, flex: 1 }}>
              Students who took the diagnostic test on Day 0 show an average skill improvement of <strong style={{ color: '#1D9E75' }}>+{s.avgSkillLift}%</strong> compared to their baseline score. Based on {s.skillLiftSamples} student{s.skillLiftSamples > 1 ? 's' : ''} tracked.
            </div>
          </div>
        </div>
      )}

      <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.06)', borderRadius: 14, padding: 20, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: '#e8f4ff', marginBottom: 8 }}>
          Help us build this data
        </div>
        <div style={{ color: '#5a7a9a', fontSize: 13, marginBottom: 16 }}>
          Got an interview or job offer? Report it. Your data helps prove GENOIS works.
        </div>
        <button onClick={() => router.push('/outcomes')} style={{ padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>
          Report Your Outcome →
        </button>
      </div>
    </div>
  );
}
