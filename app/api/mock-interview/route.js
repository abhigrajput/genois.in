import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

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

      const { data: interview } = await supabase
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
      }

      await supabase.from('mock_interviews').update(updateData).eq('id', interviewId);

      const nextQuestion = isLast ? null : interview.questions[questionIndex + 1];

      return successResponse({
        evaluation,
        nextQuestion,
        questionIndex,
        isLast,
        totalQuestions: interview.questions.length,
      });
    }

    return errorResponse('Invalid action', 400);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
