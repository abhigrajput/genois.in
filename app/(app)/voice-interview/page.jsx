'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToken, apiFetch, apiFetchWithTimeout } from '@/lib/useApi';
import toast from 'react-hot-toast';

// ── theme (app-interior palette) ───────────────────────────────────────────
const CARD = '#070f1f';
const INPUT = '#050d1a';
const CYAN = '#00d9a3';   // GENOIS green — kept under its legacy name for the result/summary screens
const PURPLE = '#ff6b4a';
const GREEN = '#1D9E75';
const RED = '#ff2d78';
const AMBER = '#EF9F27';
const MUTED = '#5a7a9a';
const LIGHT = '#e8e8ed';
const SOFT = '#c8d8e8';

// ── GENOIS green token + Slate context system ──────────────────────────────
// The waveform, mic pad and live chat matrix run on ONE brand green (#00d9a3)
// over a Slate-900 master surface with Slate-800 message containers, so the
// live-interview view reads as a single, high-contrast product surface.
const GENOIS = '#00d9a3';
const GENOIS_SOFT = '#8affdf';
const SLATE_900 = '#0f172a'; // master layout background for the chat matrix
const SLATE_850 = '#131d33'; // candidate (user) message container
const SLATE_800 = '#1e293b'; // interviewer (AI mentor) message container
const SLATE_700 = '#334155'; // container / matrix borders
const SLATE_600 = '#475569'; // muted accents
const TXT_WHITE = '#f1f5f9'; // slate-100 — primary text on slate
const TXT_SLATE = '#cbd5e1'; // slate-300 — secondary text on slate
const TXT_MUTE = '#94a3b8';  // slate-400 — captions / meta

// 4px-based spacing scale — used exclusively by the mic control pad + chat
// matrix so vertical rhythm stays consistent from 360px up to desktop.
const SP = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32 };

const TOTAL_QUESTIONS = 10;
const MIN_WORDS = 10;

// Adaptive follow-ups: after a MAIN answer is scored, the interviewer MAY probe
// once, based on what the candidate actually said. Bounded twice over — max 1
// follow-up per main question (never chained on a follow-up) and MAX_FOLLOWUPS
// per session — so an interview can never balloon past 10 + MAX_FOLLOWUPS turns.
const MAX_FOLLOWUPS = 3;
const FOLLOWUP_WAIT_MS = 4000;     // extra wait allowed on "Continue" for an in-flight decision
const FOLLOWUP_TIMEOUT_MS = 20000; // network cap for the background follow-up request

// Long technical answers can be slow to score; cap the wait so the UI never
// strands the user on a spinner. Question generation is lighter → shorter cap.
const EVAL_TIMEOUT_MS = 45000;
const QUESTION_TIMEOUT_MS = 30000;

// ── shared type shapes (JSDoc — this is a .jsx file, no TS) ─────────────────
/**
 * A single turn in the interview conversation. The committed history is built
 * from these; the interviewer prompt and the candidate answer are distinct.
 * @typedef {Object} ChatMessage
 * @property {'interviewer'|'candidate'} role   Who "spoke" this block.
 * @property {string}  text                     The prompt or the transcribed answer.
 * @property {number} [questionIndex]           Zero-based question this belongs to.
 * @property {number} [wordCount]               Words in a candidate answer.
 */

/**
 * Everything about the microphone / speech-to-text lifecycle. `committed` is
 * immutable-from-STT history for the current answer; `interim` is the volatile
 * live stream that must never overwrite `committed`.
 * @typedef {Object} AudioState
 * @property {boolean} supported   Web Speech API present.
 * @property {boolean} listening   Recognition currently running.
 * @property {boolean} blocked     Mic permission denied.
 * @property {string}  committed   Finalized transcript (survives re-renders).
 * @property {string}  interim     Live, not-yet-confirmed words.
 */

/**
 * The scoring returned by /api/interview/evaluate (or the local fallback).
 * @typedef {Object} EvaluationPayload
 * @property {number}   technicalAccuracy     0–100.
 * @property {number}   communicationClarity  0–100.
 * @property {number}   confidenceScore       0–100.
 * @property {number}   overallScore          0–100.
 * @property {string}   grade                 A+ … F.
 * @property {string[]} [strengths]           What worked.
 * @property {string[]} [improvements]        What to fix.
 * @property {string}   [verdict]             One-line summary.
 * @property {string}   [idealAnswer]         Model-answer coverage notes.
 */

const MODES = [
  { key: 'technical', icon: '⚙️', label: 'Technical', desc: 'DSA, system design, coding logic, core CS.' },
  { key: 'behavioral', icon: '🤝', label: 'Behavioral', desc: 'STAR-style situations: teamwork, conflict, failure, ownership.' },
  { key: 'hr', icon: '💬', label: 'HR', desc: 'Motivation, company fit, career goals, salary expectations.' },
  { key: 'mixed', icon: '🎲', label: 'Mixed', desc: 'A realistic blend of technical and behavioural.' },
];

const COMPANIES = ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'Amazon', 'Microsoft', 'Google', 'Flipkart'];

// apiFetchWithTimeout now lives in lib/useApi.js (shared with the aptitude
// module) — same AbortController-backed timeout, one implementation.

// STT boundary sanitizer — runs once on submit, right before the payload goes
// to the evaluator. The Web Speech API leaves two artifacts behind when its
// final results overlap: single-word echoes ("so so well") and repeated
// bigrams ("the answer the answer"). Both inflate the answer, waste the
// long-context window, and skew scoring. We also normalize raw spacing.
function cleanTranscript(text) {
  if (!text) return text;
  // 1. Normalize whitespace (split on any run of spacing → collapses + trims).
  const words = text.trim().split(/\s+/).filter(Boolean);

  // 2. Drop immediately-repeated single words (case-insensitive).
  const deduped = [];
  for (let i = 0; i < words.length; i++) {
    if (i > 0 && words[i].toLowerCase() === words[i - 1].toLowerCase()) continue;
    deduped.push(words[i]);
  }

  // 3. Collapse an immediately-repeated adjacent bigram ("a b a b" → "a b").
  //    Only touches back-to-back identical pairs, so legitimate prose is safe.
  const out = [];
  for (let i = 0; i < deduped.length; i++) {
    const prevA = out[out.length - 2];
    const prevB = out[out.length - 1];
    const curr = deduped[i];
    const next = deduped[i + 1];
    if (
      prevA !== undefined && next !== undefined &&
      prevA.toLowerCase() === curr.toLowerCase() &&
      prevB.toLowerCase() === next.toLowerCase()
    ) {
      i++; // skip the duplicate bigram's second word too
      continue;
    }
    out.push(curr);
  }

  return out.join(' ');
}

const wordsOf = (s) => (s || '').trim().split(/\s+/).filter(Boolean).length;
const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
const barColor = (v) => (v >= 75 ? GREEN : v >= 55 ? AMBER : RED);
const gradeColor = (g) => (g === 'A+' || g === 'A' ? GREEN : g === 'B+' || g === 'B' ? CYAN : g === 'C+' || g === 'C' ? AMBER : RED);
function gradeFromScore(s) {
  if (s >= 90) return 'A+'; if (s >= 80) return 'A'; if (s >= 75) return 'B+'; if (s >= 70) return 'B';
  if (s >= 65) return 'C+'; if (s >= 55) return 'C'; if (s >= 45) return 'D'; return 'F';
}

/** @type {EvaluationPayload} — shown only if scoring is unavailable and the user opts in. */
const ESTIMATED_EVAL = {
  technicalAccuracy: 70, communicationClarity: 65, confidenceScore: 75,
  overallScore: 70, grade: 'B',
  strengths: ['Answer recorded'], improvements: ['Keep practicing'],
  verdict: 'Good attempt — scoring was unavailable, so this is an estimate.',
};

