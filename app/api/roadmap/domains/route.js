import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .eq('is_active', true)
      .order('slug');
    if (error) throw new Error(error.message);
    return successResponse(data);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
