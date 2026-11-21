import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  CalendarDays,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import { BrandLogo } from './Navbar';
import { TeamMemberPhoto } from './TeamProfileCard';
import { useTeamMembers } from '../hooks/useTeamMembers';

type ExploreLink = { label: string; route: string } | { label: string; href: string };

const EXPLORE_LINKS: ExploreLink[] = [
  { label: 'About Us', route: '/about' },
  { label: 'Blogs', route: '/blog' },
  { label: 'Upcoming Events', route: '/events' },
  { label: 'AWS Builder Center', href: '#' },
  { label: 'Brand Assets', href: '#' },
  { label: 'Support', href: '#' },
];

const SOCIALS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/aws-student-builder-group-at-igc', icon: Linkedin },
  { label: 'Instagram', href: 'https://www.instagram.com/aws.sbg.igc?lqvp=MTRsMDl1bXYxbW00dQ==', icon: Instagram },
  { label: 'WhatsApp', href: 'https://chat.whatsapp.com/DZZ5x5uiPVpIsdcLy6NIv8', icon: MessageCircle },
  { label: 'Meetup', href: 'https://www.meetup.com/aws-sbg-at-indo-global-group-of-colleges', icon: CalendarDays },
];

const CONTACT_DETAILS = [
  { label: 'Official AWS SBG Email', value: 'shivamkumar.devcs@gmail.com', icon: Mail },
  { label: 'College Address', value: 'Indo Global group of colleges abhipur, punjab india', icon: MapPin },
];

export function Footer() {
  const { members, loading, error } = useTeamMembers();
  const groupLeader = members.find((member) => member.category === 'leader');

  return (
    <footer className="border-t border-white/10 bg-[#151B24] text-white">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pt-14 lg:px-8">
        <div className="grid grid-cols-1 gap-9 border-b border-white/10 pb-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
          <div className="space-y-4 sm:col-span-2 lg:col-span-5 xl:col-span-4">
            <Link to="/" className="inline-block">
              <BrandLogo inverted />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-slate-400">
              An independent student and developer collective exploring AWS architecture,
              serverless engineering, and distributed systems by building real software together.
            </p>
          </div>

          <div className="lg:col-span-2">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-[#00E582]">Explore</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm sm:grid-cols-1">
              {EXPLORE_LINKS.map((item) => (
                <li key={item.label}>
                  {'route' in item ? (
                    <Link
                      to={item.route}
                      className="text-slate-300 transition-colors hover:text-[#00E582] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E582]"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="text-slate-300 transition-colors hover:text-[#00E582] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E582]"
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-[#00E582]">
              Founder &amp; Group Lead
            </p>
            {groupLeader ? (
              <div className="flex items-start gap-4 lg:flex-col lg:gap-3 xl:flex-row xl:gap-4">
                <TeamMemberPhoto
                  member={groupLeader}
                  className="h-16 w-16 shrink-0 rounded-xl border border-white/10"
                />
                <div className="min-w-0">
                  <p className="font-serif text-base font-semibold text-white">{groupLeader.name}</p>
                  <p className="mt-1 text-sm text-[#00E582]">{groupLeader.title}</p>
                  {groupLeader.bio && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{groupLeader.bio}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-slate-400" role={error ? 'alert' : undefined}>
                {loading
                  ? 'Loading group leader...'
                  : error
                    ? `Unable to load group leader: ${error}`
                    : 'No active group leader is listed.'}
              </p>
            )}
          </div>

          <div className="lg:col-span-2 xl:col-span-3">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-[#00E582]">Contact Us</p>
            <ul className="space-y-4">
              {CONTACT_DETAILS.map(({ label, value, icon: Icon }) => (
                <li key={label} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#00E582]" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="mt-1 break-words text-sm text-slate-200">{value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-b border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs uppercase tracking-widest text-[#00E582]">Connect</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
            {SOCIALS.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href === '#' ? undefined : '_blank'}
                  rel={href === '#' ? undefined : 'noreferrer'}
                  aria-label={label}
                  className="inline-flex items-center gap-2 text-slate-300 transition-colors hover:text-[#00E582] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E582]"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{label}</span>
                  {href !== '#' && <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="border-b border-white/10 py-10 sm:py-12"
        >
          <p className="font-display text-4xl font-extrabold leading-none tracking-tight text-white sm:text-6xl lg:text-7xl">
            LEARN. <span className="text-[#00E582]">BUILD.</span> INNOVATE.
          </p>
        </motion.div>

        <div className="flex flex-col items-start justify-between gap-3 pt-7 text-xs text-slate-400 sm:flex-row sm:items-center">
          <p>© 2026 AWS Student Builder Group. Indo Global Group of Colleges.</p>
          <p>Designed for builders shipping real infrastructure.</p>
        </div>
      </div>
    </footer>
  );
}
