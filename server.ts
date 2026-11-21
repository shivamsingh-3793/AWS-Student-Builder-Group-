import './backend/config.ts';
import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { requireAuth } from './backend/middleware/auth.ts';
import { uploadImage, UPLOADS_DIR, UploadValidationError } from './backend/middleware/upload.ts';
import { asyncRoute, verifySupabaseConnection } from './backend/supabase.ts';
import { uploadPublicImage, type MediaScope } from './backend/storage.ts';
import { corsPolicy, securityHeaders } from './backend/middleware/security.ts';
import { uploadRateLimit } from './backend/middleware/rateLimit.ts';
import { InputValidationError } from './backend/validation.ts';
import { writeAdminAudit } from './backend/audit.ts';
import type { AuthenticatedRequest } from './backend/middleware/auth.ts';
import authRoutes from './backend/routes/auth.ts';
import eventsRoutes from './backend/routes/events.ts';
import postsRoutes from './backend/routes/posts.ts';
import projectsRoutes from './backend/routes/projects.ts';
import galleryRoutes from './backend/routes/gallery.ts';
import teamRoutes from './backend/routes/team.ts';
import statsRoutes from './backend/routes/stats.ts';
import communityRoutes from './backend/routes/community.ts';
import { getBackendConfig } from './backend/config.ts';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

async function startServer() {
  await verifySupabaseConnection();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
  if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0 || trustProxyHops > 5) {
    throw new Error('TRUST_PROXY_HOPS must be an integer from 0 to 5.');
  }
  app.set('trust proxy', trustProxyHops);

  app.use(securityHeaders);
  app.use(corsPolicy);
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false, limit: '32kb' }));

  // Serve uploaded images at /uploads
  app.use('/uploads', express.static(UPLOADS_DIR, {
    dotfiles: 'deny',
    index: false,
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    },
  }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/config', (_req, res) => {
    res.json({ cmsName: getBackendConfig().cmsName });
  });

  // Shared authenticated single-image upload endpoint for CMS-managed media
  app.post('/api/upload', requireAuth, uploadRateLimit, uploadImage.single('image'), asyncRoute(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided.' });
      return;
    }
    if (Object.keys(req.query).some((key) => key !== 'scope')) {
      res.status(400).json({ error: 'Unexpected query parameter.' });
      return;
    }
    const scopes: MediaScope[] = ['events', 'posts', 'projects', 'gallery', 'team'];
    if (req.query.scope !== undefined && typeof req.query.scope !== 'string') {
      res.status(400).json({ error: 'Invalid image destination.' });
      return;
    }
    if (Object.keys(req.body || {}).length > 0) {
      res.status(400).json({ error: 'Unexpected upload field.' });
      return;
    }
    const requestedScope = typeof req.query.scope === 'string' ? req.query.scope : 'events';
    if (!scopes.includes(requestedScope as MediaScope)) {
      res.status(400).json({ error: 'Invalid image destination.' });
      return;
    }
    const uploaded = await uploadPublicImage(req.file, requestedScope as MediaScope);
    await writeAdminAudit(req as AuthenticatedRequest, 'media.upload', requestedScope, uploaded.filename);
    res.status(201).json({
      url: uploaded.url,
      filename: uploaded.filename,
      size: uploaded.size,
    });
  }));

  // REST API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventsRoutes);
  app.use('/api/posts', postsRoutes);
  app.use('/api/projects', projectsRoutes);
  app.use('/api/gallery', galleryRoutes);
  app.use('/api/team', teamRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/community', communityRoutes);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API route not found.' });
  });

  // Express error middleware (catches request parsing, Multer, validation, and route errors)
  app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logServerError(err, true);
    if (err instanceof InputValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'File exceeds maximum allowed size of 5MB.' });
        return;
      }
      res.status(400).json({ error: 'The uploaded file could not be accepted.' });
      return;
    }
    if (err instanceof UploadValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    const status = Number((err as Error & { status?: number }).status);
    if (status >= 400 && status < 500) {
      res.status(status).json({ error: 'The request could not be processed.' });
      return;
    }
    res.status(500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'An unexpected server error occurred.'
        : err.message || 'An unexpected server error occurred.',
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build artifacts not found. Run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Stratus Builders server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  logServerError(err);
  process.exit(1);
});

function logServerError(error: unknown, requestError = false): void {
  const status = requestError && error instanceof Error
    ? Number((error as Error & { status?: number }).status)
    : 0;
  const raw = requestError && status >= 400 && status < 500
    ? `${error instanceof Error ? error.name : 'RequestError'} (HTTP ${status})`
    : error instanceof Error ? error.stack || error.message : String(error);
  let diagnostic = raw;
  for (const [name, value] of Object.entries(process.env)) {
    if (!/(SECRET|KEY|TOKEN|PASSWORD|CREDENTIAL)/i.test(name) || !value || value.length < 4) continue;
    diagnostic = diagnostic.split(value).join('[REDACTED]');
  }
  console.error('Server diagnostic:', diagnostic);
}
