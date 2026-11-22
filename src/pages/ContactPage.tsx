import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Clock, Copy, Loader2, Mail, MapPin, Send } from 'lucide-react';
import { communityApi } from '../lib/api';
import { SeoHead } from '../components/SeoHead';

const INQUIRY_TYPES = [
  'Student / Prospective Member',
  'Guest Speaker / Workshop Mentor',
  'Hackathon Sponsorship',
  'Open-Source Collaboration',
];

const EMAIL = 'hello@stratusbuilders.org';
const HEADLINE = ['Let’s', 'build', 'something', 'together.'];

/* ---------- Input Field (Zero Text Overlap) ---------- */
function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  required = true,
  autoComplete,
  rows,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  autoComplete?: string;
  rows?: number;
}) {
  const [isFocused, setIsFocused] = useState(false);
  // Jab focus ho ya field me koi text ho tab label upar float karega
  const isFloating = isFocused || Boolean(value && value.trim().length > 0);

  return (
    <div className="group relative pt-6 pb-1">
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-0 select-none transition-all duration-200 origin-left ${
          isFloating
            ? 'top-0 text-xs font-medium text-[#008F52] dark:text-[#00E582]'
            : 'top-6 text-base text-[#64748B] dark:text-slate-400'
        }`}
      >
        {label}
      </label>

      {rows ? (
        <textarea
          id={id}
          rows={rows}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent border-0 border-b border-[#151B24]/20 dark:border-white/20 px-0 pb-2 pt-2 text-base text-[#151B24] dark:text-white focus:outline-none focus:ring-0 resize-none leading-relaxed transition-colors"
        />
      ) : (
        <input
          id={id}
          type={type}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent border-0 border-b border-[#151B24]/20 dark:border-white/20 px-0 pb-2 pt-2 text-base text-[#151B24] dark:text-white focus:outline-none focus:ring-0 transition-colors"
        />
      )}

      {/* Underline indicator on focus */}
      <span
        className={`pointer-events-none absolute bottom-1 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-[#00E582] to-[#008F52] transition-transform duration-300 ${
          isFocused ? 'scale-x-100' : 'scale-x-0'
        }`}
      />
    </div>
  );
}

export function ContactPage() {
  const reduce = useReducedMotion();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(INQUIRY_TYPES[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await communityApi.contact({ name, email, role, message });
      setSuccess(res.message);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard fallback */
    }
  };

  const infoCards = [
    {
      icon: Clock,
      title: 'Weekly lab hours',
      body: 'Every Thursday, 18:00 to 20:30, during academic semesters.',
    },
    {
      icon: MapPin,
      title: 'Campus lab',
      body: 'Indo Global Group of Colleges, Abhipur, Chandigarh, Punjab, India.',
    },
  ];

  const cardIn = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

  return (
    <>
      <SeoHead
        title="Contact AWS Student Builder Group | Punjab"
        description="Contact the AWS Student Builder Group in Punjab to join the community, propose a workshop or collaborate on a student event."
        canonicalPath="/contact"
      />

      {/* ================= HERO SECTION ================= */}
      <section className="relative bg-[#0F141B] pt-32 pb-16 sm:pt-36 sm:pb-20 text-white blueprint-grid border-b border-white/10 overflow-hidden">
        {/* Soft Vignette Overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#0F141B_95%)]"
        />

        {/* Floating Glowing Lights */}
        {!reduce && (
          <>
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#00E582]/15 blur-3xl"
              animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#2563EB]/15 blur-3xl"
              animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
              transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
            />
          </>
        )}

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 z-10">
          {/* Badge */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#00E582]/30 bg-[#00E582]/10 px-4 py-1.5 text-xs sm:text-sm text-[#7CFFC4]"
          >
            <span className="relative flex h-2 w-2">
              {!reduce && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00E582] opacity-75" />
              )}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00E582]" />
            </span>
            We reply within two working days
          </motion.p>

          {/* Clean Headline (No duplicate text) */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-tight sm:leading-tight">
            {HEADLINE.map((word, i) => (
              <span key={word} className="inline-block mr-2 sm:mr-3 last:mr-0">
                <motion.span
                  className={`inline-block ${
                    i === HEADLINE.length - 1 ? 'italic text-[#00E582]' : 'text-white'
                  }`}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mx-auto mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-slate-300"
          >
            Speak at a workshop, sponsor a hackathon track, or join our next builder cohort.
          </motion.p>
        </div>
      </section>

      {/* ================= CONTACT CONTENT (Natural layout, no clipping) ================= */}
      <section className="relative bg-[#F5F7F6] dark:bg-[#0B1017] py-14 sm:py-20">
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            
            {/* ---------- Info Column ---------- */}
            <motion.div
              className="flex flex-col gap-4 lg:col-span-5"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }}
            >
              {/* Email Card with Copy button */}
              <motion.div
                variants={cardIn}
                whileHover={reduce ? undefined : { y: -3 }}
                className="flex items-center rounded-xl border border-[#151B24]/10 bg-white p-5 text-[#151B24] shadow-md dark:border-white/10 dark:bg-[#1A222D] dark:text-white sm:p-6"
              >
                <div className="flex w-full items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#00E582] text-[#151B24]">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg font-semibold">Community desk</p>
                    <a
                      href={`mailto:${EMAIL}`}
                      className="block truncate text-sm text-[#475569] hover:text-[#008F52] dark:text-slate-300 dark:hover:text-[#00E582] focus:outline-none focus-visible:underline"
                    >
                      {EMAIL}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={copyEmail}
                    aria-label="Copy email address"
                    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#151B24]/15 text-[#475569] transition-colors hover:border-[#00E582] hover:text-[#008F52] dark:border-white/15 dark:text-slate-300 dark:hover:border-[#00E582] dark:hover:text-[#00E582] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E582]"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={copied ? 'ok' : 'copy'}
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        {copied ? <Check className="h-4 w-4 text-[#00E582]" /> : <Copy className="h-4 w-4" />}
                      </motion.span>
                    </AnimatePresence>
                  </button>
                </div>
              </motion.div>

              {infoCards.map(({ icon: Icon, title, body }) => (
                <motion.div
                  key={title}
                  variants={cardIn}
                  whileHover={reduce ? undefined : { y: -3 }}
                  className="flex items-center gap-4 rounded-xl border border-[#151B24]/10 bg-white p-5 shadow-md dark:border-white/10 dark:bg-[#151B24] sm:p-6"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#00E582]/15 text-[#008F52] dark:text-[#00E582]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-serif text-lg font-semibold text-[#151B24] dark:text-white">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[#475569] dark:text-slate-400">{body}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* ---------- Form Column ---------- */}
            <motion.div
              className="flex flex-col lg:col-span-7"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="relative flex flex-col overflow-hidden rounded-xl border border-[#151B24]/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#151B24] sm:p-8">
                {/* Accent Top Border */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00E582] via-[#008F52] to-[#2563EB]" />

                <AnimatePresence mode="wait">
                  {success ? (
                    <motion.div
                      key="success"
                      role="status"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex min-h-[360px] flex-col items-center justify-center space-y-5 text-center"
                    >
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#00E582]">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-10 w-10 text-[#151B24]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <motion.path
                            d="M5 12.5l4.5 4.5L19 7.5"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          />
                        </svg>
                      </div>
                      <h2 className="font-serif text-3xl font-semibold text-[#151B24] dark:text-white">
                        Message sent
                      </h2>
                      <p className="max-w-md leading-relaxed text-[#475569] dark:text-slate-300 text-sm">
                        {success}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSuccess('')}
                        className="mt-2 rounded-lg border border-[#151B24] px-6 py-2.5 text-sm font-semibold text-[#151B24] transition-colors hover:bg-[#151B24] hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-[#151B24]"
                      >
                        Send another message
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      onSubmit={handleSubmit}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col gap-6"
                    >
                      <div>
                        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#151B24] dark:text-white">
                          Send us a message
                        </h2>
                        <p className="mt-1 text-sm text-[#475569] dark:text-slate-400">
                          All fields are required.
                        </p>
                      </div>

                      <AnimatePresence>
                        {error && (
                          <motion.p
                            role="alert"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="rounded-md border-l-4 border-red-500 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400"
                          >
                            {error}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      {/* Inquiry Type Chips */}
                      <div role="radiogroup" aria-label="Inquiry type" className="flex flex-wrap gap-2">
                        {INQUIRY_TYPES.map((t) => {
                          const active = role === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setRole(t)}
                              className={`relative rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                                active
                                  ? 'text-[#151B24] font-semibold'
                                  : 'text-[#475569] hover:text-[#151B24] dark:text-slate-400 dark:hover:text-white'
                              }`}
                            >
                              {active && (
                                <motion.span
                                  layoutId="inquiry-pill"
                                  className="absolute inset-0 rounded-full bg-[#00E582]"
                                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                                />
                              )}
                              {!active && (
                                <span className="absolute inset-0 rounded-full border border-[#151B24]/15 dark:border-white/15" />
                              )}
                              <span className="relative z-10">{t}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Input fields */}
                      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                        <FormField
                          id="contact-name"
                          label="Your name"
                          autoComplete="name"
                          value={name}
                          onChange={setName}
                        />

                        <FormField
                          id="contact-email"
                          label="Email address"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={setEmail}
                        />
                      </div>

                      <FormField
                        id="contact-message"
                        label="How would you like to collaborate?"
                        rows={4}
                        value={message}
                        onChange={setMessage}
                      />

                      {/* Submit button */}
                      <motion.button
                        type="submit"
                        disabled={submitting}
                        whileHover={reduce || submitting ? undefined : { scale: 1.02 }}
                        whileTap={reduce || submitting ? undefined : { scale: 0.98 }}
                        className="relative inline-flex w-full sm:w-auto items-center justify-center gap-3 self-start rounded-lg bg-[#151B24] px-8 py-3.5 text-sm font-semibold text-white dark:bg-[#00E582] dark:text-[#151B24] transition-opacity disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                      >
                        <span>{submitting ? 'Sending...' : 'Send message'}</span>
                        {submitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </>
  );
}