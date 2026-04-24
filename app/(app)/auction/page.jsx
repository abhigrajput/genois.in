'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function AuctionPage() {
  const { token, ready } = useToken();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minBid, setMinBid] = useState(500000); // 5LPA base
  const [listing, setListing] = useState(false);
  
  // Recruiter modal state
  const [bidModal, setBidModal] = useState(null);
  const [recruiterForm, setRecruiterForm] = useState({ name: '', company: '', email: '', bid: 0, message: '' });
  const [bidding, setBidding] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    loadData();
  }, [ready, token]);

  async function loadData() {
    setLoading(true);
    apiFetch('/api/auction', token).then(r => {
      setData(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  async function listMyself() {
    setListing(true);
    try {
      await apiFetch('/api/auction', token, 'POST', { minBid });
      toast.success('You have entered the auction! 🚀');
      loadData();
    } catch (e) {
      toast.error(e.message);
    }
    setListing(false);
  }

  async function placeBid() {
    if (!recruiterForm.company || !recruiterForm.bid) return toast.error('Fill required fields');
    if (recruiterForm.bid <= bidModal.current_bid) return toast.error('Bid must be higher than ' + bidModal.current_bid);
    setBidding(true);
    try {
      await apiFetch('/api/auction/bid', token, 'POST', {
        auctionId: bidModal.id,
        recruiterName: recruiterForm.name,
        recruiterCompany: recruiterForm.company,
        recruiterEmail: recruiterForm.email,
        bidAmount: parseInt(recruiterForm.bid),
        message: recruiterForm.message,
      });
      toast.success('Bid successfully placed! 🔥');
      setBidModal(null);
      loadData();
    } catch (e) {
      toast.error(e.message);
    }
    setBidding(false);
  }

  if (loading) return <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace' }}>Loading Auction Block...</div>;

  const { auctions = [], myAuction, myScore } = data || {};
  const isEligible = myScore >= 1500;

  return (
    <div style={{ width: '100%', fontFamily: 'Outfit,sans-serif' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 32, fontWeight: 800, color: '#EF9F27', textTransform: 'uppercase', letterSpacing: '-1px', marginBottom: 6 }}>
          ⚡ Skill Auction Block
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 14 }}>
          Recruiters bid on top-percentile GENOIS engineers. Only 1500+ pt engineers make the cut.
        </p>
      </div>

      {!myAuction && (
        <div style={{ background: '#070f1f', border: '1px solid rgba(239,159,39,0.2)', borderRadius: 16, padding: '32px', marginBottom: 32, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#EF9F27', letterSpacing: 2, marginBottom: 8 }}>YOUR STATUS</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 8 }}>
              {isEligible ? 'You are eligible.' : 'Not eligible yet.'}
            </div>
            <p style={{ color: '#8a9ab0', fontSize: 13, lineHeight: 1.6 }}>
              {isEligible 
                ? 'Your score is high enough to enter the auction block. Set your minimum base CTC and let companies bid.' 
                : `You need 1500 pts. You currently have ${myScore} pts. Grind harder.`}
            </p>
          </div>
          {isEligible && (
            <div style={{ background: 'rgba(239,159,39,0.05)', padding: '20px', borderRadius: 12, border: '1px solid rgba(239,159,39,0.1)', width: 280 }}>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', marginBottom: 6 }}>MINIMUM BASE CTC (₹)</div>
              <input type="number" value={minBid} onChange={e => setMinBid(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid rgba(239,159,39,0.3)', background: 'transparent', color: '#EF9F27', fontSize: 16, fontFamily: 'JetBrains Mono,monospace', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
              <button disabled={listing} onClick={listMyself} style={{ width: '100%', padding: '12px', background: '#EF9F27', color: '#020812', border: 'none', borderRadius: 8, fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {listing ? 'Listing...' : 'List Myself →'}
              </button>
            </div>
          )}
        </div>
      )}

      {myAuction && (
        <div style={{ background: 'linear-gradient(135deg,rgba(239,159,39,0.1),rgba(0,0,0,0))', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 16, padding: '24px', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#EF9F27', letterSpacing: 2, marginBottom: 4 }}>YOU ARE ON THE BLOCK</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 32, fontWeight: 800, color: '#e8f4ff' }}>₹{myAuction.current_bid.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 12, color: '#5a7a9a', marginTop: 4 }}>Highest Bid ({myAuction.bid_count} total bids)</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ padding: '6px 14px', background: 'rgba(29,158,117,0.15)', color: '#1D9E75', borderRadius: 20, fontSize: 12, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      )}

      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#5a7a9a', letterSpacing: 2, marginBottom: 16 }}>LIVE AUCTIONS ({auctions.length})</div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {auctions.map(a => (
          <div key={a.id} style={{ background: '#070f1f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '20px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: '#8a9ab0' }}>{a.college}</div>
                <div style={{ fontSize: 11, color: '#00f0ff', fontFamily: 'JetBrains Mono,monospace', marginTop: 4 }}>{a.domain?.toUpperCase()} · {a.score} pts</div>
              </div>
              <div style={{ background: 'rgba(239,159,39,0.1)', color: '#EF9F27', padding: '10px 14px', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800 }}>{Math.round(a.current_bid / 100000)}L</div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, opacity: 0.8 }}>Current Bid</div>
              </div>
            </div>
            
            <button onClick={() => { setBidModal(a); setRecruiterForm({ ...recruiterForm, bid: a.current_bid + 50000 }); }} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8f4ff', borderRadius: 8, cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace', fontSize: 11, transition: 'background 0.2s' }}>
              Place Bid as Recruiter →
            </button>
          </div>
        ))}
      </div>

      {bidModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#0a1628', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 16, padding: '28px', maxWidth: 400, width: '100%' }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>Bid on {bidModal.name}</div>
            <div style={{ fontSize: 12, color: '#5a7a9a', marginBottom: 20 }}>Current highest bid: ₹{bidModal.current_bid.toLocaleString('en-IN')}</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <input placeholder="Recruiter Name" value={recruiterForm.name} onChange={e => setRecruiterForm({...recruiterForm, name: e.target.value})} style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, outline: 'none' }} />
              <input placeholder="Company Name" value={recruiterForm.company} onChange={e => setRecruiterForm({...recruiterForm, company: e.target.value})} style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, outline: 'none' }} />
              <input placeholder="Work Email" value={recruiterForm.email} onChange={e => setRecruiterForm({...recruiterForm, email: e.target.value})} style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, outline: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 8, padding: '0 12px' }}>
                <span style={{ color: '#EF9F27', fontFamily: 'JetBrains Mono,monospace' }}>₹</span>
                <input type="number" value={recruiterForm.bid} onChange={e => setRecruiterForm({...recruiterForm, bid: parseInt(e.target.value) || 0})} placeholder="Bid Amount" style={{ flex: 1, padding: '12px 0', background: 'transparent', border: 'none', color: '#EF9F27', fontFamily: 'JetBrains Mono,monospace', fontSize: 16, outline: 'none' }} />
              </div>
              <textarea placeholder="Message to candidate (optional)" value={recruiterForm.message} onChange={e => setRecruiterForm({...recruiterForm, message: e.target.value})} style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, outline: 'none', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button disabled={bidding} onClick={() => setBidModal(null)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#5a7a9a', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button disabled={bidding} onClick={placeBid} style={{ flex: 2, padding: '12px', background: '#EF9F27', border: 'none', color: '#020812', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>{bidding ? 'Placing Bid...' : 'Place Bid ⚡'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
