import jwt from 'jsonwebtoken';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

function verifyPlacementToken(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || !JWT_SECRET) return false;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.role === 'placement_admin';
  } catch {
    return false;
  }
}

function readinessScore(user, progress, score, testCount) {
  const dayPoints  = Math.min((progress.current_day || 1) / 365 * 30, 30);
  const scorePoints = Math.min((score.total_score || 0) / 10000 * 25, 25);
  const streakPoints = Math.min((progress.streak || 0) / 30 * 20, 20);
  const testPoints = Math.min(testCount / 50 * 15, 15);
  const profilePoints = (user.target_companies?.length > 0 && user.cgpa != null) ? 10 : 0;
  return Math.round(dayPoints + scorePoints + streakPoints + testPoints + profilePoints);
}

function readinessLevel(score) {
  if (score >= 80) return 'Ready 🟢';
  if (score >= 60) return 'Almost Ready 🟡';
  if (score >= 40) return 'In Progress 🟠';
  return 'Not Ready 🔴';
}

export async function GET(request) {
  if (!verifyPlacementToken(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getAdminClient();

    const [
      { data: users },
      { data: progress },
      { data: scores },
      { data: testCounts },
    ] = await Promise.all([
      supabase.from('users').select('id, name, email, college, domain_slug, total_score, target_companies, cgpa, months_to_placement, weak_subjects'),
      supabase.from('progress').select('user_id, current_day, streak, last_active_date'),
      supabase.from('scores').select('user_id, total_score'),
      supabase.from('tests').select('user_id').then(r => r),
    ]);

    const progressMap = {};
    (progress || []).forEach(p => { progressMap[p.user_id] = p; });

    const scoreMap = {};
    (scores || []).forEach(s => { scoreMap[s.user_id] = s; });

    const testCountMap = {};
    (testCounts || []).forEach(t => { testCountMap[t.user_id] = (testCountMap[t.user_id] || 0) + 1; });

    const students = (users || []).map(u => {
      const p = progressMap[u.id] || {};
      const s = scoreMap[u.id] || {};
      const testCount = testCountMap[u.id] || 0;
      const rs = readinessScore(u, p, s, testCount);
      return {
        id: u.id,
        name: u.name || 'Unknown',
        email: u.email,
        college: u.college || '—',
        domain_slug: u.domain_slug || '—',
        total_score: s.total_score || 0,
        current_day: p.current_day || 1,
        streak: p.streak || 0,
        readinessScore: rs,
        readinessLevel: readinessLevel(rs),
        target_companies: u.target_companies || [],
        cgpa: u.cgpa ?? null,
        months_to_placement: u.months_to_placement ?? null,
        weak_subjects: u.weak_subjects || [],
        lastActive: p.last_active_date ? p.last_active_date.split('T')[0] : null,
      };
    });

    const totalStudents = students.length;
    const readyCount = students.filter(s => s.readinessScore >= 80).length;
    const almostReadyCount = students.filter(s => s.readinessScore >= 60 && s.readinessScore < 80).length;
    const avgScore = totalStudents ? Math.round(students.reduce((a, s) => a + s.readinessScore, 0) / totalStudents) : 0;
    const avgStreak = totalStudents ? Math.round(students.reduce((a, s) => a + s.streak, 0) / totalStudents) : 0;
    const avgDay = totalStudents ? Math.round(students.reduce((a, s) => a + s.current_day, 0) / totalStudents) : 0;

    const domainCount = {};
    students.forEach(s => { domainCount[s.domain_slug] = (domainCount[s.domain_slug] || 0) + 1; });
    const topDomains = Object.entries(domainCount).sort((a, b) => b[1] - a[1]).map(([domain, count]) => ({ domain, count }));

    const companyCount = {};
    students.forEach(s => {
      (s.target_companies || []).forEach(c => {
        companyCount[c] = (companyCount[c] || 0) + 1;
      });
    });
    const targetCompanyBreakdown = Object.entries(companyCount).sort((a, b) => b[1] - a[1]).map(([company, count]) => ({ company, count }));

    return NextResponse.json({
      success: true,
      data: {
        summary: { totalStudents, readyCount, almostReadyCount, avgScore, avgStreak, avgDay, topDomains, targetCompanyBreakdown },
        students,
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
