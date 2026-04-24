'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import { analyticsAPI } from '@/lib/api';
import { useToken, apiFetch } from '@/lib/useApi';
import { getSkillTierData, getNextTier } from '@/lib/skillLevel';

const TASK_META = {
  video:    { label:'Watch Video',       icon:'▶', color:'#7b5cff' },
  resource: { label:'Read Resource',     icon:'📖', color:'#378ADD' },
  coding:   { label:'Coding Challenge',  icon:'{}', color:'#1D9E75' },
  test:     { label:'Daily Test',        icon:'✎', color:'#D4537E' },
  notes:    { label:'AI Notes',          icon:'≡', color:'#378ADD' },
  project:  { label:'Project Step',      icon:'◆', color:'#BA7517' },
};

function Ring({ pct, color, size = 68, label }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ textAlign:'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ * (1 - (pct || 0) / 100)}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ filter:`drop-shadow(0 0 4px ${color}80)`, transition:'stroke-dashoffset 0.8s ease' }} />
        <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill={color}
          fontFamily="JetBrains Mono, monospace">{pct || 0}%</text>
      </svg>
      {label && <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#5a7a9a', marginTop:4, letterSpacing:0.5 }}>{label}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { token, ready } = useToken();
  const [data, setData] = useState(null);
  const [rivalData, setRivalData] = useState(null);
  const [legendData, setLegendData] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [githubData, setGithubData] = useState(null);
  const [showOutcomePopup, setShowOutcomePopup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getDashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/enemy', token).then(r => setRivalData(r.data)).catch(() => {});
    apiFetch('/api/legend', token).then(r => setLegendData(r.data)).catch(() => {});
    apiFetch('/api/streak-token', token).then(r => setTokenData(r.data)).catch(() => {});
    apiFetch('/api/diagnostic', token).then(r => setDiagnosticData(r.data)).catch(() => {});
    apiFetch('/api/github/profile', token).then(r => setGithubData(r.data)).catch(() => {});
    apiFetch('/api/progress/full', token).then(r => {
      if ((r.data?.currentDay || 0) >= 7) {
        const shown = localStorage.getItem('outcome_popup_shown');
        if (!shown) setTimeout(() => setShowOutcomePopup(true), 3000);
      }
    }).catch(() => {});
  }, [ready, token]);

  async function useStreakToken() {
    try {
      await apiFetch('/api/streak-token', token, 'POST', { action: 'use_token' });
      toast.success('Streak saved! Token used. 🛡️');
      const r = await apiFetch('/api/streak-token', token);
      setTokenData(r.data);
    } catch (e) {
      toast.error(e.message);
    }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Student';

  if (loading) return (
    <div style={{ width: '100%', display:'flex', flexDirection:'column', gap:16 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height:100, borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(0,240,255,0.06)', animation:'gentlePulse 1.5s infinite' }} />
      ))}
    </div>
  );

  const { score, progress, skill, today, trial, recentActivity } = data || {};
  const completedCount = today?.tasksCompleted || 0;
  const progressPct = progress?.progressPercent || 0;
  const jobReadyPct = skill?.jobReadyScore || 0;

  const daysCompleted = progress?.currentDay || progress?.current_day || 1;
  const daysRemaining = Math.max(0, 365 - daysCompleted);
  const masteryPercent = Math.min(100, Math.round((daysCompleted / 365) * 100));

  const STATS = [
    { label:'TOTAL SCORE',  value: score?.total_score || 0,     color:'#7b5cff', suffix:'pts' },
    { label:'STREAK',       value: progress?.streak || 0,        color:'#EF9F27', suffix:'d 🔥' },
    { label:'PROGRESS',     value: progressPct,                  color:'#1D9E75', suffix:'%' },
    { label:'JOB READY',    value: jobReadyPct,                  color:'#D85A30', suffix:'%' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: 1600, margin: '0 auto', display:'flex', flexDirection:'column', gap:20 }}>
      {/* Heading */}
      <div>
        <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:800, color:'#e8f4ff', margin:0, lineHeight:1.2 }}>
          {greeting}, <span style={{ color:'#00f0ff' }}>{firstName}</span> 👋
        </h1>
        <p style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#5a7a9a', marginTop:6, letterSpacing:0.5, marginBottom:12 }}>
          DAY {progress?.currentDay || 1} · {completedCount}/6 TASKS DONE TODAY
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {user?.weeklyBadge === 'hire_ready' && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(29,158,117,0.15)',
              border: '1px solid rgba(29,158,117,0.4)',
              color: '#1D9E75',
              fontSize: 11,
              fontFamily: 'JetBrains Mono,monospace',
              fontWeight: 700,
              letterSpacing: 0.5,
            }}>
              ✓ HIRE-READY THIS WEEK
            </div>
          )}
          {user?.weeklyBadge === 'not_ready' && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(255,45,120,0.1)',
              border: '1px solid rgba(255,45,120,0.3)',
              color: '#ff2d78',
              fontSize: 11,
              fontFamily: 'JetBrains Mono,monospace',
              fontWeight: 700,
              letterSpacing: 0.5,
            }}>
              ✗ NOT READY — Grind harder this week
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
        {STATS.map(s => (
          <div key={s.label} className="card" style={{ textAlign:'center', padding:16 }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#5a7a9a', letterSpacing:1, marginBottom:8 }}>{s.label}</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:800, color:s.color, filter:`drop-shadow(0 0 6px ${s.color}50)` }}>
              {s.value}{s.suffix}
            </div>
          </div>
        ))}
      </div>

      {(() => {
        const tier = getSkillTierData(score?.total_score || 0);
        const next = getNextTier(score?.total_score || 0);
        return (
          <div style={{ background: `linear-gradient(135deg,${tier.color}08,transparent)`, border: `1px solid ${tier.color}25`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: next ? 12 : 0, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 44 }}>{tier.icon}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: tier.color, letterSpacing: 2, marginBottom: 4 }}>YOU ARE CLASSIFIED AS</div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: tier.color, marginBottom: 4 }}>{tier.label}</div>
                <div style={{ fontSize: 12, color: '#8a9ab0' }}>{tier.description}</div>
              </div>
            </div>
            {next && (
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>NEXT LEVEL</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: next.color, fontFamily: 'Syne,sans-serif' }}>{next.icon} {next.label}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: '#00f0ff' }}>{next.pointsNeeded} pts</div>
                  <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>to level up</div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {diagnosticData && !diagnosticData.alreadyTaken && (
        <div
          onClick={() => router.push('/diagnostic')}
          style={{
            background: 'linear-gradient(135deg,rgba(0,240,255,0.06),rgba(123,92,255,0.03))',
            border: '2px solid rgba(0,240,255,0.3)',
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 16,
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            animation: 'pulse 2s infinite',
          }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#00f0ff,#7b5cff)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00f0ff', letterSpacing: 2, marginBottom: 6 }}>
                🎯 ACTION REQUIRED
              </div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 800, color: '#e8f4ff', marginBottom: 2 }}>
                Take your baseline diagnostic test
              </div>
              <div style={{ fontSize: 12, color: '#5a7a9a' }}>
                15 questions · 10 minutes · Sets your Day 0 score · One time only
              </div>
            </div>
            <div style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              Start Now →
            </div>
          </div>
        </div>
      )}

      {diagnosticData?.alreadyTaken && (
        <div style={{
          background: '#070f1f',
          border: '1px solid rgba(29,158,117,0.2)',
          borderRadius: 14,
          padding: '14px 20px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#1D9E75', letterSpacing: 2, marginBottom: 4 }}>
              ✓ BASELINE RECORDED
            </div>
            <div style={{ fontSize: 13, color: '#5a7a9a' }}>
              Day 0 diagnostic score: <span style={{ color: '#1D9E75', fontWeight: 700 }}>{diagnosticData.diagnostic?.score}%</span> · {diagnosticData.diagnostic?.skill_level}
            </div>
          </div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: '#1D9E75' }}>
            {diagnosticData.diagnostic?.score}%
          </div>
        </div>
      )}

      <div style={{
        background: '#070f1f',
        border: '1px solid rgba(186,117,23,0.2)',
        borderRadius: 14,
        padding: 20,
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#BA7517,transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#BA7517', letterSpacing: 2, marginBottom: 4 }}>DOMAIN MASTERY</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: '#e8f4ff' }}>
              {daysRemaining === 0 ? '🏆 You are a Master!' : `${daysRemaining} days until you master ${user?.domain_slug?.toUpperCase()}`}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: '#BA7517' }}>{daysRemaining}</div>
            <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>days left</div>
          </div>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', width: masteryPercent + '%', background: 'linear-gradient(90deg,#BA7517,#EF9F27)', borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
          <span>Day {daysCompleted} of 365</span>
          <span>{masteryPercent}% mastered</span>
        </div>
      </div>

      {rivalData && !rivalData.isTopRanked && (
        <div
          onClick={() => router.push('/rival')}
          style={{
            background: '#070f1f',
            border: '1px solid rgba(255,45,120,0.2)',
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 16,
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#ff2d78,transparent)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#ff2d78', letterSpacing: 2, marginBottom: 6 }}>
                🎯 YOUR RIVAL
              </div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: '#e8f4ff', marginBottom: 2 }}>
                {rivalData.enemy?.name} is {rivalData.enemy?.scoreDiff} pts ahead
              </div>
              <div style={{ fontSize: 12, color: '#5a7a9a' }}>
                {rivalData.enemy?.college} · Rank #{rivalData.enemy?.rank}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: '#ff2d78' }}>
                #{rivalData.myRank}
              </div>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>your rank</div>
            </div>
          </div>
        </div>
      )}

      {legendData && !legendData.isLegend && (
        <div
          onClick={() => router.push('/legend')}
          style={{
            background: 'linear-gradient(135deg,rgba(123,92,255,0.06),rgba(0,240,255,0.02))',
            border: '1px solid rgba(123,92,255,0.2)',
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 16,
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#7b5cff,transparent)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#7b5cff', letterSpacing: 2, marginBottom: 6 }}>
                {legendData.isEligible ? '👑 LEGEND UNLOCKED' : '🔒 LEGEND PLAN'}
              </div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: '#e8f4ff', marginBottom: 2 }}>
                {legendData.isEligible
                  ? 'You earned Legend Access. Claim it now.'
                  : `${legendData.pointsNeeded} pts to unlock Legend Access`}
              </div>
              <div style={{ fontSize: 12, color: '#5a7a9a' }}>
                {legendData.isEligible ? '₹999/month — Direct recruiter introductions' : `${legendData.progressPercent}% of the way there`}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: '#7b5cff' }}>
                {legendData.progressPercent}%
              </div>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>to legend</div>
            </div>
          </div>
          {!legendData.isEligible && (
            <div style={{ marginTop: 10, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${legendData.progressPercent}%`, background: 'linear-gradient(90deg,#7b5cff,#00f0ff)', borderRadius: 2 }} />
            </div>
          )}
        </div>
      )}

      {githubData && !githubData.connected && (
        <div
          onClick={() => router.push('/github')}
          style={{
            background: '#070f1f',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: '14px 20px',
            marginBottom: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 4 }}>
              🐙 GITHUB NOT CONNECTED
            </div>
            <div style={{ fontSize: 13, color: '#5a7a9a' }}>
              Connect GitHub to show real code activity to recruiters
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#00f0ff', fontFamily: 'Syne,sans-serif', fontWeight: 600, flexShrink: 0 }}>
            Connect →
          </div>
        </div>
      )}

      {githubData?.connected && (
        <div
          onClick={() => router.push('/github')}
          style={{
            background: '#070f1f',
            border: '1px solid rgba(0,240,255,0.1)',
            borderRadius: 14,
            padding: '14px 20px',
            marginBottom: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#1D9E75', letterSpacing: 2, marginBottom: 4 }}>
              🐙 GITHUB CONNECTED
            </div>
            <div style={{ fontSize: 13, color: '#5a7a9a' }}>
              @{githubData.username} · {githubData.repos} repos · ⭐{githubData.stars}
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#00f0ff', fontFamily: 'Syne,sans-serif', fontWeight: 600, flexShrink: 0 }}>
            View →
          </div>
        </div>
      )}

      {tokenData && (tokenData.tokens > 0 || tokenData.canUseToken) && (
        <div style={{
          background: '#070f1f',
          border: `1px solid ${tokenData.canUseToken ? 'rgba(239,159,39,0.4)' : 'rgba(239,159,39,0.15)'}`,
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 16,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#EF9F27,transparent)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#EF9F27', letterSpacing: 2, marginBottom: 6 }}>
                🛡️ STREAK INSURANCE
              </div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: '#e8f4ff', marginBottom: 2 }}>
                {tokenData.canUseToken
                  ? 'Your streak is at risk! Use your token to save it.'
                  : `${tokenData.tokens} token${tokenData.tokens > 1 ? 's' : ''} available`}
              </div>
              <div style={{ fontSize: 12, color: '#5a7a9a' }}>
                {tokenData.canUseToken
                  ? 'Token will mark yesterday as completed and save your streak.'
                  : 'Score 100% on weekly test to earn more tokens.'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: '#EF9F27' }}>
                  {tokenData.tokens}
                </div>
                <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>tokens</div>
              </div>
              {tokenData.canUseToken && (
                <button onClick={useStreakToken} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#EF9F27,#BA7517)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700 }}>
                  Use Token 🛡️
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aptitude Card */}
      <div onClick={() => router.push('/aptitude')} style={{ background: '#070f1f', border: '1px solid rgba(123,92,255,0.15)', borderRadius: 14, padding: '14px 20px', marginBottom: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#7b5cff', letterSpacing: 2, marginBottom: 4 }}>🧠 APTITUDE TRAINING</div>
          <div style={{ fontSize: 13, color: '#5a7a9a' }}>
            Quant · Logical · Verbal — Crack TCS Infosys Wipro placement tests
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#7b5cff', fontFamily: 'Syne,sans-serif', fontWeight: 600, flexShrink: 0 }}>Practice →</div>
      </div>

      <div onClick={() => router.push('/dsa-guide')} style={{ background: '#070f1f', border: '1px solid rgba(55,138,221,0.15)', borderRadius: 14, padding: '14px 20px', marginBottom: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#378ADD', letterSpacing: 2, marginBottom: 4 }}>📘 DSA LANGUAGE GUIDE</div>
          <div style={{ fontSize: 13, color: '#5a7a9a' }}>
            Not sure which language for DSA? Take 2-min quiz to find out
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#378ADD', fontFamily: 'Syne,sans-serif', fontWeight: 600, flexShrink: 0 }}>Take Quiz →</div>
      </div>

      <div onClick={() => router.push('/interview-simulator')} style={{ background: 'linear-gradient(135deg,rgba(255,45,120,0.06),transparent)', border: '1px solid rgba(255,45,120,0.2)', borderRadius: 14, padding: '14px 20px', marginBottom: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#ff2d78', letterSpacing: 2, marginBottom: 4 }}>🎯 INTERVIEW SIMULATOR</div>
          <div style={{ fontSize: 13, color: '#5a7a9a' }}>
            Full company-style interviews with 4 rounds. TCS, Google, Razorpay.
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#ff2d78', fontFamily: 'Syne,sans-serif', fontWeight: 600, flexShrink: 0 }}>Practice →</div>
      </div>

      {/* Main 2-col */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Today's flow */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'#e8f4ff' }}>
              Today&apos;s Flow — Day {progress?.currentDay || 1}
            </div>
            <Link href="/roadmap" style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#00f0ff', textDecoration:'none', border:'1px solid rgba(0,240,255,0.2)', padding:'3px 10px', borderRadius:20 }}>
              Continue →
            </Link>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {Object.entries(TASK_META).map(([type, meta]) => {
              const task = today?.tasks?.find(t => t.type === type);
              const done = task?.status === 'completed';
              return (
                <div key={type} style={{
                  display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8,
                  background: done ? 'rgba(29,158,117,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${done ? 'rgba(29,158,117,0.15)' : 'rgba(255,255,255,0.05)'}`,
                  transition:'all 0.2s',
                }}>
                  <div style={{
                    width:28, height:28, borderRadius:'50%', flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:12,
                    background: done ? 'rgba(29,158,117,0.15)' : `${meta.color}15`,
                    border: `1px solid ${done ? 'rgba(29,158,117,0.3)' : meta.color + '30'}`,
                    color: done ? '#1D9E75' : meta.color,
                  }}>{done ? '✓' : meta.icon}</div>
                  <span style={{
                    flex:1, fontSize:13, fontFamily:'Outfit,sans-serif',
                    color: done ? '#5a7a9a' : '#d8ecff',
                    textDecoration: done ? 'line-through' : 'none',
                  }}>{meta.label}</span>
                  {done && task?.score > 0 && (
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#1D9E75' }}>+{task.score}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div style={{ marginTop:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#5a7a9a' }}>{completedCount}/6 tasks</span>
              {today?.allDone && <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#1D9E75' }}>🎉 ALL DONE</span>}
            </div>
            <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
              <div style={{
                height:'100%', width:`${(completedCount/6)*100}%`,
                background:'linear-gradient(90deg,#00f0ff,#7b5cff)',
                borderRadius:2, transition:'width 0.5s ease',
                boxShadow:'0 0 8px rgba(0,240,255,0.4)',
              }} />
            </div>
          </div>
        </div>

        {/* Skill panel */}
        <div className="card">
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'#e8f4ff', marginBottom:20 }}>Skill Identity</div>
          <div style={{ display:'flex', justifyContent:'space-around', marginBottom:20 }}>
            <Ring pct={progressPct}  color="#7b5cff" label="Progress" />
            <Ring pct={jobReadyPct}  color="#D85A30" label="Job Ready" />
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
              <div style={{
                padding:'6px 14px', borderRadius:20, fontFamily:'Syne,sans-serif',
                fontSize:11, fontWeight:700, textTransform:'capitalize',
                background: 'rgba(0,240,255,0.08)', color:'#00f0ff',
                border:'1px solid rgba(0,240,255,0.2)',
              }}>
                {(skill?.skillLevel || 'beginner').replace('_',' ')}
              </div>
              <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#5a7a9a' }}>Skill Level</div>
            </div>
          </div>

          {/* Trial banner */}
          {(user?.plan === 'trial') && (
            <div style={{
              padding:'12px 14px', borderRadius:10, marginTop:4,
              background:'rgba(0,240,255,0.05)', border:'1px solid rgba(0,240,255,0.15)',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:600, color:'#00f0ff' }}>Free Trial Active</div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#5a7a9a', marginTop:2 }}>
                  {trial?.daysLeft ?? 14} days left
                </div>
              </div>
              <Link href="/subscription" className="btn-primary" style={{ fontSize:12, padding:'6px 14px' }}>
                Upgrade
              </Link>
            </div>
          )}
          {user?.plan === 'premium' && (
            <div style={{
              padding:'10px 14px', borderRadius:10, marginTop:4,
              background:'rgba(29,158,117,0.06)', border:'1px solid rgba(29,158,117,0.2)',
              display:'flex', alignItems:'center', gap:8,
            }}>
              <span style={{ color:'#1D9E75' }}>✓</span>
              <span style={{ fontFamily:'Syne,sans-serif', fontSize:12, color:'#1D9E75' }}>Premium Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      {recentActivity?.length > 0 && (
        <div className="card">
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'#e8f4ff', marginBottom:14 }}>Recent Activity</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {recentActivity.slice(0, 5).map((e, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{
                  width:32, height:32, borderRadius:'50%', flexShrink:0,
                  background:'rgba(0,240,255,0.08)', border:'1px solid rgba(0,240,255,0.15)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#00f0ff',
                }}>+{e.points}</div>
                <div style={{ flex:1, fontFamily:'Outfit,sans-serif', fontSize:13, color:'#8ab4c8' }}>{e.reason}</div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#2a4a5a' }}>
                  {new Date(e.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showOutcomePopup && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, background: '#070f1f', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 14, padding: 20, maxWidth: 320, boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#00f0ff,transparent)', borderRadius: '14px 14px 0 0' }} />
          <button onClick={() => { setShowOutcomePopup(false); localStorage.setItem('outcome_popup_shown', 'true'); }} style={{ position: 'absolute', top: 10, right: 12, background: 'transparent', border: 'none', color: '#5a7a9a', cursor: 'pointer', fontSize: 16 }}>×</button>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🎯</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: '#e8f4ff', marginBottom: 6 }}>
            Got an interview recently?
          </div>
          <div style={{ fontSize: 13, color: '#5a7a9a', lineHeight: 1.6, marginBottom: 14 }}>
            Help us prove GENOIS works. Takes 30 seconds. Your data helps future students.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setShowOutcomePopup(false); localStorage.setItem('outcome_popup_shown', 'true'); }} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontSize: 12 }}>
              Not yet
            </button>
            <button onClick={() => { setShowOutcomePopup(false); localStorage.setItem('outcome_popup_shown', 'true'); window.location.href = '/outcomes'; }} style={{ flex: 2, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700 }}>
              Yes — Report It →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
