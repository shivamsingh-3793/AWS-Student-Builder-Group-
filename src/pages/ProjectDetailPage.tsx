import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { projectsApi } from '../lib/api';
import type { ProjectItem } from '../types';
import { SeoHead } from '../components/SeoHead';
import { ResilientImage } from '../components/ResilientImage';
import { ProjectCard } from '../components/ProjectCard';
import { ErrorBanner } from '../components/StateFeedback';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [related, setRelated] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await projectsApi.get(id);
      setProject(res.project);
      setRelated(res.related);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load project details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadProject]);

  if (loading) {
    return (
      <div className="pt-32 pb-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="h-8 w-40 bg-[#151B24]/10 dark:bg-white/10 animate-pulse" />
        <div className="h-14 w-3/4 bg-[#151B24]/10 dark:bg-white/10 animate-pulse" />
        <div className="aspect-[16/9] bg-[#151B24]/10 dark:bg-white/10 animate-pulse" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="pt-32 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#008F52] dark:text-[#00E582]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
        <ErrorBanner message={error || 'Project not found.'} onRetry={loadProject} />
      </div>
    );
  }

  return (
    <>
      <SeoHead title={project.title} description={project.description.slice(0, 155)} />

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-28 pb-24 bg-[#F5F7F6] dark:bg-[#151B24]"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#475569] dark:text-slate-400 hover:text-[#008F52] dark:hover:text-[#00E582] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            All Projects
          </Link>

          <p className="font-mono text-xs text-[#008F52] dark:text-[#00E582]">
            {project.tech_stack}
          </p>

          <h1 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#151B24] dark:text-white leading-[1.04]">
            {project.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            {project.project_url && (
              <a
                href={project.project_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#00E582] text-[#151B24] font-semibold text-sm hover:brightness-95 transition-all"
              >
                <span>Live Project</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            )}
            {project.architecture_url && (
              <a
                href={project.architecture_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#151B24]/20 dark:border-white/20 text-[#151B24] dark:text-white font-semibold text-sm hover:border-[#00E582] transition-colors"
              >
                <span>Architecture Notes</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            )}
          </div>

          <div className="mt-10 aspect-[16/9] border border-[#151B24]/15 dark:border-white/15 bg-[#151B24] overflow-hidden">
            <ResilientImage
              src={project.image_url}
              alt={project.title}
              fallbackTitle={project.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="mt-10 max-w-3xl space-y-6 text-base sm:text-lg text-[#334155] dark:text-slate-300 leading-relaxed">
            <p className="whitespace-pre-line">{project.description}</p>
          </div>

          {related.length > 0 && (
            <div className="mt-24 pt-12 border-t border-[#151B24]/15 dark:border-white/15">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#151B24] dark:text-white mb-8">
                More Community Builds
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {related.map((rel, idx) => (
                  <ProjectCard key={rel.id} project={rel} index={idx} />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.article>
    </>
  );
}
