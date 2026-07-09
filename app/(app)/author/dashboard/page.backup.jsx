'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

const TOPIC_COLORS = {
  arrays: '#00f0ff', strings: '#ff6b4a', linkedlist: '#1d9e75',
  trees: '#ef9f27', graphs: '#ff2d78', dp: '#a855f7',
  greedy: '#ffb020', sorting: '#06b6d4', searching: '#10b981',
  backtracking: '#ec4899', heap: '#f97316', trie: '#8b5cf6',
  'system-design': '#64748b', other: '#6b7280'
};

const DIFFICULTY_COLORS = {
  beginner: '#1d9e75',
  intermediate: '#ef9f27', 
  advanced: '#ff2d78'
};

export default function AuthorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthor, setIsAuthor] = useState(false);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    views: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('genois_token');
    if (!token) {
      router.push('/login');
      return;
    }
    checkAuthorAndLoadData(token);
  }, []);

  const checkAuthorAndLoadData = async (token) => {
    setLoading(true);
    try {
      // 1. Check Author Profile
      const authorRes = await fetch('/api/blog/author', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const authorData = await authorRes.json();

      if (!authorRes.ok || !authorData.data?.isAuthor) {
        setIsAuthor(false);
        setLoading(false);
        return;
      }

      setIsAuthor(true);
      setAuthorProfile(authorData.data.author);

      // 2. Fetch Author's Posts (using status=all so drafts are included)
      const postsRes = await fetch(`/api/blog/posts?status=all&authorId=${authorData.data.author.id}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const postsData = await postsRes.json();

      if (postsRes.ok && postsData.data?.posts) {
        const fetchedPosts = postsData.data.posts;
        setPosts(fetchedPosts);
        
        // Calculate Statistics
        const total = fetchedPosts.length;
        const published = fetchedPosts.filter(p => p.status === 'published').length;
        const drafts = total - published;
        const views = fetchedPosts.reduce((acc, p) => acc + (p.views || 0), 0);

        setStats({ total, published, drafts, views });
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load author dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (post) => {
    const token = localStorage.getItem('genois_token');
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const actionText = newStatus === 'published' ? 'publishing...' : 'unpublishing...';

    const loadingToast = toast.loading(`${post.title} is ${actionText}`);
    try {
      const res = await fetch(`/api/blog/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...post,
          status: newStatus
        })
      });
      
      const resData = await res.json();
      toast.dismiss(loadingToast);

      if (res.ok) {
        toast.success(`Post ${newStatus === 'published' ? 'published' : 'saved to draft'} successfully!`);
        checkAuthorAndLoadData(token);
      } else {
        toast.error(resData.message || 'Action failed');
      }
    } catch (e) {
      toast.dismiss(loadingToast);
      console.error(e);
      toast.error('An error occurred');
    }
  };

  const handleDeletePost = async (postId, postTitle) => {
    if (!confirm(`Are you absolutely sure you want to delete "${postTitle}"? This cannot be undone.`)) {
      return;
    }

    const token = localStorage.getItem('genois_token');
    const loadingToast = toast.loading(`Deleting "${postTitle}"...`);
    
    try {
      const res = await fetch(`/api/blog/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const resData = await res.json();
      toast.dismiss(loadingToast);

      if (res.ok) {
        toast.success('Post deleted successfully');
        checkAuthorAndLoadData(token);
      } else {
        toast.error(resData.message || 'Failed to delete post');
      }
    } catch (e) {
      toast.dismiss(loadingToast);
      console.error(e);
      toast.error('An error occurred');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#5a7a9a', fontFamily: 'var(--font-body)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00f0ff', marginBottom: '8px', animation: 'pulse 1.5s infinite' }}>Loading dashboard...</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>VERIFYING AUTHOR ROLE</div>
        </div>
      </div>
    );
  }

  // Not an Author View
  if (!isAuthor) {
    return (
      <div style={{ maxWidth: '640px', margin: '60px auto', textAlign: 'center', padding: '40px', background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: '16px', fontFamily: 'var(--font-body)' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>✍️</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 800, color: '#e8e8ed', marginBottom: '16px' }}>Become a GENOIS DSA Author</h1>
        <p style={{ color: '#8a9ab0', fontSize: '14px', lineHeight: 1.7, marginBottom: '32px' }}>
          Share your data structures and algorithms knowledge with thousands of engineers. Create clean explanations, code implementations, and visual illustrations.
        </p>
        <button 
          onClick={() => {
            toast.success('Application submitted! Our curation team will review your profile shortly.');
          }}
          style={{ 
            padding: '14px 32px', 
            borderRadius: '12px', 
            border: 'none', 
            cursor: 'pointer', 
            background: 'linear-gradient(135deg,#00f0ff,#ff6b4a)', 
            color: '#020812', 
            fontFamily: 'var(--font-heading)', 
            fontSize: '15px', 
            fontWeight: 700,
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          Submit Creator Application →
        </button>
      </div>
    );
  }

  // Author Dashboard View
  return (
    <div style={{ fontFamily: 'var(--font-body)', width: '100%' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 800, color: '#e8e8ed', marginBottom: '4px' }}>✍️ Creator Studio</h1>
          <p style={{ color: '#5a7a9a', fontSize: '13px' }}>Welcome back, <strong style={{ color: '#00f0ff' }}>{authorProfile?.name}</strong> · {authorProfile?.role === 'admin' ? 'Administrator' : 'Author'}</p>
        </div>
        <Link 
          href="/author/new-post"
          style={{ 
            padding: '12px 24px', 
            background: 'linear-gradient(135deg,#00f0ff,#ff6b4a)', 
            color: '#020812', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: 700, 
            textDecoration: 'none',
            fontSize: '14px',
            fontFamily: 'var(--font-heading)',
            boxShadow: '0 0 16px rgba(0, 240, 255, 0.15)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'transform 0.15s'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
          📝 Write New Post
        </Link>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Articles', value: stats.total, color: '#ff6b4a', icon: '📝' },
          { label: 'Published Posts', value: stats.published, color: '#1d9e75', icon: '🚀' },
          { label: 'Draft Articles', value: stats.drafts, color: '#ef9f27', icon: '📁' },
          { label: 'Total Views', value: stats.views.toLocaleString(), color: '#00f0ff', icon: '👁️' },
        ].map(s => (
          <div key={s.label} style={{ background: '#070f1f', border: `1px solid rgba(0,240,255,0.08)`, borderLeft: `4px solid ${s.color}`, borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#5a7a9a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: '#e8e8ed' }}>{s.value}</div>
            </div>
            <div style={{ fontSize: '28px', opacity: 0.8 }}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Articles List Table */}
      <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#e8e8ed', margin: 0 }}>Manage DSA Publications</h2>
          <span style={{ fontSize: '12px', color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>{posts.length} POSTS FOUND</span>
        </div>

        {posts.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#5a7a9a' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p style={{ margin: 0, fontSize: '14px' }}>You haven't written any DSA posts yet. Press the button above to draft your first article!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.1)' }}>
                  <th style={{ padding: '14px 24px', fontSize: '11px', color: '#5a7a9a', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>ARTICLE TITLE</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', color: '#5a7a9a', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>TOPIC</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', color: '#5a7a9a', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>DIFFICULTY</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', color: '#5a7a9a', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', color: '#5a7a9a', fontFamily: 'var(--font-mono)', fontWeight: 600, textAlign: 'center' }}>VIEWS</th>
                  <th style={{ padding: '14px 16px', fontSize: '11px', color: '#5a7a9a', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>PUBLISHED</th>
                  <th style={{ padding: '14px 24px', fontSize: '11px', color: '#5a7a9a', fontFamily: 'var(--font-mono)', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => {
                  const topicColor = TOPIC_COLORS[post.topic] || '#6b7280';
                  const diffColor = DIFFICULTY_COLORS[post.difficulty] || '#1d9e75';
                  const isPub = post.status === 'published';

                  return (
                    <tr key={post.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#e8e8ed', marginBottom: '4px' }}>{post.title}</div>
                        <div style={{ fontSize: '11px', color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>/{post.slug}</div>
                      </td>
                      <td style={{ padding: '16px 16px' }}>
                        <span style={{ 
                          fontSize: '10px', 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          background: `${topicColor}15`, 
                          color: topicColor, 
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 'bold',
                          letterSpacing: '0.5px'
                        }}>
                          {post.topic?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '16px 16px' }}>
                        <span style={{ 
                          fontSize: '10px', 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          background: `${diffColor}15`, 
                          color: diffColor, 
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 'bold'
                        }}>
                          {post.difficulty?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPub ? '#1d9e75' : '#ef9f27' }} />
                          <span style={{ fontSize: '12px', color: isPub ? '#1d9e75' : '#ef9f27', fontWeight: 500 }}>
                            {isPub ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 16px', textAnchor: 'middle', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#e8e8ed', fontWeight: 600 }}>
                        {post.views || 0}
                      </td>
                      <td style={{ padding: '16px 16px', color: '#8a9ab0', fontSize: '12px' }}>
                        {post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleTogglePublish(post)}
                            title={isPub ? 'Convert to Draft' : 'Launch Post Live'}
                            style={{
                              background: 'transparent',
                              border: `1px solid ${isPub ? '#ef9f27' : '#1d9e75'}33`,
                              borderRadius: '6px',
                              padding: '5px 10px',
                              color: isPub ? '#ef9f27' : '#1d9e75',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = isPub ? 'rgba(239,159,39,0.08)' : 'rgba(29,158,117,0.08)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = 'transparent';
                            }}
                          >
                            {isPub ? '📁 Unpublish' : '🚀 Publish'}
                          </button>
                          
                          <Link
                            href={`/author/edit-post/${post.id}`}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(0,240,255,0.2)',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              color: '#00f0ff',
                              fontSize: '11px',
                              fontWeight: 600,
                              textDecoration: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              display: 'inline-block'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(0,240,255,0.08)'}
                            onMouseOut={(e) => e.target.style.background = 'transparent'}
                          >
                            📝 Edit
                          </Link>

                          <button
                            onClick={() => handleDeletePost(post.id, post.title)}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(255,45,120,0.15)',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              color: '#ff2d78',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(255,45,120,0.08)'}
                            onMouseOut={(e) => e.target.style.background = 'transparent'}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
