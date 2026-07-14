'use client';
import { useRouter } from 'next/navigation';
import { hasPermission, getUpgradeMessage, BETA_MODE } from '@/lib/permissions';
import { usePermission } from '@/lib/usePermission';

export default function PermissionGate({ feature, children }) {
  const router = useRouter();
  const { userPlan, trialEndsAt, isInTrial, trialDaysLeft, planLoaded } = usePermission();

  // Public beta: render the feature immediately, skip all gating.
  if (BETA_MODE) return children;

  if (!planLoaded) return null;

  const allowed = hasPermission(userPlan, feature, trialEndsAt, isInTrial);
  if (allowed) return children;

  const message = getUpgradeMessage(feature);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(239,159,39,0.2)',
      borderRadius: 14,
      padding: 32,
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#EF9F27,transparent)' }} />
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#e8e8ed', marginBottom: 8 }}>
        Feature Locked
      </div>
      <div style={{ fontSize: 13, color: '#8a9ab0', marginBottom: 20, lineHeight: 1.6 }}>
        {message}
      </div>
      <div style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(239,159,39,0.2)', background: 'rgba(239,159,39,0.05)', color: '#EF9F27', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
        🔧 Paid plans coming soon — trial gives full access
      </div>
    </div>
  );
}
