import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { STREAK_REWARDS, getUnclaimedRewards, getNextReward } from '@/lib/streakRewards';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('streak, last_reward_streak')
      .eq('id', payload.userId)
      .single();

    const currentStreak = user?.streak || 0;
    const lastClaimed = user?.last_reward_streak || 0;
    const unclaimed = getUnclaimedRewards(currentStreak, lastClaimed);
    const nextReward = getNextReward(currentStreak);

    const { data: history } = await supabase
      .from('streak_rewards')
      .select('*')
      .eq('user_id', payload.userId)
      .order('claimed_at', { ascending: false });

    return successResponse({
      currentStreak,
      lastClaimed,
      unclaimed,
      nextReward,
      history: history || [],
      allRewards: STREAK_REWARDS,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('streak, last_reward_streak, total_score')
      .eq('id', payload.userId)
      .single();

    const currentStreak = user?.streak || 0;
    const lastClaimed = user?.last_reward_streak || 0;
    const unclaimed = getUnclaimedRewards(currentStreak, lastClaimed);

    if (unclaimed.length === 0) {
      return errorResponse('No rewards to claim', 400);
    }

    let pointsToAdd = 0;
    const newRewards = [];

    for (const reward of unclaimed) {
      if (reward.type === 'points') {
        pointsToAdd += parseInt(reward.value, 10);
      }
      newRewards.push({
        user_id: payload.userId,
        streak_day: reward.day,
        reward_type: reward.type,
        reward_value: String(reward.value),
      });
    }

    if (newRewards.length > 0) {
      await supabase.from('streak_rewards').insert(newRewards);
    }

    const highestDay = Math.max(...unclaimed.map(r => r.day));
    await supabase
      .from('users')
      .update({
        total_score: (user.total_score || 0) + pointsToAdd,
        last_reward_streak: highestDay,
      })
      .eq('id', payload.userId);

    return successResponse({
      claimed: unclaimed,
      pointsAdded: pointsToAdd,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
