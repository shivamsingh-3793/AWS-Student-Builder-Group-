import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { eventsApi } from '../lib/api';
import type { EventItem } from '../types';
import { SeoHead } from '../components/SeoHead';
import { EventCard } from '../components/EventCard';
import { EmptyState, ErrorBanner, LoadingGrid } from '../components/StateFeedback';

const TYPES = ['All', 'Summit', 'Hackathon', 'Workshop', 'Meetup'];

export function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await eventsApi.list();
      setEvents(res.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Real-time counts per category for the filter pills
  const counts = useMemo(() => {
    const map: Record<string, number> = { All: events.length };
    TYPES.slice(1).forEach((t) => {
      map[t] = events.filter((e) => e.type?.toLowerCase() === t.toLowerCase()).length;
    });
    return map;
  }, [events]);

  // Combined search + category filter
  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchesType =
        selectedType === 'All' || e.type?.toLowerCase() === selectedType.toLowerCase();
      const matchesSearch =
        searchQuery.trim() === '' ||
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [events, selectedType, searchQuery]);

  return (
    <>
      <SeoHead
        title="Events & Workshops"
        description="Explore upcoming AWS workshops, cloud engineering summits, and 24-hour builder hackathons."
      />

      {/* Hero Section with Ambient Glow and Blueprint Grid */}
      <section className="relative pt-32 pb-20 bg-[#151B24] text-white blueprint-grid border-b border-white/10 overflow-hidden">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[radial-gradient(ellipse_at_top,rgba(0,229,130,0.15),transparent_70%)] pointer-events-none -z-0" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          {/* Live Community Tag */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00E582]/30 bg-[#00E582]/10 backdrop-blur-md mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E582] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E582]" />
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-[#00E582] font-medium">
              Community Calendar
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight"
          >
            Events. Challenges.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E582] to-emerald-400">
              Workshops.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed"
          >
            Every session is hands-on. Bring your laptop, provision real AWS stacks, and build alongside fellow cloud engineers.
          </motion.p>

          {/* Interactive Filters & Search Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Sliding Pill Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              {TYPES.map((type) => {
                const isActive = selectedType === type;
                const count = counts[type] ?? 0;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`relative px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-colors duration-200 z-10 flex items-center gap-2 group ${
                      isActive ? 'text-[#151B24] font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeFilterPill"
                        className="absolute inset-0 bg-[#00E582] rounded-lg -z-10 shadow-[0_0_24px_rgba(0,229,130,0.4)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span>{type}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                        isActive
                          ? 'bg-[#151B24]/20 text-[#151B24] font-bold'
                          : 'bg-white/10 text-slate-400 group-hover:bg-white/20 group-hover:text-slate-200'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Search Input */}
            <div className="relative min-w-[260px] max-w-sm">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search events, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#00E582]/60 focus:ring-1 focus:ring-[#00E582]/60 transition-all backdrop-blur-md"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-16 sm:py-24 bg-[#0E131A] text-slate-100 min-h-[55vh] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Active filter count status bar */}
          {!loading && !error && filtered.length > 0 && (
            <div className="mb-8 flex items-center justify-between text-xs font-mono text-slate-400 border-b border-white/5 pb-4">
              <span>
                Showing <strong className="text-[#00E582]">{filtered.length}</strong>{' '}
                {filtered.length === 1 ? 'event' : 'events'}
                {selectedType !== 'All' ? ` in ${selectedType}` : ''}
                {searchQuery ? ` matching "${searchQuery}"` : ''}
              </span>

              {(selectedType !== 'All' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType('All');
                    setSearchQuery('');
                  }}
                  className="text-slate-400 hover:text-[#00E582] transition-colors underline underline-offset-4"
                >
                  Reset filters
                </button>
              )}
            </div>
          )}

          {loading ? (
            <LoadingGrid count={4} />
          ) : error ? (
            <ErrorBanner message={error} onRetry={loadEvents} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No upcoming events match"
              description={
                searchQuery
                  ? `No events found matching "${searchQuery}". Try a different keyword.`
                  : selectedType === 'All'
                  ? 'No published events are scheduled right now. Check back soon.'
                  : `No published ${selectedType} events found right now.`
              }
              actionLabel={selectedType !== 'All' || searchQuery ? 'Reset All Filters' : undefined}
              onAction={() => {
                setSelectedType('All');
                setSearchQuery('');
              }}
            />
          ) : (
            /* Animated Grid with smooth entrance & re-ordering */
            <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {filtered.map((ev, idx) => (
                  <motion.div
                    key={ev.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                    transition={{
                      duration: 0.35,
                      delay: Math.min(idx * 0.05, 0.3),
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    whileHover={{ y: -4 }}
                    className="transition-transform duration-200"
                  >
                    <EventCard
                      event={ev}
                      featured={idx === 0 && ev.featured}
                      index={idx}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}