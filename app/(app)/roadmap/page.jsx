'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { roadmapAPI, taskAPI, testAPI, codingAPI, notesAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import CodeEditor from '@/components/CodeEditor';
import { toEmbedUrl } from '@/lib/youtubeEmbed';

// ── Shared Tailwind class tokens (native utilities only) ──
const CARD =
  'relative overflow-hidden rounded-2xl border border-primary/10 bg-[#070f1a] p-5';
const ACTION_BTN =
  'w-full cursor-pointer rounded-[10px] border-none bg-[linear-gradient(135deg,#00d9a3,#ff6b4a)] px-7 py-3.5 text-[15px] font-bold text-[#020812] transition-all hover:brightness-110 hover:shadow-[0_0_28px_rgba(0,217,163,0.35)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';
const EYEBROW =
  'font-mono text-[11px] font-extrabold uppercase tracking-[1px] text-muted';

function YouTubeEmbed({ url, title }) {
  const embedUrl = toEmbedUrl(url);
  if (!embedUrl)
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-[10px] border border-[#00ff88]/30 bg-[#00ff88]/10 px-5 py-3 text-sm font-semibold text-[#00ff88] no-underline transition-all hover:bg-[#00ff88]/20 focus-visible:outline-none"
      >
        ▶ Watch on YouTube →
      </a>
    );
  return (
    <div className="relative h-0 overflow-hidden rounded-xl border border-primary/15 pb-[56.25%]">
      <iframe
        src={embedUrl}
        title={title || 'Daily Roadmap Video'}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute left-0 top-0 h-full w-full"
      />
    </div>
  );
}

const STEPS = ['video', 'resource', 'coding', 'test', 'notes'];
const STEP_LABELS = {
  video: 'Watch Video',
  resource: 'Read Resource',
  coding: 'Coding Challenge',
  test: 'Daily Test',
  notes: 'AI Notes',
};

const MAX_DAY = 365;

