'use client';

export default function ConceptBox({ title, description, timeComplexity, spaceComplexity, stable }) {
  return (
    <div style={{
      background: '#0d1117',
      border: '1px solid #1a2a3a',
      borderLeft: '4px solid #00f0ff',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
    }}>
      <div style={{ color: '#00f0ff', fontWeight: 600, marginBottom: 8, fontSize: 14, fontFamily: 'var(--font-heading)' }}>
        💡 {title}
      </div>
      <div style={{ color: '#8b949e', fontSize: 13, lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
        {description}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
        {timeComplexity && (
          <span style={{ color: '#ef9f27', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            ⏱ Time: {timeComplexity}
          </span>
        )}
        {spaceComplexity && (
          <span style={{ color: '#1d9e75', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            💾 Space: {spaceComplexity}
          </span>
        )}
        {stable !== undefined && (
          <span style={{ color: '#ff6b4a', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            📊 Stable: {stable ? 'Yes' : 'No'}
          </span>
        )}
      </div>
    </div>
  );
}