// ── Dynamic audio waveform visualizer ──────────────────────────────────────
// One component, four distinct states, ONE brand green:
//   • idle       → a calm, near-flat baseline line
//   • listening  → real-time bars driven by a live Web Audio AnalyserNode
//   • processing → a self-animating "engine is working" loading wave
//   • speaking   → high-contrast bars while the AI mentor reads aloud (TTS)
// Only the `listening` state taps the real microphone stream; the rest are
// pure CSS keyframe animations, so the visualizer never needs a live analyser
// to look alive.
const WAVE_BARS = 24;
function AudioWaveform({ state, analyserRef, debug = false }) {
  const [levels, setLevels] = useState(() => new Array(WAVE_BARS).fill(0.08));
  // Raw analyser peak (0–255) for the ?debug=audio readout. null = not sampling,
  // -1 = listening but no analyser node attached (the failure we want to catch).
  const [bytePeak, setBytePeak] = useState(null);
  const rafRef = useRef(0);

  useEffect(() => {
    // Only the listening state reads live audio energy. Other states let the
    // CSS keyframes below drive the bars, so we bail early and reset baseline.
    if (state !== 'listening') {
      setLevels(new Array(WAVE_BARS).fill(0.08));
      setBytePeak(null);
      return;
    }
    const analyser = analyserRef?.current;
    if (!analyser) { setBytePeak(-1); return; }

    const data = new Uint8Array(analyser.frequencyBinCount);
    const half = Math.ceil(WAVE_BARS / 2);
    // Sample the lower ~70% of the spectrum (where speech energy lives) and
    // mirror it around the centre for a symmetric, "spoken word" bloom.
    const step = Math.max(1, Math.floor((data.length * 0.7) / half));

    const loop = () => {
      analyser.getByteFrequencyData(data);
      const next = new Array(WAVE_BARS).fill(0.08);
      for (let i = 0; i < half; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) sum += data[i * step + j] || 0;
        const v = Math.min(1, (sum / step / 255) * 2.1); // normalize + gain
        const lvl = Math.max(0.08, v);
        next[half - 1 - i] = lvl;
        if (half + i < WAVE_BARS) next[half + i] = lvl;
      }
      setLevels(next);
      if (debug) {
        let bmax = 0;
        for (let k = 0; k < data.length; k++) if (data[k] > bmax) bmax = data[k];
        setBytePeak(bmax);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state, analyserRef, debug]);

  const bars = [];
  for (let i = 0; i < WAVE_BARS; i++) {
    let style;
    if (state === 'listening') {
      const h = Math.max(6, levels[i] * 100);
      style = { height: `${h}%`, background: GENOIS, opacity: 0.45 + levels[i] * 0.55, transition: 'height .08s linear' };
    } else if (state === 'speaking') {
      style = {
        height: '100%', transformOrigin: 'center', opacity: 1,
        background: `linear-gradient(180deg, ${GENOIS_SOFT}, ${GENOIS})`,
        animation: `vi-wave ${0.62 + (i % 4) * 0.09}s ${i * 0.035}s ease-in-out infinite`,
      };
    } else if (state === 'processing') {
      style = {
        height: '100%', transformOrigin: 'center', opacity: 0.85,
        background: `linear-gradient(180deg, ${GENOIS}, ${SLATE_600})`,
        animation: `vi-wave 1.15s ${i * 0.06}s ease-in-out infinite`,
      };
    } else {
      // idle → a thin, flat baseline line
      style = { height: '8%', background: `${GENOIS}66`, transition: 'height .3s ease' };
    }
    bars.push(<span key={i} style={{ flex: 1, minWidth: 2, maxWidth: 6, borderRadius: 4, alignSelf: 'center', ...style }} />);
  }

  const barPeak = Math.round(Math.max(...levels) * 100);
  const listening = state === 'listening';
  const hint = !listening ? 'tap the mic, then speak'
    : bytePeak === -1 ? 'analyser NOT attached — bug'
    : bytePeak > 4 ? 'LIVE — bars reacting to sound ✓'
    : 'listening… speak (should climb)';

  return (
    <>
      <div aria-hidden style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SP[1], height: 64, width: '100%', padding: `0 ${SP[2]}px`, boxSizing: 'border-box' }}>
        {bars}
      </div>
      {debug && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.8, color: TXT_SLATE, background: SLATE_850, border: `1px solid ${SLATE_600}`, borderRadius: 8, padding: `${SP[2]}px ${SP[3]}px`, width: '100%', boxSizing: 'border-box', textAlign: 'left' }}>
          <div style={{ color: GENOIS, letterSpacing: 1, marginBottom: SP[1] }}>◈ AUDIO DEBUG</div>
          <div>state: <b style={{ color: TXT_WHITE }}>{state}</b></div>
          <div>analyser: <b style={{ color: bytePeak === -1 ? RED : GENOIS }}>{bytePeak === -1 ? 'MISSING ✗' : listening ? 'wired ✓' : '—'}</b></div>
          <div>byte peak: <b style={{ color: TXT_WHITE }}>{bytePeak == null || bytePeak < 0 ? 'n/a' : bytePeak}</b> / 255</div>
          <div>bar peak: <b style={{ color: TXT_WHITE }}>{barPeak}%</b></div>
          <div style={{ marginTop: SP[1], color: listening && bytePeak > 4 ? GENOIS : TXT_MUTE }}>{hint}</div>
        </div>
      )}
    </>
  );
}

function Bar({ label, value }) {
  const c = barColor(value);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 130, fontSize: 12, color: SOFT, fontFamily: 'var(--font-mono)' }}>{label}</div>
      <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: c, borderRadius: 4, transition: 'width .5s' }} />
      </div>
      <div style={{ width: 54, textAlign: 'right', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15, color: c }}>{value}<span style={{ fontSize: 10, color: MUTED }}>/100</span></div>
    </div>
  );
}

// A single shimmering placeholder block — used to reserve the result card's
// footprint while scoring runs, so nothing jumps when the real card mounts.
function Shimmer({ w = '100%', h = 12, r = 6, style }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.11) 37%, rgba(255,255,255,0.04) 63%)',
      backgroundSize: '900px 100%', animation: 'vi-shimmer 1.4s linear infinite',
      ...style,
    }} />
  );
}

