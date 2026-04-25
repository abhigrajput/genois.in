'use client';
import { useState } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

const TYPES = [
  { value:'bug',      label:'🐛 Bug Report',       desc:'Something is broken' },
  { value:'feature',  label:'💡 Feature Request',   desc:'I want something new' },
  { value:'question', label:'❓ Question',           desc:'I need help' },
  { value:'complaint',label:'😤 Complaint',          desc:'Something frustrated me' },
  { value:'praise',   label:'🙌 Praise',             desc:'Something works great' },
  { value:'general',  label:'💬 General',            desc:'Something else' },
];

const inp = { width:'100%', padding:'12px 14px', borderRadius:10, border:'1px solid rgba(0,240,255,0.12)', background:'#070f1f', color:'#e8f4ff', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'Outfit,sans-serif' };
const label = { fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#5a7a9a', letterSpacing:2, marginBottom:8, display:'block' };

export default function FeedbackPage() {
  const { token } = useToken();
  const [type, setType] = useState('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!message || message.trim().length < 10) { toast.error('Please write at least 10 characters'); return; }
    setSending(true);
    try {
      await apiFetch('/api/feedback', token, 'POST', { type, subject, message, email });
      setSent(true);
      toast.success('Feedback sent! We will look into it.');
    } catch (e) { toast.error(e.message); }
    setSending(false);
  }

  if (sent) return (
    <div style={{ maxWidth:560, margin:'0 auto', textAlign:'center', padding:40, fontFamily:'Outfit,sans-serif' }}>
      <div style={{ fontSize:64, marginBottom:20 }}>🙏</div>
      <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:800, color:'#e8f4ff', marginBottom:12 }}>Feedback Received</h1>
      <p style={{ color:'#5a7a9a', fontSize:14, lineHeight:1.7, marginBottom:24 }}>
        Thank you for taking the time to write to us. We read every message and will get back to you if needed.
      </p>
      <button onClick={() => { setSent(false); setMessage(''); setSubject(''); }} style={{ padding:'12px 24px', borderRadius:10, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#00f0ff,#7b5cff)', color:'#020812', fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700 }}>
        Send Another →
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth:640, margin:'0 auto', fontFamily:'Outfit,sans-serif' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:800, color:'#e8f4ff', marginBottom:4 }}>💬 Send Feedback</h1>
        <p style={{ color:'#5a7a9a', fontSize:13 }}>Bug? Suggestion? Complaint? We want to hear it. Every message goes directly to the founder.</p>
      </div>

      <div style={{ ...label, display:'block', marginBottom:12 }}>TYPE OF FEEDBACK</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:8, marginBottom:20 }}>
        {TYPES.map(t => (
          <button key={t.value} onClick={() => setType(t.value)} style={{ padding:'12px 14px', borderRadius:10, border:`1px solid ${type===t.value?'rgba(0,240,255,0.4)':'rgba(255,255,255,0.06)'}`, background:type===t.value?'rgba(0,240,255,0.08)':'rgba(255,255,255,0.02)', cursor:'pointer', textAlign:'left' }}>
            <div style={{ fontSize:13, fontWeight:600, color:type===t.value?'#00f0ff':'#e8f4ff', marginBottom:3 }}>{t.label}</div>
            <div style={{ fontSize:11, color:'#5a7a9a' }}>{t.desc}</div>
          </button>
        ))}
      </div>

      <div style={{ marginBottom:16 }}>
        <span style={label}>SUBJECT</span>
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description..." style={inp} />
      </div>

      <div style={{ marginBottom:16 }}>
        <span style={label}>YOUR MESSAGE *</span>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} placeholder="Describe the issue or suggestion in detail. The more specific the better." style={{ ...inp, resize:'vertical', lineHeight:1.6 }} />
        <div style={{ fontSize:11, color:message.length>10?'#1D9E75':'#5a7a9a', marginTop:4, fontFamily:'JetBrains Mono,monospace' }}>{message.length} characters {message.length>10?'✓':''}</div>
      </div>

      <div style={{ marginBottom:24 }}>
        <span style={label}>YOUR EMAIL (optional — for reply)</span>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email" style={inp} />
      </div>

      <button onClick={submit} disabled={sending || !message} style={{ width:'100%', padding:14, borderRadius:12, border:'none', cursor:sending||!message?'not-allowed':'pointer', background:sending||!message?'rgba(0,240,255,0.15)':'linear-gradient(135deg,#00f0ff,#7b5cff)', color:'#020812', fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, transition:'all 0.2s' }}>
        {sending ? 'Sending...' : 'Send Feedback →'}
      </button>

      <div style={{ marginTop:16, textAlign:'center', fontSize:12, color:'#3a4a5a' }}>
        Every message goes directly to the founder. We read all of them.
      </div>
    </div>
  );
}
