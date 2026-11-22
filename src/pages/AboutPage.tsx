import { motion } from 'motion/react';
import { SeoHead } from '../components/SeoHead';
import { SectionHeading } from '../components/SectionHeading';
import { ProcessTimeline } from '../components/ProcessTimeline';
import { TeamSection } from '../components/TeamSection';
import { FinalCTA } from '../components/FinalCTA';
import { ResilientImage } from '../components/ResilientImage';

export function AboutPage({ onOpenJoin }: { onOpenJoin: () => void }) {
  return (
    <>
      <SeoHead
        title="About AWS Student Builder Group | AWS Community Punjab"
        description="Learn about the AWS Student Builder Group at Indo Global Group of Colleges, Punjab and its workshops, projects and community activities."
        canonicalPath="/about"
      />

      <section className="pt-32 pb-20 bg-[#151B24] text-white blueprint-grid border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-xs uppercase tracking-widest text-[#00E582] mb-4"
          >
            About AWS Student Builder Group
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.02] max-w-4xl text-balance"
          >
            Where classroom theory meets{' '}
            <span className="text-[#00E582]">production cloud infrastructure</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-6 text-lg text-slate-300 max-w-2xl leading-relaxed"
          >
            Founded by student cloud architects, AWS Student Builder Group exists to close the gap between
            computer science fundamentals and real-world AWS engineering.
          </motion.p>
        </div>
      </section>

      <section className="py-20 bg-[#F5F7F6] dark:bg-[#151B24] border-b border-[#151B24]/10 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <SectionHeading
              index="Our Model"
              title="Built around shipping, not memorizing."
              accentWord="shipping,"
            />
            <p className="text-base text-[#475569] dark:text-slate-300 leading-relaxed">
              Every semester, members join small engineering squads paired with experienced cloud
              mentors. Instead of watching pre-recorded lectures, squads receive isolated AWS sandbox
              accounts and build real event-driven applications, observability pipelines, and
              developer tools.
            </p>
            <p className="text-base text-[#475569] dark:text-slate-300 leading-relaxed">
              Workshops are open to every discipline—from first-year students writing their first
              Lambda function to senior engineers tuning Rust runtimes and multi-region DynamoDB
              tables.
            </p>
          </div>

          <div className="lg:col-span-6 border border-[#151B24]/12 dark:border-white/12 overflow-hidden bg-[#151B24] aspect-[4/3]">
            <ResilientImage
              src="/src/assets/images/AWS_logo.jpeg"
              alt="AWS Student Builder Group community logo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      <ProcessTimeline />
      <TeamSection />
      <FinalCTA onOpenJoin={onOpenJoin} />
    </>
  );
}
