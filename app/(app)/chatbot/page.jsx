'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { chatbotAPI, mentorAPI } from '@/lib/api';

const MODES = ['general','coding','domain','project','career'];
const QUICK = [
  "What is a REST API?","Explain recursion with example","How does HTTP work?",
  "Best resources for my domain","How to prepare for placements?","SQL vs NoSQL difference"
];

const STORAGE_KEY = 'genois_chat_history';

/**
 * Feature D — the mentor's proactive nudge.
 *
 * Everything rendered here comes from GET /api/mentor/focus, which derives the
 * focus in code from the student's real signals (skill evidence, readiness, the
 * pattern roadmap, build progress, applications). No model runs behind it, so
 * there is no path by which a number on this card was invented — the "grounded
 * in" list IS the data the derivation used, shown so the student can check it.
 *
 * Three states, all distinct on purpose:
 *   · a focus, with its facts and one next action;
 *   · not enough data — says exactly that, and never fills the gap;
 *   · unreachable — renders nothing, so the chat is unchanged.
 */
function FocusCard({ focus, signals, onAsk }) {
  if (!focus) return null;

  const shell = {
    border: '1px solid var(--gx-accent-border)',
    background: 'var(--gx-accent-soft)',
    borderRadius: 14,
    padding: 14,
  };
  const label = {
    fontSize: 'var(--gx-text-2xs)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--gx-accent-hover)',
    fontWeight: 700,
  };

  // The one-line journey strip: only signals that actually reported.
  const strip = [];
  if (signals?.readiness?.hasTargets) {
    const scored = (signals.readiness.companies || []).filter(c => c.scored);
    if (scored.length) strip.push(`${scored[0].company} readiness ${scored[0].overall}/100`);
  }
  if (signals?.pattern) strip.push(`Pattern: ${signals.pattern.name}`);
  if (signals?.projects?.available) {
    strip.push(signals.projects.current
      ? `Build: ${signals.projects.current.phasesDone}/${signals.projects.current.phaseCount} phases`
      : `Builds finished: ${signals.projects.completedCount}`);
  }
  if (signals?.applications?.available) {
    strip.push(`${signals.applications.total} application${signals.applications.total === 1 ? '' : 's'} logged`);
  }

  return (
    <div style={shell} className="mb-4">
      <div style={label}>Your mentor · what to focus on now</div>
      <div style={{ fontWeight: 600, fontSize: 'var(--gx-text-md)', color: 'var(--gx-text)', marginTop: 6 }}>
        {focus.title}
      </div>
      <div style={{ fontSize: 'var(--gx-text-sm)', color: 'var(--gx-text-muted)', lineHeight: 1.6, marginTop: 6 }}>
        {focus.because}
      </div>

      {focus.facts?.length > 0 && (
        <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
          {focus.facts.map((f, i) => (
            <li key={i} style={{
              fontSize: 'var(--gx-text-xs)',
              color: 'var(--gx-text)',
              fontFamily: 'var(--gx-font-mono)',
            }}>· {f}</li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <Link
          href={focus.action.href}
          style={{
            fontSize: 'var(--gx-text-xs)', fontWeight: 600, padding: '7px 14px',
            borderRadius: 999, background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)',
          }}
        >
          {focus.action.label}
        </Link>
        {focus.ask && (
          <button
            onClick={() => onAsk(focus.ask)}
            style={{
              fontSize: 'var(--gx-text-xs)', fontWeight: 600, padding: '7px 14px',
              borderRadius: 999, background: 'var(--gx-bg)',
              border: '1px solid var(--gx-accent-border)', color: 'var(--gx-accent-hover)',
            }}
          >
            Ask about this
          </button>
        )}
      </div>

      {strip.length > 0 && (
        <div style={{
          marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--gx-accent-border)',
          fontSize: 'var(--gx-text-2xs)', color: 'var(--gx-text-subtle)',
        }}>
          {strip.join('  ·  ')}
        </div>
      )}

      {focus.unknowns?.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 'var(--gx-text-2xs)', color: 'var(--gx-text-subtle)', lineHeight: 1.6 }}>
          I still don&apos;t know: {focus.unknowns.join('; ')}.
        </div>
      )}
    </div>
  );
}

