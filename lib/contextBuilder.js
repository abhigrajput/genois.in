import { getAdminClient } from './supabaseAdmin.js';

export function getCollegeTier(collegeName) {
  if (!collegeName) return 'tier3';
  const name = collegeName.toLowerCase();
  const tier1 = ['iit', 'nit', 'bits', 'iisc', 'dtu', 'nsit', 'iiit hyderabad', 'iiit bangalore'];
  const tier2 = ['vit', 'manipal', 'srm', 'pes university', 'bmsce', 'rvce', 'msrit', 'sjce', 'reva', 'christ'];
  if (tier1.some(t => name.includes(t))) return 'tier1';
  if (tier2.some(t => name.includes(t))) return 'tier2';
  return 'tier3';
}

// Qualitative pattern notes only. Question counts, section timings, cutoff
// percentages, CGPA thresholds and package figures are deliberately absent:
// they vary per hiring cycle and we have no dated source for them, so stating
// them to a student would be inventing facts. Students must be pointed at each
// company's official criteria for the current cycle.
const COMPANY_PATTERNS = {
  TCS: 'TCS NQT: quantitative aptitude, verbal, programming logic, and a coding section. Coding skews toward arrays, strings and basic DP at easy-to-medium difficulty.',
  Infosys: 'Infosys SP/SE: quantitative aptitude, logical reasoning, verbal, and coding. The Ninja/HackWithInfy track is noticeably harder than the standard one.',
  Wipro: 'Wipro NLTH: aptitude, written communication, and a coding section spanning easy through hard.',
  Accenture: 'Accenture: cognitive and technical assessment plus coding. Emphasis on OOP, basic data structures and SQL.',
  Cognizant: 'CTS GenC: aptitude, reasoning and coding at the easier end of the mass-recruiter range.',
  HCL: 'HCL TechBee/Graduate: basic aptitude and easy coding problems. Generally among the more accessible mass recruiters.',
  Amazon: 'Amazon OA: LeetCode Medium-to-Hard algorithmic problems plus a work-style simulation. Sustained DSA practice is the deciding factor.',
  Flipkart: 'Flipkart: medium-to-hard coding problems. Strong DSA is mandatory.',
};

