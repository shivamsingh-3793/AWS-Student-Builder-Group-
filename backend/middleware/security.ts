import type { RequestHandler } from 'express';

function configuredOrigins(): Set<string> {
  const origins = new Set<string>();
  const configured = process.env.CORS_ALLOWED_ORIGINS?.split(',') ?? [];
  for (const value of configured) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      throw new Error('CORS_ALLOWED_ORIGINS must contain valid origins.');
    }
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== trimmed.replace(/\/$/, '')) {
      throw new Error('CORS_ALLOWED_ORIGINS must contain origins without paths.');
    }
    origins.add(url.origin);
  }
  return origins;
}

const productionOrigins = configuredOrigins();

function isAllowedOrigin(origin: string): boolean {
  if (productionOrigins.has(origin)) return true;
  if (process.env.NODE_ENV === 'production') return false;
  try {
    const url = new URL(origin);
    if (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return true;
    return url.protocol === 'https:' && url.hostname.endsWith('.trycloudflare.com');
  } catch {
    return false;
  }
}

export const corsPolicy: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  res.vary('Origin');
  if (typeof origin === 'string') {
    const sameOrigin = `${req.protocol}://${req.get('host')}`;
    if (origin !== sameOrigin && !isAllowedOrigin(origin)) {
      res.status(403).json({ error: 'Origin is not allowed.' });
      return;
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
};

export const securityHeaders: RequestHandler = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  if (isHttps) res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' https: http: data: blob:",
        "connect-src 'self' https: wss:",
      ].join('; '),
    );
  }
  next();
};
