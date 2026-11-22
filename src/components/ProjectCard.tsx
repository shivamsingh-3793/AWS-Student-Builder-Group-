import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import type { ProjectItem } from '../types';
import { ResilientImage } from './ResilientImage';
import { slugify } from '../lib/seo';

export function ProjectCard({
  project,
  featured = false,
  index = 0,
}: {
  project: ProjectItem;
  featured?: boolean;
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      data-cursor="card"
      className={`group border border-[#151B24]/12 dark:border-white/12 bg-white dark:bg-[#1A222D] hover:border-[#00E582] transition-colors overflow-hidden flex flex-col ${
        featured ? 'md:col-span-2' : ''
      }`}
    >
      <Link
        to={`/projects/${slugify(project.title)}-${project.id}`}
        className={`block overflow-hidden bg-[#151B24] relative ${
          featured ? 'aspect-[16/9]' : 'aspect-[4/3]'
        }`}
      >
        <ResilientImage
          src={project.image_url}
          alt={project.title}
          fallbackTitle={project.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#151B24]/75 via-transparent to-transparent opacity-60 group-hover:opacity-35 transition-opacity"
        />
      </Link>

      <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
        <div>
          <p className="font-mono text-xs text-[#008F52] dark:text-[#00E582] tracking-wide">
            {project.tech_stack}
          </p>

          <Link to={`/projects/${slugify(project.title)}-${project.id}`} className="block mt-2.5">
            <h3 className="font-display text-2xl font-bold tracking-tight text-[#151B24] dark:text-white group-hover:text-[#008F52] dark:group-hover:text-[#00E582] transition-colors">
              {project.title}
            </h3>
          </Link>

          <p className="mt-3 text-sm text-[#475569] dark:text-slate-400 leading-relaxed line-clamp-3">
            {project.description}
          </p>
        </div>

        <div className="mt-6 pt-5 border-t border-[#151B24]/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            {project.project_url && (
              <a
                href={project.project_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#151B24] dark:text-white hover:text-[#008F52] dark:hover:text-[#00E582] transition-colors whitespace-nowrap"
              >
                <span>Live Project</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            )}
            <Link
              to={`/projects/${slugify(project.title)}-${project.id}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#475569] dark:text-slate-300 hover:text-[#008F52] dark:hover:text-[#00E582] transition-colors whitespace-nowrap"
            >
              <span>Architecture</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
