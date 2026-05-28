'use client';
import PostEditor from '@/components/blog/PostEditor';

export default function EditPostPage({ params }) {
  const { id } = params;
  return <PostEditor postId={id} />;
}
