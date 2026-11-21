import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { eventsApi, uploadApi } from '../../lib/api';
import type { EventItem } from '../../types';
import { SeoHead } from '../../components/SeoHead';
import { ResilientImage } from '../../components/ResilientImage';
import { EmptyState, ErrorBanner } from '../../components/StateFeedback';

const EMPTY_FORM = {
  title: '',
  description: '',
  event_date: new Date().toISOString().slice(0, 10),
  location: '',
  type: 'Workshop',
  image_url: '',
  featured: false,
  published: true,
};

export function AdminEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await eventsApi.list(true);
      setEvents(res.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (ev: EventItem) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      description: ev.description,
      event_date: ev.event_date,
      location: ev.location,
      type: ev.type,
      image_url: ev.image_url,
      featured: ev.featured,
      published: ev.published,
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await uploadApi.uploadImage(file, 'events');
      setForm((prev) => ({ ...prev, image_url: res.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (publishState?: boolean) => {
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      published: publishState !== undefined ? publishState : form.published,
    };
    try {
      if (editingId) {
        const res = await eventsApi.update(editingId, payload);
        showToast(res.message);
      } else {
        const res = await eventsApi.create(payload);
        showToast(res.message);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await eventsApi.remove(id);
      showToast(res.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event.');
    }
  };

  return (
    <>
      <SeoHead title="Events CMS" description="Manage community events." />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Events Manager</h1>
            <p className="text-sm text-[#475569] dark:text-slate-400">
              Create, schedule, and publish workshops, hackathons, and summits.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00E582] text-[#151B24] font-semibold text-sm whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>

        {toast && (
          <div className="p-3.5 border border-[#00E582] bg-[#00E582]/10 text-sm font-medium text-[#008F52] dark:text-[#00E582]">
            {toast}
          </div>
        )}

        {error && <ErrorBanner message={error} onRetry={load} />}

        {loading ? (
          <div className="h-48 border border-[#151B24]/10 dark:border-white/10 bg-white dark:bg-[#1A222D] animate-pulse" />
        ) : events.length === 0 ? (
          <EmptyState
            title="No events yet"
            description="Create your first workshop or community summit."
            actionLabel="Create Event"
            onAction={openCreate}
          />
        ) : (
          <div className="border border-[#151B24]/12 dark:border-white/12 bg-white dark:bg-[#1A222D] overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#151B24]/12 dark:border-white/12 font-mono text-xs uppercase text-[#475569] dark:text-slate-400">
                  <th className="py-3.5 px-4">Event</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151B24]/10 dark:divide-white/10">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#151B24]/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="py-3.5 px-4 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-9 bg-[#151B24] shrink-0 overflow-hidden">
                          <ResilientImage
                            src={ev.image_url}
                            alt={ev.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-[#151B24] dark:text-white">{ev.title}</p>
                          <p className="text-xs text-[#475569] dark:text-slate-400 truncate max-w-xs">
                            {ev.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">{ev.type}</td>
                    <td className="py-3.5 px-4 font-mono text-xs tabular-nums">{ev.event_date}</td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span
                        className={
                          ev.published
                            ? 'text-[#008F52] dark:text-[#00E582] font-semibold'
                            : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {ev.published ? 'Published' : 'Draft'}
                      </span>
                      {ev.featured && <span className="ml-2 text-slate-400">· Featured</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(ev)}
                        aria-label={`Edit ${ev.title}`}
                        className="p-2 text-[#475569] dark:text-slate-300 hover:text-[#00E582]"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ev.id)}
                        aria-label={`Delete ${ev.title}`}
                        className="p-2 text-[#475569] dark:text-slate-300 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#151B24]/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-[#1A222D] border border-[#151B24]/15 dark:border-white/15 p-6 sm:p-8 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#151B24]/10 dark:border-white/10">
              <h2 className="font-display text-xl font-bold">
                {editingId ? 'Edit Event' : 'Create Event'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close modal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="AWS Community Day"
                  className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase mb-1">Event Date</label>
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase mb-1">Event Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm"
                  >
                    <option>Summit</option>
                    <option>Hackathon</option>
                    <option>Workshop</option>
                    <option>Meetup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase mb-1">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Auditorium Hall A"
                    className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase mb-1">Description</label>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase mb-1">Event Image</label>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <label className="inline-flex items-center gap-2 px-4 py-2 border border-[#151B24]/20 dark:border-white/20 text-xs font-mono cursor-pointer hover:border-[#00E582]">
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.gif"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="Or paste image URL"
                    className="flex-1 w-full px-3.5 py-2 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-xs font-mono"
                  />
                </div>
                {form.image_url && (
                  <div className="mt-3 w-48 aspect-[16/9] border border-white/15 overflow-hidden bg-[#151B24]">
                    <ResilientImage
                      src={form.image_url}
                      alt="Event preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="accent-[#00E582]"
                  />
                  <span>Featured Event</span>
                </label>

                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                    className="accent-[#00E582]"
                  />
                  <span>Published</span>
                </label>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#151B24]/10 dark:border-white/10 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(false)}
                className="px-4 py-2.5 border border-[#151B24]/20 dark:border-white/20 text-sm font-medium"
              >
                Save Draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="px-5 py-2.5 bg-[#00E582] text-[#151B24] text-sm font-semibold"
              >
                {saving ? 'Saving...' : editingId ? 'Save & Publish' : 'Publish Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
