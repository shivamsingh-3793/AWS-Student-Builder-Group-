import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-that-is-long-enough-for-auth-tests';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
const nativeFetch = globalThis.fetch.bind(globalThis);
let communityStatsRow: Record<string, unknown> | null = null;
const testAdminSessionId = '00000000-0000-4000-8000-000000000001';
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input.toString());
  if (url.origin === 'https://example.supabase.co') {
    const method = init?.method || (input instanceof Request ? input.method : 'GET');
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    if (url.pathname.endsWith('/community_stats')) {
      if (method === 'POST') {
        const body = init?.body;
        if (typeof body === 'string') communityStatsRow = JSON.parse(body) as Record<string, unknown>;
        return new Response(JSON.stringify(communityStatsRow), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const data = communityStatsRow
        ? headers.get('Accept')?.includes('vnd.pgrst.object') ? communityStatsRow : [communityStatsRow]
        : [];
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Content-Range': '*/0' },
      });
    }
    if (url.pathname.endsWith('/admin_sessions') && method === 'GET') {
      return new Response(JSON.stringify([{ id: testAdminSessionId }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (
      url.pathname.endsWith('/users') &&
      method === 'GET' &&
      url.searchParams.get('select') === 'role'
    ) {
      return new Response(JSON.stringify([{ role: 'admin' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.pathname.endsWith('/submissions') && method === 'POST') {
      return new Response(null, { status: 201 });
    }
    return new Response('[]', {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Content-Range': '*/0' },
    });
  }
  return nativeFetch(input, init);
};

let server: Server;
let baseUrl: string;

before(async () => {
  const [auth, events, posts, projects, gallery, team, stats, community, authMiddleware, securityMiddleware] = await Promise.all([
    import('./routes/auth.ts'),
    import('./routes/events.ts'),
    import('./routes/posts.ts'),
    import('./routes/projects.ts'),
    import('./routes/gallery.ts'),
    import('./routes/team.ts'),
    import('./routes/stats.ts'),
    import('./routes/community.ts'),
    import('./middleware/auth.ts'),
    import('./middleware/security.ts'),
  ]);
  const app = express();
  app.use(securityMiddleware.securityHeaders, securityMiddleware.corsPolicy);
  app.use(express.json());
  app.use('/api/auth', auth.default);
  app.use('/api/events', events.default);
  app.use('/api/posts', posts.default);
  app.use('/api/projects', projects.default);
  app.use('/api/gallery', gallery.default);
  app.use('/api/team', team.default);
  app.use('/api/stats', stats.default);
  app.use('/api/community', community.default);
  app.get('/public-probe', authMiddleware.optionalAuth, (_req, res) => res.sendStatus(200));
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unexpected test error.' });
  });

  server = await new Promise<Server>((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test('unauthenticated requests cannot mutate CMS content or read submissions', async () => {
  const protectedRequests: Array<[string, string]> = [
    ['POST', '/api/events'],
    ['PUT', '/api/events/1'],
    ['DELETE', '/api/events/1'],
    ['POST', '/api/posts'],
    ['PUT', '/api/posts/1'],
    ['DELETE', '/api/posts/1'],
    ['POST', '/api/projects'],
    ['PUT', '/api/projects/1'],
    ['DELETE', '/api/projects/1'],
    ['POST', '/api/gallery'],
    ['PUT', '/api/gallery/1'],
    ['DELETE', '/api/gallery/1'],
    ['POST', '/api/team'],
    ['PATCH', '/api/team/1'],
    ['DELETE', '/api/team/1'],
    ['PUT', '/api/stats'],
    ['GET', '/api/community/submissions'],
    ['GET', '/api/events?all=true'],
    ['GET', '/api/team?all=true'],
    ['GET', '/api/auth/me'],
    ['POST', '/api/auth/logout'],
    ['POST', '/api/auth/change-password'],
  ];

  for (const [method, path] of protectedRequests) {
    const response = await fetch(`${baseUrl}${path}`, { method });
    assert.equal(response.status, 401, `${method} ${path} should require an authenticated admin`);
  }
});

test('invalid and expired bearer tokens are rejected', async () => {
  const expiredToken = jwt.sign(
    { id: 1, email: 'admin@example.com', name: 'Admin', role: 'admin', jti: '00000000-0000-4000-8000-000000000000' },
    process.env.JWT_SECRET!,
    {
      algorithm: 'HS256',
      issuer: 'stratus-cms',
      audience: 'stratus-admin',
      expiresIn: -1,
    },
  );
  for (const token of ['not-a-jwt', expiredToken]) {
    const response = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 401);
  }
});

test('login attempts are throttled per account', async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-admin@example.com', password: 'incorrect-password' }),
    });
    assert.equal(response.status, 401);
  }
  const limited = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-admin@example.com', password: 'incorrect-password' }),
  });
  assert.equal(limited.status, 429);
  assert.ok(limited.headers.has('retry-after'));
});

test('public routes can proceed without an administrator token', async () => {
  const response = await fetch(`${baseUrl}/public-probe`);
  assert.equal(response.status, 200);
});

test('public event listing and contact submission remain available', async () => {
  const eventsResponse = await fetch(`${baseUrl}/api/events`);
  assert.equal(eventsResponse.status, 200);
  assert.deepEqual(await eventsResponse.json(), { events: [] });

  const contactResponse = await fetch(`${baseUrl}/api/community/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      message: 'A valid public message.',
    }),
  });
  assert.equal(contactResponse.status, 201, await contactResponse.clone().text());
});

test('community statistics save through the admin API and are returned for public display', async () => {
  communityStatsRow = null;
  const emptyResponse = await fetch(`${baseUrl}/api/stats`);
  assert.deepEqual(await emptyResponse.json(), { community: null });

  const token = jwt.sign(
    { id: 1, email: 'admin@example.com', name: 'Admin', role: 'admin', jti: testAdminSessionId },
    process.env.JWT_SECRET!,
    {
      algorithm: 'HS256',
      issuer: 'stratus-cms',
      audience: 'stratus-admin',
      expiresIn: 3600,
    },
  );
  const stats = {
    builders_count: 601,
    events_count: 72,
    projects_count: 35,
    workshops_count: 128,
  };
  const updateResponse = await fetch(`${baseUrl}/api/stats`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(stats),
  });
  assert.equal(updateResponse.status, 200, await updateResponse.clone().text());
  const updatedCommunity = (await updateResponse.json()).community;
  assert.deepEqual(
    {
      builders_count: updatedCommunity.builders_count,
      events_count: updatedCommunity.events_count,
      projects_count: updatedCommunity.projects_count,
      workshops_count: updatedCommunity.workshops_count,
    },
    stats,
  );

  const homepageResponse = await fetch(`${baseUrl}/api/stats`);
  assert.deepEqual((await homepageResponse.json()).community, stats);
});

test('security headers and development CORS policy are applied', async () => {
  const localResponse = await fetch(`${baseUrl}/public-probe`, {
    headers: { Origin: 'http://localhost:5173' },
  });
  assert.equal(localResponse.status, 200);
  assert.equal(localResponse.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.equal(localResponse.headers.get('x-content-type-options'), 'nosniff');

  const blockedResponse = await fetch(`${baseUrl}/public-probe`, {
    headers: { Origin: 'https://untrusted.example' },
  });
  assert.equal(blockedResponse.status, 403);

  const previousEnvironment = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    const sameOrigin = await fetch(`${baseUrl}/public-probe`, {
      headers: { Origin: new URL(baseUrl).origin },
    });
    assert.match(sameOrigin.headers.get('content-security-policy') || '', /default-src 'self'/);
  } finally {
    process.env.NODE_ENV = previousEnvironment;
  }
});