export default function DailyRoadmapPage() {
  const { updateProgress } = useAuthStore();
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [tasks, setTasks] = useState([]);

  // Free navigation: the day currently on screen vs. the user's official day.
  const [viewDay, setViewDay] = useState(1);
  const [officialDay, setOfficialDay] = useState(1);
  const [navLoading, setNavLoading] = useState(false);

  // Roadmap overview (curriculum transparency) and skip-basics bypass
  const [overview, setOverview] = useState(null);
  const [showOverview, setShowOverview] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [test, setTest] = useState(null);
  const [testAnswers, setTestAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  const [codingTest, setCodingTest] = useState(null);
  const [code, setCode] = useState('// Write your solution here\n');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeResult, setCodeResult] = useState(null);
  const [codeLoading, setCodeLoading] = useState(false);

  const [noteType, setNoteType] = useState('theory');
  const [note, setNote] = useState(null);
  const [noteLoading, setNoteLoading] = useState(false);

  const [videoEligible, setVideoEligible] = useState(false);

  // Project submission states
  const [projectUrl, setProjectUrl] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [submittingProject, setSubmittingProject] = useState(false);
  const [projectProgress, setProjectProgress] = useState(null);

  useEffect(() => {
    loadDay(null); // null → the user's official current day
  }, []);

  // 30-second watch gate: enables "Mark as Watched" after user has had the video visible for 30s
  useEffect(() => {
    if (activeStep !== 0) {
      setVideoEligible(false);
      return;
    }
    setVideoEligible(false);
    const timer = setTimeout(() => setVideoEligible(true), 30000);
    return () => clearTimeout(timer);
  }, [activeStep]);

  useEffect(() => {
    if (daily?.projectProgress) {
      setProjectProgress(daily.projectProgress);
      const notes = daily.projectProgress.step_notes?.[0];
      if (notes?.githubUrl) setProjectUrl(notes.githubUrl);
      if (notes?.notes) setProjectNotes(notes.notes);
    }
  }, [daily]);

  // Load a specific day (or null for the official current day) WITHOUT losing
  // the day-navigation ability. Resets all per-day interaction state so a stale
  // test/code/note from the previous day doesn't bleed into the new one.
  async function loadDay(day) {
    setNavLoading(true);
    try {
      const res = day == null ? await roadmapAPI.getDaily() : await roadmapAPI.getDay(day);
      const d = res.data;
      setDaily(d);
      setTasks(d.tasks || []);
      setCodingTest(d.codingTest || null);
      setViewDay(d.currentDay);
      setOfficialDay(d.officialDay ?? d.currentDay);

      // Reset per-day sub-flows
      setActiveStep(0);
      setTest(null);
      setTestAnswers({});
      setTestResult(null);
      setCode('// Write your solution here\n');
      setCodeResult(null);
      setNote(null);
    } catch (err) {
      toast.error('Failed to load roadmap');
    } finally {
      setLoading(false);
      setNavLoading(false);
    }
  }

  // Force a fresh, personalized roadmap. Clears the server-side cache, then
  // reloads the current day so the new content generates immediately.
  async function handleRegenerate() {
    if (regenerating) return;
    setRegenerating(true);
    try {
      await roadmapAPI.regenerate();
      toast.success('Regenerating your roadmap…');
      await loadDay(null);
    } catch (err) {
      toast.error(err.message || 'Could not regenerate roadmap');
    } finally {
      setRegenerating(false);
    }
  }

  async function openOverview() {
    setShowOverview(true);
    if (!overview) {
      try {
        const res = await roadmapAPI.getOverview();
        setOverview(res.data);
      } catch {
        toast.error('Could not load roadmap overview');
      }
    }
  }

  async function handleSkipBasics() {
    setSkipping(true);
    try {
      const res = await roadmapAPI.skipBasics();
      toast.success(res.data.skipped ? 'Skipped to the BUILD phase 🚀' : 'Already past the basics');
      updateProgress({ current_day: res.data.currentDay });
      await loadDay(null);
    } catch (err) {
      toast.error(err.message || 'Could not skip basics');
    } finally {
      setSkipping(false);
    }
  }

  const isTaskDone = (type) => tasks.find((t) => t.type === type)?.status === 'completed';

  async function completeTask(type) {
    try {
      const res = await taskAPI.completeTask({ taskType: type, completed: true, day: daily.currentDay });
      setTasks((prev) => prev.map((t) => (t.type === type ? { ...t, status: 'completed', score: 20 } : t)));
      toast.success(`+20 pts!`);

      const currentIndex = STEPS.indexOf(type);
      const nextIndex = currentIndex + 1;
      if (nextIndex < STEPS.length) {
        setTimeout(() => setActiveStep(nextIndex), 800);
      }

      if (res.data.allDone) {
        const nextDay = daily.currentDay + 1;
        toast.success(`🎉 Day ${daily.currentDay} complete! Day ${nextDay} unlocked!`, { duration: 4000 });
        updateProgress({ current_day: nextDay });
        setDaily((d) => ({ ...d, dayUnlocked: true, newDay: nextDay }));
      }
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function generateTest() {
    setTestLoading(true);
    try {
      const res = await testAPI.generateDaily({ roadmapId: daily.roadmapItem.id, dayNumber: daily.currentDay });
      setTest(res.data);
    } catch {
      toast.error('Failed to generate test');
    } finally {
      setTestLoading(false);
    }
  }

  async function submitTest() {
    if (!test) return;
    setTestLoading(true);
    try {
      const answers = test.questions.map((_, i) => ({ answer: testAnswers[i] || '' }));
      const res = await testAPI.submit({ testId: test.testId, answers });
      setTestResult(res.data);
      await completeTask('test');
    } catch {
      toast.error('Failed to submit test');
    } finally {
      setTestLoading(false);
    }
  }

  async function submitCode() {
    setCodeLoading(true);
    try {
      const res = await codingAPI.submit({ codingTestId: codingTest.id, code, language: codeLanguage });
      setCodeResult(res.data);
      await completeTask('coding');
    } catch {
      toast.error('Code submission failed');
    } finally {
      setCodeLoading(false);
    }
  }

  async function generateNotes() {
    setNoteLoading(true);
    try {
      const res = await notesAPI.generate({ roadmapId: daily.roadmapItem.id, noteType });
      setNote(res.data.note);
      if (!isTaskDone('notes')) await completeTask('notes');
    } catch {
      toast.error('Failed to generate notes');
    } finally {
      setNoteLoading(false);
    }
  }

  const submitProject = async (e) => {
    e.preventDefault();
    if (!projectUrl || !projectUrl.includes('github.com')) {
      toast.error('Please enter a valid GitHub repository URL');
      return;
    }
    setSubmittingProject(true);
    try {
      const token = localStorage.getItem('genois_token');
      const res = await fetch('/api/projects/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectTitle: daily.project.title,
          githubUrl: projectUrl,
          week: daily.currentWeek,
          domain: daily.roadmapItem.domain_slug,
          notes: projectNotes,
          projectId: daily.project.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setProjectProgress({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          step_notes: [{ githubUrl: projectUrl, notes: projectNotes }],
        });
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Project submission failed');
    } finally {
      setSubmittingProject(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-400">Loading your roadmap...</div>;
  if (!daily) return <div className="text-sm text-gray-400">No roadmap found.</div>;

  const {
    roadmapItem,
    currentDay,
    currentWeek,
    dayUnlocked,
    newDay,
    objectives,
    keyConcepts,
    codingProblem,
    codingProblemUrl,
    isProjectDay,
    project,
  } = daily;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  // Find dynamic feedback if reviewed
  let aiFeedbackParsed = null;
  if (projectProgress?.ai_feedback) {
    try {
      aiFeedbackParsed =
        typeof projectProgress.ai_feedback === 'string'
          ? JSON.parse(projectProgress.ai_feedback)
          : projectProgress.ai_feedback;
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="w-full space-y-6 font-sans">
      {/* Top Banner Area */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-dark">
            Day {currentDay} — {roadmapItem?.topic}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Week {currentWeek} · {roadmapItem?.difficulty}
            {viewDay !== officialDay && (
              <span
                className={`ml-2 font-semibold ${
                  viewDay < officialDay ? 'text-success' : 'text-[#ffb020]'
                }`}
              >
                {viewDay < officialDay ? '· ✓ Completed day (revisiting)' : '· Upcoming — preview'}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={openOverview}
            className="cursor-pointer whitespace-nowrap rounded-[10px] border border-primary/25 bg-primary/10 px-4 py-2.5 font-display text-[13px] font-bold text-primary transition-all hover:border-primary/50 hover:bg-primary/20 active:scale-[0.97]"
          >
            🗺 View Full Path
          </button>
          <button
            onClick={handleRegenerate}
            disabled={regenerating || navLoading}
            title="Rebuild this roadmap from your current profile (target company, timeline, weak areas)"
            className="cursor-pointer whitespace-nowrap rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 font-display text-[13px] font-bold text-primary transition-all hover:enabled:border-primary/40 hover:enabled:bg-primary/10 active:enabled:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {regenerating ? 'Regenerating…' : '↻ Regenerate'}
          </button>
          <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-2 text-right">
            <div className="font-mono text-[11px] text-muted">GENERATION LAYER</div>
            <div className="text-[13px] font-bold uppercase text-primary">
              {daily.generatedBy || 'Supabase Cache'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── DAY NAVIGATION (free browsing — no locked progression) ─── */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => viewDay > 1 && loadDay(viewDay - 1)}
          disabled={viewDay <= 1 || navLoading}
          aria-label="Previous day"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-white/[0.08] bg-white/[0.03] text-base font-bold text-primary transition-all hover:enabled:border-primary/40 hover:enabled:bg-primary/10 active:enabled:scale-95 disabled:cursor-not-allowed disabled:text-[#3a4a5a]"
        >
          ‹
        </button>

        <div className="flex flex-1 gap-1.5 overflow-x-auto px-0.5 py-1">
          {Array.from({ length: Math.min(MAX_DAY, officialDay + 7) }, (_, i) => i + 1).map((d) => {
            const isCurrent = d === officialDay;
            const isViewing = d === viewDay;
            const isDone = d < officialDay;
            return (
              <button
                key={d}
                onClick={() => loadDay(d)}
                disabled={navLoading}
                title={
                  isDone ? `Day ${d} (completed)` : isCurrent ? `Day ${d} (current)` : `Day ${d} (upcoming)`
                }
                className={`h-9 min-w-[44px] flex-shrink-0 cursor-pointer rounded-[10px] font-mono text-xs font-bold transition-all hover:-translate-y-0.5 ${
                  isViewing
                    ? 'border-2 border-primary bg-primary/10 text-primary'
                    : isDone
                      ? 'border border-white/[0.08] bg-success/[0.08] text-success hover:border-success/40'
                      : isCurrent
                        ? 'border border-white/[0.08] bg-white/[0.02] text-[#ffb020] hover:border-[#ffb020]/40'
                        : 'border border-white/[0.08] bg-white/[0.02] text-muted hover:border-primary/40 hover:text-primary'
                }`}
              >
                {isDone ? '✓' : ''}
                {d}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => viewDay < MAX_DAY && loadDay(viewDay + 1)}
          disabled={viewDay >= MAX_DAY || navLoading}
          aria-label="Next day"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-white/[0.08] bg-white/[0.03] text-base font-bold text-primary transition-all hover:enabled:border-primary/40 hover:enabled:bg-primary/10 active:enabled:scale-95 disabled:cursor-not-allowed disabled:text-[#3a4a5a]"
        >
          ›
        </button>

        {viewDay !== officialDay && (
          <button
            onClick={() => loadDay(null)}
            disabled={navLoading}
            className="h-9 flex-shrink-0 cursor-pointer whitespace-nowrap rounded-[10px] border border-primary/25 bg-primary/10 px-3 text-xs font-bold text-primary transition-all hover:border-primary/50 hover:bg-primary/20 active:scale-[0.97]"
          >
            Jump to today
          </button>
        )}
      </div>

      {/* Skip Basics — only meaningful while the user is still in the foundation phase */}
      {officialDay <= 3 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#ffb020]/20 bg-[#ffb020]/[0.06] px-4 py-3">
          <div className="text-[13px] text-[#c8d8e8]">
            <strong className="text-[#ffb020]">Already know the basics?</strong> Skip the fundamentals and
            jump straight to Medium/Hard problems.
          </div>
          <button
            onClick={handleSkipBasics}
            disabled={skipping}
            className="flex-shrink-0 cursor-pointer rounded-[10px] border-none bg-[linear-gradient(135deg,#ffb020,#ff6b4a)] px-[18px] py-2.5 text-[13px] font-bold text-[#020812] transition-all hover:brightness-110 hover:shadow-[0_0_24px_rgba(255,176,32,0.35)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {skipping ? 'Skipping…' : 'Skip Basics →'}
          </button>
        </div>
      )}

      {/* Main Grid: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Flow & Tasks (2/3 width) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Day Unlock Alerts */}
          {dayUnlocked && (
            <div className="w-full rounded-xl border border-success bg-success/10 p-4 text-center text-dark shadow-[0_0_20px_rgba(29,158,117,0.2)]">
              <div className="text-lg font-bold">🎉 Day {currentDay} Complete! You earned 100 points!</div>
              <div className="mt-1 text-sm text-success">Day {newDay} is now unlocked</div>
            </div>
          )}

          {/* PROJECT DAY BANNER */}
          {isProjectDay && project && (
            <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-[linear-gradient(135deg,#091322,#070f1a)] p-6">
              <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(0,217,163,0.5),transparent)]" />

              <div className="mb-3 flex flex-wrap justify-between gap-2">
                <span className="rounded-full border border-[#ff6b4a]/30 bg-[#ff6b4a]/15 px-2.5 py-1 font-mono text-[11px] font-bold uppercase text-[#9d85ff]">
                  🚀 Project Week! Time to Build
                </span>
                <span className="text-[13px] font-semibold text-muted">
                  ⏱️ Est: {project.estimated_hours || 20} Hours
                </span>
              </div>

              <h2 className="font-display text-xl font-extrabold text-dark">{project.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[#8aa2b9]">{project.description}</p>

              {/* Steps */}
              <div className="mt-5">
                <div className="mb-2 text-[13px] font-bold uppercase tracking-[1px] text-muted">
                  Milestone Steps
                </div>
                <div className="flex flex-col gap-1.5">
                  {project.steps?.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3.5 py-2.5 text-[13px] text-[#c8d8e8]"
                    >
                      <span className="font-mono font-bold text-primary">0{idx + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* GitHub Submission Form */}
              <div className="mt-6 border-t border-white/[0.06] pt-5">
                <h3 className="mb-3 text-[15px] font-bold text-dark">Submit Your Code</h3>

                {projectProgress?.status === 'submitted' && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-[13px] text-primary">
                    ⏳ <strong>Under AI Review:</strong> Your project has been submitted successfully. A senior
                    AI mentor is currently reviewing your GitHub repository. Feedback and score adjustments will
                    appear below in 2-3 minutes!
                  </div>
                )}

                {projectProgress?.status === 'reviewed' && aiFeedbackParsed && (
                  <div className="rounded-xl border border-success/20 bg-success/5 p-4 text-dark">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-success">✅ AI Assessment Complete</span>
                      <span className="rounded-lg bg-success/20 px-3 py-1 text-base font-extrabold text-success">
                        {aiFeedbackParsed.grade} ({aiFeedbackParsed.score}/100)
                      </span>
                    </div>
                    <p className="mb-3 text-[13px] leading-relaxed text-[#a2b9cd]">
                      {aiFeedbackParsed.overall_feedback}
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="mb-1 font-bold text-success">Strengths</div>
                        {aiFeedbackParsed.strengths?.slice(0, 2).map((s, i) => (
                          <div key={i}>• {s}</div>
                        ))}
                      </div>
                      <div>
                        <div className="mb-1 font-bold text-[#ff5c8a]">Improvements</div>
                        {aiFeedbackParsed.improvements?.slice(0, 2).map((im, i) => (
                          <div key={i}>• {im}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {(!projectProgress || projectProgress.status === 'not_started') && (
                  <form onSubmit={submitProject} className="flex flex-col gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] uppercase text-muted">
                        GitHub Repository URL
                      </label>
                      <input
                        type="url"
                        required
                        value={projectUrl}
                        onChange={(e) => setProjectUrl(e.target.value)}
                        placeholder="https://github.com/yourusername/your-project"
                        className="w-full rounded-lg border border-primary/15 bg-white/[0.03] p-3 text-[13px] text-dark outline-none transition-all focus:border-primary/50 focus:bg-primary/5"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] uppercase text-muted">
                        Project Notes (Optional)
                      </label>
                      <textarea
                        value={projectNotes}
                        onChange={(e) => setProjectNotes(e.target.value)}
                        rows={2}
                        placeholder="Brief notes about your tech stack or challenges faced..."
                        className="w-full resize-none rounded-lg border border-primary/15 bg-white/[0.03] p-3 text-[13px] text-dark outline-none transition-all focus:border-primary/50 focus:bg-primary/5"
                      />
                    </div>
                    <button type="submit" disabled={submittingProject} className={ACTION_BTN}>
                      {submittingProject ? 'Submitting Code...' : 'Submit Repository for AI Audit →'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Navigation Steps Tabs */}
          <div className="flex flex-wrap gap-2">
            {STEPS.map((step, i) => {
              const done = isTaskDone(step);
              const active = activeStep === i;
              return (
                <button
                  key={step}
                  onClick={() => setActiveStep(i)}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-[0.97] ${
                    done
                      ? 'border-success/25 bg-success/10 text-success hover:bg-success/20'
                      : active
                        ? 'border-primary bg-primary text-[#020812] shadow-[0_0_16px_rgba(0,217,163,0.3)]'
                        : 'border-white/[0.08] bg-white/[0.03] text-muted hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {done ? '✓ ' : ''}
                  {STEP_LABELS[step]}
                </button>
              );
            })}
          </div>

          {/* Main Card View */}
          <div className="min-h-64 w-full rounded-2xl border border-primary/10 bg-[#070f1a] p-5">
            {activeStep === 0 && (
              <div className="space-y-4">
                <h3 className="section-title">▶ Watch Video — {roadmapItem?.topic}</h3>
                <p className="text-sm text-muted">
                  Watch the full video below. The completion button unlocks after 30 seconds.
                </p>
                {roadmapItem?.video_url ? (
                  <YouTubeEmbed url={roadmapItem.video_url} title={roadmapItem?.topic} />
                ) : (
                  <p className="text-sm text-gray-400">No video available for this day.</p>
                )}
                {!isTaskDone('video') ? (
                  <button
                    onClick={() => videoEligible && completeTask('video')}
                    disabled={!videoEligible}
                    className={`w-full cursor-pointer rounded-[10px] px-7 py-3.5 text-[15px] font-bold transition-all active:enabled:scale-[0.98] ${
                      videoEligible
                        ? 'border-none bg-[linear-gradient(135deg,#00ff88,#00cc66)] text-black hover:brightness-110'
                        : 'cursor-not-allowed border border-white/10 bg-white/[0.07] text-[#666]'
                    }`}
                  >
                    {videoEligible
                      ? '✓ Mark Video as Watched'
                      : '⏳ Watch at least 30 seconds to mark complete'}
                  </button>
                ) : (
                  <div className="text-sm font-medium text-success">✓ Completed!</div>
                )}
              </div>
            )}

            {activeStep === 1 && (
              <div className="space-y-4">
                <h3 className="section-title">📖 Read Resource — {roadmapItem?.topic}</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Documentation', url: roadmapItem?.resource_url },
                    { label: 'Article', url: roadmapItem?.article_url },
                  ]
                    .filter((r) => r.url)
                    .map((r) => (
                      <a
                        key={r.label}
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm font-medium text-dark transition-all hover:border-primary/40 hover:bg-primary/5"
                      >
                        📚 {r.label} ↗
                      </a>
                    ))}
                </div>
                {!isTaskDone('resource') ? (
                  <button onClick={() => completeTask('resource')} className={ACTION_BTN}>
                    ✓ Mark as Read
                  </button>
                ) : (
                  <div className="text-sm font-medium text-success">✓ Completed!</div>
                )}
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-4">
                <h3 className="section-title">{'{ }'} Coding Challenge</h3>
                {codingTest ? (
                  <>
                    <div className="rounded-xl bg-black/30 p-4">
                      <div className="mb-1.5 text-[15px] font-semibold text-dark">{codingTest.title}</div>
                      <p className="text-[13px] leading-relaxed text-[#c8d8e8]">{codingTest.problem}</p>
                      {codingTest.example_input && (
                        <div className="mt-3 rounded-lg bg-black/40 p-2.5 font-mono text-xs">
                          <div className="text-muted">
                            Input: <span className="text-primary">{codingTest.example_input}</span>
                          </div>
                          <div className="text-muted">
                            Output: <span className="text-success">{codingTest.example_output}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <CodeEditor
                      token={localStorage.getItem('genois_token')}
                      taskDescription={codingTest?.problem || 'Complete the coding challenge'}
                      expectedOutput={codingTest?.example_output || null}
                      onComplete={submitCode}
                      isCompleted={isTaskDone('coding') || !!codeResult}
                    />
                    {codeResult && (
                      <div className="space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <div className="flex gap-2">
                          <span
                            className={`badge ${codeResult.review?.isCorrect ? 'badge-success' : 'badge-danger'}`}
                          >
                            {codeResult.review?.isCorrect ? 'Correct' : 'Needs Work'}
                          </span>
                          <span className="badge badge-primary">Score: {codeResult.review?.score}/100</span>
                        </div>
                        <p className="text-sm text-[#a2b9cd]">{codeResult.review?.feedback}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-400">Loading coding challenge...</div>
                )}
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-4">
                <h3 className="section-title">✎ Daily Test — {roadmapItem?.topic}</h3>
                {!test && !testResult && (
                  <button onClick={generateTest} disabled={testLoading} className={ACTION_BTN}>
                    {testLoading ? 'Claude is generating...' : 'Generate 5 Questions'}
                  </button>
                )}
                {test && !testResult && (
                  <div className="space-y-4">
                    {test.questions.map((q, i) => (
                      <div key={i} className="space-y-2">
                        <p className="text-sm font-medium text-dark">
                          Q{i + 1}. {q.question}
                        </p>
                        <div className="space-y-1">
                          {q.options.map((opt) => (
                            <label
                              key={opt}
                              className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 transition-all ${
                                testAnswers[i] === opt[0]
                                  ? 'border-primary bg-primary/5'
                                  : 'border-white/[0.06] hover:border-primary/30'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q${i}`}
                                value={opt[0]}
                                onChange={(e) => setTestAnswers((a) => ({ ...a, [i]: e.target.value }))}
                                className="accent-primary"
                              />
                              <span className="text-sm text-[#c8d8e8]">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={submitTest}
                      disabled={testLoading || Object.keys(testAnswers).length < test.questions.length}
                      className={ACTION_BTN}
                    >
                      {testLoading ? 'Grading...' : 'Submit Test'}
                    </button>
                  </div>
                )}
                {testResult && (
                  <div className="space-y-3">
                    <div
                      className={`rounded-xl p-6 text-center ${
                        testResult.result === 'passed' ? 'bg-success/[0.08]' : 'bg-[#ffb020]/[0.08]'
                      }`}
                    >
                      <div
                        className={`text-4xl font-bold ${
                          testResult.result === 'passed' ? 'text-success' : 'text-[#ffb020]'
                        }`}
                      >
                        {testResult.score}%
                      </div>
                      <div className="mt-1 text-sm text-muted">
                        {testResult.correct}/{testResult.total} correct ·{' '}
                        {testResult.result === 'passed' ? '✅ Passed!' : '❌ Keep practicing'}
                      </div>
                    </div>
                    {testResult.feedback?.map((f, i) => (
                      <div
                        key={i}
                        className={`rounded-lg p-3 text-sm ${
                          f.isCorrect ? 'bg-success/5 text-success' : 'bg-danger/5 text-danger'
                        }`}
                      >
                        Q{i + 1}: {f.isCorrect ? '✓ Correct' : `✗ Correct: ${f.correctAnswer}`}
                        {f.explanation && <p className="mt-1 text-xs text-muted">{f.explanation}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeStep === 4 && (
              <div className="space-y-4">
                <h3 className="section-title">≡ AI Study Notes — {roadmapItem?.topic}</h3>
                <div className="flex gap-2">
                  {['theory', 'coding', 'full', 'revision'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setNoteType(t)}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-all active:scale-[0.97] ${
                        noteType === t
                          ? 'border-primary bg-primary text-[#020812]'
                          : 'border-white/[0.08] bg-white/[0.03] text-muted hover:border-primary/40 hover:text-primary'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {!note ? (
                  <button onClick={generateNotes} disabled={noteLoading} className={ACTION_BTN}>
                    {noteLoading ? 'Claude is writing notes...' : `Generate ${noteType} notes`}
                  </button>
                ) : (
                  <div className="whitespace-pre-wrap rounded-xl border border-primary/[0.08] bg-[#0a1628] p-5 text-sm leading-[1.9] text-dark">
                    {note.content}
                  </div>
                )}
                {isTaskDone('notes') && <div className="text-sm font-medium text-success">✓ Completed!</div>}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(completedCount / 5) * 100}%` }}
              />
            </div>
            <span className="whitespace-nowrap font-mono text-xs text-muted">{completedCount}/5 done</span>
          </div>
        </div>

        {/* Right Column: objectives, key concepts, coding problem (1/3 width) */}
        <div className="space-y-6">
          {/* Daily Objectives Card */}
          {objectives && objectives.length > 0 && (
            <div className={CARD}>
              <h3 className="mb-3.5 font-display text-sm font-extrabold uppercase tracking-[1px] text-dark">
                🎯 Daily Objectives
              </h3>
              <div className="flex flex-col gap-3">
                {objectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-[13px] leading-normal text-[#c8d8e8]">{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Concepts Card */}
          {keyConcepts && keyConcepts.length > 0 && (
            <div className={CARD}>
              <h3 className="mb-3 font-display text-sm font-extrabold uppercase tracking-[1px] text-dark">
                💡 Key Concepts
              </h3>
              <div className="flex flex-wrap gap-2">
                {keyConcepts.map((concept, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-[#a2b9cd]"
                  >
                    #{concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Coding Problem Spotlight */}
          {codingProblem && (
            <div className="relative overflow-hidden rounded-2xl border border-success/15 bg-[#070f1a] p-5">
              <div className="mb-2.5 flex items-center gap-2">
                <span className="text-base">💻</span>
                <h3 className="font-display text-sm font-extrabold uppercase tracking-[1px] text-dark">
                  Coding Problem
                </h3>
              </div>
              <p className="mb-3.5 text-[13px] leading-normal text-[#c8d8e8]">
                Validate today's skills by solving: <strong className="text-primary">{codingProblem}</strong>
              </p>
              {codingProblemUrl && (
                <a
                  href={codingProblemUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center rounded-lg border border-success/30 bg-success/[0.12] p-2.5 text-xs font-bold text-success no-underline transition-all hover:bg-success/20"
                >
                  Practice Problem ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── FULL ROADMAP OVERVIEW MODAL (curriculum transparency) ─── */}
      {showOverview && (
        <div
          onClick={() => setShowOverview(false)}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#020812]/85 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[86vh] w-full max-w-[680px] overflow-y-auto rounded-2xl border border-primary/15 bg-[#070f1a] p-6"
          >
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h2 className="font-display text-[22px] font-extrabold text-dark">
                  Your {overview?.domainName || ''} Roadmap
                </h2>
                {overview && (
                  <p className="mt-1 text-[13px] text-muted">
                    {overview.totalDays}-day path · ~{overview.dailyMinutes} min/day · progressive difficulty
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowOverview(false)}
                aria-label="Close"
                className="cursor-pointer border-none bg-transparent text-[22px] leading-none text-muted transition-colors hover:text-primary"
              >
                ×
              </button>
            </div>

            {!overview ? (
              <div className="py-6 text-center text-sm text-muted">Loading your full path…</div>
            ) : (
              <>
                {/* Macro phases */}
                <div className="my-4.5">
                  <div className={`${EYEBROW} mb-2.5 tracking-[1px]`}>THE JOURNEY</div>
                  <div className="flex flex-col gap-2">
                    {overview.macroPhases.map((p) => (
                      <div
                        key={p.key}
                        className="flex items-start gap-3 rounded-[10px] border border-white/[0.05] bg-white/[0.02] px-3.5 py-3"
                      >
                        <span className="min-w-[88px] flex-shrink-0 font-mono text-[11px] font-extrabold text-primary">
                          {p.key}
                        </span>
                        <div>
                          <div className="mb-0.5 font-mono text-xs text-[#ffb020]">{p.days}</div>
                          <div className="text-[13px] leading-normal text-[#c8d8e8]">{p.summary}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Topic focus per phase */}
                <div className="my-4.5">
                  <div className={`${EYEBROW} mb-2.5 tracking-[1px]`}>WHAT YOU&apos;LL COVER</div>
                  <div className="flex flex-col gap-1.5">
                    {overview.topics.map((t, i) => (
                      <div key={i} className="flex gap-2.5 text-[12.5px] leading-normal text-[#c8d8e8]">
                        <span className="min-w-[52px] flex-shrink-0 font-mono text-success">W{t.weeks}</span>
                        <span>{t.focus}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Projects */}
                {overview.projects?.length > 0 && (
                  <div className="my-4.5">
                    <div className={`${EYEBROW} mb-2.5 tracking-[1px]`}>PROJECTS YOU&apos;LL BUILD</div>
                    <div className="flex flex-wrap gap-1.5">
                      {overview.projects.map((p, i) => (
                        <span
                          key={i}
                          className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[11.5px] text-[#a2b9cd]"
                        >
                          W{p.week} · {p.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outcome */}
                <div className="mt-4.5 rounded-xl border border-success/20 bg-success/[0.06] px-4 py-3.5">
                  <div className={`${EYEBROW} mb-1.5 text-success tracking-[1px]`}>WHERE YOU&apos;LL LAND</div>
                  <div className="text-sm leading-relaxed text-dark">{overview.outcome}</div>
                </div>

                <button onClick={() => setShowOverview(false)} className={`${ACTION_BTN} mt-5`}>
                  Got it — let&apos;s go →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
