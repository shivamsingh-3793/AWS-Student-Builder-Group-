import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { postsApi } from '../lib/api';
import type { PostItem } from '../types';
import { SeoHead } from '../components/SeoHead';
import { PostCard } from '../components/PostCard';
import { EmptyState, ErrorBanner, LoadingGrid } from '../components/StateFeedback';

const CATEGORIES = ['All', 'AWS', 'Cloud', 'AI', 'DevOps', 'Projects', 'Community'];
const HEADLINE = ['From', 'the'];

export function BlogPage() {
  const reduce = useReducedMotion();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await postsApi.list();
      setPosts(res.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load articles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const filtered = useMemo(() => {
    if (category === 'All') return posts;
    return posts.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }, [posts, category]);

  // Article count per category, shown on each chip once posts have loaded
  const counts = useMemo(() => {
    const map: Record<string, number> = { All: posts.length };
    for (const cat of CATEGORIES.slice(1)) {
      map[cat] = posts.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length;
    }
    return map;
  }, [posts]);

  const reveal = (delay: number) => ({
    initial: { y: '110%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <>
      <SeoHead
        title="Engineering Blog"
        description="Read engineering articles, AWS benchmarks, and cloud architecture guides written by AWS Student Builder Group."
      />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-[#151B24] text-white pt-36 pb-20 blueprint-grid border-b border-white/10">
        {!reduce && (
          <>
            <motion.div
              aria-hidden="true"
              className="absolute -top-24 right-[10%] h-96 w-96 rounded-full bg-[#00E582]/20 blur-[110px]"
              animate={{ x: [0, 40, 0], y: [0, -24, 0] }}
              transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[#3B82F6]/15 blur-[120px]"
              animate={{ x: [0, -30, 0], y: [0, 26, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            />
          </>
        )}

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 font-serif text-sm text-slate-200 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              {!reduce && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00E582] opacity-75" />
              )}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00E582]" />
            </span>
            Engineering journal
          </motion.p>

          <h1 className="font-serif text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            <span className="sr-only">From the Builders.</span>
            <span aria-hidden="true">
              {HEADLINE.map((word, i) => (
                <span key={word} className="mr-[0.25em] inline-block overflow-hidden align-bottom">
                  <motion.span className="inline-block" {...reveal(0.2 + i * 0.12)}>
                    {word}
                  </motion.span>
                </span>
              ))}
              <span className="inline-block overflow-hidden pr-3 align-bottom">
                <motion.span className="inline-block italic text-[#00E582]" {...reveal(0.44)}>
                  Builders.
                </motion.span>
              </span>
            </span>
          </h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.65, delay: 0.62, ease: [0.16, 1, 0.3, 1] }}
            style={{ originX: 0 }}
            className="my-7 h-px w-32 bg-gradient-to-r from-[#00E582] to-transparent"
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.72 }}
            className="max-w-2xl font-serif text-lg leading-relaxed text-slate-300 sm:text-xl"
          >
            Deep technical writeups, latency benchmarks, and lessons learned running real student cloud systems.
          </motion.p>

          {/* Category chips: a single green pill glides between the active ones */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.86 }}
            role="tablist"
            aria-label="Filter articles by category"
            className="-mx-4 mt-10 flex items-center gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
          >
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(cat)}
                  className={`relative shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E582] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151B24] ${
                    active ? 'text-[#151B24]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {active ? (
                    <motion.span
                      layoutId="blog-category-pill"
                      className="absolute inset-0 rounded-full bg-[#00E582] shadow-[0_6px_20px_rgba(0,229,130,0.35)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  ) : (
                    <span className="absolute inset-0 rounded-full border border-white/20 bg-white/[0.04] transition-colors hover:border-[#00E582]/60" />
                  )}
                  <span className="relative flex items-center gap-2">
                    {cat}
                    {!loading && !error && (
                      <span
                        className={`rounded-full px-1.5 text-xs tabular-nums ${
                          active ? 'bg-[#151B24]/15' : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {counts[cat]}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ================= ARTICLES ================= */}
      <section className="min-h-[50vh] bg-[#F5F7F6] py-16 dark:bg-[#0B1017] sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <LoadingGrid count={3} />
          ) : error ? (
            <ErrorBanner message={error} onRetry={loadPosts} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No published articles"
              description="Check back soon for new engineering tutorials and post-mortems."
              actionLabel={category !== 'All' ? 'View All Categories' : undefined}
              onAction={() => setCategory('All')}
            />
          ) : (
            <>
              <p
                aria-live="polite"
                className="mb-8 flex items-center gap-4 font-serif text-sm text-[#475569] dark:text-slate-400"
              >
                <span>
                  {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
                  {category !== 'All' && (
                    <>
                      {' '}in <span className="italic text-[#008F52] dark:text-[#00E582]">{category}</span>
                    </>
                  )}
                </span>
                <span className="h-px flex-1 bg-[#151B24]/10 dark:bg-white/10" />
              </p>

              {/* Re-keyed on category so the grid fades in fresh after each filter change */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="space-y-8"
                >
                  <PostCard post={filtered[0]} editorialLead index={0} />
                  {filtered.length > 1 && (
                    <div className="grid grid-cols-1 gap-8 pt-4 md:grid-cols-2">
                      {filtered.slice(1).map((post, idx) => (
                        <PostCard key={post.id} post={post} index={idx + 1} />
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </section>
    </>
  );
}