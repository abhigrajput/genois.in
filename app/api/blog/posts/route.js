import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');
    const authorId = searchParams.get('authorId');
    const status = searchParams.get('status') || 'published';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = getAdminClient();
    let query = supabase.from('dsa_posts').select('*, authors(*)', { count: 'exact' });

    // Enforce public vs dashboard restrictions
    if (status === 'published') {
      query = query.eq('status', 'published');
    } else {
      // For author dashboard or draft views, authenticate the request
      const payload = await getUserFromRequest(request);
      if (!payload || !payload.userId) {
        return errorResponse('Unauthorized access to draft posts', 401);
      }
      
      const { data: author } = await supabase
        .from('authors')
        .select('id, role')
        .eq('user_id', payload.userId)
        .single();
      
      if (!author) {
        return errorResponse('Forbidden', 403);
      }

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      // Authors can only view their own drafts unless they are admins
      if (author.role !== 'admin') {
        query = query.eq('author_id', author.id);
      }
    }

    // Apply filters
    if (topic && topic !== 'all') {
      query = query.eq('topic', topic);
    }
    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty);
    }
    if (authorId) {
      query = query.eq('author_id', authorId);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Sort by publish date (published first) or creation date
    query = query.order('published_at', { ascending: false, nullsFirst: false })
                 .order('created_at', { ascending: false });

    // Pagination bounds
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: posts, count, error } = await query;

    if (error) {
      console.error('Database error listing posts:', error);
      return errorResponse('Error retrieving posts', 500);
    }

    return successResponse({
      posts,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }, 'Posts retrieved successfully');
  } catch (error) {
    console.error('Blog Posts GET Error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload || !payload.userId) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getAdminClient();
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('id')
      .eq('user_id', payload.userId)
      .maybeSingle();

    if (authorError || !author) {
      return errorResponse('Forbidden: You are not registered as an author', 403);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const { title, slug, excerpt, content, cover_image, tags, topic, difficulty, status, cpp_code } = body;

    if (!title || !slug || !content) {
      return errorResponse('Title, Slug, and Content are required fields', 400);
    }

    // Auto-calculate reading time: ~200 words per minute
    const wordCount = content.split(/\s+/).length + (cpp_code ? cpp_code.split(/\s+/).length : 0);
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    // Convert comma-separated tags into Postgres array if input as string
    let tagsArray = [];
    if (Array.isArray(tags)) {
      tagsArray = tags;
    } else if (typeof tags === 'string') {
      tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    const isPublished = status === 'published';
    const publishedAt = isPublished ? new Date().toISOString() : null;

    const { data: post, error: insertError } = await supabase
      .from('dsa_posts')
      .insert({
        author_id: author.id,
        title,
        slug,
        excerpt: excerpt || '',
        content,
        cover_image: cover_image || '',
        tags: tagsArray,
        topic: topic || 'other',
        difficulty: difficulty || 'beginner',
        status: status || 'draft',
        read_time: readTime,
        cpp_code: cpp_code || null,
        published_at: publishedAt,
        views: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting post:', insertError);
      if (insertError.code === '23505') {
        return errorResponse('A post with this slug or title already exists', 409);
      }
      return errorResponse('Failed to create post', 500);
    }

    return successResponse(post, 'Post created successfully', 201);
  } catch (error) {
    console.error('Blog Posts POST Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
