import './globals.css';
import { Syne, Outfit, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';

const syne = Syne({ subsets: ['latin'], variable: '--font-syne' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export const metadata = {
  title: 'GENOIS — Career OS for Engineering Students',
  description: 'Skill-first career platform for Indian engineering students',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#6366f1',
  viewportFit: 'cover', // required so env(safe-area-inset-*) resolves on notched phones
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
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
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
              borderRadius: '10px',
              background: '#070f1f',
              color: '#e8f4ff',
              border: '1px solid rgba(0,240,255,0.15)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            },
            success: { iconTheme: { primary: '#1D9E75', secondary: '#020812' } },
            error:   { iconTheme: { primary: '#ff2d78', secondary: '#020812' } },
          }}
        />
        <PWAInstallPrompt />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
