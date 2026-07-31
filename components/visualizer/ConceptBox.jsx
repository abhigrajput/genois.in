'use client';

export default function ConceptBox({ title, description, timeComplexity, spaceComplexity, stable }) {
  return (
    <div style={{
      background: 'var(--gx-surface-2)',
      border: '1px solid var(--gx-border)',
      borderLeft: '4px solid var(--gx-accent)',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
    }}>
      <div style={{ color: 'var(--gx-accent)', fontWeight: 600, marginBottom: 8, fontSize: 14, fontFamily: 'var(--font-heading)' }}>
        💡 {title}
      </div>
      <div style={{ color: 'var(--gx-text-muted)', fontSize: 13, lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
        {description}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
        {timeComplexity && (
          <span style={{ color: 'var(--gx-warning)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            ⏱ Time: {timeComplexity}
          </span>
        )}
        {spaceComplexity && (
          <span style={{ color: 'var(--gx-success)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            💾 Space: {spaceComplexity}
          </span>
        )}
        {stable !== undefined && (
          <span style={{ color: 'var(--gx-warning)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            📊 Stable: {stable ? 'Yes' : 'No'}
          </span>
        )}
      </div>
    </div>
  );
}
