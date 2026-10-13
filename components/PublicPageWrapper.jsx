'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import useAuthStore from '@/store/authStore';

const AppLayout = dynamic(() => import('./layout/AppLayout'), { ssr: false });
const PublicNav = dynamic(() => import('./PublicNav'), { ssr: false });

export default function PublicPageWrapper({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  // The persisted store, not localStorage.genois_token — see PublicNav.jsx for
  // why (the token is absent for cookie sessions; useToken()'s sentinel is
  // truthy for anonymous visitors too).
  useEffect(() => {
    setIsLoggedIn(useAuthStore.getState().isAuthenticated);
  }, []);

  if (isLoggedIn === null) {
    return <div style={{ minHeight: '100vh', background: 'var(--gx-surface)' }} />;
  }

  if (isLoggedIn) {
    return <AppLayout>{children}</AppLayout>;
  }

  return (
    <>
      <PublicNav />
      {children}
    </>
  );
}
