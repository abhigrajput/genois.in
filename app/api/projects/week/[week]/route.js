import { getUserFromRequest } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';

const DEFAULT_PROJECTS = {
  1: [{ id: 'p1', title: 'Todo App', description: 'Build a full-stack todo application', difficulty: 'beginner', tech_stack: ['HTML', 'CSS', 'JavaScript'], steps: ['Setup HTML structure', 'Add CSS styling', 'Add JavaScript logic', 'Connect to localStorage'], estimated_hours: 4 }],
  2: [{ id: 'p2', title: 'Weather App', description: 'Build a weather app using public API', difficulty: 'beginner', tech_stack: ['HTML', 'CSS', 'JavaScript', 'API'], steps: ['Create UI', 'Fetch weather API', 'Display data', 'Add error handling'], estimated_hours: 5 }],
  3: [{ id: 'p3', title: 'DSA Visualizer', description: 'Create sorting algorithm visualizer', difficulty: 'intermediate', tech_stack: ['React', 'CSS'], steps: ['Setup React', 'Build array display', 'Implement bubble sort', 'Add animations'], estimated_hours: 6 }],
  4: [{ id: 'p4', title: 'REST API', description: 'Build a REST API with Node.js', difficulty: 'intermediate', tech_stack: ['Node.js', 'Express', 'MongoDB'], steps: ['Setup Express', 'Create routes', 'Add database', 'Test with Postman'], estimated_hours: 8 }],
};

export async function GET(request, { params }) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    
    // Resolve dynamic params in Next.js 16
    const resolvedParams = await params;
    const week = parseInt(resolvedParams.week) || 1;
    const projectWeek = Math.ceil(week / 2) || 1;
    const supabase = getAdminClient();

    // Try to get from database first
    const { data: user } = await supabase.from('users').select('domain_slug').eq('id', payload.userId).single();
    const domainSlug = user?.domain_slug || 'fullstack';
    
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('week_number', projectWeek)
      .eq('domain_slug', domainSlug)
      .order('created_at');

    if (projects && projects.length > 0) {
      // Get user progress for each project
      const projectIds = projects.map(p => p.id);
      const { data: progressList } = await supabase.from('project_progress').select('*').eq('user_id', payload.userId).in('project_id', projectIds);

      const projectsWithProgress = projects.map(p => ({
        ...p,
        userProgress: progressList?.find(pr => pr.project_id === p.id) || null
      }));

      // Find first progress or create dummy
      let progress = progressList?.[0] || null;
      if (!progress) {
        progress = { current_step: 0, total_steps: 4, status: 'not_started', project_id: projects[0].id };
      }

      return successResponse({ 
        projects: projectsWithProgress, 
        project: projects[0], 
        progress,
        week 
      });
    }

    // Return default projects for the week if database doesn't have it
    const defaultProjects = DEFAULT_PROJECTS[projectWeek] || DEFAULT_PROJECTS[1];
    
    return successResponse({ 
      projects: defaultProjects, 
      project: defaultProjects[0],
      progress: { current_step: 0, total_steps: 4, status: 'not_started', project_id: defaultProjects[0].id },
      week, 
      isDefault: true 
    });
  } catch (error) {
    console.error('projects/week error:', error);
    return errorResponse('Internal server error', 500);
  }
}
