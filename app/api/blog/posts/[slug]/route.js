import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

// GET a single post (increments view count asynchronously)
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const supabase = getAdminClient();

    let query = supabase.from('dsa_posts').select('*, authors(*)');
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    if (isUUID) {
      query = query.or(`id.eq.${slug},slug.eq.${slug}`);
    } else {
      query = query.eq('slug', slug);
    }

    const { data: post, error } = await query.maybeSingle();

    if (error || !post) {
      return errorResponse('Post not found', 404);
    }

    // Gate drafts
    if (post.status === 'draft') {
      const payload = await getUserFromRequest(request);
      if (!payload || !payload.userId) {
        return errorResponse('Unauthorized: Post is a draft', 401);
      }

      const { data: author } = await supabase
        .from('authors')
        .select('id, role')
        .eq('user_id', payload.userId)
        .single();

      if (!author || (author.id !== post.author_id && author.role !== 'admin')) {
        return errorResponse('Forbidden: You are not authorized to view this draft', 403);
      }
    } else {
      // Increment views count for published posts
      await supabase
        .from('dsa_posts')
        .update({ views: (post.views || 0) + 1 })
        .eq('id', post.id);
      post.views = (post.views || 0) + 1;
    }

    return successResponse(post, 'Post retrieved successfully');
  } catch (error) {
    console.error('Single Post GET Error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// PUT (update a post)
export async function PUT(request, { params }) {
  try {
    const { slug } = await params;
    const payload = await getUserFromRequest(request);
    if (!payload || !payload.userId) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getAdminClient();
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('id, role')
      .eq('user_id', payload.userId)
      .single();

    if (authorError || !author) {
      return errorResponse('Forbidden: Not an authorized author', 403);
    }

    // Retrieve original post
    let findQuery = supabase.from('dsa_posts').select('*');
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    if (isUUID) {
      findQuery = findQuery.or(`id.eq.${slug},slug.eq.${slug}`);
    } else {
      findQuery = findQuery.eq('slug', slug);
    }

    const { data: post, error: findError } = await findQuery.maybeSingle();
    if (findError || !post) {
      return errorResponse('Post not found', 404);
    }

    // Verify ownership or admin privileges
    if (post.author_id !== author.id && author.role !== 'admin') {
      return errorResponse('Forbidden: You do not own this post', 403);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const { title, slug: newSlug, excerpt, content, cover_image, tags, topic, difficulty, status, cpp_code } = body;

    if (!title || !newSlug || !content) {
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
    const publishedAt = isPublished
      ? (post.published_at || new Date().toISOString())
      : null;

    const { data: updatedPost, error: updateError } = await supabase
      .from('dsa_posts')
      .update({
        title,
        slug: newSlug,
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
        updated_at: new Date().toISOString()
      })
      .eq('id', post.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating post:', updateError);
      if (updateError.code === '23505') {
        return errorResponse('A post with this slug or title already exists', 409);
      }
      return errorResponse('Failed to update post', 500);
    }

    return successResponse(updatedPost, 'Post updated successfully');
  } catch (error) {
    console.error('Post PUT Error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// DELETE a post
export async function DELETE(request, { params }) {
  try {
    const { slug } = await params;
    const payload = await getUserFromRequest(request);
    if (!payload || !payload.userId) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getAdminClient();
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('id, role')
      .eq('user_id', payload.userId)
      .single();

    if (authorError || !author) {
      return errorResponse('Forbidden: Not an authorized author', 403);
    }

    let findQuery = supabase.from('dsa_posts').select('*');
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    if (isUUID) {
      findQuery = findQuery.or(`id.eq.${slug},slug.eq.${slug}`);
    } else {
      findQuery = findQuery.eq('slug', slug);
    }

    const { data: post, error: findError } = await findQuery.maybeSingle();
    if (findError || !post) {
      return errorResponse('Post not found', 404);
    }

    if (post.author_id !== author.id && author.role !== 'admin') {
      return errorResponse('Forbidden: You do not own this post', 403);
    }

    const { error: deleteError } = await supabase
      .from('dsa_posts')
      .delete()
      .eq('id', post.id);

    if (deleteError) {
      console.error('Error deleting post:', deleteError);
      return errorResponse('Failed to delete post', 500);
    }

    return successResponse(null, 'Post deleted successfully');
  } catch (error) {
    console.error('Post DELETE Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
