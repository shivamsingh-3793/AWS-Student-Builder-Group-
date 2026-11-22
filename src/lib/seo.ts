export const SEO_ORIGIN = 'https://aws-student-builder-group-tau.vercel.app';

export function plainText(value: string, limit = 155): string {
  const text = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

export function absoluteMediaUrl(value: string | undefined | null): string {
  if (!value) return `${SEO_ORIGIN}/src/assets/images/AWS_logo.jpeg`;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/')) return `${SEO_ORIGIN}${value}`;
  return `${SEO_ORIGIN}/${value}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
