import { AlertCircle, FolderOpen, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export function LoadingGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="border border-[#151B24]/10 dark:border-white/10 bg-white dark:bg-[#1A222D] overflow-hidden"
        >
          <div className="aspect-[4/3] bg-[#151B24]/5 dark:bg-white/5 animate-pulse" />
          <div className="p-6 space-y-3">
            <div className="h-3 w-28 bg-[#151B24]/10 dark:bg-white/10 animate-pulse" />
            <div className="h-6 w-3/4 bg-[#151B24]/10 dark:bg-white/10 animate-pulse" />
            <div className="h-4 w-full bg-[#151B24]/5 dark:bg-white/5 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-red-500/40 bg-red-500/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-[#151B24] dark:text-white">Unable to load data</p>
          <p className="text-sm text-[#475569] dark:text-slate-300 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#151B24]/20 dark:border-white/20 hover:border-[#00E582] transition-colors whitespace-nowrap shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </motion.div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-dashed border-[#151B24]/20 dark:border-white/15 p-12 text-center"
    >
      <FolderOpen className="w-9 h-9 mx-auto mb-3 text-[#008F52] dark:text-[#00E582]" />
      <h3 className="text-lg font-display font-semibold text-[#151B24] dark:text-white">
        {title}
      </h3>
      <p className="text-sm text-[#475569] dark:text-slate-400 mt-1 max-w-md mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-5 py-2.5 bg-[#00E582] text-[#151B24] text-sm font-semibold hover:brightness-95 transition-all whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
