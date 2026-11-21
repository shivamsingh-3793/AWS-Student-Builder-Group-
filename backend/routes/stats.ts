import { Router } from 'express';
import { asyncRoute, supabase } from '../supabase.ts';
import { optionalAuth, requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { adminMutationRateLimit } from '../middleware/rateLimit.ts';
import { writeAdminAudit } from '../audit.ts';
import { allowedKeys, bodyObject, InputValidationError, safeInteger } from '../validation.ts';

const router = Router();

interface StatsRow {
  id: number;
  builders_count: number;
  events_count: number;
  projects_count: number;
  workshops_count: number;
  updated_at: string;
}

router.get('/', optionalAuth, asyncRoute(async (req, res) => {
  if (Object.keys(req.query).length > 0) {
    res.status(400).json({ error: 'Unexpected query parameter.' });
    return;
  }
  const { data: stats, error: statsError } = await supabase
    .from('community_stats')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (statsError) throw new Error('Unable to load community statistics.');

  const community = stats
    ? {
        builders_count: stats.builders_count,
        events_count: stats.events_count,
        projects_count: stats.projects_count,
        workshops_count: stats.workshops_count,
      }
    : null;
  if (!(req as AuthenticatedRequest).user) {
    res.json({ community });
    return;
  }

  const [
    { count: totalEvents, error: eventsError },
    { count: publishedEvents, error: eventRowsError },
    { count: totalPosts, error: postsError },
    { count: publishedPosts, error: postRowsError },
    { count: totalProjects, error: projectsError },
    { count: publishedProjects, error: projectRowsError },
    { count: totalGallery, error: galleryError },
    { count: totalSubmissions, error: submissionsError },
  ] = await Promise.all([
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('published', true),
    supabase.from('posts').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('published', true),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('published', true),
    supabase.from('gallery').select('id', { count: 'exact', head: true }),
    supabase.from('submissions').select('id', { count: 'exact', head: true }),
  ]);
  if ([eventsError, eventRowsError, postsError, postRowsError, projectsError, projectRowsError, galleryError, submissionsError].some(Boolean)) {
    throw new Error('Unable to load CMS statistics.');
  }

  const liveEvents = publishedEvents || 0;
  const livePosts = publishedPosts || 0;
  const liveProjects = publishedProjects || 0;
  res.json({
    community,
    cms: {
      totalEvents: totalEvents || 0,
      publishedEvents: liveEvents,
      draftEvents: (totalEvents || 0) - liveEvents,
      totalPosts: totalPosts || 0,
      publishedPosts: livePosts,
      draftPosts: (totalPosts || 0) - livePosts,
      totalProjects: totalProjects || 0,
      publishedProjects: liveProjects,
      totalGallery: totalGallery || 0,
      totalSubmissions: totalSubmissions || 0,
    },
  });
}));

router.put('/', requireAuth, adminMutationRateLimit, asyncRoute(async (req, res) => {
  const body = bodyObject(req.body);
  allowedKeys(body, ['builders_count', 'events_count', 'projects_count', 'workshops_count']);
  const keys = ['builders_count', 'events_count', 'projects_count', 'workshops_count'] as const;
  const values = keys.map((key) => {
    if (typeof body[key] !== 'number') throw new InputValidationError(`${key} must be a number.`);
    return safeInteger(body[key], key);
  });
  const [builders, events, projects, workshops] = values;
  const { data: updated, error } = await supabase
    .from('community_stats')
    .upsert({
      id: 1,
      builders_count: builders,
      events_count: events,
      projects_count: projects,
      workshops_count: workshops,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select('*')
    .single();
  if (error) throw new Error('Unable to update community statistics.');
  if (!updated) throw new Error('The community statistics row is missing.');
  await writeAdminAudit(req as AuthenticatedRequest, 'stats.update', 'community_stats', 1);
  res.json({ community: updated as StatsRow, message: 'Community statistics updated successfully.' });
}));

export default router;
