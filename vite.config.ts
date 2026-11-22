import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const rootDir = fileURLToPath(new URL('.', import.meta.url));
  const env = loadEnv(mode, rootDir, '');
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

          const apiUrl = new URL(apiBase);
          if (
            !['http:', 'https:'].includes(apiUrl.protocol) ||
            apiUrl.username ||
            apiUrl.password ||
            apiUrl.search ||
            apiUrl.hash
          ) {
            throw new Error('VITE_API_URL must be a public HTTP(S) API base URL without credentials or query parameters.');
          }

          const fetchCollection = async <T,>(pathName: string, key: string): Promise<T[]> => {
            const response = await fetch(`${apiBase}${pathName}`, {
              signal: AbortSignal.timeout(15000),
              headers: { Accept: 'application/json' },
            });
            if (!response.ok) {
              throw new Error(`CMS sitemap request failed with status ${response.status}.`);
            }
            const payload: unknown = await response.json();
            if (
              !payload ||
              typeof payload !== 'object' ||
              !(key in payload) ||
              !Array.isArray((payload as Record<string, unknown>)[key])
            ) {
              throw new Error(`CMS sitemap response for ${pathName} was invalid.`);
            }
            return (payload as Record<string, T[]>)[key];
          };

          try {
            const [events, posts, projects] = await Promise.all([
              fetchCollection<{ id: number; slug?: string }>('/api/events', 'events'),
              fetchCollection<{ slug: string }>('/api/posts', 'posts'),
              fetchCollection<{ id: number; title: string }>('/api/projects', 'projects'),
            ]);
            const validId = (id: number) => Number.isSafeInteger(id) && id > 0;
            const eventUrls = events.map((event) => {
              if (!validId(event.id) || (event.slug && !/^[a-z0-9][a-z0-9-]{0,199}$/.test(event.slug))) {
                throw new Error('CMS returned an invalid published event for the sitemap.');
              }
              return `/events/${event.slug || event.id}`;
            });
            const postUrls = posts.map((post) => {
              if (!/^[a-z0-9][a-z0-9-]{0,199}$/.test(post.slug)) {
                throw new Error('CMS returned an invalid published post for the sitemap.');
              }
              return `/blog/${post.slug}`;
            });
            const projectUrls = projects.map((project) => {
              if (!validId(project.id) || typeof project.title !== 'string' || !project.title.trim()) {
                throw new Error('CMS returned an invalid published project for the sitemap.');
              }
              const slug = project.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
              return `/projects/${slug}-${project.id}`;
            });

            const content = fs.readFileSync(sitemapPath, 'utf8');
            if (!content.includes('</urlset>')) {
              throw new Error('The static sitemap XML is malformed.');
            }
            const existingUrls = new Set(
              Array.from(content.matchAll(/<loc>(.*?)<\/loc>/g), (match) => match[1]),
            );
            const detailUrls = [...new Set([...eventUrls, ...postUrls, ...projectUrls])]
              .map((url) => new URL(url, origin).href)
              .filter((url) => !existingUrls.has(url));
            const additions = detailUrls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n');
            fs.writeFileSync(
              sitemapPath,
              content.replace('</urlset>', `${additions ? `${additions}\n` : ''}</urlset>`),
            );
            console.info(`Added ${detailUrls.length} published CMS detail URLs to dist/sitemap.xml.`);
          } catch (error) {
            throw new Error(
              `Unable to include published CMS URLs in dist/sitemap.xml: ${
                error instanceof Error ? error.message : 'Unknown API error.'
              }`,
            );
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