import { getAdminClient } from '@/lib/supabaseAdmin';

export async function searchKnowledgeBase(query, domain, company, limit = 3) {
  if (!query) return [];
  try {
    const supabase = getAdminClient();
    let q = supabase
      .from('knowledge_base')
      .select('content, category, company, difficulty')
      .textSearch('content', query, { type: 'plain', config: 'english' })
      .limit(limit);

    if (domain) q = q.or(`domain.eq.${domain},domain.eq.general`);

    const { data } = await q;
    return data || [];
  } catch (e) {
    console.error('searchKnowledgeBase error:', e);
    return [];
  }
}

export function formatRagContext(results, label = 'RELEVANT KNOWLEDGE (use this to give specific, accurate answers)') {
  if (!results.length) return '';
  return `\n${label}:\n${results.map(r => `[${r.category}${r.company ? ' - ' + r.company : ''}]: ${r.content}`).join('\n\n')}`;
}
