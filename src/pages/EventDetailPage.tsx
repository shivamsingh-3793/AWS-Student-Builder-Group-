import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, CheckCircle2, MapPin } from 'lucide-react';
import { communityApi, eventsApi } from '../lib/api';
import type { EventItem } from '../types';
import { SeoHead } from '../components/SeoHead';
import { ResilientImage } from '../components/ResilientImage';
import { EventCard } from '../components/EventCard';
import { RichContent } from '../components/RichContent';
import { ErrorBanner } from '../components/StateFeedback';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [related, setRelated] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [rsvpError, setRsvpError] = useState('');

  const loadEvent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await eventsApi.get(id);
      setEvent(res.event);
      setRelated(res.related);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load event details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEvent();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadEvent]);

  const handleRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setRsvpError('');
    setSubmitting(true);
    try {
      const res = await communityApi.join({
        name,
        email,
        role: 'Event Attendee',
        track: event.type,
        event_id: event.id,
      });
      setRsvpMessage(res.message);
      setName('');
      setEmail('');
    } catch (err) {
      setRsvpError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="h-8 w-40 bg-[#151B24]/10 dark:bg-white/10 animate-pulse" />
        <div className="h-14 w-3/4 bg-[#151B24]/10 dark:bg-white/10 animate-pulse" />
        <div className="aspect-[16/9] bg-[#151B24]/10 dark:bg-white/10 animate-pulse" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="pt-32 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#008F52] dark:text-[#00E582]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>
        <ErrorBanner message={error || 'Event not found.'} onRetry={loadEvent} />
      </div>
    );
  }

  return (
    <>
      <SeoHead title={event.title} description={event.description.slice(0, 155)} />

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-28 pb-24 bg-[#F5F7F6] dark:bg-[#151B24]"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#475569] dark:text-slate-400 hover:text-[#008F52] dark:hover:text-[#00E582] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            All Events
          </Link>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-[#008F52] dark:text-[#00E582]">
            <span>{event.type}</span>
            <span aria-hidden="true" className="text-slate-400">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {event.event_date}
            </span>
            <span aria-hidden="true" className="text-slate-400">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#475569] dark:text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-[#008F52] dark:text-[#00E582]" />
              {event.location}
            </span>
          </div>

          <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#151B24] dark:text-white leading-[1.04] text-balance">
            {event.title}
          </h1>

          <div className="mt-8 aspect-[16/9] border border-[#151B24]/15 dark:border-white/15 bg-[#151B24] overflow-hidden">
            <ResilientImage
              src={event.image_url}
              alt={event.title}
              fallbackTitle={event.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7">
              <RichContent content={event.description} />
            </div>

            <aside className="lg:col-span-5">
              <div className="border border-[#151B24]/15 dark:border-white/15 bg-white dark:bg-[#1A222D] p-6 sm:p-8 sticky top-24">
                <p className="font-mono text-xs uppercase tracking-widest text-[#008F52] dark:text-[#00E582]">
                  Reserve Your Seat
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-[#151B24] dark:text-white">
                  Event Registration
                </h2>
                <p className="mt-2 text-sm text-[#475569] dark:text-slate-400">
                  Register to receive sandbox workshop access and pre-session setup instructions.
                </p>

                {rsvpMessage ? (
                  <div className="mt-6 p-5 border border-[#00E582]/40 bg-[#00E582]/10 space-y-2">
                    <div className="flex items-center gap-2 text-[#008F52] dark:text-[#00E582] font-semibold">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Registration Confirmed</span>
                    </div>
                    <p className="text-sm text-[#151B24] dark:text-slate-200">{rsvpMessage}</p>
                  </div>
                ) : (
                  <form onSubmit={handleRsvp} className="mt-6 space-y-4">
                    {rsvpError && (
                      <p className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-500">
                        {rsvpError}
                      </p>
                    )}
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-[#475569] dark:text-slate-400 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jordan Kim"
                        className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-[#151B24] dark:text-white text-sm focus:outline-none focus:border-[#00E582]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-[#475569] dark:text-slate-400 mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jordan@university.edu"
                        className="w-full px-3.5 py-2.5 bg-[#F5F7F6] dark:bg-[#151B24] border border-[#151B24]/15 dark:border-white/15 text-[#151B24] dark:text-white text-sm focus:outline-none focus:border-[#00E582]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 bg-[#00E582] text-[#151B24] font-semibold text-sm hover:brightness-95 transition-all disabled:opacity-60"
                    >
                      {submitting ? 'Confirming...' : 'Register for Event'}
                    </button>
                  </form>
                )}
              </div>
            </aside>
          </div>

          {related.length > 0 && (
            <div className="mt-24 pt-12 border-t border-[#151B24]/15 dark:border-white/15">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#151B24] dark:text-white mb-8">
                Related Upcoming Events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {related.slice(0, 2).map((rel, idx) => (
                  <EventCard key={rel.id} event={rel} index={idx} />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.article>
    </>
  );
}
