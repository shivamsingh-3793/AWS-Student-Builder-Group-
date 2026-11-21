import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Github,
  ImagePlus,
  Instagram,
  Linkedin,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { EmptyState, ErrorBanner } from '../../components/StateFeedback';
import { ResilientImage } from '../../components/ResilientImage';
import { SeoHead } from '../../components/SeoHead';
import { teamApi } from '../../lib/api';
import { TEAM_GROUPS } from '../../lib/team';
import type { TeamCategory, TeamMember } from '../../types';

interface TeamForm {
  name: string;
  title: string;
  bio: string;
  category: TeamCategory;
  linkedin: string;
  github: string;
  instagram: string;
  display_order: number;
  active: boolean;
  photo_url: string;
}

const EMPTY_FORM: TeamForm = {
  name: '',
  title: '',
  bio: '',
  category: 'core',
  linkedin: '',
  github: '',
  instagram: '',
  display_order: 0,
  active: true,
  photo_url: '',
};

const FIELD_CLASS =
  'w-full border border-[#151B24]/15 bg-[#F5F7F6] px-3.5 py-2.5 text-sm text-[#151B24] dark:border-white/15 dark:bg-[#151B24] dark:text-white';

export function AdminTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TeamForm>(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await teamApi.list(true);
      setMembers(
        [...response.members].sort(
          (left, right) => left.display_order - right.display_order || left.id - right.id,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load team members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!photoFile) {
      setPreviewUrl(form.photo_url);
      return;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile, form.photo_url]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPhotoFile(null);
    setRemovePhoto(false);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (member: TeamMember) => {
    setEditingId(member.id);
    setForm({
      name: member.name,
      title: member.title,
      bio: member.bio,
      category: member.category,
      linkedin: member.linkedin,
      github: member.github,
      instagram: member.instagram,
      display_order: member.display_order,
      active: member.active,
      photo_url: member.photo_url,
    });
    setPhotoFile(null);
    setRemovePhoto(false);
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setPhotoFile(null);
    setRemovePhoto(false);
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Choose a JPG, PNG, WEBP, or GIF image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be 5MB or smaller.');
      return;
    }

    setError('');
    setPhotoFile(file);
    setRemovePhoto(false);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = new FormData();
    payload.append('name', form.name);
    payload.append('title', form.title);
    payload.append('bio', form.bio);
    payload.append('category', form.category);
    payload.append('linkedin', form.linkedin);
    payload.append('github', form.github);
    payload.append('instagram', form.instagram);
    payload.append('display_order', String(form.display_order));
    payload.append('active', String(form.active));
    payload.append('photo_url', form.photo_url);
    if (photoFile) payload.append('photo', photoFile);
    if (removePhoto) payload.append('remove_photo', 'true');

    try {
      const response = editingId
        ? await teamApi.update(editingId, payload)
        : await teamApi.create(payload);
      closeModal();
      showToast(response.message);
      await load();
      if (response.warning) setError(response.warning);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save team member.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (member: TeamMember) => {
    setStatusUpdatingId(member.id);
    setError('');
    const payload = new FormData();
    payload.append('active', String(!member.active));
    try {
      const response = await teamApi.update(member.id, payload);
      showToast(response.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update member status.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDelete = async (member: TeamMember) => {
    if (!window.confirm(`Permanently delete ${member.name}? This cannot be undone.`)) return;
    setError('');
    try {
      const response = await teamApi.remove(member.id);
      showToast(response.message);
      await load();
      if (response.warning) setError(response.warning);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete team member.');
    }
  };

  return (
    <>
      <SeoHead title="Team Manager" description="Manage public team profiles" />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Team Manager</h1>
            <p className="text-sm text-[#475569] dark:text-slate-400">
              Manage public profiles, photos, categories, and display order.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 self-start bg-[#00E582] px-4 py-2.5 text-sm font-semibold text-[#151B24]"
          >
            <Plus className="h-4 w-4" />
            Add Team Member
          </button>
        </div>

        {toast && (
          <div
            className="border border-[#00E582] bg-[#00E582]/10 p-3.5 text-sm font-medium text-[#008F52] dark:text-[#00E582]"
            role="status"
          >
            {toast}
          </div>
        )}
        {error && <ErrorBanner message={error} onRetry={() => void load()} />}

        {loading ? (
          <div
            className="h-48 animate-pulse border border-[#151B24]/10 bg-white dark:border-white/10 dark:bg-[#1A222D]"
            aria-busy="true"
          />
        ) : members.length === 0 ? (
          <EmptyState
            title="No team members yet"
            description="Add a profile to publish your first team member."
            actionLabel="Add Team Member"
            onAction={openCreate}
          />
        ) : (
          <div className="overflow-x-auto border border-[#151B24]/12 bg-white dark:border-white/12 dark:bg-[#1A222D]">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#151B24]/12 font-mono text-xs uppercase text-[#475569] dark:border-white/12 dark:text-slate-400">
                  <th className="px-4 py-3.5">Member</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Order</th>
                  <th className="px-4 py-3.5">Socials</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151B24]/10 dark:divide-white/10">
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-[#151B24]/[0.02] dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex min-w-56 items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[#151B24]">
                          {member.photo_url ? (
                            <ResilientImage
                              src={member.photo_url}
                              alt={member.name}
                              className="h-full w-full object-cover object-top"
                            />
                          ) : (
                            <div
                              role="img"
                              aria-label={`No photo for ${member.name}`}
                              className="grid h-full w-full place-items-center text-[#00E582]"
                            >
                              <UserRound className="h-6 w-6" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#151B24] dark:text-white">
                            {member.name}
                          </p>
                          <p className="truncate text-xs text-[#475569] dark:text-slate-400">
                            {member.title}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs">
                      {TEAM_GROUPS.find((group) => group.category === member.category)?.label}
                    </td>
                    <td className="px-4 py-3.5 font-mono tabular-nums">{member.display_order}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {member.github && (
                          <a
                            href={member.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${member.name} GitHub profile`}
                            className="hover:text-[#008F52] dark:hover:text-[#00E582]"
                          >
                            <Github className="h-4 w-4" />
                          </a>
                        )}
                        {member.linkedin && (
                          <a
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${member.name} LinkedIn profile`}
                            className="hover:text-[#008F52] dark:hover:text-[#00E582]"
                          >
                            <Linkedin className="h-4 w-4" />
                          </a>
                        )}
                        {member.instagram && (
                          <a
                            href={member.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${member.name} Instagram profile`}
                            className="hover:text-[#008F52] dark:hover:text-[#00E582]"
                          >
                            <Instagram className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={member.active}
                        aria-label={`${member.active ? 'Disable' : 'Enable'} ${member.name}`}
                        disabled={statusUpdatingId === member.id}
                        onClick={() => void handleToggleActive(member)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          member.active
                            ? 'bg-[#00E582]/15 text-[#008F52] dark:text-[#00E582]'
                            : 'bg-slate-500/15 text-slate-500 dark:text-slate-300'
                        }`}
                      >
                        {member.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(member)}
                        aria-label={`Edit ${member.name}`}
                        className="p-2 text-[#475569] hover:text-[#008F52] dark:text-slate-300 dark:hover:text-[#00E582]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(member)}
                        aria-label={`Delete ${member.name}`}
                        className="p-2 text-[#475569] hover:text-red-500 dark:text-slate-300"
                      >
                        <Trash2 className="h-4 w-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#151B24]/80 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-editor-title"
            className="my-8 w-full max-w-3xl border border-[#151B24]/15 bg-white p-6 dark:border-white/15 dark:bg-[#1A222D] sm:p-8"
          >
            <div className="flex items-center justify-between border-b border-[#151B24]/10 pb-4 dark:border-white/10">
              <h2 id="team-editor-title" className="font-display text-xl font-bold">
                {editingId ? 'Edit Team Member' : 'Add Team Member'}
              </h2>
              <button type="button" onClick={closeModal} aria-label="Close editor">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <p className="mt-4 border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300" role="alert">
                {error}
              </p>
            )}

            <form onSubmit={handleSave} className="mt-5 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-xs font-mono uppercase">
                  Name
                  <input
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className={`${FIELD_CLASS} mt-1.5 normal-case`}
                  />
                </label>
                <label className="block text-xs font-mono uppercase">
                  Title / Designation
                  <input
                    required
                    maxLength={160}
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    className={`${FIELD_CLASS} mt-1.5 normal-case`}
                  />
                </label>
                <label className="block text-xs font-mono uppercase">
                  Category
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value as TeamCategory })
                    }
                    className={`${FIELD_CLASS} mt-1.5 normal-case`}
                  >
                    {TEAM_GROUPS.map(({ category, label }) => (
                      <option key={category} value={category}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-mono uppercase">
                  Display order
                  <input
                    type="number"
                    min={0}
                    max={1000000}
                    step={1}
                    value={form.display_order}
                    onChange={(event) =>
                      setForm({ ...form, display_order: Number(event.target.value) })
                    }
                    className={`${FIELD_CLASS} mt-1.5 normal-case`}
                  />
                </label>
              </div>

              <label className="block text-xs font-mono uppercase">
                Bio
                <textarea
                  rows={4}
                  maxLength={4000}
                  value={form.bio}
                  onChange={(event) => setForm({ ...form, bio: event.target.value })}
                  className={`${FIELD_CLASS} mt-1.5 normal-case`}
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {(['linkedin', 'github', 'instagram'] as const).map((field) => (
                  <label key={field} className="block text-xs font-mono uppercase">
                    {field}
                    <input
                      type="url"
                      value={form[field]}
                      onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                      placeholder="https://"
                      className={`${FIELD_CLASS} mt-1.5 normal-case`}
                    />
                  </label>
                ))}
              </div>

              <div>
                <p className="mb-1.5 text-xs font-mono uppercase">Profile photo</p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-[#151B24]/15 bg-[#151B24] dark:border-white/15">
                    {previewUrl ? (
                      <ResilientImage
                        src={previewUrl}
                        alt={form.name ? `${form.name} photo preview` : 'Team photo preview'}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-[#00E582]">
                        <UserRound className="h-8 w-8" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 border border-[#151B24]/20 px-4 py-2 text-xs font-mono hover:border-[#00E582] dark:border-white/20">
                      <ImagePlus className="h-4 w-4" />
                      <span>{photoFile ? 'Replace selected photo' : 'Upload photo'}</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.gif"
                        onChange={handlePhotoChange}
                        className="sr-only"
                      />
                    </label>
                    <input
                      type="url"
                      value={form.photo_url}
                      onChange={(event) => {
                        setForm({ ...form, photo_url: event.target.value });
                        setPhotoFile(null);
                        setRemovePhoto(false);
                      }}
                      placeholder="Or paste an image URL"
                      className={`${FIELD_CLASS} font-mono text-xs`}
                    />
                    {(form.photo_url || photoFile) && (
                      <button
                        type="button"
                        onClick={() => {
                          setForm({ ...form, photo_url: '' });
                          setPhotoFile(null);
                          setRemovePhoto(Boolean(editingId));
                        }}
                        className="text-xs text-red-600 hover:underline dark:text-red-400"
                      >
                        Remove photo
                      </button>
                    )}
                    <p className="text-xs text-[#475569] dark:text-slate-400">
                      JPG, PNG, WEBP, or GIF; maximum 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => setForm({ ...form, active: event.target.checked })}
                  className="accent-[#00E582]"
                />
                Show this member on the public website
              </label>

              <div className="flex justify-end gap-3 border-t border-[#151B24]/10 pt-5 dark:border-white/10">
                <button
                  type="button"
                  onClick={closeModal}
                  className="border border-[#151B24]/20 px-4 py-2.5 text-sm dark:border-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#00E582] px-5 py-2.5 text-sm font-semibold text-[#151B24] disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
