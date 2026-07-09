'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

const EXPERTISE_OPTIONS = [
  'Full Stack', 'DSA', 'Machine Learning', 'AI', 'Data Science',
  'Cybersecurity', 'Cloud', 'Mobile Dev', 'DevOps', 'System Design',
  'Resume Review', 'Interview Prep', 'Career Guidance', 'Project Help',
];

export default function MentorsPage() {
  const { token, ready } = useToken();
  const [tab, setTab] = useState('find');
  const [mentors, setMentors] = useState([]);
  const [myData, setMyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [booking, setBooking] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState([]);
  const [price, setPrice] = useState(299);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    Promise.all([
      apiFetch('/api/mentors', token),
      apiFetch('/api/mentors/my-bookings', token),
    ]).then(([m, b]) => {
      setMentors(m.data?.mentors || []);
      setMyData(b.data);
      if (b.data?.myProfile) {
        setBio(b.data.myProfile.bio || '');
        setExpertise(b.data.myProfile.expertise || []);
        setPrice(b.data.myProfile.price || 299);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [ready, token]);

  async function saveProfile() {
    if (!bio.trim()) { toast.error('Write a bio'); return; }
    if (expertise.length === 0) { toast.error('Select at least one expertise'); return; }
    setSavingProfile(true);
    try {
      await apiFetch('/api/mentors', token, 'POST', { bio, expertise, price });
      toast.success('Mentor profile saved!');
      const b = await apiFetch('/api/mentors/my-bookings', token);
      setMyData(b.data);
    } catch (e) { toast.error(e.message); }
    setSavingProfile(false);
  }

  const domainColors = { cloud: '#378ADD', fullstack: '#7F77DD', dsa: '#1D9E75', ml: '#D85A30', ai: '#BA7517', ds: '#378ADD', cybersec: '#D4537E', mobile: '#E24B4A', devops: '#888780', sysdesign: '#534AB7' };

  if (loading) return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>Loading...</div>
  );

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 4 }}>
          🎓 1-on-1 Mentor Booking
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 13 }}>
          Book a session with a top ranked GENOIS student. ₹299 per hour. 20% goes to platform.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { key: 'find', label: '🔍 Find a Mentor' },
          { key: 'bookings', label: '📅 My Bookings' },
          { key: 'become', label: '⭐ Become a Mentor' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 600,
            background: tab === t.key ? '#00f0ff' : 'rgba(255,255,255,0.05)',
            color: tab === t.key ? '#020812' : '#5a7a9a',
          }}>{t.label}</button>
        ))}
      </div>

      {/* FIND MENTOR TAB */}
      {tab === 'find' && (
        <div>
          {mentors.length === 0 ? (
            <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14, padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: '#e8e8ed', marginBottom: 8 }}>No mentors yet</div>
              <div style={{ color: '#5a7a9a', fontSize: 14, marginBottom: 20 }}>Be the first mentor. Earn money helping others.</div>
              <button onClick={() => setTab('become')} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>
                Become a Mentor →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mentors.map((m, i) => {
                const color = domainColors[m.domain?.toLowerCase()] || '#00f0ff';
                return (
                  <div key={i} style={{ background: '#070f1f', border: `1px solid ${color}20`, borderRadius: 14, padding: 24, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: '#e8e8ed' }}>{m.name}</div>
                          <span style={{ padding: '2px 8px', borderRadius: 20, background: `${color}15`, color, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                            {m.domain?.toUpperCase()}
                          </span>
                          <span style={{ padding: '2px 8px', borderRadius: 20, background: 'rgba(0,240,255,0.08)', color: '#00f0ff', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                            Rank #{m.rank}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: '#5a7a9a', marginBottom: 10 }}>{m.college}</div>
                        {m.bio && <div style={{ fontSize: 14, color: '#8a9ab0', lineHeight: 1.6, marginBottom: 12 }}>{m.bio}</div>}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                          {(m.expertise || []).map((e, ei) => (
                            <span key={ei} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', color: '#8a9ab0', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{e}</span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>
                          <span>⭐ {m.rating > 0 ? m.rating.toFixed(1) : 'New'}</span>
                          <span>📅 {m.total_sessions} sessions</span>
                          <span>💯 {m.score} pts</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 2 }}>₹{m.price}</div>
                        <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>per hour</div>
                        <button onClick={() => setSelectedMentor(m)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${color},${color}99)`, color: '#fff', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>
                          Book Now →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedMentor && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: '#e8e8ed', marginBottom: 4 }}>
                  Book session with {selectedMentor.name}
                </div>
                <div style={{ fontSize: 13, color: '#5a7a9a', marginBottom: 20 }}>₹{selectedMentor.price} · 1 hour</div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>PREFERRED DATE AND TIME</div>
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8e8ed', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>WHAT DO YOU WANT HELP WITH</div>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. I need help with DSA interview prep, specifically trees and graphs..." rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8e8ed', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setSelectedMentor(null); setScheduledAt(''); setNotes(''); }} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13 }}>
                    Cancel
                  </button>
                  <div style={{ flex: 2, padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', color: '#3a4a5a', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
                    🔧 Coming Soon
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MY BOOKINGS TAB */}
      {tab === 'bookings' && (
        <div>
          {myData?.asStudent?.length === 0 && myData?.asMentor?.length === 0 ? (
            <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14, padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: '#e8e8ed', marginBottom: 8 }}>No bookings yet</div>
              <div style={{ color: '#5a7a9a', fontSize: 14 }}>Book a session with a mentor to get started.</div>
            </div>
          ) : (
            <div>
              {myData?.asStudent?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 14 }}>SESSIONS I BOOKED</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {myData.asStudent.map((b, i) => (
                      <div key={i} style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8ed', marginBottom: 3 }}>Session #{i + 1}</div>
                          <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>
                            {b.scheduled_at ? new Date(b.scheduled_at).toLocaleDateString('en-IN') : 'Not scheduled'} · ₹{b.amount}
                          </div>
                          {b.notes && <div style={{ fontSize: 12, color: '#8a9ab0', marginTop: 4 }}>{b.notes.substring(0, 60)}...</div>}
                        </div>
                        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, background: b.status === 'confirmed' ? 'rgba(29,158,117,0.15)' : 'rgba(255,255,255,0.05)', color: b.status === 'confirmed' ? '#1D9E75' : '#5a7a9a' }}>
                          {b.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {myData?.asMentor?.length > 0 && (
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 14 }}>STUDENTS WHO BOOKED ME</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {myData.asMentor.map((b, i) => (
                      <div key={i} style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8ed', marginBottom: 3 }}>Student Booking #{i + 1}</div>
                          <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>
                            {b.scheduled_at ? new Date(b.scheduled_at).toLocaleDateString('en-IN') : 'Not scheduled'} · You earn ₹{Math.round(b.amount * 0.8)}
                          </div>
                          {b.notes && <div style={{ fontSize: 12, color: '#8a9ab0', marginTop: 4 }}>{b.notes.substring(0, 60)}...</div>}
                        </div>
                        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, background: 'rgba(29,158,117,0.15)', color: '#1D9E75' }}>
                          {b.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* BECOME MENTOR TAB */}
      {tab === 'become' && (
        <div>
          {!myData?.canBeMentor ? (
            <div style={{ background: '#070f1f', border: '1px solid rgba(239,159,39,0.2)', borderRadius: 14, padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: '#e8e8ed', marginBottom: 8 }}>
                Mentor Access unlocks at 500 pts
              </div>
              <div style={{ color: '#5a7a9a', fontSize: 14, marginBottom: 8 }}>
                Your score: <span style={{ color: '#00f0ff', fontWeight: 700 }}>{myData?.myScore} pts</span>
              </div>
              <div style={{ color: '#5a7a9a', fontSize: 14 }}>
                {500 - (myData?.myScore || 0)} more points needed to offer mentorship.
              </div>
            </div>
          ) : (
            <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.12)', borderRadius: 14, padding: 28 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00f0ff', letterSpacing: 2, marginBottom: 20 }}>
                {myData?.myProfile ? 'UPDATE YOUR MENTOR PROFILE' : 'CREATE YOUR MENTOR PROFILE'}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>YOUR BIO</div>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell students what you can help them with. Your experience, what you have built, what you know..." rows={4} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.02)', color: '#e8e8ed', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>YOUR EXPERTISE (select all that apply)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {EXPERTISE_OPTIONS.map(e => (
                    <button key={e} onClick={() => setExpertise(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${expertise.includes(e) ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.08)'}`, background: expertise.includes(e) ? 'rgba(0,240,255,0.08)' : 'transparent', color: expertise.includes(e) ? '#00f0ff' : '#5a7a9a', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>YOUR PRICE PER HOUR (₹)</div>
                <input type="number" value={price} onChange={e => setPrice(parseInt(e.target.value) || 299)} min={199} max={999} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8e8ed', fontSize: 14, outline: 'none', width: 160 }} />
                <div style={{ fontSize: 11, color: '#3a4a5a', fontFamily: 'var(--font-mono)', marginTop: 6 }}>
                  You earn ₹{Math.round(price * 0.8)} per session (GENOIS takes 20%)
                </div>
              </div>

              <button onClick={saveProfile} disabled={savingProfile} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: savingProfile ? 'rgba(0,240,255,0.2)' : 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700 }}>
                {savingProfile ? 'Saving...' : myData?.myProfile ? 'Update Profile' : 'Start Mentoring →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
