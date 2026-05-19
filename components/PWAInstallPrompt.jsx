'use client';
import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const dismissedUntil = localStorage.getItem('pwa_dismissed_until');
    if (dismissedUntil && new Date(dismissedUntil) > new Date()) {
      setShowPrompt(false);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    localStorage.setItem('pwa_dismissed_until', thirtyDays.toISOString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      right: 16,
      left: 16,
      maxWidth: 380,
      marginLeft: 'auto',
      background: 'linear-gradient(135deg,rgba(7,15,31,0.98),rgba(0,240,255,0.05))',
      border: '1px solid rgba(0,240,255,0.3)',
      borderRadius: 14,
      padding: 18,
      zIndex: 9999,
      boxShadow: '0 10px 40px rgba(0,240,255,0.15)',
    }}>
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
