'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { signIn } from 'next-auth/react';
import { trackSignup } from '@/lib/analytics';
import { MessageCircle } from 'lucide-react';

const PURPLE = '#6366f1';
const PURPLE_LIGHT = '#818cf8';
const BG = '#0d0d14';
const CARD = '#13131f';
const MUTED = '#8b93a1';

// State machine
const STEPS = ['name', 'email', 'password', 'college', 'domain', 'company', 'creating'];

const DOMAIN_CHIPS = [
  { label: 'DSA',           slug: 'dsa' },
  { label: 'Full Stack',    slug: 'fullstack' },
  { label: 'AI/ML',         slug: 'aiml' },
  { label: 'Cybersecurity', slug: 'cybersecurity' },
  { label: 'DevOps',        slug: 'devops' },
  { label: 'Android',       slug: 'android' },
  { label: 'Data Science',  slug: 'datascience' },
  { label: 'Blockchain',    slug: 'blockchain' },
  { label: 'Game Dev',      slug: 'gamedev' },
  { label: 'System Design', slug: 'systemdesign' },
];

const COMPANY_CHIPS = ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Amazon', 'Other'];

const firstName = (name) => (name || '').trim().split(/\s+/)[0] || 'bhai';

// The AI message for each step. Some depend on collected data.
function aiPrompt(step, data) {
  const name = firstName(data.name);
  switch (step) {
    case 'name':
      return "Hey! 👋 I'm GENOIS — your placement buddy. Apna naam bata bhai, kya kehte hain tujhe?";
    case 'email':
      return `Nice ${name}! Ab tera email bata — isi se login karega. Pakka yaad rakhna!`;
    case 'password':
      return "Perfect! Ek strong password set kar.\n\nZaroor include kar:\n• Ek uppercase letter (A-Z)\n• Ek number (0-9)\n• Minimum 8 characters\n\nJaise: Abhi@2024";
    case 'college':
      return `${name} bhai, tera college kaunsa hai? (e.g. KLE Hubballi, VTU, RGPV...)`;
    case 'domain':
      return "Kaunse domain mein career banana hai? Ek choose kar:";
    case 'company':
      return "Last one! Target company kaunsi hai?";
    case 'creating':
      return `Sab ready hai ${name}! Tera free Dominator account bana raha hoon...`;
    default:
      return '';
  }
}

