import { getUserFromRequest } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    
    const { projectTitle, githubUrl, week, domain, notes, projectId } = await request.json();
    if (!githubUrl) return errorResponse('GitHub URL required', 400);
    if (!githubUrl.includes('github.com')) return errorResponse('Must be a GitHub URL', 400);
    if (!projectId) return errorResponse('Project ID required', 400);
    
    const supabase = getAdminClient();
    
    // Save submission
    const { data: submission, error } = await supabase.from('project_progress').upsert({
      user_id: payload.userId,
      project_id: projectId,
      status: 'submitted',
      score: 0,
      ai_feedback: null,
      submitted_at: new Date().toISOString(),
      step_notes: [{ githubUrl, notes, submittedAt: new Date().toISOString() }],
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,project_id' }).select().single();
    
    if (error) {
      console.error('Project submit database error:', error.message);
      return errorResponse('Database submission failed', 500);
    }
    
    // Trigger AI review in background (non-blocking)
    reviewProjectWithAI(payload.userId, projectId, projectTitle, githubUrl, domain, week).catch(console.error);
    
    return successResponse({ 
      message: 'Project submitted! AI review will be ready in 2-3 minutes.',
      submissionId: submission?.id,
      githubUrl
    });
  } catch (error) {
    console.error('Project submit handler error:', error);
    return errorResponse('Internal server error', 500);
  }
}

async function reviewProjectWithAI(userId, projectId, projectTitle, githubUrl, domain, week) {
  const supabase = getAdminClient();
  
  const prompt = `You are a senior ${domain} developer reviewing a student project.

Project: ${projectTitle}
GitHub URL: ${githubUrl}
Domain: ${domain}
Week: ${week} of 52

Based on the project title and GitHub URL, provide a constructive code review.
Assume the student is an Indian engineering student learning ${domain}.

Return ONLY valid JSON:
{
  "score": 85,
  "grade": "B+",
  "overall_feedback": "2-3 sentence overall assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "next_steps": ["next step 1", "next step 2"],
  "estimated_time_spent": "10-15 hours",
  "code_quality": 80,
  "functionality": 85,
  "documentation": 75,
  "encouragement": "motivational message for Indian student"
}`;

  try {
    // Try DeepSeek first
    const res = await fetch(process.env.DEEPSEEK_BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.DEEPSEEK_API_KEY },
      body: JSON.stringify({ 
        model: 'deepseek-ai/deepseek-r1', 
        messages: [{ role: 'user', content: prompt }], 
        max_tokens: 800 
      }),
      signal: AbortSignal.timeout(25000)
    });
    const data = await res.json();
    let content = data.choices?.[0]?.message?.content || '{}';
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const review = JSON.parse(content);
    
    // Save review
    await supabase.from('project_progress').update({
      score: review.score || 75,
      ai_feedback: JSON.stringify(review),
      status: 'reviewed',
      updated_at: new Date().toISOString()
    }).eq('user_id', userId).eq('project_id', projectId);
    
    // Award score points
    const { data: user } = await supabase.from('users').select('total_score').eq('id', userId).single();
    await supabase.from('users').update({ total_score: (user?.total_score || 0) + (review.score || 75) }).eq('id', userId);
    
  } catch (e) {
    console.error('AI review DeepSeek failed:', e.message);
    
    // Try Claude fallback
    try {
      const { askClaudeJSON } = await import('@/lib/claude');
      const review = await askClaudeJSON(prompt);
      await supabase.from('project_progress').update({
        score: review.score || 75,
        ai_feedback: JSON.stringify(review),
        status: 'reviewed',
        updated_at: new Date().toISOString()
      }).eq('user_id', userId).eq('project_id', projectId);
      
      const { data: user } = await supabase.from('users').select('total_score').eq('id', userId).single();
      await supabase.from('users').update({ total_score: (user?.total_score || 0) + (review.score || 75) }).eq('id', userId);
      return;
    } catch (e2) {
      console.error('Claude fallback failed too:', e2.message);
    }

    // Save default review
    await supabase.from('project_progress').update({
      score: 75,
      ai_feedback: JSON.stringify({ score: 75, grade: 'B', overall_feedback: 'Good work! Keep building and improving.', strengths: ['Project completed', 'Pushed to GitHub'], improvements: ['Add more documentation', 'Add tests'], encouragement: 'Great job completing this project! Keep pushing forward!' }),
      status: 'reviewed',
      updated_at: new Date().toISOString()
    }).eq('user_id', userId).eq('project_id', projectId);
  }
}
