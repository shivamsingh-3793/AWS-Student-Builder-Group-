import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { asyncRoute, supabase } from '../supabase.ts';
import {
  createAdminSession,
  requireAuth,
  revokeAdminSession,
  revokeOtherAdminSessions,
  verifyToken,
  type AuthenticatedRequest,
} from '../middleware/auth.ts';
import { adminApiRateLimit, adminMutationRateLimit, loginAccountRateLimit, loginIpRateLimit } from '../middleware/rateLimit.ts';
import { writeAdminAudit } from '../audit.ts';
import { allowedKeys, bodyObject, InputValidationError, textField } from '../validation.ts';

const router = Router();
const dummyPasswordHash = bcrypt.hash(randomUUID(), 12);

router.post('/login', loginIpRateLimit, loginAccountRateLimit, asyncRoute(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const body = bodyObject(req.body);
  allowedKeys(body, ['email', 'password']);
  const email = textField(body.email, 'email', 254, { required: true }).toLowerCase();
  const password = textField(body.password, 'password', 256, { required: true });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, password_hash, role')
    .eq('email', email)
    .maybeSingle();

  if (error) throw new Error('Authentication database request failed.');
  const passwordMatches = await bcrypt.compare(password, user ? user.password_hash : await dummyPasswordHash);
  if (!user || user.role !== 'admin' || !passwordMatches) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = await createAdminSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: 'admin',
  });
  const auditRequest = req as AuthenticatedRequest;
  const sessionUser = verifyToken(token);
  if (!sessionUser) throw new Error('Unable to verify the new administrator session.');
  auditRequest.user = sessionUser;
  await writeAdminAudit(auditRequest, 'auth.login', 'admin', user.id);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}));

router.get('/me', requireAuth, adminApiRateLimit, (req: AuthenticatedRequest, res) => {
  res.json({
    user: {
      id: req.user!.id,
      email: req.user!.email,
      name: req.user!.name,
      role: req.user!.role,
    },
  });
});

router.post('/logout', requireAuth, adminApiRateLimit, asyncRoute<AuthenticatedRequest>(async (req, res) => {
  await revokeAdminSession(req.user!);
  await writeAdminAudit(req, 'auth.logout', 'admin', req.user!.id);
  res.json({ message: 'Session ended.' });
}));

router.post('/change-password', requireAuth, adminMutationRateLimit, asyncRoute<AuthenticatedRequest>(async (req, res) => {
  const body = bodyObject(req.body);
  allowedKeys(body, ['currentPassword', 'newPassword']);
  const currentPassword = textField(body.currentPassword, 'currentPassword', 256, { required: true });
  const newPassword = textField(body.newPassword, 'newPassword', 72, { required: true });
  if (Buffer.byteLength(newPassword, 'utf8') > 72 || newPassword.length < 12) {
    throw new InputValidationError('New password must be at least 12 characters and no more than 72 bytes.');
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, password_hash')
    .eq('id', req.user!.id)
    .maybeSingle();

  if (error) throw new Error('Authentication database request failed.');
  if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
    res.status(400).json({ error: 'Current password is incorrect.' });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: newHash })
    .eq('id', user.id);
  if (updateError) throw new Error('Password update failed.');

  await revokeOtherAdminSessions(user.id, req.user!.jti);
  await writeAdminAudit(req, 'auth.password_change', 'admin', user.id);
  res.json({ message: 'Password updated. Other active sessions have been expired.' });
}));

export default router;