export function buildUserContext(user) {
  if (!user) return { systemContext: '', urgencyLevel: 'normal', primaryTarget: null, hasWeaknesses: false };

  const companies = user.target_companies || [];
  const weakSubjects = user.weak_subjects || [];
  const cgpa = user.cgpa || 0;
  const months = user.months_to_placement || 12;
  const tier = user.college_tier || getCollegeTier(user.college) || 'tier3';
  const domain = user.domain_slug || 'fullstack';

  const urgency = months <= 3
    ? 'CRITICAL — Less than 3 months. Skip theory, pure practice and pattern recognition only. High-yield problems only.'
    : months <= 6
    ? 'URGENT — 6 months. Balance 50/50 learning and practice. Prioritize company-specific patterns.'
    : 'SUFFICIENT — Build strong foundations first, shift to company-specific prep in last 3 months.';

  // The 6.0 / 7.0 thresholds below are INTERNAL routing only — they pick which
  // guidance to give. Never state a company's CGPA cutoff as fact: cutoffs
  // differ per company and per hiring cycle and we have no sourced figures.
  const cgpaContext = cgpa < 6.0
    ? `CGPA ${cgpa}: Likely below the cutoff at several large recruiters. Tell the student to check each company's current published criteria, and to compensate with demonstrably strong coding skills.`
    : cgpa < 7.0
    ? `CGPA ${cgpa}: Competitive for the mass recruiters. Product companies will weigh coding depth heavily, so that is where to invest.`
    : `CGPA ${cgpa}: Strong. Breadth of companies is not the constraint — coding depth is. Still advise confirming each company's published criteria before applying.`;

  const tierContext = tier === 'tier1'
    ? 'Premier institute student — strong fundamentals expected by recruiters.'
    : tier === 'tier2'
    ? 'Tier-2 college — moderate campus placements, must differentiate through skills.'
    : 'Tier-3 college — limited campus presence. Must have exceptional skills. Mass recruiters are primary target. Every skill point counts double.';

  const targetContext = companies.length > 0
    ? companies.map(c => COMPANY_PATTERNS[c] || `${c}: Standard OA pattern`).join('\n')
    : 'No target specified. Cover general placement preparation across all mass recruiters.';

  const weaknessContext = weakSubjects.length > 0
    ? `IDENTIFIED WEAKNESSES: ${weakSubjects.join(', ')}. Address these gaps directly whenever relevant to today's topic.`
    : '';

  const systemContext = `
=== STUDENT CONTEXT (personalize ALL content based on this) ===
College Tier: ${tier} — ${tierContext}
CGPA: ${cgpa || 'Not provided'} — ${cgpaContext}
Domain: ${domain}
Target Companies: ${companies.length > 0 ? companies.join(', ') : 'General'}
Timeline: ${months} months until placements — ${urgency}
${weaknessContext}

TARGET COMPANY OA PATTERNS:
${targetContext}
=== END CONTEXT ===
`;

  return {
    systemContext,
    urgencyLevel: months <= 3 ? 'critical' : months <= 6 ? 'urgent' : 'normal',
    primaryTarget: companies[0] || null,
    hasWeaknesses: weakSubjects.length > 0,
    tier,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL STUDENT CONTEXT — pulls real performance from the DB so the AI adapts to
// each student instead of relying on self-reported level alone.
//
// Field mapping to the ACTUAL schema (verified against migrations):
//   tests               → score (0-100), result ('pending'|'passed'|'failed'), taken_at
//   coding_submissions  → status ('correct'|'partial'|'incorrect'), created_at
//   interview_results   → total_score, created_at
//   scores              → total_score (aggregate points)
//   progress            → current_day, streak
// Any missing table/row degrades gracefully to null metrics.
// ─────────────────────────────────────────────────────────────────────────────
export async function buildFullStudentContext(userId) {
  const supabase = getAdminClient();

  const [
    { data: user },
    { data: progress },
    { data: scoreRow },
    { data: tests },
    { data: coding },
    { data: interviews },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('progress').select('*').eq('user_id', userId).single(),
    supabase.from('scores').select('total_score').eq('user_id', userId).single(),
    supabase.from('tests').select('score, result, topic, taken_at')
      .eq('user_id', userId).order('taken_at', { ascending: false }).limit(10),
    supabase.from('coding_submissions').select('status, created_at')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    supabase.from('interview_results').select('total_score, created_at')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
  ]);

  // Only tests the student actually finished count toward performance.
  const gradedTests = (tests || []).filter(t => t.result && t.result !== 'pending' && t.score != null);
  const avgTestScore = gradedTests.length
    ? Math.round(gradedTests.reduce((s, t) => s + (t.score || 0), 0) / gradedTests.length)
    : null;

  // gradedTests is newest-first — improving means the newest beats the oldest.
  let testTrend = 'no data';
  if (gradedTests.length >= 2) {
    const newest = gradedTests[0].score;
    const oldest = gradedTests[gradedTests.length - 1].score;
    testTrend = newest > oldest ? 'improving' : newest < oldest ? 'declining' : 'stable';
  }

  const codingList = coding || [];
  const problemsSolved = codingList.filter(c => c.status === 'correct').length;
  const codingSolveRate = codingList.length
    ? Math.round((problemsSolved / codingList.length) * 100)
    : null;

  const interviewList = interviews || [];
  const avgInterviewScore = interviewList.length
    ? Math.round(interviewList.reduce((s, i) => s + (Number(i.total_score) || 0), 0) / interviewList.length)
    : null;

  // Real level is derived from ACTUAL performance, not what the student claims.
  let realLevel = 'beginner';
  if (avgTestScore != null && codingSolveRate != null && avgTestScore > 70 && codingSolveRate > 60) {
    realLevel = 'advanced';
  } else if ((avgTestScore != null && avgTestScore > 50) || (codingSolveRate != null && codingSolveRate > 40)) {
    realLevel = 'intermediate';
  }

  return {
    // Identity
    name: user?.name || 'there',
    college: user?.college || 'your college',
    collegeTier: user?.college_tier || getCollegeTier(user?.college) || 'tier3',
    domain: user?.domain_slug || 'fullstack',

    // Goals
    targetCompanies: user?.target_companies || [],
    monthsToPlacement: user?.months_to_placement,
    cgpa: user?.cgpa,
    weakSubjects: user?.weak_subjects || [],

    // Progress
    currentDay: progress?.current_day || 1,
    totalScore: scoreRow?.total_score || 0,
    streak: progress?.streak || 0,

    // REAL performance — this is what makes guidance personal
    selfReportedLevel: user?.level || 'beginner',
    realLevel,
    avgTestScore,
    testTrend,
    codingSolveRate,
    avgInterviewScore,
    testsCompleted: gradedTests.length,
    problemsSolved,
    interviewsTaken: interviewList.length,
  };
}

// Turns a full student context into a personalized mentor system prompt.
export function buildMentorPrompt(ctx) {
  const levelGuidance = {
    beginner: 'This student is a BEGINNER. Explain concepts simply, avoid jargon, build confidence. Start with fundamentals. Celebrate small wins.',
    intermediate: 'This student is INTERMEDIATE. They know basics. Push them with medium-difficulty problems. Point out gaps in their approach.',
    advanced: 'This student is ADVANCED. Challenge them. Skip basics. Focus on optimization, edge cases, and interview-level depth.',
  };

  let performanceNote = '';
  if (ctx.testTrend === 'declining') {
    performanceNote = `⚠️ This student's test scores are DECLINING (avg ${ctx.avgTestScore}%). They may be discouraged or stuck. Be encouraging but identify what's going wrong. Suggest revisiting weak fundamentals.`;
  } else if (ctx.testTrend === 'improving') {
    performanceNote = `📈 This student is IMPROVING (avg ${ctx.avgTestScore}%). Acknowledge their progress to keep momentum. Push them slightly harder.`;
  }

  let realityCheck = '';
  if (ctx.selfReportedLevel === 'advanced' && ctx.realLevel === 'beginner') {
    realityCheck = 'Note: Student thinks they are advanced but their actual performance suggests beginner level. Gently guide them to strengthen fundamentals without discouraging them.';
  }

  return `You are a direct, highly technical placement mentor for ${ctx.name} on GENOIS. You know them deeply. Communicate exclusively in professional, concise English. Be honest and specific. Reference the student's actual data. No motivational fluff — actionable guidance only.

=== WHO YOU'RE TALKING TO ===
Name: ${ctx.name}
College: ${ctx.college} (${ctx.collegeTier})
Domain: ${ctx.domain}
Target: ${ctx.targetCompanies.join(', ') || 'not set'}
Timeline: ${ctx.monthsToPlacement || '?'} months to placement
CGPA: ${ctx.cgpa || 'not set'}

=== THEIR ACTUAL PERFORMANCE ===
Day ${ctx.currentDay} of journey · ${ctx.streak} day streak · ${ctx.totalScore} points
Real level (from data): ${ctx.realLevel}
Test average: ${ctx.avgTestScore != null ? ctx.avgTestScore + '%' : 'no tests yet'} (${ctx.testTrend})
Coding solve rate: ${ctx.codingSolveRate != null ? ctx.codingSolveRate + '%' : 'no data'}
Problems solved: ${ctx.problemsSolved}
Interviews taken: ${ctx.interviewsTaken}${ctx.avgInterviewScore != null ? ` (avg ${ctx.avgInterviewScore})` : ''}
Weak subjects: ${ctx.weakSubjects.join(', ') || 'none identified'}

=== HOW TO GUIDE THEM ===
${levelGuidance[ctx.realLevel]}
${performanceNote}
${realityCheck}

RULES:
- Communicate in clear, professional English. Be direct, technical, and precise. No slang, no filler.
- Address them by name (${ctx.name})
- Reference their SPECIFIC data ("Your test scores dropped from X to Y", "You've solved ${ctx.problemsSolved} problems")
- Give advice specific to ${ctx.targetCompanies[0] || 'their target'}
- If they're weak in ${ctx.weakSubjects[0] || 'a subject'}, prioritize it
- Be honest and specific — actionable guidance only, no generic motivation.`;
}
