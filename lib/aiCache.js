import { getAdminClient } from './supabaseAdmin';

export async function getCached(cacheKey) {
  try {
    const supabase = getAdminClient();
    const { data } = await supabase
      .from('ai_cache')
      .select('content, hits')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!data) return null;

    await supabase
      .from('ai_cache')
      .update({ hits: (data.hits || 0) + 1 })
      .eq('cache_key', cacheKey);

    return data.content;
  } catch {
    return null;
  }
}

export async function setCached(cacheKey, content, ttlHours = 24) {
  try {
    const supabase = getAdminClient();
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

    await supabase
      .from('ai_cache')
      .upsert({
        cache_key: cacheKey,
        content,
        expires_at: expiresAt,
        hits: 0,
      }, { onConflict: 'cache_key' });
  } catch {}
}

export async function clearExpiredCache() {
  try {
    const supabase = getAdminClient();
    await supabase
      .from('ai_cache')
      .delete()
      .lt('expires_at', new Date().toISOString());
  } catch {}
}

export function buildCacheKey(...parts) {
  return parts
    .map(p => String(p).toLowerCase().replace(/[^a-z0-9]/g, '_'))
    .join(':');
}
