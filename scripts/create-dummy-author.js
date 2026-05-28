const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

async function createDummyAuthor() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const passwordHash = await bcrypt.hash('DSAAuthor@2024', 12);
  
  // Find or insert into users table
  let { data: user, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'dsa.author@genois.in')
    .maybeSingle();
  
  if (selectError) {
    console.error('Error selecting user:', selectError);
    return;
  }

  if (!user) {
    console.log('User does not exist, creating...');
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: 'dsa.author@genois.in',
        name: 'DSA Expert',
        password_hash: passwordHash,
        email_verified: true,
        is_admin: true,
        subscription_plan: 'dominator'
      })
      .select()
      .single();
    
    if (userError) {
      console.error('User creation error:', userError);
      return;
    }
    user = newUser;
  } else {
    console.log('User already exists, updating properties...');
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_admin: true,
        subscription_plan: 'dominator',
        password_hash: passwordHash
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('User update error:', updateError);
    }
  }

  // Ensure supplementary records exist
  try { await supabase.from('scores').insert({ user_id: user.id }).select().single(); } catch (_) {}
  try {
    await supabase.from('progress').insert({
      user_id: user.id,
      last_active_date: new Date().toISOString(),
      streak: 1,
    }).select().single();
  } catch (_) {}
  try { await supabase.from('skill_identity').insert({ user_id: user.id }).select().single(); } catch (_) {}
  
  // Find or insert into authors table
  let { data: author, error: authorSelectError } = await supabase
    .from('authors')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (authorSelectError) {
    console.error('Error selecting author:', authorSelectError);
    return;
  }

  if (!author) {
    console.log('Author profile does not exist, creating...');
    const { error: authorError } = await supabase
      .from('authors')
      .insert({
        user_id: user.id,
        name: 'DSA Expert',
        bio: 'Senior DSA instructor with expertise in competitive programming and interview preparation.',
        role: 'admin'
      });
    
    if (authorError) {
      console.error('Author creation error:', authorError);
      return;
    }
  } else {
    console.log('Author profile already exists, updating properties...');
    const { error: authorUpdateError } = await supabase
      .from('authors')
      .update({
        name: 'DSA Expert',
        bio: 'Senior DSA instructor with expertise in competitive programming and interview preparation.',
        role: 'admin'
      })
      .eq('user_id', user.id);
    
    if (authorUpdateError) {
      console.error('Author update error:', authorUpdateError);
      return;
    }
  }
  
  console.log('✅ Dummy author setup complete!');
  console.log('Credentials:');
  console.log('Email: dsa.author@genois.in');
  console.log('Password: DSAAuthor@2024');
}

createDummyAuthor();
