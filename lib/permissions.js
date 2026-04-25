export const PLANS = {
  spectator: {
    label: 'Spectator',
    price: 0,
    color: '#5a7a9a',
    icon: '👀',
  },
  player: {
    label: 'Player',
    price: 99,
    color: '#378ADD',
    icon: '🎮',
  },
  performer: {
    label: 'Performer',
    price: 199,
    color: '#1D9E75',
    icon: '🔥',
  },
  dominator: {
    label: 'Dominator',
    price: 499,
    color: '#EF9F27',
    icon: '👑',
  },
};

export const PERMISSIONS = {
  job_certificate: ['dominator'],
  // ROADMAP
  daily_roadmap: ['spectator', 'player', 'performer', 'dominator'],
  custom_roadmap: ['player', 'performer', 'dominator'],
  dsa_roadmap: ['performer', 'dominator'],

  // DOMAINS
  domains_count: {
    spectator: 1,
    player: 3,
    performer: 10,
    dominator: 10,
  },

  // TESTS
  daily_test: ['spectator', 'player', 'performer', 'dominator'],
  weekly_test: ['player', 'performer', 'dominator'],
  monthly_test: ['performer', 'dominator'],
  revision_test: ['performer', 'dominator'],

  // AI FEATURES
  ai_chatbot: ['spectator', 'player', 'performer', 'dominator'],
  ai_notes: ['spectator', 'player', 'performer', 'dominator'],
  ai_mentor: ['performer', 'dominator'],
  ai_resume_review: ['dominator'],
  ai_mock_interview: ['dominator'],
  ai_placement_strategy: ['dominator'],
  anxiety_chat: ['spectator', 'player', 'performer', 'dominator'],

  // CODING
  daily_coding: ['spectator', 'player', 'performer', 'dominator'],
  project_guide: ['spectator', 'player', 'performer', 'dominator'],
  project_ai_feedback: ['performer', 'dominator'],
  projects_count: {
    spectator: 5,
    player: 10,
    performer: 26,
    dominator: 26,
  },

  // LEADERBOARD
  college_leaderboard: ['player', 'performer', 'dominator'],
  global_leaderboard: ['performer', 'dominator'],
  domain_leaderboard: ['performer', 'dominator'],

  // ANALYTICS
  basic_analytics: ['spectator', 'player', 'performer', 'dominator'],
  advanced_analytics: ['performer', 'dominator'],
  skill_radar: ['performer', 'dominator'],

  // PROFILE & CAREER
  public_profile: ['performer', 'dominator'],
  job_ready_badge: ['performer', 'dominator'],
  aptitude_training: ['player', 'performer', 'dominator'],
  interview_simulator: ['dominator'],
  resume_reviewer: ['dominator'],
  job_certificate: ['dominator'],
  company_prep: ['dominator'],
  referral_system: ['dominator'],
  annual_report: ['dominator'],
  linkedin_template: ['dominator'],
  skill_verification: ['performer', 'dominator'],
  conversation_history: ['player', 'performer', 'dominator'],
  streak_tracker: ['player', 'performer', 'dominator'],
  priority_support: ['performer', 'dominator'],
};

export function getEffectivePlan(userPlan, trialEndsAt, isOnTrial) {
  if (isOnTrial && trialEndsAt) {
    const trialEnd = new Date(trialEndsAt);
    if (trialEnd > new Date()) {
      return 'dominator';
    }
  }
  return (userPlan || 'spectator').toLowerCase();
}

export function getTrialDaysLeft(trialEndsAt) {
  if (!trialEndsAt) return 0;
  const trialEnd = new Date(trialEndsAt);
  const now = new Date();
  const diff = trialEnd - now;
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function hasPermission(userPlan, feature, trialEndsAt, isOnTrial) {
  const effectivePlan = getEffectivePlan(userPlan, trialEndsAt, isOnTrial);
  const allowed = PERMISSIONS[feature];
  if (!allowed) return true;
  if (Array.isArray(allowed)) return allowed.includes(effectivePlan);
  return true;
}

export function getDomainLimit(userPlan) {
  const plan = (userPlan || 'spectator').toLowerCase();
  return PERMISSIONS.domains_count[plan] || 1;
}

export function getUpgradeMessage(feature) {
  const messages = {
    ai_mentor: 'AI Mentor is available from Performer plan (₹199/month)',
    weekly_test: 'Weekly tests are available from Player plan (₹99/month)',
    monthly_test: 'Monthly tests are available from Performer plan (₹199/month)',
    dsa_roadmap: 'DSA Roadmap is available from Performer plan (₹199/month)',
    global_leaderboard: 'Global leaderboard is available from Performer plan (₹199/month)',
    college_leaderboard: 'College leaderboard is available from Player plan (₹99/month)',
    ai_resume_review: 'Resume Review is available in Dominator plan (₹499/month)',
    ai_mock_interview: 'Mock Interview Coach is available in Dominator plan (₹499/month)',
    interview_simulator: 'Interview Simulator is available in Dominator plan (₹499/month)',
    project_ai_feedback: 'Project AI feedback is available from Performer plan (₹199/month)',
    public_profile: 'Public profile is available from Performer plan (₹199/month)',
    skill_verification: 'Skill verification is available from Performer plan (₹199/month)',
    aptitude_training: 'Aptitude training is available from Player plan (₹99/month)',
    company_prep: 'Company-specific prep is available in Dominator plan (₹499/month)',
  };
  return messages[feature] || 'Upgrade your plan to access this feature';
}
