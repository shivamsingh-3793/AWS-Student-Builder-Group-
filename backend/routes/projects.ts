import { Router } from 'express';
import { asyncRoute, supabase } from '../supabase.ts';
import { optionalAuth, requireAuthForAllQuery, requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { adminMutationRateLimit } from '../middleware/rateLimit.ts';
import { writeAdminAudit } from '../audit.ts';
import { allowedKeys, bodyObject, booleanField, InputValidationError, optionalBoolean, optionalText, positiveId, safeUrl, textField } from '../validation.ts';

const router = Router();

interface ProjectRow {
  id: number;
  title: string;
  description: string;
  tech_stack: string;
  image_url: string;
  project_url: string;
  architecture_url: string;
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

function formatProject(row: ProjectRow) {
  return { ...row, featured: Boolean(row.featured), published: Boolean(row.published) };
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
  let query = supabase.from('projects').select('*');
  if (!isAdmin) query = query.eq('published', true);
  const { data, error } = await query
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  if (error) throw new Error('Unable to load projects.');
  res.json({ projects: (data as ProjectRow[]).map(formatProject) });
}));

router.get('/:id', optionalAuth, asyncRoute(async (req, res) => {
  if (Object.keys(req.query).length > 0) {
    res.status(400).json({ error: 'Unexpected query parameter.' });
    return;
  }
  const id = positiveId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'Invalid project ID.' });
    return;
  }
  const isAdmin = Boolean((req as AuthenticatedRequest).user);
  const { data: row, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error('Unable to load the project.');
  if (!row || (!row.published && !isAdmin)) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  const { data: related, error: relatedError } = await supabase
    .from('projects')
    .select('*')
    .eq('published', true)
    .neq('id', row.id)
    .order('id', { ascending: false })
    .limit(2);
  if (relatedError) throw new Error('Unable to load related projects.');
  res.json({
    project: formatProject(row as ProjectRow),
    related: (related as ProjectRow[]).map(formatProject),
  });
}));

router.post('/', requireAuth, adminMutationRateLimit, asyncRoute(async (req, res) => {
  const body = bodyObject(req.body);
  allowedKeys(body, ['title', 'description', 'tech_stack', 'image_url', 'project_url', 'architecture_url', 'featured', 'published']);
  const title = textField(body.title, 'title', 200, { required: true });
  const description = textField(body.description, 'description', 20000, { required: true });
  const tech_stack = body.tech_stack === undefined ? 'AWS · TypeScript' : textField(body.tech_stack, 'tech_stack', 500);
  const image_url = body.image_url === undefined ? '' : safeUrl(body.image_url, 'image_url', { image: true, allowRelative: true });
  const project_url = body.project_url === undefined ? '' : safeUrl(body.project_url, 'project_url');
  const architecture_url = body.architecture_url === undefined ? '' : safeUrl(body.architecture_url, 'architecture_url');
  const featured = body.featured === undefined ? false : booleanField(body.featured, 'featured');
  const published = body.published === undefined ? false : booleanField(body.published, 'published');

  const { data: created, error } = await supabase
    .from('projects')
    .insert({
      title: title.trim(),
      description: description.trim(),
      tech_stack,
      image_url,
      project_url,
      architecture_url,
      featured,
      published,
    })
    .select('*')
    .single();
  if (error) throw new Error('Unable to create project.');
  await writeAdminAudit(req as AuthenticatedRequest, 'project.create', 'project', created.id);
  res.status(201).json({ project: formatProject(created as ProjectRow), message: 'Project created successfully.' });
}));

router.put('/:id', requireAuth, adminMutationRateLimit, asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id);
  if (!id) throw new InputValidationError('Invalid project ID.');
  const body = bodyObject(req.body);
  allowedKeys(body, ['title', 'description', 'tech_stack', 'image_url', 'project_url', 'architecture_url', 'featured', 'published']);
  const { data: existing, error: fetchError } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
  if (fetchError) throw new Error('Unable to load project for update.');
  if (!existing) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  const next = {
    title: optionalText(body, 'title', 200, existing.title),
    description: optionalText(body, 'description', 20000, existing.description),
    tech_stack: optionalText(body, 'tech_stack', 500, existing.tech_stack),
    image_url: body.image_url === undefined
      ? existing.image_url
      : safeUrl(body.image_url, 'image_url', { image: true, allowRelative: true }),
    project_url: body.project_url === undefined ? existing.project_url : safeUrl(body.project_url, 'project_url'),
    architecture_url: body.architecture_url === undefined
      ? existing.architecture_url
      : safeUrl(body.architecture_url, 'architecture_url'),
    featured: optionalBoolean(body, 'featured', Boolean(existing.featured)),
    published: optionalBoolean(body, 'published', Boolean(existing.published)),
    updated_at: new Date().toISOString(),
  };
  if (!next.title || !next.description) {
    res.status(400).json({ error: 'Project title and description cannot be empty.' });
    return;
  }
  const { data: updated, error } = await supabase.from('projects').update(next).eq('id', id).select('*').single();
  if (error) throw new Error('Unable to update project.');
  await writeAdminAudit(req as AuthenticatedRequest, 'project.update', 'project', id);
  res.json({ project: formatProject(updated as ProjectRow), message: 'Project updated successfully.' });
}));

router.delete('/:id', requireAuth, adminMutationRateLimit, asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id);
  if (!id) throw new InputValidationError('Invalid project ID.');
  const { data, error } = await supabase.from('projects').delete().eq('id', id).select('id');
  if (error) throw new Error('Unable to delete project.');
  if (!data.length) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  await writeAdminAudit(req as AuthenticatedRequest, 'project.delete', 'project', id);
  res.json({ message: 'Project deleted successfully.' });
}));

export default router;
