'use client';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { anxietyAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

const MOODS = [
  { emoji: '😰', label: 'Anxious' },
  { emoji: '😔', label: 'Low' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '😶', label: 'Numb' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
];

const STARTERS = [
  "I'm scared I won't get placed",
  "Everyone around me seems to be doing better",
  "I have a backlog and feel like a failure",
  "I can't sleep thinking about my future",
  "I feel like giving up on coding",
  "My parents have such high expectations",
];

export default function AnxietyPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mood, setMood] = useState(null);
  const [loading, setLoading] = useState(false);
  const [moodSelected, setMoodSelected] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const hour = new Date().getHours();
  const isLateNight = hour >= 22 || hour <= 4;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMoodSelected(true);

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [
      ...prev,
      { role: 'user', content: msg },
      { role: 'assistant', content: '...', loading: true },
    ]);
    setLoading(true);

    try {
      const res = await anxietyAPI.sendMessage({
        message: msg,
        conversationHistory: history,
        mood: mood?.label,
      });
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: res.data.response },
      ]);
    } catch {
      setMessages(prev => prev.slice(0, -1));
      toast.error('Could not connect. Try again.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const clearChat = async () => {
    try {
      await anxietyAPI.clearHistory();
    } catch { /* ignore */ }
    setMessages([]);
    setMoodSelected(false);
    setMood(null);
    toast.success('Chat cleared');
  };

  const firstName = user?.name?.split(' ')[0] || 'friend';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 56px)',
        width: '100%',
        background: 'var(--gx-surface)',
        margin: '-24px',
        padding: '0',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid var(--gx-border)',
        background: 'var(--gx-bg)',
        backdropFilter: 'blur(20px)',
        flexShrink: 0,
      }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: isLateNight ? 'var(--gx-accent)' : 'var(--gx-success)',
                boxShadow: `0 0 8px ${isLateNight ? 'var(--gx-accent)' : 'var(--gx-success)'}`,
                animation: 'gentlePulse 2s infinite',
              }} />
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--gx-text)',
                letterSpacing: -0.5,
              }}>
                2AM Chat
              </span>
              {isLateNight && (
                <span style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--gx-accent)',
                  background: 'var(--gx-accent-soft)',
                  border: '1px solid var(--gx-accent-border)',
                  padding: '2px 8px',
                  borderRadius: 20,
                  letterSpacing: 1,
                }}>LIVE</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-body)' }}>
              A safe space. No judgment. Just a senior who gets it.
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} style={{
              fontSize: 11,
              color: 'var(--gx-text-muted)',
              background: 'transparent',
              border: '1px solid var(--gx-border)',
              padding: '5px 12px',
              borderRadius: 20,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
            }}>clear</button>
          )}
        </div>

        {/* Mood selector — hide after first message */}
        {!moodSelected && (
          <div className="mt-3">
            <div style={{
              fontSize: 11, color: 'var(--gx-text-muted)', marginBottom: 8,
              fontFamily: 'var(--font-body)', letterSpacing: 1,
            }}>
              HOW ARE YOU FEELING?
            </div>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map(m => (
                <button key={m.label} onClick={() => setMood(m)} style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: `1px solid ${mood?.label === m.label ? 'var(--gx-accent-border)' : 'var(--gx-border)'}`,
                  background: mood?.label === m.label ? 'var(--gx-accent-soft)' : 'transparent',
                  color: mood?.label === m.label ? 'var(--gx-accent)' : 'var(--gx-text-muted)',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontFamily: 'var(--font-body)',
                }}>
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 24px', width: '100%' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🌙</div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--gx-text)',
              marginBottom: 10,
            }}>
              Hey {firstName},
            </div>
            <div style={{
              fontSize: 14,
              color: 'var(--gx-text-muted)',
              maxWidth: 360,
              margin: '0 auto 32px',
              lineHeight: 1.8,
              fontFamily: 'var(--font-body)',
            }}>
              It&apos;s okay to not be okay.<br />
              Tell me what&apos;s going on — I&apos;m here.
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxWidth: 500,
              width: '100%',
              margin: '0 auto',
            }}>
              {STARTERS.map((s, i) => (
                <button key={i} onClick={() => send(s)} style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid var(--gx-border)',
                  background: 'var(--gx-accent-soft)',
                  color: 'var(--gx-text-muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1.5,
                }}>
                  &ldquo;{s}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              gap: 10,
            }}>
              {m.role === 'assistant' && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--gx-accent-soft)',
                  border: '1px solid var(--gx-accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0,
                }}>🌙</div>
              )}
              <div style={{
                maxWidth: '72%',
                padding: '12px 16px',
                borderRadius: m.role === 'user'
                  ? '18px 18px 4px 18px'
                  : '18px 18px 18px 4px',
                background: m.role === 'user'
                  ? 'var(--gx-warning)'
                  : 'var(--gx-surface)',
                border: m.role === 'user'
                  ? '1px solid var(--gx-warning-border)'
                  : '1px solid var(--gx-border)',
                color: m.role === 'user' ? 'var(--gx-text-inverse)' : m.loading ? 'var(--gx-text-subtle)' : 'var(--gx-text)',
                fontSize: 14,
                lineHeight: 1.75,
                fontFamily: 'var(--font-body)',
                whiteSpace: 'pre-wrap',
              }}>
                {m.loading
                  ? <span style={{ animation: 'gentlePulse 1.5s infinite' }}>• • •</span>
                  : m.content}
              </div>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{
        padding: '14px 24px 20px',
        borderTop: '1px solid var(--gx-border)',
        background: 'var(--gx-bg)',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 10,
          color: 'var(--gx-text-subtle)',
          fontFamily: 'var(--font-body)',
          marginBottom: 10,
          letterSpacing: 0.5,
        }}>
          iCall India: 9152987821 · Mon–Sat 8AM–10PM · This chat is private
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', width: '100%' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Whatever is on your mind right now..."
            rows={2}
            style={{
              flex: 1,
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid var(--gx-border)',
              background: 'var(--gx-surface)',
              color: 'var(--gx-text)',
              fontSize: 14,
              fontFamily: 'var(--font-body)',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.6,
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--gx-accent-border)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--gx-border)'; }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              padding: '12px 22px',
              borderRadius: 12,
              border: 'none',
              background: !loading && input.trim()
                ? 'var(--gx-accent)'
                : 'var(--gx-surface)',
              color: !loading && input.trim() ? 'var(--gx-text-inverse)' : 'var(--gx-text-subtle)',
              fontWeight: 700,
              fontSize: 14,
              cursor: !loading && input.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-heading)',
              marginBottom: 2,
            }}>
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes gentlePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
