'use client';
import { usePermission } from '@/lib/usePermission';

export default function TrialBanner() {
  const { isInTrial, trialDaysLeft, planLoaded } = usePermission();
  if (!planLoaded || !isInTrial) return null;
  const isUrgent = trialDaysLeft <= 5;
  const color = isUrgent ? '#ff2d78' : '#1D9E75';
  return (
    <div style={{ background: `linear-gradient(135deg,${color}10,transparent)`, border: `1px solid ${color}30`, borderRadius: 12, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 16 }}>🎁</span>
      <div style={{ fontSize: 13, color: '#e8e8ed' }}>
        <strong style={{ color }}>Dominator Trial</strong> — {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left · All features unlocked
        {isUrgent && <span style={{ color: '#ff2d78', marginLeft: 8 }}>· Trial ending soon</span>}
      </div>
    </div>
  );
}
