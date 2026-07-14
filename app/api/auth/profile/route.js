import { z } from 'zod';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getCollegeTier } from '@/lib/contextBuilder';
import { invalidateUserRoadmap } from '@/lib/roadmapCache';

// Changing any of these reshapes what the AI generates, so a save must throw
// away the cached roadmap and force a personalized regeneration.
const ROADMAP_AFFECTING = ['target_companies', 'weak_subjects', 'months_to_placement', 'cgpa', 'college', 'college_tier'];

const ProfileUpdateSchema = z.object({
  name:                z.string().trim().min(1).max(50).optional(),
  college:             z.string().trim().max(200).optional().nullable(),
  year:                z.string().trim().max(20).optional().nullable(),
  learningSpeed:       z.enum(['slow', 'normal', 'fast']).optional(),
  target_companies:    z.array(z.string().max(50)).max(10).optional(),
  cgpa:                z.number().min(0).max(10).optional().nullable(),
  months_to_placement: z.number().int().min(1).max(36).optional().nullable(),
  weak_subjects:       z.array(z.string().max(100)).max(20).optional(),
  placement_type:      z.enum(['campus', 'off-campus', 'both']).optional(),
  college_tier:        z.enum(['tier1', 'tier2', 'tier3']).optional(),
}).strict();

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (error || !user) return errorResponse('User not found', 404);

    const [
      { data: progress },
      { data: score },
      { data: skill },
      { data: trial },
      { data: weakTopics },
      { data: strongTopics },
    ] = await Promise.all([
      supabase.from('progress').select('*').eq('user_id', user.id).single(),
      supabase.from('scores').select('*').eq('user_id', user.id).single(),
      supabase.from('skill_identity').select('*').eq('user_id', user.id).single(),
      supabase.from('trials').select('*').eq('user_id', user.id).single(),
      supabase.from('weak_topics').select('*').eq('user_id', user.id).order('avg_score', { ascending: true }).limit(10),
      supabase.from('strong_topics').select('*').eq('user_id', user.id).order('avg_score', { ascending: false }).limit(10),
    ]);

    const { password_hash: _, ...safeUser } = user;
    safeUser.weeklyBadge = safeUser.weekly_badge || null;

    return successResponse({
      user: safeUser,
      progress,
      score,
      skill,
      trial,
      weakTopics: weakTopics || [],
      strongTopics: strongTopics || [],
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function PUT(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }

    // .strict() rejects unknown keys — kills any mass-assignment attempt
    // (is_admin, subscription_plan, total_score, trial_ends_at, etc.).
    const parsed = ProfileUpdateSchema.safeParse(body);
    if (!parsed.success) return errorResponse((parsed.error.issues?.[0]?.message || parsed.error.errors?.[0]?.message || "Validation failed"), 400);
    const { name, college, year, learningSpeed, target_companies, cgpa, months_to_placement, weak_subjects, placement_type, college_tier } = parsed.data;

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (college !== undefined) {
      updates.college = college;
      updates.college_tier = getCollegeTier(college);
    }
    if (year !== undefined) updates.year = year;
    if (learningSpeed !== undefined) updates.learning_speed = learningSpeed;
    if (target_companies !== undefined) updates.target_companies = target_companies;
    if (cgpa !== undefined) updates.cgpa = cgpa;
    if (months_to_placement !== undefined) updates.months_to_placement = months_to_placement;
    if (weak_subjects !== undefined) updates.weak_subjects = weak_subjects;
    if (placement_type !== undefined) updates.placement_type = placement_type;
    if (college_tier !== undefined && !updates.college_tier) updates.college_tier = college_tier;

    const supabase = getAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', payload.userId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // If the placement target/timeline/weaknesses changed, blow away the cached
    // roadmap so the next /roadmap fetch regenerates it against the new profile.
    const roadmapInvalidated = ROADMAP_AFFECTING.some(f => parsed.data[f] !== undefined);
    if (roadmapInvalidated) {
      await invalidateUserRoadmap(payload.userId, supabase);
    }

    const { password_hash: _, ...safeUser } = user;
    return successResponse({ user: safeUser, roadmapInvalidated }, 'Profile updated');
  } catch (error) {
    console.error('Profile update error:', error);
    return errorResponse('Internal server error', 500);
  }
}
