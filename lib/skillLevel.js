export const SKILL_TIERS = {
  fresher: {
    label: 'Fresher',
    min: 0, max: 300,
    color: '#5a7a9a',
    icon: '🌱',
    description: 'Just starting out. Building fundamentals.',
  },
  junior: {
    label: 'Junior Developer',
    min: 300, max: 800,
    color: '#378ADD',
    icon: '💼',
    description: 'Can build basic projects. Knows core concepts well.',
  },
  'mid-level': {
    label: 'Mid-Level Developer',
    min: 800, max: 1500,
    color: '#1D9E75',
    icon: '⚡',
    description: 'Builds production-ready work. Strong technical foundation.',
  },
  senior: {
    label: 'Senior Developer',
    min: 1500, max: 2500,
    color: '#EF9F27',
    icon: '🏆',
    description: 'Architects systems. Mentors others. Deep expertise.',
  },
  expert: {
    label: 'Expert / Staff',
    min: 2500, max: 99999,
    color: '#D85A30',
    icon: '🔥',
    description: 'Top 1% engineers. Leading teams and strategy.',
  },
};

export function getSkillTier(score) {
  const tiers = ['fresher', 'junior', 'mid-level', 'senior', 'expert'];
  for (const t of tiers) {
    if (score >= SKILL_TIERS[t].min && score < SKILL_TIERS[t].max) return t;
  }
  return 'expert';
}

export function getSkillTierData(score) {
  const tier = getSkillTier(score);
  return { tier, ...SKILL_TIERS[tier] };
}

export function getNextTier(score) {
  const currentTier = getSkillTier(score);
  const tiers = ['fresher', 'junior', 'mid-level', 'senior', 'expert'];
  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex === tiers.length - 1) return null;
  const nextTier = tiers[currentIndex + 1];
  return {
    tier: nextTier,
    ...SKILL_TIERS[nextTier],
    pointsNeeded: SKILL_TIERS[nextTier].min - score,
  };
}
