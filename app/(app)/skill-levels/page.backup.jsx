'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import { SKILL_TIERS, getSkillTierData } from '@/lib/skillLevel';

export default function SkillLevelsPage() {
  const { token, ready } = useToken();
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/analytics/dashboard', token)
      .then(r => {
        const raw = r.data?.score;
        let numScore = 0;
        if (typeof raw === 'number') numScore = raw;
        else if (typeof raw === 'object' && raw !== null) {
          numScore = raw.total_score || raw.score || 0;
        }
        setScore(numScore);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ready, token]);

  if (loading) return <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center' }}>Loading...</div>;

  const currentTier = getSkillTierData(score);
  const tiers = ['fresher', 'junior', 'mid-level', 'senior', 'expert'];

  return (
    <div style={{ fontFamily: 'var(--font-body)', width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 4 }}>
          📊 Skill Level System
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 13 }}>
          Your GENOIS score classifies you. Companies hire based on this level.
        </p>
      </div>

      <div style={{ background: `linear-gradient(135deg,${currentTier.color}10,transparent)`, border: `2px solid ${currentTier.color}30`, borderRadius: 16, padding: 24, marginBottom: 28, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,transparent,${currentTier.color},transparent)` }} />
        <div style={{ fontSize: 56, marginBottom: 12 }}>{currentTier.icon}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 6 }}>YOU ARE CURRENTLY</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: currentTier.color, marginBottom: 6 }}>{currentTier.label}</div>
        <div style={{ color: '#8a9ab0', fontSize: 14, maxWidth: 400, margin: '0 auto 16px' }}>{currentTier.description}</div>
        <div style={{ display: 'inline-flex', gap: 14, padding: '8px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 20 }}>
          <span style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>Score: <strong style={{ color: currentTier.color }}>{typeof score === 'number' ? score : 0}</strong></span>
        </div>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5a7a9a', letterSpacing: 2, marginBottom: 16 }}>ALL LEVELS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tiers.map(slug => {
          const t = SKILL_TIERS[slug];
          const isCurrent = slug === currentTier.tier;
          return (
            <div key={slug} style={{ background: '#070f1f', border: `${isCurrent ? '2' : '1'}px solid ${isCurrent ? t.color + '40' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden' }}>
              {isCurrent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${t.color},transparent)` }} />}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 36, flexShrink: 0 }}>{t.icon}</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: t.color }}>{t.label}</div>
                    {isCurrent && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,240,255,0.1)', color: '#00f0ff', fontFamily: 'var(--font-mono)' }}>YOU ARE HERE</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#8a9ab0', marginBottom: 10, lineHeight: 1.6 }}>{t.description}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8, fontSize: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>Score Range</div>
                      <div style={{ color: '#c8d8e8' }}>{t.min} - {t.max > 99999 ? '∞' : t.max}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>Package</div>
                      <div style={{ color: '#c8d8e8' }}>{t.expectedPackage}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>Target Companies</div>
                      <div style={{ color: '#c8d8e8', fontSize: 11 }}>{t.companies}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
