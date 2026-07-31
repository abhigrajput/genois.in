'use client';

const STATUS_COLORS = {
  compare:  'var(--gx-accent)',
  sorted:   'var(--gx-success)',
  found:    'var(--gx-success)',
  pivot:    'var(--gx-warning)',
  key:      'var(--gx-warning)',
  mismatch: 'var(--gx-danger)',
  error:    'var(--gx-danger)',
  info:     'var(--gx-warning)',
  default:  'var(--gx-text-muted)',
};

export default function StepExplanation({ stepNumber, totalSteps, explanation, status = 'default' }) {
  if (!explanation) return null;
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.default;
  return (
    <div style={{
      background: 'var(--gx-surface)',
      border: `1px solid color-mix(in srgb, ${color} 19%, transparent)`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 8,
      padding: '12px 16px',
      marginTop: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          color: color,
          background: `color-mix(in srgb, ${color} 9%, transparent)`,
          padding: '2px 8px',
          borderRadius: 4,
          letterSpacing: 1,
          fontWeight: 600,
        }}>
          STEP {stepNumber ?? '?'}{totalSteps ? ` / ${totalSteps}` : ''}
        </span>
        <div style={{
          width: totalSteps && stepNumber ? `${(stepNumber / totalSteps) * 100}%` : '0%',
          height: 2,
          background: color,
          borderRadius: 1,
          flex: 1,
          transition: 'width 0.3s ease',
          maxWidth: 200,
        }} />
      </div>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        color: 'var(--gx-text)',
        lineHeight: 1.65,
      }}>
        {explanation}
      </div>
    </div>
  );
}
