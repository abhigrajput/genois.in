import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { saveAttemptReview } from '@/lib/attemptReview';
import { resolveSkill } from '@/lib/skillTaxonomy';

// A mock-interview question carries a `type` (conceptual | technical |
// problem solving | behavioral | situational). Behavioural answers are evidence
// about communication; technical ones are evidence about what they know. The
// hint steers the resolver toward the right vocabulary.
const DOMAINS_BY_QUESTION_TYPE = {
  behavioral: ['comm'],
  situational: ['comm'],
  technical: ['cs', 'dsa', 'comm'],
  conceptual: ['cs', 'dsa', 'comm'],
  'problem solving': ['dsa', 'cs'],
};

async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content[0].text;
}

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`api_${payload.userId}`, 3, 60000)) return rateLimitResponse();
    const supabase = getAdminClient();

    const { data: interviews } = await supabase
      .from('mock_interviews')
      .select('*')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return successResponse({ interviews: interviews || [] });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`api_${payload.userId}`, 3, 60000)) return rateLimitResponse();
    const { action, interviewId, answer, questionIndex } = await request.json();
    const supabase = getAdminClient();

    if (action === 'start') {
      const { data: user } = await supabase
        .from('users')
        .select('domain_slug, name')
        .eq('id', payload.userId)
        .single();

      const domain = user?.domain_slug || 'fullstack';

      const questionsPrompt = `You are a senior technical interviewer at a top tech company.
Generate 10 interview questions for a ${domain} engineering student.
Mix: 3 conceptual, 3 technical, 2 problem solving, 1 behavioral, 1 situational.
Make them realistic — questions actually asked at TCS Infosys Wipro and startups.
Return ONLY valid JSON array with no markdown or explanation:
[{"question":"...","type":"technical","difficulty":"medium","hint":"what to cover in a good answer"}]`;

      const questionsText = await callClaude(questionsPrompt);
      let questions = [];
      try {
        questions = JSON.parse(questionsText.replace(/```json|```/g, '').trim());
      } catch {
        questions = [
          { question: `Tell me about yourself and why you chose ${domain}.`, type: 'behavioral', difficulty: 'easy', hint: 'Cover background, skills, and motivation' },
          { question: `What are the core concepts of ${domain}?`, type: 'conceptual', difficulty: 'medium', hint: 'Cover fundamentals' },
          { question: `Describe a project you built in ${domain}.`, type: 'technical', difficulty: 'medium', hint: 'Cover what you built and challenges faced' },
        ];
      }

      const { data: interview, error: writeErr2 } = await supabase
        .from('mock_interviews')
        .insert({
          user_id: payload.userId,
          domain_slug: domain,
          status: 'in_progress',
          questions,
          answers: [],
          evaluations: [],
        })
        .select()
        .single();
      if (writeErr2) console.error('DB write failed: mock_interviews.insert', { code: writeErr2.code, message: writeErr2.message, details: writeErr2.details });

      return successResponse({ interview, firstQuestion: questions[0] });
    }

    if (action === 'answer') {
      const { data: interview } = await supabase
        .from('mock_interviews')
        .select('*')
        .eq('id', interviewId)
        .eq('user_id', payload.userId)
        .single();

      if (!interview) return errorResponse('Interview not found', 404);

      const question = interview.questions[questionIndex];
      const evalPrompt = `You are a senior interviewer evaluating a candidate's answer.

Question: "${question.question}"
Expected to cover: ${question.hint}
Candidate's answer: "${answer}"

Evaluate this answer. Return ONLY valid JSON with no markdown:
{
  "score": 0-10,
  "verdict": "Strong" or "Good" or "Weak" or "Poor",
  "what_was_good": "specific praise if any",
  "what_was_missing": "specific gaps",
  "better_answer": "how they should have answered in 2-3 sentences",
  "tip": "one actionable tip for next time"
}`;

      const evalText = await callClaude(evalPrompt);
      let evaluation = {};
      try {
        evaluation = JSON.parse(evalText.replace(/```json|```/g, '').trim());
      } catch {
        evaluation = { score: 5, verdict: 'Good', what_was_good: 'You attempted the question', what_was_missing: 'More detail needed', better_answer: 'Provide more specific examples', tip: 'Practice explaining concepts clearly' };
      }

      const newAnswers = [...(interview.answers || []), { questionIndex, answer, timestamp: new Date().toISOString() }];
      const newEvals = [...(interview.evaluations || []), { questionIndex, ...evaluation }];

      const isLast = questionIndex >= interview.questions.length - 1;
      let updateData = { answers: newAnswers, evaluations: newEvals };
      let attemptId = null;

      if (isLast) {
        const avgScore = Math.round(newEvals.reduce((a, e) => a + (e.score || 0), 0) / newEvals.length);
        const readiness = Math.min(100, avgScore * 10);

        const summaryPrompt = `You evaluated a ${interview.domain_slug} interview with these scores: ${newEvals.map((e, i) => `Q${i+1}: ${e.score}/10`).join(', ')}.
Average score: ${avgScore}/10.
Write a 3-sentence overall feedback summary. Be honest and constructive. Tell them exactly what to improve.
Return plain text only.`;

        const feedback = await callClaude(summaryPrompt);

        updateData = {
          ...updateData,
          status: 'completed',
          overall_score: avgScore,
          interview_readiness: readiness,
          feedback,
          completed_at: new Date().toISOString(),
        };

        // Evidence bus: emit the whole interview at completion. `mock_interviews`
        // already held the Q&A and per-answer evaluations, but nothing joined it
        // to a skill, so ten answered questions produced zero evidence.
        // Each question is tagged by its own `type` — a behavioural answer is
        // evidence about communication, a technical one about the concept asked.
        const evalByIndex = new Map(newEvals.map(e => [e.questionIndex, e]));
        attemptId = await saveAttemptReview({
          userId: payload.userId,
          attemptType: 'mock_interview',
          sourceId: interview.id,
          topic: interview.domain_slug ? `${interview.domain_slug} mock interview` : 'Mock interview',
          // Evaluations are 0-10; test_questions.score is 0-100.
          score: avgScore * 10,
          questions: interview.questions.map((q, i) => {
            const ev = evalByIndex.get(i) || {};
            const ans = newAnswers.find(a => a.questionIndex === i);
            const type = String(q.type || 'technical').toLowerCase();
            return {
              question: q.question,
              correct_answer: ev.better_answer || q.hint || '',
              user_answer: ans?.answer || null,
              // 6/10 is the "Good" band in the rubric above — below that the
              // answer had real gaps, so it is not evidence of knowing this.
              is_correct: Number(ev.score) >= 6,
              explanation: [ev.what_was_good, ev.what_was_missing, ev.tip].filter(Boolean).join(' — '),
              topic: q.type || null,
              skill: resolveSkill(`${q.question} ${q.hint || ''}`, {
                domains: DOMAINS_BY_QUESTION_TYPE[type] || ['cs', 'dsa', 'comm'],
                fallback: null,
              }) || (DOMAINS_BY_QUESTION_TYPE[type]?.[0] === 'comm'
                ? 'comm.star-method'
                : 'comm.technical-explanation'),
            };
          }),
        });
      }

      const { error: writeErr } = await supabase.from('mock_interviews').update(updateData).eq('id', interviewId);
      if (writeErr) console.error('DB write failed: mock_interviews.update', { code: writeErr.code, message: writeErr.message, details: writeErr.details });

      const nextQuestion = isLast ? null : interview.questions[questionIndex + 1];

      return successResponse({
        evaluation,
        nextQuestion,
        questionIndex,
        isLast,
        attemptId,
        totalQuestions: interview.questions.length,
      });
    }

    return errorResponse('Invalid action', 400);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
