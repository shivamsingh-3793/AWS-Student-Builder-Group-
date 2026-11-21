import { Router, type Request, type Response } from 'express';
import { asyncRoute, supabase } from '../supabase.ts';
import { optionalAuth, requireAuth, requireAuthForAllQuery, type AuthenticatedRequest } from '../middleware/auth.ts';
import { uploadImage } from '../middleware/upload.ts';
import { removePublicImage, uploadPublicImage } from '../storage.ts';
import { adminMutationRateLimit, uploadRateLimit } from '../middleware/rateLimit.ts';
import { writeAdminAudit } from '../audit.ts';

const router = Router();
const TEAM_CATEGORIES = ['leader', 'core', 'member', 'former'] as const;
type TeamCategory = (typeof TEAM_CATEGORIES)[number];

interface TeamMemberRow {
  id: number;
  name: string;
  title: string;
  bio: string;
  photo_url: string;
  category: TeamCategory;
  linkedin: string;
  github: string;
  instagram: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

type TeamMemberValues = Partial<
  Pick<
    TeamMemberRow,
    | 'name'
    | 'title'
    | 'bio'
    | 'photo_url'
    | 'category'
    | 'linkedin'
    | 'github'
    | 'instagram'
    | 'display_order'
    | 'active'
    | 'updated_at'
  >
>;

class TeamValidationError extends Error {}

function hasField(body: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function readText(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
  required = false,
): string {
  const value = body[key];
  if (typeof value !== 'string') {
    if (value === undefined && !required) return '';
    if (required) throw new TeamValidationError(`${key} is required.`);
    throw new TeamValidationError(`${key} must be text.`);
  }
  const text = value.trim();
  if (required && !text) throw new TeamValidationError(`${key} is required.`);
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) {
    throw new TeamValidationError(`${key} contains unsupported control characters.`);
  }
  if (text.length > maxLength) {
    throw new TeamValidationError(`${key} must be ${maxLength} characters or fewer.`);
  }
  return text;
}

function readOptionalUrl(value: unknown, key: string, allowUploadsPath = false): string {
  if (typeof value !== 'string') throw new TeamValidationError(`${key} must be a URL.`);
  const text = value.trim();
  if (!text) return '';
  if (text.length > 2000) throw new TeamValidationError(`${key} is too long.`);
  if (
    allowUploadsPath &&
    /^\/uploads\/[a-zA-Z0-9._-]+$/.test(text) &&
    !text.split('/').pop()?.startsWith('.') &&
    !text.includes('..')
  ) return text;

  try {
    const url = new URL(text);
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password) {
      throw new TeamValidationError(`${key} must use HTTP or HTTPS.`);
    }
  } catch (error) {
    if (error instanceof TeamValidationError) throw error;
    throw new TeamValidationError(`${key} must be a valid URL.`);
  }
  return text;
}

function readBoolean(value: unknown, key: string): boolean {
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  throw new TeamValidationError(`${key} must be true or false.`);
}

function readCategory(value: unknown): TeamCategory {
  if (typeof value === 'string' && TEAM_CATEGORIES.includes(value as TeamCategory)) {
    return value as TeamCategory;
  }
  throw new TeamValidationError('category must be leader, core, member, or former.');
}

function readDisplayOrder(value: unknown): number {
  const order = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(order) || order < 0 || order > 1000000) {
    throw new TeamValidationError('display_order must be a non-negative integer.');
  }
  return order;
}

