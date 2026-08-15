import { getAdminClient, logWriteError } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { saveAttemptReview } from '@/lib/attemptReview';
import { resolveSkill } from '@/lib/skillTaxonomy';

// Voice-interview turns carry a `type`, not a topic. Behavioural/HR turns are
// evidence about communication; technical turns are evidence about whatever the
// question was actually about, so those resolve from the question text first
// and only fall back to a delivery skill.
const TURN_DOMAINS = {
  behavioral: ['comm'],
  hr: ['comm'],
  technical: ['cs', 'dsa', 'comm'],
  mixed: ['cs', 'dsa', 'comm'],
};

function skillForTurn(turn) {
  const type = String(turn?.type || 'technical').toLowerCase();
  const fromQuestion = resolveSkill(turn?.question, {
    domains: TURN_DOMAINS[type] || ['cs', 'dsa', 'comm'],
    fallback: null,
  });
  if (fromQuestion) return fromQuestion;
  return type === 'behavioral' || type === 'hr' ? 'comm.star-method' : 'comm.technical-explanation';
}

export const dynamic = 'force-dynamic';

const num = (v) => (v == null || v === '' || isNaN(Number(v)) ? null : Number(v));
const clampPct = (n) => Math.max(1, Math.min(99, Math.round(n)));

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const body = await request.json();
    const totalScore = num(body.totalScore) ?? 0;

    const row = {
      user_id: payload.userId,
      mode: ['technical', 'behavioral', 'hr', 'mixed'].includes(body.mode) ? body.mode : 'technical',
      domain: body.domain || null,
      target_company: body.targetCompany || null,
      total_score: num(body.totalScore),
      technical_accuracy: num(body.technicalAccuracy),
      communication_clarity: num(body.communicationClarity),
      confidence_score: num(body.confidenceScore),
      grade: body.grade || null,
      questions_answered: num(body.questionsAnswered),
      duration_seconds: num(body.durationSeconds),
    };

    const supabase = getAdminClient();

    let saved = false;
    // Null until a real peer sample supports it. This used to default to
    // clampPct(totalScore * 0.9) — a number derived from the user's own score
    // and then shown as "Beat X% of students", which compared them to nobody.
    // The results screen already hides the line when this is null.
    let percentile = null;

    // Persist the full Q&A transcript for the review page. `turns` is
    // [{ question, type, answer, evaluation }] from the voice-interview page;
    // older clients that omit it just skip review persistence.
    let attemptId = null;
    if (Array.isArray(body.turns) && body.turns.length > 0) {
      attemptId = await saveAttemptReview({
        userId: payload.userId,
        attemptType: 'voice_interview',
        topic: body.targetCompany ? `${body.targetCompany} interview` : 'Voice interview',
        score: num(body.totalScore),
        questions: body.turns.slice(0, 15).map(t => ({
          question: t.question,
          correct_answer: t.evaluation?.idealAnswer || '',
          user_answer: t.answer,
          is_correct: Number(t.evaluation?.overallScore) >= 60,
          explanation: [t.evaluation?.verdict, ...(t.evaluation?.improvements || [])]
            .filter(Boolean).join(' — '),
          topic: t.type || 'technical',
          skill: skillForTurn(t),
        })),
      });
    }

    try {
      // NOTE: supabase doesn't throw on DB errors — this catch only sees
      // network-level failures, so a rejected insert still reports saved:true.
      const { error: insertErr } = await supabase.from('interview_results').insert(row);
      logWriteError('interview/save', 'interview_results.insert', insertErr);
      saved = true;

      // Real percentile from peers (only trust it once there's a meaningful sample).
      const { data: peers } = await supabase
        .from('interview_results')
        .select('total_score');
      if (Array.isArray(peers) && peers.length >= 8) {
        const scores = peers.map(p => Number(p.total_score)).filter(s => !isNaN(s));
        const beaten = scores.filter(s => s < totalScore).length;
        percentile = clampPct((beaten / scores.length) * 100);
      }
    } catch (e) {
      // Table may not be migrated yet — don't break the user's results screen.
      console.warn('[interview/save] insert/percentile skipped:', e.message);
    }

    return successResponse({ saved, percentile, attemptId });
  } catch (error) {
    console.error('[interview/save] Error:', error);
    return errorResponse('Could not save results', 500);
  }
}
