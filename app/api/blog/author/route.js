import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload || !payload.userId) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getAdminClient();
    const { data: author, error } = await supabase
      .from('authors')
      .select('*')
      .eq('user_id', payload.userId)
      .maybeSingle();

    if (error) {
      console.error('Database error checking author:', error);
      return errorResponse('Internal database error', 500);
    }

    if (!author) {
      return successResponse({ isAuthor: false }, 'User is not an author');
    }

    return successResponse({ isAuthor: true, author }, 'Author profile retrieved successfully');
  } catch (error) {
    console.error('Author API Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
