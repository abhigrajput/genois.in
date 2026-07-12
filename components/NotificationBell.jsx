'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export default function NotificationBell({ token }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!token) return;
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  async function load() {
    try {
      const r = await fetch('/api/notifications-v2', { headers: { Authorization: 'Bearer ' + token } });
      const d = await r.json();
      if (d.success) {
        setNotifs(d.data.notifications || []);
        setUnread(d.data.unread || 0);
      }
    } catch {}
  }

  async function markAllRead() {
    await fetch('/api/notifications-v2', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    });
    load();
  }

  function timeAgo(date) {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', zIndex: 100000 }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 8,
          position: 'relative',
          color: '#e8e8ed',
          fontSize: 20,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            minWidth: 16,
            height: 16,
            padding: '0 4px',
            borderRadius: 10,
            background: '#ff2d78',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          top: 60,
          right: 8,
          width: 320,
          maxHeight: 500,
          background: '#070f1f',
          border: '1px solid rgba(0,217,163,0.25)',
          borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0,0,0,0.9)',
          zIndex: 999999,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          opacity: 1,
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: '#e8e8ed' }}>Notifications</div>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#00d9a3', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                Mark all read
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 360 }}>
            {notifs.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#5a7a9a', fontSize: 13 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔕</div>
                No notifications yet
              </div>
            ) : (
              notifs.map(n => (
                <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', background: n.read ? 'transparent' : 'rgba(0,217,163,0.03)', display: 'flex', gap: 12, cursor: 'pointer' }}>
                  <div style={{ fontSize: 22, flexShrink: 0 }}>{n.icon || '🔔'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8ed', marginBottom: 3 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: '#8a9ab0', lineHeight: 1.5, marginBottom: 4 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>{timeAgo(n.sent_at)}</div>
                  </div>
                  {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00d9a3', flexShrink: 0, marginTop: 6 }} />}
                </div>
              ))
            )}
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => { setOpen(false); router.push('/notifications'); }} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: '#00d9a3', fontSize: 12, fontFamily: 'var(--font-heading)', fontWeight: 600, padding: '6px' }}>
              View all & Settings →
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
