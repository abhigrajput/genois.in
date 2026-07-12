'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { token, ready } = useToken();
  const [notifs, setNotifs] = useState([]);
  const [prefs, setPrefs] = useState({ email_enabled: true, push_enabled: true, in_app_enabled: true, morning_time: '07:00', evening_time: '19:00' });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [pushPermission, setPushPermission] = useState('default');

  useEffect(() => {
    if (!ready || !token) return;
    loadAll();
    if (typeof Notification !== 'undefined') {
      setPushPermission(Notification.permission);
    }
  }, [ready, token]);

  async function loadAll() {
    try {
      const [n, p] = await Promise.all([
        apiFetch('/api/notifications-v2', token),
        apiFetch('/api/notifications-v2/preferences', token),
      ]);
      setNotifs(n.data?.notifications || []);
      setPrefs(p.data?.preferences || prefs);
      setLoading(false);
    } catch { setLoading(false); }
  }

  async function savePrefs(update) {
    const newPrefs = { ...prefs, ...update };
    setPrefs(newPrefs);
    try {
      await apiFetch('/api/notifications-v2/preferences', token, 'POST', newPrefs);
      toast.success('Preferences saved');
    } catch (e) { toast.error(e.message); }
  }

  async function requestPush() {
    if (typeof Notification === 'undefined') { toast.error('Push not supported'); return; }
    const perm = await Notification.requestPermission();
    setPushPermission(perm);
    if (perm === 'granted') {
      toast.success('Push notifications enabled!');
      new Notification('GENOIS', { body: 'You will get daily motivation here now 🔥', icon: '/favicon.ico' });
      savePrefs({ push_enabled: true });
    } else {
      toast.error('Permission denied');
    }
  }

  async function sendTestNotif() {
    try {
      const r = await apiFetch('/api/notifications-v2/send', token, 'POST', { type: 'morning' });
      toast.success('Test notification sent!');
      if (pushPermission === 'granted') {
        new Notification(r.data.notification.icon + ' ' + r.data.notification.title, {
          body: r.data.notification.message,
          icon: '/favicon.ico',
        });
      }
      setTimeout(loadAll, 500);
    } catch (e) { toast.error(e.message); }
  }

  async function markRead(id) {
    await apiFetch('/api/notifications-v2', token, 'POST', { action: 'mark_read', notificationId: id });
    loadAll();
  }

  function timeAgo(d) {
    const h = Math.floor((Date.now() - new Date(d)) / 3600000);
    if (h < 1) return 'just now';
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }

  if (loading) return <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center' }}>Loading...</div>;

  const filtered = tab === 'unread' ? notifs.filter(n => !n.read) : notifs;

  return (
    <div style={{ fontFamily: 'var(--font-body)', width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 4 }}>🔔 Notifications</h1>
        <p style={{ color: '#5a7a9a', fontSize: 13 }}>Daily motivation to keep you grinding. Like Zomato but for your career.</p>
      </div>

      <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00d9a3', letterSpacing: 2, marginBottom: 16 }}>DELIVERY CHANNELS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'in_app_enabled', icon: '🔔', label: 'In-App Banner', desc: 'See notifications on your dashboard' },
            { key: 'email_enabled', icon: '📧', label: 'Email (noreply@genois.in)', desc: 'Daily motivation to your inbox' },
            { key: 'push_enabled', icon: '📱', label: 'Browser Push', desc: pushPermission === 'granted' ? 'Enabled on this device' : 'Requires browser permission' },
          ].map(c => (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
              <div style={{ fontSize: 22 }}>{c.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8ed' }}>{c.label}</div>
                <div style={{ fontSize: 11, color: '#5a7a9a' }}>{c.desc}</div>
              </div>
              {c.key === 'push_enabled' && pushPermission !== 'granted' ? (
                <button onClick={requestPush} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(0,217,163,0.3)', background: 'transparent', color: '#00d9a3', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                  Enable →
                </button>
              ) : (
                <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22 }}>
                  <input type="checkbox" checked={prefs[c.key]} onChange={e => savePrefs({ [c.key]: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, background: prefs[c.key] ? '#00d9a3' : 'rgba(255,255,255,0.1)', borderRadius: 22, transition: '0.2s' }}>
                    <span style={{ position: 'absolute', height: 16, width: 16, left: prefs[c.key] ? 21 : 3, bottom: 3, background: prefs[c.key] ? '#020812' : '#5a7a9a', borderRadius: '50%', transition: '0.2s' }} />
                  </span>
                </label>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>MORNING PING</div>
            <input type="time" value={prefs.morning_time} onChange={e => savePrefs({ morning_time: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,217,163,0.15)', background: '#070f1f', color: '#e8e8ed', fontSize: 13, outline: 'none' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>EVENING PING</div>
            <input type="time" value={prefs.evening_time} onChange={e => savePrefs({ evening_time: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,217,163,0.15)', background: '#070f1f', color: '#e8e8ed', fontSize: 13, outline: 'none' }} />
          </div>
        </div>

        <button onClick={sendTestNotif} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, marginTop: 16 }}>
          🚀 Send Test Notification Now
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[{ key: 'all', label: 'All' }, { key: 'unread', label: 'Unread' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', background: tab === t.key ? '#00d9a3' : 'rgba(255,255,255,0.05)', color: tab === t.key ? '#020812' : '#5a7a9a', fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 600 }}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: '#070f1f', borderRadius: 12, color: '#5a7a9a' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔕</div>
          No notifications yet. Check back daily.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(n => (
            <div key={n.id} onClick={() => !n.read && markRead(n.id)} style={{ background: '#070f1f', border: `1px solid ${n.read ? 'rgba(255,255,255,0.04)' : 'rgba(0,217,163,0.15)'}`, borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 14, cursor: !n.read ? 'pointer' : 'default' }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{n.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8ed', marginBottom: 4 }}>{n.title}</div>
                <div style={{ fontSize: 13, color: '#8a9ab0', lineHeight: 1.6, marginBottom: 4 }}>{n.message}</div>
                <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>{timeAgo(n.sent_at)} · {n.type}</div>
              </div>
              {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00d9a3', marginTop: 6, flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
