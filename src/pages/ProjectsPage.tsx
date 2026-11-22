import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { projectsApi } from '../lib/api';
import type { ProjectItem } from '../types';
import { SeoHead } from '../components/SeoHead';
import { ProjectCard } from '../components/ProjectCard';
import { EmptyState, ErrorBanner, LoadingGrid } from '../components/StateFeedback';

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await projectsApi.list();
      setProjects(res.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <>
      <SeoHead
        title="AWS Student Projects | AWS Builder Community Punjab"
        description="Explore AWS cloud projects, student-built architectures and open-source tools created by the AWS Student Builder Group."
        canonicalPath="/projects"
      />

      <section className="pt-32 pb-16 bg-[#151B24] text-white blueprint-grid border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[#00E582] mb-4">
            Open-Source Showcase
          </p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight"
          >
            Built by <span className="text-[#00E582]">Builders.</span>
          </motion.h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl">
            Real cloud-native systems engineered, tested, and shipped by student developer squads.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-[#F5F7F6] dark:bg-[#151B24] min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <LoadingGrid count={3} />
          ) : error ? (
            <ErrorBanner message={error} onRetry={loadProjects} />
          ) : projects.length === 0 ? (
            <EmptyState
              title="No published projects"
              description="Projects published from the CMS will appear here automatically."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project, idx) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  featured={idx === 0 || project.featured}
                  index={idx}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
