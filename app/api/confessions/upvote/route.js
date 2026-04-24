import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { confessionId } = await request.json();
    const supabase = getAdminClient();

    const { data: existing } = await supabase
      .from('confession_upvotes')
      .select('id')
      .eq('confession_id', confessionId)
      .eq('user_id', payload.userId)
      .single();

    if (existing) {
      // Remove upvote
      await supabase.from('confession_upvotes').delete()
        .eq('confession_id', confessionId)
        .eq('user_id', payload.userId);
      await supabase.rpc('decrement_upvotes', { confession_id: confessionId })
        .catch(async () => {
          const { data: c } = await supabase.from('confessions').select('upvotes').eq('id', confessionId).single();
          await supabase.from('confessions').update({ upvotes: Math.max(0, (c?.upvotes || 1) - 1) }).eq('id', confessionId);
        });
      return successResponse({ upvoted: false });
    } else {
      // Add upvote
      await supabase.from('confession_upvotes').insert({
        confession_id: confessionId,
        user_id: payload.userId,
      });
      const { data: c } = await supabase.from('confessions').select('upvotes').eq('id', confessionId).single();
      await supabase.from('confessions').update({ upvotes: (c?.upvotes || 0) + 1 }).eq('id', confessionId);
      return successResponse({ upvoted: true });
    }
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
