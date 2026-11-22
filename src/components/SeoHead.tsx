import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { configApi } from '../lib/api';
import { SEO_ORIGIN } from '../lib/seo';

interface SeoHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
  breadcrumbs?: Array<{ name: string; item: string }>;
}

export function SeoHead({
  title,
  description,
  canonicalPath,
  image,
  type = 'website',
  noindex = false,
  structuredData,
  breadcrumbs,
}: SeoHeadProps) {
  const location = useLocation();

  useEffect(() => {
    const isAdminPage = window.location.pathname.startsWith('/admin');
    const pathname = canonicalPath || location.pathname;
    const canonicalUrl = `${SEO_ORIGIN}${pathname === '/' ? '/' : pathname.replace(/\/+$/, '')}`;
    const imageUrl = image && (image.startsWith('http://') || image.startsWith('https://'))
      ? image
      : image
        ? `${SEO_ORIGIN}${image.startsWith('/') ? image : `/${image}`}`
        : `${SEO_ORIGIN}/src/assets/images/AWS_logo.jpeg`;

    document.documentElement.lang = 'en';
    document.title = title;

    const ensureMeta = (attribute: 'name' | 'property', key: string) => {
      let el = document.head.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attribute, key);
        document.head.appendChild(el);
      }
      return el;
    };
    const updateMeta = (attribute: 'name' | 'property', key: string, content: string) =>
      ensureMeta(attribute, key).setAttribute('content', content);
    const updateSelectorMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };

    updateSelectorMeta('meta[name="description"]', description);
    updateMeta('name', 'robots', isAdminPage || noindex ? 'noindex, nofollow, noarchive' : 'index, follow, max-image-preview:large');
    updateMeta('property', 'og:type', type);
    updateMeta('property', 'og:site_name', 'AWS Student Builder Group');
    updateMeta('property', 'og:title', title);
    updateMeta('property', 'og:description', description);
    updateMeta('property', 'og:url', canonicalUrl);
    updateMeta('property', 'og:image', imageUrl);
    updateMeta('name', 'twitter:card', 'summary_large_image');
    updateMeta('name', 'twitter:title', title);
    updateMeta('name', 'twitter:description', description);
    updateMeta('name', 'twitter:image', imageUrl);

    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    const addJsonLd = (id: string, data: Record<string, unknown>) => {
      document.getElementById(id)?.remove();
      const script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    };

    document.getElementById('seo-breadcrumb-jsonld')?.remove();
    if (breadcrumbs?.length) {
      addJsonLd('seo-breadcrumb-jsonld', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((entry, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: entry.name,
          item: entry.item.startsWith('http') ? entry.item : `${SEO_ORIGIN}${entry.item}`,
        })),
      });
    }

    document.getElementById('seo-page-jsonld')?.remove();
    if (structuredData) {
      addJsonLd('seo-page-jsonld', {
        '@context': 'https://schema.org',
        '@graph': Array.isArray(structuredData) ? structuredData : [structuredData],
      });
    }

    if (isAdminPage) {
      let active = true;
      configApi.get()
        .then(({ cmsName }) => {
          if (!active) return;
          const configuredTitle = `${title} — ${cmsName}`;
          document.title = configuredTitle;
          updateMeta('property', 'og:title', configuredTitle);
          updateMeta('name', 'twitter:title', configuredTitle);
        })
        .catch(() => {
          if (active) document.title = title;
        });
      return () => { active = false; };
    }
  }, [title, description, canonicalPath, image, type, noindex, structuredData, breadcrumbs, location.pathname]);

  return null;
}