function parseTeamValues(body: Record<string, unknown>, partial: boolean): TeamMemberValues {
  const values: TeamMemberValues = {};
  if (!partial || hasField(body, 'name')) values.name = readText(body, 'name', 120, true);
  if (!partial || hasField(body, 'title')) values.title = readText(body, 'title', 160, true);
  if (!partial || hasField(body, 'bio')) values.bio = readText(body, 'bio', 4000);

  if (!partial || hasField(body, 'category')) {
    values.category = hasField(body, 'category') ? readCategory(body.category) : 'core';
  }
  if (!partial || hasField(body, 'display_order')) {
    values.display_order = hasField(body, 'display_order')
      ? readDisplayOrder(body.display_order)
      : 0;
  }
  if (!partial || hasField(body, 'active')) {
    values.active = hasField(body, 'active') ? readBoolean(body.active, 'active') : true;
  }

  for (const key of ['linkedin', 'github', 'instagram'] as const) {
    if (!partial || hasField(body, key)) {
      values[key] = readOptionalUrl(hasField(body, key) ? body[key] : '', key);
    }
  }

  return values;
}

function validateTeamBodyKeys(body: Record<string, unknown>): void {
  const allowed = [
    'name', 'title', 'bio', 'photo_url', 'category', 'linkedin', 'github',
    'instagram', 'display_order', 'active', 'remove_photo',
  ];
  if (Object.keys(body).some((key) => !allowed.includes(key))) {
    throw new TeamValidationError('Request contains an unexpected field.');
  }
}

function parsePhotoUrl(body: Record<string, unknown>): string | undefined {
  if (!hasField(body, 'photo_url')) return undefined;
  return readOptionalUrl(body.photo_url, 'photo_url', true);
}

function parseRemovePhoto(body: Record<string, unknown>): boolean {
  if (!hasField(body, 'remove_photo')) return false;
  return readBoolean(body.remove_photo, 'remove_photo');
}

function validationResponse(res: Response, error: unknown): boolean {
  if (error instanceof TeamValidationError) {
    res.status(400).json({ error: error.message });
    return true;
  }
  return false;
}

