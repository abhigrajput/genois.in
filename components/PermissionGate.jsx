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
      background: 'var(--gx-surface)',
      border: '1px solid var(--gx-warning-border)',
      borderRadius: 14,
      padding: 32,
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--gx-warning)' }} />
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 8 }}>
        Feature Locked
      </div>
      <div style={{ fontSize: 13, color: 'var(--gx-text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
        {message}
      </div>
      <div style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--gx-warning-border)', background: 'var(--gx-warning-soft)', color: 'var(--gx-warning)', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
        🔧 Paid plans coming soon — trial gives full access
      </div>
    </div>
  );
}
