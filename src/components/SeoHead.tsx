import { useEffect } from 'react';
import { configApi } from '../lib/api';

interface SeoHeadProps {
  title: string;
  description: string;
}

export function SeoHead({ title, description }: SeoHeadProps) {
  useEffect(() => {
    const isAdminPage = window.location.pathname.startsWith('/admin');
    const defaultBrand = isAdminPage ? 'AWS Student Builder Group CMS' : 'AWS Student Builder Group';
    const fullTitle = `${title} — ${defaultBrand}`;
    document.title = fullTitle;

    const updateMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) {
        el.setAttribute('content', content);
      }
    };

    updateMeta('meta[name="description"]', description);
    updateMeta('meta[property="og:title"]', fullTitle);
    updateMeta('meta[property="og:description"]', description);
    updateMeta('meta[name="twitter:title"]', fullTitle);
    updateMeta('meta[name="twitter:description"]', description);

    if (isAdminPage) {
      let active = true;
      configApi.get()
        .then(({ cmsName }) => {
          if (!active) return;
          const configuredTitle = `${title} — ${cmsName}`;
          document.title = configuredTitle;
          updateMeta('meta[property="og:title"]', configuredTitle);
          updateMeta('meta[name="twitter:title"]', configuredTitle);
        })
        .catch(() => {
          if (active) document.title = fullTitle;
        });
      return () => {
        active = false;
      };
    }
  }, [title, description]);

  return null;
}
