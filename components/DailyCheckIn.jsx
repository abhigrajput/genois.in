'use client';
import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

const PURPLE = '#00d9a3';
const PURPLE_LIGHT = '#2ee6b0';
const MUTED = '#8b93a1';

// Day-of-week messages. [name] is replaced with the user's first name.
const DAY_MESSAGES = [
  'Sunday effort. Most students quit today — you won\'t. 😎',                     // 0 Sun
  'New week, [name]. Your roadmap is ready. Let\'s start strong. 💪',             // 1 Mon
  'Good progress yesterday. Today, aim higher. 😄',                              // 2 Tue
  'Midweek push. Complete today\'s task to keep your streak. 🔥',                 // 3 Wed
  'Almost the weekend. Don\'t break the streak now, [name]. 🔥',                  // 4 Thu
  'Finish today\'s task and enjoy your weekend. 🎉',                             // 5 Fri
  'Weekend grind. This dedication is what gets you placed, [name]. 💪',          // 6 Sat
];

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `genois_checkin_${y}-${m}-${day}`;
}

export default function DailyCheckIn({ name }) {
  const [visible, setVisible] = useState(false); // floating button visible
  const [open, setOpen] = useState(false);       // popup open
  const [busyReply, setBusyReply] = useState(false);

  const firstName = (name || '').trim().split(/\s+/)[0] || 'there';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Already checked in today → never show.
    if (localStorage.getItem(todayKey())) return;
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const markDone = () => {
    try { localStorage.setItem(todayKey(), '1'); } catch {}
  };

  const handleYes = () => {
    markDone();
    setOpen(false);
    setTimeout(() => setVisible(false), 250);
  };

  const handleBusy = () => {
    markDone();
    setBusyReply(true);
    // Show the encouraging reply, then close.
    setTimeout(() => { setOpen(false); setTimeout(() => setVisible(false), 250); }, 2200);
  };

  const dismissButton = () => {
    // Closing the floating button (X) also counts as seen for today.
    markDone();
    setVisible(false);
  };

  if (!visible) return null;

  const message = DAY_MESSAGES[new Date().getDay()].replace(/\[name\]/g, firstName);

  return (
    <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 1000, fontFamily: 'var(--font-body)' }}>
      {open ? (
        <div style={{
          width: 320, maxWidth: 'calc(100vw - 40px)', background: '#12121a',
          border: '1px solid rgba(0,217,163,0.28)', borderRadius: 18,
          boxShadow: '0 24px 60px rgba(0,0,0,0.55)', overflow: 'hidden',
          animation: 'dci-slide 0.28s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'rgba(0,217,163,0.1)', borderBottom: '1px solid rgba(0,217,163,0.18)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${PURPLE}, #00b389)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15, color: '#fff', flexShrink: 0 }}>G</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13.5, fontWeight: 700, color: '#f8fafc' }}>GENOIS</div>
              <div style={{ fontSize: 10.5, color: '#34d399', fontFamily: 'var(--font-mono)' }}>● online</div>
            </div>
            <button onClick={dismissButton} aria-label="Close" style={{ background: 'transparent', border: 'none', color: MUTED, cursor: 'pointer', padding: 4, lineHeight: 0, display: 'flex' }}><X size={16} strokeWidth={2} /></button>
          </div>

          {/* Body */}
          <div style={{ padding: '16px' }}>
            <div style={{ background: 'rgba(0,217,163,0.14)', border: '1px solid rgba(0,217,163,0.25)', borderRadius: '4px 14px 14px 14px', padding: '11px 14px', color: '#f1f5f9', fontSize: 14, lineHeight: 1.55, marginBottom: 14 }}>
              {busyReply ? 'No problem! Even 15 minutes counts. All the best! 🙌' : message}
            </div>

            {!busyReply && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={handleYes} style={{
                  padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${PURPLE}, #00b389)`, color: '#fff',
                  fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700,
                }}>
                  I'll do it 💪
                </button>
                <button onClick={handleBusy} style={{
                  padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(0,217,163,0.25)', color: '#c7d2fe',
                  fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600,
                }}>
                  Busy today 😅
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} aria-label="Daily check-in" style={{
          width: 58, height: 58, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg, ${PURPLE}, #00b389)`, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(0,217,163,0.5)', animation: 'dci-pop 0.35s cubic-bezier(0.16,1,0.3,1), dci-float 3s ease-in-out infinite 0.35s',
        }}>
          <MessageCircle size={26} strokeWidth={2} />
        </button>
      )}

      <style>{`
        @keyframes dci-slide { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes dci-pop { from { transform: scale(0.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes dci-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>
    </div>
  );
}
