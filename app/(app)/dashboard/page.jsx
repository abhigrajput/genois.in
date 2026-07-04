'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'
import { useToken } from '@/lib/useApi'
import TrialBanner from '@/components/TrialBanner'
import OnboardingTour from '@/components/OnboardingTour'
import { toEmbedUrl } from '@/lib/youtubeEmbed'
import {
  Flame, Zap, Trophy, Play, BookOpen, Code2, ClipboardCheck, FileText, Target,
  Bot, Mic, Lightbulb, Rocket, Check, Sparkles, Mail, AlertTriangle, Settings,
} from 'lucide-react'

function YouTubeEmbed({ url, title }) {
  const embedUrl = toEmbedUrl(url);
  if (!embedUrl) return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '12px 20px', borderRadius: 10, textDecoration: 'none',
      background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
      color: '#6366f1', fontFamily: 'Outfit,sans-serif', fontWeight: 600, fontSize: 14,
    }}>▶ Watch on YouTube →</a>
  );
  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(99,102,241,0.15)' }}>
      <iframe
        src={embedUrl}
        title={title || 'Video'}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
}

const G = '#6366f1'
const G10 = 'rgba(99,102,241,0.1)'
const G20 = 'rgba(99,102,241,0.2)'
const AMBER = '#fbbf24'
const BG = '#0d0d14'
const BG2 = '#13131f'
const BG3 = '#1a1a2e'

const TASK_BITS = { video: 1, resource: 2, coding: 4, test: 8, notes: 16 }
const TASK_META = [
  { type: 'video',    icon: Play,           label: 'Watch',  bit: 1  },
  { type: 'resource', icon: BookOpen,       label: 'Read',   bit: 2  },
  { type: 'coding',   icon: Code2,          label: 'Code',   bit: 4  },
  { type: 'test',     icon: ClipboardCheck, label: 'Test',   bit: 8  },
  { type: 'notes',    icon: FileText,       label: 'Notes',  bit: 16 },
]

const DIFF_COLORS = { Easy: G, Medium: AMBER, Hard: '#ff4757' }

function DayRing({ day, size = 72 }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(day / 365, 1)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ display: 'block' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={G} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: size > 60 ? 20 : 14, fontWeight: 700, color: G, lineHeight: 1 }}>{day}</span>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#444', marginTop: 1 }}>/ 365</span>
      </div>
    </div>
  )
}

function Skel({ h = 60, w = '100%' }) {
  return <div className="skeleton" style={{ height: h, width: w }} />
}

function Confetti({ show }) {
  if (!show) return null
  const colors = [G, AMBER, '#818cf8', '#ff69b4', '#ffffff', '#7b5cff']
  const particles = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 360
    const dist = 80 + (i % 4) * 30
    const tx = Math.cos((angle * Math.PI) / 180) * dist
    const ty = Math.sin((angle * Math.PI) / 180) * dist - 60
    return { i, color: colors[i % colors.length], tx, ty }
  })
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998 }}>
      <div style={{ position: 'absolute', left: '45%', top: '45%' }}>
        {particles.map(p => (
          <div key={p.i} className="confetti-particle" style={{
            background: p.color, borderRadius: p.i % 2 === 0 ? '50%' : '2px',
            '--tx': `${p.tx}px`, '--ty': `${p.ty}px`,
            animationDelay: `${(p.i % 4) * 0.05}s`,
          }} />
        ))}
      </div>
    </div>
  )
}

function FloatAnim({ items }) {
  return (
    <>
      {items.map(a => (
        <div key={a.id} className="pts-float" style={{
          position: 'fixed', bottom: '25%', left: '55%',
          fontFamily: 'JetBrains Mono,monospace', fontSize: 20, fontWeight: 800,
          color: G, zIndex: 9999,
          transform: 'translateX(-50%)',
        }}>{a.text}</div>
      ))}
    </>
  )
}

