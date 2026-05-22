'use client';

export default function CodePanel({ code, title = 'C++ Code', activeLine = -1 }) {
  const lines = code.trim().split('\n');

  return (
    <div style={{
      background: '#0d1117',
      border: '1px solid rgba(0,240,255,0.12)',
      borderLeft: '3px solid #00f0ff',
      borderRadius: '0 10px 10px 0',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 14px',
        background: 'rgba(0,240,255,0.04)',
        borderBottom: '1px solid rgba(0,240,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 10, color: '#00f0ff', fontFamily: 'JetBrains Mono,monospace', letterSpacing: 1 }}>
          {'{ }'}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#5a7a9a', letterSpacing: 1 }}>
          {title}
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 10,
          color: '#2a4a5a',
          fontFamily: 'JetBrains Mono,monospace',
          background: 'rgba(0,240,255,0.05)',
          padding: '2px 8px',
          borderRadius: 4,
        }}>C++</span>
      </div>
      <pre style={{
        margin: 0,
        padding: '10px 0',
        overflowX: 'auto',
        fontFamily: 'JetBrains Mono,monospace',
        fontSize: 12,
        lineHeight: 1.7,
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            padding: '0 14px',
            background: activeLine === i ? 'rgba(0,240,255,0.08)' : 'transparent',
            borderLeft: activeLine === i ? '2px solid #00f0ff' : '2px solid transparent',
            transition: 'all 0.2s',
            display: 'flex',
            gap: 12,
          }}>
            <span style={{ color: '#3d5066', userSelect: 'none', minWidth: 20, textAlign: 'right' }}>
              {i + 1}
            </span>
            <span style={{ color: syntaxColor(line) }}>
              {line || ' '}
            </span>
          </div>
        ))}
      </pre>
    </div>
  );
}

function syntaxColor(line) {
  // Very minimal syntax coloring (rendered as plain span)
  // Real highlighting is done via CSS color on the whole line
  return '#e6edf3';
}
