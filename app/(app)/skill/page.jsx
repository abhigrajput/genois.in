'use client';
import { useEffect, useState } from 'react';
import { analyticsAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';

const SKILL_COLORS = { beginner:'#888780', intermediate:'#378ADD', advanced:'#1D9E75', job_ready:'#7F77DD' };
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

  const skillColor = SKILL_COLORS[skill.skillLevel] || '#888780';
  const areas = [
    { label:'Theoretical Knowledge', value: skill.skillAreas?.theoretical||0, color:'#7F77DD' },
    { label:'Coding Ability', value: skill.skillAreas?.coding||0, color:'#1D9E75' },
    { label:'Project Experience', value: skill.skillAreas?.projects||0, color:'#BA7517' },
    { label:'Consistency', value: skill.skillAreas?.consistency||0, color:'#D4537E' },
    { label:'Problem Solving', value: skill.skillAreas?.problemSolving||0, color:'#378ADD' },
    { label:'Domain Depth', value: skill.skillAreas?.domainDepth||0, color:'#D85A30' },
  ];
  const tips = [
    skill.weakTopics?.length > 0 && `Review weak topics: ${skill.weakTopics.slice(0,2).map(w=>w.topic).join(', ')}`,
    (skill.stats?.streak||0) < 7 && `Build streak — ${7-(skill.stats?.streak||0)} more days to weekly badge`,
    (skill.jobReadyScore||0) < 50 && 'Complete daily tasks to boost job readiness score',
    (skill.stats?.completedProjects||0) < 1 && 'Submit weekly projects to gain project experience',
  ].filter(Boolean);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Skill Identity</h1>

      <div className="card border-2" style={{ borderColor: skillColor+'30', background: skillColor+'04' }}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0" style={{ background: skillColor+'20', color: skillColor }}>
            {(user?.name||'G').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-400 mb-0.5">SKILL LEVEL</div>
            <div className="text-2xl font-bold capitalize" style={{ color: skillColor }}>{(skill.skillLevel||'beginner').replace('_',' ')}</div>
            <div className="text-sm text-gray-400">{user?.domain_slug?.toUpperCase()} · {user?.college}</div>
          </div>
          <div className="flex gap-6">
            {[{v:skill.progressPercent,l:'Progress',c:'#7F77DD'},{v:skill.jobReadyScore,l:'Job Ready',c:'#D85A30'}].map(s=>(
              <div key={s.l} className="text-center">
                <div className="text-2xl font-bold" style={{color:s.c}}>{s.v||0}%</div>
                <div className="text-xs text-gray-400">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title mb-4">Learning Journey</h2>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
          <div className="h-full rounded-full transition-all" style={{ width:`${skill.progressPercent||0}%`, background:`linear-gradient(90deg,#7F77DD,${skillColor})` }} />
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
      </div>

      <div className="card">
        <h2 className="section-title mb-3">Stats</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'Tests Taken', value: skill.stats?.totalTests||0, color:'#7F77DD' },
            { label:'Avg Test Score', value:`${skill.stats?.avgTestScore||0}%`, color:'#1D9E75' },
            { label:'Projects Done', value: skill.stats?.completedProjects||0, color:'#BA7517' },
            { label:'Day Streak', value:`${skill.stats?.streak||0}d`, color:'#D4537E' },
            { label:'Current Day', value: skill.stats?.currentDay||1, color:'#378ADD' },
            { label:'Total Score', value: skill.stats?.totalScore||0, color:'#D85A30' },
          ].map(s=>(
            <div key={s.label} className="text-center p-3 rounded-xl" style={{background:s.color+'0f'}}>
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
