'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const TOPICS = [
  { value: 'all', label: '📖 All Topics' },
  { value: 'arrays', label: '🔢 Arrays' },
  { value: 'strings', label: '🔤 Strings' },
  { value: 'linkedlist', label: '🔗 Linked List' },
  { value: 'trees', label: '🌳 Trees' },
  { value: 'graphs', label: '🕸️ Graphs' },
  { value: 'dp', label: '🧠 DP' },
  { value: 'greedy', label: '💰 Greedy' },
  { value: 'sorting', label: '📊 Sorting' },
  { value: 'searching', label: '🔍 Searching' },
  { value: 'backtracking', label: '🔄 Backtracking' },
  { value: 'heap', label: '🥞 Heap' },
  { value: 'trie', label: '🌲 Trie' },
  { value: 'system-design', label: '🏗️ System Design' },
  { value: 'other', label: '📦 Other' }
];

const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'All Difficulties' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

const TOPIC_COLORS = {
  arrays: '#90dfab', strings: '#1aa275', linkedlist: '#9eedc8',
  trees: '#14b85b', graphs: '#bcebc7', dp: '#1fbd83',
  greedy: '#86e9c8', sorting: '#13aa3b', searching: '#a6e5c1',
  backtracking: '#1daf4e', heap: '#b6f2dc', trie: '#16c573',
  'system-design': '#90dfa5', other: '#1aa23a'
};

const DIFFICULTY_COLORS = {
  beginner: '#1d9e75',
  intermediate: '#ef9f27',
  advanced: '#ff2d78'
};