export default function ChatbotPage() {
  const [mode, setMode] = useState('general');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [restored, setRestored] = useState(false);
  const [focus, setFocus] = useState(null);
  const [signals, setSignals] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  // The proactive focus. Failing to load it is silent by design — the chat is
  // the product, the nudge is additive, and a toast about a nudge would be
  // noise. Nothing here blocks or delays sending a message.
  useEffect(() => {
    let alive = true;
    mentorAPI.getFocus()
      .then(res => {
        if (!alive) return;
        setFocus(res.data?.focus || null);
        setSignals(res.data?.signals || null);
      })
      .catch(() => { /* focus unavailable — render the chat exactly as before */ });
    return () => { alive = false; };
  }, []);

  // Restore conversation on mount so navigating away and back keeps history.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch { /* ignore corrupt/absent storage */ }
    setRestored(true);
  }, []);

  // Persist after every change — but only once we've restored (so we never
  // clobber saved history with the initial empty array) and strip the transient
  // "loading" placeholder so a half-sent turn isn't frozen into storage.
  useEffect(() => {
    if (!restored) return;
    try {
      const persistable = messages.filter(m => !m.loading);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch { /* quota/serialization errors are non-fatal */ }
  }, [messages, restored]);

  function clearChat() {
    setMessages([]);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  }

  async function send(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, { role:'user', content: msg }, { role:'assistant', content:'...', loading:true }]);
    setLoading(true);
    try {
      const res = await chatbotAPI.sendMessage({ message: msg, mode, conversationHistory: history });
      setMessages(prev => [...prev.slice(0,-1), { role:'assistant', content: res.data.response }]);
    } catch {
      toast.error('Chatbot failed');
      setMessages(prev => prev.slice(0,-1));
    } finally { setLoading(false); }
  }

  return (
    <div className="w-full flex flex-col" style={{ height:'calc(100vh - 120px)', width: '100%' }}>
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold">Mentor</h1>
          {messages.length > 0 && (
            <button onClick={clearChat}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 transition-all">
              Clear chat
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {MODES.map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-all ${mode === m ? 'bg-success text-white border-success' : 'bg-white text-gray-400 border-gray-200'}`}>{m}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-4" style={{ width: '100%' }}>
        {/* Proactive first — the mentor speaks before being asked. It scrolls
            away with the conversation rather than permanently eating height. */}
        <FocusCard focus={focus} signals={signals} onAsk={send} />

        <div className="space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-4">
            <div className="text-sm text-gray-400">Ask anything — coding, career, domain, projects</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10, width: '100%' }}>
              {QUICK.map((q, i) => (
                <button key={i} onClick={() => send(q)}
                  className="text-xs p-2.5 rounded-xl border border-gray-100 hover:border-success text-left text-gray-500 hover:text-dark transition-all">{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
              style={{
                background: m.role === 'user' ? 'var(--gx-success)' : 'var(--gx-surface)',
                border: m.role === 'user' ? '1px solid var(--gx-success-border)' : '1px solid var(--gx-border)',
                color: m.role === 'user' ? 'var(--gx-text-inverse)' : 'var(--gx-text)'
              }}>
              {m.loading ? <span className="animate-pulse">...</span> : m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
        </div>
      </div>

      <div className="flex gap-2 flex-shrink-0" style={{ width: '100%' }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask anything..." className="input flex-1" style={{ width: '100%' }} />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          className="btn-primary px-5" style={{ background:'var(--gx-success)', borderColor:'var(--gx-success)' }}>Send</button>
      </div>
    </div>
  );
}
