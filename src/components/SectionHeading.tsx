import { motion } from 'motion/react';

interface SectionHeadingProps {
  index?: string;
  title: string;
  accentWord?: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

export function SectionHeading({
  index,
  title,
  accentWord,
  subtitle,
  align = 'left',
}: SectionHeadingProps) {
  const parts = accentWord && title.includes(accentWord) ? title.split(accentWord) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={align === 'center' ? 'text-center max-w-3xl mx-auto' : 'max-w-3xl'}
    >
      {index && (
        <p className="font-mono text-xs tracking-widest uppercase text-[#008F52] dark:text-[#00E582] mb-3">
          {index}
        </p>
      )}
      <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#151B24] dark:text-white leading-[1.08] text-balance">
        {parts ? (
          <>
            {parts[0]}
            <span className="text-[#008F52] dark:text-[#00E582]">{accentWord}</span>
            {parts[1]}
          </>
        ) : (
          title
        )}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-[#475569] dark:text-slate-400 leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
