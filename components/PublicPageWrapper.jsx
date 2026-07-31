'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const AppLayout = dynamic(() => import('./layout/AppLayout'), { ssr: false });
const PublicNav = dynamic(() => import('./PublicNav'), { ssr: false });

export default function PublicPageWrapper({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('genois_token');
    setIsLoggedIn(!!token);
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
