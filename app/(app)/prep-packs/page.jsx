'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

const COMPANIES = [
  {
    id: 'tcs',
    name: 'TCS',
    fullName: 'Tata Consultancy Services',
    logo: '🔷',
    color: '#3366CC',
    price: 199,
    test: 'TCS NQT',
    students: '2.5 lakh+ students hired yearly',
    highlights: ['Numerical Ability', 'Logical Reasoning', 'Programming Logic', 'Coding Section', 'Previous year patterns', 'Full strategy guide'],
  },
  {
    id: 'infosys',
    name: 'Infosys',
    fullName: 'Infosys Limited',
    logo: '🔵',
    color: '#007CC3',
    price: 199,
    test: 'InfyTQ + Placement Test',
    students: '1.5 lakh+ students hired yearly',
    highlights: ['Quantitative Aptitude', 'Data Sufficiency', 'InfyTQ Strategy', 'Coding Prep', 'Interview guide', 'Full strategy guide'],
  },
  {
    id: 'wipro',
    name: 'Wipro',
    fullName: 'Wipro Limited',
    logo: '🟣',
    color: '#341C5C',
    price: 199,
    test: 'NLTH',
    students: '1 lakh+ students hired yearly',
    highlights: ['Aptitude Prep', 'Essay Writing', 'Reasoning', 'Coding Section', 'HR Interview prep', 'Full strategy guide'],
  },
];

export default function PrepPacksPage() {
  const { token, ready } = useToken();
  const [purchased, setPurchased] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState(null);
  const [packContent, setPackContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [buying, setBuying] = useState(null);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/prep-packs', token)
      .then(r => { setPurchased(r.data?.purchased || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ready, token]);

  async function viewPack(companyId) {
    setSelectedPack(companyId);
    setLoadingContent(true);
    try {
      const r = await apiFetch(`/api/prep-packs/content?company=${companyId}`, token);
      setPackContent(r.data?.pack);
    } catch (e) {
      toast.error('Failed to load pack content');
    }
    setLoadingContent(false);
  }

  if (selectedPack && packContent) {
    const company = COMPANIES.find(c => c.id === selectedPack);
    return (
      <div style={{ maxWidth: 780, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={() => { setSelectedPack(null); setPackContent(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#00f0ff', fontSize: 18, padding: 0 }}>←</button>
          <div>
            <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: '#e8f4ff', margin: 0 }}>
              {packContent.logo} {packContent.company} Prep Pack
            </h1>
            <p style={{ color: '#5a7a9a', fontSize: 13, margin: 0 }}>{packContent.testName}</p>
          </div>
        </div>

        <div style={{ background: '#070f1f', border: `1px solid ${company?.color}30`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: company?.color, letterSpacing: 2, marginBottom: 10 }}>OVERVIEW</div>
          <p style={{ color: '#c8d8e8', fontSize: 14, lineHeight: 1.8, margin: 0 }}>{packContent.overview}</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 14 }}>EXAM SECTIONS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {packContent.sections.map((s, i) => (
              <div key={i} style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: '#e8f4ff' }}>{s.name}</div>
                  <div style={{ padding: '3px 10px', borderRadius: 20, background: `${company?.color}15`, color: company?.color, fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>
                    {s.weight}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {s.topics.map((t, ti) => (
                    <span key={ti} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', color: '#8a9ab0', fontSize: 12, fontFamily: 'JetBrains Mono,monospace' }}>{t}</span>
                  ))}
                </div>
                <div style={{ padding: '10px 14px', background: 'rgba(0,240,255,0.04)', borderRadius: 8, fontSize: 13, color: '#5a7a9a', lineHeight: 1.6 }}>
                  💡 {s.tips}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#1D9E75', letterSpacing: 2, marginBottom: 14 }}>WINNING STRATEGY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {packContent.strategy.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ color: '#1D9E75', fontFamily: 'Syne,sans-serif', fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ fontSize: 14, color: '#c8d8e8', lineHeight: 1.6 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#070f1f', border: '1px solid rgba(239,159,39,0.2)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#EF9F27', letterSpacing: 2, marginBottom: 8 }}>CUTOFF</div>
            <p style={{ color: '#c8d8e8', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{packContent.cutoff}</p>
          </div>
          <div style={{ background: '#070f1f', border: '1px solid rgba(123,92,255,0.2)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#7b5cff', letterSpacing: 2, marginBottom: 8 }}>TIMELINE</div>
            <p style={{ color: '#c8d8e8', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{packContent.timeline}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>
          🏢 Company Prep Packs
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 13 }}>
          Targeted preparation for specific company placement tests. Know exactly what to study.
        </p>
      </div>

      {loading ? (
        <div style={{ color: '#5a7a9a', textAlign: 'center', padding: 40, fontFamily: 'JetBrains Mono,monospace' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {COMPANIES.map(c => {
            const isPurchased = purchased.includes(c.id);
            return (
              <div key={c.id} style={{ background: '#070f1f', border: `1px solid ${isPurchased ? c.color + '40' : 'rgba(0,240,255,0.08)'}`, borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
                {isPurchased && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${c.color},transparent)` }} />
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span style={{ fontSize: 28 }}>{c.logo}</span>
                      <div>
                        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: '#e8f4ff' }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: '#5a7a9a' }}>{c.fullName}</div>
                      </div>
                      {isPurchased && (
                        <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(29,158,117,0.15)', color: '#1D9E75', fontSize: 10, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>
                          ✓ UNLOCKED
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: '#5a7a9a', marginBottom: 12, fontFamily: 'JetBrains Mono,monospace' }}>
                      {c.test} · {c.students}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {c.highlights.map((h, i) => (
                        <span key={i} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', color: '#8a9ab0', fontSize: 11, fontFamily: 'JetBrains Mono,monospace' }}>
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {isPurchased ? (
                      <button onClick={() => viewPack(c.id)} disabled={loadingContent} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${c.color},${c.color}99)`, color: '#fff', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>
                        {loadingContent && selectedPack === c.id ? 'Loading...' : 'View Pack →'}
                      </button>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>₹199</div>
                        <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', marginBottom: 10 }}>one time</div>
                        <div style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', color: '#3a4a5a', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
                          🔧 Coming Soon
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 24, background: '#070f1f', border: '1px solid rgba(0,240,255,0.06)', borderRadius: 14, padding: 20, textAlign: 'center' }}>
        <div style={{ color: '#5a7a9a', fontSize: 13, lineHeight: 1.7 }}>
          One time purchase · Lifetime access · Updated every 6 months<br />
          <span style={{ color: '#3a4a5a', fontSize: 11, fontFamily: 'JetBrains Mono,monospace' }}>Secure payment via Razorpay</span>
        </div>
      </div>
    </div>
  );
}
