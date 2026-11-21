import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { statsApi } from '../../lib/api';
import type { StatsResponse } from '../../types';
import { SeoHead } from '../../components/SeoHead';
import { ErrorBanner } from '../../components/StateFeedback';

export function AdminDashboard() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await statsApi.get();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-28 border border-[#151B24]/10 dark:border-white/10 bg-white dark:bg-[#1A222D] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error || !data || !data.cms) {
    return <ErrorBanner message={error || 'Unable to load dashboard.'} onRetry={load} />;
  }

  const { cms, community } = data;

  const cards = [
    { label: 'Total Events', value: cms.totalEvents, sub: 'All records' },
    { label: 'Published Events', value: cms.publishedEvents, sub: 'Visible publicly', accent: true },
    { label: 'Draft Events', value: cms.draftEvents, sub: 'Unpublished' },
    { label: 'Total Posts', value: cms.totalPosts, sub: `${cms.publishedPosts} published` },
    { label: 'Published Posts', value: cms.publishedPosts, sub: 'Live on blog', accent: true },
    { label: 'Projects', value: cms.totalProjects, sub: `${cms.publishedProjects} published` },
    { label: 'Gallery Images', value: cms.totalGallery, sub: 'Archive items' },
    { label: 'Member Inquiries', value: cms.totalSubmissions, sub: 'RSVPs & applications' },
  ];

  const barItems = [
    { label: 'Events Published', current: cms.publishedEvents, total: Math.max(cms.totalEvents, 1) },
    { label: 'Posts Published', current: cms.publishedPosts, total: Math.max(cms.totalPosts, 1) },
    {
      label: 'Projects Published',
      current: cms.publishedProjects,
      total: Math.max(cms.totalProjects, 1),
    },
  ];

  return (
    <>
      <SeoHead title="Admin Dashboard" description="CMS Overview" />

      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Content Overview</h1>
          <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">
            Live database status across events, engineering articles, projects, and gallery assets.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="border border-[#151B24]/12 dark:border-white/12 bg-white dark:bg-[#1A222D] p-5"
            >
              <p className="text-xs font-mono uppercase tracking-wider text-[#475569] dark:text-slate-400">
                {card.label}
              </p>
              <p
                className={`mt-2 font-mono text-3xl font-bold tabular-nums ${
                  card.accent
                    ? 'text-[#008F52] dark:text-[#00E582]'
                    : 'text-[#151B24] dark:text-white'
                }`}
              >
                {card.value}
              </p>
              <p className="mt-1 text-xs text-[#475569] dark:text-slate-400">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 border border-[#151B24]/12 dark:border-white/12 bg-white dark:bg-[#1A222D] p-6 space-y-5">
            <h2 className="font-display text-lg font-bold">Publication Ratio</h2>
            <div className="space-y-4">
              {barItems.map((bar) => {
                const pct = Math.round((bar.current / bar.total) * 100);
                return (
                  <div key={bar.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span>{bar.label}</span>
                      <span className="tabular-nums text-[#008F52] dark:text-[#00E582]">
                        {bar.current} / {bar.total} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 bg-[#151B24]/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-[#00E582] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 border border-[#151B24]/12 dark:border-white/12 bg-white dark:bg-[#1A222D] p-6 space-y-4">
            <h2 className="font-display text-lg font-bold">Public Community Counters</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-[#F5F7F6] dark:bg-[#151B24]">
                <span className="text-xs text-[#475569] dark:text-slate-400">Builders</span>
                <p className="font-mono text-xl font-bold tabular-nums">
                  {community ? `${community.builders_count}+` : '—'}
                </p>
              </div>
              <div className="p-3 bg-[#F5F7F6] dark:bg-[#151B24]">
                <span className="text-xs text-[#475569] dark:text-slate-400">Events</span>
                <p className="font-mono text-xl font-bold tabular-nums">
                  {community ? `${community.events_count}+` : '—'}
                </p>
              </div>
              <div className="p-3 bg-[#F5F7F6] dark:bg-[#151B24]">
                <span className="text-xs text-[#475569] dark:text-slate-400">Projects</span>
                <p className="font-mono text-xl font-bold tabular-nums">
                  {community ? `${community.projects_count}+` : '—'}
                </p>
              </div>
              <div className="p-3 bg-[#F5F7F6] dark:bg-[#151B24]">
                <span className="text-xs text-[#475569] dark:text-slate-400">Workshops</span>
                <p className="font-mono text-xl font-bold tabular-nums">
                  {community ? `${community.workshops_count}+` : '—'}
                </p>
              </div>
            </div>
            <Link
              to="/admin/settings"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#008F52] dark:text-[#00E582] hover:underline"
            >
              <span>Update public counters</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
