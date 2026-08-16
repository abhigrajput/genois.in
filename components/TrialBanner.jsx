'use client';
import { usePermission } from '@/lib/usePermission';
import { BETA_MODE } from '@/lib/permissions';

export default function TrialBanner() {
  const { isInTrial, trialDaysLeft, planLoaded } = usePermission();
  // During the beta nothing is gated and there is nothing to downgrade to, so a
  // "trial ending soon" countdown would contradict every other surface. Some
  // accounts still carry trial_ends_at from before BETA_MODE; ignore it until
  // the gates come back on, at which point this banner returns untouched.
  if (BETA_MODE) return null;
  if (!planLoaded || !isInTrial) return null;
  const isUrgent = trialDaysLeft <= 5;
  const color = isUrgent ? 'var(--gx-danger)' : 'var(--gx-success)';
  return (
    <div style={{ background: color, border: `1px solid color-mix(in srgb, ${color} 19%, transparent)`, borderRadius: 12, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 16 }}>🎁</span>
      <div style={{ fontSize: 13, color: 'var(--gx-text)' }}>
        <strong style={{ color }}>Dominator Trial</strong> — {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left · All features unlocked
        {isUrgent && <span style={{ color: 'var(--gx-danger)', marginLeft: 8 }}>· Trial ending soon</span>}
      </div>
    </div>
  );
}
