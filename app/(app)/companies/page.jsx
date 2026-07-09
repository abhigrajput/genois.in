'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToken, apiFetch } from '@/lib/useApi';
import { TIER_LABELS } from '@/lib/companiesData';

export default function CompaniesPage() {
  const router = useRouter();
  const { token, ready } = useToken();
  const [companies, setCompanies] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    apiFetch('/api/company-prep', token).then(r => {
      setCompanies(r.data?.companies || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [ready, token]);

  const filtered = filter === 'all' ? companies : companies.filter(c => c.tier === filter);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#5a7a9a' }}>Loading...</div>;

  return (
    <div style={{ fontFamily: 'var(--font-body)', maxWidth: 1100, paddingBottom: 60 }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: '#e8e8ed', marginBottom: 4 }}>🎯 Company Prep</h1>
      <p style={{ color: '#5a7a9a', fontSize: 13, marginBottom: 20 }}>Detailed prep guide for top tech companies. Pick your target.</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {['all', 'service', 'product', 'startup'].map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${filter === t ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.08)'}`, background: filter === t ? 'rgba(0,240,255,0.08)' : 'transparent', color: filter === t ? '#00f0ff' : '#8a9ab0', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-heading)', fontWeight: 600, textTransform: 'capitalize' }}>
            {t === 'all' ? 'All' : TIER_LABELS[t]}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
        {filtered.map(c => (
          <button key={c.slug} onClick={() => router.push(`/companies/${c.slug}`)} style={{ padding: 18, borderRadius: 14, border: '1px solid rgba(0,240,255,0.1)', background: '#070f1f', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 32 }}>{c.logo}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#e8e8ed' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#5a7a9a', textTransform: 'uppercase', letterSpacing: 1 }}>{TIER_LABELS[c.tier]}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#8a9ab0' }}>📦 {c.package}</div>
              <div style={{ fontSize: 12, color: '#8a9ab0' }}>⏱️ Prep: {c.prepTime}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
