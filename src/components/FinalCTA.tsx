import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

export function FinalCTA({ onOpenJoin }: { onOpenJoin: () => void }) {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative bg-[#00E582] text-[#151B24] py-24 sm:py-32 overflow-hidden">
      <motion.div
        aria-hidden="true"
        animate={
          prefersReduced
            ? undefined
            : { backgroundPosition: ['0px 0px', '40px 40px'] }
        }
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 opacity-20"
        style={{
          backgroundSize: '40px 40px',
          backgroundImage:
            'linear-gradient(to right, rgba(21,27,36,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(21,27,36,0.22) 1px, transparent 1px)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-mono text-xs uppercase tracking-widest text-[#151B24]/80 mb-4">
            Next Cohort Open
          </p>
          <h2 className="font-display font-extrabold tracking-tight leading-[0.95] text-4xl sm:text-6xl lg:text-7xl text-[#151B24] text-balance">
            Ready to build
            <span className="block">something real?</span>
          </h2>
          <p className="mt-6 text-lg sm:text-xl text-[#151B24]/85 max-w-xl font-medium">
            Join a community where learning turns into shipping—from your first sandbox
            deploy to production AWS architecture.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <MagneticButton
            onClick={onOpenJoin}
            className="inline-flex items-center gap-3 px-8 py-5 bg-[#151B24] text-[#00E582] font-display font-bold text-base sm:text-lg hover:bg-[#1f2835] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#151B24]"
          >
            <span>Join the Community</span>
            <ArrowRight className="w-5 h-5" />
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}
