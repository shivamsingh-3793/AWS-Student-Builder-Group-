import { Router } from 'express';
import { asyncRoute, supabase } from '../supabase.ts';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { adminApiRateLimit, adminMutationRateLimit, publicSubmissionRateLimit } from '../middleware/rateLimit.ts';
import { writeAdminAudit } from '../audit.ts';
import { allowedKeys, bodyObject, InputValidationError, positiveId, textField } from '../validation.ts';

const router = Router();
const MAX_SUBMISSION_MESSAGE_LENGTH = 100_000;
const SUBMISSION_KINDS = ['join', 'event_rsvp', 'contact'] as const;
const SUBMISSION_STATUSES = ['new', 'read', 'reviewed'] as const;

function isOneOf<const Values extends readonly string[]>(
  values: Values,
  value: string,
): value is Values[number] {
  return values.some((candidate) => candidate === value);
}

function queryText(value: unknown, field: string, maxLength: number): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new InputValidationError(`${field} must be a single text value.`);
  const text = textField(value, field, maxLength, { allowEmpty: true });
  return text || undefined;
}

function queryInteger(value: unknown, field: string, fallback: number, max: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new InputValidationError(`${field} must be a positive integer.`);
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number > max) {
    throw new InputValidationError(`${field} is out of range.`);
  }
  return number;
}

router.post('/join', publicSubmissionRateLimit, asyncRoute(async (req, res) => {
  const body = bodyObject(req.body);
  allowedKeys(body, ['name', 'email', 'role', 'track', 'message', 'event_id']);
  const name = textField(body.name, 'name', 80, { required: true });
  const email = textField(body.email, 'email', 254, { required: true }).toLowerCase();
  const role = body.role === undefined ? 'Student Builder' : textField(body.role, 'role', 100);
  const track = body.track === undefined ? 'Serverless & Cloud' : textField(body.track, 'track', 100);
  const message = body.message === undefined
    ? ''
    : textField(body.message, 'message', MAX_SUBMISSION_MESSAGE_LENGTH, {
      allowEmpty: true,
      preserveWhitespace: true,
    });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new InputValidationError('Please provide a valid email address.');
  }
  let eventId: number | null = null;
  if (body.event_id !== undefined && body.event_id !== null) {
    if (typeof body.event_id !== 'number' || !Number.isSafeInteger(body.event_id) || body.event_id < 1) {
      throw new InputValidationError('event_id must be a positive integer.');
    }
    eventId = body.event_id;
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('published', true)
      .maybeSingle();
    if (eventError) throw new Error('Unable to verify the selected event.');
    if (!event) throw new InputValidationError('The selected event is unavailable.');
  }
  const { error } = await supabase.from('submissions').insert({
    kind: eventId ? 'event_rsvp' : 'join',
    name,
    email,
    role,
    track,
    message,
    event_id: eventId,
  });
  if (error) throw new Error('Unable to record the community request.');
  res.status(201).json({
    message: eventId
      ? 'Seat reserved! Check your inbox for workshop prep notes.'
      : 'Welcome to Stratus Builders! Your community membership request has been recorded.',
  });
}));

router.post('/contact', publicSubmissionRateLimit, asyncRoute(async (req, res) => {
  const body = bodyObject(req.body);
  allowedKeys(body, ['name', 'email', 'role', 'message']);
  const name = textField(body.name, 'name', 80, { required: true });
  const email = textField(body.email, 'email', 254, { required: true }).toLowerCase();
  const role = body.role === undefined ? 'General Inquiry' : textField(body.role, 'role', 100);
  const message = textField(body.message, 'message', MAX_SUBMISSION_MESSAGE_LENGTH, {
    required: true,
    preserveWhitespace: true,
  });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new InputValidationError('Please provide a valid email address.');
  }
  const { error } = await supabase.from('submissions').insert({
    kind: 'contact',
    name,
    email,
    role,
    track: '',
    message,
  });
  if (error) throw new Error('Unable to record the contact message.');
  res.status(201).json({ message: 'Message received. Our chapter leads will respond within 48 hours.' });
}));

router.get('/submissions', requireAuth, adminApiRateLimit, asyncRoute(async (req, res) => {
  const allowedQueryKeys = ['page', 'pageSize', 'sort', 'kind', 'status', 'search'];
  const unexpectedQuery = Object.keys(req.query).find((key) => !allowedQueryKeys.includes(key));
  if (unexpectedQuery) throw new InputValidationError(`Unexpected query parameter: ${unexpectedQuery}.`);

  const page = queryInteger(req.query.page, 'page', 1, 1_000_000);
  const pageSize = queryInteger(req.query.pageSize, 'pageSize', 25, 100);
  const sort = queryText(req.query.sort, 'sort', 16) || 'newest';
  if (sort !== 'newest' && sort !== 'oldest') {
    throw new InputValidationError('sort must be newest or oldest.');
  }

  const kind = queryText(req.query.kind, 'kind', 32);
  if (kind && !isOneOf(SUBMISSION_KINDS, kind)) {
    throw new InputValidationError('kind is not a supported submission type.');
  }
  const status = queryText(req.query.status, 'status', 16);
  if (status && !isOneOf(SUBMISSION_STATUSES, status)) {
    throw new InputValidationError('status is not a supported submission status.');
  }
  const search = queryText(req.query.search, 'search', 200);
  const offset = (page - 1) * pageSize;
  const { data, error } = await supabase.rpc('admin_list_submissions', {
    p_kind: kind || null,
    p_status: status || null,
    p_search: search || null,
    p_sort: sort,
    p_limit: pageSize,
    p_offset: offset,
  });
  if (error) {
    console.error('Community submissions Supabase query failed.', {
      code: error.code,
      message: error.message.replace(/[\r\n]/g, ' ').slice(0, 300),
    });
    res.status(500).json({ error: 'Unable to load community submissions.' });
    return;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('The submissions API returned an invalid response.');
  }
  const result = data as { submissions?: unknown; total?: unknown };
  if (
    !Array.isArray(result.submissions) ||
    typeof result.total !== 'number' ||
    !Number.isSafeInteger(result.total) ||
    result.total < 0
  ) {
    throw new Error('The submissions API returned an invalid response.');
  }

  await writeAdminAudit(req as AuthenticatedRequest, 'submissions.read', 'submissions');
  res.json({
    submissions: result.submissions,
    total: result.total,
    page,
    pageSize,
    hasMore: offset + result.submissions.length < result.total,
  });
}));

router.patch(
  '/submissions/:id/status',
  requireAuth,
  adminMutationRateLimit,
  asyncRoute(async (req, res) => {
    const id = positiveId(req.params.id);
    if (!id) throw new InputValidationError('Submission id must be a positive integer.');
    const body = bodyObject(req.body);
    allowedKeys(body, ['status']);
    if (
      typeof body.status !== 'string' ||
      !isOneOf(SUBMISSION_STATUSES, body.status)
    ) {
      throw new InputValidationError('status must be new, read, or reviewed.');
    }

    const { data, error } = await supabase
      .from('submissions')
      .update({ status: body.status })
      .eq('id', id)
      .select('id, status')
      .maybeSingle();
    if (error) throw new Error('Unable to update submission status.');
    if (!data) {
      res.status(404).json({ error: 'Submission not found.' });
      return;
    }

    await writeAdminAudit(req as AuthenticatedRequest, 'submissions.status.update', 'submissions', id);
    res.json({ submission: data, message: 'Submission status updated.' });
  }),
);

export default router;
