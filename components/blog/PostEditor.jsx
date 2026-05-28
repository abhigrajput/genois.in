'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import MarkdownRenderer from './MarkdownRenderer';

const TOPIC_OPTIONS = [
  { value: 'arrays', label: 'Arrays' },
  { value: 'strings', label: 'Strings' },
  { value: 'linkedlist', label: 'Linked List' },
  { value: 'trees', label: 'Trees' },
  { value: 'graphs', label: 'Graphs' },
  { value: 'dp', label: 'Dynamic Programming' },
  { value: 'greedy', label: 'Greedy Algorithms' },
  { value: 'sorting', label: 'Sorting' },
  { value: 'searching', label: 'Searching' },
  { value: 'backtracking', label: 'Backtracking' },
  { value: 'heap', label: 'Heap' },
  { value: 'trie', label: 'Trie' },
  { value: 'system-design', label: 'System Design' },
  { value: 'other', label: 'Other' }
];

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

export default function PostEditor({ postId = null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'

  // Form states
  const [currentId, setCurrentId] = useState(postId);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tags, setTags] = useState('');
  const [topic, setTopic] = useState('arrays');
  const [difficulty, setDifficulty] = useState('beginner');
  const [cppCode, setCppCode] = useState('');
  const [status, setStatus] = useState('draft');

  // Track dirty changes for auto-save
  const [isDirty, setIsDirty] = useState(false);
  const saveTimerRef = useRef(null);

  // Load post details if editing
  useEffect(() => {
    if (!currentId) return;
    loadPostData(currentId);
  }, [currentId]);

  const loadPostData = async (id) => {
    setLoading(true);
    const token = localStorage.getItem('genois_token');
    try {
      const res = await fetch(`/api/blog/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await res.json();
      if (res.ok && resData.data) {
        const post = resData.data;
        setTitle(post.title);
        setSlug(post.slug);
        setSlugManual(true); // Don't overwrite the loaded slug automatically
        setExcerpt(post.excerpt);
        setContent(post.content);
        setCoverImage(post.cover_image || '');
        setTags(Array.isArray(post.tags) ? post.tags.join(', ') : '');
        setTopic(post.topic);
        setDifficulty(post.difficulty);
        setCppCode(post.cpp_code || '');
        setStatus(post.status);
        setIsDirty(false);
      } else {
        toast.error('Failed to load post data');
        router.push('/author/dashboard');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error fetching post details');
    } finally {
      setLoading(false);
    }
  };

  // Generate slug dynamically from Title
  useEffect(() => {
    if (slugManual || currentId) return;
    const s = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // remove special characters
      .replace(/\s+/g, '-') // collapse whitespace into dashes
      .replace(/-+/g, '-') // remove double dashes
      .trim();
    setSlug(s);
  }, [title, slugManual, currentId]);

  // Set dirty state on changes
  const handleFieldChange = (setter, value) => {
    setter(value);
    setIsDirty(true);
  };

  // Custom markdown toolbar insertion
  const insertMarkdown = (syntaxBefore, syntaxAfter = '') => {
    const textarea = document.getElementById('content-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = syntaxBefore + selectedText + syntaxAfter;

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setContent(newContent);
    setIsDirty(true);

    // Refocus and place cursor
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + syntaxBefore.length;
      textarea.selectionEnd = start + syntaxBefore.length + selectedText.length;
    }, 0);
  };

  // Keyboard shortcut listener
  const handleKeyDown = (e) => {
    if (e.ctrlKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        insertMarkdown('**', '**');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        insertMarkdown('*', '*');
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        insertMarkdown('```cpp\n', '\n```');
      }
    }
  };

  // Save / Auto-save logic
  const handleSave = async (forceStatus = null, silent = false) => {
    if (!title || !slug || !content) {
      if (!silent) toast.error('Title, Slug, and Markdown Content are required');
      return;
    }

    const token = localStorage.getItem('genois_token');
    const finalStatus = forceStatus || status;

    if (!silent) setSaving(true);
    try {
      const url = currentId ? `/api/blog/posts/${currentId}` : '/api/blog/posts';
      const method = currentId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          cover_image: coverImage,
          tags,
          topic,
          difficulty,
          status: finalStatus,
          cpp_code: cppCode
        })
      });

      const resData = await res.json();
      if (res.ok) {
        setIsDirty(false);
        if (!currentId) {
          setCurrentId(resData.data.id);
          // If first save, silent redirect so we are now editing
          window.history.replaceState(null, '', `/author/edit-post/${resData.data.id}`);
        }
        if (!silent) {
          toast.success(finalStatus === 'published' ? 'Article published live!' : 'Draft saved successfully');
          setStatus(finalStatus);
        } else {
          console.log('Background auto-save complete.');
        }
      } else {
        if (!silent) toast.error(resData.message || 'Failed to save post');
      }
    } catch (e) {
      console.error(e);
      if (!silent) toast.error('An error occurred while saving');
    } finally {
      if (!silent) setSaving(false);
    }
  };

  // Background Auto-Save timer every 30s
  useEffect(() => {
    saveTimerRef.current = setInterval(() => {
      if (isDirty) {
        console.log('Auto-saving draft in background...');
        handleSave(null, true);
      }
    }, 30000);

    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [isDirty, title, slug, content, excerpt, coverImage, tags, topic, difficulty, cppCode, status, currentId]);

  // Estimate Read Time: 200 words / minute
  const calculateReadTime = () => {
    const totalWords = content.split(/\s+/).filter(Boolean).length + cppCode.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(totalWords / 200));
  };

  if (loading) {
    return (
      <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'Outfit,sans-serif' }}>
        Loading article data...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Outfit,sans-serif', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Editor Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: '24px', fontWeight: 800, color: '#e8f4ff', margin: 0 }}>
            {currentId ? '✏️ Edit DSA Publication' : '📝 Draft New Article'}
          </h1>
          <p style={{ color: '#5a7a9a', fontSize: '13px', marginTop: '4px' }}>
            {isDirty ? (
              <span style={{ color: '#ef9f27' }}>● Unsaved changes (will auto-save in background)</span>
            ) : (
              <span style={{ color: '#1d9e75' }}>✓ All changes saved</span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => router.push('/author/dashboard')}
            style={{ padding: '10px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#5a7a9a', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button 
            onClick={() => handleSave('draft')}
            disabled={saving}
            style={{ padding: '10px 20px', background: '#0d1117', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            {saving ? 'Saving...' : '💾 Save Draft'}
          </button>
          <button 
            onClick={() => handleSave('published')}
            disabled={saving}
            style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 12px rgba(0, 240, 255, 0.1)' }}
          >
            🚀 Publish Article
          </button>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,240,255,0.1)', marginBottom: '24px', gap: '16px' }}>
        <button 
          onClick={() => setActiveTab('edit')}
          style={{ padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === 'edit' ? '#00f0ff' : 'transparent'}`, color: activeTab === 'edit' ? '#00f0ff' : '#5a7a9a', fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
        >
          📝 Write Content
        </button>
        <button 
          onClick={() => setActiveTab('preview')}
          style={{ padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === 'preview' ? '#00f0ff' : 'transparent'}`, color: activeTab === 'preview' ? '#00f0ff' : '#5a7a9a', fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
        >
          👁️ Live Preview
        </button>
      </div>

      {activeTab === 'preview' ? (
        /* Preview Tab */
        <div style={{ background: '#0a0a0f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: '16px', padding: '32px', maxWidth: '860px', margin: '0 auto', minHeight: '500px' }}>
          {coverImage && (
            <img 
              src={coverImage} 
              alt={title}
              style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.05)' }} 
              onError={(e) => e.target.style.display = 'none'}
            />
          )}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(0,240,255,0.1)', color: '#00f0ff', fontFamily: 'JetBrains Mono,monospace', fontWeight: 'bold' }}>
              {topic.toUpperCase()}
            </span>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(29,158,117,0.1)', color: '#1d9e75', fontFamily: 'JetBrains Mono,monospace', fontWeight: 'bold' }}>
              {difficulty.toUpperCase()}
            </span>
          </div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: '38px', fontWeight: 800, color: '#e8f4ff', margin: '0 0 12px 0', lineHeight: '1.2' }}>{title || 'Untitled Post'}</h1>
          <p style={{ fontSize: '17px', color: '#8a9ab0', lineHeight: '1.6', margin: '0 0 24px 0', fontFamily: 'Outfit,sans-serif', borderLeft: '3px solid #7b5cff', paddingLeft: '16px' }}>{excerpt || 'Post excerpt goes here...'}</p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#5a7a9a', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <span>⏱ {calculateReadTime()} min read</span>
            <span>•</span>
            <span>🏷️ Tags: {tags || 'None'}</span>
          </div>

          <div className="blog-markdown-content" style={{ color: '#c9d1d9' }}>
            <MarkdownRenderer content={content || '*Write some markdown content to preview...*'} />
          </div>

          {cppCode && (
            <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f0ff', fontFamily: 'Syne,sans-serif', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
                <span>{'{ }'}</span> C++ Implementation
              </div>
              <MarkdownRenderer content={`\`\`\`cpp\n${cppCode}\n\`\`\``} />
            </div>
          )}
        </div>
      ) : (
        /* Edit Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Metadata Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', background: '#070f1f', border: '1px solid rgba(0,240,255,0.05)', borderRadius: '12px', padding: '20px' }}>
            {/* Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', fontFamily: 'JetBrains Mono,monospace', color: '#5a7a9a', fontWeight: 'bold' }}>ARTICLE TITLE</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => handleFieldChange(setTitle, e.target.value)}
                placeholder="How to implement AVL Trees from scratch..."
                style={{ background: '#0a0a0f', border: '1px solid rgba(0,240,255,0.15)', borderRadius: '8px', padding: '12px 16px', color: '#e8f4ff', fontSize: '15px', fontWeight: 'bold', outline: 'none' }}
              />
            </div>

            {/* Slug */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontFamily: 'JetBrains Mono,monospace', color: '#5a7a9a', fontWeight: 'bold' }}>URL SLUG</label>
              <input 
                type="text" 
                value={slug} 
                onChange={(e) => {
                  setSlugManual(true);
                  handleFieldChange(setSlug, e.target.value.toLowerCase().replace(/\s+/g, '-'));
                }}
                placeholder="avl-trees-implementation"
                style={{ background: '#0a0a0f', border: '1px solid rgba(0,240,255,0.15)', borderRadius: '8px', padding: '10px 14px', color: '#00f0ff', fontFamily: 'JetBrains Mono,monospace', fontSize: '13px', outline: 'none' }}
              />
            </div>

            {/* Topic dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontFamily: 'JetBrains Mono,monospace', color: '#5a7a9a', fontWeight: 'bold' }}>TOPIC CATEGORY</label>
              <select 
                value={topic} 
                onChange={(e) => handleFieldChange(setTopic, e.target.value)}
                style={{ background: '#0a0a0f', border: '1px solid rgba(0,240,255,0.15)', borderRadius: '8px', padding: '10px 14px', color: '#e8f4ff', outline: 'none', cursor: 'pointer' }}
              >
                {TOPIC_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} style={{ background: '#070f1f' }}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Difficulty select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontFamily: 'JetBrains Mono,monospace', color: '#5a7a9a', fontWeight: 'bold' }}>DIFFICULTY LEVEL</label>
              <select 
                value={difficulty} 
                onChange={(e) => handleFieldChange(setDifficulty, e.target.value)}
                style={{ background: '#0a0a0f', border: '1px solid rgba(0,240,255,0.15)', borderRadius: '8px', padding: '10px 14px', color: '#e8f4ff', outline: 'none', cursor: 'pointer' }}
              >
                {DIFFICULTY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} style={{ background: '#070f1f' }}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Cover Image */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontFamily: 'JetBrains Mono,monospace', color: '#5a7a9a', fontWeight: 'bold' }}>COVER IMAGE URL</label>
              <input 
                type="text" 
                value={coverImage} 
                onChange={(e) => handleFieldChange(setCoverImage, e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                style={{ background: '#0a0a0f', border: '1px solid rgba(0,240,255,0.15)', borderRadius: '8px', padding: '10px 14px', color: '#e8f4ff', fontSize: '13px', outline: 'none' }}
              />
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontFamily: 'JetBrains Mono,monospace', color: '#5a7a9a', fontWeight: 'bold' }}>TAGS (Comma Separated)</label>
              <input 
                type="text" 
                value={tags} 
                onChange={(e) => handleFieldChange(setTags, e.target.value)}
                placeholder="avl tree, BST, self-balancing, trees"
                style={{ background: '#0a0a0f', border: '1px solid rgba(0,240,255,0.15)', borderRadius: '8px', padding: '10px 14px', color: '#e8f4ff', fontSize: '13px', outline: 'none' }}
              />
            </div>

            {/* Read Time Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono,monospace', color: '#5a7a9a' }}>ESTIMATED READ TIME</span>
              <span style={{ fontSize: '15px', color: '#00f0ff', fontWeight: 'bold' }}>⏱ {calculateReadTime()} Minute{calculateReadTime() > 1 ? 's' : ''}</span>
            </div>

            {/* Excerpt */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', fontFamily: 'JetBrains Mono,monospace', color: '#5a7a9a', fontWeight: 'bold' }}>EXCERPT (Short Catchy Description)</label>
              <textarea 
                value={excerpt} 
                onChange={(e) => handleFieldChange(setExcerpt, e.target.value)}
                placeholder="A detailed walkthrough of AVL trees, exploring height metrics, balance factors, single/double rotations, and full C++ implementation..."
                style={{ background: '#0a0a0f', border: '1px solid rgba(0,240,255,0.15)', borderRadius: '8px', padding: '10px 14px', color: '#c8d8e8', fontSize: '13px', outline: 'none', height: '60px', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Markdown Content Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid rgba(0,240,255,0.15)', borderRadius: '12px', overflow: 'hidden', background: '#070f1f' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '4px', padding: '8px 16px', background: '#161b22', borderBottom: '1px solid rgba(0,240,255,0.1)', flexWrap: 'wrap' }}>
              {[
                { label: 'Bold', action: () => insertMarkdown('**', '**'), icon: '𝐁' },
                { label: 'Italic', action: () => insertMarkdown('*', '*'), icon: '𝘐' },
                { label: 'Code Inline', action: () => insertMarkdown('`', '`'), icon: '‹›' },
                { label: 'Code Block', action: () => insertMarkdown('```cpp\n', '\n```'), icon: '💻' },
                { label: 'Heading 2', action: () => insertMarkdown('## '), icon: 'H2' },
                { label: 'Heading 3', action: () => insertMarkdown('### '), icon: 'H3' },
                { label: 'Bullet List', action: () => insertMarkdown('- '), icon: '•' },
                { label: 'Numbered List', action: () => insertMarkdown('1. '), icon: '1.' },
                { label: 'Divider', action: () => insertMarkdown('\n---\n'), icon: '―' }
              ].map(t => (
                <button 
                  key={t.label} 
                  onClick={t.action}
                  title={`${t.label} (Shortcuts active)`}
                  style={{ background: 'transparent', border: 'none', color: '#00f0ff', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace', fontWeight: 'bold', transition: 'background 0.1s' }}
                  onMouseOver={(e) => e.target.style.background = 'rgba(0,240,255,0.08)'}
                  onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                  {t.icon}
                </button>
              ))}
              <span style={{ fontSize: '11px', color: '#5a7a9a', marginLeft: 'auto', alignSelf: 'center', fontFamily: 'JetBrains Mono,monospace' }}>
                Ctrl+B (Bold) · Ctrl+I (Italic) · Ctrl+K (Code block)
              </span>
            </div>

            {/* Content Textarea */}
            <textarea 
              id="content-textarea"
              value={content}
              onChange={(e) => handleFieldChange(setContent, e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="# Introduce your topic here&#10;&#10;Explain the concepts, logic, and complexity. Use **bold** styling or - bullet points where helpful.&#10;&#10;## Subtitle Section..."
              style={{ background: '#0a0a0f', border: 'none', padding: '16px 20px', color: '#c9d1d9', fontSize: '15px', fontFamily: 'JetBrains Mono,monospace', outline: 'none', height: '400px', resize: 'vertical', lineHeight: '1.6' }}
            />
          </div>

          {/* Dedicated C++ Code Editor Section */}
          <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid rgba(123,92,255,0.2)', borderRadius: '12px', overflow: 'hidden', background: '#070f1f' }}>
            <div style={{ padding: '8px 16px', background: 'rgba(123,92,255,0.08)', borderBottom: '1px solid rgba(123,92,255,0.15)', color: '#7b5cff', fontFamily: 'Syne,sans-serif', fontSize: '13px', fontWeight: 'bold' }}>
              ⚡ C++ IMPLEMENTATION CODE BLOCK (Optional - Will appear fully formatted at post bottom)
            </div>
            <textarea 
              value={cppCode}
              onChange={(e) => handleFieldChange(setCppCode, e.target.value)}
              placeholder={`#include <iostream>\nusing namespace std;\n\n// Write your core C++ implementation here...`}
              style={{ background: '#0a0a0f', border: 'none', padding: '16px 20px', color: '#00f0ff', fontSize: '13px', fontFamily: 'JetBrains Mono,monospace', outline: 'none', height: '240px', resize: 'vertical', lineHeight: '1.6' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
