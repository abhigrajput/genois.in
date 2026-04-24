'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { analyticsAPI } from '@/lib/api';

const SKILL_COLORS = { beginner:'#888780', intermediate:'#378ADD', advanced:'#1D9E75', job_ready:'#7F77DD' };

function Ring({ pct, color, size=72, label }) {
  const r = (size-10)/2;
  const circ = 2*Math.PI*r;
  return (
    <div className="text-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f0eb" strokeWidth="7" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ * (1 - (pct||0)/100)}
          transform={`rotate(-90 ${size/2} ${size/2})`} />
        <text x={size/2} y={size/2+5} textAnchor="middle" fontSize="13" fontWeight="600" fill={color}>{pct||0}%</text>
      </svg>
      {label && <div className="text-xs text-gray-400 mt-1">{label}</div>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [skill, setSkill] = useState(null);
  const [daily, setDaily] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.getSkillIdentity(),
      analyticsAPI.getDailyGraph(14),
      analyticsAPI.getWeeklyGraph(),
      analyticsAPI.getScoreBreakdown(),
    ]).then(([s, d, w, sc]) => {
      setSkill(s.data);
      setDaily(d.data.graph || []);
      setWeekly(w.data.weeks || []);
      setScores(sc.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4 w-full" style={{ maxWidth: 1600, margin: '0 auto' }}>
      {[1,2,3].map(i => <div key={i} className="card h-32 animate-pulse bg-gray-50" />)}
    </div>
  );

  const skillColor = SKILL_COLORS[skill?.skillLevel] || '#888780';
  const scoreBreakdown = scores?.score ? [
    { name:'Tasks', value: scores.score.task_score||0, color:'#7F77DD' },
    { name:'Tests', value: scores.score.test_score||0, color:'#D4537E' },
    { name:'Coding', value: scores.score.coding_score||0, color:'#1D9E75' },
    { name:'Projects', value: scores.score.project_score||0, color:'#BA7517' },
  ] : [];
  const maxScore = Math.max(1, ...scoreBreakdown.map(s => s.value));

  return (
    <div className="w-full space-y-6" style={{ maxWidth: 1600, margin: '0 auto' }}>
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="card">
        <h2 className="section-title mb-4">Skill Overview</h2>
        <div className="flex justify-around flex-wrap gap-4 mb-4">
          <Ring pct={skill?.progressPercent||0} color="#7F77DD" label="Progress" />
          <Ring pct={skill?.jobReadyScore||0} color="#D85A30" label="Job Ready" />
          <Ring pct={Math.min(100, Math.round((scores?.score?.total_score||0)/10))} color="#1D9E75" label="Score Lvl" />
          <Ring pct={Math.min(100,(skill?.stats?.streak||0)*5)} color="#BA7517" label="Streak" />
        </div>
        <div className="text-center">
          <span className="px-4 py-1.5 rounded-full text-sm font-semibold" style={{ background: skillColor+'15', color: skillColor }}>
            {(skill?.skillLevel||'beginner').replace('_',' ')}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="section-title mb-3">Daily Activity (14 days)</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={daily.map(d => ({ date: String(d.date||'').slice(5), score: d.daily_score||0 }))}>
              <XAxis dataKey="date" tick={{fontSize:10}} />
              <YAxis tick={{fontSize:10}} />
              <Tooltip />
              <Bar dataKey="score" fill="#7F77DD" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2 className="section-title mb-3">Weekly Progress</h2>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weekly.map(w => ({ week:`W${w.week}`, score: w.weekScore||0 }))}>
              <XAxis dataKey="week" tick={{fontSize:10}} />
              <YAxis tick={{fontSize:10}} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#1D9E75" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title mb-4">Score Breakdown</h2>
        <div className="space-y-3">
          {scoreBreakdown.map(s => (
            <div key={s.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{s.name}</span>
                <span className="font-mono font-medium" style={{color:s.color}}>{s.value} pts</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width:`${(s.value/maxScore)*100}%`, background:s.color }} />
              </div>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t border-gray-100 text-sm font-semibold">
            <span>Total Score</span>
            <span className="text-primary font-mono">{scores?.score?.total_score||0} pts</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="section-title mb-3 text-warning">⚠ Weak Topics</h2>
          {skill?.weakTopics?.length > 0
            ? skill.weakTopics.map((t,i) => (
              <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                <div className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />
                <span className="text-sm flex-1">{t.topic}</span>
                <span className="text-xs font-mono text-warning">{Math.round(t.avg_score||0)}%</span>
              </div>
            ))
            : <div className="text-sm text-gray-400">No weak topics yet — take some tests!</div>
          }
        </div>
        <div className="card">
          <h2 className="section-title mb-3 text-success">✓ Strong Topics</h2>
          {skill?.strongTopics?.length > 0
            ? skill.strongTopics.map((t,i) => (
              <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                <span className="text-sm flex-1">{t.topic}</span>
                <span className="text-xs font-mono text-success">{Math.round(t.avg_score||0)}%</span>
              </div>
            ))
            : <div className="text-sm text-gray-400">Complete tests to build strengths!</div>
          }
        </div>
      </div>
    </div>
  );
}
