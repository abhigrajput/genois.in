'use client';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { mentorAPI } from '@/lib/api';

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

export default function MentorPage() {
  const [mode, setMode] = useState('explain');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

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
    } catch {
      setMessages(prev => prev.slice(0,-1));
      toast.error('Mentor failed to respond');
    } finally { setLoading(false); }
  }

  return (
    <div className="w-full flex flex-col" style={{ maxWidth: 1600, margin: '0 auto', height:'calc(100vh - 120px)' }}>
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold mb-3">AI Mentor</h1>
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
                background: m.role === 'user' ? 'linear-gradient(135deg,rgba(29,158,117,0.35),rgba(29,158,117,0.15))' : 'rgba(255,255,255,0.05)',
                border: m.role === 'user' ? '1px solid rgba(29,158,117,0.35)' : '1px solid rgba(255,255,255,0.08)',
                color: '#e8f4ff'
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
  );
}