export default function VoiceInterviewPage() {
  const { token, ready } = useToken();

  // config
  const [mode, setMode] = useState('technical');
  const [company, setCompany] = useState('TCS');
  const [domain, setDomain] = useState('Software Engineering');
  const [level, setLevel] = useState('Fresher');
  const [userName, setUserName] = useState('');

  // session
  const [status, setStatus] = useState('idle'); // idle | loadingQ | question | evaluating | evalFailed | result | complete
  const [questions, setQuestions] = useState([]);   // immutable, append-only
  const [answers, setAnswers] = useState([]);        // immutable, append-only
  const [evaluations, setEvaluations] = useState([]);// immutable, append-only
  const [qIndex, setQIndex] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [qStartTime, setQStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [summary, setSummary] = useState(null);
  const [percentile, setPercentile] = useState(null);
  const [reviewAttemptId, setReviewAttemptId] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sharing, setSharing] = useState(false);

  // evaluation timeout / retry
  const [pendingAnswer, setPendingAnswer] = useState(null); // { transcript, wordCount } awaiting (re)scoring
  const [evalError, setEvalError] = useState(null);         // { timedOut, message }

  // adaptive follow-up — queued in the background the moment a MAIN answer is
  // scored (while the user reads their result card), presented (if any) when
  // they tap Continue. Ref = the in-flight decision promise; state = a resolved
  // follow-up, used only to relabel the Continue button. Stale entries are
  // inert: both are checked against the current turn index before use.
  const followupPromiseRef = useRef(null);                  // { forIndex, promise } | null
  const [followupReady, setFollowupReady] = useState(null); // { forIndex, q } | null

  // speech
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isChromium, setIsChromium] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [micBlocked, setMicBlocked] = useState(false);
  const [transcript, setTranscript] = useState(''); // committed answer text (survives STT stream + re-renders)
  const [interim, setInterim] = useState('');        // volatile live stream — kept OUT of committed history
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef(''); // accumulates confirmed final text — dedup source of truth
  const shareRef = useRef(null);

  // live audio (Web Audio) — kept alive ONLY while listening, to drive the
  // waveform visualizer from the real mic stream. Torn down on every stop.
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // AI-speaking + interrupt state. The ref shadows the state so the synchronous
  // recognition.onresult handler can read "is the AI talking right now?"
  // without a stale closure.
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const isAISpeakingRef = useRef(false);
  const [interrupting, setInterrupting] = useState(false);
  const interruptTimerRef = useRef(null);

  // ?debug=audio → show a live numeric analyser readout in the mic pad, so a
  // real-device test gives a hard number instead of a "do the bars look alive?"
  // judgement call. Read in an effect to avoid any SSR/hydration mismatch.
  const [debugAudio, setDebugAudio] = useState(false);
  useEffect(() => {
    try { setDebugAudio(new URLSearchParams(window.location.search).get('debug') === 'audio'); } catch {}
  }, []);

  const currentQ = questions[qIndex];
  const currentEval = evaluations[qIndex];
  const liveText = (transcript + ' ' + interim).trim();
  const liveWords = wordsOf(liveText);

  // Follow-ups live in the same append-only questions/answers/evaluations
  // arrays as main questions (so scoring, /save turns and /review all include
  // them for free) — which means qIndex is a TURN index, not a main-question
  // number. These derive the honest "Q4/10" numbers for the header/progress.
  const followupsUsed = questions.filter(q => q.isFollowUp).length;
  const mainAsked = questions.length - followupsUsed;
  const mainNumber = questions.slice(0, qIndex + 1).filter(q => !q.isFollowUp).length;

  // Single source of truth for what the visualizer + pad label should show.
  // Interrupt reads as "listening" because the student is, in fact, now speaking.
  const waveState = interrupting ? 'listening'
    : isAISpeaking ? 'speaking'
    : (status === 'evaluating' || status === 'loadingQ') ? 'processing'
    : isListening ? 'listening'
    : 'idle';

  // detect speech support + browser
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SR);
    const ua = navigator.userAgent || '';
    setIsChromium(/Chrome|Edg|CriOS/i.test(ua) && !/Firefox|FxiOS/i.test(ua));
  }, []);

  // surface a banner if mic permission was already denied (before the user even taps)
  useEffect(() => {
    navigator.permissions?.query({ name: 'microphone' })
      .then(result => { if (result.state === 'denied') setMicBlocked(true); })
      .catch(() => {}); // permissions API / 'microphone' name not supported — ignore
  }, []);

  // voices load async in some browsers — preload them, and stop any speech on unmount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices(); // trigger load
      window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
    }
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  // clear the interrupt-flash timer on unmount so it can't fire after teardown
  useEffect(() => () => { clearTimeout(interruptTimerRef.current); }, []);

  // load profile (name + domain) once
  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/user/me', token)
      .then(r => {
        if (r?.data?.user?.name) setUserName(r.data.user.name);
        if (r?.data?.user?.domain_slug) setDomain(r.data.user.domain_slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
      })
      .catch(() => {});
  }, [ready, token]);

  // per-question elapsed timer
  useEffect(() => {
    if (status !== 'question' || !qStartTime) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - qStartTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [status, qStartTime]);

  // Tear down the live-audio graph (mic tracks + AudioContext) used by the
  // waveform. Idempotent — safe to call on every stop / unmount.
  const teardownAudio = useCallback(() => {
    try { mediaStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    try { audioContextRef.current?.close(); } catch {}
    mediaStreamRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
  }, []);

  const stopListening = useCallback(() => {
    try { recognitionRef.current && recognitionRef.current.stop(); } catch {}
    teardownAudio();
    setIsListening(false);
    setInterim('');
  }, [teardownAudio]);

  // stop mic on unmount
  useEffect(() => () => stopListening(), [stopListening]);

  // The student began talking over the AI mentor's audio — cut the TTS, flash
  // an "Interrupting AI…" micro-state, and let the answer flow continue. The
  // flag auto-clears so the pad settles back into the plain listening state.
  const triggerInterrupt = useCallback(() => {
    try { window.speechSynthesis?.cancel(); } catch {}
    isAISpeakingRef.current = false;
    setIsAISpeaking(false);
    setInterrupting(true);
    clearTimeout(interruptTimerRef.current);
    interruptTimerRef.current = setTimeout(() => setInterrupting(false), 1400);
  }, []);

  const startListening = async () => {
    if (typeof window === 'undefined') return;

    // Auto-cancel any in-flight question TTS the instant the mic is tapped, so
    // the mentor's audio can't bleed into the transcript. If it was still
    // mid-sentence, tapping over it still reads as an interrupt — flash the
    // micro-animation; otherwise just clear any queued speech silently.
    if (isAISpeakingRef.current) {
      triggerInterrupt();
    } else {
      try { window.speechSynthesis?.cancel(); } catch {}
    }

    // Seed the dedup ref from whatever's already transcribed so a resumed
    // ("Tap to add more") session appends instead of overwriting. A fresh
    // question resets transcript to '' first, so this starts empty then.
    finalTranscriptRef.current = transcript ? transcript.trim() + ' ' : '';

    // Step 1: Trigger browser permission popup explicitly and KEEP the stream —
    // the waveform visualizer taps it through a Web Audio AnalyserNode.
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicBlocked(false);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('🎤 Microphone blocked! Click the 🔒 lock icon in address bar → Allow microphone → Refresh.');
        setMicBlocked(true);
        return;
      }
      if (err.name === 'NotFoundError') {
        toast.error('No microphone detected. Please connect a mic and try again.');
        return;
      }
      toast.error('Mic error: ' + (err.message || err.name));
      return;
    }

    // Step 1b: Build the analyser graph off the live stream. If Web Audio is
    // unavailable we still record — the visualizer just falls back to CSS.
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72;
        source.connect(analyser);
        audioContextRef.current = ctx;
        analyserRef.current = analyser;
      }
      mediaStreamRef.current = stream;
    } catch {
      // Analyser setup failed — drop the stream so we don't leak the mic.
      try { stream.getTracks().forEach(t => t.stop()); } catch {}
      mediaStreamRef.current = null;
      analyserRef.current = null;
    }

    // Step 2: Now start SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice not supported. Please use Google Chrome.');
      teardownAudio();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setInterim('');
    };

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t + ' ';
        else interimText += t;
      }

      // Interrupt handling: any speech detected while the AI mentor is still
      // outputting audio instantly cuts the TTS and flags the interrupt state.
      if (isAISpeakingRef.current && (finalText.trim() || interimText.trim())) {
        triggerInterrupt();
      }

      // Accumulate ONLY the newly-finalized text into a ref, then mirror it into
      // the COMMITTED transcript state. The volatile interim stream is written to
      // its own state below and can never overwrite committed history.
      if (finalText) {
        finalTranscriptRef.current += finalText;
        setTranscript(finalTranscriptRef.current.trim());
      }
      setInterim(interimText);
    };

    recognition.onerror = (e) => {
      const silent = ['no-speech', 'aborted'];
      if (!silent.includes(e.error)) {
        const msgs = {
          'not-allowed': '🎤 Mic blocked. Click 🔒 in address bar → Allow mic → Refresh.',
          'audio-capture': 'No microphone found. Connect a mic and retry.',
          'network': 'Network error. Check your connection.',
          'service-not-allowed': 'Speech service blocked. Try on HTTPS or use Chrome.',
        };
        toast.error(msgs[e.error] || 'Mic error: ' + e.error);
      }
      teardownAudio();
      setIsListening(false);
      setInterim('');
    };

    recognition.onend = () => {
      teardownAudio();
      setIsListening(false);
      setInterim('');
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      toast.error('Could not start recording: ' + e.message);
      teardownAudio();
      setIsListening(false);
    }
  };

  const speakQuestion = (text) => {
    if (typeof window === 'undefined') return;
    if (!window.speechSynthesis) return;
    if (!text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.9;  // slightly slower = clearer
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Drive the "AI Speaking" visualizer state off the real TTS lifecycle so
    // the waveform is high-contrast exactly while audio is playing, and the
    // interrupt detector knows when the mentor is mid-sentence.
    utterance.onstart = () => { isAISpeakingRef.current = true; setIsAISpeaking(true); };
    utterance.onend = () => { isAISpeakingRef.current = false; setIsAISpeaking(false); };
    utterance.onerror = () => { isAISpeakingRef.current = false; setIsAISpeaking(false); };

    // Prefer a male voice (interviewer feel)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find(v => v.name === 'Microsoft Ravi - English (India)') ||
      voices.find(v => v.name === 'Google UK English Male') ||
      voices.find(v => v.name.includes('Ravi')) ||
      voices.find(v => v.lang === 'en-IN' && !v.name.toLowerCase().includes('female')) ||
      voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('female')) ||
      voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  };

  async function fetchQuestion(qNum, revertStatus) {
    stopListening();
    finalTranscriptRef.current = '';
    setTranscript(''); setInterim(''); setElapsed(0);
    setEvalError(null); setPendingAnswer(null);
    setFollowupReady(null);
    setStatus('loadingQ');
    try {
      // Avoid-list = MAIN questions only (follow-ups are answer-specific and
      // can't recur), which also keeps it inside the server's 12-item cap.
      const prev = questions.filter(q => !q.isFollowUp).map(q => q.question);
      const r = await apiFetchWithTimeout('/api/interview/questions', token, 'POST', {
        domain, level, targetCompany: company, mode, questionNumber: qNum, previousQuestions: prev,
      }, QUESTION_TIMEOUT_MS);
      const q = r.data.question;
      // qNum is the MAIN-question number (drives API difficulty banding), but
      // the new turn lands at the END of the mixed main+follow-up array.
      const newIndex = questions.length;
      setQuestions(arr => [...arr, q]); // append-only — never replaces history
      speakQuestion(q.question); // 🔊 read the new question aloud (start + every "Next")
      setQIndex(newIndex);
      setQStartTime(Date.now());
      setStatus('question');
    } catch (e) {
      toast.error(e.timedOut ? 'Loading the question timed out — check your connection and try again.' : (e.message || 'Could not load the next question.'));
      setStatus(revertStatus);
    }
  }

  // Present an already-generated follow-up as the next turn — same reset ritual
  // as fetchQuestion, but zero network: the question was decided in the
  // background while the user read their result card.
  function presentFollowup(qObj) {
    stopListening();
    finalTranscriptRef.current = '';
    setTranscript(''); setInterim(''); setElapsed(0);
    setEvalError(null); setPendingAnswer(null);
    setFollowupReady(null);
    const newIndex = questions.length;
    setQuestions(arr => [...arr, qObj]); // append-only — follow-up joins the same history
    speakQuestion(qObj.question);
    setQIndex(newIndex);
    setQStartTime(Date.now());
    setStatus('question');
  }

  // Fire-and-forget follow-up decision for the MAIN answer just scored. The
  // promise is parked in a ref; continueNext() collects it (with a short cap)
  // when the user moves on. Any failure resolves to null = no follow-up.
  function maybeQueueFollowup(turnIndex, q, answer) {
    if (!q || q.isFollowUp) return;              // never chain a follow-up on a follow-up
    if (followupsUsed >= MAX_FOLLOWUPS) return;  // session-wide bound
    const recentTurns = [];
    for (let i = Math.max(0, turnIndex - 2); i < turnIndex; i++) {
      recentTurns.push({ question: questions[i]?.question || '', answer: answers[i]?.transcript || '' });
    }
    const promise = apiFetchWithTimeout('/api/interview/followup', token, 'POST', {
      question: q.question, questionType: q.type, hint: q.hint,
      answer: answer.transcript, wordCount: answer.wordCount,
      mode, domain, targetCompany: company, level,
      followupsUsed, recentTurns,
    }, FOLLOWUP_TIMEOUT_MS)
      .then(r => {
        const fq = r?.data?.followup;
        if (!fq || typeof fq.question !== 'string' || !fq.question.trim()) return null;
        const qObj = {
          question: fq.question.trim(),
          type: ['technical', 'behavioral', 'situational'].includes(fq.type) ? fq.type : 'technical',
          hint: typeof fq.hint === 'string' ? fq.hint : '',
          difficulty: fq.difficulty || 'medium',
          isFollowUp: true,
        };
        setFollowupReady({ forIndex: turnIndex, q: qObj });
        return qObj;
      })
      .catch(() => null);
    followupPromiseRef.current = { forIndex: turnIndex, promise };
  }

  function startInterview() {
    if (!company.trim()) { toast.error('Pick or type a target company.'); return; }
    setQuestions([]); setAnswers([]); setEvaluations([]); setSummary(null); setPercentile(null); setReviewAttemptId(null); setShowDetails(false);
    setEvalError(null); setPendingAnswer(null);
    followupPromiseRef.current = null; setFollowupReady(null);
    setStartTime(Date.now());
    fetchQuestion(1, 'idle');
  }

  // Commit one scored turn to immutable, append-only history.
  function commitEvaluation(answer, evaluation) {
    // Decide (in the background) whether this answer earns a follow-up — the
    // call races the user's result-card reading time, so the happy path adds
    // zero latency before the next question.
    maybeQueueFollowup(qIndex, currentQ, answer);
    setAnswers(arr => [...arr, answer]);
    setEvaluations(arr => [...arr, evaluation]);
    setPendingAnswer(null);
    setEvalError(null);
    setStatus('result');
  }

  // Core scoring call — shared by first submit and the retry button.
  async function runEvaluation(answer) {
    setEvalError(null);
    setStatus('evaluating');
    try {
      const r = await apiFetchWithTimeout('/api/interview/evaluate', token, 'POST', {
        question: currentQ.question,
        answer: answer.transcript,
        domain,
        targetCompany: company,
        questionType: currentQ.type || 'technical',
        wordCount: answer.wordCount,
        mode, // round type steers the evaluation rubric (technical unchanged)
      }, EVAL_TIMEOUT_MS);
      const evaluation = r?.data?.evaluation;
      if (!evaluation) throw new Error('Evaluation response was empty');
      commitEvaluation(answer, evaluation);
    } catch (e) {
      // Never strand the user on a spinner: park the answer and surface a
      // graceful retry screen instead of silently mutating history.
      console.error('[voice-interview] evaluation failed:', e);
      setPendingAnswer(answer);
      setEvalError({
        timedOut: !!e.timedOut,
        message: e.timedOut
          ? 'The evaluator is taking longer than usual (long answers need more time).'
          : 'The scoring service hiccuped while grading your answer.',
      });
      setStatus('evalFailed');
    }
  }

  function submitAnswer() {
    const answerText = cleanTranscript(liveText);
    const wc = wordsOf(answerText);
    if (wc < MIN_WORDS) { toast.error(`Speak a bit more — at least ${MIN_WORDS} words (you have ${wc}).`); return; }
    stopListening();
    runEvaluation({ transcript: answerText, wordCount: wc });
  }

  // "Use estimated score" — accept the fallback so the session can continue.
  function acceptEstimated() {
    if (!pendingAnswer) return;
    toast('Recorded with an estimated score.', { icon: '📝' });
    commitEvaluation(pendingAnswer, ESTIMATED_EVAL);
  }

  async function continueNext() {
    // Follow-up gate: only directly after a MAIN question, only under the
    // session cap. The decision was requested when the result card appeared —
    // usually it has already resolved; if it's still in flight we give it a
    // short bounded wait, then move on without one. A late resolution is inert.
    const pending = followupPromiseRef.current;
    if (pending && pending.forIndex === qIndex && !currentQ?.isFollowUp && followupsUsed < MAX_FOLLOWUPS) {
      followupPromiseRef.current = null;
      setStatus('loadingQ');
      const fq = await Promise.race([
        pending.promise,
        new Promise(res => setTimeout(() => res(null), FOLLOWUP_WAIT_MS)),
      ]);
      if (fq) { presentFollowup(fq); return; }
    }
    if (mainAsked < TOTAL_QUESTIONS) {
      fetchQuestion(mainAsked + 1, 'result');
    } else {
      finishInterview();
    }
  }

  async function finishInterview() {
    const ta = avg(evaluations.map(e => e.technicalAccuracy));
    const cc = avg(evaluations.map(e => e.communicationClarity));
    const cs = avg(evaluations.map(e => e.confidenceScore));
    const overall = avg(evaluations.map(e => e.overallScore));
    const grade = gradeFromScore(overall);
    const cats = [
      { key: 'Technical knowledge', v: ta },
      { key: 'Communication clarity', v: cc },
      { key: 'Confidence', v: cs },
    ];
    const top = [...cats].sort((a, b) => b.v - a.v)[0];
    const gap = [...cats].sort((a, b) => a.v - b.v)[0];
    const duration = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    const s = { ta, cc, cs, overall, grade, top: top.key, gap: gap.key, duration };
    setSummary(s);
    setStatus('complete');
    stopListening();
    try {
      const r = await apiFetch('/api/interview/save', token, 'POST', {
        mode, domain, targetCompany: company,
        totalScore: overall, technicalAccuracy: ta, communicationClarity: cc, confidenceScore: cs,
        grade, questionsAnswered: evaluations.length, durationSeconds: duration,
        // Full Q&A transcript so the attempt lands on the review page —
        // follow-up turns ride along, labelled so /review reads naturally.
        turns: evaluations.map((ev, i) => ({
          question: (questions[i]?.isFollowUp ? '[Follow-up] ' : '') + (questions[i]?.question || ''),
          type: questions[i]?.type || 'technical',
          answer: answers[i]?.transcript || '',
          evaluation: {
            overallScore: ev.overallScore,
            idealAnswer: ev.idealAnswer,
            verdict: ev.verdict,
            improvements: ev.improvements,
          },
        })),
      });
      setPercentile(r.data.percentile);
      setReviewAttemptId(r.data.attemptId || null);
    } catch { setPercentile(null); }
  }

  function retake() {
    stopListening();
    finalTranscriptRef.current = '';
    setStatus('idle'); setQuestions([]); setAnswers([]); setEvaluations([]); setQIndex(0);
    setSummary(null); setPercentile(null); setReviewAttemptId(null); setTranscript(''); setInterim(''); setShowDetails(false);
    setEvalError(null); setPendingAnswer(null);
    followupPromiseRef.current = null; setFollowupReady(null);
  }

  async function shareScore() {
    if (!shareRef.current) return;
    setSharing(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(shareRef.current, { backgroundColor: '#020812', scale: 3, logging: false });
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const file = new File([blob], 'genois-interview.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My GENOIS Mock Interview', text: `I scored ${summary.overall}/100 on a ${company} mock interview at genois.in` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'genois-interview.png'; a.click();
        URL.revokeObjectURL(url);
        toast.success('Score card downloaded — share it anywhere!');
      }
    } catch (e) {
      toast.error('Could not generate the card.');
    }
    setSharing(false);
  }

  const keyframes = `
    @keyframes vi-pulse-green { 0%{box-shadow:0 0 0 0 rgba(0,217,163,.5)} 70%{box-shadow:0 0 0 22px rgba(0,217,163,0)} 100%{box-shadow:0 0 0 0 rgba(0,217,163,0)} }
    @keyframes vi-spin { to { transform: rotate(360deg) } }
    @keyframes vi-blink { 0%,100%{opacity:1} 50%{opacity:.25} }
    @keyframes vi-shimmer { 0%{background-position:-450px 0} 100%{background-position:450px 0} }
    @keyframes vi-wave { 0%,100%{transform:scaleY(.28)} 50%{transform:scaleY(1)} }
    @keyframes vi-fade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
    @keyframes vi-pop { 0%{transform:scale(.85);opacity:0} 45%{transform:scale(1.06);opacity:1} 100%{transform:scale(1);opacity:1} }
    .vi-mic-btn { transition: transform .12s ease, box-shadow .2s ease, background .2s ease; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
    .vi-mic-btn:active { transform: scale(.93); }
    .vi-mic-btn:disabled { cursor: not-allowed; }`;

  const micBlockedBanner = micBlocked ? (
    <div style={{
      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)',
      borderRadius: 12, padding: `${SP[3]}px ${SP[4]}px`, marginBottom: SP[4],
      color: '#ffb020', fontSize: 13, fontFamily: 'var(--font-body)', lineHeight: 1.6,
    }}>
      🎤 <strong>Microphone blocked.</strong> To fix: Click the <strong>🔒 lock icon</strong> in Chrome’s address bar → Find “Microphone” → Set to <strong>“Allow”</strong> → Refresh this page.
    </div>
  ) : null;

  if (!ready) return <div style={{ color: MUTED, padding: 60, textAlign: 'center' }}>Loading…</div>;

  // ── question loader — slate surface + a "processing" waveform ─────────────
  if (status === 'loadingQ') {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)', animation: 'vi-fade .3s ease' }}>
        <style dangerouslySetInnerHTML={{ __html: keyframes }} />
        <div style={{ background: SLATE_900, border: `1px solid ${SLATE_700}`, borderRadius: 16, padding: SP[6], minHeight: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SP[5], boxSizing: 'border-box' }}>
          <AudioWaveform state="processing" analyserRef={analyserRef} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: TXT_WHITE }}>Interviewer is thinking…</div>
            <div style={{ fontSize: 13, marginTop: SP[2], color: TXT_MUTE }}>Preparing question {Math.min(mainAsked + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}</div>
          </div>
        </div>
      </div>
    );
  }

  // ── evaluating: a "processing" waveform that RESERVES the result card's
  //    footprint (min-height) so the real card can't jump the page on arrival.
  if (status === 'evaluating') {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)', animation: 'vi-fade .3s ease' }}>
        <style dangerouslySetInnerHTML={{ __html: keyframes }} />
        <div style={{ background: SLATE_900, border: `1px solid ${SLATE_700}`, borderRadius: 16, padding: SP[6], minHeight: 300, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SP[4], marginBottom: SP[6] }}>
            {/* live audio-style wave = "engine is working", not "app crashed" */}
            <div style={{ width: 120, flexShrink: 0 }}>
              <AudioWaveform state="processing" analyserRef={analyserRef} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: TXT_WHITE }}>Interviewer is evaluating your answer…</div>
              <div style={{ fontSize: 12.5, color: TXT_MUTE, marginTop: SP[1] }}>Scoring accuracy, clarity &amp; confidence. Long answers can take a few seconds.</div>
            </div>
          </div>
          {/* skeleton of the three metric bars */}
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: SP[3], marginBottom: SP[4] }}>
              <Shimmer w={130} h={12} />
              <Shimmer h={8} r={4} style={{ flex: 1 }} />
              <Shimmer w={40} h={14} />
            </div>
          ))}
          <div style={{ marginTop: SP[2], display: 'grid', gap: SP[2] }}>
            <Shimmer h={12} w="90%" />
            <Shimmer h={12} w="70%" />
          </div>
        </div>
      </div>
    );
  }

  // ── evaluation failed / timed out: never a dead spinner — always a way out ─
  if (status === 'evalFailed' && evalError) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)', animation: 'vi-fade .3s ease' }}>
        <div style={{ background: SLATE_900, border: `1px solid ${AMBER}44`, borderRadius: 16, padding: SP[7], minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box' }}>
          <div style={{ fontSize: 34, marginBottom: SP[3] }}>{evalError.timedOut ? '⏳' : '⚠️'}</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: TXT_WHITE, marginBottom: SP[2] }}>
            {evalError.timedOut ? 'Still scoring…' : 'Scoring hiccuped'}
          </div>
          <div style={{ fontSize: 14, color: TXT_SLATE, lineHeight: 1.6, marginBottom: SP[2] }}>{evalError.message}</div>
          <div style={{ fontSize: 12.5, color: TXT_MUTE, lineHeight: 1.6, marginBottom: SP[6] }}>Your answer is safe — nothing was lost. Retry the evaluation, or continue with an estimated score.</div>
          <div style={{ display: 'flex', gap: SP[3], flexWrap: 'wrap' }}>
            <button onClick={() => pendingAnswer && runEvaluation(pendingAnswer)} style={{ flex: 1, minWidth: 160, padding: SP[4], borderRadius: 12, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${GENOIS},${GENOIS_SOFT})`, color: '#04120d', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14 }}>↻ Retry evaluation</button>
            <button onClick={acceptEstimated} style={{ flex: 1, minWidth: 160, padding: SP[4], borderRadius: 12, border: `1px solid ${SLATE_600}`, cursor: 'pointer', background: 'transparent', color: TXT_SLATE, fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14 }}>Use estimated score</button>
          </div>
        </div>
      </div>
    );
  }

  // ── question screen ────────────────────────────────────────────────────
  if (status === 'question' && currentQ) {
    const enough = liveWords >= MIN_WORDS;

    // Mic-pad state copy — one primary line (reserved height so it never nudges
    // layout) plus a secondary hint.
    const padLabel = interrupting ? 'Interrupting AI…'
      : isAISpeaking ? 'Interviewer is speaking…'
      : isListening ? 'Recording your answer…'
      : (transcript ? 'Tap the mic to add more' : 'Tap the mic to answer aloud');
    const padHint = interrupting ? 'You took the floor — keep going.'
      : isListening ? 'Tap again to stop'
      : isAISpeaking ? 'Tap the mic to answer over the interviewer'
      : 'Speak clearly — we transcribe in real time';
    const padLabelColor = interrupting ? AMBER : isListening ? GENOIS : isAISpeaking ? GENOIS_SOFT : TXT_MUTE;

    return (
      <div style={{ maxWidth: 760, margin: '0 auto', width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)', paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}>
        <style dangerouslySetInnerHTML={{ __html: keyframes }} />

        {/* interviewer header bar (Slate-800 over the page) */}
        <div style={{ background: SLATE_800, border: `1px solid ${SLATE_700}`, borderRadius: 14, padding: `${SP[3]}px ${SP[4]}px`, marginBottom: SP[4], display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SP[3], flexWrap: 'wrap', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SP[3] }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg,${GENOIS},${GENOIS_SOFT})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤖</div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15, color: TXT_WHITE }}>AI Interviewer · {company}</div>
              <div style={{ fontSize: 11, color: TXT_MUTE, fontFamily: 'var(--font-mono)' }}>{MODES.find(m => m.key === mode)?.label} mode</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: GENOIS }}>Q{mainNumber} / {TOTAL_QUESTIONS}</div>
            <div style={{ fontSize: 11, color: TXT_MUTE, fontFamily: 'var(--font-mono)' }}>{currentQ.isFollowUp ? '↳ follow-up · ' : ''}⏱ {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</div>
          </div>
        </div>

        {micBlockedBanner}

        {/* progress */}
        <div style={{ height: 5, background: SLATE_800, borderRadius: 3, marginBottom: SP[5], overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(mainNumber / TOTAL_QUESTIONS) * 100}%`, background: `linear-gradient(90deg,${GENOIS},${GENOIS_SOFT})`, borderRadius: 3, transition: 'width .4s' }} />
        </div>

        {/* ── chat matrix: Slate-800 message containers on a Slate-900 master ── */}
        <div style={{ background: SLATE_900, border: `1px solid ${SLATE_700}`, borderRadius: 16, padding: SP[4], boxSizing: 'border-box' }}>

          {/* interviewer (AI mentor) message — green left-accent, green label */}
          <div style={{ position: 'relative', background: SLATE_800, border: `1px solid ${SLATE_700}`, borderLeft: `3px solid ${GENOIS}`, borderRadius: 12, padding: SP[5], marginBottom: SP[4], boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SP[2], marginBottom: SP[3], flexWrap: 'wrap' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: GENOIS, letterSpacing: 1.5, textTransform: 'uppercase' }}>{currentQ.isFollowUp ? '🤖 Interviewer probes deeper' : '🤖 Interviewer asks'}</div>
              <div style={{ display: 'flex', gap: SP[2] }}>
                {currentQ.isFollowUp && <span style={{ fontSize: 9, padding: '3px 9px', borderRadius: 10, background: `${AMBER}1a`, color: AMBER, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>↳ follow-up</span>}
                <span style={{ fontSize: 9, padding: '3px 9px', borderRadius: 10, background: `${GENOIS}1a`, color: GENOIS, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{currentQ.type}</span>
                <span style={{ fontSize: 9, padding: '3px 9px', borderRadius: 10, background: `${AMBER}1a`, color: AMBER, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{currentQ.difficulty}</span>
              </div>
            </div>
            <div style={{ fontSize: 'clamp(17px,3.6vw,23px)', color: TXT_WHITE, lineHeight: 1.55, fontWeight: 500, fontFamily: 'var(--font-heading)' }}>{currentQ.question}</div>
            <button
              onClick={() => speakQuestion(currentQ?.question)}
              style={{
                background: 'transparent', border: `1px solid ${GENOIS}4d`,
                borderRadius: 8, padding: `${SP[2]}px ${SP[4]}px`, color: GENOIS_SOFT,
                fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer',
                marginTop: SP[3], display: 'flex', alignItems: 'center', gap: SP[2],
              }}
            >
              🔊 Replay Question
            </button>
          </div>

          {/* candidate (user transcription) message — distinct: darker slate,
              slate-600 border, WHITE typography, right-side accent. Always
              mounted with a fixed min-height band so streaming STT can't jump
              the page, and interim stays visibly separate from committed. */}
          <div style={{ background: SLATE_850, border: `1px solid ${SLATE_600}`, borderRight: `3px solid ${TXT_SLATE}`, borderRadius: 12, padding: SP[4], marginBottom: SP[4], minHeight: 96, maxHeight: 240, overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP[2] }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: TXT_SLATE, letterSpacing: 1.5, textTransform: 'uppercase' }}>🗣 You — {userName || 'candidate'}</span>
              {isListening && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: GENOIS }}><span style={{ animation: 'vi-blink 1s infinite' }}>●</span> live</span>}
            </div>
            {liveText ? (
              <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                <span style={{ color: TXT_WHITE }}>{transcript}</span>
                {interim && <span style={{ color: TXT_MUTE, fontStyle: 'italic' }}> {interim}</span>}
              </div>
            ) : (
              <div style={{ fontSize: 13.5, color: TXT_MUTE, fontStyle: 'italic', lineHeight: 1.6 }}>
                {isListening ? 'Listening… start speaking.' : 'Your spoken answer will appear here as you talk.'}
              </div>
            )}
          </div>

          {/* ── mobile mic control pad ─────────────────────────────────────
              Waveform visualizer + fixed-size push-to-talk button. Everything
              here is on the 4px spacing scale, scales cleanly to 360px, and
              the button NEVER changes size between states (only colour). ── */}
          {speechSupported ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SP[3], paddingTop: SP[2] }}>
              <AudioWaveform state={waveState} analyserRef={analyserRef} debug={debugAudio} />

              {/* interrupt micro-animation — pops in only while interrupting */}
              <div style={{ minHeight: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {interrupting ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: SP[2], padding: `${SP[1]}px ${SP[3]}px`, borderRadius: 20, background: `${AMBER}1f`, border: `1px solid ${AMBER}66`, color: AMBER, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 0.5, animation: 'vi-pop .3s ease' }}>
                    <span style={{ animation: 'vi-blink .7s infinite' }}>⚡</span> Interrupting AI…
                  </span>
                ) : (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: padLabelColor, transition: 'color .2s' }}>
                    {isListening && <span style={{ animation: 'vi-blink 1s infinite' }}>🔴 </span>}{padLabel}
                  </span>
                )}
              </div>

              {/* fixed 128px footprint in BOTH states — only colour/glow change */}
              <button
                className="vi-mic-btn"
                onClick={() => (isListening ? stopListening() : startListening())}
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
                style={{
                  width: 128, height: 128, borderRadius: '50%', cursor: 'pointer', border: 'none',
                  background: isListening
                    ? `radial-gradient(circle at 50% 40%, ${GENOIS}, #05271e)`
                    : `linear-gradient(135deg,${SLATE_800},${SLATE_900})`,
                  boxShadow: isListening ? `0 0 0 2px ${GENOIS}` : `inset 0 0 0 2px ${GENOIS}55`,
                  animation: isListening ? 'vi-pulse-green 1.4s infinite' : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SP[1],
                  color: isListening ? '#04120d' : GENOIS,
                }}>
                <span style={{ fontSize: 40 }}>🎤</span>
              </button>

              <div style={{ minHeight: 18, fontFamily: 'var(--font-body)', fontSize: 12, color: TXT_MUTE, textAlign: 'center' }}>{padHint}</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 12, color: AMBER, marginBottom: SP[2], fontFamily: 'var(--font-mono)' }}>⚠️ Voice input isn’t supported here — type your answer instead (Chrome recommended).</div>
              <textarea value={transcript} onChange={e => { setTranscript(e.target.value); finalTranscriptRef.current = e.target.value ? e.target.value.trim() + ' ' : ''; }} rows={6} placeholder="Type your answer…" style={{ width: '100%', padding: SP[4], borderRadius: 10, border: `1px solid ${SLATE_600}`, background: SLATE_850, color: TXT_WHITE, fontSize: 14, fontFamily: 'var(--font-body)', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
            </div>
          )}

          {/* word count + submit */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SP[3], flexWrap: 'wrap', marginTop: SP[4] }}>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: liveWords < MIN_WORDS ? RED : liveWords <= 20 ? AMBER : GENOIS }}>
              {liveWords} words {enough ? '✓' : `· need ${MIN_WORDS}+`}
            </div>
            <div style={{ display: 'flex', gap: SP[3] }}>
              {(transcript || interim) && <button onClick={() => { finalTranscriptRef.current = ''; setTranscript(''); setInterim(''); }} style={{ padding: `${SP[3]}px ${SP[4]}px`, borderRadius: 10, border: `1px solid ${SLATE_600}`, background: 'transparent', color: TXT_MUTE, cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13 }}>Clear</button>}
              <button onClick={submitAnswer} disabled={!enough} style={{ padding: `${SP[3]}px ${SP[5]}px`, borderRadius: 10, border: 'none', cursor: enough ? 'pointer' : 'not-allowed', background: enough ? `linear-gradient(135deg,${GENOIS},${GENOIS_SOFT})` : SLATE_800, color: enough ? '#04120d' : TXT_MUTE, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14 }}>Submit Answer →</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── per-answer result ──────────────────────────────────────────────────
  if (status === 'result' && currentEval) {
    const ev = currentEval;
    const isLast = mainAsked >= TOTAL_QUESTIONS;
    // A resolved follow-up for THIS turn relabels the button; if the decision
    // is still in flight, continueNext() collects it anyway (bounded wait).
    const fuNext = followupReady && followupReady.forIndex === qIndex && !currentQ?.isFollowUp && followupsUsed < MAX_FOLLOWUPS;
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)', animation: 'vi-fade .3s ease' }}>
        <style dangerouslySetInnerHTML={{ __html: keyframes }} />
        <div style={{ background: CARD, border: `1px solid ${gradeColor(ev.grade)}33`, borderRadius: 16, padding: 24, marginBottom: 16, minHeight: 300 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: MUTED, letterSpacing: 1.5 }}>{currentQ?.isFollowUp ? `FOLLOW-UP · Q${mainNumber}` : `QUESTION ${mainNumber} / ${TOTAL_QUESTIONS}`} · {currentQ?.type?.toUpperCase()}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 30, color: gradeColor(ev.grade) }}>{ev.grade}</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: LIGHT }}>{ev.overallScore}<span style={{ fontSize: 12, color: MUTED }}>/100</span></span>
            </div>
          </div>
          <Bar label="Technical Accuracy" value={ev.technicalAccuracy} />
          <Bar label="Communication" value={ev.communicationClarity} />
          <Bar label="Confidence" value={ev.confidenceScore} />
        </div>

        {ev.verdict && <div style={{ background: `${CYAN}0a`, border: `1px solid ${CYAN}22`, borderRadius: 12, padding: 16, marginBottom: 14, fontSize: 14, color: SOFT, lineHeight: 1.6 }}>“{ev.verdict}”</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12, marginBottom: 14 }}>
          {ev.strengths?.length > 0 && (
            <div style={{ background: CARD, border: `1px solid ${GREEN}26`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 10, color: GREEN, marginBottom: 8, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>✓ WHAT WORKED</div>
              {ev.strengths.map((s, i) => <div key={i} style={{ fontSize: 13, color: SOFT, padding: '3px 0' }}>• {s}</div>)}
            </div>
          )}
          {ev.improvements?.length > 0 && (
            <div style={{ background: CARD, border: `1px solid ${RED}26`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 10, color: RED, marginBottom: 8, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>⚠ IMPROVE</div>
              {ev.improvements.map((s, i) => <div key={i} style={{ fontSize: 13, color: SOFT, padding: '3px 0' }}>• {s}</div>)}
            </div>
          )}
        </div>

        {ev.idealAnswer && (
          <div style={{ background: CARD, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 18 }}>
            <div style={{ fontSize: 10, color: PURPLE, marginBottom: 8, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>💡 WHAT A STRONG ANSWER COVERS</div>
            <div style={{ fontSize: 13, color: SOFT, lineHeight: 1.7 }}>{ev.idealAnswer}</div>
          </div>
        )}

        <button onClick={continueNext} style={{ width: '100%', padding: 15, borderRadius: 12, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${GENOIS},${GENOIS_SOFT})`, color: '#04120d', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15 }}>
          {fuNext ? 'Answer Follow-up ↳' : isLast ? 'See Final Results 🎉' : `Continue to Q${mainAsked + 1} →`}
        </button>
      </div>
    );
  }

  // ── final summary ──────────────────────────────────────────────────────
  if (status === 'complete' && summary) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}>
        {/* shareable card */}
        <div ref={shareRef} style={{ background: 'linear-gradient(160deg,#0a1428,#020812)', border: `1px solid ${CYAN}26`, borderRadius: 18, padding: 28, marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${CYAN},${PURPLE},${RED})` }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: LIGHT, letterSpacing: 1 }}>GEN<span style={{ color: CYAN }}>OIS</span></div>
            <div style={{ fontSize: 10, color: MUTED, fontFamily: 'var(--font-mono)' }}>VOICE MOCK INTERVIEW</div>
          </div>
          <div style={{ textAlign: 'center', padding: '6px 0 14px' }}>
            <div style={{ fontSize: 13, color: SOFT, marginBottom: 6 }}>{userName ? `${userName} completed a` : 'Completed a'} <b style={{ color: LIGHT }}>{company}</b> mock interview</div>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 64, color: gradeColor(summary.grade), lineHeight: 1 }}>{summary.overall}</span>
              <span style={{ fontSize: 20, color: MUTED }}>/100</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 30, color: gradeColor(summary.grade), marginLeft: 6 }}>{summary.grade}</span>
            </div>
            {percentile != null && <div style={{ marginTop: 10, fontSize: 13, color: GREEN, fontFamily: 'var(--font-mono)' }}>Beat {percentile}% of students</div>}
          </div>
          <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 8 }}>
            {[['Technical', summary.ta], ['Comm.', summary.cc], ['Confidence', summary.cs]].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: barColor(v) }}>{v}</div>
                <div style={{ fontSize: 9, color: MUTED, fontFamily: 'var(--font-mono)' }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 10, color: MUTED, fontFamily: 'var(--font-mono)' }}>genois.in/voice-interview</div>
        </div>

        {/* breakdown */}
        <div style={{ background: CARD, border: `1px solid ${CYAN}14`, borderRadius: 14, padding: 20, marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: MUTED, letterSpacing: 2, marginBottom: 14 }}>CATEGORY BREAKDOWN</div>
          <Bar label="Technical Accuracy" value={summary.ta} />
          <Bar label="Communication" value={summary.cc} />
          <Bar label="Confidence" value={summary.cs} />
          <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180, background: `${GREEN}0d`, border: `1px solid ${GREEN}26`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, color: GREEN, fontFamily: 'var(--font-mono)' }}>TOP STRENGTH</div>
              <div style={{ fontSize: 14, color: LIGHT, fontWeight: 600, marginTop: 4 }}>{summary.top}</div>
            </div>
            <div style={{ flex: 1, minWidth: 180, background: `${RED}0d`, border: `1px solid ${RED}26`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, color: RED, fontFamily: 'var(--font-mono)' }}>MAIN GAP</div>
              <div style={{ fontSize: 14, color: LIGHT, fontWeight: 600, marginTop: 4 }}>{summary.gap}</div>
            </div>
          </div>
        </div>

        {/* actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <button onClick={() => setShowDetails(d => !d)} style={{ flex: 1, minWidth: 150, padding: 13, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: SOFT, cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14 }}>{showDetails ? 'Hide Feedback' : 'View Detailed Feedback'}</button>
          <button onClick={shareScore} disabled={sharing} style={{ flex: 1, minWidth: 150, padding: 13, borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${PURPLE},${CYAN})`, color: '#020812', cursor: sharing ? 'wait' : 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14 }}>{sharing ? 'Generating…' : 'Share Score 📤'}</button>
          <button onClick={retake} style={{ flex: 1, minWidth: 150, padding: 13, borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${GREEN},${CYAN})`, color: '#020812', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14 }}>Retake Interview</button>
        </div>
        {reviewAttemptId && (
          <a href={`/review/${reviewAttemptId}`} style={{ display: 'block', textAlign: 'center', marginBottom: 14, color: GENOIS, fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600, textDecoration: 'none' }}>
            📋 Saved to your review history — open full answer review →
          </a>
        )}

        {/* full session transcript — every Q + score persists here. Slate-800
            containers over the Slate-900 matrix; the candidate's own words get
            a distinct green-accented sub-block. */}
        {showDetails && (
          <div style={{ background: SLATE_900, border: `1px solid ${SLATE_700}`, borderRadius: 14, padding: SP[3], display: 'flex', flexDirection: 'column', gap: SP[3], boxSizing: 'border-box' }}>
            {questions.map((q, i) => {
              const e = evaluations[i];
              if (!e) return null;
              // Number by MAIN question; a follow-up shares its parent's number.
              const qNum = questions.slice(0, i + 1).filter(x => !x.isFollowUp).length;
              return (
                <div key={i} style={{ background: SLATE_800, border: `1px solid ${SLATE_700}`, borderRadius: 12, padding: SP[4], boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: SP[3], marginBottom: SP[2] }}>
                    <div style={{ fontSize: 13, color: TXT_WHITE, fontWeight: 600, lineHeight: 1.5 }}>{q.isFollowUp ? <span style={{ color: AMBER }}>↳ Q{qNum} follow-up. </span> : `Q${qNum}. `}{q.question}</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: gradeColor(e.grade), flexShrink: 0 }}>{e.overallScore}</div>
                  </div>
                  {answers[i]?.transcript && <div style={{ fontSize: 12.5, color: TXT_WHITE, lineHeight: 1.6, marginBottom: SP[2], padding: SP[2], background: SLATE_850, borderLeft: `2px solid ${GENOIS}`, borderRadius: 6 }}>🗣 {answers[i].transcript}</div>}
                  {e.verdict && <div style={{ fontSize: 12, color: TXT_MUTE, lineHeight: 1.6 }}>{e.verdict}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── selection screen (idle) ──────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 27, color: LIGHT, margin: '0 0 6px' }}>🎤 Voice Mock Interview</h1>
        <p style={{ color: MUTED, fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>Practice <b style={{ color: SOFT }}>speaking</b> your answers out loud — not typing. The AI plays a tough interviewer and scores you on accuracy, clarity, and confidence. 10 questions — and it may probe deeper with a follow-up when your answer invites one.</p>
      </div>

      {micBlockedBanner}

      {!isChromium && (
        <div style={{ background: `${AMBER}12`, border: `1px solid ${AMBER}33`, borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 12.5, color: AMBER }}>
          ⚠️ Voice interview works best in Chrome or Edge. Firefox/Safari may have limited speech support — you can still type your answers.
        </div>
      )}

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: CYAN, letterSpacing: 2, marginBottom: 12 }}>1 · PICK A MODE</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12, marginBottom: 24 }}>
        {MODES.map(m => {
          const sel = mode === m.key;
          return (
            <div key={m.key} onClick={() => setMode(m.key)} style={{ background: CARD, border: `2px solid ${sel ? CYAN + '55' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: 18, cursor: 'pointer', transition: 'border-color .2s' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: sel ? CYAN : LIGHT, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{m.desc}</div>
            </div>
          );
        })}
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: CYAN, letterSpacing: 2, marginBottom: 12 }}>2 · TARGET COMPANY</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {COMPANIES.map(c => (
          <button key={c} onClick={() => setCompany(c)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', background: company === c ? CYAN : 'rgba(255,255,255,0.05)', color: company === c ? '#020812' : MUTED, fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 13 }}>{c}</button>
        ))}
      </div>
      <input value={COMPANIES.includes(company) ? '' : company} onChange={e => setCompany(e.target.value)} placeholder="…or type any company" style={{ width: '100%', maxWidth: 280, padding: '9px 14px', borderRadius: 10, border: `1px solid ${CYAN}1f`, background: INPUT, color: LIGHT, fontSize: 13, fontFamily: 'var(--font-body)', boxSizing: 'border-box', marginBottom: 24 }} />

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: CYAN, letterSpacing: 2, marginBottom: 12 }}>3 · YOU</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28, alignItems: 'center' }}>
        <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="Your domain" style={{ flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 10, border: `1px solid ${CYAN}1f`, background: INPUT, color: LIGHT, fontSize: 13, fontFamily: 'var(--font-body)', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {['Fresher', 'Mid', 'Senior'].map(l => (
            <button key={l} onClick={() => setLevel(l)} style={{ padding: '9px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: level === l ? PURPLE : 'rgba(255,255,255,0.05)', color: level === l ? '#fff' : MUTED, fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 13 }}>{l}</button>
          ))}
        </div>
      </div>

      <button onClick={startInterview} style={{ width: '100%', padding: 16, borderRadius: 12, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${GENOIS},${GENOIS_SOFT})`, color: '#04120d', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16 }}>
        Start {company || ''} Voice Interview 🎤
      </button>
    </div>
  );
}
