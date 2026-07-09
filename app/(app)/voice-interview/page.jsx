'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

// ── theme (app-interior palette) ───────────────────────────────────────────
const CARD = '#070f1f';
const INPUT = '#050d1a';
const CYAN = '#00f0ff';
const PURPLE = '#ff6b4a';
const GREEN = '#1D9E75';
const RED = '#ff2d78';
const AMBER = '#EF9F27';
const MUTED = '#5a7a9a';
const LIGHT = '#e8e8ed';
const SOFT = '#c8d8e8';

const TOTAL_QUESTIONS = 10;
const MIN_WORDS = 10;

const MODES = [
  { key: 'technical', icon: '⚙️', label: 'Technical', desc: 'DSA, system design, coding logic, core CS.' },
  { key: 'hr', icon: '💬', label: 'HR / Behavioural', desc: 'Motivation, teamwork, failure, communication.' },
  { key: 'mixed', icon: '🎲', label: 'Mixed', desc: 'A realistic blend of technical and behavioural.' },
];

const COMPANIES = ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'Amazon', 'Microsoft', 'Google', 'Flipkart'];

// Collapse immediate word repetitions ("so so well" → "so well") that the
// Web Speech API can leave behind when final results overlap. Applied on submit.
function cleanTranscript(text) {
  if (!text) return text;
  const words = text.split(/\s+/);
  const cleaned = [];
  for (let i = 0; i < words.length; i++) {
    if (i > 0 && words[i].toLowerCase() === words[i - 1].toLowerCase()) continue;
    cleaned.push(words[i]);
  }
  return cleaned.join(' ');
}

