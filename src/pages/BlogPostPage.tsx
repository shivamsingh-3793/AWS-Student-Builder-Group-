import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { postsApi } from '../lib/api';
import type { PostItem } from '../types';
import { SeoHead } from '../components/SeoHead';
import { ResilientImage } from '../components/ResilientImage';
import { RichContent } from '../components/RichContent';
import { PostCard } from '../components/PostCard';
import { ErrorBanner } from '../components/StateFeedback';

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<PostItem | null>(null);
  const [related, setRelated] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPost = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError('');
    try {
      const res = await postsApi.get(slug);
      setPost(res.post);
      setRelated(res.related);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load article.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadPost();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadPost]);

  if (loading) {
    return (
      <div className="pt-32 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="h-6 w-32 bg-[#151B24]/10 dark:bg-white/10 animate-pulse" />
        <div className="h-14 w-5/6 bg-[#151B24]/10 dark:bg-white/10 animate-pulse" />
        <div className="aspect-[16/9] bg-[#151B24]/10 dark:bg-white/10 animate-pulse" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="pt-32 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#008F52] dark:text-[#00E582]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
        <ErrorBanner message={error || 'Article not found.'} onRetry={loadPost} />
      </div>
    );
  }

  const readMinutes = Math.max(2, Math.ceil(post.content.split(/\s+/).length / 180));

  return (
    <>
      <SeoHead title={post.title} description={post.excerpt} />

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-28 pb-24 bg-[#F5F7F6] dark:bg-[#151B24]"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#475569] dark:text-slate-400 hover:text-[#008F52] dark:hover:text-[#00E582] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            All Articles
          </Link>

          <div className="flex items-center gap-2 font-mono text-xs text-[#008F52] dark:text-[#00E582]">
            <span>{post.category}</span>
            <span aria-hidden="true" className="text-slate-400">
              ·
            </span>
            <span className="text-[#475569] dark:text-slate-400">
              {new Date(post.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span aria-hidden="true" className="text-slate-400">
              ·
            </span>
            <span className="text-[#475569] dark:text-slate-400">{readMinutes} min read</span>
          </div>

          <h1 className="mt-4 font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-[#151B24] dark:text-white leading-[1.06] text-balance">
            {post.title}
          </h1>

          {post.image_url && (
            <div className="mt-8 aspect-[16/9] border border-[#151B24]/15 dark:border-white/15 bg-[#151B24] overflow-hidden">
              <ResilientImage
                src={post.image_url}
                alt={post.title}
                fallbackTitle={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="mt-12">
            <RichContent content={post.content} />
          </div>

          {related.length > 0 && (
            <div className="mt-24 pt-12 border-t border-[#151B24]/15 dark:border-white/15">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#151B24] dark:text-white mb-8">
                More Engineering Stories
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {related.map((rel, idx) => (
                  <PostCard key={rel.id} post={rel} index={idx} />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.article>
    </>
  );
}
