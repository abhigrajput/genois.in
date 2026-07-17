import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { askClaudeJSON } from '@/lib/claude';

export const dynamic = 'force-dynamic';

// Pasted resumes: below this it's a fragment, above it it's likely a JD dump
// or multiple documents — both produce garbage analysis, so reject early.
const MIN_RESUME_CHARS = 200;
const MAX_RESUME_CHARS = 15000;

const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
const str = (v, max = 600) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function buildPrompt({ resumeText, targetRole, targetCompany }) {
  return `You are an expert ATS (Applicant Tracking System) auditor and technical resume reviewer for Indian engineering students targeting placements. Analyze ONLY the resume text below — do not invent experience the candidate doesn't have.

Target role: ${targetRole || 'Software Engineer (fresher/entry level)'}
Target company: ${targetCompany || 'top product and service companies'}

RESUME TEXT (pasted as plain text, so exact visual formatting is unknown — infer structure from the text):
---
${resumeText}
---

Produce a rigorous breakdown:

1. ats_score (0-100): how well this resume would survive ATS parsing AND a recruiter's 30-second scan for the target role. Score honestly — most student resumes land 40-70. Consider: relevant keywords present, quantified impact, standard section headers, scannable structure, role alignment.
2. score_explanation: 2-4 plain sentences saying WHAT drove the score — the biggest positives and the biggest deductions. No jargon, no restating the number.
3. missing_keywords: skills/tools/terms that recruiters and ATS filters for THIS role/company expect but that are absent (or buried) in the resume. Only include keywords the candidate could plausibly claim given what's already there (e.g. they list React → "Redux" is fair; do NOT suggest lying).
4. weak_bullets: actual bullet lines from the resume that are vague, duty-based, or impact-free. For each: "original" = the exact line from the resume, "rewritten" = a stronger version using action verb + what + how + measurable outcome (use a realistic placeholder metric in [brackets] if the resume gives no number), "why" = one short sentence on what was weak.
5. missing_impact: bullet lines that describe work but give NO metric/outcome, with a "suggestion" telling the candidate exactly what number or result to add (users, %, time saved, scale, rank).
6. formatting_flags: things ATS parsers choke on that you can infer from the text — e.g. multi-column layout artifacts, tables, text that looks like it came from graphics/images, non-standard section headers, missing contact info, missing standard sections (Education/Skills/Projects), long paragraphs instead of bullets. For each: "issue" + "fix". Only flag what the text actually shows evidence of.

Return ONLY this JSON object:
{
  "ats_score": 0-100,
  "score_explanation": "...",
  "missing_keywords": ["keyword", "..."],
  "weak_bullets": [{ "original": "...", "rewritten": "...", "why": "..." }],
  "missing_impact": [{ "bullet": "...", "suggestion": "..." }],
  "formatting_flags": [{ "issue": "...", "fix": "..." }]
}
Empty arrays are fine where the resume genuinely has no issues of that type.`;
}

function normalize(raw) {
  const objArr = (v, shape, max = 8) => (Array.isArray(v) ? v : [])
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const out = {};
      for (const [key, maxLen] of Object.entries(shape)) out[key] = str(item[key], maxLen);
      return out;
    })
    .filter(item => item && Object.values(item).every(Boolean))
    .slice(0, max);

  return {
    ats_score: clamp(raw.ats_score),
    score_explanation: str(raw.score_explanation, 1000),
    missing_keywords: (Array.isArray(raw.missing_keywords) ? raw.missing_keywords : [])
      .filter(k => typeof k === 'string' && k.trim())
      .map(k => k.trim().slice(0, 60))
      .slice(0, 15),
    weak_bullets: objArr(raw.weak_bullets, { original: 500, rewritten: 500, why: 300 }),
    missing_impact: objArr(raw.missing_impact, { bullet: 500, suggestion: 300 }),
    formatting_flags: objArr(raw.formatting_flags, { issue: 300, fix: 300 }),
  };
}

// GET — past analyses. Degrades to `available: false` until the 20260717
// resume_analyses migration is applied (same pattern as /api/review).
export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('resume_analyses')
      .select('id, ats_score, target_role, target_company, analysis, created_at')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.warn('[resume/analyze] history unavailable:', error.message);
      return successResponse({ available: false, analyses: [] });
    }
    return successResponse({ available: true, analyses: data || [] });
  } catch (error) {
    console.error('[resume/analyze] GET error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`resume_${payload.userId}`, 5, 300000)) return rateLimitResponse();

    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }

    const resumeText = (body.resumeText || '').toString().trim();
    const targetRole = str(body.targetRole, 80);
    let targetCompany = str(body.targetCompany, 80);

    if (resumeText.length < MIN_RESUME_CHARS) {
      return errorResponse(`That looks too short to be a resume — paste the full text (at least ${MIN_RESUME_CHARS} characters).`, 400);
    }
    if (resumeText.length > MAX_RESUME_CHARS) {
      return errorResponse(`Resume text is too long (max ${MAX_RESUME_CHARS} characters). Paste the resume only, without job descriptions.`, 400);
    }

    const supabase = getAdminClient();

    // Default the target company from the profile when the user didn't type one.
    if (!targetCompany) {
      const { data: user } = await supabase
        .from('users')
        .select('target_companies')
        .eq('id', payload.userId)
        .single();
      if (Array.isArray(user?.target_companies) && user.target_companies.length) {
        targetCompany = user.target_companies.slice(0, 3).join(', ');
      }
    }

    // No fabricated fallback here: an invented ATS score is worse than an
    // error, so AI failures surface as a retryable 503 (guardrail: real
    // analysis or a clean error state).
    let analysis;
    try {
      const raw = await askClaudeJSON(
        buildPrompt({ resumeText, targetRole, targetCompany }),
        'You are a precise, honest resume auditor. Never invent experience or inflate scores.',
        3500
      );
      if (!raw || typeof raw !== 'object' || raw.ats_score == null) {
        throw new Error('AI returned an unusable analysis');
      }
      analysis = normalize(raw);
    } catch (e) {
      console.warn('[resume/analyze] Claude failed:', e.message);
      const busy = e.name === 'AbortError' || e.status === 529 || e.status === 429;
      return errorResponse(
        busy
          ? 'The AI analyzer is busy right now — try again in a minute.'
          : 'The AI could not produce a reliable analysis for this text. Try again, or check the pasted text is a resume.',
        503
      );
    }

    analysis.target_role = targetRole;
    analysis.target_company = targetCompany;

    // Fire-and-forget history save — works only once the resume_analyses
    // migration is applied; a missing table is logged, never fatal.
    const { error: saveError } = await supabase.from('resume_analyses').insert({
      user_id: payload.userId,
      ats_score: analysis.ats_score,
      target_role: targetRole || null,
      target_company: targetCompany || null,
      analysis,
    });
    if (saveError) console.warn('[resume/analyze] history save skipped:', saveError.message);

    return successResponse({ analysis, saved: !saveError });
  } catch (error) {
    console.error('[resume/analyze] Error:', error);
    return errorResponse('Could not analyze the resume. Try again.', 500);
  }
}