export default function BlogIndex() {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTopic, setActiveTopic] = useState('all');
  const [activeDifficulty, setActiveDifficulty] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAuthor, setIsAuthor] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('genois_token');
    if (token) {
      fetch('/api/blog/author', { headers: { Authorization: 'Bearer ' + token } })
        .then(r => r.json())
        .then(d => { if (d.data?.isAuthor) setIsAuthor(true); })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [activeTopic, activeDifficulty, page]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        status: 'published',
        topic: activeTopic,
        difficulty: activeDifficulty,
        search: search.trim(),
        page: page.toString(),
        limit: '9'
      });

      const res = await fetch(`/api/blog/posts?${queryParams}`);
      const resData = await res.json();

      if (res.ok && resData.data) {
        setPosts(resData.data.posts);
        setTotal(resData.data.total);
        setTotalPages(resData.data.totalPages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  return (
    <div style={{ color: '#e8e8ed', position: 'relative', overflowX: 'hidden' }}>
      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(0,217,163,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,217,163,0.02) 1px,transparent 1px)',
        backgroundSize: '60px 60px',
      }}/>

      <main style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1, fontFamily: 'var(--font-body)' }}>

        {/* Hero Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', fontWeight: 800, color: '#e8e8ed', margin: '0 0 8px 0', letterSpacing: '-1px' }}>
              DSA Blog <span style={{ color: '#00d9a3' }}>— Learn with Examples</span>
            </h1>
            <p style={{ color: '#8a9ab0', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              Step-by-step masterclasses on Data Structures and Algorithms.
            </p>
          </div>
          {isAuthor && (
            <Link href="/author/dashboard" style={{ textDecoration: 'none', color: '#ef9f27', background: 'rgba(239,159,39,0.08)', border: '1px solid rgba(239,159,39,0.2)', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
              ✍️ Write Articles
            </Link>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '32px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search DSA topics, code, or tutorials..."
                style={{
                  width: '100%',
                  background: '#020812',
                  border: '1px solid rgba(0,217,163,0.15)',
                  borderRadius: '10px',
                  padding: '12px 16px 12px 40px',
                  color: '#e8e8ed',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ position: 'absolute', left: '16px', top: '13px', color: '#5a7a9a', fontSize: '16px' }}>🔍</span>
            </div>

            <select
              value={activeDifficulty}
              onChange={(e) => { setActiveDifficulty(e.target.value); setPage(1); }}
              style={{
                background: '#020812',
                border: '1px solid rgba(0,217,163,0.15)',
                borderRadius: '10px',
                padding: '12px 20px',
                color: '#e8e8ed',
                outline: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                minWidth: '160px'
              }}
            >
              {DIFFICULTY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} style={{ background: '#070f1f' }}>{opt.label}</option>
              ))}
            </select>

            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)',
                color: '#020812',
                border: 'none',
                borderRadius: '10px',
                padding: '0 28px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'var(--font-heading)'
              }}
            >
              Search
            </button>
          </form>

          {/* Topic Pills */}
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#5a7a9a', letterSpacing: '1px', marginBottom: '10px' }}>FILTER BY ALGORITHM TOPIC</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TOPICS.map(topic => {
                const active = activeTopic === topic.value;
                return (
                  <button
                    key={topic.value}
                    onClick={() => { setActiveTopic(topic.value); setPage(1); }}
                    style={{
                      background: active ? 'rgba(0,217,163,0.12)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? '#00d9a3' : 'rgba(0,217,163,0.15)'}`,
                      borderRadius: '20px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      color: active ? '#00d9a3' : '#8a9ab0',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: 'var(--font-body)'
                    }}
                    onMouseOver={(e) => { if (!active) e.target.style.background = 'rgba(0,217,163,0.05)'; }}
                    onMouseOut={(e) => { if (!active) e.target.style.background = 'rgba(255,255,255,0.02)'; }}
                  >
                    {topic.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Loading / Results Grid */}
        {loading ? (
          <div style={{ minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#5a7a9a' }}>
            <div style={{ fontSize: '20px', animation: 'pulse 1.5s infinite', color: '#00d9a3', fontWeight: 'bold' }}>Loading DSA Articles...</div>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#5a7a9a', background: '#070f1f', borderRadius: '16px', border: '1px dashed rgba(0,217,163,0.1)', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <h3 style={{ color: '#e8e8ed', margin: '0 0 8px 0', fontFamily: 'var(--font-heading)' }}>No Articles Found</h3>
            <p style={{ margin: 0, fontSize: '14px', maxWidth: '360px', textAlign: 'center', lineHeight: 1.5 }}>We couldn&apos;t find any published articles matching your topic or search parameters.</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
              {posts.map(post => {
                const topicColor = TOPIC_COLORS[post.topic] || '#6b7280';
                const diffColor = DIFFICULTY_COLORS[post.difficulty] || '#1d9e75';

                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    style={{
                      display: 'flex', flexDirection: 'column',
                      background: '#070f1f', border: '1px solid rgba(0,217,163,0.06)',
                      borderRadius: '16px', overflow: 'hidden', textDecoration: 'none',
                      color: 'inherit', transition: 'all 0.2s ease-in-out'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(0,217,163,0.2)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,217,163,0.05)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(0,217,163,0.06)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ height: '180px', width: '100%', overflow: 'hidden', background: '#0a0a0f', position: 'relative' }}>
                      {post.cover_image ? (
                        <img src={post.cover_image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${topicColor}10, #0a0a0f)`, fontSize: '48px' }}>📚</div>
                      )}
                      <span style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '9px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(2,8,18,0.85)', border: `1px solid ${topicColor}`, color: topicColor, fontFamily: 'var(--font-mono)', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                        {post.topic?.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', background: `${diffColor}15`, color: diffColor, fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                          {post.difficulty?.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '11px', color: '#5a7a9a' }}>⏱ {post.read_time || 5} min read</span>
                      </div>

                      <h3 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700, color: '#e8e8ed', lineHeight: 1.35 }}>
                        {post.title}
                      </h3>

                      <p style={{ margin: '0 0 16px 0', color: '#8a9ab0', fontSize: '13px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                        {post.excerpt || 'No description provided.'}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px', fontSize: '11px', color: '#5a7a9a' }}>
                        <span>✍️ {post.authors?.name || 'GENOIS CP Expert'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>👁️ {post.views || 0} views</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(0,217,163,0.15)', background: page === 1 ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', color: page === 1 ? '#3a4a5a' : '#00d9a3', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                  ◀ Previous
                </button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#5a7a9a' }}>
                  PAGE <strong style={{ color: '#e8e8ed' }}>{page}</strong> OF <strong style={{ color: '#e8e8ed' }}>{totalPages}</strong>
                </span>
                <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(0,217,163,0.15)', background: page === totalPages ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', color: page === totalPages ? '#3a4a5a' : '#00d9a3', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                  Next ▶
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
