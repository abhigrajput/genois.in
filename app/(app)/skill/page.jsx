'use client';
import { useEffect, useState } from 'react';
import { analyticsAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

const SKILL_COLORS = { beginner:'var(--gx-text-muted)', intermediate:'var(--gx-info)', advanced:'var(--gx-success)', job_ready:'var(--gx-info)' };
const MILESTONES = [{label:'Beginner',min:0},{label:'Intermediate',min:25},{label:'Advanced',min:50},{label:'Job Ready',min:80}];

export default function SkillIdentityPage() {
  const { user } = useAuthStore();
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getSkillIdentity().then(r => setSkill(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card h-64 animate-pulse bg-gray-50 max-w-3xl" />;
  if (!skill) return null;

  const skillColor = SKILL_COLORS[skill.skillLevel] || 'var(--gx-text-muted)';
  // Readiness (the 6 axes + the job-ready number) is only rendered once the API
  // reports it as measured. It never is today, so the card shows an empty state
  // rather than bars derived from arbitrary constants.
  const readiness = skill.readinessAvailable ? skill.skillAreas : null;
  const areas = readiness ? [
    { label:'Theoretical Knowledge', value: readiness.theoretical||0, color:'var(--gx-info)' },
    { label:'Coding Ability', value: readiness.coding||0, color:'var(--gx-success)' },
    { label:'Project Experience', value: readiness.projects||0, color:'var(--gx-warning)' },
    { label:'Consistency', value: readiness.consistency||0, color:'var(--gx-danger)' },
    { label:'Problem Solving', value: readiness.problemSolving||0, color:'var(--gx-info)' },
    { label:'Domain Depth', value: readiness.domainDepth||0, color:'var(--gx-warning)' },
  ] : [];
  const tips = [
    skill.weakTopics?.length > 0 && `Review weak topics: ${skill.weakTopics.slice(0,2).map(w=>w.topic).join(', ')}`,
    (skill.stats?.streak||0) < 7 && `Build streak — ${7-(skill.stats?.streak||0)} more days to weekly badge`,
    (skill.stats?.completedProjects||0) < 1 && 'Submit weekly projects to gain project experience',
  ].filter(Boolean);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Skill Identity</h1>

      <div className="card border-2" style={{ borderColor: `color-mix(in srgb, ${skillColor} 19%, transparent)`, background: `color-mix(in srgb, ${skillColor} 2%, transparent)` }}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0" style={{ background: `color-mix(in srgb, ${skillColor} 13%, transparent)`, color: skillColor }}>
            {(user?.name||'G').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-400 mb-0.5">SKILL LEVEL</div>
            <div className="text-2xl font-bold capitalize" style={{ color: skillColor }}>{(skill.skillLevel||'beginner').replace('_',' ')}</div>
            <div className="text-sm text-gray-400">{user?.domain_slug?.toUpperCase()} · {user?.college}</div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{color:'var(--gx-info)'}}>{skill.progressPercent||0}%</div>
              <div className="text-xs text-gray-400">Progress</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title mb-4">Learning Journey</h2>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
          <div className="h-full rounded-full transition-all" style={{ width:`${skill.progressPercent||0}%`, background:`var(--gx-info)` }} />
        </div>
        <div className="flex justify-between">
          {MILESTONES.map(m => {
            const done = (skill.progressPercent||0) >= m.min;
            return (
              <div key={m.label} className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${done ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-300'}`}>{done ? '✓' : ''}</div>
                <div className={`text-xs mt-1 font-medium ${done ? 'text-dark' : 'text-gray-300'}`}>{m.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2 className="section-title mb-4">Skill Areas</h2>
        {areas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center">
            <div className="text-sm text-gray-500">Not enough data yet — complete assessments to unlock.</div>
            <div className="text-xs text-gray-400 mt-1">Your skill areas appear here once they can be measured from real results.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {areas.map(a => (
              <div key={a.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{a.label}</span>
                  <span className="font-mono font-medium" style={{color:a.color}}>{a.value}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{width:`${a.value}%`, background:a.color}} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="section-title mb-3">Stats</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'Tests Taken', value: skill.stats?.totalTests||0, color:'var(--gx-info)' },
            { label:'Avg Test Score', value:`${skill.stats?.avgTestScore||0}%`, color:'var(--gx-success)' },
            { label:'Projects Done', value: skill.stats?.completedProjects||0, color:'var(--gx-warning)' },
            { label:'Day Streak', value:`${skill.stats?.streak||0}d`, color:'var(--gx-danger)' },
            { label:'Current Day', value: skill.stats?.currentDay||1, color:'var(--gx-info)' },
            { label:'Total Score', value: skill.stats?.totalScore||0, color:'var(--gx-warning)' },
          ].map(s=>(
            <div key={s.label} className="text-center p-3 rounded-xl" style={{background:`color-mix(in srgb, ${s.color} 6%, transparent)`}}>
              <div className="text-xl font-bold" style={{color:s.color}}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {tips.length > 0 && (
        <div className="card border border-primary/15 bg-primary/3">
          <h2 className="section-title mb-3">Next steps</h2>
          <div className="space-y-2">
            {tips.map((tip, i) => (
              <div key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="text-primary flex-shrink-0">→</span>{tip}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