export default function DashboardPage() {
  const { user, progress: storeProgress, score: storeScore } = useAuthStore()
  const router = useRouter()
  const { token, ready } = useToken()

  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [roadmap, setRoadmap] = useState(null)
  const [lbData, setLbData] = useState(null)
  const [activeTask, setActiveTask] = useState('video')
  const [completedMask, setCompletedMask] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [floatAnims, setFloatAnims] = useState([])
  const [motiveIdx, setMotiveIdx] = useState(0)
  const [generatingNotes, setGeneratingNotes] = useState(false)
  const [videoEligible, setVideoEligible] = useState(false)
  const [streakAtRisk, setStreakAtRisk] = useState(false)
  const [githubInput, setGithubInput] = useState('')
  const [calendarData, setCalendarData] = useState([])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (user && !user.domain_slug) router.push('/onboarding')
  }, [user, router])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!ready || !token) return
    const h = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }

    Promise.all([
      fetch('/api/analytics/dashboard', { headers: h }).then(r => r.json()).catch(() => null),
      fetch('/api/roadmap/daily', { headers: h }).then(r => r.json()).catch(() => null),
      fetch('/api/leaderboard', { headers: h }).then(r => r.json()).catch(() => null),
    ]).then(([an, rm, lb]) => {
      const ad = an?.data || an || {}
      const rd = rm?.data || rm || {}
      const ld = lb?.data || lb || {}

      setAnalytics(ad)
      setRoadmap(rd)
      setLbData(ld)

      const tasks = ad?.today?.tasks || []
      const mask = tasks.reduce((m, t) => t.status === 'completed' ? m | (TASK_BITS[t.type] || 0) : m, 0)
      setCompletedMask(mask)

      const firstInc = TASK_META.find(tm => !(mask & tm.bit))
      if (firstInc) setActiveTask(firstInc.type)
    }).finally(() => setLoading(false))

    // Calendar data fetch
    fetch('/api/progress/full', { headers: h })
      .then(r => r.json())
      .then(d => { if (d?.data?.calendarData) setCalendarData(d.data.calendarData) })
      .catch(() => {})
  }, [ready, token])

  // Streak at risk detection (after 6 PM IST = 12:30 UTC)
  useEffect(() => {
    const checkStreak = () => {
      const streak = analytics?.progress?.streak || storeProgress?.streak || 0
      if (streak > 0 && completedMask === 0) {
        const now = new Date()
        const istHour = (now.getUTCHours() + 5) % 24 + (now.getUTCMinutes() >= 30 ? 0 : 0)
        // IST = UTC+5:30
        const istMins = now.getUTCHours() * 60 + now.getUTCMinutes() + 330
        if (istMins % (24 * 60) >= 18 * 60) setStreakAtRisk(true)
      }
    }
    checkStreak()
  }, [analytics, completedMask, storeProgress])

  // 30-second watch gate
  useEffect(() => {
    if (activeTask !== 'video') { setVideoEligible(false); return; }
    setVideoEligible(false);
    const timer = setTimeout(() => setVideoEligible(true), 30000);
    return () => clearTimeout(timer);
  }, [activeTask]);

  // Motivation bar rotation
  useEffect(() => {
    const t = setInterval(() => setMotiveIdx(i => i + 1), 5000)
    return () => clearInterval(t)
  }, [])

  const addFloat = useCallback((text) => {
    const id = Date.now() + Math.random()
    setFloatAnims(prev => [...prev, { id, text }])
    setTimeout(() => setFloatAnims(prev => prev.filter(a => a.id !== id)), 1200)
  }, [])

  const checkAchievements = useCallback((newMask) => {
    const shown = JSON.parse(localStorage.getItem('genois_achievements') || '{}')
    const dk = new Date().toDateString()
    const toStyle = { background: BG2, color: G, border: `1px solid ${G20}`, borderRadius: 10 }

    const prevCount = TASK_META.filter(tm => completedMask & tm.bit).length
    if (prevCount === 0 && newMask > 0 && !shown[`first_${dk}`]) {
      toast.success('First task done! Keep going', { style: toStyle })
      shown[`first_${dk}`] = true
    }
    if (newMask === 31 && !shown[`all_${dk}`]) {
      const day = analytics?.progress?.currentDay || 1
      toast.success(`Day ${day} complete! +100 bonus pts`, { style: toStyle, duration: 5000 })
      shown[`all_${dk}`] = true
    }
    const total = analytics?.score?.total_score || 0
    for (const th of [1000, 5000, 10000]) {
      if (total < th && total + 20 >= th && !shown[`score_${th}`]) {
        toast.success(`${th.toLocaleString()} pts milestone!`, { style: toStyle })
        shown[`score_${th}`] = true
      }
    }
    localStorage.setItem('genois_achievements', JSON.stringify(shown))
  }, [completedMask, analytics])

  const completeTask = useCallback(async (taskType) => {
    if (!token) return
    const bit = TASK_BITS[taskType]
    if (!bit || (completedMask & bit)) return
    const newMask = completedMask | bit
    setCompletedMask(newMask)
    addFloat('+20 pts')
    const currentDay = analytics?.progress?.currentDay || storeProgress?.current_day || 1
    try {
      await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ day: currentDay, taskType }),
      })
      checkAchievements(newMask)
      if (newMask === 31) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000) }
    } catch {
      setCompletedMask(completedMask)
      toast.error('Failed to save progress')
    }
  }, [token, completedMask, addFloat, checkAchievements, analytics, storeProgress])

  const generateNotes = useCallback(async () => {
    if (!token || generatingNotes) return
    setGeneratingNotes(true)
    try {
      await fetch('/api/notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ day: analytics?.progress?.currentDay || 1 }),
      })
      toast.success('Notes generated!', { style: { background: BG2, color: G } })
      // Mark notes as done after generation
      completeTask('notes')
    } catch {
      toast.error('Could not generate notes')
    } finally {
      setGeneratingNotes(false)
    }
  }, [token, generatingNotes, analytics, completeTask])

  // Derived data
  const progress = analytics?.progress || {}
  const score = analytics?.score || {}
  const today = analytics?.today || {}

  const currentDay = progress?.currentDay || storeProgress?.current_day || 1
  const streak = progress?.streak || storeProgress?.streak || 0
  const totalScore = score?.total_score || storeScore?.total_score || 0
  const myRank = lbData?.myRank || lbData?.userRank || null
  const percentile = lbData?.percentile || null

  const rm = roadmap || {}
  const topic = rm?.topic || rm?.title || "Today's Topic"
  const week = rm?.week || Math.ceil(currentDay / 7)
  const level = rm?.level || rm?.difficulty || 'Beginner'
  const isProjectDay = rm?.isProjectDay || false
  const concepts = rm?.keyConceptss || rm?.keyConcepts || rm?.key_concepts || []
  const objectives = rm?.objectives || []
  const video = rm?.video || {}
  const resource = rm?.resource || {}
  const coding = rm?.coding || {}
  const project = rm?.project || {}
  const notes = rm?.notes || {}

  const doneTasks = TASK_META.filter(tm => completedMask & tm.bit).length
  const allDone = completedMask === 31
  const nextTask = TASK_META.find(tm => !(completedMask & tm.bit))

  // Leaderboard slice around user
  const lb = lbData?.leaderboard || lbData?.users || []
  const myIdx = lb.findIndex(e => e.rank === myRank || e.isMe)
  const lbStart = Math.max(0, myIdx < 0 ? 0 : myIdx - 2)
  const lbSlice = lb.slice(lbStart, lbStart + 5)

  // Week dots (7 days)
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const todayDow = new Date().getDay()
  const weekStart = currentDay - ((todayDow === 0 ? 6 : todayDow - 1))

  // 30-day calendar grid
  const cal30 = calendarData.length > 0 ? calendarData : Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000),
    done: i >= 30 - streak,
    isToday: i === 29,
    count: i >= 30 - streak ? (i % 3 === 0 ? 2 : 1) : 0,
  }))

  // Motivation messages
  const nameAbove = lb[Math.max(0, myIdx - 1)]?.name || 'someone'
  const ptsAhead = lb[Math.max(0, myIdx - 1)]?.score ? lb[Math.max(0, myIdx - 1)].score - totalScore : 0
  const motives = [
    `You've completed ${streak} days in a row — don't stop now!`,
    `${5 - doneTasks} more task${5 - doneTasks !== 1 ? 's' : ''} to finish Day ${currentDay}`,
    myRank ? `You're rank #${myRank}${ptsAhead > 0 ? ` — ${nameAbove} is ${ptsAhead} pts ahead` : ' — keep climbing!'}` : `Complete tasks to earn your rank!`,
    `You've earned ${totalScore.toLocaleString()} pts total${percentile ? ` — top ${percentile}% of all students` : ''}`,
    `You're on Day ${currentDay} of 365 — ${365 - currentDay} days to go!`,
  ]
  const currentMotive = motives[motiveIdx % motives.length]

  const isAdmin = user?.email?.toLowerCase().trim() === 'abhigrajput5@gmail.com'

  // ── LOADING SKELETON ──
  if (loading) return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Skel h={isMobile ? 110 : 90} />
      <Skel h={52} />
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
        <div style={{ flex: isMobile ? 'none' : 3, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skel h={320} />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
            <Skel h={130} />
            {!isMobile && <><Skel h={130} /><Skel h={130} /></>}
          </div>
        </div>
        <div style={{ flex: isMobile ? 'none' : 2, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skel h={120} /><Skel h={100} /><Skel h={100} /><Skel h={130} />
        </div>
      </div>
      <Skel h={52} />
    </div>
  )

  // ── ACTIVE TASK CONTENT ──
  function TaskContent() {
    const done = !!(completedMask & TASK_BITS[activeTask])
    const btnStyle = {
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '10px 20px', borderRadius: 8, border: 'none', cursor: done ? 'default' : 'pointer',
      background: done ? 'rgba(99,102,241,0.1)' : G, color: done ? G : '#fff',
      fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
      opacity: done ? 0.7 : 1,
    }

    if (activeTask === 'video') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {video?.title && <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 600, color: '#e8f4ff' }}>{video.title}</div>}
        {video?.description && <div style={{ fontSize: 12, color: '#6b7a8d', lineHeight: 1.6 }}>{video.description}</div>}
        {video?.url
          ? <YouTubeEmbed url={video.url} title={video.title} />
          : <div style={{ fontSize: 12, color: '#555' }}>No video available for today.</div>}
        {!done && (
          <button
            onClick={() => videoEligible && completeTask('video')}
            disabled={!videoEligible}
            style={{
              padding: '11px 20px', borderRadius: 8, border: 'none',
              cursor: videoEligible ? 'pointer' : 'not-allowed',
              background: videoEligible ? G : 'rgba(255,255,255,0.06)',
              color: videoEligible ? '#fff' : '#555',
              fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14,
              transition: 'all 0.4s ease', width: '100%',
            }}>
            {videoEligible ? 'Mark Video as Watched' : 'Watch 30 seconds to unlock...'}
          </button>
        )}
      </div>
    )

    if (activeTask === 'resource') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {resource?.title && <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 600, color: '#e8f4ff' }}>{resource.title}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          {resource?.url && (
            <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, background: done ? 'rgba(99,102,241,0.1)' : G, color: done ? G : '#fff', textDecoration: 'none' }}>
              <BookOpen size={16} strokeWidth={2} /> Open Resource
            </a>
          )}
          {!done && <button onClick={() => completeTask('resource')} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${G20}`, background: 'transparent', color: G, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: 14 }}>Mark Complete</button>}
        </div>
      </div>
    )

    if (activeTask === 'coding') {
      const diff = coding?.difficulty || 'Medium'
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {coding?.title && <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 14, fontWeight: 700, color: G }}>{coding.title}</div>}
            <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${DIFF_COLORS[diff]}20`, color: DIFF_COLORS[diff], border: `1px solid ${DIFF_COLORS[diff]}40` }}>{diff}</span>
          </div>
          {coding?.description && <div style={{ fontSize: 12, color: '#6b7a8d', lineHeight: 1.6 }}>{coding.description}</div>}
          {coding?.codeSnippet && (
            <pre style={{ background: '#0d0d14', border: `1px solid rgba(99,102,241,0.15)`, borderRadius: 8, padding: '12px 14px', fontSize: 11, color: G, fontFamily: 'JetBrains Mono,monospace', overflow: 'auto', maxHeight: 100, margin: 0 }}>
              {coding.codeSnippet}
            </pre>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {coding?.url && (
              <a href={coding.url} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, background: done ? 'rgba(99,102,241,0.1)' : G, color: done ? G : '#fff', textDecoration: 'none' }}>
                <Code2 size={16} strokeWidth={2} /> Solve Problem →
              </a>
            )}
            {!done && <button onClick={() => completeTask('coding')} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${G20}`, background: 'transparent', color: G, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: 14 }}>Mark Complete</button>}
          </div>
        </div>
      )
    }

    if (activeTask === 'test') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 13, color: '#6b7a8d' }}>Take today&apos;s test to earn bonus points and test your understanding.</div>
        <Link href="/tests" style={{ ...btnStyle, background: done ? 'rgba(99,102,241,0.1)' : G, color: done ? G : '#fff', textDecoration: 'none', alignSelf: 'flex-start' }}>
          <ClipboardCheck size={16} strokeWidth={2} /> Take Today&apos;s Test →
        </Link>
      </div>
    )

    if (activeTask === 'notes') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {notes?.content ? (
          <div style={{ background: '#0d0d14', border: `1px solid rgba(99,102,241,0.12)`, borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#aab', lineHeight: 1.7, maxHeight: 140, overflow: 'auto', fontFamily: 'Outfit,sans-serif' }}>
            {notes.content}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#6b7a8d' }}>AI-generated summary notes for today&apos;s topic. Click below to generate.</div>
        )}
        {!notes?.content && (
          <button onClick={generateNotes} disabled={generatingNotes} style={{ ...btnStyle, alignSelf: 'flex-start', opacity: generatingNotes ? 0.6 : 1, cursor: generatingNotes ? 'not-allowed' : 'pointer' }}>
            {generatingNotes ? 'Generating...' : <><Sparkles size={16} strokeWidth={2} /> Generate Notes</>}
          </button>
        )}
        {notes?.content && !done && (
          <button onClick={() => completeTask('notes')} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${G20}`, background: 'transparent', color: G, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: 14, alignSelf: 'flex-start' }}>Mark Complete</button>
        )}
      </div>
    )

    return null
  }

  const cardBase = {
    background: BG2, border: `1px solid rgba(99,102,241,0.12)`, borderRadius: 14,
    padding: 20, position: 'relative', overflow: 'hidden',
  }

  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FloatAnim items={floatAnims} />
      <Confetti show={showConfetti} />

      <TrialBanner />

      {/* Email verification */}
      {user?.email_verified === false && (
        <div style={{ background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: 10, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={16} strokeWidth={2} color="#ff6b6b" style={{ flexShrink: 0 }} />
            <span style={{ fontFamily: 'Outfit,sans-serif', fontSize: 13, color: '#ff6b6b' }}>Please verify your email to unlock all features</span>
          </div>
          <button onClick={async () => {
            try { await fetch('/api/auth/resend-verification', { method: 'POST', headers: { Authorization: 'Bearer ' + token } }); toast.success('Verification email sent!') }
            catch { toast.error('Failed to send') }
          }} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#ff4545', color: '#fff', fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            Resend →
          </button>
        </div>
      )}

      {/* Streak at risk */}
      {streakAtRisk && (
        <div style={{ background: 'rgba(251,191,36,0.07)', border: `1px solid rgba(251,191,36,0.3)`, borderRadius: 10, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={18} strokeWidth={2} color={AMBER} style={{ flexShrink: 0 }} />
          <span style={{ fontFamily: 'Outfit,sans-serif', fontSize: 13, color: AMBER }}>Complete at least 1 task to keep your streak alive tonight!</span>
        </div>
      )}

      {/* Admin link */}
      {isAdmin && (
        <a href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: `1px solid ${G20}`, color: G, textDecoration: 'none', fontSize: 12, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, alignSelf: 'flex-start' }}><Settings size={14} strokeWidth={2} /> Admin Dashboard →</a>
      )}

      {/* DSA Diagnostic banner */}
      {user?.domain_slug === 'dsa' && analytics?.diagnosticStatus === false && (
        <div onClick={() => router.push('/diagnostic')} style={{ ...cardBase, cursor: 'pointer', borderColor: `rgba(99,102,241,0.3)` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: G, letterSpacing: 2, marginBottom: 4 }}><Target size={12} strokeWidth={2} /> RECOMMENDED</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: '#e8f4ff' }}>Take DSA Diagnostic to get your level →</div>
              <div style={{ fontSize: 12, color: '#6b7a8d', marginTop: 2 }}>15 questions · 10 min · Sets your personalized track</div>
            </div>
            <div style={{ padding: '8px 18px', borderRadius: 8, background: G, color: '#fff', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13 }}>Start Now →</div>
          </div>
        </div>
      )}

      {/* ── HERO STATS BAR ── */}
      <div className="stats-bar" style={{ background: BG2, borderRadius: 14, border: `1px solid rgba(99,102,241,0.12)`, padding: isMobile ? '12px 14px' : '16px 24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 16 }}>
        {/* Day */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14 }}>
          <DayRing day={currentDay} size={isMobile ? 52 : 68} />
          <div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#555', letterSpacing: 2, marginBottom: 2 }}>CURRENT DAY</div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#888' }}>{Math.round((currentDay / 365) * 100)}% complete</div>
          </div>
        </div>

        {/* Streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: `1px solid rgba(255,255,255,0.06)`, paddingLeft: 16 }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#555', letterSpacing: 2, marginBottom: 4 }}>STREAK</div>
            <div className={streak >= 7 ? 'pulse-amber' : ''} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono,monospace', fontSize: 28, fontWeight: 800, color: streak > 0 ? AMBER : '#444', lineHeight: 1 }}>
              {streak > 0 && <Flame size={24} strokeWidth={2} color={AMBER} />}{streak > 0 ? `${streak}` : '0'}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: streak > 0 ? AMBER : '#555', marginTop: 2 }}>
              {streak === 0 ? 'Start today!' : streak >= 30 ? <><Flame size={11} strokeWidth={2} color={AMBER} /> ON FIRE</> : 'days'}
            </div>
            {streakAtRisk && streak > 0 && doneTasks === 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#ff4545', marginTop: 2 }}><AlertTriangle size={10} strokeWidth={2} /> AT RISK</div>
            )}
          </div>
        </div>

        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: isMobile ? 'none' : `1px solid rgba(255,255,255,0.06)`, paddingLeft: isMobile ? 0 : 16 }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#555', letterSpacing: 2, marginBottom: 4 }}>SCORE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono,monospace', fontSize: isMobile ? 20 : 26, fontWeight: 800, color: G, lineHeight: 1 }}>
              <Zap size={isMobile ? 18 : 22} strokeWidth={2} color={G} /> {totalScore.toLocaleString()}
            </div>
            {doneTasks > 0 && (
              <div style={{ display: 'inline-block', marginTop: 3, padding: '1px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', border: `1px solid ${G20}`, fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: G }}>
                +{doneTasks * 20} today
              </div>
            )}
            {doneTasks === 0 && <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#555', marginTop: 2 }}>0 today</div>}
          </div>
        </div>

        {/* Rank */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: `1px solid rgba(255,255,255,0.06)`, paddingLeft: 16 }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#555', letterSpacing: 2, marginBottom: 4 }}>RANK</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Syne,sans-serif', fontSize: isMobile ? 20 : 26, fontWeight: 800, color: '#e8f4ff', lineHeight: 1 }}>
              <Trophy size={isMobile ? 18 : 22} strokeWidth={2} color={G} /> {myRank ? `#${myRank}` : '--'}
            </div>
            {percentile && <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: G, marginTop: 3 }}>Top {100 - percentile}%</div>}
          </div>
        </div>
      </div>

      {/* ── MAIN 60/40 ── */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, alignItems: 'flex-start' }}>

        {/* LEFT 60% */}
        <div style={{ flex: isMobile ? 'none' : '3 1 0', width: isMobile ? '100%' : undefined, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* TODAY'S MISSION CARD */}
          <div style={{ ...cardBase, border: `1px solid rgba(99,102,241,0.25)`, boxShadow: '0 0 24px rgba(99,102,241,0.05)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: G, letterSpacing: 2, fontWeight: 700 }}>TODAY&apos;S MISSION</span>
                <span style={{ padding: '2px 10px', borderRadius: 20, background: G10, border: `1px solid ${G20}`, fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: G }}>DAY {currentDay}</span>
              </div>
              <Link href="/roadmap" style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: G, textDecoration: 'none', border: `1px solid ${G20}`, padding: '3px 10px', borderRadius: 20 }}>
                Full Roadmap →
              </Link>
            </div>

            {/* PROJECT DAY */}
            {isProjectDay ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: '#e8f4ff' }}>{project?.title || 'Project Day'}</div>
                {project?.description && <div style={{ fontSize: 13, color: '#6b7a8d', lineHeight: 1.7 }}>{project.description}</div>}
                {project?.estimatedHours && (
                  <span style={{ alignSelf: 'flex-start', padding: '3px 10px', borderRadius: 20, background: 'rgba(251,191,36,0.1)', border: `1px solid rgba(251,191,36,0.3)`, fontSize: 11, color: AMBER, fontFamily: 'JetBrains Mono,monospace' }}>
                    ~{project.estimatedHours}h estimated
                  </span>
                )}
                {project?.steps?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {project.steps.map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: '#0d0d14', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ color: G, fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', flexShrink: 0 }}>{i + 1}.</span>
                        <span style={{ fontSize: 13, color: '#aab' }}>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {project?.githubUrl && (
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', borderRadius: 8, background: G, color: '#fff', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                      Submit on GitHub →
                    </a>
                  )}
                  <input value={githubInput} onChange={e => setGithubInput(e.target.value)} placeholder="Your GitHub repo URL..." style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 8, border: `1px solid rgba(99,102,241,0.2)`, background: '#0d0d14', color: '#e8f4ff', fontSize: 13, fontFamily: 'Outfit,sans-serif', outline: 'none' }} />
                </div>
              </div>
            ) : (
              <>
                {/* Topic header */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: '#e8f4ff', marginBottom: 8 }}>{topic}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(123,92,255,0.1)', border: '1px solid rgba(123,92,255,0.25)', fontSize: 11, color: '#7b5cff', fontFamily: 'JetBrains Mono,monospace' }}>Week {week}</span>
                    <span style={{ padding: '3px 10px', borderRadius: 20, background: G10, border: `1px solid ${G20}`, fontSize: 11, color: G, fontFamily: 'JetBrains Mono,monospace' }}>{level}</span>
                  </div>
                </div>

                {/* Task pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {TASK_META.map(tm => {
                    const isDone = !!(completedMask & tm.bit)
                    const isActive = activeTask === tm.type
                    return (
                      <button key={tm.type} onClick={() => setActiveTask(tm.type)}
                        className={isDone ? 'task-pill-done' : isActive ? 'task-pill-active' : 'task-pill-pending'}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 600, border: 'none', transition: 'all 0.2s' }}>
                        <tm.icon size={14} strokeWidth={2} />
                        <span>{tm.label}</span>
                        {isDone && <Check size={12} strokeWidth={2.5} />}
                      </button>
                    )
                  })}
                </div>

                {/* Active task content */}
                <div style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '16px', marginBottom: 16, minHeight: 80 }}>
                  <TaskContent />
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#6b7a8d' }}>{doneTasks} / 5 tasks done</span>
                    {allDone && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: G }}><Check size={12} strokeWidth={2.5} /> ALL DONE</span>}
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(doneTasks / 5) * 100}%`, background: `linear-gradient(90deg, ${G}, #818cf8)`, borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                </div>

                {/* CTA button */}
                <button
                  onClick={() => { if (allDone) router.push('/roadmap'); else if (nextTask) { setActiveTask(nextTask.type); completeTask(nextTask.type) } }}
                  className={allDone ? 'pulse-amber' : ''}
                  style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: allDone ? `linear-gradient(135deg, ${AMBER}, #f59e0b)` : G, color: allDone ? '#000' : '#fff', fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 800, letterSpacing: 0.5, transition: 'all 0.2s' }}>
                  {allDone ? 'Day Complete! See Tomorrow →' : `Start ${nextTask?.label || 'Next'} →`}
                </button>
              </>
            )}
          </div>

          {/* 3 MINI CARDS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>

            {/* Week Progress */}
            <div style={cardBase}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: G, letterSpacing: 2, marginBottom: 10 }}>WEEK PROGRESS</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
                {weekDays.map((d, i) => {
                  const dayNum = weekStart + i
                  const isToday = dayNum === currentDay
                  const isPast = dayNum < currentDay
                  const bg = isToday ? G : isPast ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.04)'
                  const border = isToday ? `2px solid ${G}` : 'none'
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: bg, border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: isToday ? '#fff' : isPast ? G : '#444', transition: 'all 0.2s' }}>
                        {isToday ? '●' : isPast ? '✓' : ''}
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: isToday ? G : '#444' }}>{d}</span>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 8, fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#555' }}>
                Week {week} · Day {currentDay}
              </div>
            </div>

            {/* Streak Calendar */}
            <div style={cardBase}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: G, letterSpacing: 2, marginBottom: 10 }}>30-DAY STREAK</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3 }}>
                {cal30.map((d, i) => {
                  const isToday = i === 29 || d.isToday
                  const count = d.count ?? (d.done ? 1 : 0)
                  const bg = isToday ? G : count >= 3 ? 'rgba(99,102,241,0.7)' : count >= 2 ? 'rgba(99,102,241,0.45)' : count >= 1 ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.03)'
                  return (
                    <div key={i} className="streak-day" style={{ aspectRatio: '1', background: bg, borderRadius: 2, border: isToday ? `1px solid ${G}` : 'none', position: 'relative' }} />
                  )
                })}
              </div>
              <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, background: 'rgba(99,102,241,0.25)', borderRadius: 1 }} />
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#555' }}>less</span>
                <div style={{ width: 8, height: 8, background: G, borderRadius: 1 }} />
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#555' }}>more</span>
              </div>
            </div>

            {/* Quick Access */}
            <div style={cardBase}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: G, letterSpacing: 2, marginBottom: 10 }}>QUICK ACCESS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { href: '/chatbot', icon: Bot, label: 'AI Mentor' },
                  { href: '/dsa-visualizer', icon: Play, label: 'Visualizer' },
                  { href: '/voice-interview', icon: Mic, label: 'Voice Sim' },
                ].map(q => (
                  <Link key={q.href} href={q.href} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 6px', borderRadius: 8, background: '#0d0d14', border: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = G10; e.currentTarget.style.borderColor = G20 }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#0d0d14'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)' }}>
                    <q.icon size={20} strokeWidth={1.8} color="#888" />
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#888' }}>{q.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 40% */}
        <div style={{ flex: isMobile ? 'none' : '2 1 0', width: isMobile ? '100%' : undefined, minWidth: isMobile ? 0 : 280, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Card 0: Placement Profile */}
          {(() => {
            const tc = user?.target_companies || [];
            const hasCgpa = user?.cgpa != null;
            const months = user?.months_to_placement;
            const weak = user?.weak_subjects || [];
            const tier = user?.college_tier || 'tier3';
            const urgencyLabel = months <= 3 ? 'CRITICAL' : months <= 6 ? 'URGENT' : months ? 'OK' : null;
            const profileComplete = tc.length > 0 && hasCgpa;

            if (!profileComplete) return (
              <div style={{ ...cardBase, border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: AMBER, letterSpacing: 2, marginBottom: 8 }}><AlertTriangle size={11} strokeWidth={2} /> PLACEMENT PROFILE</div>
                <div style={{ fontSize: 13, color: '#9ba8b5', lineHeight: 1.6, marginBottom: 12 }}>
                  Complete your profile for personalized AI content — target companies, CGPA, and weak areas.
                </div>
                <a href="/profile" style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 8, background: AMBER, color: '#000', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>
                  Update Profile →
                </a>
              </div>
            );

            return (
              <div style={cardBase}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: G, letterSpacing: 2 }}><Target size={11} strokeWidth={2} /> YOUR PLACEMENT PROFILE</div>
                  <a href="/profile" style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: G, textDecoration: 'none' }}>Edit →</a>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#555' }}>TARGET:</span>
                    {tc.slice(0, 4).map(c => (
                      <span key={c} style={{ padding: '2px 8px', borderRadius: 20, background: G10, border: `1px solid ${G20}`, fontSize: 10, color: G, fontFamily: 'JetBrains Mono,monospace' }}>{c}</span>
                    ))}
                    {tc.length > 4 && <span style={{ fontSize: 10, color: '#555' }}>+{tc.length - 4}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#9ba8b5', fontFamily: 'JetBrains Mono,monospace' }}>
                    {hasCgpa && <span>CGPA: <span style={{ color: '#e8f4ff' }}>{user.cgpa}</span></span>}
                    <span>Tier: <span style={{ color: '#e8f4ff' }}>{tier.toUpperCase()}</span></span>
                    {urgencyLabel && months && <span>Timeline: <span style={{ color: urgencyLabel === 'CRITICAL' ? '#ff4545' : urgencyLabel === 'URGENT' ? AMBER : G }}>{urgencyLabel}</span></span>}
                  </div>
                  {weak.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#555', alignSelf: 'center' }}>WEAK:</span>
                      {weak.slice(0, 3).map(w => (
                        <span key={w} style={{ padding: '2px 7px', borderRadius: 20, background: 'rgba(251,191,36,0.1)', border: `1px solid rgba(251,191,36,0.25)`, fontSize: 9, color: AMBER, fontFamily: 'JetBrains Mono,monospace' }}>{w}</span>
                      ))}
                      {weak.length > 3 && <span style={{ fontSize: 9, color: '#555' }}>+{weak.length - 3}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Card 1: Daily Objectives */}
          <div style={cardBase}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: G, letterSpacing: 2, marginBottom: 12 }}><Target size={11} strokeWidth={2} /> DAILY OBJECTIVES</div>
            {objectives.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {objectives.slice(0, 3).map((obj, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 3, border: `1px solid ${G20}`, flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: G }}>
                      {allDone ? '✓' : ''}
                    </div>
                    <span style={{ fontSize: 12, color: '#9ba8b5', lineHeight: 1.5, fontFamily: 'Outfit,sans-serif' }}>{obj}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[1,2,3].map(i => <Skel key={i} h={16} />)}
              </div>
            )}
          </div>

          {/* Card 2: Key Concepts */}
          <div style={cardBase}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: G, letterSpacing: 2, marginBottom: 12 }}><Lightbulb size={11} strokeWidth={2} /> KEY CONCEPTS</div>
            {concepts.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {concepts.map((c, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${G20}`, fontSize: 11, color: G, background: G10, fontFamily: 'Outfit,sans-serif' }}>{c}</span>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[80, 100, 70, 90].map(w => <Skel key={w} h={24} w={w} />)}
              </div>
            )}
          </div>

          {/* Card 3: Coding Problem */}
          <div style={cardBase}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: G, letterSpacing: 2, marginBottom: 12 }}><Rocket size={11} strokeWidth={2} /> CODING PROBLEM</div>
            {coding?.title ? (
              <>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: G, marginBottom: 6 }}>{coding.title}</div>
                {coding.difficulty && (
                  <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${DIFF_COLORS[coding.difficulty] || AMBER}18`, color: DIFF_COLORS[coding.difficulty] || AMBER, fontFamily: 'JetBrains Mono,monospace', marginBottom: 10, display: 'inline-block' }}>
                    {coding.difficulty}
                  </span>
                )}
                {coding?.url && (
                  <div style={{ marginTop: 8 }}>
                    <a href={coding.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: G, fontFamily: 'Syne,sans-serif', fontWeight: 600, textDecoration: 'none' }}>→ Open Problem</a>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skel h={16} w="80%" />
                <Skel h={14} w="40%" />
              </div>
            )}
          </div>

          {/* Card 4: Your Rank */}
          <div style={cardBase}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: G, letterSpacing: 2, marginBottom: 12 }}><Trophy size={11} strokeWidth={2} /> YOUR RANK</div>
            {lbSlice.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {lbSlice.map((entry, i) => {
                  const isMe = entry.rank === myRank || entry.isMe
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 8, background: isMe ? G10 : 'transparent', border: isMe ? `1px solid ${G20}` : '1px solid transparent', transition: 'all 0.15s' }}>
                      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: isMe ? G : '#555', width: 24, textAlign: 'right', flexShrink: 0 }}>#{entry.rank}</span>
                      <span style={{ flex: 1, fontFamily: 'Outfit,sans-serif', fontSize: 12, color: isMe ? G : '#9ba8b5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(entry.name || 'Anonymous').slice(0, 12)}
                      </span>
                      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: isMe ? G : '#6b7a8d', flexShrink: 0 }}>{entry.score?.toLocaleString()}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: AMBER, flexShrink: 0 }}><Flame size={11} strokeWidth={2} color={AMBER} />{entry.streak}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[1,2,3].map(i => <Skel key={i} h={32} />)}
              </div>
            )}
            <Link href="/leaderboard" style={{ display: 'block', marginTop: 10, fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: G, textDecoration: 'none', textAlign: 'center' }}>
              View Full Leaderboard →
            </Link>
          </div>
        </div>
      </div>

      {/* ── MOTIVATION BAR ── */}
      <div style={{ background: BG2, border: `1px solid rgba(99,102,241,0.1)`, borderLeft: `3px solid ${G}`, borderRadius: 10, padding: '14px 20px', overflow: 'hidden' }}>
        <div key={motiveIdx} style={{ fontFamily: 'Outfit,sans-serif', fontSize: 13, color: '#9ba8b5', animation: 'motive-fade 5s ease-out forwards' }}>
          {currentMotive}
        </div>
      </div>

      <OnboardingTour />
    </div>
  )
}
