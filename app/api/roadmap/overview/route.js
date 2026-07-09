import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { DOMAIN_STRUCTURES } from '@/lib/curriculumGenerator';

// The four macro-phases every roadmap moves through, expressed as day ranges so
// they line up with the difficulty ramp in curriculumGenerator.difficultyPhase.
const MACRO_PHASES = [
  { key: 'FOUNDATION', days: 'Days 1–3',   summary: 'Core syntax & fundamentals — build a base.' },
  { key: 'BUILD',      days: 'Days 4–10',  summary: 'Easy→Medium problems, debugging, writing tests.' },
  { key: 'PUSH',       days: 'Days 11–20', summary: 'Medium consistency, optimization, pattern recognition.' },
  { key: 'MASTERY',    days: 'Days 21+',   summary: 'Hard problems, edge cases, real interview-level work.' },
];

const OUTCOMES = {
  fullstack:     'Ship full-stack apps end-to-end and clear front-end/back-end interviews.',
  dsa:           'Solve Medium/Hard problems under time pressure and pass DSA rounds.',
  aiml:          'Build and deploy ML models and clear AI/ML technical screens.',
  datascience:   'Run full analyses, build predictive models, and clear data interviews.',
  cybersecurity: 'Run assessments, solve CTFs, and prep for CEH/OSCP-style rounds.',
  devops:        'Automate CI/CD, containerize, and provision cloud infra confidently.',
  android:       'Publish production Android apps and clear mobile interviews.',
  systemdesign:  'Design scalable systems and walk through architecture interviews.',
  blockchain:    'Write, audit, and deploy smart contracts and full dApps.',
  gamedev:       'Build and ship polished games and clear gameplay/engine rounds.',
};

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('domain_slug, level')
      .eq('id', payload.userId)
      .single();

    const domain = user?.domain_slug || 'fullstack';
    const structure = DOMAIN_STRUCTURES[domain] || DOMAIN_STRUCTURES.fullstack;

    // Domain-specific topic focus per phase (from the curriculum structure).
    const topics = structure.phases.map(p => ({
      weeks: p.weeks,
      level: p.level,
      focus: p.focus,
    }));

    const projects = (structure.projectSchedule || []).map(p => ({
      week: p.week,
      title: p.title,
      difficulty: p.difficulty,
    }));

    return successResponse({
      domain,
      domainName: structure.name,
      totalDays: 365,
      dailyMinutes: 30,
      macroPhases: MACRO_PHASES,
      topics,
      projects,
      outcome: OUTCOMES[domain] || 'Become genuinely job-ready in your domain.',
    });
  } catch (error) {
    console.error('Roadmap overview error:', error);
    return errorResponse('Internal server error', 500);
  }
}
