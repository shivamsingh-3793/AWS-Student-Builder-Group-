# Stratus Builders — AWS Cloud Engineering Community

A full-stack, animated AWS Student & Cloud Engineering Community platform and private CMS built with React, TypeScript, Tailwind CSS, Motion, Express, and Supabase.

## Visual Identity
- **Primary Brand Green**: `#00E582`
- **Primary Dark**: `#151B24`
- **Light Canvas**: `#F5F7F6`
- **Dual Theme**: Persistent Dark & Light modes (`@custom-variant dark`)

## Architecture
```
/
├── server.ts                 # Unified Express API + Vite dev/static server (Port 3000)
├── backend/
│   ├── config.ts             # Server-only administrator configuration
│   ├── middleware/           # JWT sessions, rate limits, headers/CORS, image validation
│   ├── routes/               # Express APIs; mutations require server authorization
│   ├── storage.ts            # Supabase Storage image operations
│   └── .env                  # Local secrets (ignored by Git)
├── supabase/
│   ├── schema.sql            # Fresh database schema and RLS grants
│   └── security-hardening.sql # Existing database session/audit migration
└── src/
    ├── lib/api.ts            # Centralized API client (uses VITE_API_URL or same-origin)
    ├── context/ThemeContext.tsx
    ├── components/           # Reusable animated editorial components + CustomCursor
    └── pages/
        ├── HomePage.tsx, AboutPage.tsx, EventsPage.tsx, EventDetailPage.tsx
        ├── ProjectsPage.tsx, ProjectDetailPage.tsx, BlogPage.tsx, BlogPostPage.tsx
        ├── GalleryPage.tsx, ContactPage.tsx
        └── admin/            # Private CMS (/admin) hidden from public navigation
```

## Development & Build Commands

Install dependencies:
```bash
npm install
```

Run development server (Express API + Vite frontend on port 3000):
```bash
npm run dev
```

Build production frontend bundle:
```bash
npm run build
```

Run production server:
```bash
npm start
```

Run the TypeScript and backend authorization checks:
```bash
npm run lint
npm run test:security
```

## API access policy

| Route | Access |
|---|---|
| `GET /api/health`, `GET /api/config` | Public |
| `POST /api/auth/login` | Public; IP/account rate limited |
| `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/change-password` | Authenticated admin |
| `GET /api/events`, `/api/posts`, `/api/projects` and detail routes | Public published content; drafts require a valid admin session |
| `POST`, `PUT`, `DELETE /api/events/*`, `/api/posts/*`, `/api/projects/*` | Admin only |
| `GET /api/gallery` | Public |
| `POST`, `PUT`, `DELETE /api/gallery/*` | Admin only |
| `GET /api/team` | Public active members; inactive/all records require admin |
| `POST`, `PUT`, `PATCH`, `DELETE /api/team/*` | Admin only |
| `GET /api/stats` | Public community counters; authenticated admins also receive CMS metrics |
| `PUT /api/stats` | Admin only |
| `POST /api/community/join`, `POST /api/community/contact` | Public; rate limited and validated |
| `GET /api/community/submissions` | Admin only |
| `POST /api/upload` | Admin only; rate limited, 5 MB limit, image signature checked |
| `/uploads/*` | Public static legacy media |

Supabase RLS is enabled on application tables, with direct `anon`/`authenticated`
table access revoked. The Express server uses the service-role key and enforces
authorization itself; never expose that key to the browser.

## Required server environment

Create `backend/.env` from `backend/.env.example` and set `ADMIN_NAME`,
`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET`, `SUPABASE_URL`, and
`SUPABASE_SERVICE_ROLE_KEY`. Use a unique random JWT secret with at least 32
characters and an administrator password of at least 12 characters in production.
Set `CORS_ALLOWED_ORIGINS` to a comma-separated list of exact production origins
when the API is called cross-origin. Set `TRUST_PROXY_HOPS` only to match the
known reverse-proxy topology. Do not copy secret values into Vite-prefixed
variables.

Generate a signing secret locally with:
```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

For an existing Supabase database, apply `supabase/security-hardening.sql` before
deploying the server. Apply `supabase/community-submissions.sql` as well to add
the admin-only submission status and paginated inbox query without changing or
deleting existing submissions. For a new database, use the updated
`supabase/schema.sql`. Configure `NODE_ENV=production` in the deployment
environment and terminate HTTPS at a trusted proxy; set `TRUST_PROXY_HOPS` to
that proxy count so secure headers and client IP rate limits work as intended.

## Private Admin CMS

Open `/admin` or `/admin/login`. Admin tokens are held in browser session storage,
expire after one hour, and are revoked server-side on logout. The database stores
administrator passwords as bcrypt hashes. No default administrator credentials
are published; configure a private password through the server environment.
