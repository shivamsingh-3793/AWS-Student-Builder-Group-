import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { projectsApi, uploadApi } from '../../lib/api';
import type { ProjectItem } from '../../types';
import { SeoHead } from '../../components/SeoHead';
import { ResilientImage } from '../../components/ResilientImage';
import { EmptyState, ErrorBanner } from '../../components/StateFeedback';

const EMPTY_FORM = {
  title: '',
  description: '',
  tech_stack: 'AWS Lambda · TypeScript · CDK',
  image_url: '',
  project_url: '',
  architecture_url: '',
  featured: false,
  published: true,
};

export function AdminProjects() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
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
      const res = await projectsApi.list(true);
      setProjects(res.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load projects.');
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

  const openEdit = (p: ProjectItem) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description,
      tech_stack: p.tech_stack,
      image_url: p.image_url,
      project_url: p.project_url,
      architecture_url: p.architecture_url,
      featured: p.featured,
      published: p.published,
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await uploadApi.uploadImage(file, 'projects');
      setForm((prev) => ({ ...prev, image_url: res.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (publishState: boolean) => {
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, published: publishState };
      if (editingId) {
        const res = await projectsApi.update(editingId, payload);
        showToast(res.message);
      } else {
        const res = await projectsApi.create(payload);
        showToast(res.message);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (p: ProjectItem) => {
    try {
      const res = await projectsApi.update(p.id, { published: !p.published });
      showToast(res.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await projectsApi.remove(id);
      showToast(res.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project.');
    }
  };

  return (
    <>
      <SeoHead title="Projects CMS" description="Manage community projects." />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Projects Manager</h1>
            <p className="text-sm text-[#475569] dark:text-slate-400">
              Showcase open-source student builds and architecture links.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00E582] text-[#151B24] font-semibold text-sm whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Project
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
        ) : projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Add a community build to feature it on the website."
            actionLabel="Add Project"
            onAction={openCreate}
          />
        ) : (
          <div className="border border-[#151B24]/12 dark:border-white/12 bg-white dark:bg-[#1A222D] overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#151B24]/12 dark:border-white/12 font-mono text-xs uppercase text-[#475569] dark:text-slate-400">
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Tech Stack</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151B24]/10 dark:divide-white/10">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-[#151B24]/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="py-3.5 px-4 font-semibold">{p.title}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#475569] dark:text-slate-400">
                      {p.tech_stack}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(p)}
                        className={`underline ${
                          p.published
                            ? 'text-[#008F52] dark:text-[#00E582] font-semibold'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {p.published ? 'Published' : 'Unpublished'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        aria-label={`Edit ${p.title}`}
                        className="p-2 text-[#475569] dark:text-slate-300 hover:text-[#00E582]"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        aria-label={`Delete ${p.title}`}
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#151B24]/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-[#1A222D] border border-[#151B24]/15 dark:border-white/15 p-6 sm:p-8 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#151B24]/10 dark:border-white/10">
              <h2 className="font-display text-xl font-bold">
                {editingId ? 'Edit Project' : 'Add Project'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close modal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase mb-1">Project Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase mb-1">Tech Stack</label>
                <input
                  type="text"
                  value={form.tech_stack}
                  onChange={(e) => setForm({ ...form, tech_stack: e.target.value })}
                  placeholder="AWS Lambda · DynamoDB · Rust · CDK"
                  className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase mb-1">Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase mb-1">Project URL</label>
                  <input
                    type="url"
                    value={form.project_url}
                    onChange={(e) => setForm({ ...form, project_url: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase mb-1">Architecture URL</label>
                  <input
                    type="url"
                    value={form.architecture_url}
                    onChange={(e) => setForm({ ...form, architecture_url: e.target.value })}
                    placeholder="https://github.com/.../ARCHITECTURE.md"
                    className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase mb-1">Project Image</label>
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
                      alt="Project preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <label className="inline-flex items-center gap-2 text-sm cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="accent-[#00E582]"
                />
                <span>Featured Project</span>
              </label>
            </div>

            <div className="mt-6 pt-5 border-t border-[#151B24]/10 dark:border-white/10 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(false)}
                className="px-4 py-2.5 border border-[#151B24]/20 dark:border-white/20 text-sm font-medium"
              >
                Save Unpublished
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="px-5 py-2.5 bg-[#00E582] text-[#151B24] text-sm font-semibold"
              >
                {saving ? 'Saving...' : 'Publish Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
