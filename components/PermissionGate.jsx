'use client';
import { useRouter } from 'next/navigation';
import { hasPermission, getUpgradeMessage } from '@/lib/permissions';
import { usePermission } from '@/lib/usePermission';

export default function PermissionGate({ feature, children }) {
  const router = useRouter();
  const { userPlan, trialEndsAt, isInTrial, trialDaysLeft, planLoaded } = usePermission();

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
      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: '#e8f4ff', marginBottom: 8 }}>
        Feature Locked
      </div>
      <div style={{ fontSize: 13, color: '#8a9ab0', marginBottom: 20, lineHeight: 1.6 }}>
        {message}
      </div>
      <button onClick={() => router.push('/subscription')} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#EF9F27,#D85A30)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700 }}>
        Upgrade Plan →
      </button>
    </div>
  );
}
