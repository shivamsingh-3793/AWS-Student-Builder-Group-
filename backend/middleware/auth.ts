import { randomUUID } from 'crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { supabase } from '../supabase.ts';

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return secret;
})();

const TOKEN_LIFETIME_SECONDS = 60 * 60;

export interface AuthPayload extends JwtPayload {
  id: number;
  email: string;
  name: string;
  role: 'admin';
  jti: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export async function createAdminSession(user: Omit<AuthPayload, 'jti' | 'iat' | 'exp'>): Promise<string> {
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_SECONDS * 1000).toISOString();
  const { error: expiredSessionError } = await supabase
    .from('admin_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString());
  if (expiredSessionError) throw new Error('Unable to prepare a new administrator session.');
  const { error } = await supabase.from('admin_sessions').insert({
    id: jti,
    user_id: user.id,
    expires_at: expiresAt,
  });
  if (error) throw new Error('Unable to create an administrator session.');

  return jwt.sign({ ...user, jti }, JWT_SECRET, {
    algorithm: 'HS256',
    issuer: 'stratus-cms',
    audience: 'stratus-admin',
    expiresIn: TOKEN_LIFETIME_SECONDS,
  });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'stratus-cms',
      audience: 'stratus-admin',
    });
    if (
      typeof decoded === 'string' ||
      typeof decoded.id !== 'number' ||
      !Number.isSafeInteger(decoded.id) ||
      typeof decoded.email !== 'string' ||
      typeof decoded.name !== 'string' ||
      decoded.role !== 'admin' ||
      typeof decoded.jti !== 'string'
    ) {
      return null;
    }
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: 'admin',
      jti: decoded.jti,
      iat: decoded.iat,
      exp: decoded.exp,
      iss: decoded.iss,
      aud: decoded.aud,
    };
  } catch {
    return null;
  }
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token && token.length <= 4096 ? token : null;
}

async function authenticate(req: AuthenticatedRequest): Promise<AuthPayload | null> {
  const token = extractBearerToken(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;

  const [sessionResult, userResult] = await Promise.all([
    supabase
      .from('admin_sessions')
      .select('id')
      .eq('id', payload.jti)
      .eq('user_id', payload.id)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle(),
    supabase.from('users').select('role').eq('id', payload.id).maybeSingle(),
  ]);
  if (sessionResult.error || userResult.error) throw new Error('Unable to verify the administrator session.');
  return sessionResult.data && userResult.data?.role === 'admin' ? payload : null;
}

export const requireAuth: RequestHandler = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  void authenticate(req as AuthenticatedRequest)
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: 'Authentication required or session expired.' });
        return;
      }
      (req as AuthenticatedRequest).user = user;
      next();
    })
    .catch(next);
};

export const optionalAuth: RequestHandler = (req, res, next) => {
  void authenticate(req as AuthenticatedRequest)
    .then((user) => {
      if (user) {
        res.setHeader('Cache-Control', 'no-store');
        (req as AuthenticatedRequest).user = user;
      }
      next();
    })
    .catch(next);
};

export function requireAuthForAllQuery(req: Request, res: Response, next: NextFunction): void {
  if (req.query.all === 'true') {
    if ((req as AuthenticatedRequest).user) {
      next();
      return;
    }
    requireAuth(req, res, next);
    return;
  }
  next();
}

export async function revokeAdminSession(payload: AuthPayload): Promise<void> {
  const { error } = await supabase
    .from('admin_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', payload.jti)
    .eq('user_id', payload.id)
    .is('revoked_at', null);
  if (error) throw new Error('Unable to end the administrator session.');
}

export async function revokeOtherAdminSessions(userId: number, currentSessionId: string): Promise<void> {
  const { error } = await supabase
    .from('admin_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .neq('id', currentSessionId)
    .is('revoked_at', null);
  if (error) throw new Error('Unable to expire administrator sessions.');
}
