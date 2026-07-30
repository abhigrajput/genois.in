'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'
import { useToken } from '@/lib/useApi'
import TrialBanner from '@/components/TrialBanner'
import OnboardingTour from '@/components/OnboardingTour'
import { isProfileComplete } from '@/lib/profile'
import { toEmbedUrl } from '@/lib/youtubeEmbed'
import { Card, CardBody, SectionLabel, Badge, DifficultyBadge, Button, Input, Progress, Skeleton } from '@/components/ui'
import {
  Flame, Zap, Trophy, Play, BookOpen, Code2, ClipboardCheck, FileText, Target,
  Bot, Mic, Lightbulb, Rocket, Check, Sparkles, Mail, AlertTriangle, Settings, Brain,
} from 'lucide-react'

function YouTubeEmbed({ url, title }) {
  const embedUrl = toEmbedUrl(url);
  if (!embedUrl) return (
    <Button href={url} variant="outline" size="sm">
      <Play size={14} strokeWidth={2} /> Watch on YouTube
    </Button>
  );
  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 'var(--gx-radius)', overflow: 'hidden', border: '1px solid var(--gx-border)' }}>
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

// Token references — resolved from app/design-tokens.css so the page never
// hard-codes a palette value of its own.
const ACCENT = 'var(--gx-accent)'
const WARNING = 'var(--gx-warning)'
const TEXT = 'var(--gx-text)'
const TEXT_MUTED = 'var(--gx-text-muted)'
const TEXT_SUBTLE = 'var(--gx-text-subtle)'

// Light toast styling, scoped to this page. The global <Toaster> in app/layout.tsx
// is still dark for the un-migrated pages, so every toast raised here overrides it.
const TOAST_STYLE = {
  background: 'var(--gx-bg)',
  color: 'var(--gx-text)',
  border: '1px solid var(--gx-border)',
  boxShadow: 'var(--gx-shadow-md)',
  borderRadius: 'var(--gx-radius)',
  fontFamily: 'var(--gx-font-sans)',
  fontSize: '14px',
}

const TASK_BITS = { video: 1, resource: 2, coding: 4, test: 8, notes: 16 }
const TASK_META = [
  { type: 'video',    icon: Play,           label: 'Watch',  bit: 1  },
  { type: 'resource', icon: BookOpen,       label: 'Read',   bit: 2  },
  { type: 'coding',   icon: Code2,          label: 'Code',   bit: 4  },
  { type: 'test',     icon: ClipboardCheck, label: 'Test',   bit: 8  },
  { type: 'notes',    icon: FileText,       label: 'Notes',  bit: 16 },
]

function DayRing({ day, size = 72 }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(day / 365, 1)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ display: 'block' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--gx-surface-2)" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ACCENT} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="gx-num" style={{ fontFamily: 'var(--gx-font-display)', fontSize: size > 60 ? 20 : 15, fontWeight: 700, color: TEXT, lineHeight: 1 }}>{day}</span>
        <span className="gx-num" style={{ fontSize: 9, color: TEXT_SUBTLE, marginTop: 1 }}>/ 365</span>
      </div>
    </div>
  )
}

function Skel({ h = 60, w = '100%' }) {
  return <Skeleton h={h} w={w} />
}

