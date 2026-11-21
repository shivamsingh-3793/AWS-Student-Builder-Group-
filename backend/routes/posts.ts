import { Router } from 'express';
import { asyncRoute, supabase } from '../supabase.ts';
import { slugify } from '../slugify.ts';
import { optionalAuth, requireAuthForAllQuery, requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { adminMutationRateLimit } from '../middleware/rateLimit.ts';
import { writeAdminAudit } from '../audit.ts';
import { allowedKeys, bodyObject, booleanField, InputValidationError, optionalBoolean, optionalText, positiveId, safeUrl, textField } from '../validation.ts';

const router = Router();

interface PostRow {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  content: string;
  image_url: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

function formatPost(row: PostRow) {
  return { ...row, published: Boolean(row.published) };
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
  let query = supabase.from('posts').select('*');
  if (!isAdmin) query = query.eq('published', true);
  const { data, error } = await query.order('created_at', { ascending: false }).order('id', { ascending: false });
  if (error) throw new Error('Unable to load posts.');
  res.json({ posts: (data as PostRow[]).map(formatPost) });
}));

router.get('/:slugOrId', optionalAuth, asyncRoute(async (req, res) => {
  if (Object.keys(req.query).length > 0) {
    res.status(400).json({ error: 'Unexpected query parameter.' });
    return;
  }
  const param = req.params.slugOrId;
  const isAdmin = Boolean((req as AuthenticatedRequest).user);
  const numericId = /^\d+$/.test(param) ? positiveId(param) : null;
  if (/^\d+$/.test(param) && !numericId) {
    res.status(400).json({ error: 'Invalid post ID.' });
    return;
  }
  if (!numericId && !/^[a-z0-9][a-z0-9-]{0,199}$/.test(param)) {
    res.status(400).json({ error: 'Invalid post slug.' });
    return;
  }
  const column = numericId ? 'id' : 'slug';
  const value = numericId || param;
  const { data: row, error } = await supabase.from('posts').select('*').eq(column, value).maybeSingle();
  if (error) throw new Error('Unable to load the article.');
  if (!row || (!row.published && !isAdmin)) {
    res.status(404).json({ error: 'Article not found.' });
    return;
  }

  const { data: related, error: relatedError } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .neq('id', row.id)
    .order('created_at', { ascending: false })
    .limit(2);
  if (relatedError) throw new Error('Unable to load related articles.');

  res.json({
    post: formatPost(row as PostRow),
    related: (related as PostRow[]).map(formatPost),
  });
}));

router.post('/', requireAuth, adminMutationRateLimit, asyncRoute(async (req, res) => {
  const body = bodyObject(req.body);
  allowedKeys(body, ['title', 'slug', 'excerpt', 'category', 'content', 'image_url', 'published']);
  const title = textField(body.title, 'title', 200, { required: true });
  const rawSlug = body.slug === undefined ? '' : textField(body.slug, 'slug', 200, { allowEmpty: true });
  const excerpt = body.excerpt === undefined ? '' : textField(body.excerpt, 'excerpt', 500, { allowEmpty: true });
  const category = body.category === undefined ? 'AWS' : textField(body.category, 'category', 80, { required: true });
  const content = textField(body.content, 'content', 50000, { required: true });
  const image_url = body.image_url === undefined ? '' : safeUrl(body.image_url, 'image_url', { image: true, allowRelative: true });
  const published = body.published === undefined ? false : booleanField(body.published, 'published');

  let slug = slugify(rawSlug || title) || `post-${Date.now()}`;
  const { data: existing, error: slugError } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (slugError) throw new Error('Unable to verify article slug.');
  if (existing) slug = `${slug}-${Date.now().toString().slice(-4)}`;

  const cleanContent = content.trim();
  const derivedExcerpt =
    excerpt ||
    cleanContent.replace(/[#`*>\n]+/g, ' ').trim().slice(0, 160) + (cleanContent.length > 160 ? '...' : '');
  const { data: created, error } = await supabase
    .from('posts')
    .insert({
      title: title.trim(),
      slug,
      excerpt: derivedExcerpt,
      category,
      content: cleanContent,
      image_url,
      published,
    })
    .select('*')
    .single();
  if (error) throw new Error('Unable to create article.');
  await writeAdminAudit(req as AuthenticatedRequest, 'post.create', 'post', created.id);
  res.status(201).json({ post: formatPost(created as PostRow), message: 'Post created successfully.' });
}));

router.put('/:id', requireAuth, adminMutationRateLimit, asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id);
  if (!id) throw new InputValidationError('Invalid post ID.');
  const body = bodyObject(req.body);
  allowedKeys(body, ['title', 'slug', 'excerpt', 'category', 'content', 'image_url', 'published']);
  const { data: existing, error: fetchError } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
  if (fetchError) throw new Error('Unable to load article for update.');
  if (!existing) {
    res.status(404).json({ error: 'Post not found.' });
    return;
  }

  const nextTitle = optionalText(body, 'title', 200, existing.title);
  const nextContent = optionalText(body, 'content', 50000, existing.content);
  const nextCategory = optionalText(body, 'category', 80, existing.category);
  const nextImage = body.image_url === undefined
    ? existing.image_url
    : safeUrl(body.image_url, 'image_url', { image: true, allowRelative: true });
  const nextPublished = optionalBoolean(body, 'published', Boolean(existing.published));
  const rawSlug = body.slug === undefined ? undefined : textField(body.slug, 'slug', 200, { allowEmpty: true });
  let nextSlug = rawSlug !== undefined ? slugify(rawSlug) : existing.slug;
  if (!nextSlug) nextSlug = existing.slug;

  const { data: collision, error: slugError } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', nextSlug)
    .neq('id', id)
    .maybeSingle();
  if (slugError) throw new Error('Unable to verify article slug.');
  if (collision) nextSlug = `${nextSlug}-${id}`;

  const nextExcerpt =
    body.excerpt !== undefined
      ? textField(body.excerpt, 'excerpt', 500, { allowEmpty: true })
      : existing.excerpt || nextContent.replace(/[#`*>\n]+/g, ' ').trim().slice(0, 160);
  if (!nextTitle || !nextContent) {
    res.status(400).json({ error: 'Title and content cannot be empty.' });
    return;
  }

  const { data: updated, error } = await supabase
    .from('posts')
    .update({
      title: nextTitle,
      slug: nextSlug,
      excerpt: nextExcerpt,
      category: nextCategory,
      content: nextContent,
      image_url: nextImage,
      published: nextPublished,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error('Unable to update article.');
  await writeAdminAudit(req as AuthenticatedRequest, 'post.update', 'post', id);
  res.json({ post: formatPost(updated as PostRow), message: 'Post updated successfully.' });
}));

router.delete('/:id', requireAuth, adminMutationRateLimit, asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id);
  if (!id) throw new InputValidationError('Invalid post ID.');
  const { data, error } = await supabase.from('posts').delete().eq('id', id).select('id');
  if (error) throw new Error('Unable to delete article.');
  if (!data.length) {
    res.status(404).json({ error: 'Post not found.' });
    return;
  }
  await writeAdminAudit(req as AuthenticatedRequest, 'post.delete', 'post', id);
  res.json({ message: 'Post deleted successfully.' });
}));

export default router;
