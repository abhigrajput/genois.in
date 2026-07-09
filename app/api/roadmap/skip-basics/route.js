import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

// First day of the BUILD phase — everything before it is foundation/basics
// (see curriculumGenerator.difficultyPhase: days 1–3 are FOUNDATION).
const FIRST_BUILD_DAY = 4;

// Lets an advanced student skip the fundamentals mid-journey by moving their
// official current day forward to the start of the BUILD phase. Never moves a
// user backwards, so someone already past day 4 is unaffected.
export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();

    const { data: progress } = await supabase
      .from('progress')
      .select('current_day')
      .eq('user_id', payload.userId)
      .single();

    const currentDay = progress?.current_day || 1;
    if (currentDay >= FIRST_BUILD_DAY) {
      return successResponse({ currentDay, skipped: false }, 'Already past the basics');
    }

    const newDay = FIRST_BUILD_DAY;
    const newWeek = Math.ceil(newDay / 7);
    const { error } = await supabase
      .from('progress')
      .update({ current_day: newDay, current_week: newWeek })
      .eq('user_id', payload.userId);

    if (error) {
      console.error('skip-basics update error:', JSON.stringify(error));
      return errorResponse('Could not skip basics', 500);
    }

    // Also flag the preference on the user for future generations.
    await supabase.from('users').update({ level: 'advanced' }).eq('id', payload.userId)
      .then(undefined, () => {});

    return successResponse({ currentDay: newDay, skipped: true }, 'Skipped to the BUILD phase');
  } catch (error) {
    console.error('skip-basics error:', error);
    return errorResponse('Internal server error', 500);
  }
}
