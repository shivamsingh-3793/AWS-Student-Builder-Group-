import { motion, useReducedMotion } from 'motion/react';
import { EmptyState, ErrorBanner, LoadingGrid } from '../components/StateFeedback';
import { SeoHead } from '../components/SeoHead';
import { TeamProfileCard } from '../components/TeamProfileCard';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { TEAM_GROUPS } from '../lib/team';

export function TeamPage() {
  const reduce = useReducedMotion();
  const { members, loading, error, reload } = useTeamMembers();
  const sortedMembers = [...members].sort(
    (left, right) => left.display_order - right.display_order || left.id - right.id,
  );

  return (
    <>
      <SeoHead
        title="Our Team"
        description="Meet the people building and growing the AWS Student Builder Group at IGC."
      />

      <section className="relative overflow-hidden border-b border-white/10 bg-[#151B24] pb-16 pt-32 text-white blueprint-grid sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 font-mono text-xs uppercase tracking-widest text-[#00E582]"
          >
            AWS Student Builder Group @ IGC
          </motion.p>
          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl"
          >
            Our Team
          </motion.h1>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg"
          >
            Meet the people building and growing the AWS Student Builder Group at IGC.
          </motion.p>
        </div>
      </section>

      {loading ? (
        <section className="bg-[#F5F7F6] py-16 dark:bg-[#151B24] sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <LoadingGrid count={4} />
          </div>
        </section>
      ) : error ? (
        <section className="bg-[#F5F7F6] py-16 dark:bg-[#151B24] sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ErrorBanner message={error} onRetry={() => void reload()} />
          </div>
        </section>
      ) : sortedMembers.length === 0 ? (
        <section className="bg-[#F5F7F6] py-16 dark:bg-[#151B24] sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <EmptyState
              title="No team members yet"
              description="Published team profiles will appear here."
            />
          </div>
        </section>
      ) : (
        TEAM_GROUPS.map(({ category, label }, groupIndex) => {
          const group = sortedMembers.filter((member) => member.category === category);
          if (group.length === 0) return null;

          return (
            <section
              key={category}
              className={`border-b border-[#151B24]/10 py-16 dark:border-white/10 sm:py-20 ${
                groupIndex % 2 === 0
                  ? 'bg-[#F5F7F6] dark:bg-[#151B24]'
                  : 'bg-white dark:bg-[#1A222D]'
              }`}
            >
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.55 }}
                >
                  <p className="mb-3 font-mono text-xs uppercase tracking-widest text-[#008F52] dark:text-[#00E582]">
                    {label}
                  </p>
                  <h2 className="font-display text-3xl font-bold tracking-tight text-[#151B24] dark:text-white sm:text-4xl">
                    {label}
                  </h2>
                </motion.div>

                <div
                  className={`mt-8 grid grid-cols-1 gap-5 ${
                    category === 'leader' ? '' : 'sm:grid-cols-2 lg:grid-cols-4'
                  }`}
                >
                  {group.map((member, index) => (
                    <TeamProfileCard
                      key={member.id}
                      member={member}
                      featured={category === 'leader'}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            </section>
          );
        })
      )}
    </>
  );
}
