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
  arrays: '#00f0ff', strings: '#7b5cff', linkedlist: '#1d9e75',
  trees: '#ef9f27', graphs: '#ff2d78', dp: '#a855f7',
  greedy: '#f59e0b', sorting: '#06b6d4', searching: '#10b981',
  backtracking: '#ec4899', heap: '#f97316', trie: '#8b5cf6',
  'system-design': '#64748b', other: '#6b7280'
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

  // Authentication check for creator link in header
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    setHasToken(!!localStorage.getItem('genois_token'));
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
    <div style={{ minHeight: '100vh', background: '#020812', color: '#e8f4ff', position: 'relative', overflowX: 'hidden' }}>
      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(0,240,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.02) 1px,transparent 1px)',
        backgroundSize: '60px 60px',
      }}/>

      {/* Public Header */}
      <header style={{
        height: '60px',
        borderBottom: '1px solid rgba(0,240,255,0.1)',
        backdropFilter: 'blur(20px)',
        background: 'rgba(6,15,30,0.85)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', fontFamily: 'Syne,sans-serif', fontSize: '22px', fontWeight: 800 }}>
            <span style={{ color: '#00f0ff' }}>GEN</span><span style={{ color: '#e8f4ff' }}>OIS</span>
            <span style={{ fontSize: '12px', color: '#7b5cff', marginLeft: '6px', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '1px', fontWeight: 'bold' }}>BLOG</span>
          </Link>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link href="/dsa-visualizer" style={{ textDecoration: 'none', color: '#5a7a9a', fontSize: '13px', fontFamily: 'Syne,sans-serif', fontWeight: 600, transition: 'color 0.15s' }} onMouseOver={(e) => e.target.style.color = '#00f0ff'} onMouseOut={(e) => e.target.style.color = '#5a7a9a'}>
              💻 Visualizer
            </Link>
            {hasToken ? (
              <Link href="/author/dashboard" style={{ textDecoration: 'none', color: '#ef9f27', background: 'rgba(239,159,39,0.08)', border: '1px solid rgba(239,159,39,0.2)', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontFamily: 'Syne,sans-serif', fontWeight: 700, transition: 'all 0.2s' }} onMouseOver={(e) => { e.target.style.background = 'rgba(239,159,39,0.15)'; e.target.style.transform = 'translateY(-1px)'; }} onMouseOut={(e) => { e.target.style.background = 'rgba(239,159,39,0.08)'; e.target.style.transform = 'translateY(0)'; }}>
                ✍️ Write Articles
              </Link>
            ) : (
              <Link href="/login" style={{ textDecoration: 'none', color: '#020812', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontFamily: 'Syne,sans-serif', fontWeight: 700, transition: 'transform 0.15s' }} onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'} onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}>
                🔑 Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1, fontFamily: 'Outfit,sans-serif' }}>
        
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: '42px', fontWeight: 800, color: '#e8f4ff', margin: '0 0 12px 0', letterSpacing: '-1px' }}>
            DSA Blog <span style={{ color: '#00f0ff' }}>— Learn with Examples</span>
          </h1>
          <p style={{ color: '#8a9ab0', fontSize: '15px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            Step-by-step masterclasses on Data Structures and Algorithms. Deep dive into logic, C++ source code implementations, and complexity analyses.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '32px' }}>
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
                  border: '1px solid rgba(0,240,255,0.15)', 
                  borderRadius: '10px', 
                  padding: '12px 16px 12px 40px', 
                  color: '#e8f4ff', 
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
                border: '1px solid rgba(0,240,255,0.15)', 
                borderRadius: '10px', 
                padding: '12px 20px', 
                color: '#e8f4ff', 
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
                background: 'linear-gradient(135deg,#00f0ff,#7b5cff)',
                color: '#020812',
                border: 'none',
                borderRadius: '10px',
                padding: '0 28px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'Syne,sans-serif'
              }}
            >
              Search
            </button>
          </form>

          {/* Topic Pills */}
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono,monospace', color: '#5a7a9a', letterSpacing: '1px', marginBottom: '10px' }}>FILTER BY ALGORITHM TOPIC</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TOPICS.map(topic => {
                const active = activeTopic === topic.value;
                return (
                  <button
                    key={topic.value}
                    onClick={() => { setActiveTopic(topic.value); setPage(1); }}
                    style={{
                      background: active ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? '#00f0ff' : 'rgba(0,240,255,0.15)'}`,
                      borderRadius: '20px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      color: active ? '#00f0ff' : '#8a9ab0',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: 'Outfit,sans-serif'
                    }}
                    onMouseOver={(e) => {
                      if (!active) e.target.style.background = 'rgba(0,240,255,0.05)';
                    }}
                    onMouseOut={(e) => {
                      if (!active) e.target.style.background = 'rgba(255,255,255,0.02)';
                    }}
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
            <div style={{ fontSize: '20px', animation: 'pulse 1.5s infinite', color: '#00f0ff', fontWeight: 'bold' }}>Loading DSA Articles...</div>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#5a7a9a', background: '#070f1f', borderRadius: '16px', border: '1px dashed rgba(0,240,255,0.1)', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <h3 style={{ color: '#e8f4ff', margin: '0 0 8px 0', fontFamily: 'Syne,sans-serif' }}>No Articles Found</h3>
            <p style={{ margin: 0, fontSize: '14px', maxWidth: '360px', textAlign: 'center', lineHeight: 1.5 }}>We couldn't find any published articles matching your topic or search parameters.</p>
          </div>
        ) : (
          <div>
            {/* Posts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
              {posts.map(post => {
                const topicColor = TOPIC_COLORS[post.topic] || '#6b7280';
                const diffColor = DIFFICULTY_COLORS[post.difficulty] || '#1d9e75';

                return (
                  <Link 
                    key={post.id} 
                    href={`/blog/${post.slug}`}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      background: '#070f1f', 
                      border: '1px solid rgba(0,240,255,0.06)', 
                      borderRadius: '16px', 
                      overflow: 'hidden', 
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = 'rgba(0,240,255,0.2)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 240, 255, 0.05)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(0,240,255,0.06)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Cover image wrapper */}
                    <div style={{ height: '180px', width: '100%', overflow: 'hidden', background: '#0a0a0f', position: 'relative' }}>
                      {post.cover_image ? (
                        <img 
                          src={post.cover_image} 
                          alt={post.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${topicColor}10, #0a0a0f)`, fontSize: '48px' }}>
                          📚
                        </div>
                      )}
                      {/* Topic Pill */}
                      <span style={{ 
                        position: 'absolute', 
                        top: '12px', 
                        left: '12px', 
                        fontSize: '9px', 
                        padding: '3px 8px', 
                        borderRadius: '12px', 
                        background: 'rgba(2,8,18,0.85)', 
                        border: `1px solid ${topicColor}`, 
                        color: topicColor, 
                        fontFamily: 'JetBrains Mono,monospace',
                        fontWeight: 'bold',
                        letterSpacing: '0.5px'
                      }}>
                        {post.topic?.toUpperCase()}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      {/* Difficulty & Read Time */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', background: `${diffColor}15`, color: diffColor, fontFamily: 'JetBrains Mono,monospace', fontWeight: 'bold' }}>
                          {post.difficulty?.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '11px', color: '#5a7a9a' }}>⏱ {post.read_time || 5} min read</span>
                      </div>

                      {/* Title */}
                      <h3 style={{ margin: '0 0 8px 0', fontFamily: 'Syne,sans-serif', fontSize: '17px', fontWeight: 700, color: '#e8f4ff', lineHeight: 1.35 }}>
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p style={{ margin: '0 0 16px 0', color: '#8a9ab0', fontSize: '13px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                        {post.excerpt || 'No description provided.'}
                      </p>

                      {/* Footer Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px', fontSize: '11px', color: '#5a7a9a' }}>
                        <span>✍️ {post.authors?.name || 'GENOIS CP Expert'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>👁️ {post.views || 0} views</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,240,255,0.15)',
                    background: page === 1 ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                    color: page === 1 ? '#3a4a5a' : '#00f0ff',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontFamily: 'Syne,sans-serif',
                    fontWeight: 600
                  }}
                >
                  ◀ Previous
                </button>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '13px', color: '#5a7a9a' }}>
                  PAGE <strong style={{ color: '#e8f4ff' }}>{page}</strong> OF <strong style={{ color: '#e8f4ff' }}>{totalPages}</strong>
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,240,255,0.15)',
                    background: page === totalPages ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                    color: page === totalPages ? '#3a4a5a' : '#00f0ff',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontFamily: 'Syne,sans-serif',
                    fontWeight: 600
                  }}
                >
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
