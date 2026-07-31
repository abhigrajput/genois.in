'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import { useRouter } from 'next/navigation';

const DOMAIN_COLORS = {
  cloud: 'var(--gx-info)', fullstack: 'var(--gx-info)', dsa: 'var(--gx-success)',
  ml: 'var(--gx-warning)', ai: 'var(--gx-warning)', ds: 'var(--gx-info)',
  cybersec: 'var(--gx-danger)', mobile: 'var(--gx-danger)', devops: 'var(--gx-text-muted)', sysdesign: 'var(--gx-info)',
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
    <div style={{ color: 'var(--gx-text-muted)', padding: 60, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
      Loading correlation data...
    </div>
  );

  const s = data?.summary;

  return (
    <div style={{ fontFamily: 'var(--font-body)', width: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 4 }}>
          📈 Outcome Correlation
        </h1>
        <p style={{ color: 'var(--gx-text-muted)', fontSize: 13 }}>
          Does GENOIS score predict interview success? Here is the data.
        </p>
      </div>

      {data?.keyInsight && (
        <div style={{ background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-accent-border)', borderRadius: 14, padding: 20, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--gx-accent)' }} />
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-accent)', letterSpacing: 2, marginBottom: 8 }}>KEY INSIGHT</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--gx-text)' }}>{data.keyInsight}</div>
        </div>
      )}

      {s && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Reports', value: s.totalOutcomes, color: 'var(--gx-accent)' },
            { label: 'Interviews', value: s.totalInterviews, color: 'var(--gx-warning)' },
            { label: 'Hired', value: s.totalHired, color: 'var(--gx-success)' },
            { label: 'Interview Rate', value: s.interviewRate + '%', color: 'var(--gx-warning)' },
            { label: 'Hire Rate', value: s.hireRate + '%', color: 'var(--gx-danger)' },
            { label: 'Avg CTC', value: s.avgCTC > 0 ? s.avgCTC + ' LPA' : 'N/A', color: 'var(--gx-info)' },
            { label: 'Avg Skill Lift', value: s.avgSkillLift > 0 ? '+' + s.avgSkillLift + '%' : 'N/A', color: 'var(--gx-success)' },
            { label: 'Total Students', value: s.totalStudents, color: 'var(--gx-text-muted)' },
          ].map(st => (
            <div key={st.label} style={{ background: 'var(--gx-bg)', border: `1px solid color-mix(in srgb, ${st.color} 8%, transparent)`, borderRadius: 12, padding: '14px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: st.color }}>{st.value}</div>
              <div style={{ fontSize: 10, color: 'var(--gx-text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{st.label}</div>
            </div>
          ))}
        </div>
      )}

      {data?.correlationData && (
        <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-accent)', letterSpacing: 2, marginBottom: 20 }}>
            GENOIS SCORE vs INTERVIEW SUCCESS RATE
          </div>
          {data.correlationData.every(d => d.total === 0) ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--gx-text-muted)', fontSize: 14 }}>
              No outcome data yet. Students need to report their interview results.
              <br />
              <button onClick={() => router.push('/outcomes')} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>
                Report Your Outcome →
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
              {data.correlationData.map((d, i) => (
                <div key={i} style={{ padding: 16, background: 'var(--gx-surface)', borderRadius: 12, textAlign: 'center', border: '1px solid var(--gx-border)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gx-accent)', marginBottom: 10 }}>
                    Score {d.range}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: 'var(--gx-success)' }}>{d.interviewRate}%</div>
                    <div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>interview rate</div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--gx-warning)' }}>{d.hireRate}%</div>
                    <div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>hire rate</div>
                  </div>
                  {d.avgCTC > 0 && (
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--gx-info)' }}>{d.avgCTC} LPA</div>
                      <div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>avg CTC</div>
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: 'var(--gx-text-subtle)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                    {d.total} reports
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {data?.domainBreakdown?.length > 0 && data.domainBreakdown.some(d => d.total > 0) && (
        <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 2, marginBottom: 16 }}>
            OUTCOMES BY DOMAIN
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.domainBreakdown.filter(d => d.total > 0).map((d, i) => {
              const color = DOMAIN_COLORS[d.domain] || 'var(--gx-text-muted)';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--gx-surface)', borderRadius: 10 }}>
                  <div style={{ width: 80, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `color-mix(in srgb, ${color} 8%, transparent)`, color, fontFamily: 'var(--font-mono)' }}>
                      {d.domain.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 6, background: 'var(--gx-surface)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ height: '100%', width: `${d.interviewRate}%`, background: color, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {d.interviewRate}% interview · {d.hireRate}% hire
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color }}>{d.total}</div>
                    <div style={{ fontSize: 10, color: 'var(--gx-text-subtle)', fontFamily: 'var(--font-mono)' }}>reports</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data?.topCompanies?.length > 0 && (
        <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 2, marginBottom: 16 }}>
            TOP HIRING COMPANIES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.topCompanies.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--gx-surface)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--gx-text-subtle)' }}>#{i + 1}</span>
                  <span style={{ fontSize: 14, color: 'var(--gx-text)', fontWeight: 600 }}>{c.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--gx-success)', fontFamily: 'var(--font-mono)' }}>{c.hires} hire{c.hires > 1 ? 's' : ''}</span>
                  {c.avgCTC > 0 && <span style={{ fontSize: 12, color: 'var(--gx-warning)', fontFamily: 'var(--font-mono)' }}>{c.avgCTC} LPA avg</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {s?.skillLiftSamples > 0 && (
        <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-success-border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-success)', letterSpacing: 2, marginBottom: 12 }}>
            SKILL LIFT — DAY 0 vs TODAY
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 36, fontWeight: 800, color: 'var(--gx-success)' }}>+{s.avgSkillLift}%</div>
              <div style={{ fontSize: 12, color: 'var(--gx-text-muted)' }}>Average skill lift</div>
            </div>
            <div style={{ fontSize: 14, color: 'var(--gx-text-muted)', lineHeight: 1.7, flex: 1 }}>
              Students who took the diagnostic test on Day 0 show an average skill improvement of <strong style={{ color: 'var(--gx-success)' }}>+{s.avgSkillLift}%</strong> compared to their baseline score. Based on {s.skillLiftSamples} student{s.skillLiftSamples > 1 ? 's' : ''} tracked.
            </div>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 20, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 8 }}>
          Help us build this data
        </div>
        <div style={{ color: 'var(--gx-text-muted)', fontSize: 13, marginBottom: 16 }}>
          Got an interview or job offer? Report it. Your data helps prove GENOIS works.
        </div>
        <button onClick={() => router.push('/outcomes')} style={{ padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
          Report Your Outcome →
        </button>
      </div>
    </div>
  );
}