const placeholders = {
  name:     'Type your name…',
  email:    'your@email.com',
  password: 'At least 8 characters…',
  college:  'Your college name…',
  domain:   'Pick a domain above',
  company:  'Pick a company above',
};

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState('name');
  const [data, setData] = useState({ name: '', email: '', password: '', college: '', domain_slug: '', target_companies: [] });
  const [messages, setMessages] = useState([]); // { from:'ai'|'user', text }
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [retryPassword, setRetryPassword] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const typeTimer = useRef(null);

  // Auto-scroll to bottom on new messages / typing
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  // Typewriter: push an AI message that types out char-by-char.
  const pushAI = (fullText, after) => {
    setTyping(true);
    // "..." typing indicator delay before message appears
    const startDelay = setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { from: 'ai', text: '' }]);
      let i = 0;
      const tick = () => {
        i += 1;
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { from: 'ai', text: fullText.slice(0, i) };
          return copy;
        });
        if (i < fullText.length) {
          typeTimer.current = setTimeout(tick, 20);
        } else if (after) {
          after();
        }
      };
      typeTimer.current = setTimeout(tick, 20);
    }, 500);
    typeTimer.current = startDelay;
  };

  useEffect(() => () => clearTimeout(typeTimer.current), []);

  // Focus input when waiting for a typed answer
  useEffect(() => {
    if (started && !typing && ['name', 'email', 'password', 'college'].includes(step)) {
      inputRef.current?.focus();
    }
  }, [started, typing, step]);

  const beginChat = () => {
    setStarted(true);
    pushAI(aiPrompt('name', data));
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/auth/google-callback' });
    } catch {
      toast.error('Google sign-up failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  // Advance to the next step: record the user's bubble, then ask the next question.
  const advance = (fromStep, value, displayValue, patch) => {
    setMessages((m) => [...m, { from: 'user', text: displayValue }]);
    setData((d) => ({ ...d, ...patch }));
    setInput('');
    const next = STEPS[STEPS.indexOf(fromStep) + 1];
    setStep(next);
    if (next === 'creating') {
      // Build the final payload from the freshly-patched data.
      const finalData = { ...data, ...patch };
      pushAI(aiPrompt('creating', finalData), () => createAccount(finalData));
    } else {
      pushAI(aiPrompt(next, { ...data, ...patch }));
    }
  };

  const friendlyError = (msg) => {
    pushAI(msg);
  };

  const submitTyped = () => {
    if (typing) return;
    const v = input.trim();

    if (step === 'name') {
      if (v.length < 2) { setMessages((m) => [...m, { from: 'user', text: input }]); setInput(''); friendlyError('Arre naam thoda bada hoga na bhai. Full naam likh!'); return; }
      advance('name', v, v, { name: v });
    } else if (step === 'email') {
      if (!v.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        setMessages((m) => [...m, { from: 'user', text: input }]); setInput('');
        friendlyError('Yeh email sahi nahi laga. Format hona chahiye: name@domain.com');
        return;
      }
      advance('email', v, v, { email: v.toLowerCase() });
    } else if (step === 'password') {
      // Client-side validation — catch strength issues immediately at step 3
      // instead of after all 7 steps. Must mirror backend checkPasswordStrength
      // EXACTLY (lib/security.js): upper + lower + number + 8 chars. Missing the
      // lowercase rule here let "ABHI@2024" pass the client and silently 400 on
      // the server, stranding the user in a retry loop.
      const hasUpper = /[A-Z]/.test(v);
      const hasLower = /[a-z]/.test(v);
      const hasNumber = /[0-9]/.test(v);
      const hasLength = v.length >= 8;

      if (!hasUpper || !hasLower || !hasNumber || !hasLength) {
        setMessages((m) => [...m, { from: 'user', text: '••••••••' }]); setInput('');
        const initial = data.name?.charAt(0).toUpperCase() || 'A';
        friendlyError(`Password strong nahi laga.\n\nYeh sab chahiye:\n• Uppercase letter ${hasUpper ? '✓' : '✗'}\n• Lowercase letter ${hasLower ? '✓' : '✗'}\n• Number (0-9) ${hasNumber ? '✓' : '✗'}\n• 8+ characters ${hasLength ? '✓' : '✗'}\n\nJaise: ${initial}bhi@2024`);
        return;
      }

      if (retryPassword) {
        // Retrying after a backend account-creation failure: go straight back
        // to creating with the existing data + new password — don't re-ask
        // college/domain/company.
        setRetryPassword(false);
        const newData = { ...data, password: v };
        setData(newData);
        setMessages((m) => [...m, { from: 'user', text: '••••••••' }]);
        setInput('');
        setStep('creating');
        pushAI(aiPrompt('creating', newData), () => createAccount(newData));
        return;
      }

      advance('password', v, '••••••••', { password: v });
    } else if (step === 'college') {
      if (v.length < 2) { setMessages((m) => [...m, { from: 'user', text: input }]); setInput(''); friendlyError('College ka poora naam likh bhai!'); return; }
      advance('college', v, v, { college: v });
    }
  };

  const pickDomain = (chip) => {
    if (typing) return;
    advance('domain', chip.slug, chip.label, { domain_slug: chip.slug });
  };

  const pickCompany = (company) => {
    if (typing) return;
    advance('company', company, company, { target_companies: [company] });
  };

  const createAccount = async (finalData) => {
    try {
      console.log('Creating account for:', finalData.name, finalData.email, 'domain:', finalData.domain_slug);

      // API (route.js Zod schema) expects camelCase `domainSlug`. `college` is
      // optional/nullable server-side — send null (not '') when empty so it maps
      // cleanly to the nullable column. `target_companies` is stripped by Zod.
      const payload = {
        name: finalData.name,
        email: finalData.email,
        password: finalData.password,
        college: finalData.college || null,
        domainSlug: finalData.domain_slug || 'fullstack',
        target_companies: finalData.target_companies || [],
      };
      console.log('Signup payload:', JSON.stringify({ ...payload, password: '[HIDDEN]' }));

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Read the raw body first so a non-JSON / HTML error page doesn't throw
      // an unhandled SyntaxError and leave the user stuck on the spinner.
      const text = await res.text();
      console.log('API response status:', res.status);
      console.log('API response:', text);
      let d;
      try {
        d = JSON.parse(text);
      } catch {
        setStep('password');
        setRetryPassword(true);
        pushAI(`Server error. Ek baar aur try kar. (${res.status})`);
        return;
      }

      if (!d.success) {
        // Roll back to the password step so the user can fix strength issues —
        // retryPassword keeps us from re-asking college/domain/company.
        setStep('password');
        setRetryPassword(true);
        pushAI(`Hmm, account nahi bana. ${d.message || 'Kuch galat ho gaya'}. Password dobara try kar!`);
        return;
      }

      const { user, token } = d.data || {};
      if (!token) {
        setStep('password');
        setRetryPassword(true);
        pushAI('Account bana but login nahi hua. Ek baar try kar!');
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('genois_token', token);
        localStorage.setItem('genois_user', JSON.stringify(user));
        localStorage.setItem('genois_plan', user?.subscription_plan || 'spectator');
        document.cookie = `genois_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      }

      // Hydrate the auth store so the dashboard sees the session immediately.
      try {
        const { default: useAuthStore } = await import('@/store/authStore');
        useAuthStore.getState().setAuth(user, token);
      } catch {}

      trackSignup('email');
      toast.success('Account ban gaya! Welcome to GENOIS');
      window.location.href = '/dashboard';
    } catch (err) {
      setStep('password');
      setRetryPassword(true);
      pushAI(`Network error. Check internet aur dobara try kar! (${err.message})`);
    }
  };

  const showChips = !typing && (step === 'domain' || step === 'company');
  const showInput = !typing && ['name', 'email', 'password', 'college'].includes(step);
  const isCreating = step === 'creating';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: BG, fontFamily: 'Outfit,sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(99,102,241,0.1)', flexShrink: 0 }}>
        <Link href="/" style={{ textDecoration: 'none', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 24, letterSpacing: 0.5 }}>
          <span style={{ color: PURPLE }}>GEN</span><span style={{ color: '#f8fafc' }}>OIS</span>
        </Link>
        <Link href="/login" style={{ color: PURPLE_LIGHT, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Sign in →</Link>
      </div>

      {/* ─── PRE-CHAT WELCOME ─── */}
      {!started && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
          <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px', background: `linear-gradient(135deg, ${PURPLE}, #4f46e5)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 34, color: '#fff', boxShadow: '0 12px 36px rgba(99,102,241,0.4)' }}>G</div>
            <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 800, color: '#f8fafc', margin: '0 0 10px' }}>Let&apos;s set you up</h1>
            <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.6, margin: '0 0 28px' }}>
              No boring forms. Bas thodi si baat-cheet aur tera free Dominator account ready! Chalein?
            </p>

            <button onClick={beginChat} style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${PURPLE}, #4f46e5)`, color: '#fff',
              fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700,
              boxShadow: '0 8px 24px rgba(99,102,241,0.32)', marginBottom: 20,
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><MessageCircle size={18} strokeWidth={2} /> Start the chat</span>
            </button>

            <p style={{ color: MUTED, fontSize: 13, margin: '0 0 14px' }}>Ya seedha Google se sign up kar:</p>

            <button onClick={handleGoogleSignup} disabled={googleLoading} type="button" style={{
              width: '100%', padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
              background: '#fff', color: '#1f2937', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 600,
              cursor: googleLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, transition: 'all 0.2s', opacity: googleLoading ? 0.7 : 1,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Connecting…' : 'Sign up with Google'}
            </button>
          </div>
        </div>
      )}

      {/* ─── CHAT ─── */}
      {started && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 560, width: '100%', margin: '0 auto', minHeight: 0 }}>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'ai' ? 'flex-start' : 'flex-end', alignItems: 'flex-end', gap: 8 }}>
                {msg.from === 'ai' && (
                  <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${PURPLE}, #4f46e5)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, color: '#fff' }}>G</div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '10px 14px', borderRadius: msg.from === 'ai' ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                  background: msg.from === 'ai' ? 'rgba(99,102,241,0.16)' : CARD,
                  border: msg.from === 'ai' ? '1px solid rgba(99,102,241,0.28)' : '1px solid rgba(255,255,255,0.08)',
                  color: '#f1f5f9', fontSize: 14.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {msg.text || '​'}
                </div>
              </div>
            ))}

            {typing && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${PURPLE}, #4f46e5)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, color: '#fff' }}>G</div>
                <div style={{ padding: '12px 16px', borderRadius: '4px 14px 14px 14px', background: 'rgba(99,102,241,0.16)', border: '1px solid rgba(99,102,241,0.28)', display: 'flex', gap: 4 }}>
                  <span className="gen-dot" style={{ animationDelay: '0s' }} />
                  <span className="gen-dot" style={{ animationDelay: '0.2s' }} />
                  <span className="gen-dot" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}

            {isCreating && !typing && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                <div style={{ width: 32, height: 32, border: `3px solid rgba(99,102,241,0.25)`, borderTopColor: PURPLE, borderRadius: '50%', animation: 'gen-spin 0.8s linear infinite' }} />
              </div>
            )}
          </div>

          {/* Domain / company chips */}
          {showChips && (
            <div style={{ padding: '0 16px 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {step === 'domain' && DOMAIN_CHIPS.map((c) => (
                <button key={c.slug} onClick={() => pickDomain(c)} className="gen-chip">{c.label}</button>
              ))}
              {step === 'company' && COMPANY_CHIPS.map((c) => (
                <button key={c} onClick={() => pickCompany(c)} className="gen-chip">{c}</button>
              ))}
            </div>
          )}

          {/* Input bar */}
          {showInput && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(99,102,241,0.1)', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
              <input
                ref={inputRef}
                type={step === 'password' ? 'password' : step === 'email' ? 'email' : 'text'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitTyped(); } }}
                placeholder={placeholders[step]}
                autoComplete={step === 'password' ? 'new-password' : step === 'email' ? 'email' : 'off'}
                style={{
                  flex: 1, padding: '13px 16px', borderRadius: 24, border: '1px solid rgba(99,102,241,0.25)',
                  background: 'rgba(255,255,255,0.04)', color: '#f8fafc', fontSize: 15, fontFamily: 'Outfit,sans-serif', outline: 'none',
                }}
              />
              <button onClick={submitTyped} aria-label="Send" style={{
                width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                background: `linear-gradient(135deg, ${PURPLE}, #4f46e5)`, color: '#fff', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(99,102,241,0.34)',
              }}>↑</button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes gen-spin { to { transform: rotate(360deg); } }
        @keyframes gen-bounce { 0%,80%,100% { transform: translateY(0); opacity:.5 } 40% { transform: translateY(-5px); opacity:1 } }
        .gen-dot { width:7px; height:7px; border-radius:50%; background:${PURPLE_LIGHT}; display:inline-block; animation: gen-bounce 1.2s infinite ease-in-out; }
        .gen-chip {
          padding: 9px 16px; border-radius: 22px; border: 1px solid rgba(99,102,241,0.35);
          background: rgba(99,102,241,0.08); color: #c7d2fe; font-size: 13.5px; font-weight: 600;
          font-family: Outfit, sans-serif; cursor: pointer; transition: all 0.15s;
        }
        .gen-chip:hover { background: ${PURPLE}; color: #fff; transform: translateY(-1px); }
      `}</style>
    </div>
  );
}
