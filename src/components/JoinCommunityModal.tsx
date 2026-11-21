import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Hammer,
  Loader2,
  Users,
  X,
} from 'lucide-react';
import { communityApi } from '../lib/api';

interface JoinCommunityModalProps {
  open: boolean;
  onClose: () => void;
}

const ROLES = ['Student Builder', 'Software Engineer', 'Cloud Enthusiast', 'Mentor / Speaker'];

const TRACKS = [
  { value: 'Serverless & Cloud', slug: 'serverless' },
  { value: 'DevOps & IaC', slug: 'devops-iac' },
  { value: 'Distributed Systems', slug: 'distributed' },
  { value: 'Applied Cloud AI', slug: 'cloud-ai' },
];

// Edit this copy freely – it's placeholder text for the side panel.
const PERKS = [
  { icon: Users, title: 'Build with a crew', text: 'Pair up on projects and get unstuck faster.' },
  { icon: GraduationCap, title: 'Learn from mentors', text: 'Get feedback from engineers who use AWS every day.' },
  { icon: Hammer, title: 'Ship something real', text: 'Turn a project idea into a working demo.' },
];

const INITIAL_FORM = {
  name: '',
  email: '',
  role: ROLES[0],
  track: TRACKS[0].value,
  message: '',
};

const MESSAGE_MAX = 500;

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const fieldClass =
  'w-full px-3.5 py-3 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 ' +
  'text-[#151B24] dark:text-white text-sm placeholder:text-[#64748B] dark:placeholder:text-slate-500 ' +
  'transition-colors hover:border-[#151B24]/30 dark:hover:border-white/30 ' +
  'focus:outline-none focus:border-[#00E582] focus:ring-2 focus:ring-[#00E582]/25';

const labelClass = 'block text-sm font-medium text-[#151B24] dark:text-slate-200 mb-1.5';

