'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/onboarding');
  }, [router]);
  return (
    <div style={{ minHeight: '100vh', background: '#020812', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
      Redirecting to signup...
    </div>
  );
}
