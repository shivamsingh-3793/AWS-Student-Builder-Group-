import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, MapPin } from 'lucide-react';
import type { EventItem } from '../types';
import { ResilientImage } from './ResilientImage';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function EventCard({
  event,
  featured = false,
  index = 0,
}: {
  event: EventItem;
  featured?: boolean;
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      data-cursor="card"
      className={`group border border-[#151B24]/12 dark:border-white/12 bg-white dark:bg-[#1A222D] hover:border-[#00E582] transition-colors duration-200 overflow-hidden ${
        featured ? 'lg:col-span-2 grid grid-cols-1 lg:grid-cols-12 items-stretch' : 'flex flex-col'
      }`}
    >
      <Link
        to={`/events/${event.slug || event.id}`}
        className={`block overflow-hidden bg-[#151B24] relative ${
          featured ? 'lg:col-span-7 aspect-[16/9] lg:aspect-auto lg:min-h-[380px]' : 'aspect-[4/3]'
        }`}
      >
        <ResilientImage
          src={event.image_url}
          alt={event.title}
          fallbackTitle={event.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#151B24]/75 via-[#151B24]/15 to-transparent opacity-70 group-hover:opacity-45 transition-opacity duration-300"
        />
      </Link>

      <div
        className={`p-6 sm:p-8 flex flex-col justify-between ${
          featured ? 'lg:col-span-5' : 'flex-1'
        }`}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#008F52] dark:text-[#00E582]">
            <span>{formatDate(event.event_date)}</span>
            <span aria-hidden="true" className="text-slate-400">
              ·
            </span>
            <span>{event.type}</span>
            {event.featured && (
              <>
                <span aria-hidden="true" className="text-slate-400">
                  ·
                </span>
                <span className="uppercase tracking-wider">Featured</span>
              </>
            )}
          </div>

          <Link to={`/events/${event.slug || event.id}`} className="block mt-3">
            <h3
              className={`font-display font-bold tracking-tight text-[#151B24] dark:text-white group-hover:translate-x-1 transition-transform duration-200 ${
                featured ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
              }`}
            >
              {event.title}
            </h3>
          </Link>

          <p className="mt-3 text-sm text-[#475569] dark:text-slate-400 leading-relaxed line-clamp-3">
            {event.description}
          </p>
        </div>

        <div className="mt-6 pt-5 border-t border-[#151B24]/10 dark:border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-[#475569] dark:text-slate-400 min-w-0">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#008F52] dark:text-[#00E582]" />
            <span className="truncate">{event.location}</span>
          </div>

          <Link
            to={`/events/${event.slug || event.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#151B24] dark:text-white group-hover:text-[#008F52] dark:group-hover:text-[#00E582] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Explore</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 group-hover:-rotate-12" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