function Confetti({ show }) {
  if (!show) return null
  const colors = ['#00805e', '#00d9a3', '#a25f00', '#0b5fa5', '#52b795']
  const particles = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * 360
    const dist = 70 + (i % 4) * 26
    const tx = Math.cos((angle * Math.PI) / 180) * dist
    const ty = Math.sin((angle * Math.PI) / 180) * dist - 50
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
        <div key={a.id} className="pts-float gx-num" style={{
          position: 'fixed', bottom: '25%', left: '55%',
          fontFamily: 'var(--gx-font-display)', fontSize: 20, fontWeight: 700,
          color: ACCENT, zIndex: 9999,
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
  const [submittingProject, setSubmittingProject] = useState(false)
  const [projectDone, setProjectDone] = useState(false)
  const [calendarData, setCalendarData] = useState([])
  const [isMobile, setIsMobile] = useState(false)
  const [insight, setInsight] = useState(null)

  // Gate the dashboard on a complete profile. An incomplete one (missing domain,
  // college, or target company — e.g. a fresh Google sign-in) gets a generic
  // default roadmap, so route them into onboarding to finish setup first.
  useEffect(() => {
    if (user && !isProfileComplete(user)) router.push('/onboarding?from=google')
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

      // /api/roadmap/daily returns { roadmapItem: { video_url, resource_url,
      // coding_problem, ... }, codingProblem, objectives, ... } but this card
      // renders a FLATTENED shape ({ topic, video:{url,title}, resource:{url},
      // coding:{title,url,difficulty} }). Without this map the Today card showed
      // a placeholder topic and no video. Spread rd first so nothing else breaks.
      const ri = rd.roadmapItem || {}
      const DIFF_MAP = { beginner: 'Easy', intermediate: 'Medium', advanced: 'Hard', expert: 'Hard' }
      const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
      const mappedRoadmap = {
        ...rd,
        topic: ri.topic || rd.topic,
        description: ri.description,
        week: rd.currentWeek || rd.week,
        level: cap(ri.difficulty) || 'Beginner',
        objectives: rd.objectives || ri.objectives || [],
        keyConcepts: rd.keyConcepts || ri.key_concepts || [],
        isProjectDay: rd.isProjectDay ?? ri.is_project_day ?? false,
        project: rd.project || ri.project || {},
        video: ri.video_url ? { url: ri.video_url, title: ri.topic, description: ri.description } : {},
        resource: ri.resource_url ? { url: ri.resource_url, title: 'Learning Resource' } : {},
        coding: {
          title: (rd.codingProblem || ri.coding_problem) ? "Today's Challenge" : undefined,
          description: rd.codingProblem || ri.coding_problem || '',
          url: rd.codingProblemUrl || ri.coding_problem_url || ri.doc_url || '',
          difficulty: DIFF_MAP[ri.difficulty] || 'Medium',
        },
        notes: {},
      }

      setAnalytics(ad)
      setRoadmap(mappedRoadmap)
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

    // AI Mentor insight — one personalized nudge from the student's real data
    fetch('/api/mentor/insight', { headers: h })
      .then(r => r.json())
      .then(d => { const i = d?.data?.insight || d?.insight; if (i) setInsight(i) })
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

    const prevCount = TASK_META.filter(tm => completedMask & tm.bit).length
    if (prevCount === 0 && newMask > 0 && !shown[`first_${dk}`]) {
      toast.success('First task done! Keep going', { style: TOAST_STYLE })
      shown[`first_${dk}`] = true
    }
    if (newMask === 31 && !shown[`all_${dk}`]) {
      const day = analytics?.progress?.currentDay || 1
      toast.success(`Day ${day} complete! +100 bonus pts`, { style: TOAST_STYLE, duration: 5000 })
      shown[`all_${dk}`] = true
    }
    const total = analytics?.score?.total_score || 0
    for (const th of [1000, 5000, 10000]) {
      if (total < th && total + 20 >= th && !shown[`score_${th}`]) {
        toast.success(`${th.toLocaleString()} pts milestone!`, { style: TOAST_STYLE })
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
        body: JSON.stringify({ day: currentDay, taskType, completed: true }),
      })
      checkAchievements(newMask)
      if (newMask === 31) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000) }
    } catch {
      setCompletedMask(completedMask)
      toast.error('Failed to save progress', { style: TOAST_STYLE })
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
      toast.success('Notes generated!', { style: TOAST_STYLE })
      // Mark notes as done after generation
      completeTask('notes')
    } catch {
      toast.error('Could not generate notes', { style: TOAST_STYLE })
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

  // Project already submitted? Reflect server state (from /api/roadmap/daily)
  // or a submission made this session.
  const projectProgress = rm?.projectProgress || null
  const projectSubmitted = projectDone || ['submitted', 'reviewed'].includes(projectProgress?.status)

  // Submit the project's GitHub repo straight from the dashboard — same endpoint
  // and payload the /roadmap project form uses. Defined after the derived vars
  // (week/project/user) so it can close over them without a TDZ error.
  async function submitDashboardProject() {
    if (!token || submittingProject) return
    if (!githubInput || !githubInput.includes('github.com')) {
      toast.error('Enter a valid GitHub repository URL', { style: TOAST_STYLE })
      return
    }
    if (!project?.id) {
      toast.error('Project isn\'t ready yet — open the Roadmap to submit.', { style: TOAST_STYLE })
      return
    }
    setSubmittingProject(true)
    try {
      const res = await fetch('/api/projects/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          projectTitle: project.title,
          githubUrl: githubInput,
          week,
          domain: user?.domain_slug,
          notes: '',
          projectId: project.id,
        }),
      })
      const d = await res.json()
      if (d.success) {
        toast.success(d.data?.message || 'Project submitted! AI review incoming.', { style: TOAST_STYLE })
        setProjectDone(true)
      } else {
        toast.error(d.message || 'Submission failed', { style: TOAST_STYLE })
      }
    } catch {
      toast.error('Project submission failed', { style: TOAST_STYLE })
    } finally {
      setSubmittingProject(false)
    }
  }

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

  // 30-day calendar grid — REAL days only. No synthesized activity: when the
  // API has no calendar data the card shows an empty state instead of a grid
  // invented from the streak count.
  const cal30 = calendarData

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

    if (activeTask === 'video') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {video?.title && <div style={{ fontFamily: 'var(--gx-font-display)', fontSize: 15, fontWeight: 600, color: TEXT }}>{video.title}</div>}
        {video?.description && <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6 }}>{video.description}</div>}
        {video?.url
          ? <YouTubeEmbed url={video.url} title={video.title} />
          : <div style={{ fontSize: 13, color: TEXT_SUBTLE }}>No video available for today.</div>}
        {!done && (
          <Button
            block
            variant={videoEligible ? 'primary' : 'secondary'}
            onClick={() => videoEligible && completeTask('video')}
            disabled={!videoEligible}
          >
            {videoEligible ? 'Mark Video as Watched' : 'Watch 30 seconds to unlock…'}
          </Button>
        )}
      </div>
    )

    if (activeTask === 'resource') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {resource?.title && <div style={{ fontFamily: 'var(--gx-font-display)', fontSize: 15, fontWeight: 600, color: TEXT }}>{resource.title}</div>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {resource?.url && (
            <Button href={resource.url} variant={done ? 'outline' : 'primary'}>
              <BookOpen size={15} strokeWidth={2} /> Open Resource
            </Button>
          )}
          {!done && <Button variant="secondary" onClick={() => completeTask('resource')}>Mark Complete</Button>}
        </div>
      </div>
    )

    if (activeTask === 'coding') {
      const diff = coding?.difficulty || 'Medium'
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {coding?.title && <div style={{ fontFamily: 'var(--gx-font-display)', fontSize: 15, fontWeight: 600, color: TEXT }}>{coding.title}</div>}
            <DifficultyBadge level={diff} />
          </div>
          {coding?.description && <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6 }}>{coding.description}</div>}
          {coding?.codeSnippet && (
            <pre className="gx-code" style={{ maxHeight: 120 }}>{coding.codeSnippet}</pre>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {coding?.url && (
              <Button href={coding.url} variant={done ? 'outline' : 'primary'}>
                <Code2 size={15} strokeWidth={2} /> Solve Problem
              </Button>
            )}
            {!done && <Button variant="secondary" onClick={() => completeTask('coding')}>Mark Complete</Button>}
          </div>
        </div>
      )
    }

    if (activeTask === 'test') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 13, color: TEXT_MUTED }}>Take today&apos;s test to earn bonus points and check your understanding.</div>
        <Button href="/tests" variant={done ? 'outline' : 'primary'}>
          <ClipboardCheck size={15} strokeWidth={2} /> Take Today&apos;s Test
        </Button>
      </div>
    )

    if (activeTask === 'notes') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
        {notes?.content ? (
          <div className="gx-well" style={{ padding: '12px 14px', fontSize: 13, color: TEXT_MUTED, lineHeight: 1.7, maxHeight: 140, overflow: 'auto', width: '100%' }}>
            {notes.content}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: TEXT_MUTED }}>AI-generated summary notes for today&apos;s topic.</div>
        )}
        {!notes?.content && (
          <Button onClick={generateNotes} disabled={generatingNotes}>
            {generatingNotes ? 'Generating…' : <><Sparkles size={15} strokeWidth={2} /> Generate Notes</>}
          </Button>
        )}
        {notes?.content && !done && (
          <Button variant="secondary" onClick={() => completeTask('notes')}>Mark Complete</Button>
        )}
      </div>
    )

    return null
  }

  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FloatAnim items={floatAnims} />
      <Confetti show={showConfetti} />

      <TrialBanner />

      {/* Email verification */}
      {user?.email_verified === false && (
        <div className="gx-alert gx-alert--danger" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Mail size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
            Please verify your email to unlock all features
          </span>
          <Button size="sm" variant="danger" onClick={async () => {
            try { await fetch('/api/auth/resend-verification', { method: 'POST', headers: { Authorization: 'Bearer ' + token } }); toast.success('Verification email sent!', { style: TOAST_STYLE }) }
            catch { toast.error('Failed to send', { style: TOAST_STYLE }) }
          }}>
            Resend
          </Button>
        </div>
      )}

      {/* Streak at risk */}
      {streakAtRisk && (
        <div className="gx-alert gx-alert--warning">
          <AlertTriangle size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
          Complete at least 1 task to keep your streak alive tonight.
        </div>
      )}

      {/* Admin link */}
      {isAdmin && (
        <Button href="/admin" variant="outline" size="sm" style={{ alignSelf: 'flex-start' }}>
          <Settings size={14} strokeWidth={2} /> Admin Dashboard
        </Button>
      )}

      {/* DSA Diagnostic banner */}
      {user?.domain_slug === 'dsa' && analytics?.diagnosticStatus === false && (
        <Card accent interactive padded onClick={() => router.push('/diagnostic')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <SectionLabel icon={Target} style={{ color: ACCENT, marginBottom: 6 }}>Recommended</SectionLabel>
              <div style={{ fontFamily: 'var(--gx-font-display)', fontSize: 16, fontWeight: 600, color: TEXT }}>Take the DSA Diagnostic to get your level</div>
              <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 3 }}>15 questions · 10 min · Sets your personalized track</div>
            </div>
            <span className="gx-btn gx-btn--primary">Start Now</span>
          </div>
        </Card>
      )}

      {/* ── HERO STATS BAR ── */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 16 : 0 }}>
          {/* Day */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, padding: isMobile ? '14px 14px 0' : '18px 24px' }}>
            <DayRing day={currentDay} size={isMobile ? 54 : 66} />
            <div>
              <span className="gx-stat__label">Current Day</span>
              <span className="gx-num" style={{ fontSize: 13, color: TEXT_MUTED }}>{Math.round((currentDay / 365) * 100)}% complete</span>
            </div>
          </div>

          {/* Streak */}
          <div style={{ padding: isMobile ? '14px 14px 0' : '18px 24px', borderLeft: isMobile ? 'none' : '1px solid var(--gx-border-subtle)' }}>
            <span className="gx-stat__label">Streak</span>
            <span className="gx-stat__value" style={{ color: streak > 0 ? WARNING : TEXT_SUBTLE, fontSize: isMobile ? 22 : 26 }}>
              {streak > 0 && <Flame size={isMobile ? 19 : 22} strokeWidth={2} />}{streak}
            </span>
            <span className="gx-stat__meta" style={{ color: streak > 0 ? WARNING : TEXT_SUBTLE }}>
              {streak === 0 ? 'Start today' : streak >= 30 ? 'On fire' : streak === 1 ? 'day' : 'days'}
            </span>
            {streakAtRisk && streak > 0 && doneTasks === 0 && (
              <span className="gx-badge gx-badge--danger" style={{ marginTop: 6 }}>
                <AlertTriangle size={10} strokeWidth={2.2} /> At risk
              </span>
            )}
          </div>

          {/* Score */}
          <div style={{ padding: isMobile ? '0 14px 14px' : '18px 24px', borderLeft: isMobile ? 'none' : '1px solid var(--gx-border-subtle)' }}>
            <span className="gx-stat__label">Score</span>
            <span className="gx-stat__value" style={{ color: ACCENT, fontSize: isMobile ? 22 : 26 }}>
              <Zap size={isMobile ? 19 : 22} strokeWidth={2} /> {totalScore.toLocaleString()}
            </span>
            {doneTasks > 0
              ? <span className="gx-badge gx-badge--accent gx-num" style={{ marginTop: 6 }}>+{doneTasks * 20} today</span>
              : <span className="gx-stat__meta">0 today</span>}
          </div>

          {/* Rank */}
          <div style={{ padding: isMobile ? '0 14px 14px' : '18px 24px', borderLeft: isMobile ? 'none' : '1px solid var(--gx-border-subtle)' }}>
            <span className="gx-stat__label">Rank</span>
            <span className="gx-stat__value" style={{ fontSize: isMobile ? 22 : 26 }}>
              <Trophy size={isMobile ? 19 : 22} strokeWidth={2} color={ACCENT} /> {myRank ? `#${myRank}` : '—'}
            </span>
            {percentile && <span className="gx-stat__meta">Top {100 - percentile}%</span>}
          </div>
        </div>
      </Card>

      {/* ── MAIN 60/40 ── */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, alignItems: 'flex-start' }}>

        {/* LEFT 60% */}
        <div style={{ flex: isMobile ? 'none' : '3 1 0', width: isMobile ? '100%' : undefined, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* TODAY'S MISSION CARD */}
          <Card accent>
            <CardBody>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <SectionLabel style={{ color: ACCENT }}>Today&apos;s Mission</SectionLabel>
                  <Badge tone="accent">Day {currentDay}</Badge>
                </div>
                <Link href="/roadmap" className="gx-link" style={{ fontSize: 13 }}>Full Roadmap →</Link>
              </div>

              {/* PROJECT DAY */}
              {isProjectDay ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontFamily: 'var(--gx-font-display)', fontSize: 20, fontWeight: 700, color: TEXT }}>{project?.title || 'Project Day'}</div>
                  {project?.description && <div style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 1.7 }}>{project.description}</div>}
                  {project?.estimatedHours && (
                    <Badge tone="warning" style={{ alignSelf: 'flex-start' }}>~{project.estimatedHours}h estimated</Badge>
                  )}
                  {project?.steps?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {project.steps.map((s, i) => (
                        <div key={i} className="gx-well" style={{ display: 'flex', gap: 10, padding: '9px 12px' }}>
                          <span className="gx-num" style={{ color: ACCENT, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                          <span style={{ fontSize: 13, color: TEXT }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {projectSubmitted ? (
                    <div className="gx-alert gx-alert--success">
                      <Check size={16} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                      {projectProgress?.status === 'reviewed'
                        ? 'Reviewed — see feedback on the Roadmap page.'
                        : 'Submitted! AI review will be ready in 2-3 minutes.'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <Input
                        value={githubInput}
                        onChange={e => setGithubInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') submitDashboardProject() }}
                        placeholder="https://github.com/you/your-project"
                        aria-label="GitHub repository URL"
                        style={{ flex: 1, minWidth: 200, width: 'auto' }}
                      />
                      <Button onClick={submitDashboardProject} disabled={submittingProject}>
                        {submittingProject ? 'Submitting…' : 'Submit on GitHub'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Topic header */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: 'var(--gx-font-display)', fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 8, lineHeight: 1.25 }}>{topic}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Badge tone="neutral">Week {week}</Badge>
                      <DifficultyBadge level={level} />
                    </div>
                  </div>

                  {/* Task switcher */}
                  <div className="gx-segment" style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 16 }}>
                    {TASK_META.map(tm => {
                      const isDone = !!(completedMask & tm.bit)
                      const isActive = activeTask === tm.type
                      return (
                        <button
                          key={tm.type}
                          onClick={() => setActiveTask(tm.type)}
                          className="gx-segment__item"
                          aria-selected={isActive}
                          data-done={isDone}
                          role="tab"
                        >
                          <tm.icon size={14} strokeWidth={2} />
                          <span>{tm.label}</span>
                          {isDone && <Check size={12} strokeWidth={2.5} />}
                        </button>
                      )
                    })}
                  </div>

                  {/* Active task content */}
                  <div className="gx-well" style={{ padding: 16, marginBottom: 16, minHeight: 80 }}>
                    <TaskContent />
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span className="gx-num" style={{ fontSize: 13, color: TEXT_MUTED }}>{doneTasks} / 5 tasks done</span>
                      {allDone && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: ACCENT }}>
                          <Check size={13} strokeWidth={2.5} /> All done
                        </span>
                      )}
                    </div>
                    <Progress value={doneTasks} max={5} label="Tasks completed today" />
                  </div>

                  {/* CTA button */}
                  <Button
                    block
                    size="lg"
                    onClick={() => { if (allDone) router.push('/roadmap'); else if (nextTask) { setActiveTask(nextTask.type); completeTask(nextTask.type) } }}
                  >
                    {allDone ? 'Day Complete — See Tomorrow' : `Start ${nextTask?.label || 'Next'}`}
                  </Button>
                </>
              )}
            </CardBody>
          </Card>

          {/* 3 MINI CARDS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>

            {/* Week Progress */}
            <Card padded>
              <SectionLabel style={{ marginBottom: 12 }}>Week Progress</SectionLabel>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
                {weekDays.map((d, i) => {
                  const dayNum = weekStart + i
                  const isToday = dayNum === currentDay
                  const isPast = dayNum < currentDay
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: isToday ? 'var(--gx-accent)' : isPast ? 'var(--gx-accent-soft)' : 'var(--gx-surface-2)',
                        border: isToday ? 'none' : isPast ? '1px solid var(--gx-accent-border)' : '1px solid var(--gx-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700,
                        color: isToday ? 'var(--gx-text-inverse)' : isPast ? ACCENT : TEXT_SUBTLE,
                      }}>
                        {isPast ? '✓' : ''}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: isToday ? 600 : 400, color: isToday ? ACCENT : TEXT_SUBTLE }}>{d}</span>
                    </div>
                  )
                })}
              </div>
              <div className="gx-num" style={{ marginTop: 10, fontSize: 12, color: TEXT_SUBTLE }}>
                Week {week} · Day {currentDay}
              </div>
            </Card>

            {/* Streak Calendar */}
            <Card padded>
              <SectionLabel style={{ marginBottom: 12 }}>30-Day Activity</SectionLabel>
              {cal30.length === 0 ? (
                <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6 }}>
                  Complete tasks to build your activity history.
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
                    {cal30.map((d, i) => {
                      const isToday = d.isToday ?? (i === cal30.length - 1)
                      const count = d.count ?? (d.done ? 1 : 0)
                      // Fill always follows real activity — today is marked by its
                      // ring, not by being painted green for free. A mentor-only
                      // day (no task completions) reads as the lightest level.
                      const level = count >= 3 ? 3 : count >= 2 ? 2 : count >= 1 || d.mentor ? 1 : 0
                      const did = [count > 0 && `${count} task${count === 1 ? '' : 's'}`, d.mentor && 'mentor session'].filter(Boolean)
                      return (
                        <div
                          key={d.date || i}
                          className="gx-heat-cell"
                          title={d.date ? `${d.date}: ${did.join(' + ') || 'no activity'}` : undefined}
                          style={{
                            background: `var(--gx-heat-${level})`,
                            boxShadow: isToday ? `inset 0 0 0 1.5px var(--gx-accent)` : undefined,
                          }}
                        />
                      )
                    })}
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 5, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: TEXT_SUBTLE }}>Less</span>
                    {[0, 1, 2, 3].map(l => (
                      <div key={l} className="gx-heat-cell" style={{ width: 10, height: 10, background: `var(--gx-heat-${l})` }} />
                    ))}
                    <span style={{ fontSize: 11, color: TEXT_SUBTLE }}>More</span>
                  </div>
                </>
              )}
            </Card>

            {/* Quick Access */}
            <Card padded>
              <SectionLabel style={{ marginBottom: 12 }}>Quick Access</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { href: '/chatbot', icon: Bot, label: 'AI Mentor' },
                  { href: '/dsa-visualizer', icon: Play, label: 'Visualizer' },
                  { href: '/voice-interview', icon: Mic, label: 'Voice Sim' },
                ].map(q => (
                  <Link
                    key={q.href}
                    href={q.href}
                    className="gx-well"
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '12px 6px', textDecoration: 'none', color: TEXT_MUTED,
                      transition: 'background-color var(--gx-transition), border-color var(--gx-transition), color var(--gx-transition)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--gx-accent-soft)'; e.currentTarget.style.borderColor = 'var(--gx-accent-border)'; e.currentTarget.style.color = 'var(--gx-accent)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = TEXT_MUTED }}
                  >
                    <q.icon size={19} strokeWidth={1.8} />
                    <span style={{ fontSize: 11, fontWeight: 500, textAlign: 'center' }}>{q.label}</span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* RIGHT 40% */}
        <div style={{ flex: isMobile ? 'none' : '2 1 0', width: isMobile ? '100%' : undefined, minWidth: isMobile ? 0 : 280, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Card: AI Mentor Insight — one personalized nudge, refreshes daily */}
          <Card accent padded>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ width: 24, height: 24, borderRadius: 'var(--gx-radius-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gx-accent-soft)', color: ACCENT, flexShrink: 0 }}>
                <Brain size={14} strokeWidth={2} />
              </span>
              <SectionLabel style={{ color: ACCENT }}>Your AI Mentor</SectionLabel>
            </div>
            {insight ? (
              <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.6 }}>{insight}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skel h={14} /><Skel h={14} w="75%" />
              </div>
            )}
          </Card>

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
              <Card padded>
                <SectionLabel icon={AlertTriangle} style={{ color: WARNING, marginBottom: 10 }}>Placement Profile</SectionLabel>
                <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6, marginBottom: 12 }}>
                  Complete your profile for personalized AI content — target companies, CGPA, and weak areas.
                </div>
                <Button href="/profile" size="sm">Update Profile</Button>
              </Card>
            );

            return (
              <Card padded>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <SectionLabel icon={Target}>Your Placement Profile</SectionLabel>
                  <Link href="/profile" className="gx-link" style={{ fontSize: 12 }}>Edit</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: TEXT_SUBTLE }}>Target:</span>
                    {tc.slice(0, 4).map(c => <Badge key={c} tone="accent">{c}</Badge>)}
                    {tc.length > 4 && <span style={{ fontSize: 12, color: TEXT_SUBTLE }}>+{tc.length - 4}</span>}
                  </div>
                  <div className="gx-num" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: TEXT_MUTED }}>
                    {hasCgpa && <span>CGPA: <strong style={{ color: TEXT, fontWeight: 600 }}>{user.cgpa}</strong></span>}
                    <span>Tier: <strong style={{ color: TEXT, fontWeight: 600 }}>{tier.toUpperCase()}</strong></span>
                    {urgencyLabel && months && (
                      <span>Timeline: <strong style={{ fontWeight: 600, color: urgencyLabel === 'CRITICAL' ? 'var(--gx-danger)' : urgencyLabel === 'URGENT' ? WARNING : ACCENT }}>{urgencyLabel}</strong></span>
                    )}
                  </div>
                  {weak.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: TEXT_SUBTLE }}>Weak:</span>
                      {weak.slice(0, 3).map(w => <Badge key={w} tone="warning">{w}</Badge>)}
                      {weak.length > 3 && <span style={{ fontSize: 12, color: TEXT_SUBTLE }}>+{weak.length - 3}</span>}
                    </div>
                  )}
                </div>
              </Card>
            );
          })()}

          {/* Card 1: Daily Objectives */}
          <Card padded>
            <SectionLabel icon={Target} style={{ marginBottom: 12 }}>Daily Objectives</SectionLabel>
            {objectives.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {objectives.slice(0, 3).map((obj, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{
                      width: 16, height: 16, borderRadius: 'var(--gx-radius-sm)', flexShrink: 0, marginTop: 1,
                      border: `1px solid ${allDone ? 'var(--gx-accent)' : 'var(--gx-border-strong)'}`,
                      background: allDone ? 'var(--gx-accent)' : 'transparent',
                      color: 'var(--gx-text-inverse)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {allDone && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5 }}>{obj}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[1,2,3].map(i => <Skel key={i} h={16} />)}
              </div>
            )}
          </Card>

          {/* Card 2: Key Concepts */}
          <Card padded>
            <SectionLabel icon={Lightbulb} style={{ marginBottom: 12 }}>Key Concepts</SectionLabel>
            {concepts.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {concepts.map((c, i) => <Badge key={i} tone="neutral">{c}</Badge>)}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[80, 100, 70, 90].map(w => <Skel key={w} h={22} w={w} />)}
              </div>
            )}
          </Card>

          {/* Card 3: Coding Problem */}
          <Card padded>
            <SectionLabel icon={Rocket} style={{ marginBottom: 12 }}>Coding Problem</SectionLabel>
            {coding?.title ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 8 }}>{coding.title}</div>
                {coding.difficulty && <DifficultyBadge level={coding.difficulty} />}
                {coding?.url && (
                  <div style={{ marginTop: 12 }}>
                    <a href={coding.url} target="_blank" rel="noopener noreferrer" className="gx-link" style={{ fontSize: 13 }}>Open Problem →</a>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skel h={16} w="80%" />
                <Skel h={14} w="40%" />
              </div>
            )}
          </Card>

          {/* Card 4: Your Rank */}
          <Card padded>
            <SectionLabel icon={Trophy} style={{ marginBottom: 12 }}>Your Rank</SectionLabel>
            {lbSlice.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {lbSlice.map((entry, i) => {
                  const isMe = entry.rank === myRank || entry.isMe
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
                      borderRadius: 'var(--gx-radius-sm)',
                      background: isMe ? 'var(--gx-accent-soft)' : 'transparent',
                      border: `1px solid ${isMe ? 'var(--gx-accent-border)' : 'transparent'}`,
                    }}>
                      <span className="gx-num" style={{ fontSize: 12, fontWeight: 600, color: isMe ? ACCENT : TEXT_SUBTLE, width: 26, textAlign: 'right', flexShrink: 0 }}>#{entry.rank}</span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: isMe ? 600 : 400, color: isMe ? ACCENT : TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(entry.name || 'Anonymous').slice(0, 14)}
                      </span>
                      <span className="gx-num" style={{ fontSize: 12, color: isMe ? ACCENT : TEXT_MUTED, flexShrink: 0 }}>{entry.score?.toLocaleString()}</span>
                      <span className="gx-num" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, color: WARNING, flexShrink: 0 }}>
                        <Flame size={11} strokeWidth={2} />{entry.streak}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[1,2,3].map(i => <Skel key={i} h={30} />)}
              </div>
            )}
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <Link href="/leaderboard" className="gx-link" style={{ fontSize: 13 }}>View Full Leaderboard →</Link>
            </div>
          </Card>
        </div>
      </div>

      {/* ── MOTIVATION BAR ── */}
      <Card muted flat style={{ borderLeft: '3px solid var(--gx-accent)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px' }}>
          <div key={motiveIdx} style={{ fontSize: 14, color: TEXT_MUTED, animation: 'motive-fade 5s ease-out forwards' }}>
            {currentMotive}
          </div>
        </div>
      </Card>

      <OnboardingTour />
    </div>
  )
}
