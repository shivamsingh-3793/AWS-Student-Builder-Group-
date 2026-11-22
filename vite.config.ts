import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const rootDir = fileURLToPath(new URL('.', import.meta.url));
  const env = loadEnv(mode, rootDir, ['VITE_', 'NEXT_PUBLIC_']);
  const configuredApiBase =
    process.env.VITE_API_URL ||
    env.VITE_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    env.NEXT_PUBLIC_API_URL ||
    '';
  const apiBase = configuredApiBase.trim().replace(/\/+$/, '');

  return {
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],

    plugins: [
      react(),
      tailwindcss(),

      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',

        async closeBundle(error?: Error): Promise<void> {
          if (error) {
            return;
          }

          const distDir = path.resolve(rootDir, 'dist');
          const srcAssets = path.resolve(rootDir, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');

          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {
              recursive: true,
              force: true,
            });
          }

          const sitemapPath = path.join(distDir, 'sitemap.xml');
          const origin = 'https://aws-student-builder-group-tau.vercel.app';
          if (!fs.existsSync(sitemapPath)) {
            throw new Error('The static public sitemap is missing from the production build.');
          }

          if (!apiBase) {
            console.warn(
              'VITE_API_URL is not configured; the production sitemap will contain public static routes only.',
            );
            return;
          }

          let detailUrls: string[] = [];
          try {
            const apiUrl = new URL(apiBase);
            if (
              !['http:', 'https:'].includes(apiUrl.protocol) ||
              apiUrl.username ||
              apiUrl.password ||
              apiUrl.search ||
              apiUrl.hash
            ) {
              throw new Error('Invalid public API URL.');
            }

            const fetchCollection = async (pathName: string, key: string): Promise<unknown[]> => {
              const response = await fetch(`${apiBase}${pathName}`, {
                signal: AbortSignal.timeout(4000),
                headers: { Accept: 'application/json' },
              });
              if (!response.ok) {
                throw new Error(`API returned HTTP ${response.status}.`);
              }
              const payload: unknown = await response.json();
              if (
                !payload ||
                typeof payload !== 'object' ||
                !(key in payload) ||
                !Array.isArray((payload as Record<string, unknown>)[key])
              ) {
                throw new Error('API returned an invalid response.');
              }
              return (payload as Record<string, unknown[]>)[key];
            };

            const [events, posts, projects] = await Promise.all([
              fetchCollection('/api/events', 'events'),
              fetchCollection('/api/posts', 'posts'),
              fetchCollection('/api/projects', 'projects'),
            ]);
            const isRecord = (value: unknown): value is Record<string, unknown> =>
              value !== null && typeof value === 'object' && !Array.isArray(value);
            const isValidId = (value: unknown): value is number =>
              typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
            const isValidSlug = (value: unknown): value is string =>
              typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,199}$/.test(value);

            const eventUrls = events.flatMap((item) => {
              if (!isRecord(item) || item.published !== true || !isValidId(item.id)) return [];
              return [`/events/${isValidSlug(item.slug) ? item.slug : item.id}`];
            });
            const postUrls = posts.flatMap((item) => {
              if (!isRecord(item) || item.published !== true || !isValidSlug(item.slug)) return [];
              return [`/blog/${item.slug}`];
            });
            const projectUrls = projects.flatMap((item) => {
              if (
                !isRecord(item) ||
                item.published !== true ||
                !isValidId(item.id) ||
                typeof item.title !== 'string' ||
                !item.title.trim()
              ) {
                return [];
              }
              const slug = item.title.toLowerCase().trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
              return slug ? [`/projects/${slug}-${item.id}`] : [];
            });

            detailUrls = [...new Set([...eventUrls, ...postUrls, ...projectUrls])];
          } catch {
            console.warn(
              '[sitemap] CMS API unavailable, timed out, or returned invalid data; using static routes only.',
            );
          }

          const content = fs.readFileSync(sitemapPath, 'utf8');
          if (!content.includes('</urlset>')) {
            throw new Error('The static sitemap XML is malformed.');
          }
          const existingUrls = new Set(
            Array.from(content.matchAll(/<loc>(.*?)<\/loc>/g), (match) => match[1]),
          );
          const originUrls = detailUrls
            .map((url) => new URL(url, origin).href)
            .filter((url) => !existingUrls.has(url));
          const additions = originUrls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n');
          fs.writeFileSync(
            sitemapPath,
            content.replace('</urlset>', `${additions ? `${additions}\n` : ''}</urlset>`),
          );
          if (originUrls.length) {
            console.info(`Added ${originUrls.length} published CMS detail URLs to dist/sitemap.xml.`);
          }
        },
      },
    ],

    resolve: {
      alias: {
        '@': path.resolve(rootDir, '.'),
      },
    },

    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',

      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},

      // Allow Cloudflare Quick Tunnel
      allowedHosts: ['.trycloudflare.com'],
    },
  };
});