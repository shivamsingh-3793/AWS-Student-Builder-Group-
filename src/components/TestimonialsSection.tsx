import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

const TESTIMONIALS = [
  {
    quote:
      'Before joining AWS Student Builder Group, AWS IAM and VPC subnets felt intimidating. Within two months of Friday cloud labs, our squad shipped a real-time Kinesis telemetry service that handled 50,000 events per second in load testing.',
    name: 'Nadia Patel',
    role: 'Cloud Infrastructure Lead, Class of 2026',
    cohort: 'Cohort 04 · Serverless Track',
  },
  {
    quote:
      'The architecture clinics changed how I engineer software. Getting line-by-line CDK reviews from peers who actually run production systems helped me land my Cloud Platform Engineering internship.',
    name: 'Marcus Okonkwo',
    role: 'Distributed Systems Builder, Class of 2027',
    cohort: 'Cohort 05 · DevOps & IaC Track',
  },
  {
    quote:
      'Our 24-hour hackathon team walked in with a rough diagram and left with an automated ECS Fargate deployment, OpenTelemetry dashboards, and three mentors who still review our open-source pull requests.',
    name: 'Hannah Lindqvist',
    role: 'Backend & Observability Engineer, Class of 2026',
    cohort: 'Cohort 03 · Reliability Track',
  },
  {
    quote:
      'What makes this collective rare is the shipping standard. Nobody stops at a localhost demo—every build gets proper CI/CD, least-privilege IAM roles, and public documentation.',
    name: 'Devon Takahashi',
    role: 'AWS Community Builder & Alumnus',
    cohort: 'Cohort 02 · Founding Member',
  },
];

const AUTOPLAY_MS = 7000;

const arrowBtn =
  'grid h-10 w-10 place-items-center rounded-lg border border-[#151B24]/15 text-[#151B24] transition-colors ' +
  'hover:border-[#00E582] hover:bg-[#00E582] dark:border-white/15 dark:text-white dark:hover:text-[#151B24] ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E582] focus-visible:ring-offset-2';

const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

export function TestimonialsSection() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const prev = () => setActive((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  const next = () => setActive((i) => (i + 1) % TESTIMONIALS.length);

  // Auto-advance. Pauses while the card is hovered or focused, and never runs with reduced motion.
  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setTimeout(next, AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [active, paused, reduce]);

  const current = TESTIMONIALS[active];

  return (
    <section className="relative overflow-hidden border-b border-[#151B24]/10 bg-white py-12 dark:border-white/10 dark:bg-[#1A222D] sm:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute inset-0 text-[#151B24]/[0.06] dark:text-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,black_15%,transparent_70%)]"
          style={{
            backgroundImage:
              'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
          animate={reduce ? undefined : { backgroundPosition: ['0px 0px', '56px 56px'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -top-20 -left-20 h-[340px] w-[340px] rounded-full bg-[#00E582]/15 blur-[110px] dark:bg-[#00E582]/10"
          animate={reduce ? undefined : { x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-24 -right-16 h-[320px] w-[320px] rounded-full bg-[#3B82F6]/15 blur-[110px] dark:bg-[#3B82F6]/10"
          animate={reduce ? undefined : { x: [0, -40, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
        >
          <SectionHeading index="07. Builder Voices" title="What builders say." accentWord="builders" />

          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={prev} aria-label="Previous testimonial" className={arrowBtn}>
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-mono text-xs tabular-nums text-[#475569] dark:text-slate-400">
              0{active + 1} / 0{TESTIMONIALS.length}
            </span>
            <button type="button" onClick={next} aria-label="Next testimonial" className={arrowBtn}>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          aria-roledescription="carousel"
          className="relative mt-7 overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-5 shadow-[0_16px_48px_-24px_rgba(21,27,36,0.3)] backdrop-blur-xl transition-[border-color,box-shadow] duration-300 hover:border-[#00E582]/60 hover:shadow-[0_28px_60px_-22px_rgba(0,229,130,0.4)] dark:border-white/15 dark:bg-[#151B24]/70 sm:p-7"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-4 right-5 select-none font-serif text-[9rem] leading-none text-[#00E582]/20"
          >
            &rdquo;
          </span>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_200px] md:items-center md:gap-7"
              aria-live="polite"
            >
              <blockquote className="font-serif text-lg font-medium leading-relaxed text-[#151B24] dark:text-white sm:text-xl">
                &ldquo;{current.quote}&rdquo;
              </blockquote>

              <div className="flex flex-col gap-3 border-t border-[#151B24]/10 pt-4 dark:border-white/10 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#00E582]/40 bg-[#00E582]/15 font-serif text-sm font-semibold text-[#008F52] dark:text-[#00E582]"
                  >
                    {initials(current.name)}
                  </span>
                  <p className="font-serif text-base font-semibold text-[#151B24] dark:text-white">
                    {current.name}
                  </p>
                </div>
                <p className="text-sm leading-snug text-[#475569] dark:text-slate-400">{current.role}</p>
                <span className="font-mono text-[11px] text-[#008F52] dark:text-[#00E582]">{current.cohort}</span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots + autoplay progress */}
          <div className="relative mt-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2" role="tablist" aria-label="Choose testimonial">
              {TESTIMONIALS.map((t, i) => (
                <button
                  key={t.name}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Show testimonial from ${t.name}`}
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E582] focus-visible:ring-offset-2 ${
                    i === active
                      ? 'w-8 bg-[#00E582]'
                      : 'w-3 bg-[#151B24]/20 hover:bg-[#00E582]/60 dark:bg-white/20'
                  }`}
                />
              ))}
            </div>

            {!reduce && (
              <div className="h-px flex-1 overflow-hidden bg-[#151B24]/10 dark:bg-white/10" aria-hidden="true">
                <motion.div
                  key={`${active}-${paused}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: paused ? 0 : 1 }}
                  transition={{ duration: paused ? 0 : AUTOPLAY_MS / 1000, ease: 'linear' }}
                  style={{ originX: 0 }}
                  className="h-full bg-gradient-to-r from-[#00E582] to-[#3B82F6]"
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}