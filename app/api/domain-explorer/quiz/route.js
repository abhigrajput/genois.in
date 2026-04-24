import { ALL_DOMAINS } from '@/lib/domainsData';
import { successResponse, errorResponse } from '@/lib/response';

const QUESTIONS = [
  {
    id: 'goal',
    question: 'What is your primary career goal?',
    options: [
      { value: 'high-package', label: '💰 Highest package possible', domains: ['quantdev', 'dsa', 'sysdesign', 'productmgmt'] },
      { value: 'fast-job', label: '⚡ Get a job as fast as possible', domains: ['fullstack', 'qa', 'cybersec', 'uiux'] },
      { value: 'remote', label: '🌍 Remote work for global companies', domains: ['blockchain', 'ai', 'cloud'] },
      { value: 'build', label: '🛠️ Build products people use', domains: ['fullstack', 'mobile', 'ai'] },
    ],
  },
  {
    id: 'interest',
    question: 'What excites you the most?',
    options: [
      { value: 'code', label: 'Writing code all day', domains: ['fullstack', 'dsa', 'mobile'] },
      { value: 'design', label: 'Making things beautiful', domains: ['uiux', 'fullstack', 'mobile'] },
      { value: 'math', label: 'Math and algorithms', domains: ['ml', 'ai', 'quantdev', 'dsa'] },
      { value: 'break', label: 'Breaking systems / security', domains: ['cybersec', 'qa'] },
      { value: 'data', label: 'Working with data', domains: ['ds', 'dataeng', 'ml'] },
      { value: 'leadership', label: 'Leading and strategy', domains: ['productmgmt', 'devops'] },
    ],
  },
  {
    id: 'learning',
    question: 'How do you prefer learning?',
    options: [
      { value: 'project', label: 'Building real projects', domains: ['fullstack', 'mobile', 'ai', 'gamedev'] },
      { value: 'theory', label: 'Reading concepts first', domains: ['dsa', 'sysdesign', 'ml'] },
      { value: 'visual', label: 'Visual and interactive', domains: ['uiux', 'arvr', 'gamedev'] },
      { value: 'practical', label: 'Learning tools and frameworks', domains: ['cloud', 'devops', 'qa'] },
    ],
  },
  {
    id: 'time',
    question: 'How much time can you commit daily?',
    options: [
      { value: 'low', label: '1-2 hours', domains: ['qa', 'uiux', 'cloud'] },
      { value: 'medium', label: '2-4 hours', domains: ['fullstack', 'mobile', 'cybersec'] },
      { value: 'high', label: '4+ hours', domains: ['dsa', 'ml', 'ai', 'quantdev'] },
    ],
  },
  {
    id: 'background',
    question: 'What is your current level?',
    options: [
      { value: 'zero', label: 'Total beginner', domains: ['fullstack', 'qa', 'uiux'] },
      { value: 'basic', label: 'Basic programming', domains: ['fullstack', 'mobile', 'dsa'] },
      { value: 'intermediate', label: 'Can build small projects', domains: ['ai', 'ml', 'cybersec', 'cloud'] },
      { value: 'advanced', label: 'Already experienced', domains: ['sysdesign', 'devops', 'productmgmt'] },
    ],
  },
];

export async function GET() {
  return successResponse({ questions: QUESTIONS });
}

export async function POST(request) {
  try {
    const { answers } = await request.json();

    const scores = {};
    ALL_DOMAINS.forEach(d => { scores[d.slug] = 0; });

    QUESTIONS.forEach(q => {
      const answer = answers[q.id];
      const opt = q.options.find(o => o.value === answer);
      if (opt) opt.domains.forEach(slug => { scores[slug] = (scores[slug] || 0) + 1; });
    });

    const ranked = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([slug, score]) => {
        const domain = ALL_DOMAINS.find(d => d.slug === slug);
        return { ...domain, matchScore: score };
      });

    return successResponse({ recommended: ranked });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
