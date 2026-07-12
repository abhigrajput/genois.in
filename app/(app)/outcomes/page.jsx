'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function OutcomesPage() {
  const { token, ready } = useToken();
  const [outcomes, setOutcomes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    gotInterview: false,
    passedInterview: false,
    gotJob: false,
    companyName: '',
    ctcLpa: '',
    notes: '',
  });

  useEffect(() => {
    if (!ready || !token) return;
    Promise.all([
      apiFetch('/api/outcomes', token),
      apiFetch('/api/outcomes/stats', token),
    ]).then(([o, s]) => {
      setOutcomes(o.data?.outcomes || []);
      setStats(s.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [ready, token]);

  async function submit() {
    setSubmitting(true);
    try {
      await apiFetch('/api/outcomes', token, 'POST', {
        ...form,
        ctcLpa: parseFloat(form.ctcLpa) || 0,
      });
      toast.success('Outcome recorded! Thank you for helping us track data.');
      setShowForm(false);
      setForm({ gotInterview: false, passedInterview: false, gotJob: false, companyName: '', ctcLpa: '', notes: '' });
      const [o, s] = await Promise.all([
        apiFetch('/api/outcomes', token),
        apiFetch('/api/outcomes/stats', token),
      ]);
      setOutcomes(o.data?.outcomes || []);
      setStats(s.data);
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  }

  if (loading) return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>Loading...</div>
  );

  return (
    <div style={{ fontFamily: 'var(--font-body)', width: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 4 }}>
          📊 Outcome Tracker
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 13 }}>
          Got an interview or job? Tell us. Help us prove GENOIS works.
        </p>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Reports', value: stats.total, color: '#00d9a3' },
            { label: 'Got Interview', value: stats.interviews, color: '#ff6b4a' },
            { label: 'Got Hired', value: stats.hired, color: '#1D9E75' },
            { label: 'Avg CTC', value: stats.avgCTC > 0 ? stats.avgCTC + ' LPA' : 'N/A', color: '#EF9F27' },
            { label: 'Interview Rate', value: stats.interviewRate + '%', color: '#ff2d78' },
            { label: 'Hire Rate', value: stats.hireRate + '%', color: '#378ADD' },
          ].map(s => (
            <div key={s.label} style={{ background: '#070f1f', border: `1px solid ${s.color}20`, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#5a7a9a', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {stats?.correlationData && stats.correlationData.some(d => d.total > 0) && (
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00d9a3', letterSpacing: 2, marginBottom: 16 }}>
            GENOIS SCORE vs INTERVIEW SUCCESS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
            {stats.correlationData.map((d, i) => (
              <div key={i} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00d9a3', marginBottom: 8 }}>Score {d.range}</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: '#1D9E75', marginBottom: 2 }}>{d.interviewRate}%</div>
                <div style={{ fontSize: 11, color: '#5a7a9a' }}>interview rate</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#EF9F27', marginTop: 8, marginBottom: 2 }}>{d.hireRate}%</div>
                <div style={{ fontSize: 11, color: '#5a7a9a' }}>hire rate</div>
                <div style={{ fontSize: 10, color: '#3a4a5a', marginTop: 6, fontFamily: 'var(--font-mono)' }}>{d.total} reports</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, marginBottom: 24 }}>
        + Report an Interview or Job Outcome →
      </button>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.2)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 500 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: '#e8e8ed', marginBottom: 4 }}>Report Outcome</div>
            <div style={{ fontSize: 13, color: '#5a7a9a', marginBottom: 24 }}>Help us prove GENOIS works. Takes 30 seconds.</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'gotInterview', label: 'I got an interview call' },
                { key: 'passedInterview', label: 'I passed the interview' },
                { key: 'gotJob', label: 'I got a job offer' },
              ].map(f => (
                <div key={f.key} onClick={() => setForm(p => ({ ...p, [f.key]: !p[f.key] }))} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: `1px solid ${form[f.key] ? 'rgba(0,217,163,0.4)' : 'rgba(255,255,255,0.08)'}`, background: form[f.key] ? 'rgba(0,217,163,0.06)' : 'transparent', cursor: 'pointer' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${form[f.key] ? '#00d9a3' : '#3a4a5a'}`, background: form[f.key] ? '#00d9a3' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {form[f.key] && <span style={{ color: '#020812', fontSize: 12, fontWeight: 800 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 14, color: form[f.key] ? '#e8e8ed' : '#5a7a9a' }}>{f.label}</span>
                </div>
              ))}

              <div>
                <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>COMPANY NAME</div>
                <input value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} placeholder="e.g. TCS, Infosys, Startup name..." style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0,217,163,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8e8ed', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {form.gotJob && (
                <div>
                  <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>CTC OFFERED (LPA)</div>
                  <input type="number" value={form.ctcLpa} onChange={e => setForm(p => ({ ...p, ctcLpa: e.target.value }))} placeholder="e.g. 4.5" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0,217,163,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8e8ed', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              )}

              <div>
                <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>ANYTHING ELSE TO SHARE?</div>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Did GENOIS help? What worked? What could be better?" rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0,217,163,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8e8ed', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13 }}>Cancel</button>
              <button onClick={submit} disabled={submitting} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>
                {submitting ? 'Submitting...' : 'Submit Outcome →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {outcomes.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 14 }}>YOUR REPORTED OUTCOMES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {outcomes.map((o, i) => (
              <div key={i} style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.08)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8ed', marginBottom: 4 }}>
                    {o.company_name || 'Company not specified'}
                    {o.got_job && <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 20, background: 'rgba(29,158,117,0.15)', color: '#1D9E75', fontSize: 11, fontFamily: 'var(--font-mono)' }}>HIRED</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>
                    Score at time: {o.genois_score_at_time} pts · {new Date(o.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {o.ctc_lpa > 0 && (
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: '#1D9E75' }}>{o.ctc_lpa} LPA</div>
                  )}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
                    {o.got_interview && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: 'rgba(255,107,74,0.15)', color: '#ff6b4a', fontFamily: 'var(--font-mono)' }}>INTERVIEW</span>}
                    {o.passed_interview && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: 'rgba(0,217,163,0.1)', color: '#00d9a3', fontFamily: 'var(--font-mono)' }}>PASSED</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
