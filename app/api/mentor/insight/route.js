import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { buildFullStudentContext } from '@/lib/contextBuilder';
import { askClaude } from '@/lib/claude';
import { getCached, setCached, buildCacheKey } from '@/lib/aiCache';

// A single, deterministic Hinglish nudge used when the AI call is unavailable —
// so the dashboard card always has something real and personal to show.
function fallbackInsight(ctx) {
  const name = ctx.name;
  if (ctx.streak === 0) {
    return `${name}, streak zero pe hai. Aaj bas 1 task karke dobara shuru karo — momentum wahin se banega.`;
  }
  if (ctx.testTrend === 'declining') {
    return `${name}, tere test scores gir rahe hain (avg ${ctx.avgTestScore}%). Aaj naye topic se pehle ${ctx.weakSubjects[0] || 'weak area'} revise kar.`;
  }
  if (ctx.testTrend === 'improving') {
    return `${name}, scores upar ja rahe hain (avg ${ctx.avgTestScore}%) — momentum hai! Aaj thoda harder problem try kar.`;
  }
  if (ctx.codingSolveRate != null && ctx.codingSolveRate < 40) {
    return `${name}, coding solve rate ${ctx.codingSolveRate}% hai. Aaj 1 easy problem poora solve kar — consistency > speed.`;
  }
  if (ctx.targetCompanies[0] && ctx.realLevel === 'beginner') {
    return `${name}, ${ctx.targetCompanies[0]} target hai but abhi basics strong karne hain. Roz 1 problem, ${ctx.streak} din streak — bas rukna mat.`;
  }
  return `${name}, Day ${ctx.currentDay} pe ho with a ${ctx.streak}-day streak. Aaj ka 1 task bhi miss mat karna.`;
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
- Speak in Hinglish (Hindi + English mix), like a senior who genuinely cares.
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
