import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { galleryApi } from '../lib/api';
import type { GalleryItem } from '../types';
import { SeoHead } from '../components/SeoHead';
import { EmptyState, ErrorBanner, LoadingGrid } from '../components/StateFeedback';

const PAGE_SIZE = 9;

// Display font: Plus Jakarta Sans (bold, clean headings). Body font: Inter.
const DISPLAY_FONT = "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
const BODY_FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
const FONT_LINK_ID = 'gallery-fonts';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap';

/* ---------- helpers ---------- */

// GalleryItem field names can differ between projects, so read the common ones.
const pick = (item: GalleryItem, keys: string[]): string => {
  const record = item as unknown as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
};

const getSrc = (item: GalleryItem) =>
  pick(item, ['image_url', 'imageUrl', 'image', 'url', 'src', 'photo', 'thumbnail']);
const getTitle = (item: GalleryItem) => pick(item, ['title', 'caption', 'name', 'alt']);
const getDescription = (item: GalleryItem) => pick(item, ['description', 'caption']);

// 1 column on phones, 2 on tablets, 3 on desktop
function useColumnCount() {
  const [count, setCount] = useState(3);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setCount(w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return count;
}

/* ---------- lightbox ---------- */

function Lightbox({
  items,
  index,
  onClose,
  onChange,
}: {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onChange: (next: number) => void;
}) {
  const item = items[index];
  const total = items.length;

  const prev = useCallback(() => onChange((index - 1 + total) % total), [index, total, onChange]);
  const next = useCallback(() => onChange((index + 1) % total), [index, total, onChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  const title = getTitle(item);
  const description = getDescription(item);

  const controlClass =
    'grid place-items-center w-11 h-11 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:border-[#00E582]/60 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E582]';

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] bg-[#0A0E14]/85 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3">
        <span className="font-mono text-xs text-slate-300">
          {index + 1} / {total}
        </span>
        <button type="button" onClick={onClose} aria-label="Close photo viewer" className={controlClass} autoFocus>
          <X className="w-5 h-5" />
        </button>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
        aria-label="Previous photo"
        className={`${controlClass} absolute left-3 sm:left-6 top-1/2 -translate-y-1/2`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        aria-label="Next photo"
        className={`${controlClass} absolute right-3 sm:right-6 top-1/2 -translate-y-1/2`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <motion.figure
        key={index}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={getSrc(item)}
          alt={title || 'Community photo'}
          className="max-h-[78vh] w-auto max-w-full rounded-2xl object-contain shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        />
        {(title || description) && (
          <figcaption className="mt-4 max-w-2xl text-center">
            {title && <p className="font-sans text-lg font-bold text-white">{title}</p>}
            {description && description !== title && (
              <p className="mt-1 text-sm text-slate-300">{description}</p>
            )}
          </figcaption>
        )}
      </motion.figure>
    </motion.div>
  );
}

/* ---------- page ---------- */

export function GalleryPage() {
  const prefersReduced = useReducedMotion();
  const columnCount = useColumnCount();

  // Loads the fonts once. You can move this <link> into index.html for a faster first paint.
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [active, setActive] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await galleryApi.list();
      setItems(res.gallery);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the gallery.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = items.slice(0, visible);
  const remaining = items.length - shown.length;

  // Deal photos into columns one by one. Loading more only appends,
  // so photos already on screen never jump around.
  const columns = useMemo(() => {
    const cols: { item: GalleryItem; index: number }[][] = Array.from({ length: columnCount }, () => []);
    shown.forEach((item, index) => cols[index % columnCount].push({ item, index }));
    return cols;
  }, [shown, columnCount]);

  return (
    <>
      <SeoHead
        title="Gallery"
        description="Moments from workshops, build sprints, hackathons and community events at AWS Student Builder Group."
      />

      <main className="bg-[#F5F7F6] dark:bg-[#151B24] min-h-screen pt-28 sm:pt-32 pb-24 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Hero panel */}
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1F2937] via-[#151B24] to-[#10151C] text-white px-6 sm:px-12 py-14 sm:py-20 shadow-[0_24px_64px_rgba(21,27,36,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div aria-hidden="true" className="absolute inset-0 blueprint-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
            <motion.div
              aria-hidden="true"
              animate={prefersReduced ? undefined : { x: [0, 24, 0], y: [0, -16, 0] }}
              transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-20 right-[6%] w-[420px] h-[420px] rounded-full bg-[#00E582]/20 blur-[110px]"
            />

            <div className="relative max-w-3xl">
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{ fontFamily: DISPLAY_FONT }}
                className="font-extrabold tracking-[-0.03em] leading-[1.08] text-5xl sm:text-6xl lg:text-7xl"
              >
                <span className="block">Where ideas turn</span>
                <span className="block text-[#00E582]">into shipped work.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15 }}
                style={{ fontFamily: BODY_FONT }}
                className="mt-6 max-w-xl text-base sm:text-lg font-medium text-slate-200 leading-[1.75]"
              >
                Overnight build sprints, hands-on cloud labs, whiteboard sessions and summit
                stages. A look at the people and the long nights behind everything we have
                shipped together.
              </motion.p>
            </div>
          </section>

          {/* Gallery panel */}
          <section className="rounded-[2rem] border border-[#151B24]/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] px-4 sm:px-10 py-10 sm:py-12">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2 py-0.5 rounded-md border border-[#00E582]/40 bg-[#00E582]/10 text-[#007A46] dark:text-[#00E582]">
                01
              </span>
              <span style={{ fontFamily: BODY_FONT }} className="text-sm font-semibold text-[#007A46] dark:text-[#00E582]">
                Photo gallery
              </span>
            </div>

            <h2
              style={{ fontFamily: DISPLAY_FONT }}
              className="mt-4 font-extrabold tracking-[-0.03em] leading-[1.12] text-4xl sm:text-5xl text-[#151B24] dark:text-white max-w-xl"
            >
              Moments that defined our journey
            </h2>

            <div className="mt-10">
              {loading ? (
                <LoadingGrid count={3} />
              ) : error ? (
                <ErrorBanner message={error} onRetry={load} />
              ) : items.length === 0 ? (
                <EmptyState
                  title="Gallery is currently empty"
                  description="Photos from upcoming workshops and hackathons will be uploaded here."
                />
              ) : (
                <>
                  <div className="flex gap-4 sm:gap-5 items-start">
                    {columns.map((col, colIdx) => (
                      <div key={colIdx} className="flex-1 min-w-0 flex flex-col gap-4 sm:gap-5">
                        {col.map(({ item, index }) => {
                          const title = getTitle(item);
                          return (
                            <motion.button
                              key={`${index}-${getSrc(item)}`}
                              type="button"
                              onClick={() => setActive(index)}
                              initial={prefersReduced ? false : { opacity: 0, y: 18 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.5,
                                delay: (index % PAGE_SIZE) * 0.05,
                                ease: [0.16, 1, 0.3, 1],
                              }}
                              aria-label={title ? `Open photo: ${title}` : 'Open photo'}
                              className="group relative block w-full overflow-hidden rounded-2xl bg-[#151B24]/10 dark:bg-white/5 border border-[#151B24]/10 dark:border-white/10 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E582]"
                            >
                              <img
                                src={getSrc(item)}
                                alt={title || 'Community photo'}
                                loading="lazy"
                                className="block w-full h-auto min-h-[160px] object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                              />
                              {title && (
                                <span className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 transition-all duration-300 rounded-xl border border-white/20 bg-[#151B24]/60 backdrop-blur-md px-3.5 py-2.5 font-sans text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                                  {title}
                                </span>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Load more */}
                  <div className="mt-12 flex flex-col items-center gap-3">
                    <p className="font-mono text-xs text-[#475569] dark:text-slate-400">
                      Showing {shown.length} of {items.length} photos
                    </p>
                    {remaining > 0 && (
                      <button
                        type="button"
                        onClick={() => setVisible((v) => v + PAGE_SIZE)}
                        style={{ fontFamily: BODY_FONT }}
                        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#00E582] text-[#151B24] font-semibold shadow-[0_8px_28px_rgba(0,229,130,0.3),inset_0_1px_0_rgba(255,255,255,0.45)] hover:brightness-95 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E582]"
                      >
                        <Plus className="w-4 h-4" />
                        Load more photos
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      <AnimatePresence>
        {active !== null && items[active] && (
          <Lightbox items={shown} index={active} onClose={() => setActive(null)} onChange={setActive} />
        )}
      </AnimatePresence>
    </>
  );
}