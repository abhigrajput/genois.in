import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { buildFullStudentContext } from '@/lib/contextBuilder';
import { askClaude } from '@/lib/claude';
import { getCached, setCached, buildCacheKey } from '@/lib/aiCache';

// A single, deterministic professional-English nudge used when the AI call is
// unavailable — so the dashboard card always has something real and personal to show.
function fallbackInsight(ctx) {
  const name = ctx.name;
  if (ctx.streak === 0) {
    return `${name}, your streak is at zero. Complete just one task today to restart — momentum builds from there.`;
  }
  if (ctx.testTrend === 'declining') {
    return `${name}, your test scores are declining (avg ${ctx.avgTestScore}%). Revise ${ctx.weakSubjects[0] || 'your weak area'} today before starting any new topic.`;
  }
  if (ctx.testTrend === 'improving') {
    return `${name}, your scores are trending up (avg ${ctx.avgTestScore}%) — keep the momentum. Attempt a harder problem today.`;
  }
  if (ctx.codingSolveRate != null && ctx.codingSolveRate < 40) {
    return `${name}, your coding solve rate is ${ctx.codingSolveRate}%. Fully solve one easy problem today — consistency beats speed.`;
  }
  if (ctx.targetCompanies[0] && ctx.realLevel === 'beginner') {
    return `${name}, ${ctx.targetCompanies[0]} is your target but your fundamentals need work. One problem a day, ${ctx.streak}-day streak — stay consistent.`;
  }
  return `${name}, you're on Day ${ctx.currentDay} with a ${ctx.streak}-day streak. Do not miss today's task.`;
}

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`insight_${payload.userId}`, 20, 60000)) return rateLimitResponse();

    const ctx = await buildFullStudentContext(payload.userId);

    // One insight per student per day.
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = buildCacheKey('mentor_insight', payload.userId, today);

    const cached = await getCached(cacheKey);
    if (cached) return successResponse({ insight: cached, cached: true });

    let insight;
    try {
      const prompt = `You are ${ctx.name}'s personal placement mentor. Based ONLY on the data below, write ONE short insight (max 2 sentences) that makes them feel watched and pushes them to act TODAY.

DATA:
- Day ${ctx.currentDay}, ${ctx.streak}-day streak, ${ctx.totalScore} points
- Real level: ${ctx.realLevel} (self-reported: ${ctx.selfReportedLevel})
- Test average: ${ctx.avgTestScore != null ? ctx.avgTestScore + '%' : 'no tests yet'} (${ctx.testTrend})
- Coding solve rate: ${ctx.codingSolveRate != null ? ctx.codingSolveRate + '%' : 'no data'} (${ctx.problemsSolved} solved)
- Interviews taken: ${ctx.interviewsTaken}${ctx.avgInterviewScore != null ? ` (avg ${ctx.avgInterviewScore})` : ''}
- Target: ${ctx.targetCompanies.join(', ') || 'not set'}
- Weak subjects: ${ctx.weakSubjects.join(', ') || 'none'}
- Timeline: ${ctx.monthsToPlacement || '?'} months to placement

RULES:
- Communicate in clear, professional English. Be direct, technical, and precise. No slang, no filler.
- Reference a SPECIFIC number from the data.
- Address them by name (${ctx.name}).
- Be direct — a real nudge, not generic motivation.
- Return ONLY the insight text. No quotes, no preamble.`;

      insight = (await askClaude(prompt, '', 160)).trim().replace(/^["']|["']$/g, '');
      if (!insight) insight = fallbackInsight(ctx);
    } catch (e) {
      console.error('Mentor insight AI failed, using fallback:', e);
      insight = fallbackInsight(ctx);
    }

    await setCached(cacheKey, insight, 24);

    return successResponse({ insight, cached: false });
  } catch (error) {
    console.error('Mentor insight error:', error);
    return errorResponse('Internal server error', 500);
  }
}
