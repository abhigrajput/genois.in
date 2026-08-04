'use client';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { chatbotAPI } from '@/lib/api';

const MODES = ['general','coding','domain','project','career'];
const QUICK = [
  "What is a REST API?","Explain recursion with example","How does HTTP work?",
  "Best resources for my domain","How to prepare for placements?","SQL vs NoSQL difference"
];

const STORAGE_KEY = 'genois_chat_history';

export default function ChatbotPage() {
  const [mode, setMode] = useState('general');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [restored, setRestored] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

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

      <div className="flex-1 overflow-y-auto space-y-3 mb-4" style={{ width: '100%' }}>
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
