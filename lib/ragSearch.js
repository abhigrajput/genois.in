import { getAdminClient } from '@/lib/supabaseAdmin';

const STOPWORDS = new Set([
  'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
  'kind', 'does', 'do', 'did', 'doing', 'done', 'and', 'or', 'but', 'the',
  'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'this',
  'that', 'these', 'those', 'with', 'for', 'from', 'about', 'into', 'than',
  'then', 'them', 'they', 'you', 'your', 'will', 'would', 'could', 'should',
  'can', 'ask', 'asks', 'tell', 'give', 'get', 'know', 'want', 'need',
  'have', 'has', 'had', 'not', 'all', 'any', 'some', 'just', 'like',
  'between', 'difference', 'differences', 'please', 'help', 'explain',
]);

// plainto_tsquery ANDs every lexeme, so full-sentence chat messages match
// nothing against short reference snippets — build an OR query over the
// significant keywords instead, ranked by ts_rank via Postgres.
function buildOrTsQuery(text, maxTerms = 8) {
  const words = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));
  const unique = [...new Set(words)].slice(0, maxTerms);
  if (!unique.length) return null;
  return unique.map(w => `${w}:*`).join(' | ');
}

export async function searchKnowledgeBase(query, domain, company, limit = 3) {
  const tsQuery = buildOrTsQuery(query);
  if (!tsQuery) return [];
  try {
    const supabase = getAdminClient();
    let q = supabase
      .from('knowledge_base')
      .select('content, category, company, difficulty')
      .textSearch('content', tsQuery, { config: 'english' })
      .limit(limit);

    if (domain) q = q.or(`domain.eq.${domain},domain.eq.general`);
    if (company) q = q.or(`company.eq.${company},company.is.null`);

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
