import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';
import { InputValidationError } from './validation.ts';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-that-is-long-enough-for-auth-tests';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
const nativeFetch = globalThis.fetch.bind(globalThis);
let communityStatsRow: Record<string, unknown> | null = null;
let storedSubmissions: Array<Record<string, unknown>> = [];
let lastSubmissionQuery: Record<string, unknown> | null = null;
let submissionRpcError: { code: string; message: string } | null = null;
const testAdminSessionId = '00000000-0000-4000-8000-000000000001';

function testAdminToken(): string {
  return jwt.sign(
    { id: 1, email: 'admin@example.com', name: 'Admin', role: 'admin', jti: testAdminSessionId },
    process.env.JWT_SECRET!,
    {
      algorithm: 'HS256',
      issuer: 'stratus-cms',
      audience: 'stratus-admin',
      expiresIn: 3600,
    },
  );
}

globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input.toString());
  if (url.origin === 'https://example.supabase.co') {
    const method = init?.method || (input instanceof Request ? input.method : 'GET');
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    if (url.pathname.endsWith('/rpc/admin_list_submissions') && method === 'POST') {
      if (submissionRpcError) {
        return new Response(JSON.stringify(submissionRpcError), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const body = init?.body;
      if (typeof body === 'string') lastSubmissionQuery = JSON.parse(body) as Record<string, unknown>;
      const offset = Number(lastSubmissionQuery?.p_offset) || 0;
      const limit = Number(lastSubmissionQuery?.p_limit) || 25;
      return new Response(JSON.stringify({
        submissions: storedSubmissions.slice(offset, offset + limit),
        total: storedSubmissions.length,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
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
      const body = init?.body;
      if (typeof body === 'string') {
        storedSubmissions.push({
          id: storedSubmissions.length + 1,
          ...JSON.parse(body) as Record<string, unknown>,
          status: 'new',
          created_at: new Date().toISOString(),
        });
      }
      return new Response(null, { status: 201 });
    }
    if (url.pathname.endsWith('/submissions') && method === 'PATCH') {
      const body = init?.body;
      const update = typeof body === 'string' ? JSON.parse(body) as { status: string } : null;
      const id = Number(url.searchParams.get('id')?.replace('eq.', ''));
      const submission = storedSubmissions.find((row) => row.id === id);
      if (!submission || !update) {
        return new Response(JSON.stringify({ message: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      submission.status = update.status;
      return new Response(JSON.stringify({ id, status: submission.status }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
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
    const status = error instanceof InputValidationError ? 400 : 500;
    res.status(status).json({ error: error instanceof Error ? error.message : 'Unexpected test error.' });
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
    ['PATCH', '/api/community/submissions/1/status'],
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

test('application and contact messages are stored completely without trimming', async () => {
  storedSubmissions = [];
  const messages = [
    'A short application.',
    'x'.repeat(320),
    'x'.repeat(650),
    '  Keep leading and trailing text.\n',
    `Very long application:\n${'A complete line of applicant text.\n'.repeat(2500)}`,
  ];

  for (const message of messages) {
    const response = await fetch(`${baseUrl}/api/community/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Long Message User',
        email: 'long-message@example.com',
        message,
      }),
    });
    assert.equal(response.status, 201, await response.clone().text());
    assert.equal(storedSubmissions.at(-1)?.message, message);
  }

  const contactMessage = `Contact details:\n${'Additional context. '.repeat(3000)}`;
  const contactResponse = await fetch(`${baseUrl}/api/community/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Contact User',
      email: 'contact-long@example.com',
      message: contactMessage,
    }),
  });
  assert.equal(contactResponse.status, 201, await contactResponse.clone().text());
  assert.equal(storedSubmissions.at(-1)?.message, contactMessage);
});

test('admin submissions are paginated and searchable through the protected API', async () => {
  storedSubmissions = Array.from({ length: 31 }, (_, index) => ({
    id: index + 1,
    kind: 'event_rsvp',
    name: `RSVP User ${index + 1}`,
    email: `rsvp${index + 1}@example.com`,
    role: 'Attendee',
    track: 'Cloud',
    message: 'Looking forward to AWS Launchpad.',
    event_id: 3,
    event_title: 'AWS Launchpad',
    status: 'read',
    created_at: '2026-11-20T10:00:00.000Z',
  }));
  lastSubmissionQuery = null;

  const response = await fetch(
    `${baseUrl}/api/community/submissions?page=2&pageSize=10&sort=oldest&kind=event_rsvp&status=read&search=Launchpad`,
    { headers: { Authorization: `Bearer ${testAdminToken()}` } },
  );
  assert.equal(response.status, 200, await response.clone().text());
  const result = await response.json();
  assert.equal(result.total, 31);
  assert.equal(result.page, 2);
  assert.equal(result.submissions.length, 10);
  assert.equal(result.hasMore, true);
  assert.deepEqual(lastSubmissionQuery, {
    p_kind: 'event_rsvp',
    p_status: 'read',
    p_search: 'Launchpad',
    p_sort: 'oldest',
    p_limit: 10,
    p_offset: 10,
  });
});

test('submission query failures are logged safely and return JSON without exposing details', async () => {
  submissionRpcError = {
    code: 'PGRST202',
    message: 'Could not find the function public.admin_list_submissions in the schema cache.',
  };
  const originalConsoleError = console.error;
  const logged: unknown[][] = [];
  console.error = (...args: unknown[]) => logged.push(args);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/community/submissions`, {
      headers: { Authorization: `Bearer ${testAdminToken()}` },
    });
  } finally {
    console.error = originalConsoleError;
    submissionRpcError = null;
  }

  assert.equal(response!.status, 500);
  assert.deepEqual(await response!.json(), { error: 'Unable to load community submissions.' });
  assert.match(JSON.stringify(logged), /PGRST202/);
  assert.match(JSON.stringify(logged), /admin_list_submissions/);
  assert.doesNotMatch(JSON.stringify(logged), /message content|private submission/i);
});

test('only authenticated admins can change submission status', async () => {
  storedSubmissions = [{ id: 12, status: 'new' }];

  const unauthorized = await fetch(`${baseUrl}/api/community/submissions/12/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'read' }),
  });
  assert.equal(unauthorized.status, 401);

  const invalid = await fetch(`${baseUrl}/api/community/submissions/12/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${testAdminToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'deleted' }),
  });
  assert.equal(invalid.status, 400);

  const response = await fetch(`${baseUrl}/api/community/submissions/12/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${testAdminToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'reviewed' }),
  });
  assert.equal(response.status, 200, await response.clone().text());
  assert.equal((await response.json()).submission.status, 'reviewed');
  assert.equal(storedSubmissions[0].status, 'reviewed');
});

test('community statistics save through the admin API and are returned for public display', async () => {
  communityStatsRow = null;
  const emptyResponse = await fetch(`${baseUrl}/api/stats`);
  assert.deepEqual(await emptyResponse.json(), { community: null });

  const token = testAdminToken();
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
