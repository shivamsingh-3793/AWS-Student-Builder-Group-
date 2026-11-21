import React, { useCallback, useEffect, useState } from 'react';
import { authApi, communityApi, configApi, statsApi } from '../../lib/api';
import type { CommunityStats, SubmissionItem } from '../../types';
import { SeoHead } from '../../components/SeoHead';
import { ErrorBanner } from '../../components/StateFeedback';

type CommunityStatsDraft = Record<keyof CommunityStats, string>;

function createStatsDraft(stats: CommunityStats | null): CommunityStatsDraft {
  return {
    builders_count: stats ? String(stats.builders_count) : '',
    events_count: stats ? String(stats.events_count) : '',
    projects_count: stats ? String(stats.projects_count) : '',
    workshops_count: stats ? String(stats.workshops_count) : '',
  };
}

export function AdminSettings() {
  const [stats, setStats] = useState<CommunityStatsDraft>(() => createStatsDraft(null));
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [savingStats, setSavingStats] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [cmsName, setCmsName] = useState('CMS');

  const load = useCallback(async () => {
    setError('');
    try {
      const [stRes, subRes] = await Promise.all([statsApi.get(), communityApi.submissions()]);
      setStats(createStatsDraft(stRes.community));
      setSubmissions(subRes.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load settings.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    configApi.get()
      .then((config) => setCmsName(config.cmsName))
      .catch(() => setCmsName('CMS'));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    const values = Object.values(stats);
    if (values.some((value) => !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) {
      setError('Enter a non-negative whole number for each community statistic.');
      return;
    }

    const payload: CommunityStats = {
      builders_count: Number(stats.builders_count),
      events_count: Number(stats.events_count),
      projects_count: Number(stats.projects_count),
      workshops_count: Number(stats.workshops_count),
    };
    setSavingStats(true);
    setError('');
    try {
      const res = await statsApi.update(payload);
      setStats(createStatsDraft(res.community));
      showToast(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update statistics.');
    } finally {
      setSavingStats(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPass(true);
    setError('');
    try {
      const res = await authApi.changePassword(currentPassword, newPassword);
      showToast(res.message);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <>
      <SeoHead title="Settings" description="Community statistics and admin security." />

      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold">{cmsName} Settings</h1>
          <p className="text-sm text-[#475569] dark:text-slate-400">
            Update live homepage counters, review community inquiries, and manage security.
          </p>
        </div>

        {toast && (
          <div className="p-3.5 border border-[#00E582] bg-[#00E582]/10 text-sm font-medium text-[#008F52] dark:text-[#00E582]">
            {toast}
          </div>
        )}

        {error && <ErrorBanner message={error} onRetry={load} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleSaveStats}
            className="border border-[#151B24]/12 dark:border-white/12 bg-white dark:bg-[#1A222D] p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold">Community Statistics</h2>
            <p className="text-xs text-[#475569] dark:text-slate-400">
              Manage these values manually; they appear on the public home and About pages.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase mb-1">Total Community Members</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={stats.builders_count}
                  onChange={(e) => setStats({ ...stats, builders_count: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 font-mono text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase mb-1">Events Conducted</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={stats.events_count}
                  onChange={(e) => setStats({ ...stats, events_count: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 font-mono text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase mb-1">Projects Built</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={stats.projects_count}
                  onChange={(e) => setStats({ ...stats, projects_count: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 font-mono text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase mb-1">Workshops &amp; Sessions Hosted</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={stats.workshops_count}
                  onChange={(e) => setStats({ ...stats, workshops_count: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 font-mono text-sm tabular-nums"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={savingStats}
              className="px-5 py-2.5 bg-[#00E582] text-[#151B24] text-sm font-semibold"
            >
              {savingStats ? 'Saving...' : 'Save Statistics'}
            </button>
          </form>

          <form
            onSubmit={handleChangePassword}
            className="border border-[#151B24]/12 dark:border-white/12 bg-white dark:bg-[#1A222D] p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold">Change Admin Password</h2>
            <div>
              <label className="block text-xs font-mono uppercase mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase mb-1">
                New Password (min 12 chars)
              </label>
              <input
                type="password"
                required
                minLength={12}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={savingPass}
              className="px-5 py-2.5 border border-[#151B24]/20 dark:border-white/20 hover:border-[#00E582] text-sm font-semibold"
            >
              {savingPass ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Community Submissions */}
        <div className="border border-[#151B24]/12 dark:border-white/12 bg-white dark:bg-[#1A222D] p-6 space-y-4">
          <h2 className="font-display text-lg font-bold">Recent Community Applications & RSVPs</h2>
          {submissions.length === 0 ? (
            <p className="text-sm text-[#475569] dark:text-slate-400">No submissions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#151B24]/12 dark:border-white/12 font-mono text-xs uppercase text-[#475569] dark:text-slate-400">
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Details</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151B24]/10 dark:divide-white/10">
                  {submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td className="py-2.5 px-3 font-mono text-xs text-[#008F52] dark:text-[#00E582]">
                        {sub.kind}
                      </td>
                      <td className="py-2.5 px-3 font-medium">{sub.name}</td>
                      <td className="py-2.5 px-3 font-mono text-xs">{sub.email}</td>
                      <td className="py-2.5 px-3 text-xs text-[#475569] dark:text-slate-400 max-w-md truncate">
                        {sub.event_title ? `${sub.event_title} · ` : ''}
                        {sub.role} {sub.track ? `(${sub.track})` : ''} {sub.message}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs tabular-nums">
                        {sub.created_at.slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
