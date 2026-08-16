'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { signIn } from 'next-auth/react';
import { trackSignup } from '@/lib/analytics';
import { MessageCircle } from 'lucide-react';

const PURPLE = 'var(--gx-accent)';
const PURPLE_LIGHT = 'var(--gx-accent)';
const BG = 'var(--gx-surface)';
const CARD = 'var(--gx-bg)';
const MUTED = 'var(--gx-text-muted)';

// State machine
const STEPS = ['name', 'email', 'password', 'college', 'domain', 'company', 'level', 'creating'];

// Skill-level choice — drives whether the roadmap starts at fundamentals or the
// BUILD phase (see /api/roadmap/skip-basics and curriculumGenerator).
const LEVEL_CHIPS = [
  { label: '🌱 Start from basics', value: 'beginner' },
  { label: '⚡ Skip to advanced',  value: 'advanced' },
];

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

const firstName = (name) => (name || '').trim().split(/\s+/)[0] || 'there';

// The AI message for each step. Some depend on collected data.
function aiPrompt(step, data) {
  const name = firstName(data.name);
  switch (step) {
    case 'name':
      return "Hey! 👋 I'm GENOIS, your placement mentor. What's your name?";
    case 'email':
      return `Nice to meet you, ${name}. What's your email? You'll use it to log in.`;
    case 'password':
      return "Set a strong password — at least 8 characters, one uppercase, one number.";
    case 'college':
      return "Which college are you from?";
    case 'domain':
      return "Which domain do you want to build your career in?";
    case 'company':
      return "What's your target company?";
    case 'level':
      return "Last one — are you starting fresh, or should we skip the basics?";
    case 'creating':
      return `Perfect, ${name}. Setting up your account...`;
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
  const [data, setData] = useState({ name: '', email: '', password: '', college: '', domain_slug: '', target_companies: [], level: 'beginner' });
  const [messages, setMessages] = useState([]); // { from:'ai'|'user', text }
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [retryPassword, setRetryPassword] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);

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

  // ─── Google OAuth ───────────────────────────────────────────────────────────
  // Same NextAuth broker flow as /login. On success NextAuth navigates away; on
  // failure/cancel it returns the user to /login?error=<code> (our pages.error),
  // where the login page renders a clean banner. redirect:true (default) hands
  // the full redirect to NextAuth.
  //
  // ── Google Cloud Console › Credentials › OAuth 2.0 Client ─────────────────────
  // NextAuth's fixed callback path is /api/auth/callback/google. Register BOTH
  // "Authorized redirect URIs" (exact, no trailing slash) and set NEXTAUTH_URL
  // to the matching origin per environment:
  //   • Local dev : http://localhost:3000/api/auth/callback/google   (NEXTAUTH_URL=http://localhost:3000)
  //   • Production: https://genois.in/api/auth/callback/google        (NEXTAUTH_URL=https://genois.in)
  // "Authorized JavaScript origins": http://localhost:3000 and https://genois.in.
  const handleGoogleSignup = async () => {
    if (googleLoading) return; // guard against duplicate clicks during redirect
    setGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/auth/google-callback' });
    } catch (err) {
      console.error('Google sign-up threw:', err);
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
      if (v.length < 2) { setMessages((m) => [...m, { from: 'user', text: input }]); setInput(''); friendlyError('That name looks too short. Please enter your full name.'); return; }
      advance('name', v, v, { name: v });
    } else if (step === 'email') {
      if (!v.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        setMessages((m) => [...m, { from: 'user', text: input }]); setInput('');
        friendlyError('That email doesn\'t look right. It should be in the format: name@domain.com');
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
        friendlyError(`That password isn't strong enough.\n\nIt needs all of these:\n• Uppercase letter ${hasUpper ? '✓' : '✗'}\n• Lowercase letter ${hasLower ? '✓' : '✗'}\n• Number (0-9) ${hasNumber ? '✓' : '✗'}\n• 8+ characters ${hasLength ? '✓' : '✗'}\n\nExample: ${initial}bhi@2024`);
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
      if (v.length < 2) { setMessages((m) => [...m, { from: 'user', text: input }]); setInput(''); friendlyError('Please enter your full college name.'); return; }
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

  const pickLevel = (chip) => {
    if (typing) return;
    advance('level', chip.value, chip.label, { level: chip.value });
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
        level: finalData.level || 'beginner',
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
        pushAI(`Server error. Please try again. (${res.status})`);
        return;
      }

      if (!d.success) {
        // A duplicate email is NOT a password problem — retrying the password
        // will never help. Route the user toward login instead of looping them
        // back through the password step.
        if (d.code === 'email_exists' || res.status === 409) {
          setEmailTaken(true);
          pushAI(`${d.message || 'This email is already registered.'} You can log in below.`);
          return;
        }
        // Roll back to the password step so the user can fix strength issues —
        // retryPassword keeps us from re-asking college/domain/company.
        setStep('password');
        setRetryPassword(true);
        pushAI(`Hmm, the account couldn't be created. ${d.message || 'Something went wrong'}. Please try your password again.`);
        return;
      }

      const { user, token } = d.data || {};
      if (!token) {
        setStep('password');
        setRetryPassword(true);
        pushAI('Your account was created but sign-in failed. Please try again.');
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
      toast.success('Account created! Welcome to GENOIS');
      window.location.href = '/dashboard';
    } catch (err) {
      setStep('password');
      setRetryPassword(true);
      pushAI(`Network error. Check your connection and try again. (${err.message})`);
    }
  };

  const showChips = !typing && (step === 'domain' || step === 'company' || step === 'level');
  const showInput = !typing && ['name', 'email', 'password', 'college'].includes(step);
  const isCreating = step === 'creating';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: BG, fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--gx-border)', flexShrink: 0 }}>
        <Link href="/" style={{ textDecoration: 'none', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 24, letterSpacing: 0.5 }}>
          <span style={{ color: PURPLE }}>GEN</span><span style={{ color: 'var(--gx-text)' }}>OIS</span>
        </Link>
        <Link href="/login" style={{ color: PURPLE_LIGHT, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Sign in →</Link>
      </div>

      {/* ─── PRE-CHAT WELCOME ─── */}
      {!started && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
          <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px', background: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 34, color: 'var(--gx-text-inverse)', boxShadow: 'var(--gx-shadow-sm)' }}>G</div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: 'var(--gx-text)', margin: '0 0 10px' }}>Let&apos;s set you up</h1>
            <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.6, margin: '0 0 28px' }}>
              No boring forms. Just a quick chat and your free beta account is ready. Shall we begin?
            </p>

            <button onClick={beginChat} style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: PURPLE, color: 'var(--gx-text-inverse)',
              fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700,
              boxShadow: 'var(--gx-shadow-sm)', marginBottom: 20,
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><MessageCircle size={18} strokeWidth={2} /> Start the chat</span>
            </button>

            <p style={{ color: MUTED, fontSize: 13, margin: '0 0 14px' }}>Or sign up directly with Google:</p>

            <button onClick={handleGoogleSignup} disabled={googleLoading} type="button" style={{
              width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--gx-border)',
              background: 'var(--gx-bg)', color: 'var(--gx-text)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600,
              cursor: googleLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, transition: 'all 0.2s', opacity: googleLoading ? 0.7 : 1,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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
                  <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, color: 'var(--gx-text-inverse)' }}>G</div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '10px 14px', borderRadius: msg.from === 'ai' ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                  background: msg.from === 'ai' ? 'var(--gx-accent-soft)' : CARD,
                  border: msg.from === 'ai' ? '1px solid var(--gx-accent-border)' : '1px solid var(--gx-border)',
                  color: 'var(--gx-text)', fontSize: 14.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {msg.text || '​'}
                </div>
              </div>
            ))}

            {typing && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, color: 'var(--gx-text-inverse)' }}>G</div>
                <div style={{ padding: '12px 16px', borderRadius: '4px 14px 14px 14px', background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-accent-border)', display: 'flex', gap: 4 }}>
                  <span className="gen-dot" style={{ animationDelay: '0s' }} />
                  <span className="gen-dot" style={{ animationDelay: '0.2s' }} />
                  <span className="gen-dot" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}

            {isCreating && !typing && !emailTaken && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                <div style={{ width: 32, height: 32, border: `3px solid var(--gx-accent-border)`, borderTopColor: PURPLE, borderRadius: '50%', animation: 'gen-spin 0.8s linear infinite' }} />
              </div>
            )}

            {emailTaken && !typing && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 16px 16px' }}>
                <Link href="/login" style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 28px', borderRadius: 12, textDecoration: 'none',
                  background: PURPLE, color: 'var(--gx-text-inverse)',
                  fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700,
                  boxShadow: 'var(--gx-shadow-sm)',
                }}>Go to Login →</Link>
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
              {step === 'level' && LEVEL_CHIPS.map((c) => (
                <button key={c.value} onClick={() => pickLevel(c)} className="gen-chip">{c.label}</button>
              ))}
            </div>
          )}

          {/* Input bar */}
          {showInput && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gx-border)', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
              <input
                ref={inputRef}
                type={step === 'password' ? 'password' : step === 'email' ? 'email' : 'text'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitTyped(); } }}
                placeholder={placeholders[step]}
                autoComplete={step === 'password' ? 'new-password' : step === 'email' ? 'email' : 'off'}
                style={{
                  flex: 1, padding: '13px 16px', borderRadius: 24, border: '1px solid var(--gx-accent-border)',
                  background: 'var(--gx-surface)', color: 'var(--gx-text)', fontSize: 15, fontFamily: 'var(--font-body)', outline: 'none',
                }}
              />
              <button onClick={submitTyped} aria-label="Send" style={{
                width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                background: PURPLE, color: 'var(--gx-text-inverse)', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--gx-shadow-sm)',
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
          padding: 9px 16px; border-radius: 22px; border: 1px solid var(--gx-accent-border);
          background: var(--gx-accent-soft); color: var(--gx-accent); font-size: 13.5px; font-weight: 600;
          font-family: var(--font-body); cursor: pointer; transition: background-color 0.15s, color 0.15s;
        }
        .gen-chip:hover { background: ${PURPLE}; color: var(--gx-text-inverse); }
      `}</style>
    </div>
  );
}
