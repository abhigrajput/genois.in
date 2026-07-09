'use client';
import { useEffect, useRef, useState } from 'react';

const LANGS = [
  { key: 'cpp',        label: 'C++' },
  { key: 'python',     label: 'Python' },
  { key: 'java',       label: 'Java' },
  { key: 'javascript', label: 'JavaScript' },
];

const STORAGE_KEY = 'genois_code_lang';

/**
 * CodePanel renders an algorithm's code with a language tab switcher.
 *
 * Props:
 *  - code      : C++ source string (default tab). Supports activeLine highlighting.
 *  - snippets  : optional { python, java, javascript } map of translated source.
 *  - title     : panel label.
 *  - activeLine: highlighted line index (only applies to the C++ tab).
 */
export default function CodePanel({ code, snippets = {}, title = 'Code', activeLine = -1 }) {
  const [lang, setLang] = useState('cpp');
  const activeRef = useRef(null);

  // Hydrate saved language preference (client-only to avoid SSR mismatch).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && LANGS.some(l => l.key === saved)) setLang(saved);
    } catch {}
  }, []);

  const selectLang = (key) => {
    setLang(key);
    try { localStorage.setItem(STORAGE_KEY, key); } catch {}
  };

  const isCpp = lang === 'cpp';
  const source = isCpp ? code : snippets[lang];
  const hasSource = typeof source === 'string' && source.trim().length > 0;

  useEffect(() => {
    if (isCpp && activeLine >= 0 && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeLine, isCpp, lang]);

  const langLabel = LANGS.find(l => l.key === lang)?.label || 'Code';
  const lines = hasSource ? source.trim().split('\n') : [];

  return (
    <div style={{
      background: '#0d1117',
      border: '1px solid rgba(0,240,255,0.12)',
      borderLeft: '3px solid #00f0ff',
      borderRadius: '0 10px 10px 0',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 14px',
        background: 'rgba(0,240,255,0.04)',
        borderBottom: '1px solid rgba(0,240,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 10, color: '#00f0ff', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
          {'{ }'}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5a7a9a', letterSpacing: 1 }}>
          {title}
        </span>
        {isCpp && activeLine >= 0 && (
          <span style={{
            marginLeft: 8,
            fontSize: 10,
            color: '#00f0ff',
            fontFamily: 'var(--font-mono)',
            background: 'rgba(0,240,255,0.1)',
            padding: '2px 8px',
            borderRadius: 4,
            animation: 'pulse 1.5s ease infinite',
          }}>
            ▶ Line {activeLine + 1} executing
          </span>
        )}
      </div>

      {/* Language tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '8px 12px',
        background: 'rgba(0,240,255,0.02)',
        borderBottom: '1px solid rgba(0,240,255,0.08)',
        flexWrap: 'wrap',
      }}>
        {LANGS.map(l => {
          const active = l.key === lang;
          return (
            <button
              key={l.key}
              onClick={() => selectLang(l.key)}
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                background: active ? '#00d9a3' : 'transparent',
                color: active ? '#fff' : '#5a7a9a',
                transition: 'all 0.15s',
              }}
            >
              {l.label}
            </button>
          );
        })}
      </div>

      {/* Code body */}
      {hasSource ? (
        <pre style={{
          margin: 0,
          padding: '10px 0',
          overflowX: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          lineHeight: 1.7,
          maxHeight: 260,
          overflowY: 'auto',
        }}>
          {lines.map((line, i) => {
            const isActive = isCpp && activeLine === i;
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
                    fontFamily: 'var(--font-mono)',
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
      ) : (
        <div style={{
          padding: '28px 16px',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: '#5a7a9a',
        }}>
          <div style={{ color: '#6a9955', marginBottom: 8 }}>{`// ${langLabel} code coming soon`}</div>
          <div style={{ fontSize: 11, color: '#3d5066' }}>
            We&apos;re still translating this one. Switch to the <strong style={{ color: '#00f0ff' }}>C++</strong> tab to follow along.
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}

function syntaxColor(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('#')) return '#6a9955';
  if (/\b(int|void|bool|string|auto|vector|return|if|else|for|while|struct|class|def|function|let|const|var|public|private|static|new|None|True|False|null|self|print|console)\b/.test(trimmed)) return '#c586c0';
  return '#e6edf3';
}
