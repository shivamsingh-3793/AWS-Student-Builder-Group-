import { useId, useState } from 'react';
import { Github, Instagram, Linkedin, UserRound } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { resolveMediaUrl } from '../lib/api';
import type { TeamMember } from '../types';
import { TEAM_GROUPS } from '../lib/team';

export function TeamMemberPhoto({
  member,
  className = '',
}: {
  member: TeamMember;
  className?: string;
}) {
  const rawId = useId();
  const photoGridId = `aws-photo-grid-${rawId.replace(/:/g, '')}`;
  const photoUrl = resolveMediaUrl(member.photo_url);
  const [failedUrl, setFailedUrl] = useState('');
  const showFallback = !photoUrl || failedUrl === photoUrl;

  return (
    <div
      role={showFallback ? 'img' : undefined}
      aria-label={showFallback ? `Photo unavailable for ${member.name}` : undefined}
      className={`relative grid place-items-center overflow-hidden bg-gradient-to-br from-[#0E131A] via-[#151B24] to-[#1F2937] text-[#00E582] ${className}`}
    >
      {/* AWS Architecture Blueprint Grid in Photo Background */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full text-[#00E582]/25 opacity-70"
        style={{
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 90%)',
        }}
      >
        <defs>
          <pattern id={photoGridId} width="24" height="24" patternUnits="userSpaceOnUse">
            {/* Grid Line */}
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
              strokeDasharray="2 3"
            />
            {/* Crosshair Node point */}
            <path d="M 0 -2.5 L 0 2.5 M -2.5 0 L 2.5 0" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${photoGridId})`} />
      </svg>

      {/* Ambient Cloud Node Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,130,0.18),transparent_70%)]"
      />

      {showFallback ? (
        <div className="relative flex flex-col items-center justify-center gap-2.5">
          {/* Tech AWS Node Avatar Frame */}
          <div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-[#00E582]/40 bg-[#151B24]/90 shadow-[0_0_30px_rgba(0,229,130,0.25)] backdrop-blur-sm">
            <UserRound className="h-8 w-8 text-[#00E582]/90" aria-hidden="true" />
            {/* Technical Node Pins */}
            <span className="absolute -top-1 -left-1 h-2 w-2 rounded-full border border-[#00E582] bg-[#151B24]" />
            <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full border border-[#00E582] bg-[#151B24]" />
          </div>
          <span className="font-mono text-[9px] tracking-widest text-[#00E582]/70 uppercase">
            AWS::Builder
          </span>
        </div>
      ) : (
        <img
          src={photoUrl}
          alt={member.name}
          loading="lazy"
          onError={() => setFailedUrl(photoUrl)}
          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
      )}
    </div>
  );
}

export function TeamProfileCard({
  member,
  featured = false,
  index = 0,
}: {
  member: TeamMember;
  featured?: boolean;
  index?: number;
}) {
  const rawId = useId();
  const cardGridId = `aws-card-grid-${rawId.replace(/:/g, '')}`;
  const reduce = useReducedMotion();
  const categoryLabel = TEAM_GROUPS.find((group) => group.category === member.category)?.label;
  const socialLinks = [
    { label: 'GitHub', href: member.github, icon: Github },
    { label: 'LinkedIn', href: member.linkedin, icon: Linkedin },
    { label: 'Instagram', href: member.instagram, icon: Instagram },
  ].filter((link) => link.href);

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={reduce ? undefined : { y: -4 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className={`group relative overflow-hidden rounded-xl border border-[#151B24]/10 bg-white shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-[#00E582]/60 hover:shadow-[0_24px_50px_-26px_rgba(0,229,130,0.35)] dark:border-white/10 dark:bg-[#1A222D] ${
        featured ? 'grid md:grid-cols-[minmax(0,320px)_1fr]' : 'flex flex-col'
      }`}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full text-slate-900/[0.05] dark:text-[#00E582]/[0.09] transition-opacity duration-300 group-hover:opacity-100"
        style={{
          maskImage: 'radial-gradient(ellipse at top right, black 35%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at top right, black 35%, transparent 80%)',
        }}
      >
        <defs>
          <pattern id={cardGridId} width="28" height="28" patternUnits="userSpaceOnUse">
            {/* Grid Square */}
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <path d="M 0 -2 L 0 2 M -2 0 L 2 0" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${cardGridId})`} />
      </svg>


      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(0,229,130,0.16),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      <TeamMemberPhoto
        member={member}
        className={featured ? 'aspect-[4/3] md:aspect-auto md:min-h-[280px]' : 'aspect-square'}
      />

      <div className={`relative z-10 flex flex-1 flex-col ${featured ? 'justify-center p-6 sm:p-8 lg:p-10' : 'p-5'}`}>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-4 right-4 font-mono text-[9px] font-semibold tracking-wider text-slate-300 dark:text-slate-600 select-none"
        >
          AWS::MEMBER
        </span>

        {categoryLabel && (
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[#008F52] dark:text-[#00E582]">
            {categoryLabel}
          </p>
        )}
        <h3 className="font-display text-xl font-bold text-[#151B24] dark:text-white sm:text-2xl">
          {member.name}
        </h3>
        <p className="mt-1 font-serif text-sm italic text-[#008F52] dark:text-[#00E582]">
          {member.title}
        </p>
        <span
          aria-hidden="true"
          className="my-4 block h-px w-10 bg-gradient-to-r from-[#00E582] to-transparent transition-all duration-500 group-hover:w-24"
        />
        {member.bio && (
          <p className="text-sm leading-relaxed text-[#475569] dark:text-slate-400">{member.bio}</p>
        )}
        {socialLinks.length > 0 && (
          <div className="mt-5 flex items-center gap-3">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on ${label}`}
                className="rounded-sm text-[#475569] transition-colors hover:text-[#008F52] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E582] dark:text-slate-400 dark:hover:text-[#00E582]"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}