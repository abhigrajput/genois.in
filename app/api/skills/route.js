import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

const AVAILABLE_SKILLS = [
  { slug: 'html-css', name: 'HTML & CSS', category: 'Frontend' },
  { slug: 'javascript', name: 'JavaScript', category: 'Frontend' },
  { slug: 'react', name: 'React', category: 'Frontend' },
  { slug: 'nodejs', name: 'Node.js', category: 'Backend' },
  { slug: 'python', name: 'Python', category: 'Programming' },
  { slug: 'java', name: 'Java', category: 'Programming' },
  { slug: 'cpp', name: 'C++', category: 'Programming' },
  { slug: 'sql', name: 'SQL', category: 'Database' },
  { slug: 'mongodb', name: 'MongoDB', category: 'Database' },
  { slug: 'git', name: 'Git & GitHub', category: 'Tools' },
  { slug: 'docker', name: 'Docker', category: 'DevOps' },
  { slug: 'linux', name: 'Linux', category: 'Systems' },
  { slug: 'dsa-arrays', name: 'Arrays & Strings', category: 'DSA' },
  { slug: 'dsa-trees', name: 'Trees & Graphs', category: 'DSA' },
  { slug: 'dsa-dp', name: 'Dynamic Programming', category: 'DSA' },
  { slug: 'system-design', name: 'System Design', category: 'Architecture' },
  { slug: 'machine-learning', name: 'Machine Learning', category: 'AI/ML' },
  { slug: 'deep-learning', name: 'Deep Learning', category: 'AI/ML' },
  { slug: 'aws', name: 'AWS', category: 'Cloud' },
  { slug: 'networking', name: 'Computer Networks', category: 'Systems' },
];

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const { data: verifications } = await supabase
      .from('skill_verifications')
      .select('*')
      .eq('user_id', payload.userId)
      .order('level', { ascending: true });

    const skills = AVAILABLE_SKILLS.map(skill => {
      const levels = [1, 2, 3].map(lvl => {
        const v = verifications?.find(x => x.skill_slug === skill.slug && x.level === lvl);
        const isExpired = v?.expires_at && new Date(v.expires_at) < new Date();
        return {
          level: lvl,
          status: v?.status || 'locked',
          score: v?.score || 0,
          badge: v?.badge || null,
          attempts: v?.attempts || 0,
          verifiedAt: v?.verified_at || null,
          expiresAt: v?.expires_at || null,
          isExpired,
          unlocked: lvl === 1 || verifications?.some(x => x.skill_slug === skill.slug && x.level === lvl - 1 && x.status === 'verified' && (!x.expires_at || new Date(x.expires_at) > new Date())),
        };
      });

      const highestPassed = levels.filter(l => l.status === 'verified' && !l.isExpired).length;
      const allPassed = highestPassed === 3;

      return {
        ...skill,
        levels,
        highestPassed,
        allPassed,
        hasMaster: allPassed,
      };
    });

    const masterCount = skills.filter(s => s.allPassed).length;
    const totalBadges = skills.reduce((sum, s) => sum + s.highestPassed, 0);

    return successResponse({ skills, masterCount, totalBadges });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