router.get('/', optionalAuth, requireAuthForAllQuery, asyncRoute(async (req, res) => {
  if (Object.keys(req.query).some((key) => !['all', 'active', 'category'].includes(key))) {
    res.status(400).json({ error: 'Unexpected query parameter.' });
    return;
  }
  if (req.query.all !== undefined && req.query.all !== 'true' && req.query.all !== 'false') {
    res.status(400).json({ error: 'all must be true or false.' });
    return;
  }
  const isAdmin = Boolean((req as AuthenticatedRequest).user);
  let query = supabase.from('team_members').select('*');

  if (req.query.active !== undefined && req.query.all !== 'true') {
    res.status(400).json({ error: 'active can only be used with all=true.' });
    return;
  }
  if (!(isAdmin && req.query.all === 'true')) {
    query = query.eq('active', true);
  } else if (req.query.active !== undefined) {
    if (req.query.active !== 'true' && req.query.active !== 'false') {
      res.status(400).json({ error: 'active must be true or false.' });
      return;
    }
    query = query.eq('active', req.query.active === 'true');
  }

  if (req.query.category !== undefined) {
    if (
      typeof req.query.category !== 'string' ||
      !TEAM_CATEGORIES.includes(req.query.category as TeamCategory)
    ) {
      res.status(400).json({ error: 'Invalid team category.' });
      return;
    }
    query = query.eq('category', req.query.category);
  }

  const { data, error } = await query
    .order('display_order', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw new Error('Unable to load team members.');
  res.json({ members: data as TeamMemberRow[] });
}));

router.post('/', requireAuth, adminMutationRateLimit, uploadRateLimit, uploadImage.single('photo'), asyncRoute(async (req, res) => {
  const body = (req.body || {}) as Record<string, unknown>;
  let values: TeamMemberValues;
  let photoUrl: string;
  try {
    validateTeamBodyKeys(body);
    values = parseTeamValues(body, false);
    photoUrl = parsePhotoUrl(body) || '';
    if (req.file && parseRemovePhoto(body)) {
      throw new TeamValidationError('A photo cannot be uploaded and removed in the same request.');
    }
  } catch (error) {
    if (validationResponse(res, error)) return;
    throw error;
  }

  const uploaded = req.file ? await uploadPublicImage(req.file, 'team') : null;
  values.photo_url = uploaded?.url || photoUrl;
  const { data: created, error } = await supabase
    .from('team_members')
    .insert(values)
    .select('*')
    .single();

  if (error) {
    if (uploaded) await removePublicImage(uploaded.url);
    throw new Error('Unable to create team member.');
  }

  await writeAdminAudit(req as AuthenticatedRequest, 'team.create', 'team_member', created.id);
  res.status(201).json({
    member: created as TeamMemberRow,
    message: 'Team member created successfully.',
  });
}));

async function updateTeamMember(
  req: Request,
  res: Response,
  partial: boolean,
) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({ error: 'Invalid team member ID.' });
    return;
  }

  const { data: existing, error: fetchError } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (fetchError) throw new Error('Unable to load team member for update.');
  if (!existing) {
    res.status(404).json({ error: 'Team member not found.' });
    return;
  }

  const body = (req.body || {}) as Record<string, unknown>;
  let values: TeamMemberValues;
  let removePhoto: boolean;
  try {
    validateTeamBodyKeys(body);
    values = parseTeamValues(body, partial);
    removePhoto = parseRemovePhoto(body);
    if (req.file && removePhoto) {
      throw new TeamValidationError('A photo cannot be uploaded and removed in the same request.');
    }
    if (hasField(body, 'photo_url')) values.photo_url = parsePhotoUrl(body);
    if (removePhoto) values.photo_url = '';
    if (Object.keys(values).length === 0 && !req.file) {
      throw new TeamValidationError('Provide at least one team member field to update.');
    }
  } catch (error) {
    if (validationResponse(res, error)) return;
    throw error;
  }

  const uploaded = req.file ? await uploadPublicImage(req.file, 'team') : null;
  if (uploaded) values.photo_url = uploaded.url;
  values.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('team_members')
    .update(values)
    .eq('id', id)
    .select('*')
    .single();
  if (error) {
    if (uploaded) await removePublicImage(uploaded.url);
    throw new Error('Unable to update team member.');
  }
  await writeAdminAudit(req as AuthenticatedRequest, 'team.update', 'team_member', id);

  if (existing.photo_url && existing.photo_url !== updated.photo_url) {
    try {
      await removePublicImage(existing.photo_url);
    } catch {
      res.json({
        member: updated as TeamMemberRow,
        message: 'Team member updated successfully.',
        warning: 'The previous photo could not be removed from Storage.',
      });
      return;
    }
  }

  res.json({
    member: updated as TeamMemberRow,
    message: 'Team member updated successfully.',
  });
}

router.put('/:id', requireAuth, adminMutationRateLimit, uploadRateLimit, uploadImage.single('photo'), asyncRoute((req, res) =>
  updateTeamMember(req, res, false)
));

router.patch('/:id', requireAuth, adminMutationRateLimit, uploadRateLimit, uploadImage.single('photo'), asyncRoute((req, res) =>
  updateTeamMember(req, res, true)
));

router.delete('/:id', requireAuth, adminMutationRateLimit, asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({ error: 'Invalid team member ID.' });
    return;
  }

  const { data: existing, error: fetchError } = await supabase
    .from('team_members')
    .select('id, photo_url')
    .eq('id', id)
    .maybeSingle();
  if (fetchError) throw new Error('Unable to load team member for deletion.');
  if (!existing) {
    res.status(404).json({ error: 'Team member not found.' });
    return;
  }

  const { error } = await supabase.from('team_members').delete().eq('id', id);
  if (error) throw new Error('Unable to delete team member.');
  await writeAdminAudit(req as AuthenticatedRequest, 'team.delete', 'team_member', id);
  if (existing.photo_url) {
    try {
      await removePublicImage(existing.photo_url);
    } catch {
      res.json({
        message: 'Team member deleted successfully.',
        warning: 'The photo could not be removed from Storage.',
      });
      return;
    }
  }

  res.json({ message: 'Team member deleted successfully.' });
}));

export default router;
