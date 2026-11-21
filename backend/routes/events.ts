import { Router } from 'express';
import { asyncRoute, supabase } from '../supabase.ts';
import { slugify } from '../slugify.ts';
import { optionalAuth, requireAuthForAllQuery, requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { adminMutationRateLimit } from '../middleware/rateLimit.ts';
import { writeAdminAudit } from '../audit.ts';
import { allowedKeys, bodyObject, booleanField, dateField, InputValidationError, optionalBoolean, optionalText, positiveId, safeUrl, textField } from '../validation.ts';

const router = Router();

interface EventRow {
  id: number;
  title: string;
  slug: string;
  description: string;
  event_date: string;
  location: string;
  type: string;
  image_url: string;
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

router.get('/', optionalAuth, requireAuthForAllQuery, asyncRoute(async (req, res) => {
  if (Object.keys(req.query).some((key) => key !== 'all')) {
    res.status(400).json({ error: 'Unexpected query parameter.' });
    return;
  }
  if (req.query.all !== undefined && req.query.all !== 'true' && req.query.all !== 'false') {
    res.status(400).json({ error: 'all must be true or false.' });
    return;
  }
  const isAdmin = req.query.all === 'true' && Boolean((req as AuthenticatedRequest).user);
  let query = supabase.from('events').select('*');
  if (!isAdmin) query = query.eq('published', true);
  query = isAdmin
    ? query.order('featured', { ascending: false }).order('event_date', { ascending: false }).order('id', { ascending: false })
    : query.order('featured', { ascending: false }).order('event_date', { ascending: true }).order('id', { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error('Unable to load events.');
  res.json({ events: (data as EventRow[]).map((row) => ({ ...row, featured: Boolean(row.featured), published: Boolean(row.published) })) });
}));

router.get('/:idOrSlug', optionalAuth, asyncRoute(async (req, res) => {
  if (Object.keys(req.query).length > 0) {
    res.status(400).json({ error: 'Unexpected query parameter.' });
    return;
  }
  const param = req.params.idOrSlug;
  const isAdmin = Boolean((req as AuthenticatedRequest).user);
  const numericId = /^\d+$/.test(param) ? positiveId(param) : null;
  if (/^\d+$/.test(param) && !numericId) {
    res.status(400).json({ error: 'Invalid event ID.' });
    return;
  }
  if (!numericId && !/^[a-z0-9][a-z0-9-]{0,199}$/.test(param)) {
    res.status(400).json({ error: 'Invalid event slug.' });
    return;
  }
  const column = numericId ? 'id' : 'slug';
  const value = numericId || param;
  const { data: row, error } = await supabase.from('events').select('*').eq(column, value).maybeSingle();

  if (error) throw new Error('Unable to load the event.');
  if (!row || (!row.published && !isAdmin)) {
    res.status(404).json({ error: 'Event not found.' });
    return;
  }

  const { data: related, error: relatedError } = await supabase
    .from('events')
    .select('*')
    .eq('published', true)
    .neq('id', row.id)
    .order('event_date', { ascending: true })
    .limit(3);
  if (relatedError) throw new Error('Unable to load related events.');

  res.json({
    event: { ...row, featured: Boolean(row.featured), published: Boolean(row.published) },
    related: (related as EventRow[]).map((item) => ({
      ...item,
      featured: Boolean(item.featured),
      published: Boolean(item.published),
    })),
  });
}));

router.post('/', requireAuth, adminMutationRateLimit, asyncRoute(async (req, res) => {
  const body = bodyObject(req.body);
  allowedKeys(body, ['title', 'description', 'event_date', 'location', 'type', 'image_url', 'featured', 'published']);
  const title = textField(body.title, 'title', 200, { required: true });
  const description = textField(body.description, 'description', 20000, { required: true });
  const event_date = dateField(body.event_date, 'event_date');
  const location = textField(body.location, 'location', 200, { required: true });
  const type = textField(body.type, 'type', 80, { required: true });
  const image_url = safeUrl(body.image_url ?? '', 'image_url', { image: true, allowRelative: true });
  const featured = body.featured === undefined ? false : booleanField(body.featured, 'featured');
  const published = body.published === undefined ? false : booleanField(body.published, 'published');

  const baseSlug = slugify(title);
  let slug = baseSlug || `event-${Date.now()}`;
  const { data: existing, error: slugError } = await supabase
    .from('events')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (slugError) throw new Error('Unable to verify event slug.');
  if (existing) slug = `${slug}-${Date.now().toString().slice(-4)}`;

  if (featured) {
    const { error } = await supabase.from('events').update({ featured: false }).neq('id', 0);
    if (error) throw new Error('Unable to update featured event.');
  }

  const { data: created, error } = await supabase
    .from('events')
    .insert({
      title: title.trim(),
      slug,
      description: description.trim(),
      event_date: event_date.trim(),
      location: location.trim(),
      type: type.trim(),
      image_url,
      featured,
      published,
    })
    .select('*')
    .single();
  if (error) throw new Error('Unable to create event.');

  await writeAdminAudit(req as AuthenticatedRequest, 'event.create', 'event', created.id);
  res.status(201).json({
    event: { ...created, featured: Boolean(created.featured), published: Boolean(created.published) },
    message: 'Event created successfully.',
  });
}));

router.put('/:id', requireAuth, adminMutationRateLimit, asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id);
  if (!id) throw new InputValidationError('Invalid event ID.');
  const body = bodyObject(req.body);
  allowedKeys(body, ['title', 'description', 'event_date', 'location', 'type', 'image_url', 'featured', 'published']);
  const { data: existing, error: fetchError } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
  if (fetchError) throw new Error('Unable to load event for update.');
  if (!existing) {
    res.status(404).json({ error: 'Event not found.' });
    return;
  }

  const next = {
    title: optionalText(body, 'title', 200, existing.title),
    description: optionalText(body, 'description', 20000, existing.description),
    event_date: body.event_date === undefined ? existing.event_date : dateField(body.event_date, 'event_date'),
    location: optionalText(body, 'location', 200, existing.location),
    type: optionalText(body, 'type', 80, existing.type),
    image_url: body.image_url === undefined
      ? existing.image_url
      : safeUrl(body.image_url, 'image_url', { image: true, allowRelative: true }),
    featured: optionalBoolean(body, 'featured', Boolean(existing.featured)),
    published: optionalBoolean(body, 'published', Boolean(existing.published)),
    updated_at: new Date().toISOString(),
  };
  if (!next.title || !next.description || !next.event_date || !next.location || !next.type) {
    res.status(400).json({ error: 'Required event fields cannot be empty.' });
    return;
  }

  if (next.featured) {
    const { error } = await supabase.from('events').update({ featured: false }).neq('id', id);
    if (error) throw new Error('Unable to update featured event.');
  }

  const { data: updated, error } = await supabase.from('events').update(next).eq('id', id).select('*').single();
  if (error) throw new Error('Unable to update event.');
  await writeAdminAudit(req as AuthenticatedRequest, 'event.update', 'event', id);
  res.json({
    event: { ...updated, featured: Boolean(updated.featured), published: Boolean(updated.published) },
    message: 'Event updated successfully.',
  });
}));

router.delete('/:id', requireAuth, adminMutationRateLimit, asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id);
  if (!id) throw new InputValidationError('Invalid event ID.');
  const { data, error } = await supabase.from('events').delete().eq('id', id).select('id');
  if (error) throw new Error('Unable to delete event.');
  if (!data.length) {
    res.status(404).json({ error: 'Event not found.' });
    return;
  }
  await writeAdminAudit(req as AuthenticatedRequest, 'event.delete', 'event', id);
  res.json({ message: 'Event deleted successfully.' });
}));

export default router;
