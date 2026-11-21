import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { PostItem } from '../types';
import { ResilientImage } from './ResilientImage';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PostCard({
  post,
  index = 0,
  editorialLead = false,
}: {
  post: PostItem;
  index?: number;
  editorialLead?: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      data-cursor="card"
      className={`group border-t border-[#151B24]/15 dark:border-white/15 pt-6 pb-8 ${
        editorialLead ? 'lg:grid lg:grid-cols-12 lg:gap-8 lg:items-center' : 'flex flex-col'
      }`}
    >
      <Link
        to={`/blog/${post.slug}`}
        className={`block overflow-hidden bg-[#151B24] mb-5 ${
          editorialLead ? 'lg:col-span-6 lg:mb-0 aspect-[16/9]' : 'aspect-[16/10]'
        }`}
      >
        <ResilientImage
          src={post.image_url}
          alt={post.title}
          fallbackTitle={post.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </Link>

      <div className={editorialLead ? 'lg:col-span-6' : 'flex-1 flex flex-col justify-between'}>
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#008F52] dark:text-[#00E582]">
            <span>{post.category}</span>
            <span aria-hidden="true" className="text-slate-400">
              ·
            </span>
            <span className="text-[#475569] dark:text-slate-400">
              {formatDate(post.created_at)}
            </span>
          </div>

          <Link to={`/blog/${post.slug}`} className="block mt-3">
            <h3
              className={`font-display font-bold tracking-tight text-[#151B24] dark:text-white group-hover:text-[#008F52] dark:group-hover:text-[#00E582] transition-colors ${
                editorialLead ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
              }`}
            >
              {post.title}
            </h3>
          </Link>

          <p className="mt-3 text-sm sm:text-base text-[#475569] dark:text-slate-400 leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>
        </div>

        <Link
          to={`/blog/${post.slug}`}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#151B24] dark:text-white group-hover:text-[#008F52] dark:group-hover:text-[#00E582] transition-colors whitespace-nowrap"
        >
          <span>Read Article</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.article>
  );
}
