'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const ENGAGE_MS = 60 * 1000; // only surface after the user has been around a minute

export default function PWAInstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [engaged, setEngaged] = useState(false);
  const [dismissed, setDismissed] = useState(true); // assume hidden until we've read localStorage (no flash)

  // Register the service worker + capture the install event on every route.
  // The event can fire early; we hold it and decide *whether* to surface later.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Honour a recent dismissal, otherwise arm a 60s engagement timer.
  useEffect(() => {
    const d = localStorage.getItem('genois_install_dismissed');
    const stillDismissed = d && Date.now() - Number(d) < SEVEN_DAYS;
    setDismissed(!!stillDismissed);
    if (stillDismissed) return;
    const t = setTimeout(() => setEngaged(true), ENGAGE_MS);
    return () => clearTimeout(t);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('genois_install_dismissed', String(Date.now()));
  };

  // Only on the dashboard — never on active task pages (voice-interview, coding, roadmap, …).
  const onDashboard = pathname === '/dashboard';
  const show = onDashboard && engaged && !!deferredPrompt && !dismissed;
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(16px + env(safe-area-inset-bottom))',
      right: 16,
      width: 'calc(100vw - 32px)',
      maxWidth: 320,
      background: 'linear-gradient(135deg,rgba(7,15,31,0.98),rgba(0,240,255,0.05))',
      border: '1px solid rgba(0,240,255,0.3)',
      borderRadius: 14,
      padding: 18,
      paddingRight: 34,
      zIndex: 9999,
      boxShadow: '0 10px 40px rgba(0,0,0,0.45)',
    }}>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        style={{ position: 'absolute', top: 8, right: 10, background: 'transparent', border: 'none', color: '#9ca3af', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
      >
        ×
      </button>
      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: '#e8f4ff', marginBottom: 6 }}>
        📱 Install GENOIS
      </div>
      <div style={{ fontSize: 12, color: '#8a9ab0', marginBottom: 14, lineHeight: 1.5 }}>
        Add to home screen for instant access. Works offline.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleInstall} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700 }}>
          Install
        </button>
        <button onClick={handleDismiss} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: 'transparent', color: '#5a7a9a', fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 600 }}>
          Later
        </button>
      </div>
    </div>
  );
}
