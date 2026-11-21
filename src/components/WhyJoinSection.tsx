import type { MouseEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, GitBranch, Hammer, Trophy, Users } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

const PILLARS = [
  {
    index: '01',
    icon: Hammer,
    title: 'Hands-On Learning',
    description:
      'Skip passive video playlists. Provision real VPCs, serverless event pipelines, and Kubernetes clusters inside guided builder labs.',
    detail: 'Weekly live sandbox builds',
  },
  {
    index: '02',
    icon: GitBranch,
    title: 'Real Projects',
    description:
      'Turn weekend prototypes into maintained open-source systems used across campus with automated CI/CD and telemetry.',
    detail: 'Production GitHub repositories',
  },
  {
    index: '03',
    icon: Users,
    title: 'Mentorship',
    description:
      'Get direct architecture reviews, IAM security critiques, and career coaching from senior student leads and AWS Heroes.',
    detail: '1-on-1 architecture clinics',
  },
  {
    index: '04',
    icon: Trophy,
    title: 'Opportunities',
    description:
      'Earn AWS certification study support, compete in 24-hour cloud sprints, and demo at regional engineering summits.',
    detail: 'Summits, certs & sprints',
  },
];

/* Giant outlined words that drift slowly behind the cards */
const BG_ROW_ONE = 'LEARN · BUILD · SHIP · ';
const BG_ROW_TWO = 'DEPLOY · SCALE · INNOVATE · ';

const outline =
  'text-transparent [-webkit-text-stroke:1px_rgba(21,27,36,0.10)] dark:[-webkit-text-stroke:1px_rgba(255,255,255,0.08)]';

function DriftingText({
  text,
  reverse = false,
  duration,
  className,
  reduce,
}: {
  text: string;
  reverse?: boolean;
  duration: number;
  className: string;
  reduce: boolean | null;
}) {
  // Text is repeated so the loop of -50% is seamless
  const content = text.repeat(6);
  return (
    <motion.div
      className={`absolute left-0 flex w-max whitespace-nowrap font-serif font-semibold italic leading-none ${outline} ${className}`}
      animate={reduce ? undefined : { x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      <span>{content}</span>
      <span>{content}</span>
    </motion.div>
  );
}

/* Moves a soft green spotlight with the cursor inside a card */
function trackSpotlight(e: MouseEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
}

export function WhyJoinSection() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-[#151B24]/10 bg-[#F5F7F6] py-8 dark:border-white/10 dark:bg-[#151B24] sm:py-10">
      {/* ---------- Background layers ---------- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* Drifting giant text, fades out at top and bottom */}
        <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
          <DriftingText
            text={BG_ROW_ONE}
            duration={330}
            reduce={reduce}
            className="top-[1%] text-[7rem] sm:text-[10rem]"
          />
          <DriftingText
            text={BG_ROW_TWO}
            reverse
            duration={390}
            reduce={reduce}
            className="bottom-[1%] text-[7rem] sm:text-[10rem]"
          />
        </div>

        {/* Light line grid */}
        <motion.div
          className="absolute inset-0 text-[#151B24]/[0.05] dark:text-white/[0.04] [mask-image:radial-gradient(ellipse_at_center,black_15%,transparent_70%)]"
          style={{
            backgroundImage:
              'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
          animate={reduce ? undefined : { backgroundPosition: ['0px 0px', '56px 56px'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />

        {/* Soft glows */}
        <motion.div
          className="absolute -top-24 -right-24 h-[300px] w-[300px] rounded-full bg-[#00E582]/15 blur-[110px] dark:bg-[#00E582]/10"
          animate={reduce ? undefined : { x: [0, -50, 0], y: [0, 40, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 -left-20 h-[280px] w-[280px] rounded-full bg-[#3B82F6]/15 blur-[120px] dark:bg-[#3B82F6]/10"
          animate={reduce ? undefined : { x: [0, 40, 0], y: [0, -36, 0] }}
          transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* ---------- Content ---------- */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionHeading
            index="06. Value Proposition"
            title="Why build with us?"
            accentWord="build"
            subtitle="An engineering environment designed for students who learn fastest by deploying real infrastructure."
          />
        </motion.div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.index}
                initial={reduce ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={reduce ? undefined : { y: -4 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.55, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                onMouseMove={trackSpotlight}
                data-cursor="card"
                className="group relative flex flex-col justify-between overflow-hidden rounded-lg border border-[#151B24]/12 bg-white/90 p-5 shadow-sm backdrop-blur-sm transition-[border-color,box-shadow] duration-300 hover:border-[#00E582]/70 hover:shadow-[0_28px_60px_-22px_rgba(0,229,130,0.45)] dark:border-white/12 dark:bg-[#1A222D]/90 sm:p-6"
              >
                {/* Cursor-following spotlight */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      'radial-gradient(340px circle at var(--mx, 50%) var(--my, 50%), rgba(0,229,130,0.14), transparent 60%)',
                  }}
                />

                {/* Accent line that sweeps across the top on hover */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-[#00E582] to-[#3B82F6] transition-transform duration-500 group-hover:scale-x-100"
                />

                {/* Oversized outlined number */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-1 -top-2 select-none font-serif text-[4.5rem] font-semibold leading-none text-transparent transition-all duration-500 [-webkit-text-stroke:1px_rgba(21,27,36,0.14)] group-hover:text-[#00E582]/15 group-hover:[-webkit-text-stroke:1px_rgba(0,229,130,0.7)] dark:[-webkit-text-stroke:1px_rgba(255,255,255,0.14)]"
                >
                  {pillar.index}
                </span>

                <div className="relative">
                  <span className="grid h-10 w-10 place-items-center rounded-lg border border-[#00E582]/40 bg-[#00E582]/10 text-[#008F52] transition-all duration-300 group-hover:rotate-6 group-hover:bg-[#00E582] group-hover:text-[#151B24] dark:text-[#00E582] dark:group-hover:text-[#151B24]">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>

                  <h3 className="mt-4 font-serif text-xl font-semibold text-[#151B24] transition-colors dark:text-white sm:text-2xl">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#475569] dark:text-slate-400">
                    {pillar.description}
                  </p>
                </div>

                <div className="relative mt-5 flex items-center justify-between border-t border-[#151B24]/10 pt-3 dark:border-white/10">
                  <span className="font-serif text-sm italic text-[#008F52] dark:text-[#00E582]">
                    {pillar.detail}
                  </span>
                  <ArrowRight className="h-4 w-4 -translate-x-2 text-[#008F52] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 dark:text-[#00E582]" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}