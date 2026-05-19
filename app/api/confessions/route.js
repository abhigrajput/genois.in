import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function GET(request) {
  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'top';
    const domain = searchParams.get('domain') || null;

    let query = supabase
      .from('confessions')
      .select('*')
      .limit(50);

    if (domain) query = query.eq('domain_slug', domain);
    if (sort === 'top') query = query.order('upvotes', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data: confessions } = await query;

    // Get user upvotes if logged in
    let userUpvotes = [];
    try {
      const payload = await getUserFromRequest(request);
      if (payload) {
        const { data: upvotes } = await supabase
          .from('confession_upvotes')
          .select('confession_id')
          .eq('user_id', payload.userId);
        userUpvotes = (upvotes || []).map(u => u.confession_id);
      }
    } catch {}

    const enriched = (confessions || []).map(c => ({
      ...c,
      hasUpvoted: userUpvotes.includes(c.id),
    }));

    return successResponse({ confessions: enriched });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`api_${payload.userId}`, 5, 60000)) return rateLimitResponse();

    const { content } = await request.json();
    if (!content || content.trim().length < 10) {
      return errorResponse('Confession must be at least 10 characters', 400);
    }
    if (content.trim().length > 500) {
      return errorResponse('Confession must be under 500 characters', 400);
    }

    const supabase = getAdminClient();

    const { data: user } = await supabase
      .from('users')
      .select('domain_slug')
      .eq('id', payload.userId)
      .single();

    const { data: confession } = await supabase
      .from('confessions')
      .insert({
        content: content.trim(),
        domain_slug: user?.domain_slug,
        upvotes: 0,
      })
      .select()
      .single();

    return successResponse({ confession });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
