export const DOMAINS = [
  { slug: 'fullstack',  label: 'Full Stack Development',        icon: '⬡', color: '#7F77DD' },
  { slug: 'dsa',        label: 'Data Structures & Algorithms',  icon: '◈', color: '#1D9E75' },
  { slug: 'ml',         label: 'Machine Learning',              icon: '◉', color: '#D85A30' },
  { slug: 'ai',         label: 'Artificial Intelligence',       icon: '◎', color: '#BA7517' },
  { slug: 'ds',         label: 'Data Science',                  icon: '◇', color: '#378ADD' },
  { slug: 'cybersec',   label: 'Cybersecurity',                 icon: '◆', color: '#D4537E' },
  { slug: 'cloud',      label: 'Cloud Computing',               icon: '○', color: '#639922' },
  { slug: 'mobile',     label: 'Mobile App Development',        icon: '▣', color: '#E24B4A' },
  { slug: 'devops',     label: 'DevOps',                        icon: '▷', color: '#888780' },
  { slug: 'sysdesign',  label: 'System Design',                 icon: '▦', color: '#534AB7' },
];

export const TASK_TYPES = ['video', 'resource', 'coding', 'test', 'notes', 'project'];

export const TASK_POINTS = {
  video: 10,
  resource: 10,
  coding: 20,
  test: 30,
  notes: 10,
  project: 30,
};

export const DAY_COMPLETE_BONUS = 20;
export const TOTAL_DAYS = 30;

export const SKILL_LEVELS = {
  beginner:     { min: 0,  label: 'Beginner',     color: '#888780' },
  intermediate: { min: 25, label: 'Intermediate',  color: '#378ADD' },
  advanced:     { min: 50, label: 'Advanced',      color: '#1D9E75' },
  job_ready:    { min: 80, label: 'Job Ready',     color: '#7F77DD' },
};

export const PLANS = {
  TRIAL:   'trial',
  FREE:    'free',
  PREMIUM: 'premium',
};

export const MENTOR_MODES = [
  { value: 'explain',  label: 'Explain Concept',  icon: '◎' },
  { value: 'coding',   label: 'Coding Help',       icon: '{}' },
  { value: 'roadmap',  label: 'Roadmap Help',      icon: '◈' },
  { value: 'project',  label: 'Project Help',      icon: '◆' },
  { value: 'notes',    label: 'Notes Help',        icon: '≡'  },
];

export const CHATBOT_MODES = [
  { value: 'general',  label: 'General'  },
  { value: 'coding',   label: 'Coding'   },
  { value: 'domain',   label: 'Domain'   },
  { value: 'project',  label: 'Project'  },
  { value: 'career',   label: 'Career'   },
];

export const NOTE_TYPES = [
  { value: 'theory',   label: 'Theory Notes'   },
  { value: 'coding',   label: 'Coding Notes'   },
  { value: 'full',     label: 'Full Notes'     },
  { value: 'revision', label: 'Revision Notes' },
];

export function getDomainBySlug(slug) {
  return DOMAINS.find(d => d.slug === slug) || DOMAINS[0];
}

export function getSkillLevel(progressPercent) {
  if (progressPercent >= 80) return SKILL_LEVELS.job_ready;
  if (progressPercent >= 50) return SKILL_LEVELS.advanced;
  if (progressPercent >= 25) return SKILL_LEVELS.intermediate;
  return SKILL_LEVELS.beginner;
}

export function calculateJobReadyScore(progressPercent, avgTestScore, streak, completedProjects) {
  const p = (progressPercent || 0) * 0.40;
  const t = (avgTestScore || 0) * 0.30;
  const s = (Math.min(streak || 0, 30) / 30) * 100 * 0.20;
  const pr = Math.min((completedProjects || 0) * 10, 100) * 0.10;
  return Math.min(100, Math.round(p + t + s + pr));
}
