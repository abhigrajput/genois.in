export function getCollegeTier(collegeName) {
  if (!collegeName) return 'tier3';
  const name = collegeName.toLowerCase();
  const tier1 = ['iit', 'nit', 'bits', 'iisc', 'dtu', 'nsit', 'iiit hyderabad', 'iiit bangalore'];
  const tier2 = ['vit', 'manipal', 'srm', 'pes university', 'bmsce', 'rvce', 'msrit', 'sjce', 'reva', 'christ'];
  if (tier1.some(t => name.includes(t))) return 'tier1';
  if (tier2.some(t => name.includes(t))) return 'tier2';
  return 'tier3';
}

const COMPANY_PATTERNS = {
  TCS: 'TCS NQT: Quantitative Aptitude (30Q), Verbal (25Q), Programming Logic (25Q), Coding (2 problems - Easy/Medium Arrays/Strings/basic DP). Cutoff 60%+. CGPA 6.0+ required.',
  Infosys: 'Infosys SP/SE: Quant (10Q), Logical (15Q), Verbal (20Q), Coding (2 problems). Ninja track: 3 hard problems. CGPA 6.0+.',
  Wipro: 'Wipro NLTH: Aptitude (45 min), Written Communication, Coding (3 Medium problems). CGPA 6.0+.',
  Accenture: 'Accenture: Cognitive + Technical + Coding (2 problems). OOPS, basic DS, SQL focus. CGPA 5.0+ (lenient).',
  Cognizant: 'CTS GenC: Aptitude + Reasoning + Coding (2 Easy problems). CGPA 6.0+.',
  HCL: 'HCL TechBee/Graduate: Basic aptitude, 1-2 easy coding problems. CGPA 5.0+. Easiest among tier-1 mass recruiters.',
  Amazon: 'Amazon OA: 2 LeetCode Medium-Hard (60 min) + work simulation. 200+ LeetCode problems required. CGPA 6.5+.',
  Flipkart: 'Flipkart: 3 coding problems (Medium-Hard), strong DSA mandatory. CGPA 7.0+ preferred.',
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

  const cgpaContext = cgpa < 6.0
    ? `CGPA ${cgpa}: Below many MNC cutoffs. Focus on Accenture(5.0+), HCL(5.0+). Compensate with exceptional coding skills.`
    : cgpa < 7.0
    ? `CGPA ${cgpa}: Eligible for TCS, Infosys, Wipro, Accenture. Product companies need exceptional coding to compensate.`
    : `CGPA ${cgpa}: Strong eligibility. All companies including Amazon and Flipkart accessible.`;

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
