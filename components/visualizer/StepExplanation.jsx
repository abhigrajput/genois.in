'use client';

const STATUS_COLORS = {
  compare:  '#00f0ff',
  sorted:   '#1d9e75',
  found:    '#1d9e75',
  pivot:    '#ef9f27',
  key:      '#ef9f27',
  mismatch: '#ff2d78',
  error:    '#ff2d78',
  info:     '#ff6b4a',
  default:  '#8b949e',
};

export default function StepExplanation({ stepNumber, totalSteps, explanation, status = 'default' }) {
  if (!explanation) return null;
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.default;
  return (
    <div style={{
      background: 'rgba(10,15,30,0.8)',
      border: `1px solid ${color}30`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 8,
      padding: '12px 16px',
      marginTop: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: color,
          background: `${color}18`,
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
        color: '#e8e8ed',
        lineHeight: 1.65,
      }}>
        {explanation}
      </div>
    </div>
  );
}
