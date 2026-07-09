'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function StreakRewardsPage() {
  const { token, ready } = useToken();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    load();
  }, [ready, token]);

  async function load() {
    try {
      const r = await apiFetch('/api/streak-rewards', token);
      setData(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function claimAll() {
    setClaiming(true);
    try {
      const r = await apiFetch('/api/streak-rewards', token, 'POST');
      toast.success(`Claimed! +${r.data.pointsAdded} points`);
      load();
    } catch (e) { toast.error(e.message); }
    setClaiming(false);
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#5a7a9a' }}>Loading...</div>;
  if (!data) return null;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'var(--font-body)', paddingBottom: 40 }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: '#e8e8ed', marginBottom: 8 }}>
        🔥 Streak Rewards
      </h1>
      <p style={{ color: '#5a7a9a', fontSize: 13, marginBottom: 24 }}>
        Stay consistent. Get rewards. Build the habit.
      </p>

      <div style={{ background: 'linear-gradient(135deg,rgba(239,159,39,0.1),rgba(255,45,120,0.05))', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 14, padding: 24, marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#EF9F27', letterSpacing: 2, marginBottom: 8 }}>CURRENT STREAK</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 56, fontWeight: 900, background: 'linear-gradient(135deg,#EF9F27,#ff2d78)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
          {data.currentStreak}
        </div>
        <div style={{ fontSize: 13, color: '#8a9ab0', marginTop: 6 }}>days</div>
      </div>

      {data.unclaimed.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg,rgba(0,240,255,0.08),rgba(255,107,74,0.04))', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#00f0ff', marginBottom: 12 }}>
            🎁 {data.unclaimed.length} reward{data.unclaimed.length > 1 ? 's' : ''} ready to claim
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {data.unclaimed.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <span style={{ fontSize: 20 }}>{r.icon}</span>
                <span style={{ flex: 1, color: '#e8e8ed', fontSize: 13 }}>Day {r.day} — {r.label}</span>
              </div>
            ))}
          </div>
          <button onClick={claimAll} disabled={claiming} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: claiming ? 'wait' : 'pointer', background: 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
            {claiming ? 'Claiming...' : 'Claim All Rewards →'}
          </button>
        </div>
      )}

      {data.nextReward && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 8 }}>NEXT MILESTONE</div>
          <div style={{ fontSize: 14, color: '#e8e8ed', marginBottom: 4 }}>
            <span style={{ fontSize: 18, marginRight: 8 }}>{data.nextReward.icon}</span>
            Day {data.nextReward.day} — {data.nextReward.label}
          </div>
          <div style={{ fontSize: 12, color: '#8a9ab0', marginTop: 6 }}>
            {data.nextReward.day - data.currentStreak} more day{data.nextReward.day - data.currentStreak !== 1 ? 's' : ''} to go
          </div>
        </div>
      )}

      <div style={{ background: '#070f1f', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 14, padding: 20 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: '#e8e8ed', marginBottom: 14 }}>
          All Milestones
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.allRewards.map((r, i) => {
            const achieved = data.currentStreak >= r.day;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 8, background: achieved ? 'rgba(29,158,117,0.06)' : 'rgba(255,255,255,0.02)', opacity: achieved ? 1 : 0.5 }}>
                <span style={{ fontSize: 20 }}>{r.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#e8e8ed', fontWeight: 600 }}>Day {r.day}</div>
                  <div style={{ fontSize: 11, color: '#8a9ab0' }}>{r.label}</div>
                </div>
                {achieved && <span style={{ color: '#1D9E75', fontSize: 14 }}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
