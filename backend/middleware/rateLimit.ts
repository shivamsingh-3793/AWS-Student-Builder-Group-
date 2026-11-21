import type { Request, RequestHandler } from 'express';
import crypto from 'crypto';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  key?: (req: Request) => string;
}

interface RateEntry {
  count: number;
  resetAt: number;
}

function remoteAddress(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function createRateLimiter(options: RateLimitOptions): RequestHandler {
  const entries = new Map<string, RateEntry>();
  const keyOf = options.key || remoteAddress;

  return (req, res, next) => {
    const now = Date.now();
    for (const [key, entry] of entries) {
      if (entry.resetAt <= now) entries.delete(key);
    }

    const key = keyOf(req);
    let entry = entries.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + options.windowMs };
      entries.set(key, entry);
    }

    entry.count += 1;
    if (entry.count > options.max) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }

    if (entries.size > 10000) {
      for (const [oldKey, oldEntry] of entries) {
        if (oldEntry.resetAt <= now || entries.size > 9000) entries.delete(oldKey);
      }
    }
    next();
  };
}

export const loginIpRateLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });

export const loginAccountRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  key: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return crypto.createHash('sha256').update(email).digest('hex');
  },
});

export const publicSubmissionRateLimit = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 10 });
export const adminMutationRateLimit = createRateLimiter({ windowMs: 60 * 1000, max: 120 });
export const adminApiRateLimit = createRateLimiter({ windowMs: 60 * 1000, max: 120 });
export const uploadRateLimit = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 20 });
