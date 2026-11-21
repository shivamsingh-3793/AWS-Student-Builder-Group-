import React, { useCallback, useEffect, useState } from 'react';
import { Eye, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { postsApi, uploadApi } from '../../lib/api';
import type { PostItem } from '../../types';
import { SeoHead } from '../../components/SeoHead';
import { ResilientImage } from '../../components/ResilientImage';
import { RichContent } from '../../components/RichContent';
import { EmptyState, ErrorBanner } from '../../components/StateFeedback';

const EMPTY_FORM = {
  title: '',
  slug: '',
  category: 'AWS',
  excerpt: '',
  content: '',
  image_url: '',
  published: true,
};

function toSlug(val: string): string {
  return val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function AdminPosts() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await postsApi.list(true);
      setPosts(res.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load posts.');
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
    setPreviewMode(false);
    setModalOpen(true);
  };

  const openEdit = (post: PostItem) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      category: post.category,
      excerpt: post.excerpt,
      content: post.content,
      image_url: post.image_url,
      published: post.published,
    });
    setPreviewMode(false);
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await uploadApi.uploadImage(file, 'posts');
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
        const res = await postsApi.update(editingId, payload);
        showToast(res.message);
      } else {
        const res = await postsApi.create(payload);
        showToast(res.message);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await postsApi.remove(id);
      showToast(res.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post.');
    }
  };

  return (
    <>
      <SeoHead title="Blog CMS" description="Manage engineering articles." />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Blog Posts</h1>
            <p className="text-sm text-[#475569] dark:text-slate-400">
              Author, preview, and publish engineering stories and cloud tutorials.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00E582] text-[#151B24] font-semibold text-sm whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Post
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
        ) : posts.length === 0 ? (
          <EmptyState
            title="No blog posts yet"
            description="Write your first engineering tutorial or architecture breakdown."
            actionLabel="New Post"
            onAction={openCreate}
          />
        ) : (
          <div className="border border-[#151B24]/12 dark:border-white/12 bg-white dark:bg-[#1A222D] overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#151B24]/12 dark:border-white/12 font-mono text-xs uppercase text-[#475569] dark:text-slate-400">
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151B24]/10 dark:divide-white/10">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-[#151B24]/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="py-3.5 px-4 font-semibold max-w-xs truncate">{post.title}</td>
                    <td className="py-3.5 px-4 font-mono text-xs">{post.category}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#475569] dark:text-slate-400 max-w-[180px] truncate">
                      /{post.slug}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span
                        className={
                          post.published
                            ? 'text-[#008F52] dark:text-[#00E582] font-semibold'
                            : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(post)}
                        aria-label={`Edit ${post.title}`}
                        className="p-2 text-[#475569] dark:text-slate-300 hover:text-[#00E582]"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        aria-label={`Delete ${post.title}`}
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
          <div className="w-full max-w-4xl bg-white dark:bg-[#1A222D] border border-[#151B24]/15 dark:border-white/15 p-6 sm:p-8 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#151B24]/10 dark:border-white/10">
              <h2 className="font-display text-xl font-bold">
                {editingId ? 'Edit Article' : 'Create Article'}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewMode((p) => !p)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-[#151B24]/20 dark:border-white/20"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {previewMode ? 'Edit Source' : 'Live Preview'}
                </button>
                <button type="button" onClick={() => setModalOpen(false)} aria-label="Close modal">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {previewMode ? (
              <div className="mt-6 max-h-[60vh] overflow-y-auto p-6 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/10 dark:border-white/10">
                <h1 className="font-display text-3xl font-bold mb-6">{form.title || 'Untitled Article'}</h1>
                <RichContent content={form.content} />
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase mb-1">Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          title: val,
                          slug: editingId ? prev.slug : toSlug(val),
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase mb-1">Slug</label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: toSlug(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm"
                    >
                      <option>AWS</option>
                      <option>Cloud</option>
                      <option>AI</option>
                      <option>DevOps</option>
                      <option>Projects</option>
                      <option>Community</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase mb-1">Featured Image</label>
                    <div className="flex gap-2 items-center">
                      <label className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-[#151B24]/20 dark:border-white/20 text-xs font-mono cursor-pointer hover:border-[#00E582] shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploading ? '...' : 'Upload'}</span>
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
                        placeholder="Image URL"
                        className="flex-1 px-3 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {form.image_url && (
                  <div className="w-48 aspect-[16/9] border border-white/15 overflow-hidden bg-[#151B24]">
                    <ResilientImage src={form.image_url} alt="Featured preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono uppercase mb-1">Short Excerpt</label>
                  <input
                    type="text"
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    placeholder="Concise 1-sentence summary for cards and SEO..."
                    className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase mb-1">
                    Content (supports ## headings, - lists, and ``` code blocks)
                  </label>
                  <textarea
                    rows={10}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm font-mono"
                  />
                </div>
              </div>
            )}

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
                {saving ? 'Saving...' : 'Publish Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
