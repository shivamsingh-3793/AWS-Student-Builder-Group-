import { motion } from 'motion/react';

export function CommunityIntro() {
  return (
    <section className="py-24 sm:py-32 bg-[#F5F7F6] dark:bg-[#151B24] border-b border-[#151B24]/10 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-8"
          >
            <p className="font-mono text-xs tracking-widest uppercase text-[#008F52] dark:text-[#00E582] mb-4">
              01. Manifesto
            </p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.03] text-[#151B24] dark:text-white text-balance">
              We don&apos;t just learn technology.{' '}
              <span className="block mt-2">
                We{' '}
                <span className="text-[#008F52] dark:text-[#00E582]">
                  build with the community
                </span>
                .
              </span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 space-y-4"
          >
            <p className="text-base text-[#475569] dark:text-slate-300 leading-relaxed">
              AWS Student Builder Group replaces passive slide decks with live engineering rooms.
              Students collaborate on Infrastructure as Code, deploy fault-tolerant APIs,
              and review production architectures side by side.
            </p>
            <div className="pt-2 border-t border-[#151B24]/10 dark:border-white/10 flex items-center justify-between text-xs font-mono text-[#475569] dark:text-slate-400">
              <span>Weekly Architecture Labs</span>
              <span>Open Source First</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
