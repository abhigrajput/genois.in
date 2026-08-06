import { getUserFromRequest } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import { invalidateUserRoadmap } from '@/lib/roadmapCache';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const domain = body.domain || body.domainSlug;
    const validDomains = ['fullstack','dsa','cybersecurity','aiml','devops','android','datascience','blockchain','gamedev','systemdesign'];
    if (!validDomains.includes(domain)) return errorResponse('Invalid domain', 400);
    const supabase = getAdminClient();
    const { error: writeErr } = await supabase.from('users').update({ domain_slug: domain }).eq('id', payload.userId);
    if (writeErr) console.error('DB write failed: users.update', { code: writeErr.code, message: writeErr.message, details: writeErr.details });
    const { error: writeErr2 } = await supabase.from('progress').update({ current_day: 1, streak: 0, tasks_completed_today: 0 }).eq('user_id', payload.userId);
    if (writeErr2) console.error('DB write failed: progress.update', { code: writeErr2.code, message: writeErr2.message, details: writeErr2.details });
    const { error: writeErr3 } = await supabase.from('dsa_roadmap_progress').update({ current_day: 1, completed_days: [], diagnostic_taken: false }).eq('user_id', payload.userId);
    if (writeErr3) console.error('DB write failed: dsa_roadmap_progress.update', { code: writeErr3.code, message: writeErr3.message, details: writeErr3.details });
    // Per-user roadmap rows are keyed by (user_id, day) — NOT domain — so day 1
    // still holds the OLD domain's content until we invalidate it.
    await invalidateUserRoadmap(payload.userId, supabase);
    return successResponse({ message: 'Domain changed successfully', domain });
  } catch (error) {
    console.error(error);
    return errorResponse('Internal server error', 500);
  }
}

export const PUT = POST;
