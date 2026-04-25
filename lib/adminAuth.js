import { getUserFromRequest } from '@/lib/auth';

const ADMIN_EMAILS = ['abhigrajput5@gmail.com'];

export async function isAdmin(email) {
  return ADMIN_EMAILS.includes(email);
}

export async function getAdminFromRequest(request) {
  const payload = await getUserFromRequest(request);
  if (!payload) return null;
  
  const { getAdminClient } = await import('@/lib/supabaseAdmin');
  const supabase = getAdminClient();
  
  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('id', payload.userId)
    .single();
  
  if (!user || !ADMIN_EMAILS.includes(user.email)) return null;
  return { ...payload, email: user.email };
}
