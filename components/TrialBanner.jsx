'use client';
import { usePermission } from '@/lib/usePermission';
import { useRouter } from 'next/navigation';

export default function TrialBanner() {
  const router = useRouter();
  const { isInTrial, trialDaysLeft, planLoaded } = usePermission();

  if (!planLoaded || !isInTrial) return null;

  const isUrgent = trialDaysLeft <= 5;
  const color = isUrgent ? '#ff2d78' : '#EF9F27';

  return (
    <div style={{
      background: `linear-gradient(135deg,${color}10,transparent)`,
      border: `1px solid ${color}40`,
      borderRadius: 12,
      padding: '12px 18px',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 10,
    }}>
      <div>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color, letterSpacing: 2, marginBottom: 4 }}>
          🎁 DOMINATOR TRIAL ACTIVE
        </div>
        <div style={{ fontSize: 13, color: '#e8f4ff' }}>
          <strong>{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left</strong> — All features unlocked
          {isUrgent && <span style={{ color: '#ff2d78', marginLeft: 8 }}>· Trial ending soon</span>}
        </div>
      </div>
      <button onClick={() => router.push('/subscription')} style={{
        padding: '8px 16px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        background: `linear-gradient(135deg,${color},${color}aa)`,
        color: '#020812',
        fontFamily: 'Syne,sans-serif',
        fontSize: 12,
        fontWeight: 700,
      }}>
        Upgrade Now →
      </button>
    </div>
  );
}
