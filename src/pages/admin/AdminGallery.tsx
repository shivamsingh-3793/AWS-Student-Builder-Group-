import React, { useCallback, useEffect, useState } from 'react';
import { Check, Pencil, Trash2, Upload, X } from 'lucide-react';
import { galleryApi } from '../../lib/api';
import type { GalleryItem } from '../../types';
import { SeoHead } from '../../components/SeoHead';
import { ResilientImage } from '../../components/ResilientImage';
import { EmptyState, ErrorBanner } from '../../components/StateFeedback';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export function AdminGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Workshop');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await galleryApi.list();
      setItems(res.gallery);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load gallery.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const chosen = e.target.files?.[0];
    if (!chosen) return;

    if (!ALLOWED_TYPES.includes(chosen.type)) {
      setError('Invalid format. Supported formats: JPG, JPEG, PNG, WEBP, GIF.');
      return;
    }

    if (chosen.size > MAX_BYTES) {
      setError('File exceeds maximum limit of 5MB.');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(chosen);
    setPreviewUrl(URL.createObjectURL(chosen));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError('Please enter a title and select an image file.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('image', file);

      const res = await galleryApi.upload(formData);
      showToast(res.message);
      setTitle('');
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdit = async (id: number) => {
    if (!editTitle.trim()) return;
    try {
      const res = await galleryApi.update(id, { title: editTitle.trim() });
      showToast(res.message);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await galleryApi.remove(id);
      showToast(res.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  return (
    <>
      <SeoHead title="Gallery CMS" description="Upload and manage gallery images." />

      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Gallery Manager</h1>
          <p className="text-sm text-[#475569] dark:text-slate-400">
            Upload JPG, JPEG, PNG, WEBP, or GIF photos up to 5MB with instant preview.
          </p>
        </div>

        {toast && (
          <div className="p-3.5 border border-[#00E582] bg-[#00E582]/10 text-sm font-medium text-[#008F52] dark:text-[#00E582]">
            {toast}
          </div>
        )}

        {error && <ErrorBanner message={error} onRetry={load} />}

        {/* Upload Card */}
        <form
          onSubmit={handleUpload}
          className="border border-[#151B24]/12 dark:border-white/12 bg-white dark:bg-[#1A222D] p-6 space-y-5"
        >
          <h2 className="font-display text-lg font-bold">Upload New Image</h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            <div className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase mb-1">Image Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="AWS Hackathon Demo Night"
                  className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-sm"
                  >
                    <option>Workshop</option>
                    <option>Hackathon</option>
                    <option>Summit</option>
                    <option>Meetup</option>
                    <option>Projects</option>
                    <option>Cloud Labs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase mb-1">
                    Select File (Max 5MB)
                  </label>
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-[#151B24]/30 dark:border-white/25 hover:border-[#00E582] text-xs font-mono cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-[#008F52] dark:text-[#00E582]" />
                    <span className="truncate">{file ? file.name : 'Choose JPG/PNG/WEBP/GIF'}</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.gif"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || !file}
                className="px-6 py-2.5 bg-[#00E582] text-[#151B24] font-semibold text-sm disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload to Gallery'}
              </button>
            </div>

            <div className="md:col-span-5">
              <p className="text-xs font-mono uppercase mb-1.5 text-[#475569] dark:text-slate-400">
                Pre-Upload Preview
              </p>
              <div className="aspect-[4/3] border border-[#151B24]/15 dark:border-white/15 bg-[#F5F7F6] dark:bg-[#151B24] flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} alt="Selected preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-mono text-slate-400">No file selected</span>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Existing Images */}
        {loading ? (
          <div className="h-48 border border-[#151B24]/10 dark:border-white/10 bg-white dark:bg-[#1A222D] animate-pulse" />
        ) : items.length === 0 ? (
          <EmptyState
            title="No gallery images"
            description="Upload your first photo above."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-[#151B24]/12 dark:border-white/12 bg-white dark:bg-[#1A222D] overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] bg-[#151B24] overflow-hidden">
                  <ResilientImage
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#00E582] text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(item.id)}
                        aria-label="Save title"
                        className="p-1.5 bg-[#00E582] text-[#151B24]"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        aria-label="Cancel edit"
                        className="p-1.5 border border-white/15"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="font-mono text-xs text-[#008F52] dark:text-[#00E582]">
                        {item.category}
                      </span>
                      <p className="font-semibold text-sm mt-0.5">{item.title}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#151B24]/10 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditTitle(item.title);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-mono text-[#475569] dark:text-slate-300 hover:text-[#00E582]"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Title
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center gap-1 text-xs font-mono text-red-500 hover:underline ml-3"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
