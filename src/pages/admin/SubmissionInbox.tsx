import { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Eye, Loader2, Mail, Search, X } from 'lucide-react';
import { communityApi } from '../../lib/api';
import type {
  SubmissionItem,
  SubmissionKind,
  SubmissionQuery,
  SubmissionStatus,
  SubmissionSort,
} from '../../types';

const PAGE_SIZE = 25;

const KIND_FILTERS: Array<{ value: 'all' | SubmissionKind; label: string }> = [
  { value: 'all', label: 'All types' },
  { value: 'join', label: 'Applications' },
  { value: 'event_rsvp', label: 'RSVPs' },
  { value: 'contact', label: 'Contact' },
];

const STATUS_FILTERS: Array<{ value: 'all' | SubmissionStatus; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'reviewed', label: 'Reviewed' },
];

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  new: 'New',
  read: 'Read',
  reviewed: 'Reviewed',
};

function submissionType(kind: string): string {
  if (kind === 'join') return 'Application';
  if (kind === 'event_rsvp') return 'RSVP';
  if (kind === 'contact') return 'Contact';
  return 'Other';
}

function submissionSource(submission: SubmissionItem): string {
  if (submission.event_title) return submission.event_title;
  if (submission.kind === 'contact') return 'Contact form';
  return submission.role || 'Community website';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function submissionQuery(
  page: number,
  kind: 'all' | SubmissionKind,
  status: 'all' | SubmissionStatus,
  sort: SubmissionSort,
  search: string,
): SubmissionQuery {
  return {
    page,
    pageSize: PAGE_SIZE,
    sort,
    ...(kind === 'all' ? {} : { kind }),
    ...(status === 'all' ? {} : { status }),
    ...(search ? { search } : {}),
  };
}

export function SubmissionInbox() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState<'all' | SubmissionKind>('all');
  const [status, setStatus] = useState<'all' | SubmissionStatus>('all');
  const [sort, setSort] = useState<SubmissionSort>('newest');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState<SubmissionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const activeRequest = ++requestId.current;
    setLoading(true);
    setError('');

    communityApi
      .submissions(submissionQuery(page, kind, status, sort, debouncedSearch))
      .then((result) => {
        if (requestId.current !== activeRequest) return;
        if (result.submissions.length === 0 && result.total > 0 && page > 1) {
          setPage((current) => Math.max(1, current - 1));
          return;
        }
        setSubmissions(result.submissions);
        setTotal(result.total);
        setHasMore(result.hasMore);
      })
      .catch((err: unknown) => {
        if (requestId.current !== activeRequest) return;
        setError(err instanceof Error ? err.message : 'Unable to load community submissions.');
      })
      .finally(() => {
        if (requestId.current === activeRequest) setLoading(false);
      });

    return () => {
      requestId.current += 1;
    };
  }, [page, kind, status, sort, debouncedSearch, reloadKey]);

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selected]);

  const updateStatus = async (submission: SubmissionItem, nextStatus: SubmissionStatus) => {
    setUpdatingId(submission.id);
    setActionError('');
    setStatusNote('');
    try {
      const result = await communityApi.updateSubmissionStatus(submission.id, nextStatus);
      setSelected((current) =>
        current?.id === submission.id ? { ...current, status: result.submission.status } : current,
      );
      setStatusNote(`Marked ${submission.name}'s submission as ${STATUS_LABELS[nextStatus].toLowerCase()}.`);
      setReloadKey((current) => current + 1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to update submission status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const hasFilters = Boolean(
    debouncedSearch || kind !== 'all' || status !== 'all',
  );
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, total);

  return (
    <section className="border border-[#151B24]/12 dark:border-white/12 bg-white dark:bg-[#1A222D] p-5 sm:p-6 space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Recent Community Applications &amp; RSVPs</h2>
          <p className="mt-1 text-sm text-[#475569] dark:text-slate-400">
            Review incoming applications, event RSVPs, and contact messages.
          </p>
        </div>
        <p className="font-mono text-xs text-[#475569] dark:text-slate-400" aria-live="polite">
          {loading ? 'Loading submissions…' : `${total.toLocaleString()} total`}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
        <label className="relative block">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B] dark:text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, message, event, or source"
            aria-label="Search submissions"
            className="w-full border border-[#151B24]/15 bg-[#F5F7F6] py-2.5 pl-9 pr-3 text-sm text-[#151B24] placeholder:text-[#64748B] focus:border-[#00E582] focus:outline-none focus:ring-2 focus:ring-[#00E582]/20 dark:border-white/15 dark:bg-[#151B24] dark:text-white dark:placeholder:text-slate-500"
          />
        </label>

        <label className="flex items-center gap-2 text-xs text-[#475569] dark:text-slate-400">
          <span className="shrink-0">Sort</span>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as SubmissionSort);
              setPage(1);
            }}
            className="border border-[#151B24]/15 bg-[#F5F7F6] px-3 py-2.5 text-sm text-[#151B24] focus:border-[#00E582] focus:outline-none dark:border-white/15 dark:bg-[#151B24] dark:text-white"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => setReloadKey((current) => current + 1)}
          disabled={loading}
          className="border border-[#151B24]/15 px-3 py-2.5 text-sm font-medium transition-colors hover:border-[#00E582] disabled:opacity-50 dark:border-white/15"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2" aria-label="Filter by submission type">
          {KIND_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={kind === filter.value}
              onClick={() => {
                setKind(filter.value);
                setPage(1);
              }}
              className={`border px-3 py-1.5 text-xs font-medium transition-colors ${
                kind === filter.value
                  ? 'border-[#00E582] bg-[#00E582]/10 text-[#008F52] dark:text-[#00E582]'
                  : 'border-[#151B24]/12 text-[#475569] hover:border-[#00E582]/60 dark:border-white/12 dark:text-slate-300'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Filter by submission status">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={status === filter.value}
              onClick={() => {
                setStatus(filter.value);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                status === filter.value
                  ? 'border-[#151B24] bg-[#151B24] text-white dark:border-[#00E582] dark:bg-[#00E582]/10 dark:text-[#00E582]'
                  : 'border-[#151B24]/12 text-[#475569] hover:border-[#151B24]/30 dark:border-white/12 dark:text-slate-300'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {statusNote && (
        <p
          className="flex items-center gap-2 border border-[#00E582]/40 bg-[#00E582]/10 px-3 py-2 text-sm text-[#008F52] dark:text-[#00E582]"
          role="status"
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          {statusNote}
        </p>
      )}
      {actionError && (
        <p className="border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {actionError}
        </p>
      )}
      {error && (
        <div className="flex flex-col gap-3 border border-red-500/30 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">Submissions could not be loaded</p>
            <p className="mt-1 break-words text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="shrink-0 border border-red-500/40 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-500/10 dark:text-red-300"
          >
            Try again
          </button>
        </div>
      )}

      {loading && submissions.length === 0 ? (
        <div className="flex min-h-36 items-center justify-center gap-3 border border-dashed border-[#151B24]/15 text-sm text-[#475569] dark:border-white/15 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-[#008F52] dark:text-[#00E582]" aria-hidden="true" />
          Loading community submissions…
        </div>
      ) : !error && submissions.length === 0 ? (
        <div className="border border-dashed border-[#151B24]/15 px-5 py-10 text-center dark:border-white/15">
          <Mail className="mx-auto h-8 w-8 text-[#008F52] dark:text-[#00E582]" aria-hidden="true" />
          <h3 className="mt-3 font-display font-semibold">
            {hasFilters ? 'No matching submissions' : 'No submissions yet'}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#475569] dark:text-slate-400">
            {hasFilters
              ? 'Try another search or clear one of the selected filters.'
              : 'New applications, RSVPs, and contact messages will appear here.'}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setDebouncedSearch('');
                setKind('all');
                setStatus('all');
                setPage(1);
              }}
              className="mt-4 text-sm font-semibold text-[#008F52] hover:underline dark:text-[#00E582]"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3" aria-busy={loading}>
          {submissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              updating={updatingId === submission.id}
              onView={() => setSelected(submission)}
              onUpdateStatus={updateStatus}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-[#151B24]/10 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <p className="text-xs text-[#475569] dark:text-slate-400" aria-live="polite">
          {total === 0 ? 'No records to display' : `Showing ${firstItem}–${lastItem} of ${total.toLocaleString()}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || loading}
            className="inline-flex items-center gap-1 border border-[#151B24]/15 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </button>
          <span className="min-w-20 text-center font-mono text-xs text-[#475569] dark:text-slate-400">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={!hasMore || loading}
            className="inline-flex items-center gap-1 border border-[#151B24]/15 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1018]/75 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-details-title"
            className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden border border-[#151B24]/15 bg-white shadow-2xl dark:border-white/15 dark:bg-[#1A222D]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-[#151B24]/10 p-5 sm:p-6 dark:border-white/10">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border border-[#008F52]/25 bg-[#00E582]/10 px-2.5 py-1 text-xs font-semibold text-[#008F52] dark:text-[#00E582]">
                    {submissionType(selected.kind)}
                  </span>
                  <StatusBadge status={selected.status} />
                </div>
                <h2 id="submission-details-title" className="mt-3 break-words font-display text-xl font-bold">
                  {selected.name}
                </h2>
                <a
                  href={`mailto:${selected.email}`}
                  className="mt-1 inline-block break-all text-sm text-[#008F52] hover:underline dark:text-[#00E582]"
                >
                  {selected.email}
                </a>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close submission details"
                className="shrink-0 border border-[#151B24]/10 p-2 text-[#475569] hover:border-[#00E582] dark:border-white/10 dark:text-slate-300"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-0 space-y-5 overflow-y-auto p-5 sm:p-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailField label="Event / source" value={submissionSource(selected)} />
                <DetailField label="Submitted" value={formatDate(selected.created_at)} />
                <DetailField label="Role" value={selected.role || 'Not provided'} />
                <DetailField label="Track" value={selected.track || 'Not provided'} />
                <DetailField label="Submission ID" value={String(selected.id)} />
                <DetailField label="Event ID" value={selected.event_id === null ? 'Not linked' : String(selected.event_id)} />
              </dl>

              <div>
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#475569] dark:text-slate-400">
                  Full message
                </h3>
                <div className="mt-2 max-h-[45vh] overflow-y-auto border border-[#151B24]/10 bg-[#F5F7F6] p-4 text-sm leading-relaxed text-[#151B24] [overflow-wrap:anywhere] dark:border-white/10 dark:bg-[#151B24] dark:text-slate-100">
                  {selected.message ? (
                    <p className="whitespace-pre-wrap">{selected.message}</p>
                  ) : (
                    <p className="italic text-[#64748B] dark:text-slate-400">No message was included.</p>
                  )}
                </div>
              </div>

              <label className="flex flex-col gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#475569] dark:text-slate-400 sm:flex-row sm:items-center">
                Submission status
                <select
                  value={selected.status}
                  disabled={updatingId === selected.id}
                  onChange={(event) => updateStatus(selected, event.target.value as SubmissionStatus)}
                  className="border border-[#151B24]/15 bg-white px-3 py-2 text-sm font-sans font-medium normal-case tracking-normal text-[#151B24] focus:border-[#00E582] focus:outline-none disabled:opacity-50 dark:border-white/15 dark:bg-[#151B24] dark:text-white"
                >
                  {STATUS_FILTERS.filter((filter) => filter.value !== 'all').map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
                {updatingId === selected.id && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-label="Updating status" />
                )}
              </label>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function SubmissionCard({
  submission,
  updating,
  onView,
  onUpdateStatus,
}: {
  submission: SubmissionItem;
  updating: boolean;
  onView: () => void;
  onUpdateStatus: (submission: SubmissionItem, status: SubmissionStatus) => void;
}) {
  const nextStatus: SubmissionStatus =
    submission.status === 'new' ? 'read' : submission.status === 'read' ? 'reviewed' : 'new';
  const nextStatusLabel =
    submission.status === 'new'
      ? 'Mark as read'
      : submission.status === 'read'
        ? 'Mark reviewed'
        : 'Reopen';

  return (
    <article className="border border-[#151B24]/10 bg-[#F5F7F6]/70 p-4 transition-colors hover:border-[#00E582]/50 dark:border-white/10 dark:bg-[#151B24]/60 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={submission.status} />
            <span className="border border-[#008F52]/25 bg-[#00E582]/10 px-2.5 py-1 text-xs font-semibold text-[#008F52] dark:text-[#00E582]">
              {submissionType(submission.kind)}
            </span>
            {submission.track && (
              <span className="border border-[#151B24]/10 px-2.5 py-1 text-xs text-[#475569] dark:border-white/10 dark:text-slate-300">
                {submission.track}
              </span>
            )}
          </div>

          <div>
            <h3 className="break-words font-display text-base font-semibold">{submission.name}</h3>
            <a
              href={`mailto:${submission.email}`}
              className="mt-0.5 inline-block break-all text-sm text-[#008F52] hover:underline dark:text-[#00E582]"
            >
              {submission.email}
            </a>
          </div>

          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <p className="min-w-0 break-words text-[#475569] dark:text-slate-400">
              <span className="font-semibold text-[#151B24] dark:text-slate-200">Event / source: </span>
              {submissionSource(submission)}
            </p>
            <p className="text-[#475569] dark:text-slate-400">
              <span className="font-semibold text-[#151B24] dark:text-slate-200">Submitted: </span>
              {formatDate(submission.created_at)}
            </p>
          </div>

          <p className="line-clamp-2 break-words text-sm leading-relaxed text-[#475569] dark:text-slate-300">
            {submission.message || <span className="italic">No message included.</span>}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center gap-1.5 border border-[#151B24]/15 px-3 py-2 text-sm font-medium transition-colors hover:border-[#00E582] dark:border-white/15"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            View details
          </button>
          <button
            type="button"
            onClick={() => onUpdateStatus(submission, nextStatus)}
            disabled={updating}
            className="inline-flex items-center gap-1.5 bg-[#00E582] px-3 py-2 text-sm font-semibold text-[#151B24] transition-colors hover:brightness-95 disabled:cursor-wait disabled:opacity-60"
          >
            {updating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            {nextStatusLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const classes =
    status === 'new'
      ? 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300'
      : status === 'read'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
        : 'border-[#00E582]/30 bg-[#00E582]/10 text-[#008F52] dark:text-[#00E582]';
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-[#151B24] dark:text-slate-100">{value}</dd>
    </div>
  );
}
