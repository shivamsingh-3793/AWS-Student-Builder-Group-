import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Award, BookOpen } from 'lucide-react';
import { ResilientImage } from './ResilientImage';


const COURSES = [
  {
    id: 'clf-c02',
    track: '21-DAY TRACK',
    stats: '69 Lessons • 661+ Enrolled',
    badge: 'Certificate Included',
    title: 'AWS Certified Cloud Practitioner (CLF-C02)',
    description:
      'Structured syllabus sprint covering core cloud architecture, EC2, S3, IAM, VPC, security, and GenAI foundations.',
    // new URL(...) lets Vite resolve and bundle the file in both dev and production builds
    image: new URL('../assets/images/AWS_Certified_Cloud.png', import.meta.url).href,
    link: 'https://skillbuilder.aws/',
    instructor: {
      name: 'Pawan Joshi',
      role: 'AWS Certified · Lead',
      image: new URL('../assets/images/parinoor.jpg', import.meta.url).href, // optional: leave empty to show initials instead
    },
  },
];

export function CertificationSection() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-[#151B24]/10 bg-white py-14 dark:border-white/10 dark:bg-[#1A222D] sm:py-20">
      {/* Background: faint drifting line grid + soft glows */}
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
          className="absolute -top-24 left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-[#00E582]/15 blur-[120px] dark:bg-[#00E582]/10"
          animate={reduce ? undefined : { x: [0, 60, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="inline-flex items-center gap-4 font-mono text-xs uppercase tracking-[0.2em] text-[#008F52] dark:text-[#00E582]">
            <span className="h-px w-8 bg-current opacity-60" />
            Community resource
            <span className="h-px w-8 bg-current opacity-60" />
          </p>
          <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#151B24] dark:text-white sm:text-5xl">
            Get AWS <span className="italic text-[#008F52] dark:text-[#00E582]">Certified</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-[#475569] dark:text-slate-300 sm:text-lg">
            From zero to certified in 21 days, a structured, free CLF-C02 syllabus sprint curated for builders.
          </p>
        </motion.div>

        {/* ---------- Course cards ---------- */}
        <div className="mt-8 space-y-6">
          {COURSES.map((course, idx) => (
            <motion.article
              key={course.id}
              initial={reduce ? false : { opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/70 bg-white/65 p-3 shadow-[0_16px_48px_-24px_rgba(21,27,36,0.3)] backdrop-blur-xl transition-[border-color,box-shadow] duration-300 hover:border-[#00E582]/70 hover:shadow-[0_24px_56px_-24px_rgba(0,229,130,0.45)] dark:border-white/15 dark:bg-[#151B24]/70 sm:p-4"
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00E582] to-transparent"
              />

              <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,220px)_1fr] md:gap-6">
                {/* Thumbnail */}
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-white/10 bg-[#151B24] md:aspect-[4/3]">
                  <ResilientImage
                    src={course.image}
                    alt={course.title}
                    fallbackTitle={course.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                {/* Details */}
                <div className="flex min-w-0 flex-col">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md border border-[#00E582]/40 bg-[#00E582]/10 px-2 py-0.5 font-mono text-[10px] text-[#008F52] dark:text-[#00E582]">
                      {course.track}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-[#151B24]/15 bg-white/70 px-2 py-0.5 text-[10px] text-[#475569] dark:border-white/15 dark:bg-white/5 dark:text-slate-300">
                      <BookOpen className="h-3 w-3" aria-hidden="true" />
                      {course.stats}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-300">
                      <Award className="h-3 w-3" aria-hidden="true" />
                      {course.badge}
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-serif text-xl font-semibold leading-snug text-[#151B24] dark:text-white sm:text-2xl">
                    {course.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#475569] dark:text-slate-400">{course.description}</p>

                  {/* Instructor + CTA */}
                  <div className="mt-3 flex flex-col gap-3 border-t border-[#151B24]/10 pt-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#151B24]/15 bg-[#151B24] dark:border-white/20">
                        {course.instructor.image ? (
                          <ResilientImage
                            src={course.instructor.image}
                            alt={course.instructor.name}
                            fallbackTitle={course.instructor.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="grid h-full w-full place-items-center bg-[#00E582]/15 font-serif text-xs font-semibold text-[#008F52] dark:text-[#00E582]"
                          >
                            {course.instructor.name
                              .split(' ')
                              .map((w) => w[0])
                              .join('')
                              .slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#151B24] dark:text-white">
                          {course.instructor.name}
                        </p>
                        <p className="text-[11px] italic text-[#475569] dark:text-slate-400">
                          {course.instructor.role}
                        </p>
                      </div>
                    </div>

                    <motion.a
                      href={course.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={reduce ? undefined : { scale: 1.04 }}
                      whileTap={reduce ? undefined : { scale: 0.97 }}
                      className="relative inline-flex w-full items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-lg bg-[#00E582] px-4 py-2 text-xs font-semibold text-[#151B24] shadow-[0_8px_24px_rgba(0,229,130,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E582] focus-visible:ring-offset-2 sm:w-auto"
                    >
                      {!reduce && (
                        <motion.span
                          aria-hidden="true"
                          className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/40"
                          initial={{ x: '-150%' }}
                          animate={{ x: '450%' }}
                          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' }}
                        />
                      )}
                      <span className="relative">Explore AWS Skill Builder</span>
                      <ArrowUpRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </motion.a>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}