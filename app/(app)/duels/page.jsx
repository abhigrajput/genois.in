'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function DuelsPage() {
  const { token, ready } = useToken();
  const router = useRouter();
  const [duels, setDuels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [challenging, setChallenging] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    loadDuels();
  }, [ready, token]);

  async function loadDuels() {
    try {
      const r = await apiFetch('/api/duels', token);
      setDuels(r.data?.duels || []);
    } catch {}
    setLoading(false);
  }

  async function challenge() {
    if (!email.trim()) { toast.error('Enter opponent email'); return; }
    setChallenging(true);
    try {
      const r = await apiFetch('/api/duels', token, 'POST', { opponentEmail: email });
      toast.success(`Duel sent to ${r.data.opponentName}!`);
      setEmail('');
      setShowChallenge(false);
      loadDuels();
    } catch (e) { toast.error(e.message); }
    setChallenging(false);
  }

  async function accept(duelId) {
    try {
      await apiFetch(`/api/duels/${duelId}`, token, 'POST', { action: 'accept' });
      router.push(`/duels/${duelId}`);
    } catch (e) { toast.error(e.message); }
  }

  const statusColor = (s) => s === 'completed' ? '#1D9E75' : s === 'active' ? '#00f0ff' : '#EF9F27';
  const statusLabel = (s) => s === 'completed' ? 'DONE' : s === 'active' ? 'LIVE' : 'PENDING';

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 4 }}>⚔️ Duels</h1>
          <p style={{ color: '#5a7a9a', fontSize: 13 }}>Challenge a batchmate. 10 questions. Winner gets 50 points.</p>
        </div>
        <button onClick={() => setShowChallenge(true)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#ff2d78,#EF9F27)', color: '#fff', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>
          ⚔️ Challenge Someone
        </button>
      </div>

      {showChallenge && (
        <div style={{ background: '#070f1f', border: '1px solid rgba(255,45,120,0.3)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ff2d78', letterSpacing: 2, marginBottom: 12 }}>NEW CHALLENGE</div>
          <div style={{ fontSize: 13, color: '#5a7a9a', marginBottom: 16 }}>Enter your opponent&apos;s GENOIS email address.</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="batchmate@email.com" style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8e8ed', fontSize: 13, outline: 'none' }} onKeyDown={e => e.key === 'Enter' && challenge()} />
            <button onClick={challenge} disabled={challenging} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: challenging ? 'rgba(255,45,120,0.3)' : '#ff2d78', color: '#fff', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>
              {challenging ? 'Sending...' : 'Send Challenge →'}
            </button>
            <button onClick={() => setShowChallenge(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontSize: 13 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: '#5a7a9a', textAlign: 'center', padding: 40, fontFamily: 'var(--font-mono)' }}>Loading duels...</div>
      ) : duels.length === 0 ? (
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚔️</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: '#e8e8ed', marginBottom: 8 }}>No duels yet</div>
          <div style={{ color: '#5a7a9a', fontSize: 14 }}>Challenge a batchmate and prove who is better.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* ...duels render */}
          {duels.map((d, i) => (
            <div key={i} style={{ background: '#070f1f', border: `1px solid ${statusColor(d.status)}20`, borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${statusColor(d.status)},transparent)` }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#e8e8ed' }}>
                      {d.isChallenger ? 'You' : d.opponentName} vs {d.isChallenger ? d.opponentName : 'You'}
                    </span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${statusColor(d.status)}15`, color: statusColor(d.status), fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {statusLabel(d.status)}
                    </span>
                    {!d.isChallenger && d.status === 'pending' && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,45,120,0.15)', color: '#ff2d78', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        ⚔️ CHALLENGE RECEIVED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>
                    {d.opponentCollege || 'Unknown College'} · {d.domain_slug?.toUpperCase()}
                  </div>
                  {d.status === 'completed' && (
                    <div style={{ fontSize: 13, color: '#e8e8ed', marginTop: 8 }}>
                      Score: <span style={{ color: '#00f0ff', fontWeight: 700 }}>{d.myScore}</span> vs <span style={{ color: '#ff2d78' }}>{d.theirScore}</span>
                      {d.winner_id ? (d.winner_id === d.challenger_id) === d.isChallenger
                        ? <span style={{ color: '#1D9E75', fontWeight: 700, marginLeft: 8 }}>🏆 You won!</span>
                        : <span style={{ color: '#ff2d78', fontWeight: 700, marginLeft: 8 }}>You lost</span>
                        : <span style={{ color: '#EF9F27', fontWeight: 700, marginLeft: 8 }}>Draw!</span>}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!d.isChallenger && d.status === 'pending' && (
                    <button onClick={() => accept(d.id)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#ff2d78', color: '#fff', fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700 }}>
                      Accept ⚔️
                    </button>
                  )}
                  {d.status === 'active' && !d.iFinished && (
                    <button onClick={() => router.push(`/duels/${d.id}`)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#00f0ff', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700 }}>
                      Fight Now →
                    </button>
                  )}
                  {d.status === 'active' && d.iFinished && !d.theyFinished && (
                    <span style={{ fontSize: 12, color: '#EF9F27', fontFamily: 'var(--font-mono)', padding: '8px 0' }}>Waiting for opponent...</span>
                  )}
                  {d.status === 'completed' && (
                    <button onClick={() => router.push(`/duels/${d.id}`)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.2)', background: 'transparent', color: '#00f0ff', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 12 }}>
                      View Results
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
