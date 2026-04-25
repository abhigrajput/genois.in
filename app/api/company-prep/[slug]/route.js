import { COMPANIES } from '@/lib/companiesData';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const company = COMPANIES.find(c => c.slug === slug);
    if (!company) return errorResponse('Company not found', 404);

    const supabase = getAdminClient();
    const [questionsRes, discussionsRes] = await Promise.all([
      supabase.from('company_questions').select('*').eq('company_slug', slug).order('upvotes', { ascending: false }).limit(50),
      supabase.from('company_discussions').select('*, users(name)').eq('company_slug', slug).order('created_at', { ascending: false }).limit(20),
    ]);

    return successResponse({
      company,
      questions: questionsRes.data || [],
      discussions: discussionsRes.data || [],
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
