'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function PlacementLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/placement-admin/login') return;
    const token = localStorage.getItem('placement_admin_token');
    if (!token) router.replace('/placement-admin/login');
  }, [pathname, router]);

  return (
    <div style={{ minHeight: '100vh', background: '#030a03', color: '#e2ffe2', fontFamily: 'var(--font-mono)' }}>
      {children}
    </div>
  );
}
