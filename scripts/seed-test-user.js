const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  console.log('🌱 Seeding test users...');
  
  // First check users table columns
  const { data: sample, error: sErr } = await sb.from('users').select('*').limit(1);
  if (sErr) {
    console.error('Cannot read users table:', sErr.message);
    return;
  }
  
  const columns = sample && sample[0] ? Object.keys(sample[0]) : [];
  console.log('Users table columns:', columns.join(', '));
  
  const hash = await bcrypt.hash('Test@12345', 12);
  
  // Build insert object based on available columns
  const userObj = {
    email: 'test@genois.in',
    name: 'Test Student',
    password_hash: hash,
    email_verified: true,
    plan: 'dominator',
    domain_slug: 'dsa',
    is_active: true
  };
  
  // Only add columns that exist
  if (columns.includes('is_on_trial')) userObj.is_on_trial = false;
  if (columns.includes('subscription_plan')) userObj.subscription_plan = 'dominator';
  if (columns.includes('trial_end')) userObj.trial_end = new Date(Date.now() + 30*24*60*60*1000).toISOString();
  if (columns.includes('trial_ends_at')) userObj.trial_ends_at = new Date(Date.now() + 30*24*60*60*1000).toISOString();
  if (columns.includes('level')) userObj.level = 'beginner';
  if (columns.includes('college')) userObj.college = 'KLE Institute of Technology';
  if (columns.includes('total_score')) userObj.total_score = 500;
  
  // Delete if exists
  await sb.from('users').delete().eq('email', 'test@genois.in');
  
  const { data: user, error } = await sb.from('users').insert(userObj).select().single();
  
  if (error) {
    console.error('❌ User insert failed:', error.message, error.details, error.hint);
    console.log('Attempted object:', JSON.stringify(userObj, null, 2));
    return;
  }
  
  console.log('✅ Test user created:', user.id);
  console.log('📧 Email: test@genois.in');
  console.log('🔑 Password: Test@12345');
  
  // Create DSA progress
  const { error: progErr } = await sb.from('dsa_roadmap_progress').upsert({
    user_id: user.id,
    current_day: 1,
    completed_days: [],
    level: 'BEGINNER',
    diagnostic_taken: false,
    streak: 0
  }, { onConflict: 'user_id' });
  
  if (progErr) console.log('⚠️ Progress:', progErr.message);
  else console.log('✅ DSA progress created');
  
  // Create streak
  let strErr = null;
  try {
    const { error } = await sb.from('streaks').upsert({
      user_id: user.id,
      current_streak: 5,
      longest_streak: 10,
      last_activity_date: new Date().toISOString().split('T')[0]
    }, { onConflict: 'user_id' });
    strErr = error;
  } catch (e) {
    strErr = e;
  }
  
  if (strErr) console.log('⚠️ Streak table:', strErr?.message);
  
  console.log('\n🎉 DONE! Login with: test@genois.in / Test@12345');
}

seed();
