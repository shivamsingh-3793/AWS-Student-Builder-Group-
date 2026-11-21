import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, BookOpen, CalendarDays, FolderKanban, Users } from 'lucide-react';
import { MagneticButton } from './MagneticButton';
import type { CommunityStats } from '../types';

const glassPanel =
  'border border-white/15 bg-white/[0.06] backdrop-blur-xl backdrop-saturate-150 shadow-[0_16px_48px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.18)]';

// First entry is the longest word, so it also sizes the invisible spacer
const ROTATING_WORDS = ['Innovate.', 'Create.', 'Ship.', 'Scale.', 'Lead.'];

const COMMUNITY_METRICS = [
  { label: 'Total Community Members', key: 'builders_count', icon: Users },
  { label: 'Projects Built', key: 'projects_count', icon: FolderKanban },
  { label: 'Events Conducted', key: 'events_count', icon: CalendarDays },
  { label: 'Workshops & Sessions Hosted', key: 'workshops_count', icon: BookOpen },
] as const;

export function Hero({
  onOpenJoin,
  stats,
}: {
  onOpenJoin: () => void;
  stats: CommunityStats | null;
}) {
  const prefersReduced = useReducedMotion();
  const [wordIndex, setWordIndex] = useState(0);

  // Cycle the last word automatically (stays on "Innovate." for reduced motion)
  useEffect(() => {
    if (prefersReduced) return;
    const id = window.setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [prefersReduced]);

  const reveal = (delay: number) => ({
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <section className="relative min-h-[92vh] bg-[#151B24] text-white overflow-hidden flex items-center pt-28 pb-16">
      {/* Blueprint grid, faded toward the edges so it stays quiet */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 0.7,
          backgroundPosition: prefersReduced ? '0px 0px' : ['0px 0px', '48px 48px'],
        }}
        transition={{
          opacity: { duration: 0.8 },
          backgroundPosition: { duration: 32, repeat: Infinity, ease: 'linear' },
        }}
        className="absolute inset-0 blueprint-grid [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />

      <motion.div
        aria-hidden="true"
        animate={prefersReduced ? undefined : { x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-24 right-[8%] w-[460px] h-[460px] rounded-full bg-[#00E582]/20 blur-[120px]"
      />
      <motion.div
        aria-hidden="true"
        animate={prefersReduced ? undefined : { x: [0, -24, 0], y: [0, 24, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-120px] left-[-60px] w-[420px] h-[420px] rounded-full bg-[#3B82F6]/15 blur-[130px]"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl lg:max-w-[50%]">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md px-4 py-1.5 font-serif text-sm sm:text-[0.95rem] text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] mb-8"
          >
            <span className="relative flex h-2 w-2">
              {!prefersReduced && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00E582] opacity-75" />
              )}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00E582]" />
            </span>
            AWS student and cloud engineering collective
          </motion.p>

          <h1 className="font-serif font-semibold tracking-tight leading-[1.02] text-6xl sm:text-7xl lg:text-[6.5rem]">
            <span className="sr-only">Learn. Build. Innovate.</span>

            <span aria-hidden="true" className="block overflow-hidden pb-1">
              <motion.span {...reveal(0.2)} className="block text-white">
                Learn.
              </motion.span>
            </span>

            <span aria-hidden="true" className="block overflow-hidden pb-1">
              <motion.span {...reveal(0.32)} className="block text-white">
                Build.
              </motion.span>
            </span>

            {/* Last word rotates: each word rolls up out of a mask while the next rolls in */}
            <span aria-hidden="true" className="block overflow-hidden pb-1 pr-3">
              <motion.span {...reveal(0.44)} className="relative block">
                {/* Invisible spacer keeps the line width and height stable between swaps */}
                <span className="invisible block italic">{ROTATING_WORDS[0]}</span>
                <AnimatePresence initial={false}>
                  <motion.span
                    key={ROTATING_WORDS[wordIndex]}
                    initial={prefersReduced ? false : { y: '100%', opacity: 0, filter: 'blur(8px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    exit={{ y: '-100%', opacity: 0, filter: 'blur(8px)' }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 block whitespace-nowrap italic text-[#00E582]"
                  >
                    {ROTATING_WORDS[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </motion.span>
            </span>
          </h1>

          {/* Fine accent rule */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.65, delay: 0.62, ease: [0.16, 1, 0.3, 1] }}
            style={{ originX: 0 }}
            className="h-px w-32 bg-gradient-to-r from-[#00E582] to-transparent my-8"
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.72 }}
            className="font-serif text-lg sm:text-xl text-slate-300 leading-relaxed max-w-xl"
          >
            A community of student builders, developers, and cloud enthusiasts who learn by
            building real technology on AWS, and turn what they learn into ideas that matter.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.86 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <MagneticButton
              onClick={onOpenJoin}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#00E582] text-[#151B24] font-serif font-semibold text-base shadow-[0_8px_28px_rgba(0,229,130,0.35),inset_0_1px_0_rgba(255,255,255,0.45)] hover:brightness-95 transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E582]"
            >
              <span>Join the Community</span>
              <ArrowRight className="w-4 h-4" />
            </MagneticButton>

            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/20 bg-white/[0.07] backdrop-blur-md text-white font-serif font-semibold text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-white/[0.14] hover:border-[#00E582]/60 hover:text-[#00E582] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E582]"
            >
              Explore Events
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mx-auto mt-10 w-full max-w-[480px] lg:absolute lg:right-8 lg:top-1/2 lg:mt-0 lg:w-[420px] lg:-translate-y-1/2 xl:right-16 xl:w-[480px]"
        >
          <div className={`rounded-3xl p-5 xl:p-6 ${glassPanel}`}>
            <div className="mb-4 border-b border-white/10 pb-4">
              <h2 className="font-serif text-xl font-semibold text-white">Community at a Glance</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                See the impact of our growing student builder community.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {COMMUNITY_METRICS.map(({ label, key, icon: Icon }, idx) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.55 + idx * 0.08 }}
                  whileHover={prefersReduced ? undefined : { y: -3 }}
                  className="min-h-28 rounded-xl border border-white/10 bg-white/[0.05] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-colors hover:border-[#00E582]/40 sm:p-4"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#00E582]/25 bg-[#00E582]/10 text-[#00E582]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <p className="pt-0.5 text-xs leading-snug text-slate-300">{label}</p>
                  </div>
                  <p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-[#00E582]">
                    {stats ? stats[key].toLocaleString() : '—'}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}