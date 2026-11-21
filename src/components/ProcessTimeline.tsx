import { motion } from 'motion/react';
import { SectionHeading } from './SectionHeading';

// Self-contained SVGs (or replace with lucide-react: Terminal, Layers, Rocket, Users)
function TerminalIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 3-3 3m4.5 0h4.5" />
      <rect width="18" height="14" x="3" y="5" rx="2" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LayersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 2 9 4.5-9 4.5L3 6.5 12 2Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 12 9 4.5 9-4.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 17.5 9 4.5 9-4.5" />
    </svg>
  );
}

function RocketIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6.05 11a22.35 22.35 0 0 1-3.95 2Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 6 6" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

const STAGES = [
  {
    step: '01',
    phaseLabel: 'Foundation',
    title: 'Learn',
    description:
      'Master core cloud primitives—IAM, VPC networking, serverless compute, and distributed data modeling—through guided workshops.',
    icon: TerminalIcon,
    tags: ['IAM & VPC', 'Serverless', 'Workshops'],
  },
  {
    step: '02',
    phaseLabel: 'Architecture',
    title: 'Build',
    description:
      'Form cross-functional engineering squads to turn real campus and open-source problems into working cloud architectures.',
    icon: LayersIcon,
    tags: ['Squads', 'Cloud Arch', 'Open Source'],
  },
  {
    step: '03',
    phaseLabel: 'Deployment',
    title: 'Ship',
    description:
      'Deploy with repeatable Infrastructure as Code pipelines, automated observability, and strict cost guardrails.',
    icon: RocketIcon,
    tags: ['IaC / Terraform', 'CI/CD Pipelines', 'Observability'],
  },
  {
    step: '04',
    phaseLabel: 'Ecosystem',
    title: 'Connect',
    description:
      'Demo your work at community summits, receive architecture reviews from AWS practitioners, and mentor new cohorts.',
    icon: UsersIcon,
    tags: ['Demo Summits', 'AWS Reviews', 'Mentorship'],
  },
];

export function ProcessTimeline() {
  return (
    <section className="relative py-24 sm:py-32 bg-[#FBFDFB] dark:bg-[#1A222D] border-b border-[#151B24]/10 dark:border-white/10 overflow-hidden">
      {/* Ambient background glow & subtle engineering grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#00E582]/10 dark:bg-[#00E582]/15 rounded-full blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#151B2406_1px,transparent_1px),linear-gradient(to_bottom,#151B2406_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          index="02. How We Operate"
          title="Building is better together."
          accentWord="together."
          subtitle="Four deliberate stages take every new member from first cloud sandbox deploy to shipping open-source systems."
        />

        {/* Timeline Container */}
        <div className="mt-20 relative">
          {/* Desktop horizontal continuous connector track */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-[14px] left-6 right-6 h-[2px] bg-[#151B24]/10 dark:bg-white/10 overflow-hidden"
          >
            {/* Animated energetic laser pulse along the line */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '250%' }}
              transition={{
                repeat: Infinity,
                duration: 3.2,
                ease: 'easeInOut',
              }}
              className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#00E582] to-transparent"
            />
          </div>

          {/* Mobile vertical continuous connector line */}
          <div
            aria-hidden="true"
            className="lg:hidden absolute left-4 top-2 bottom-6 w-[2px] bg-gradient-to-b from-[#00E582] via-[#00E582]/40 to-[#151B24]/10 dark:to-white/10"
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-6 relative">
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <motion.div
                  key={stage.step}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.5,
                    delay: idx * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="group relative pl-12 lg:pl-0 lg:pt-12"
                >
                  {/* Node marker with active radar ping */}
                  <div className="absolute left-4 -translate-x-1/2 top-2 lg:left-6 lg:-translate-x-1/2 lg:top-[14px] lg:-translate-y-1/2 z-10">
                    <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white dark:bg-[#151B24] border-2 border-[#151B24]/20 dark:border-white/20 group-hover:border-[#00E582] group-hover:shadow-[0_0_18px_rgba(0,229,130,0.6)] transition-all duration-300">
                      {/* Outer pulse wave */}
                      <span className="absolute inset-0 rounded-full bg-[#00E582] opacity-0 group-hover:opacity-100 group-hover:animate-ping pointer-events-none" />
                      {/* Inner solid beacon */}
                      <span className="w-2 h-2 rounded-full bg-[#008F52] dark:bg-[#00E582] transition-transform duration-300 group-hover:scale-125" />
                    </div>
                  </div>

                  {/* Stage Card */}
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="relative flex flex-col justify-between h-full rounded-2xl bg-white/80 dark:bg-[#151B24]/90 backdrop-blur-md border border-[#151B24]/10 dark:border-white/10 p-6 shadow-sm hover:shadow-2xl hover:shadow-[#00E582]/10 hover:border-[#00E582]/70 dark:hover:border-[#00E582]/70 transition-all duration-300 overflow-hidden"
                  >
                    {/* Background oversized step watermark */}
                    <span
                      aria-hidden="true"
                      className="absolute -right-2 -top-3 font-mono text-7xl font-black text-[#151B24]/5 dark:text-white/[0.03] select-none pointer-events-none group-hover:text-[#00E582]/10 transition-colors duration-300"
                    >
                      {stage.step}
                    </span>

                    <div>
                      {/* Header: Icon + Phase LED badge */}
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-11 h-11 rounded-xl bg-[#00E582]/10 dark:bg-[#00E582]/15 border border-[#00E582]/30 flex items-center justify-center text-[#008F52] dark:text-[#00E582] group-hover:scale-110 group-hover:bg-[#00E582] group-hover:text-[#151B24] transition-all duration-300 shadow-[0_0_14px_rgba(0,229,130,0.15)]">
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#151B24]/5 dark:bg-white/5 border border-[#151B24]/10 dark:border-white/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#008F52] dark:bg-[#00E582] animate-pulse" />
                          <span className="font-mono text-[11px] font-bold text-[#008F52] dark:text-[#00E582] tracking-wider">
                            PHASE {stage.step}
                          </span>
                        </div>
                      </div>

                      {/* Phase sub-label & Title */}
                      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[#008F52] dark:text-[#00E582]/80 mb-1">
                        {stage.phaseLabel}
                      </p>
                      <h3 className="font-display text-2xl font-bold text-[#151B24] dark:text-white group-hover:text-[#008F52] dark:group-hover:text-[#00E582] transition-colors">
                        {stage.title}
                      </h3>

                      <p className="mt-3 text-sm text-[#475569] dark:text-slate-400 leading-relaxed">
                        {stage.description}
                      </p>
                    </div>

                    {/* Footer Deliverable Tags */}
                    <div className="mt-6 pt-4 border-t border-[#151B24]/5 dark:border-white/5 flex flex-wrap gap-1.5">
                      {stage.tags.map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-[11px] font-medium px-2 py-0.5 rounded bg-[#151B24]/[0.03] dark:bg-white/[0.04] text-[#475569] dark:text-slate-400 border border-[#151B24]/5 dark:border-white/5 group-hover:border-[#00E582]/30 group-hover:text-[#151B24] dark:group-hover:text-slate-200 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}