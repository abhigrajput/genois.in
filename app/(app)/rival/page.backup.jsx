'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import { useRouter } from 'next/navigation';

export default function RivalPage() {
  const { token, ready } = useToken();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/enemy', token)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ready, token]);

  if (loading) return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
      Identifying your rival...
    </div>
  );

  if (data?.isTopRanked) return (
    <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'var(--font-body)', textAlign: 'center', paddingTop: 60 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>👑</div>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: '#EF9F27', marginBottom: 12 }}>
        You are #1
      </h1>
      <p style={{ color: '#5a7a9a', fontSize: 15, marginBottom: 8 }}>No one is ahead of you right now.</p>
      <p style={{ color: '#3a4a5a', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
        Your score: {data?.myScore} pts · Keep grinding or someone will take your spot.
      </p>
    </div>
  );

  const e = data?.enemy;
  if (!e) return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center' }}>No rival found yet.</div>
  );

  const domainColors = {
    cloud: '#378ADD', fullstack: '#7F77DD', dsa: '#1D9E75',
    ml: '#D85A30', ai: '#BA7517', ds: '#378ADD',
    cybersec: '#D4537E', mobile: '#E24B4A', devops: '#888780', sysdesign: '#534AB7',
  };
  const enemyColor = domainColors[e.domain?.toLowerCase()] || '#ff2d78';

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', fontFamily: 'var(--font-body)' }}>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 4 }}>
          🎯 Your Rival
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 13 }}>
          This is the one person standing between you and a higher rank.
        </p>
      </div>

      {/* YOU VS THEM */}
      <div style={{ background: '#070f1f', border: '1px solid rgba(255,45,120,0.2)', borderRadius: 16, padding: 24, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#ff2d78,transparent)' }} />

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ff2d78', letterSpacing: 2, marginBottom: 20 }}>
          ⚔️ STANDING BETWEEN YOU AND RANK #{data?.myRank - 1}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 20 }}>
          {/* YOU */}
          <div style={{ textAlign: 'center', padding: 16, background: 'rgba(0,240,255,0.04)', borderRadius: 12, border: '1px solid rgba(0,240,255,0.15)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#5a7a9a', letterSpacing: 1, marginBottom: 8 }}>YOU</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: '#00f0ff', marginBottom: 4 }}>{data?.myScore}</div>
            <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>Rank #{data?.myRank}</div>
          </div>

          {/* VS */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: '#ff2d78' }}>VS</div>
            <div style={{ fontSize: 10, color: '#3a4a5a', fontFamily: 'var(--font-mono)', marginTop: 4 }}>+{e.scoreDiff} pts behind</div>
          </div>

          {/* RIVAL */}
          <div style={{ textAlign: 'center', padding: 16, background: 'rgba(255,45,120,0.04)', borderRadius: 12, border: '1px solid rgba(255,45,120,0.15)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#5a7a9a', letterSpacing: 1, marginBottom: 8 }}>RIVAL</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: '#ff2d78', marginBottom: 4 }}>{e.score}</div>
            <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>Rank #{e.rank}</div>
          </div>
        </div>

        {/* Gap indicator */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#e8e8ed', fontWeight: 600, marginBottom: 4 }}>
            You need <span style={{ color: '#ff2d78', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>{e.scoreDiff} more points</span> to overtake {e.name}
          </div>
          <div style={{ fontSize: 12, color: '#5a7a9a' }}>
            Complete {e.gapToClose} more daily tasks to catch up
          </div>
        </div>
      </div>

      {/* RIVAL PROFILE */}
      <div style={{ background: '#070f1f', border: `1px solid ${enemyColor}15`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 16 }}>
          RIVAL PROFILE
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: '#e8e8ed', marginBottom: 4 }}>
              {e.name}
            </div>
            <div style={{ fontSize: 13, color: '#5a7a9a', marginBottom: 8 }}>{e.college}</div>
            <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: `${enemyColor}12`, border: `1px solid ${enemyColor}25`, color: enemyColor, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              {e.domain?.toUpperCase()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {e.activeToday ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1D9E75', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1D9E75' }} />
                Active today
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#3a4a5a', fontFamily: 'var(--font-mono)' }}>
                Not active today
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10 }}>
          {[
            { label: 'Score', value: e.score, color: '#ff2d78' },
            { label: 'Streak', value: `🔥${e.streak}d`, color: '#EF9F27' },
            { label: 'Day', value: e.currentDay, color: '#ff6b4a' },
            { label: 'Avg Test', value: `${e.avgTestScore}%`, color: '#1D9E75' },
            { label: 'Job Ready', value: `${e.jobReady}%`, color: '#00f0ff' },
            { label: 'Tasks Today', value: `${e.tasksToday}/5`, color: '#378ADD' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '12px 14px', textAlign: 'center', border: `1px solid ${s.color}12` }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* STRATEGY TO BEAT THEM */}
      <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00f0ff', letterSpacing: 2, marginBottom: 16 }}>
          HOW TO BEAT {e.name.toUpperCase()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              icon: '🎯',
              title: 'Complete all 5 daily tasks',
              desc: `Each full day gives you ~80 pts. You need ${e.gapToClose} more complete days to overtake them.`,
              color: '#00f0ff',
            },
            {
              icon: '📊',
              title: 'Score higher on daily tests',
              desc: `Their avg test score is ${e.avgTestScore}%. Beat that consistently and you close the gap faster.`,
              color: '#ff6b4a',
            },
            {
              icon: '🔥',
              title: e.activeToday ? 'They are active today — do not fall further behind' : 'They are not active today — attack now',
              desc: e.activeToday
                ? 'They are grinding right now. Every hour you wait they pull further ahead.'
                : 'They skipped today. This is your chance to close the gap.',
              color: e.activeToday ? '#ff2d78' : '#1D9E75',
            },
            {
              icon: '⚔️',
              title: 'Challenge them to a duel',
              desc: 'Win a duel against them and get 50 bonus points instantly.',
              color: '#EF9F27',
              action: () => router.push('/duels'),
              actionLabel: 'Challenge to Duel →',
            },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: `1px solid ${s.color}12` }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#5a7a9a', lineHeight: 1.6 }}>{s.desc}</div>
                {s.action && (
                  <button onClick={s.action} style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, border: `1px solid ${s.color}40`, background: `${s.color}10`, color: s.color, cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                    {s.actionLabel}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg,rgba(255,45,120,0.06),rgba(239,159,39,0.03))', border: '1px solid rgba(255,45,120,0.15)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: '#e8e8ed', marginBottom: 8 }}>
          {e.name} is {e.scoreDiff} points ahead.
        </div>
        <div style={{ color: '#5a7a9a', fontSize: 14, marginBottom: 20 }}>
          Complete today&apos;s 5 tasks and close that gap right now.
        </div>
        <button onClick={() => router.push('/roadmap')} style={{ padding: '13px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#ff2d78,#EF9F27)', color: '#fff', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, boxShadow: '0 0 20px rgba(255,45,120,0.25)' }}>
          Start Today&apos;s Tasks →
        </button>
      </div>
    </div>
  );
}
