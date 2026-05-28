'use client';
import { useEffect, useRef } from 'react';

export default function CodePanel({ code, title = 'C++ Code', activeLine = -1 }) {
  const lines = code.trim().split('\n');
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeLine >= 0 && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeLine]);

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
        {activeLine >= 0 && (
          <span style={{
            marginLeft: 8,
            fontSize: 10,
            color: '#00f0ff',
            fontFamily: 'JetBrains Mono,monospace',
            background: 'rgba(0,240,255,0.1)',
            padding: '2px 8px',
            borderRadius: 4,
            animation: 'pulse 1.5s ease infinite',
          }}>
            ▶ Line {activeLine + 1} executing
          </span>
        )}
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
        maxHeight: 260,
        overflowY: 'auto',
      }}>
        {lines.map((line, i) => {
          const isActive = activeLine === i;
          return (
            <div
              key={i}
              ref={isActive ? activeRef : null}
              style={{
                padding: '0 14px',
                background: isActive ? '#00f0ff22' : 'transparent',
                borderLeft: isActive ? '3px solid #00f0ff' : '3px solid transparent',
                transition: 'all 0.2s ease',
                display: 'flex',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <span style={{
                color: isActive ? '#00f0ff' : '#3d5066',
                userSelect: 'none',
                minWidth: 20,
                textAlign: 'right',
                fontSize: 11,
                fontWeight: isActive ? 700 : 400,
              }}>
                {i + 1}
              </span>
              {isActive && (
                <span style={{
                  fontSize: 9,
                  color: '#00f0ff',
                  fontFamily: 'JetBrains Mono,monospace',
                  background: 'rgba(0,240,255,0.15)',
                  padding: '1px 5px',
                  borderRadius: 3,
                  whiteSpace: 'nowrap',
                  letterSpacing: 0.5,
                }}>Currently executing →</span>
              )}
              <span style={{
                color: isActive ? '#00f0ff' : syntaxColor(line),
                fontWeight: isActive ? 600 : 400,
                transition: 'color 0.2s',
              }}>
                {line || ' '}
              </span>
            </div>
          );
        })}
      </pre>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}

function syntaxColor(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) return '#6a9955';
  if (/\b(int|void|bool|string|auto|vector|return|if|else|for|while|struct|class)\b/.test(trimmed)) return '#c586c0';
  return '#e6edf3';
}