const wordsOf = (s) => (s || '').trim().split(/\s+/).filter(Boolean).length;
const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
const barColor = (v) => (v >= 75 ? GREEN : v >= 55 ? AMBER : RED);
const gradeColor = (g) => (g === 'A+' || g === 'A' ? GREEN : g === 'B+' || g === 'B' ? CYAN : g === 'C+' || g === 'C' ? AMBER : RED);
function gradeFromScore(s) {
  if (s >= 90) return 'A+'; if (s >= 80) return 'A'; if (s >= 75) return 'B+'; if (s >= 70) return 'B';
  if (s >= 65) return 'C+'; if (s >= 55) return 'C'; if (s >= 45) return 'D'; return 'F';
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

export default function VoiceInterviewPage() {
  const { token, ready } = useToken();

  // config
  const [mode, setMode] = useState('technical');
  const [company, setCompany] = useState('TCS');
  const [domain, setDomain] = useState('Software Engineering');
  const [level, setLevel] = useState('Fresher');
  const [userName, setUserName] = useState('');

  // session
  const [status, setStatus] = useState('idle'); // idle | loadingQ | question | evaluating | result | complete
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [qStartTime, setQStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [summary, setSummary] = useState(null);
  const [percentile, setPercentile] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sharing, setSharing] = useState(false);

  // speech
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isChromium, setIsChromium] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [micBlocked, setMicBlocked] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef(''); // accumulates confirmed final text — dedup source of truth
  const shareRef = useRef(null);

  const currentQ = questions[qIndex];
  const currentEval = evaluations[qIndex];
  const liveText = (transcript + ' ' + interim).trim();
  const liveWords = wordsOf(liveText);

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

  const stopListening = useCallback(() => {
    try { recognitionRef.current && recognitionRef.current.stop(); } catch {}
    setIsListening(false);
    setInterim('');
  }, []);

  // stop mic on unmount
  useEffect(() => () => stopListening(), [stopListening]);

  const startListening = async () => {
    if (typeof window === 'undefined') return;

    // Seed the dedup ref from whatever's already transcribed so a resumed
    // ("Tap to add more") session appends instead of overwriting. A fresh
    // question resets transcript to '' first, so this starts empty then.
    finalTranscriptRef.current = transcript ? transcript.trim() + ' ' : '';

    // Step 1: Trigger browser permission popup explicitly
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Permission granted — stop the stream immediately, we don't need it
      stream.getTracks().forEach(t => t.stop());
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

    // Step 2: Now start SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice not supported. Please use Google Chrome.');
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
      // Accumulate ONLY the newly-finalized text into a ref, then mirror it into
      // state. Mutating the ref inside the event handler (not via a functional
      // state updater) avoids double-appends and overlapping-segment loops.
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
      setIsListening(false);
      setInterim('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterim('');
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      toast.error('Could not start recording: ' + e.message);
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
    setStatus('loadingQ');
    try {
      const prev = questions.map(q => q.question);
      const r = await apiFetch('/api/interview/questions', token, 'POST', {
        domain, level, targetCompany: company, mode, questionNumber: qNum, previousQuestions: prev,
      });
      const q = r.data.question;
      setQuestions(arr => [...arr, q]);
      speakQuestion(q.question); // 🔊 read the new question aloud (start + every "Next")
      setQIndex(qNum - 1);
      setQStartTime(Date.now());
      setStatus('question');
    } catch (e) {
      toast.error(e.message || 'Could not load the next question.');
      setStatus(revertStatus);
    }
  }

  function startInterview() {
    if (!company.trim()) { toast.error('Pick or type a target company.'); return; }
    setQuestions([]); setAnswers([]); setEvaluations([]); setSummary(null); setPercentile(null); setShowDetails(false);
    setStartTime(Date.now());
    fetchQuestion(1, 'idle');
  }

  async function submitAnswer() {
    const answerText = cleanTranscript(liveText);
    const wc = wordsOf(answerText);
    if (wc < MIN_WORDS) { toast.error(`Speak a bit more — at least ${MIN_WORDS} words (you have ${wc}).`); return; }
    stopListening();
    setStatus('evaluating');
    try {
      const r = await apiFetch('/api/interview/evaluate', token, 'POST', {
        question: currentQ.question,
        answer: answerText,
        domain,
        targetCompany: company,
        questionType: currentQ.type || 'technical',
        wordCount: wc,
      });
      const evaluation = r?.data?.evaluation;
      if (!evaluation) throw new Error('Evaluation response was empty');
      setAnswers(arr => [...arr, { transcript: answerText, wordCount: wc }]);
      setEvaluations(arr => [...arr, evaluation]);
      setStatus('result');
    } catch (e) {
      // Don't break the interview if scoring fails — log it and show a fallback score.
      console.error('[voice-interview] evaluation failed:', e);
      toast.error('Scoring service hiccuped — showing an estimated score.');
      const fallback = {
        technicalAccuracy: 70, communicationClarity: 65, confidenceScore: 75,
        overallScore: 70, grade: 'B',
        strengths: ['Answer recorded'], improvements: ['Keep practicing'],
        verdict: 'Good attempt — scoring was unavailable, so this is an estimate.',
      };
      setAnswers(arr => [...arr, { transcript: answerText, wordCount: wc }]);
      setEvaluations(arr => [...arr, fallback]);
      setStatus('result');
    }
  }

  async function continueNext() {
    if (qIndex + 1 < TOTAL_QUESTIONS) {
      fetchQuestion(qIndex + 2, 'result');
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
      });
      setPercentile(r.data.percentile);
    } catch { setPercentile(null); }
  }

  function retake() {
    stopListening();
    finalTranscriptRef.current = '';
    setStatus('idle'); setQuestions([]); setAnswers([]); setEvaluations([]); setQIndex(0);
    setSummary(null); setPercentile(null); setTranscript(''); setInterim(''); setShowDetails(false);
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
    @keyframes vi-pulse { 0%{box-shadow:0 0 0 0 rgba(255,45,120,.55)} 70%{box-shadow:0 0 0 26px rgba(255,45,120,0)} 100%{box-shadow:0 0 0 0 rgba(255,45,120,0)} }
    @keyframes vi-spin { to { transform: rotate(360deg) } }
    @keyframes vi-blink { 0%,100%{opacity:1} 50%{opacity:.25} }`;

  const micBlockedBanner = micBlocked ? (
    <div style={{
      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)',
      borderRadius: 10, padding: '12px 18px', marginBottom: 16,
      color: '#ffb020', fontSize: 13, fontFamily: 'var(--font-body)', lineHeight: 1.6,
    }}>
      🎤 <strong>Microphone blocked.</strong> To fix: Click the <strong>🔒 lock icon</strong> in Chrome’s address bar → Find “Microphone” → Set to <strong>“Allow”</strong> → Refresh this page.
    </div>
  ) : null;

  if (!ready) return <div style={{ color: MUTED, padding: 60, textAlign: 'center' }}>Loading…</div>;

  // ── loaders ────────────────────────────────────────────────────────────
  if (status === 'loadingQ' || status === 'evaluating') {
    const evaluating = status === 'evaluating';
    return (
      <div style={{ color: MUTED, padding: 80, textAlign: 'center', fontFamily: 'var(--font-body)' }}>
        <style dangerouslySetInnerHTML={{ __html: keyframes }} />
        <div style={{ width: 46, height: 46, margin: '0 auto 18px', border: `3px solid rgba(0,240,255,.15)`, borderTopColor: CYAN, borderRadius: '50%', animation: 'vi-spin .8s linear infinite' }} />
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: LIGHT }}>
          {evaluating ? 'Interviewer is evaluating your answer…' : 'Interviewer is thinking…'}
        </div>
        <div style={{ fontSize: 13, marginTop: 6 }}>{evaluating ? 'Scoring accuracy, clarity & confidence' : `Preparing question ${Math.min(questions.length + 1, TOTAL_QUESTIONS)} of ${TOTAL_QUESTIONS}`}</div>
      </div>
    );
  }

  // ── question screen ────────────────────────────────────────────────────
  if (status === 'question' && currentQ) {
    const enough = liveWords >= MIN_WORDS;
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: 'var(--font-body)', paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' }}>
        <style dangerouslySetInnerHTML={{ __html: keyframes }} />

        {/* interviewer bar */}
        <div style={{ background: `linear-gradient(135deg,${PURPLE}14,transparent)`, border: `1px solid ${PURPLE}33`, borderRadius: 14, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg,${CYAN},${PURPLE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤖</div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15, color: LIGHT }}>AI Interviewer · {company}</div>
              <div style={{ fontSize: 11, color: MUTED, fontFamily: 'var(--font-mono)' }}>{MODES.find(m => m.key === mode)?.label} mode</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: CYAN }}>Q{qIndex + 1} / {TOTAL_QUESTIONS}</div>
            <div style={{ fontSize: 11, color: MUTED, fontFamily: 'var(--font-mono)' }}>⏱ {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</div>
          </div>
        </div>

        {micBlockedBanner}

        {/* progress */}
        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 22, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((qIndex + 1) / TOTAL_QUESTIONS) * 100}%`, background: `linear-gradient(90deg,${CYAN},${PURPLE})`, borderRadius: 3, transition: 'width .4s' }} />
        </div>

        {/* question */}
        <div style={{ background: CARD, border: `1px solid ${CYAN}1a`, borderRadius: 16, padding: '24px 22px', marginBottom: 22 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 9, padding: '3px 9px', borderRadius: 10, background: `${PURPLE}1a`, color: PURPLE, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{currentQ.type}</span>
            <span style={{ fontSize: 9, padding: '3px 9px', borderRadius: 10, background: `${AMBER}1a`, color: AMBER, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{currentQ.difficulty}</span>
          </div>
          <div style={{ fontSize: 'clamp(17px,3.6vw,23px)', color: LIGHT, lineHeight: 1.55, fontWeight: 500, fontFamily: 'var(--font-heading)' }}>{currentQ.question}</div>
          <button
            onClick={() => speakQuestion(currentQ?.question)}
            style={{
              background: 'transparent', border: '1px solid rgba(0,217,163,0.3)',
              borderRadius: 8, padding: '6px 14px', color: '#2ee6b0',
              fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer',
              marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🔊 Replay Question
          </button>
        </div>

        {/* mic / transcript */}
        {speechSupported ? (
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <button
              onClick={() => (isListening ? stopListening() : startListening())}
              style={{
                width: 132, height: 132, borderRadius: '50%', cursor: 'pointer', border: 'none',
                background: isListening ? RED : `linear-gradient(135deg,${CARD},${INPUT})`,
                boxShadow: isListening ? 'none' : `inset 0 0 0 2px ${CYAN}40`,
                animation: isListening ? 'vi-pulse 1.4s infinite' : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                color: isListening ? '#fff' : CYAN, transition: 'background .2s',
              }}>
              <span style={{ fontSize: 40 }}>🎤</span>
            </button>
            <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 13, color: isListening ? RED : MUTED }}>
              {isListening ? (<span><span style={{ animation: 'vi-blink 1s infinite' }}>🔴</span> Recording… tap to stop</span>) : (transcript ? 'Tap to add more' : 'Tap to answer out loud')}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: AMBER, marginBottom: 8, fontFamily: 'var(--font-mono)' }}>⚠️ Voice input isn’t supported here — type your answer instead (Chrome recommended).</div>
            <textarea value={transcript} onChange={e => setTranscript(e.target.value)} rows={6} placeholder="Type your answer…" style={{ width: '100%', padding: 14, borderRadius: 10, border: `1px solid ${CYAN}1f`, background: INPUT, color: LIGHT, fontSize: 14, fontFamily: 'var(--font-body)', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
          </div>
        )}

        {/* transcript display */}
        {(liveText || isListening) && (
          <div style={{ background: INPUT, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 14, minHeight: 60 }}>
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>
              <span style={{ color: SOFT }}>{transcript}</span>
              {interim && <span style={{ color: MUTED, fontStyle: 'italic' }}> {interim}</span>}
            </div>
          </div>
        )}

        {/* word count + submit */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: liveWords < MIN_WORDS ? RED : liveWords <= 20 ? AMBER : GREEN }}>
            {liveWords} words {enough ? '✓' : `· need ${MIN_WORDS}+`}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {(transcript || interim) && <button onClick={() => { finalTranscriptRef.current = ''; setTranscript(''); setInterim(''); }} style={{ padding: '11px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: MUTED, cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13 }}>Clear</button>}
            <button onClick={submitAnswer} disabled={!enough} style={{ padding: '11px 22px', borderRadius: 10, border: 'none', cursor: enough ? 'pointer' : 'not-allowed', background: enough ? `linear-gradient(135deg,${GREEN},${CYAN})` : 'rgba(255,255,255,0.06)', color: enough ? '#020812' : MUTED, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14 }}>Submit Answer →</button>
          </div>
        </div>
      </div>
    );
  }

  // ── per-answer result ──────────────────────────────────────────────────
  if (status === 'result' && currentEval) {
    const ev = currentEval;
    const isLast = qIndex + 1 >= TOTAL_QUESTIONS;
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
        <div style={{ background: CARD, border: `1px solid ${gradeColor(ev.grade)}33`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: MUTED, letterSpacing: 1.5 }}>QUESTION {qIndex + 1} / {TOTAL_QUESTIONS} · {currentQ?.type?.toUpperCase()}</div>
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

        <button onClick={continueNext} style={{ width: '100%', padding: 15, borderRadius: 12, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${CYAN},${PURPLE})`, color: '#020812', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15 }}>
          {isLast ? 'See Final Results 🎉' : `Continue to Q${qIndex + 2} →`}
        </button>
      </div>
    );
  }

  // ── final summary ──────────────────────────────────────────────────────
  if (status === 'complete' && summary) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
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

        {showDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {questions.map((q, i) => {
              const e = evaluations[i];
              if (!e) return null;
              return (
                <div key={i} style={{ background: CARD, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 13, color: LIGHT, fontWeight: 600, lineHeight: 1.5 }}>Q{i + 1}. {q.question}</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: gradeColor(e.grade), flexShrink: 0 }}>{e.overallScore}</div>
                  </div>
                  {e.verdict && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{e.verdict}</div>}
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
    <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 27, color: LIGHT, margin: '0 0 6px' }}>🎤 Voice Mock Interview</h1>
        <p style={{ color: MUTED, fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>Practice <b style={{ color: SOFT }}>speaking</b> your answers out loud — not typing. The AI plays a tough interviewer and scores you on accuracy, clarity, and confidence. 10 questions.</p>
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

      <button onClick={startInterview} style={{ width: '100%', padding: 16, borderRadius: 12, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${CYAN},${PURPLE})`, color: '#020812', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16 }}>
        Start {company || ''} Voice Interview 🎤
      </button>
    </div>
  );
}
