import { useId, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Search, Sparkles, Terminal, Users, X } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { EmptyState, ErrorBanner } from './StateFeedback';
import { TeamProfileCard } from './TeamProfileCard';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { TEAM_GROUPS } from '../lib/team';

export function TeamSection() {
  const reduce = useReducedMotion();
  const rawId = useId();
  const bgGridId = `aws-section-grid-${rawId.replace(/:/g, '')}`;

  const { members, loading, error, reload } = useTeamMembers();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const sortedMembers = useMemo(() => {
    return [...members].sort(
      (left, right) => left.display_order - right.display_order || left.id - right.id,
    );
  }, [members]);

  const availableGroups = useMemo(() => {
    return TEAM_GROUPS.filter((group) =>
      sortedMembers.some((m) => m.category === group.category),
    );
  }, [sortedMembers]);

  const filteredMembers = useMemo(() => {
    return sortedMembers.filter((member) => {
      const matchesCategory =
        selectedCategory === 'all' || member.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        member.name.toLowerCase().includes(q) ||
        member.title.toLowerCase().includes(q) ||
        (member.bio && member.bio.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [sortedMembers, selectedCategory, searchQuery]);

  return (
    <section className="relative overflow-hidden border-b border-[#151B24]/10 bg-[#F8FAFC] py-24 dark:border-white/10 dark:bg-[#0F141C] sm:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <svg
          className="absolute inset-0 h-full w-full text-slate-900/[0.04] dark:text-[#00E582]/[0.05]"
          style={{
            maskImage: 'radial-gradient(ellipse at center, black 25%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 25%, transparent 75%)',
          }}
        >
          <defs>
            <pattern id={bgGridId} width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <path d="M 0 -3 L 0 3 M -3 0 L 3 0" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${bgGridId})`} />
        </svg>

        <motion.div
          className="absolute -top-32 -right-24 h-[460px] w-[460px] rounded-full bg-[#00E582]/12 blur-[120px] dark:bg-[#00E582]/10"
          animate={reduce ? undefined : { x: [0, -35, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full bg-[#3B82F6]/12 blur-[130px] dark:bg-[#3B82F6]/08"
          animate={reduce ? undefined : { x: [0, 35, 0], y: [0, -30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <SectionHeading
              index="08. Organizers"
              title="The people behind the build."
              accentWord="behind"
              subtitle="Student engineers and cloud practitioners volunteering to keep workshops hands-on, open, and deeply technical."
            />
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap items-center gap-2 self-start rounded-xl border border-[#151B24]/10 bg-white/70 px-4 py-2 font-mono text-xs shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#151B24]/70 lg:self-end"
          >
            <span className="flex items-center gap-1.5 text-[#008F52] dark:text-[#00E582]">
              <span className="h-2 w-2 rounded-full bg-[#00E582] animate-pulse" />
              AWS::REGION[ap-south-1]
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-600 dark:text-slate-400">
              {members.length} {members.length === 1 ? 'Builder Node' : 'Builder Nodes'}
            </span>
          </motion.div>
        </div>

        {!loading && !error && sortedMembers.length > 0 && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 flex flex-col gap-4 border-b border-[#151B24]/10 pb-6 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"
          >
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`relative rounded-lg px-3.5 py-1.5 font-mono text-xs font-semibold tracking-wide transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-[#151B24] text-[#00E582] shadow-sm dark:bg-[#00E582] dark:text-[#151B24]'
                    : 'bg-white/80 text-slate-600 hover:bg-slate-200/60 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
                }`}
              >
                All ({sortedMembers.length})
              </button>

              {availableGroups.map((group) => {
                const count = sortedMembers.filter((m) => m.category === group.category).length;
                const isActive = selectedCategory === group.category;
                return (
                  <button
                    key={group.category}
                    type="button"
                    onClick={() => setSelectedCategory(group.category)}
                    className={`relative rounded-lg px-3.5 py-1.5 font-mono text-xs font-medium tracking-wide transition-all ${
                      isActive
                        ? 'bg-[#151B24] text-[#00E582] shadow-sm dark:bg-[#00E582] dark:text-[#151B24]'
                        : 'bg-white/80 text-slate-600 hover:bg-slate-200/60 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
                    }`}
                  >
                    {group.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Instant Member Search Input */}
            <div className="relative min-w-[220px] sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search builder or role..."
                className="w-full rounded-lg border border-slate-200 bg-white/80 py-1.5 pl-8 pr-8 font-sans text-xs text-[#151B24] placeholder-slate-400 backdrop-blur-sm transition-all focus:border-[#00E582] focus:outline-none focus:ring-1 focus:ring-[#00E582] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Main Content Area */}
        <div className="mt-8">
          {loading ? (
            /* Innovative Skeleton Loader with AWS Blueprint accents */
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-xl border border-[#151B24]/10 bg-white p-1 dark:border-white/10 dark:bg-[#1A222D]"
                >
                  <div className="aspect-square animate-pulse rounded-lg bg-[#151B24]/5 dark:bg-white/5" />
                  <div className="space-y-3 p-4">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-[#00E582]/20" />
                    <div className="h-5 w-3/4 animate-pulse rounded bg-[#151B24]/10 dark:bg-white/10" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-[#151B24]/10 dark:bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <ErrorBanner message={error} onRetry={() => void reload()} />
          ) : sortedMembers.length === 0 ? (
            <EmptyState
              title="No team members yet"
              description="Published team profiles will appear here."
            />
          ) : filteredMembers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-white/10">
              <Users className="mx-auto h-8 w-8 text-slate-400 opacity-60" />
              <p className="mt-3 font-mono text-sm text-slate-500 dark:text-slate-400">
                No builder nodes matching &quot;{searchQuery}&quot;
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-3 font-mono text-xs text-[#008F52] underline underline-offset-4 hover:opacity-80 dark:text-[#00E582]"
              >
                Reset search & filters
              </button>
            </div>
          ) : selectedCategory === 'all' && !searchQuery ? (
            /* Grouped Sections by Category */
            <div className="space-y-16">
              {availableGroups.map(({ category, label }) => {
                const group = sortedMembers.filter((m) => m.category === category);
                if (group.length === 0) return null;

                const isLeaderGroup = category === 'leader';

                return (
                  <section key={category} aria-labelledby={`team-section-${category}`}>
                    {/* Innovative Terminal-style Section Header */}
                    <div className="mb-6 flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-[#00E582]" />
                      <h3
                        id={`team-section-${category}`}
                        className="font-display text-xl font-bold tracking-tight text-[#151B24] dark:text-white sm:text-2xl"
                      >
                        {label}
                      </h3>
                      <span className="rounded-full bg-slate-200/70 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {group.length}
                      </span>
                      <span
                        aria-hidden="true"
                        className="h-px flex-1 bg-gradient-to-r from-slate-300/80 via-slate-200/40 to-transparent dark:from-white/15 dark:via-white/5"
                      />
                    </div>

                    {/* Fixed Leaders Grid: 2 columns on desktop instead of stretching full width */}
                    <div
                      className={
                        isLeaderGroup
                          ? 'grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2'
                          : 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'
                      }
                    >
                      {group.map((member, index) => (
                        <TeamProfileCard
                          key={member.id}
                          member={member}
                          featured={isLeaderGroup}
                          index={index}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredMembers.map((member, index) => (
                  <TeamProfileCard
                    key={member.id}
                    member={member}
                    featured={false}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}