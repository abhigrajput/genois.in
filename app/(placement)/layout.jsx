'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function PlacementLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  // The session is an httpOnly cookie JS cannot see, so this checks only the
  // non-secret hint set at login. The stats API's 401 is the real check.
  useEffect(() => {
    localStorage.removeItem('placement_admin_token'); // legacy script-readable copy
    if (pathname === '/placement-admin/login') return;
    if (!localStorage.getItem('placement_admin_session')) router.replace('/placement-admin/login');
  }, [pathname, router]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontFamily: 'var(--font-mono)' }}>
      {children}
    </div>
  );
}
