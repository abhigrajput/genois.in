import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { askClaudeChat } from '@/lib/claude';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { sanitizeChatHistory, sanitizeUserMessage } from '@/lib/security';

const MENTOR_SYSTEMS = {
  explain: (ctx) => `You are GENOIS AI Mentor — a personal tutor for ${ctx.name}.
Student: Domain=${ctx.domain}, Level=${ctx.level}, Day=${ctx.currentDay}/30, Progress=${ctx.progress}%.
Today's topic: "${ctx.topic}".
Weak topics: ${ctx.weakTopics || 'none yet'}.
Strong topics: ${ctx.strongTopics || 'none yet'}.
Learning speed: ${ctx.speed}.

Rules:
- Use simple language suited to ${ctx.level} level
- Give real-world examples relevant to Indian engineering students
- Relate to their current topic when possible
- ${ctx.speed === 'slow' ? 'Explain slowly with many examples and analogies' : ctx.speed === 'fast' ? 'Be concise and technical, skip basics' : 'Be clear and standard pace'}
- End every response with: "Does this make sense? What part should I explain differently?"`,

  coding: (ctx) => `You are GENOIS coding mentor for ${ctx.name}.
They are a ${ctx.level} level ${ctx.domain} student on Day ${ctx.currentDay}.
Today's topic: "${ctx.topic}". Weak areas: ${ctx.weakTopics || 'none'}.

When helping with code:
- Always show working code with comments explaining each line
- Point out time and space complexity
- Suggest improvements gently
- Ask what language they want if not specified
- Be encouraging about mistakes`,

  roadmap: (ctx) => `You are GENOIS roadmap advisor for ${ctx.name}.
They are on Day ${ctx.currentDay}/30 in ${ctx.domain}, ${ctx.level} level. ${ctx.progress}% complete. Streak: ${ctx.streak} days.

Help them understand:
- What to study today and why
- How long topics take
- How to manage their time
- Whether they are on track for job readiness
Be encouraging. If stuck, suggest breaking topics into 30-minute chunks.`,

  project: (ctx) => `You are GENOIS project mentor for ${ctx.name}.
They are a ${ctx.level} level ${ctx.domain} student on Day ${ctx.currentDay}.

Help them plan, start, debug and submit weekly projects.
Ask what they have done so far before advising.
Break projects into small concrete steps.
Be specific about implementation details.
Troubleshoot errors they share with you.`,

  notes: (ctx) => `You are GENOIS study notes mentor for ${ctx.name}.
${ctx.level} level student in ${ctx.domain}. Today's topic: "${ctx.topic}".
Weak topics to focus on: ${ctx.weakTopics || 'none'}.

Help them understand their notes, clarify confusing parts, quiz them gently.
After explaining something, ask them to repeat it back in their own words.
This is the GENOIS learning method — understanding, not memorization.`,
};

async function buildContext(supabase, userId) {
  const [
    { data: user },
    { data: progress },
    { data: weakTopics },
    { data: strongTopics },
  ] = await Promise.all([
    supabase.from('users').select('name, domain_slug, level, learning_speed').eq('id', userId).single(),
    supabase.from('progress').select('current_day, progress_percent, streak').eq('user_id', userId).single(),
    supabase.from('weak_topics').select('topic').eq('user_id', userId).order('avg_score', { ascending: true }).limit(5),
    supabase.from('strong_topics').select('topic').eq('user_id', userId).limit(5),
  ]);

  const currentDay = progress?.current_day || 1;
  const { data: roadmap } = await supabase
    .from('roadmap').select('topic')
    .eq('domain_slug', user?.domain_slug)
    .eq('day_number', currentDay)
    .single();

  return {
    name: user?.name || 'Student',
    domain: user?.domain_slug || 'fullstack',
    level: user?.level || 'beginner',
    speed: user?.learning_speed || 'normal',
    currentDay,
    progress: Math.round(progress?.progress_percent || 0),
    streak: progress?.streak || 0,
    topic: roadmap?.topic || 'getting started',
    weakTopics: (weakTopics || []).map(w => w.topic).join(', ') || 'none yet',
    strongTopics: (strongTopics || []).map(s => s.topic).join(', ') || 'none yet',
  };
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`mentor_${payload.userId}`, 10, 60000)) return rateLimitResponse();

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }
    const { message, mode, conversationHistory } = body || {};

    const cleanMessage = sanitizeUserMessage(message, 4000);
    if (!cleanMessage) return errorResponse('Message is required', 400);

    const validModes = ['explain', 'coding', 'roadmap', 'project', 'notes'];
    const selectedMode = validModes.includes(mode) ? mode : 'explain';

    const supabase = getAdminClient();
    const ctx = await buildContext(supabase, payload.userId);
    const systemFn = MENTOR_SYSTEMS[selectedMode];
    const system = systemFn(ctx);

    const messages = [
      ...sanitizeChatHistory(conversationHistory, 10, 4000),
      { role: 'user', content: cleanMessage },
    ];

    const response = await askClaudeChat(messages, system, 1500);

    // supabase-js resolves with { error } instead of throwing, so an unchecked
    // insert fails silently: the user still gets their reply and nothing is
    // persisted or logged. Surface it — the reply is worth more than the
    // history row, so this stays non-fatal, but it must not be invisible.
    const { error: historyError } = await supabase.from('mentor_history').insert({
      user_id: payload.userId,
      message: cleanMessage,
      response,
      mode: selectedMode,
      domain: ctx.domain,
      topic: ctx.topic,
    });
    if (historyError) {
      console.error('Mentor history insert failed:', {
        userId: payload.userId,
        mode: selectedMode,
        code: historyError.code,
        message: historyError.message,
        details: historyError.details,
      });
    }

    return successResponse({
      response,
      mode: selectedMode,
      context: { topic: ctx.topic, day: ctx.currentDay },
    });
  } catch (error) {
    console.error('Mentor error:', error);
    return errorResponse('Internal server error', 500);
  }
}
