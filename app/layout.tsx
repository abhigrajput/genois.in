import './globals.css';
import { Toaster } from 'react-hot-toast';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';

export const metadata = {
  title: 'GENOIS — Career OS for Engineering Students',
  description: 'Skill-first career platform for Indian engineering students',
  manifest: '/manifest.json',
  themeColor: '#00f0ff',
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