export function JoinCommunityModal({ open, onClose }: JoinCommunityModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reduceMotion = useReducedMotion();
  const uid = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const requestCloseRef = useRef<() => void>(() => {});

  const setField =
    (key: keyof typeof INITIAL_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  // Don't allow closing mid-request, so a half-sent application isn't lost.
  requestCloseRef.current = () => {
    if (!submitting) onClose();
  };

  // Scroll lock, Escape to close, focus trap, and focus restore.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => firstFieldRef.current?.focus(), 80);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        requestCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null,
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setSubmitting(true);
    try {
      const res = await communityApi.join({
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        track: form.track,
        message: form.message.trim(),
      });
      setSuccess(res?.message || "Thanks for applying. We'll reply by email.");
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We couldn’t send your application. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset success/error only after the exit animation, so the form doesn't flash while closing.
  const handleExitComplete = () => {
    setSuccess('');
    setError('');
  };

  const trackSlug = TRACKS.find((t) => t.value === form.track)?.slug ?? 'serverless';

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[90] bg-[#0B1018]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onMouseDown={(e) => {
            // Only a real click on the backdrop closes – not a drag that ends outside the panel.
            if (e.target === e.currentTarget) requestCloseRef.current();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Join AWS Student Builder Group"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-4xl max-h-[92dvh] flex flex-col md:flex-row overflow-hidden bg-white dark:bg-[#1A222D] border border-[#151B24]/15 dark:border-white/15 shadow-2xl shadow-black/40"
          >
            {/* Brand panel (desktop) */}
            <aside
              className="hidden md:flex md:w-[42%] shrink-0 flex-col p-8 text-white bg-[#151B24] relative overflow-hidden"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 0% 100%, rgba(0,229,130,0.22), transparent 55%),' +
                  'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),' +
                  'linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
                backgroundSize: 'auto, 32px 32px, 32px 32px',
              }}
            >
              <div className="absolute top-0 left-0 h-1 w-full bg-[#00E582]" aria-hidden="true" />

              <h2 className="font-display text-3xl font-bold leading-tight">Join AWS Student Builder Group</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                A community for students and engineers who learn cloud by building it.
              </p>

              <ul className="mt-8 space-y-5">
                {PERKS.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-3.5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-[#00E582]/30 bg-[#00E582]/10 text-[#00E582]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="mt-0.5 text-sm leading-snug text-slate-400">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Reacts to the form: the signature detail */}
              <div
                aria-hidden="true"
                className="mt-auto pt-8 font-mono text-xs leading-relaxed text-slate-400"
              >
                <div className="border border-white/10 bg-black/30 p-4">
                  <p>
                    <span className="text-[#00E582]">$</span> aws-builders join
                  </p>
                  <p className="pl-3">
                    --track <span className="text-[#00E582]">{trackSlug}</span>
                  </p>
                  <p className="pl-3 truncate">
                    --role <span className="text-slate-200">"{form.role}"</span>
                  </p>
                </div>
              </div>
            </aside>

            {/* Form panel */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 md:pt-10">
              <button
                type="button"
                onClick={() => requestCloseRef.current()}
                aria-label="Close"
                className="absolute top-3 right-3 p-2 text-[#475569] dark:text-slate-400 transition-colors hover:text-[#151B24] dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E582]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>

              {success ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                  <motion.div
                    initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-[#00E582]/15 ring-8 ring-[#00E582]/10"
                  >
                    <CheckCircle2 className="h-10 w-10 text-[#008F52] dark:text-[#00E582]" aria-hidden="true" />
                  </motion.div>
                  <h3 className="mt-6 font-display text-2xl font-bold text-[#151B24] dark:text-white">
                    Application sent
                  </h3>
                  <p role="status" className="mt-2 max-w-xs text-sm leading-relaxed text-[#475569] dark:text-slate-400">
                    {success}
                  </p>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => requestCloseRef.current()}
                    className="mt-8 px-8 py-3 bg-[#00E582] text-[#151B24] font-semibold text-sm transition-all hover:brightness-95 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E582] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1A222D]"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* Title for small screens, where the brand panel is hidden */}
                  <h2 className="md:hidden pr-8 font-display text-2xl font-bold text-[#151B24] dark:text-white">
                    Join AWS Student Builder Group
                  </h2>
                  <p className="mt-1.5 md:mt-0 text-sm text-[#475569] dark:text-slate-400">
                    Tell us a little about yourself. It takes about a minute.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate={false}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor={`${uid}-name`} className={labelClass}>
                          Full name
                        </label>
                        <input
                          ref={firstFieldRef}
                          id={`${uid}-name`}
                          type="text"
                          required
                          maxLength={80}
                          autoComplete="name"
                          value={form.name}
                          onChange={setField('name')}
                          placeholder="Alex Rivera"
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label htmlFor={`${uid}-email`} className={labelClass}>
                          Email
                        </label>
                        <input
                          id={`${uid}-email`}
                          type="email"
                          required
                          maxLength={120}
                          autoComplete="email"
                          value={form.email}
                          onChange={setField('email')}
                          placeholder="alex@university.edu"
                          className={fieldClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor={`${uid}-role`} className={labelClass}>
                        I am a
                      </label>
                      <div className="relative">
                        <select
                          id={`${uid}-role`}
                          value={form.role}
                          onChange={setField('role')}
                          className={`${fieldClass} appearance-none pr-10 cursor-pointer`}
                        >
                          {ROLES.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                        <ChevronDown
                          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#475569] dark:text-slate-400"
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    <fieldset>
                      <legend className={labelClass}>Focus track</legend>
                      <div className="grid grid-cols-2 gap-2">
                        {TRACKS.map((t) => (
                          <label key={t.value} className="relative cursor-pointer">
                            <input
                              type="radio"
                              name={`${uid}-track`}
                              value={t.value}
                              checked={form.track === t.value}
                              onChange={setField('track')}
                              className="peer sr-only"
                            />
                            <span
                              className="block px-3 py-2.5 text-center text-sm border border-[#151B24]/15 dark:border-white/15 bg-[#F5F7F6] dark:bg-[#151B24] text-[#475569] dark:text-slate-300 transition-colors hover:border-[#151B24]/30 dark:hover:border-white/30 peer-checked:border-[#00E582] peer-checked:bg-[#00E582]/10 peer-checked:font-semibold peer-checked:text-[#151B24] dark:peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#00E582]/60"
                            >
                              {t.value}
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <div>
                      <div className="flex items-baseline justify-between">
                        <label htmlFor={`${uid}-message`} className={labelClass}>
                          What do you want to build?{' '}
                          <span className="font-normal text-[#64748B] dark:text-slate-500">(optional)</span>
                        </label>
                        <span className="text-xs tabular-nums text-[#64748B] dark:text-slate-500 mb-1.5">
                          {form.message.length}/{MESSAGE_MAX}
                        </span>
                      </div>
                      <textarea
                        id={`${uid}-message`}
                        rows={3}
                        maxLength={MESSAGE_MAX}
                        value={form.message}
                        onChange={setField('message')}
                        placeholder="A project idea or cloud topic you want to explore"
                        className={`${fieldClass} resize-none`}
                      />
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="flex items-start gap-2.5 p-3 text-sm bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400"
                      >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-[#00E582] text-[#151B24] font-semibold text-sm transition-all hover:brightness-95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E582] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1A222D]"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Sending…
                        </>
                      ) : (
                        'Send application'
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}