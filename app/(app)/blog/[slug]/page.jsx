'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import MarkdownRenderer from '@/components/blog/MarkdownRenderer';

const TOPIC_COLORS = {
  arrays: '#00d9a3', strings: '#ff6b4a', linkedlist: '#1d9e75',
  trees: '#ef9f27', graphs: '#ff2d78', dp: '#a855f7',
  greedy: '#ffb020', sorting: '#00b389', searching: '#10b981',
  backtracking: '#ec4899', heap: '#f97316', trie: '#8b5cf6',
  'system-design': '#64748b', other: '#6b7280'
};

const DIFFICULTY_COLORS = {
  beginner: '#1d9e75',
  intermediate: '#ef9f27',
  advanced: '#ff2d78'
};

export default function BlogPostDetail({ params }) {
  const { slug } = params;
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [headings, setHeadings] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadPostData();
  }, [slug]);

  const loadPostData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/blog/posts/${slug}`);
      const resData = await res.json();

      if (res.ok && resData.data) {
        const p = resData.data;
        setPost(p);

        const headingsList = [];
        const lines = p.content.split('\n');
        lines.forEach(line => {
          if (line.startsWith('## ')) {
            const text = line.slice(3).trim();
            headingsList.push({ level: 2, text, anchor: encodeURIComponent(text.toLowerCase().replace(/\s+/g, '-')) });
          } else if (line.startsWith('### ')) {
            const text = line.slice(4).trim();
            headingsList.push({ level: 3, text, anchor: encodeURIComponent(text.toLowerCase().replace(/\s+/g, '-')) });
          }
        });
        setHeadings(headingsList);
        fetchRelatedPosts(p.topic, p.id);
      } else {
        setError(true);
      }
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async (topic, currentPostId) => {
    try {
      const res = await fetch(`/api/blog/posts?status=published&topic=${topic}&limit=4`);
      const resData = await res.json();
      if (res.ok && resData.data?.posts) {
        setRelated(resData.data.posts.filter(p => p.id !== currentPostId).slice(0, 3));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyPageLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success('Page link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getTwitterShareLink = () => {
    if (typeof window === 'undefined') return '#';
    const text = `Check out this amazing DSA article on GENOIS: "${post?.title}"`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
  };

  const getLinkedInShareLink = () => {
    if (typeof window === 'undefined') return '#';
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#5a7a9a', fontFamily: 'var(--font-body)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', color: '#00d9a3', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>Analyzing Article Pointers...</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', marginTop: '6px' }}>RETRIEVING DSA EXPLAINERS</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ color: '#5a7a9a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 24px', fontFamily: 'var(--font-body)' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ color: '#e8e8ed', fontFamily: 'var(--font-heading)' }}>Article Not Found</h2>
        <p style={{ margin: '0 0 24px 0', fontSize: '14px' }}>The post you are looking for has either been moved, deleted, or remains a draft.</p>
        <Link href="/blog" style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', textDecoration: 'none', borderRadius: '8px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
          Back to DSA Blog
        </Link>
      </div>
    );
  }

  const topicColor = TOPIC_COLORS[post.topic] || '#6b7280';
  const diffColor = DIFFICULTY_COLORS[post.difficulty] || '#1d9e75';

  return (
    <div style={{ color: '#e8e8ed', position: 'relative', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', gap: '40px', position: 'relative', zIndex: 1 }}>

        {/* Article */}
        <article style={{ flex: 1.5, minWidth: 0, maxWidth: '860px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', background: `${topicColor}15`, color: topicColor, fontFamily: 'var(--font-mono)', fontWeight: 'bold', letterSpacing: '0.5px' }}>
              {post.topic?.toUpperCase()}
            </span>
            <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', background: `${diffColor}15`, color: diffColor, fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
              {post.difficulty?.toUpperCase()}
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '40px', fontWeight: 800, color: '#e8e8ed', margin: '0 0 16px 0', lineHeight: '1.25', letterSpacing: '-1px' }}>
            {post.title}
          </h1>

          {post.excerpt && (
            <p style={{ fontSize: '17px', color: '#8a9ab0', lineHeight: '1.65', margin: '0 0 24px 0', fontFamily: 'var(--font-body)', borderLeft: '4px solid #ff6b4a', paddingLeft: '18px' }}>
              {post.excerpt}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#5a7a9a', marginBottom: '32px', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '12px 0' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontFamily: 'var(--font-heading)' }}>
              {post.authors?.name?.charAt(0) || 'D'}
            </div>
            <div>
              <div style={{ color: '#e8e8ed', fontWeight: 600 }}>{post.authors?.name || 'GENOIS CP Expert'}</div>
              <div style={{ fontSize: '11px', marginTop: '2px' }}>
                {post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Draft'} · ⏱ {post.read_time || 5} min read
              </div>
            </div>
          </div>

          {post.cover_image && (
            <img src={post.cover_image} alt={post.title} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '16px', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.05)' }} onError={(e) => e.target.style.display = 'none'} />
          )}

          <div className="blog-post-content" style={{ fontSize: '16px', color: '#c9d1d9', fontFamily: 'var(--font-body)' }}>
            <MarkdownRenderer content={post.content} />
          </div>

          {post.cpp_code && (
            <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00d9a3', fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700 }}>
                  <span>{'{ }'}</span> C++ Implementation
                </div>
                <a href={`https://godbolt.org/?code=${encodeURIComponent(post.cpp_code)}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', fontSize: '12px', color: '#ff6b4a', background: 'rgba(255,107,74,0.08)', border: '1px solid rgba(255,107,74,0.25)', padding: '6px 14px', borderRadius: '8px', fontFamily: 'var(--font-heading)', fontWeight: 600, transition: 'all 0.15s' }} onMouseOver={(e) => e.target.style.background = 'rgba(255,107,74,0.15)'} onMouseOut={(e) => e.target.style.background = 'rgba(255,107,74,0.08)'}>
                  ⚡ Run on Compiler Explorer
                </a>
              </div>
              <MarkdownRenderer content={`\`\`\`cpp\n${post.cpp_code}\n\`\`\``} />
            </div>
          )}

          {post.tags && post.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '40px' }}>
              {post.tags.map((tag, idx) => (
                <span key={idx} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#5a7a9a', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '6px' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div style={{ marginTop: '48px', background: '#070f1f', border: '1px solid rgba(0,217,163,0.06)', borderRadius: '16px', padding: '24px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontFamily: 'var(--font-heading)', flexShrink: 0 }}>
              {post.authors?.name?.charAt(0) || 'D'}
            </div>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#5a7a9a', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>AUTHOR PROFILE</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#e8e8ed', marginBottom: '8px' }}>{post.authors?.name || 'GENOIS DSA Instructor'}</div>
              <p style={{ margin: 0, fontSize: '13px', color: '#8a9ab0', lineHeight: '1.6' }}>
                {post.authors?.bio || 'Senior DSA instructor with expertise in competitive programming, algorithms, and technical interview preparation.'}
              </p>
            </div>
          </div>
        </article>

        {/* Sidebar: TOC + Share + Related */}
        <aside style={{ flex: 0.6, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '24px', height: 'fit-content', position: 'sticky', top: '24px' }}>
          {headings.length > 0 && (
            <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.06)', borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#5a7a9a', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 'bold' }}>TABLE OF CONTENTS</div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {headings.map((h, idx) => (
                  <a key={idx} href={`#${h.anchor}`} style={{ textDecoration: 'none', fontSize: h.level === 2 ? '13px' : '12px', color: h.level === 2 ? '#8a9ab0' : '#5a7a9a', paddingLeft: h.level === 3 ? '12px' : '0px', transition: 'color 0.15s', lineHeight: '1.4' }} onMouseOver={(e) => e.target.style.color = '#00d9a3'} onMouseOut={(e) => e.target.style.color = h.level === 2 ? '#8a9ab0' : '#5a7a9a'}>
                    {h.level === 3 && <span style={{ color: '#00d9a3', opacity: 0.5, marginRight: '4px' }}>└</span>}
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          )}

          <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.06)', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#5a7a9a', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 'bold' }}>SHARE ARTICLE</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a href={getTwitterShareLink()} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e8e8ed', fontSize: '13px', fontFamily: 'var(--font-heading)', fontWeight: 600, transition: 'all 0.15s' }} onMouseOver={(e) => { e.target.style.background = '#1da1f2'; e.target.style.borderColor = '#1da1f2'; }} onMouseOut={(e) => { e.target.style.background = 'rgba(255,255,255,0.02)'; e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                𝕏 Share
              </a>
              <a href={getLinkedInShareLink()} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e8e8ed', fontSize: '13px', fontFamily: 'var(--font-heading)', fontWeight: 600, transition: 'all 0.15s' }} onMouseOver={(e) => { e.target.style.background = '#0077b5'; e.target.style.borderColor = '#0077b5'; }} onMouseOut={(e) => { e.target.style.background = 'rgba(255,255,255,0.02)'; e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                💼 Link
              </a>
              <button onClick={copyPageLink} style={{ flex: 1, background: copiedLink ? 'rgba(29,158,117,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${copiedLink ? '#1d9e75' : 'rgba(255,255,255,0.08)'}`, borderRadius: '8px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copiedLink ? '#1d9e75' : '#00d9a3', fontSize: '13px', fontFamily: 'var(--font-heading)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                {copiedLink ? '✓ Copied' : '🔗 Copy'}
              </button>
            </div>
          </div>

          {related.length > 0 && (
            <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.06)', borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#5a7a9a', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px', fontWeight: 'bold' }}>RELATED ARTICLES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {related.map(p => (
                  <Link key={p.id} href={`/blog/${p.slug}`} style={{ textDecoration: 'none', display: 'block', transition: 'transform 0.15s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#e8e8ed', lineHeight: '1.3', marginBottom: '4px' }}>{p.title}</div>
                    <div style={{ display: 'flex', gap: '6px', fontSize: '10px', color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>
                      <span>⏱ {p.read_time} min</span>
                      <span>·</span>
                      <span style={{ color: DIFFICULTY_COLORS[p.difficulty] }}>{p.difficulty?.toUpperCase()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
