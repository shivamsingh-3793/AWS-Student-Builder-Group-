import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

const ITEMS = [
  'WORKSHOPS',
  'HACKATHONS',
  'CLOUD LABS',
  'AI SPRINTS',
  'MEETUPS',
  'OPEN SOURCE',
];

export function ExperienceMarquee() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const xRowOne = useTransform(scrollYProgress, [0, 1], prefersReduced ? [0, 0] : [0, -180]);
  const xRowTwo = useTransform(scrollYProgress, [0, 1], prefersReduced ? [0, 0] : [-180, 0]);

  return (
    <section
      ref={containerRef}
      className="py-16 sm:py-20 bg-[#151B24] text-white overflow-hidden border-y border-white/10"
      aria-label="Community Activities"
    >
      <div className="space-y-4">
        <motion.div style={{ x: xRowOne }} className="flex items-center gap-8 whitespace-nowrap">
          {[...ITEMS, ...ITEMS].map((label, idx) => (
            <span
              key={`r1-${idx}`}
              className="inline-flex items-center gap-8 font-display text-4xl sm:text-6xl font-extrabold tracking-tight"
            >
              <span className={idx % 2 === 1 ? 'text-[#00E582]' : 'text-white'}>{label}</span>
              <span className="w-3 h-3 bg-[#00E582] inline-block shrink-0" aria-hidden="true" />
            </span>
          ))}
        </motion.div>

        <motion.div style={{ x: xRowTwo }} className="flex items-center gap-8 whitespace-nowrap">
          {[...ITEMS.slice().reverse(), ...ITEMS.slice().reverse()].map((label, idx) => (
            <span
              key={`r2-${idx}`}
              className="inline-flex items-center gap-8 font-display text-4xl sm:text-6xl font-extrabold tracking-tight"
            >
              <span className={idx % 2 === 0 ? 'text-slate-500' : 'text-white'}>{label}</span>
              <span className="w-3 h-3 border border-[#00E582] inline-block shrink-0" aria-hidden="true" />
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
