import { useCallback, useEffect, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { eventsApi, galleryApi, postsApi, projectsApi, statsApi } from '../lib/api';
import type { CommunityStats, EventItem, GalleryItem, PostItem, ProjectItem } from '../types';
import { SeoHead } from '../components/SeoHead';
import { Hero } from '../components/Hero';
import { CommunityIntro } from '../components/CommunityIntro';
import { ProcessTimeline } from '../components/ProcessTimeline';
import { SectionHeading } from '../components/SectionHeading';
import { EventCard } from '../components/EventCard';
import { ProjectCard } from '../components/ProjectCard';
import { PostCard } from '../components/PostCard';
import { GalleryGrid } from '../components/GalleryGrid';
import { WhyJoinSection } from '../components/WhyJoinSection';
import { ExperienceMarquee } from '../components/ExperienceMarquee';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { TeamSection } from '../components/TeamSection';
import { FinalCTA } from '../components/FinalCTA';
import { CertificationSection } from '../components/CertificationSection';
import { EmptyState, ErrorBanner, LoadingGrid } from '../components/StateFeedback';

/* ------------------------------------------------------------------ */
/* Small building blocks used only on this page                        */
/* ------------------------------------------------------------------ */

/**
 * Hover effect for any grid of cards. It only touches box-shadow and filter,
 * so it cannot clash with the cards' own layout or motion transforms:
 * the hovered card gets a green glow and its neighbours dim slightly.
 */
const cardHover =
  'group/grid [&>*]:rounded-lg [&>*]:overflow-hidden [&>*]:transition-[box-shadow,filter] [&>*]:duration-300 ' +
  '[&>*:hover]:shadow-[0_28px_60px_-22px_rgba(0,229,130,0.45)] ' +
  'group-hover/grid:[&>*:not(:hover)]:brightness-95 dark:group-hover/grid:[&>*:not(:hover)]:brightness-75';

/** Fades and lifts its children into view the first time they are scrolled to. */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** 'lines' = faint blueprint grid (matches the hero), 'dots' = the earlier dot pattern. */
const BACKDROP_GRID: 'lines' | 'dots' = 'lines';

const gridStyle =
  BACKDROP_GRID === 'lines'
    ? {
        backgroundImage:
          'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
        backgroundSize: '56px 56px',
      }
    : {
        backgroundImage: 'radial-gradient(currentColor 1.2px, transparent 1.2px)',
        backgroundSize: '30px 30px',
      };
const gridTravel = BACKDROP_GRID === 'lines' ? '56px 56px' : '30px 30px';

/** Slow-moving grid plus two drifting colour glows, rendered behind a section. */
function Backdrop({ side = 'right' }: { side?: 'left' | 'right' }) {
  const reduce = useReducedMotion();
  const flip = side === 'left';
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <motion.div
        className="absolute inset-0 text-[#151B24]/[0.06] dark:text-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,black_15%,transparent_70%)]"
        style={gridStyle}
        animate={reduce ? undefined : { backgroundPosition: ['0px 0px', gridTravel] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className={`absolute -top-24 h-[420px] w-[420px] rounded-full bg-[#00E582]/15 blur-[110px] dark:bg-[#00E582]/10 ${
          flip ? '-left-24' : '-right-24'
        }`}
        animate={reduce ? undefined : { x: [0, flip ? 50 : -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={`absolute -bottom-32 h-[380px] w-[380px] rounded-full bg-[#3B82F6]/15 blur-[120px] dark:bg-[#3B82F6]/10 ${
          flip ? '-right-20' : '-left-20'
        }`}
        animate={reduce ? undefined : { x: [0, flip ? -40 : 40, 0], y: [0, -36, 0] }}
        transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function Section({
  className,
  side,
  children,
}: {
  className: string;
  side?: 'left' | 'right';
  children: ReactNode;
}) {
  return (
    <section
      className={`relative overflow-hidden border-b border-[#151B24]/10 py-24 dark:border-white/10 sm:py-32 ${className}`}
    >
      <Backdrop side={side} />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

/** Pill link whose green fill sweeps in from the left on hover. */
function ArrowLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="group relative inline-flex shrink-0 items-center gap-2 overflow-hidden whitespace-nowrap rounded-lg border border-[#151B24]/20 px-5 py-2.5 text-sm font-semibold text-[#151B24] transition-colors duration-300 hover:border-[#00E582] hover:text-[#151B24] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E582] focus-visible:ring-offset-2 dark:border-white/20 dark:text-white dark:hover:text-[#151B24]"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -translate-x-full bg-[#00E582] transition-transform duration-300 ease-out group-hover:translate-x-0"
      />
      <span className="relative">{label}</span>
      <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

function SectionHeader({
  to,
  linkLabel,
  ...heading
}: ComponentProps<typeof SectionHeading> & { to: string; linkLabel: string }) {
  return (
    <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <SectionHeading {...heading} />
      <ArrowLink to={to} label={linkLabel} />
    </Reveal>
  );
}

/** Thin progress line at the very top of the viewport that fills as you scroll. */
function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });
  if (reduce) return null;
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX, originX: 0 }}
      className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-gradient-to-r from-[#00E582] to-[#3B82F6]"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function HomePage({ onOpenJoin }: { onOpenJoin: () => void }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHomeData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [evRes, prRes, poRes, gaRes, stRes] = await Promise.all([
        eventsApi.list(),
        projectsApi.list(),
        postsApi.list(),
        galleryApi.list(),
        statsApi.get(),
      ]);
      setEvents(evRes.events);
      setProjects(prRes.projects);
      setPosts(poRes.posts);
      setGallery(gaRes.gallery);
      if (stRes.community) {
        setStats(stRes.community);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load community data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const featuredEvent = events.find((e) => e.featured) || events[0];
  const secondaryEvents = events.filter((e) => e.id !== featuredEvent?.id).slice(0, 2);

  return (
    <>
      <SeoHead
        title="Learn. Build. Innovate."
        description="AWS Student Builder Group is an AWS student and cloud engineering community learning distributed systems, serverless architecture, and DevOps by building real projects."
      />

      <ScrollProgress />

      <Hero onOpenJoin={onOpenJoin} stats={stats} />
      <CommunityIntro />
      <ProcessTimeline />

      {/* Events */}
      <Section className="bg-[#F5F7F6] dark:bg-[#151B24]" side="right">
        <SectionHeader
          index="03. Calendar"
          title="Events. Challenges. Workshops."
          accentWord="Challenges."
          subtitle="Live architecture sprints, deep-dive cloud labs, and regional engineering summits."
          to="/events"
          linkLabel="All Events"
        />

        <div className="mt-12">
          {loading ? (
            <LoadingGrid count={3} />
          ) : error ? (
            <ErrorBanner message={error} onRetry={loadHomeData} />
          ) : events.length === 0 ? (
            <EmptyState
              title="No upcoming events"
              description="New cloud workshops and community summits are announced here regularly."
            />
          ) : (
            <Reveal delay={0.1}>
              <div className={`grid grid-cols-1 gap-6 lg:grid-cols-2 ${cardHover}`}>
                {featuredEvent && <EventCard event={featuredEvent} featured index={0} />}
                {secondaryEvents.map((ev, i) => (
                  <EventCard key={ev.id} event={ev} index={i + 1} />
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </Section>

      {/* Projects */}
      <Section className="bg-white dark:bg-[#1A222D]" side="left">
        <SectionHeader
          index="04. Open Source"
          title="Built by builders."
          accentWord="builders."
          subtitle="Production cloud tooling, telemetry systems, and IaC frameworks engineered by student squads."
          to="/projects"
          linkLabel="Explore Projects"
        />

        <div className="mt-12">
          {loading ? (
            <LoadingGrid count={3} />
          ) : error ? (
            <ErrorBanner message={error} onRetry={loadHomeData} />
          ) : projects.length === 0 ? (
            <EmptyState
              title="No published projects yet"
              description="Community projects appear here as soon as squads ship their builds."
            />
          ) : (
            <Reveal delay={0.1}>
              <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${cardHover}`}>
                {projects.slice(0, 3).map((project, idx) => (
                  <ProjectCard key={project.id} project={project} featured={idx === 0} index={idx} />
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </Section>

      {/* Engineering journal */}
      <Section className="bg-[#F5F7F6] dark:bg-[#151B24]" side="right">
        <SectionHeader
          index="05. Engineering Journal"
          title="From the builders."
          accentWord="builders."
          subtitle="Architecture post-mortems, serverless benchmarks, and lessons from running campus infrastructure."
          to="/blog"
          linkLabel="Read Journal"
        />

        <div className="mt-12 space-y-6">
          {loading ? (
            <LoadingGrid count={3} />
          ) : error ? (
            <ErrorBanner message={error} onRetry={loadHomeData} />
          ) : posts.length === 0 ? (
            <EmptyState
              title="No articles published yet"
              description="Engineering guides and community stories will appear here soon."
            />
          ) : (
            <>
              <Reveal delay={0.1} className={cardHover}>
                <PostCard post={posts[0]} editorialLead index={0} />
              </Reveal>
              {posts.length > 1 && (
                <Reveal delay={0.15}>
                  <div className={`grid grid-cols-1 gap-8 pt-4 md:grid-cols-2 ${cardHover}`}>
                    {posts.slice(1, 3).map((post, idx) => (
                      <PostCard key={post.id} post={post} index={idx + 1} />
                    ))}
                  </div>
                </Reveal>
              )}
            </>
          )}
        </div>
      </Section>

      <WhyJoinSection />
      <ExperienceMarquee />

      {/* Gallery */}
      <Section className="bg-[#F5F7F6] dark:bg-[#151B24]" side="left">
        <div className="mb-12">
          <SectionHeader
            index="06. Visual Archive"
            title="Community in action."
            accentWord="action."
            subtitle="Moments from overnight build sprints, whiteboard architecture clinics, and summit keynotes."
            to="/gallery"
            linkLabel="Full Gallery"
          />
        </div>

        {loading ? (
          <LoadingGrid count={3} />
        ) : error ? (
          <ErrorBanner message={error} onRetry={loadHomeData} />
        ) : gallery.length === 0 ? (
          <EmptyState
            title="Gallery is currently empty"
            description="Photos from upcoming workshops and hackathons will be uploaded here."
          />
        ) : (
          <Reveal
            delay={0.1}
            className="[&_img]:rounded-lg [&_img]:transition-transform [&_img]:duration-700 [&_img:hover]:scale-[1.05]"
          >
            <GalleryGrid items={gallery.slice(0, 6)} />
          </Reveal>
        )}
      </Section>

      <CertificationSection />
      <TestimonialsSection />
      <TeamSection />
      <FinalCTA onOpenJoin={onOpenJoin} />
    </>
  );
}