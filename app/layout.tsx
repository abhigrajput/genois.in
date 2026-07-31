import './globals.css';
import { Space_Grotesk, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';

// Distinct pairing — Space Grotesk (geometric display) + Instrument Sans (characterful body).
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-heading', weight: ['400', '500', '600', '700'] });
const instrumentSans = Instrument_Sans({ subsets: ['latin'], variable: '--font-body' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata = {
  // Matches the landing page's positioning. Every claim here maps to a live
  // feature — see the NAV_ITEMS list in components/layout/AppLayout.jsx.
  title: 'GENOIS — Placement prep that tells you what to do today',
  description: 'Placement prep for engineering students — a diagnostic, a day-by-day roadmap, one task each morning, plus ATS resume analysis and voice mock interviews.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  // Deep-green accent from the light design system (--gx-accent). The old
  // #00d9a3 is the bright brand green, which design-tokens.css restricts to
  // decorative fills. Keep in sync with theme_color in public/manifest.json.
  themeColor: '#00805e',
  viewportFit: 'cover', // required so env(safe-area-inset-*) resolves on notched phones
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${instrumentSans.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fqfgacmnqppifpzncrip.supabase.co" />
      </head>
      <body>
        <GoogleAnalytics />
        <SessionProviderWrapper>
          {children}
          <Toaster
          position="top-right"
          // Light system values, set once here so no page needs its own
          // per-toast override. Mirrors a `.gx-card`: white surface, neutral
          // border, barely-there shadow.
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              borderRadius: 'var(--gx-radius-md)',
              background: 'var(--gx-bg)',
              color: 'var(--gx-text)',
              border: '1px solid var(--gx-border)',
              boxShadow: 'var(--gx-shadow-md)',
            },
            success: { iconTheme: { primary: 'var(--gx-success)', secondary: 'var(--gx-text-inverse)' } },
            error:   { iconTheme: { primary: 'var(--gx-danger)',  secondary: 'var(--gx-text-inverse)' } },
          }}
        />
        <PWAInstallPrompt />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
