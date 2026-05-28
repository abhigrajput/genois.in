import { getAdminClient } from '@/lib/supabaseAdmin';
import { errorResponse } from '@/lib/response';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { badgeId } = await params;
    if (!badgeId) return errorResponse('Badge ID required', 400);

    const supabase = getAdminClient();

    const { data: badge, error } = await supabase
      .from('user_badges')
      .select(`
        id, domain, score, level, status, earned_at, expires_at,
        users!inner(name)
      `)
      .eq('id', badgeId)
      .single();

    if (error || !badge) {
      return NextResponse.json({ valid: false, error: 'Badge not found' }, { status: 404 });
    }

    const isExpired = new Date(badge.expires_at) < new Date();
    const status = isExpired ? 'inactive' : badge.status;

    return NextResponse.json({
      valid: status === 'active',
      domain: badge.domain,
      level: badge.level,
      score: badge.score,
      holderName: badge.users?.name || 'GENOIS User',
      earnedAt: badge.earned_at,
      expiresAt: badge.expires_at,
      status,
    });
  } catch (error) {
    console.error('[badge/verify] Error:', error);
    return NextResponse.json({ valid: false, error: 'Verification failed' }, { status: 500 });
  }
}
