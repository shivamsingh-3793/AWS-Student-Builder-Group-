import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { GalleryItem } from '../types';
import { ResilientImage } from './ResilientImage';

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedIndex(null);
      } else if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => (prev === null ? null : (prev + 1) % items.length));
      } else if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) =>
          prev === null ? null : (prev - 1 + items.length) % items.length
        );
      }
    };

    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [selectedIndex, items.length]);

  const activeItem = selectedIndex !== null ? items[selectedIndex] : null;

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {items.map((item, idx) => (
          <motion.button
            key={item.id}
            type="button"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45, delay: (idx % 3) * 0.07 }}
            onClick={() => setSelectedIndex(idx)}
            data-cursor="card"
            className="group relative block w-full text-left break-inside-avoid overflow-hidden border border-[#151B24]/12 dark:border-white/12 hover:border-[#00E582] transition-colors bg-[#151B24] focus-visible:outline-2 focus-visible:outline-[#00E582]"
          >
            <div className="overflow-hidden">
              <ResilientImage
                src={item.image_url}
                alt={item.title}
                fallbackTitle={item.title}
                className="w-full h-auto object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#151B24]/90 via-[#151B24]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-5">
              <span className="font-mono text-xs text-[#00E582]">{item.category}</span>
              <p className="font-display text-lg font-semibold text-white mt-1">
                {item.title}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Fullscreen Accessible Lightbox */}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#151B24]/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={activeItem.title}
            onClick={() => setSelectedIndex(null)}
          >
            <button
              type="button"
              onClick={() => setSelectedIndex(null)}
              aria-label="Close lightbox"
              className="absolute top-5 right-5 p-3 border border-white/20 text-white hover:border-[#00E582] hover:text-[#00E582] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex((prev) =>
                      prev === null ? 0 : (prev - 1 + items.length) % items.length
                    );
                  }}
                  aria-label="Previous image"
                  className="absolute left-4 sm:left-8 p-3 border border-white/20 text-white hover:border-[#00E582] hover:text-[#00E582] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex((prev) => (prev === null ? 0 : (prev + 1) % items.length));
                  }}
                  aria-label="Next image"
                  className="absolute right-4 sm:right-8 p-3 border border-white/20 text-white hover:border-[#00E582] hover:text-[#00E582] transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-5xl w-full"
            >
              <div className="border border-white/15 bg-[#151B24] overflow-hidden max-h-[75vh] flex items-center justify-center">
                <ResilientImage
                  src={activeItem.image_url}
                  alt={activeItem.title}
                  fallbackTitle={activeItem.title}
                  className="max-h-[75vh] w-auto object-contain mx-auto"
                />
              </div>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
                <div>
                  <span className="font-mono text-xs text-[#00E582]">{activeItem.category}</span>
                  <h3 className="font-display text-xl font-bold mt-0.5">{activeItem.title}</h3>
                </div>
                <span className="font-mono text-xs text-slate-400">
                  {(selectedIndex ?? 0) + 1} / {items.length}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
