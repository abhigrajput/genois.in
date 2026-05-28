const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TABLES = [
  'admin_actions','admin_users','ai_cache','analytics','anxiety_chat',
  'aptitude_progress','aptitude_sessions','auction_bids','authors',
  'badge_cooldowns','badge_questions','challenge_attempts','chat_history',
  'coding_submissions','coding_tests','companies','company_challenges',
  'company_contacts','company_discussions','company_questions','company_views',
  'confession_upvotes','confessions','custom_roadmaps','custom_tasks',
  'diagnostic_questions','diagnostic_results','diagnostic_tests','domains',
  'dsa_day_tasks','dsa_diagnostic_tests','dsa_posts','dsa_roadmap_progress',
  'duel_answers','duels','feedback','interview_sessions','mentor_bookings',
  'mentor_history','mentor_profiles','mock_interviews','notes',
  'notification_preferences','notifications_log','outcomes','payments',
  'prep_packs','progress','project_progress','projects','referrals','roadmap',
  'score_events','scores','skill_auction','skill_identity','skill_verifications',
  'streak_rewards','strong_topics','subscriptions','tasks','tests','trials',
  'user_badges','user_events','user_progress','users','video_cache',
  'weak_topics','weekly_email_log'
];

async function checkTables() {
  console.log(`Checking ${TABLES.length} tables against: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);
  const exists = [], missing = [];

  for (const t of TABLES) {
    const { error } = await supabase.from(t).select('*').limit(1);
    if (!error || error.code === 'PGRST116') {
      exists.push(t);
      console.log('✅ EXISTS:  ', t);
    } else {
      missing.push({ table: t, error: error.message });
      console.log('❌ MISSING: ', t, '|', error.message);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`EXISTS:  ${exists.length}`);
  console.log(`MISSING: ${missing.length}`);
  console.log(`\nMISSING TABLES:\n${missing.map(m => m.table).join('\n')}`);
}

checkTables().catch(console.error);
