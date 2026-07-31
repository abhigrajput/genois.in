'use client';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { mentorAPI } from '@/lib/api';
import PermissionGate from '@/components/PermissionGate';
import { usePermission } from '@/lib/usePermission';
import { friendlyError } from '@/components/ui/ErrorCard';

const MODES = [
  { value:'explain', label:'Explain Concept' },
  { value:'coding', label:'Coding Help' },
  { value:'roadmap', label:'Roadmap Help' },
  { value:'project', label:'Project Help' },
  { value:'notes', label:'Fix Weak Topics' },
];

const QUICK = {
  explain:["Explain today's topic simply","Give a real-world example","What should I know first?"],
  coding:["Help with coding challenge","Review my approach","Explain time complexity"],
  roadmap:["What to focus on today?","Am I on track?","How long will this take?"],
  project:["Help me start the project","What tech stack to use?","I'm stuck on a step"],
  notes:["Explain my weak topics","Quiz me on today's topic","Key points to remember"],
};

const STORAGE_KEY = 'genois_mentor_history';

export default function MentorPage() {
  const { userPlan } = usePermission();
  const [mode, setMode] = useState('explain');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [restored, setRestored] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  // Restore mentor conversation on mount (persists across navigation).
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch { /* ignore corrupt/absent storage */ }
    setRestored(true);
  }, []);

  // Persist settled messages only, and only after restore, so we never wipe
  // saved history with the initial empty array.
  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.filter(m => !m.loading)));
    } catch { /* non-fatal */ }
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
      const res = await mentorAPI.sendMessage({ message: msg, mode, conversationHistory: history });
      setMessages(prev => [...prev.slice(0,-1), { role:'assistant', content: res.data.response }]);
    } catch (e) {
      setMessages(prev => prev.slice(0,-1));
      setInput(msg); // put the question back so a retry is one keypress away
      toast.error(friendlyError(e, 'get a mentor reply — the AI may be busy'));
    } finally { setLoading(false); }
  }

  return (
    <PermissionGate feature="ai_mentor">
    <div className="w-full flex flex-col" style={{ maxWidth: 1600, margin: '0 auto', height:'calc(100vh - 120px)' }}>
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold">AI Mentor</h1>
          {messages.length > 0 && (
            <button onClick={clearChat}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 transition-all">
              Clear chat
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {MODES.map(m => (
            <button key={m.value} onClick={() => setMode(m.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${mode === m.value ? 'bg-primary text-white border-primary' : 'bg-white text-gray-400 border-gray-200 hover:border-primary'}`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-10 space-y-4">
            <div className="text-4xl">◉</div>
            <div className="font-semibold text-dark">Your personal AI Mentor</div>
            <div className="text-sm text-gray-400">Knows your progress, weak topics, and domain.</div>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              {(QUICK[mode] || []).map((q, i) => (
                <button key={i} onClick={() => send(q)}
                  className="text-sm text-left p-3 rounded-xl border border-gray-100 hover:border-primary hover:bg-primary/5 transition-all">
                  {q}
                </button>
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
              {m.loading ? <span className="animate-pulse">Thinking...</span> : m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={`Ask about ${mode}...`} className="input flex-1" />
        <button onClick={() => send()} disabled={loading || !input.trim()} className="btn-primary px-5">Send</button>
      </div>
    </div>
    </PermissionGate>
  );
}
