'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToken, apiFetch } from '@/lib/useApi';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ErrorCard, { friendlyError } from '@/components/ui/ErrorCard';

const TYPE_META = {
  dsa_diagnostic:  { icon: '🎯', label: 'DSA Diagnostic' },
  aptitude:        { icon: '🧠', label: 'Aptitude' },
  daily:           { icon: '📝', label: 'Daily Test' },
  weekly:          { icon: '📅', label: 'Weekly Test' },
  monthly:         { icon: '🗓', label: 'Monthly Test' },
  revision:        { icon: '🔁', label: 'Revision Test' },
  voice_interview: { icon: '🎙', label: 'Voice Interview' },
};

function scoreColor(score) {
  if (score >= 70) return 'var(--gx-success)';
  if (score >= 40) return 'var(--gx-warning)';
  return 'var(--gx-danger)';
}

export default function ReviewListPage() {
  const { token, ready } = useToken();
  const [attempts, setAttempts] = useState([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ready || !token) return;
    load();
  }, [ready, token]);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const r = await apiFetch('/api/review', token);
      setAvailable(r?.data?.available !== false);
      setAttempts(r?.data?.attempts || []);
    } catch (e) {
      setError(friendlyError(e, 'load your attempt history'));
    } finally {
      setLoading(false);
    }
  }

  if (!ready || loading) return <LoadingSkeleton variant="cards" label="Loading your attempt history…" />;

  if (error) return (
    <ErrorCard title="Couldn't load reviews" message={error} primaryLabel="↻ Retry" onPrimary={load} />
  );

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 4 }}>📋 Answer Review</h1>
      <p style={{ color: 'var(--gx-text-muted)', fontSize: 13, marginBottom: 24 }}>Every test you take is saved here — see what you got wrong and why.</p>

      {(!available || attempts.length === 0) && (
        <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🗂</div>
          <div style={{ color: 'var(--gx-text)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No reviewable attempts yet</div>
          <div style={{ color: 'var(--gx-text-muted)', fontSize: 13, lineHeight: 1.6 }}>
            {available
              ? 'Take a test, aptitude session, or diagnostic — full answer reviews will appear here.'
              : 'Review data isn’t available for older attempts. New attempts from now on will be reviewable here.'}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {attempts.map(a => {
          const meta = TYPE_META[a.attempt_type] || { icon: '📄', label: a.attempt_type };
          return (
            <Link key={a.id} href={`/review/${a.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: '14px 18px', cursor: 'pointer' }}>
                <span style={{ fontSize: 22 }}>{meta.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--gx-text)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-heading)' }}>
                    {meta.label}{a.topic ? ` · ${a.topic}` : ''}
                  </div>
                  <div style={{ color: 'var(--gx-text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {new Date(a.taken_at).toLocaleString()} · {a.correct_count}/{a.total_questions} correct
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: scoreColor(a.score) }}>
                  {a.score}%
                </div>
                <span style={{ color: 'var(--gx-accent)', fontSize: 14 }}>→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
