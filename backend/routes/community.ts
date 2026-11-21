import { Router } from 'express';
import { asyncRoute, supabase } from '../supabase.ts';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { adminApiRateLimit, publicSubmissionRateLimit } from '../middleware/rateLimit.ts';
import { writeAdminAudit } from '../audit.ts';
import { allowedKeys, bodyObject, InputValidationError, textField } from '../validation.ts';

const router = Router();

router.post('/join', publicSubmissionRateLimit, asyncRoute(async (req, res) => {
  const body = bodyObject(req.body);
  allowedKeys(body, ['name', 'email', 'role', 'track', 'message', 'event_id']);
  const name = textField(body.name, 'name', 80, { required: true });
  const email = textField(body.email, 'email', 254, { required: true }).toLowerCase();
  const role = body.role === undefined ? 'Student Builder' : textField(body.role, 'role', 100);
  const track = body.track === undefined ? 'Serverless & Cloud' : textField(body.track, 'track', 100);
  const message = body.message === undefined ? '' : textField(body.message, 'message', 500, { allowEmpty: true });
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
  const message = textField(body.message, 'message', 4000, { required: true });
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
  if (Object.keys(req.query).length > 0) {
    res.status(400).json({ error: 'Unexpected query parameter.' });
    return;
  }
  const { data, error } = await supabase
    .from('submissions')
    .select('*, events(title)')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(500);
  if (error) throw new Error('Unable to load community submissions.');
  const submissions = data.map((row) => {
    const { events, ...submission } = row;
    const relation = Array.isArray(events) ? events[0] : events;
    return { ...submission, event_title: relation?.title || null };
  });
  await writeAdminAudit(req as AuthenticatedRequest, 'submissions.read', 'submissions');
  res.json({ submissions });
}));

export default router;
