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
function extractKeywords(text, maxTerms = 8) {
  const words = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));
  return [...new Set(words)].slice(0, maxTerms);
}

// plainto_tsquery ANDs every lexeme, so full-sentence chat messages match
// nothing against short reference snippets — build an OR query over the
// significant keywords instead.
function buildOrTsQuery(keywords) {
  if (!keywords.length) return null;
  return keywords.map(w => `${w}:*`).join(' | ');
}

// ─── PostgREST filter-injection guards ───────────────────────────────────────
// `.or()` takes a PostgREST *filter string*, NOT a bound parameter. Any value
// interpolated into it must be constrained first, or a caller can smuggle in
// the filter grammar's control chars — `,` (new OR clause), `()` (grouping),
// `.` (column.operator.value separator) — and rewrite the query. `domain` and
// `company` here originate from user-supplied query params (/api/rag/search),
// so validate both and DROP an unrecognized filter rather than interpolating it.

// Canonical domain slugs — mirrors the signup / change-domain whitelist, plus
// the 'general' bucket this table uses. A fixed enum, so exact-match is safe.
const VALID_DOMAINS = new Set([
  'fullstack', 'dsa', 'cybersecurity', 'aiml', 'devops',
  'android', 'datascience', 'blockchain', 'gamedev', 'systemdesign', 'general',
]);

// Company is free-text (can't enumerate), so restrict it to a charset that
// carries NO meaning in the PostgREST filter grammar. Notably excludes
// , . ( ) : — the exact primitives needed to break out of the intended filter.
const SAFE_COMPANY = /^[A-Za-z0-9 &+_-]{1,40}$/;

function safeDomain(domain) {
  return domain && VALID_DOMAINS.has(domain) ? domain : null;
}

function safeCompany(company) {
  return company && SAFE_COMPANY.test(company) ? company : null;
}

// PostgREST can't ORDER BY a computed ts_rank expression, so Postgres returns
// matches in arbitrary order — re-rank client-side by keyword overlap so the
// most relevant snippet actually lands first.
function rankByKeywordOverlap(rows, keywords) {
  return rows
    .map(row => {
      const haystack = `${row.content} ${row.metadata?.keywords || ''}`.toLowerCase();
      const score = keywords.reduce((acc, kw) => acc + (haystack.includes(kw) ? 1 : 0), 0);
      return { row, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ row }) => row);
}

export async function searchKnowledgeBase(query, domain, company, limit = 3) {
  const keywords = extractKeywords(query);
  const tsQuery = buildOrTsQuery(keywords);
  if (!tsQuery) return [];
  try {
    const supabase = getAdminClient();
    let q = supabase
      .from('knowledge_base')
      .select('content, category, company, difficulty, metadata')
      .textSearch('content', tsQuery, { config: 'english' })
      .limit(limit * 4);

    // Validated/whitelisted before interpolation — see safeDomain/safeCompany.
    const dom = safeDomain(domain);
    const co = safeCompany(company);
    if (dom) q = q.or(`domain.eq.${dom},domain.eq.general`);
    if (co) q = q.or(`company.eq.${co},company.is.null`);

    const { data } = await q;
    return rankByKeywordOverlap(data || [], keywords)
      .slice(0, limit)
      .map(({ content, category, company, difficulty }) => ({ content, category, company, difficulty }));
  } catch (e) {
    console.error('searchKnowledgeBase error:', e);
    return [];
  }
}

export function formatRagContext(results, label = 'RELEVANT KNOWLEDGE (use this to give specific, accurate answers)') {
  if (!results.length) return '';
  return `\n${label}:\n${results.map(r => `[${r.category}${r.company ? ' - ' + r.company : ''}]: ${r.content}`).join('\n\n')}`;
}
