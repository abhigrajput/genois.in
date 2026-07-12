'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

// Only allow http(s), mailto, or same-origin relative URLs in markdown links.
// Anything else (javascript:, data:, vbscript:, etc.) is dropped to prevent XSS.
function isSafeUrl(url) {
  if (!url) return false;
  const trimmed = String(url).trim();
  if (/[\x00-\x1f]/.test(trimmed)) return false; // control chars
  if (trimmed.startsWith('/') || trimmed.startsWith('#') ||
      trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return true;
  }
  return /^(https?|mailto):/i.test(trimmed);
}

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function parseInline(text) {
  if (!text) return '';

  // Escape HTML tags to protect against XSS, preserving our custom elements later
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#ffffff;font-weight:700;">$1</strong>');

  // italic: *text*
  html = html.replace(/\*(.*?)\*/g, '<em style="color:#e8e8ed;font-style:italic;">$1</em>');

  // inline code: `code`
  html = html.replace(/`(.*?)`/g, '<code style="background:#161b22;color:#00d9a3;padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:13px;border:1px solid rgba(0,217,163,0.15);word-break:break-all;">$1</code>');

  // links: [text](url) — URL must pass isSafeUrl, otherwise we render plain text only
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, (_match, linkText, url) => {
    if (!isSafeUrl(url)) return linkText;
    return `<a href="${escapeAttr(url.trim())}" target="_blank" rel="noopener noreferrer" style="color:#00d9a3;text-decoration:underline;font-weight:500;transition:opacity 0.15s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">${linkText}</a>`;
  });

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function CodeBlock({ code = '', lang = 'cpp' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div style={{ 
      background: '#0d1117', 
      border: '1px solid #21262d', 
      borderLeft: '3px solid #00d9a3',
      borderRadius: '8px', 
      overflow: 'hidden', 
      margin: '20px 0',
      position: 'relative'
    }}>
      {/* Code Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#161b22',
        padding: '6px 16px',
        borderBottom: '1px solid #21262d',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: '#5a7a9a'
      }}>
        <span>{lang.toUpperCase()}</span>
        <button 
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: 'none',
            color: copied ? '#1d9e75' : '#00d9a3',
            cursor: 'pointer',
            fontFamily: 'var(--font-heading)',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>

      {/* Code Body */}
      <div style={{ 
        display: 'flex', 
        overflowX: 'auto',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        lineHeight: '1.6',
        padding: '12px 0'
      }}>
        {/* Line Numbers */}
        <div style={{ 
          color: '#3a4a5a', 
          textAlign: 'right', 
          padding: '0 12px 0 16px',
          userSelect: 'none',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          minWidth: '40px'
        }}>
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code Content */}
        <pre style={{ 
          margin: 0, 
          padding: '0 16px',
          color: '#c9d1d9',
          whiteSpace: 'pre',
          wordBreak: 'normal',
          flex: 1
        }}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

export default function MarkdownRenderer({ content = '' }) {
  if (!content) return null;

  const lines = content.split('\n');
  const blocks = [];
  let currentList = null;
  let currentCode = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Inside a Code Block
    if (currentCode) {
      if (line.trim().startsWith('```')) {
        blocks.push({ 
          type: 'code', 
          lang: currentCode.lang, 
          content: currentCode.lines.join('\n') 
        });
        currentCode = null;
      } else {
        currentCode.lines.push(line);
      }
      continue;
    }

    // Entering a Code Block
    if (line.trim().startsWith('```')) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      const lang = line.replace('```', '').trim() || 'cpp';
      currentCode = { lang, lines: [] };
      continue;
    }

    // Lists
    const bulletMatch = line.match(/^[\-\*]\s+(.*)/);
    const numberMatch = line.match(/^\d+\.\s+(.*)/);

    if (bulletMatch) {
      if (currentList && currentList.type !== 'bullet') {
        blocks.push(currentList);
        currentList = null;
      }
      if (!currentList) {
        currentList = { type: 'bullet', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    if (numberMatch) {
      if (currentList && currentList.type !== 'number') {
        blocks.push(currentList);
        currentList = null;
      }
      if (!currentList) {
        currentList = { type: 'number', items: [] };
      }
      currentList.items.push(numberMatch[1]);
      continue;
    }

    // Non-list line
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }

    if (line.trim() === '---') {
      blocks.push({ type: 'divider' });
    } else if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4) });
    } else if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3) });
    } else if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.slice(2) });
    } else if (line.trim() === '') {
      blocks.push({ type: 'empty' });
    } else {
      blocks.push({ type: 'paragraph', text: line });
    }
  }

  // Flush remaining blocks
  if (currentCode) {
    blocks.push({ 
      type: 'code', 
      lang: currentCode.lang, 
      content: currentCode.lines.join('\n') 
    });
  }
  if (currentList) {
    blocks.push(currentList);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'h1':
            return (
              <h1 
                key={index} 
                style={{ 
                  fontFamily: 'var(--font-heading)', 
                  color: '#e8e8ed', 
                  fontSize: '32px', 
                  fontWeight: 800, 
                  marginTop: '36px', 
                  marginBottom: '20px' 
                }}
              >
                {parseInline(block.text)}
              </h1>
            );
          case 'h2':
            return (
              <h2 
                key={index} 
                id={encodeURIComponent(block.text.toLowerCase().replace(/\s+/g, '-'))}
                style={{ 
                  fontFamily: 'var(--font-heading)', 
                  color: '#00d9a3', 
                  fontSize: '24px', 
                  fontWeight: 800, 
                  marginTop: '32px', 
                  marginBottom: '16px', 
                  borderBottom: '1px solid rgba(0,217,163,0.1)', 
                  paddingBottom: '6px' 
                }}
              >
                {parseInline(block.text)}
              </h2>
            );
          case 'h3':
            return (
              <h3 
                key={index} 
                id={encodeURIComponent(block.text.toLowerCase().replace(/\s+/g, '-'))}
                style={{ 
                  fontFamily: 'var(--font-heading)', 
                  color: '#00d9a3', 
                  fontSize: '20px', 
                  fontWeight: 700, 
                  marginTop: '24px', 
                  marginBottom: '12px' 
                }}
              >
                {parseInline(block.text)}
              </h3>
            );
          case 'paragraph':
            return (
              <p 
                key={index} 
                style={{ 
                  color: '#c9d1d9', 
                  fontSize: '16px', 
                  lineHeight: '1.8', 
                  marginBottom: '16px', 
                  fontFamily: 'var(--font-body)' 
                }}
              >
                {parseInline(block.text)}
              </p>
            );
          case 'divider':
            return (
              <hr 
                key={index} 
                style={{ 
                  border: 'none', 
                  borderTop: '1px solid #21262d', 
                  margin: '32px 0' 
                }} 
              />
            );
          case 'bullet':
            return (
              <ul 
                key={index} 
                style={{ 
                  paddingLeft: '24px', 
                  marginBottom: '16px', 
                  listStyleType: 'none' 
                }}
              >
                {block.items.map((item, idx) => (
                  <li 
                    key={idx} 
                    style={{ 
                      color: '#c9d1d9', 
                      fontSize: '16px', 
                      lineHeight: '1.8', 
                      marginBottom: '6px', 
                      position: 'relative', 
                      fontFamily: 'var(--font-body)' 
                    }}
                  >
                    <span style={{ color: '#00d9a3', position: 'absolute', left: '-16px' }}>•</span>
                    {parseInline(item)}
                  </li>
                ))}
              </ul>
            );
          case 'number':
            return (
              <ol 
                key={index} 
                style={{ 
                  paddingLeft: '24px', 
                  marginBottom: '16px', 
                  listStyleType: 'decimal' 
                }}
              >
                {block.items.map((item, idx) => (
                  <li 
                    key={idx} 
                    style={{ 
                      color: '#c9d1d9', 
                      fontSize: '16px', 
                      lineHeight: '1.8', 
                      marginBottom: '6px', 
                      paddingLeft: '4px', 
                      fontFamily: 'var(--font-body)' 
                    }}
                  >
                    {parseInline(item)}
                  </li>
                ))}
              </ol>
            );
          case 'code':
            return (
              <CodeBlock 
                key={index} 
                code={block.content} 
                lang={block.lang} 
              />
            );
          case 'empty':
            return <div key={index} style={{ height: '8px' }} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
