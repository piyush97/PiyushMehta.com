export const SOCIAL_CARD_SIZE = {
  width: 1200,
  height: 630,
} as const;

export const SOCIAL_CARD_CONTENT_TYPE = 'image/png';

export type SocialCardKind = 'website' | 'article' | 'project';
export type SocialCardTemplate =
  | 'default'
  | 'modern'
  | 'minimal'
  | 'tech'
  | 'blog'
  | 'professional';
export type SocialCardTheme = 'dark' | 'light' | 'retro';

export interface SocialCardData {
  title: string;
  description?: string;
  type?: SocialCardKind;
  template?: SocialCardTemplate;
  theme?: SocialCardTheme;
  author?: string;
  date?: string | Date;
  tags?: string[];
  readingTime?: string;
  path?: string;
  domain?: string;
}

export interface SocialCardMetadata {
  url: string;
  secureUrl: string;
  alt: string;
  width: number;
  height: number;
  type: string;
}

export const STATIC_SOCIAL_PAGES: Record<string, SocialCardData> = {
  home: {
    title: 'Piyush Mehta - Senior Software Engineer',
    description:
      'Reliable web platforms, enterprise AI workflows, product systems, and technical writing from a software engineer in Canada.',
    type: 'website',
    template: 'professional',
    tags: ['TypeScript', 'AI Workflows', 'Architecture'],
    path: '/',
  },
  blog: {
    title: 'Writing - Piyush Mehta',
    description:
      'Technical writing on software architecture, web platforms, migrations, developer systems, and AI workflows.',
    type: 'website',
    template: 'blog',
    tags: ['Architecture', 'Web Platforms', 'AI'],
    path: '/blog',
  },
  projects: {
    title: 'Work - Piyush Mehta',
    description:
      'Selected case studies, architecture tradeoffs, and engineering outcomes across product and platform work.',
    type: 'project',
    template: 'tech',
    tags: ['Case Studies', 'Platform', 'Delivery'],
    path: '/projects',
  },
  about: {
    title: 'About - Piyush Mehta',
    description:
      'Senior software engineer focused on dependable systems, AI workflow delivery, and developer education.',
    type: 'website',
    template: 'professional',
    tags: ['Engineering', 'AI', 'Teaching'],
    path: '/about',
  },
  resume: {
    title: 'Resume - Piyush Mehta',
    description:
      'Experience, roles, skills, credentials, and selected impact from Piyush Mehta, senior software engineer.',
    type: 'website',
    template: 'professional',
    tags: ['Resume', 'Experience', 'Canada'],
    path: '/resume',
  },
  services: {
    title: 'Services - Piyush Mehta',
    description:
      'Architecture reviews, AI workflow implementation, web platform engineering, and developer education.',
    type: 'website',
    template: 'professional',
    tags: ['Architecture', 'AI', 'Web Platforms'],
    path: '/services',
  },
  'react-developer': {
    title: 'React Developer - Piyush Mehta',
    description:
      'React, Astro, TypeScript, and frontend architecture work for durable product interfaces.',
    type: 'website',
    template: 'tech',
    tags: ['React', 'TypeScript', 'Frontend'],
    path: '/react-developer',
  },
  uses: {
    title: 'Uses - Piyush Mehta',
    description:
      'Tools, systems, and setup choices for daily engineering, infrastructure, writing, and teaching.',
    type: 'website',
    template: 'minimal',
    tags: ['Tools', 'Setup', 'Workflow'],
    path: '/uses',
  },
  videos: {
    title: 'Videos - Piyush Mehta',
    description:
      'Developer education videos and technical walkthroughs on backend, frontend, testing, and metadata.',
    type: 'website',
    template: 'tech',
    tags: ['Videos', 'Teaching', 'Web Development'],
    path: '/videos',
  },
  'contact-me': {
    title: 'Contact - Piyush Mehta',
    description:
      'Start a focused conversation about engineering leadership, AI workflows, web platforms, or technical education.',
    type: 'website',
    template: 'professional',
    tags: ['Contact', 'Consulting', 'Engineering'],
    path: '/contact-me',
  },
  'og-showcase': {
    title: 'Open Graph Preview - Piyush Mehta',
    description:
      'A preview surface for social cards across link-sharing platforms and messaging apps.',
    type: 'website',
    template: 'minimal',
    tags: ['Open Graph', 'Preview', 'Metadata'],
    path: '/og-showcase',
  },
  newsletter: {
    title: 'Newsletter - Piyush Mehta',
    description:
      'Subscribe for occasional notes on software architecture, AI workflows, and web platforms.',
    type: 'website',
    template: 'minimal',
    tags: ['Newsletter', 'Writing', 'Updates'],
    path: '/newsletter',
  },
  'privacy-policy': {
    title: 'Privacy Policy - Piyush Mehta',
    description: 'How piyushmehta.com collects, uses, and protects your information.',
    type: 'website',
    template: 'minimal',
    tags: ['Privacy', 'Policy', 'Legal'],
    path: '/privacy-policy',
  },
  'terms-of-service': {
    title: 'Terms of Service - Piyush Mehta',
    description: 'The terms that govern use of piyushmehta.com.',
    type: 'website',
    template: 'minimal',
    tags: ['Terms', 'Policy', 'Legal'],
    path: '/terms-of-service',
  },
  '404': {
    title: "404 \u2013 Page Not Found \u00b7 Piyush Mehta",
    description: "This page doesn't exist.",
    type: 'website',
    template: 'minimal',
    tags: ['Not Found'],
    path: '/404',
  },
  default: {
    title: 'Piyush Mehta - Senior Software Engineer',
    description:
      'Reliable web platforms, enterprise AI workflows, product systems, and technical writing from a software engineer in Canada.',
    type: 'website',
    template: 'professional',
    tags: ['TypeScript', 'AI Workflows', 'Architecture'],
    path: '/',
  },
};

/** Guaranteed to exist in STATIC_SOCIAL_PAGES; the fallback card for any page without one. */
export const DEFAULT_SOCIAL_CARD_KEY = 'default';

export function normalizePathname(pathname = '/'): string {
  const withoutQuery = pathname.split('?')[0]?.split('#')[0] || '/';
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  const withoutTrailingSlash =
    withLeadingSlash !== '/' ? withLeadingSlash.replace(/\/+$/, '') : withLeadingSlash;

  return withoutTrailingSlash || '/';
}

export function pageKeyFromPathname(pathname = '/'): string {
  const normalized = normalizePathname(pathname);

  if (normalized === '/') {
    return 'home';
  }

  return normalized.replace(/^\/+/, '').replace(/\/+/g, '/');
}

export function socialCardPathForKey(key: string): string {
  const segments = key.split('/').filter(Boolean).map(encodeURIComponent);

  return `/og/${segments.join('/')}.png`;
}

/**
 * @deprecated Optimistic \u2014 builds a path for any pathname without verifying a card was
 * actually prerendered for it. Prefer `resolveSocialCardForPathname`, which is backed by the
 * build's social-card manifest and always resolves to a key that exists. Kept for callers (and
 * tests) that need a path with no manifest available.
 */
export function getSocialCardPathForPathname(pathname = '/'): string {
  return socialCardPathForKey(pageKeyFromPathname(pathname));
}

export function getSocialCardUrlForPathname(pathname: string, baseUrl: string): string {
  return new URL(getSocialCardPathForPathname(pathname), baseUrl).toString();
}

export interface SocialCardManifestLookup {
  has(key: string): boolean;
  get(key: string): { key: string; version: string } | undefined;
}

export interface ResolvedSocialCard {
  key: string;
  path: string;
  version: string;
  /** True when no dedicated card existed and this resolved to DEFAULT_SOCIAL_CARD_KEY. */
  isFallback: boolean;
}

/**
 * Resolve a pathname to a card that is guaranteed to exist in the given manifest. Falls back to
 * the lowercase form of the key (rescues legacy mixed-case URLs) and finally to the `default`
 * card, so this can never point at a card that was not prerendered.
 */
export function resolveSocialCardForPathname(
  pathname: string,
  manifest: SocialCardManifestLookup,
): ResolvedSocialCard {
  const key = pageKeyFromPathname(pathname);
  const lowerKey = key.toLowerCase();
  const hit = manifest.get(key) ?? (lowerKey !== key ? manifest.get(lowerKey) : undefined);
  const entry = hit ?? manifest.get(DEFAULT_SOCIAL_CARD_KEY);

  if (!entry) {
    throw new Error(
      `Social card manifest has no "${DEFAULT_SOCIAL_CARD_KEY}" entry \u2014 /og/${DEFAULT_SOCIAL_CARD_KEY}.png would 404.`,
    );
  }

  return {
    key: entry.key,
    path: `${socialCardPathForKey(entry.key)}?v=${entry.version}`,
    version: entry.version,
    isFallback: !hit,
  };
}

export function createSocialCardMetadata(params: {
  pathname: string;
  baseUrl: string;
  title: string;
  author?: string;
  manifest?: SocialCardManifestLookup;
}): SocialCardMetadata {
  const path = params.manifest
    ? resolveSocialCardForPathname(params.pathname, params.manifest).path
    : getSocialCardPathForPathname(params.pathname);
  const url = new URL(path, params.baseUrl).toString();
  const author = params.author || 'Piyush Mehta';

  return {
    url,
    secureUrl: url.replace(/^http:\/\//, 'https://'),
    alt: `${params.title} - social preview by ${author}`,
    width: SOCIAL_CARD_SIZE.width,
    height: SOCIAL_CARD_SIZE.height,
    type: SOCIAL_CARD_CONTENT_TYPE,
  };
}

// Bump this whenever social-card-renderer.ts changes visual output (fonts, layout, templates,
// truncation budgets). It is folded into every card's version hash, so a single bump rotates
// every /og/**.png URL and forces LinkedIn/X/Facebook/Slack/Discord/WhatsApp to re-fetch instead
// of continuing to serve a stale (or, historically, blank) cached image.
export const SOCIAL_CARD_RENDERER_VERSION = '2026-08-27.1';

/** Deterministic 8-hex-char change-detection hash (FNV-1a). Not for security, just cache-busting. */
export function hashSocialCardVersion(key: string, seed: string): string {
  const input = `${SOCIAL_CARD_RENDERER_VERSION}|${key}|${seed}`;
  let hash = 0x811c9dc5;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function decodeSocialCardParams(value?: string): string[] {
  const clean = (value || 'home').replace(/^\/+|\/+$/g, '').replace(/\.png$/i, '');

  if (!clean) {
    return ['home'];
  }

  return clean
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });
}

export function getStaticSocialCardData(key: string): SocialCardData {
  const normalizedKey = key.replace(/^\/+|\/+$/g, '') || 'home';
  const data = STATIC_SOCIAL_PAGES[normalizedKey];

  if (data) {
    return data;
  }

  const title = `${titleFromSlug(normalizedKey)} - Piyush Mehta`;

  return {
    title,
    description:
      'Software engineering notes, project context, and technical work from Piyush Mehta.',
    type: 'website',
    template: 'professional',
    tags: ['Software Engineering', 'TypeScript', 'Architecture'],
    path: `/${normalizedKey}`,
  };
}

export function getSocialCardDataFromSearchParams(params: URLSearchParams): SocialCardData {
  const title = cleanText(params.get('title')) || 'Piyush Mehta';
  const description = cleanText(params.get('description')) || 'Senior Software Engineer in Canada';
  const rawType = params.get('type') || 'website';
  const type = rawType === 'article' || rawType === 'project' ? rawType : 'website';

  return {
    title,
    description,
    type,
    template: normalizeTemplate(params.get('template')),
    theme: normalizeTheme(params.get('theme')),
    date: params.get('date') || undefined,
    tags: parseTags(params.get('tags')),
    readingTime: cleanText(params.get('readingTime')) || undefined,
    path: params.get('path') || undefined,
  };
}

export function normalizeTemplate(value?: string | null): SocialCardTemplate {
  switch ((value || '').toLowerCase()) {
    case 'minimal':
      return 'minimal';
    case 'tech':
    case 'terminal':
    case 'cyber':
    case 'dark':
      return 'tech';
    case 'blog':
      return 'blog';
    case 'professional':
      return 'professional';
    case 'modern':
    case 'gradient':
    case 'syntax':
    case 'default':
    default:
      return 'modern';
  }
}

export function normalizeTheme(value?: string | null): SocialCardTheme {
  switch ((value || '').toLowerCase()) {
    case 'light':
      return 'light';
    case 'retro':
      return 'retro';
    case 'auto':
    case 'dark':
    default:
      return 'dark';
  }
}

export function parseTags(value?: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .flatMap((tag) => {
      const cleaned = cleanText(tag);
      return cleaned ? [cleaned] : [];
    })
    .slice(0, 4);
}

export function cleanText(value?: string | null): string {
  return (value || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
}

export function truncateText(value: string | undefined, maxLength: number): string {
  const clean = cleanText(value);

  if (clean.length <= maxLength) {
    return clean;
  }

  const clipped = clean.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.72) {
    return `${clipped.slice(0, lastSpace)}...`;
  }

  return `${clipped}...`;
}

/**
 * Like truncateText, but prefers cutting at a sentence boundary (. ! ?) within budget so
 * descriptions don't end mid-thought ("...and the shocking reason they can lie to..."). Falls
 * back to truncateText's word-boundary behaviour when no sentence end falls in range.
 */
export function truncateToSentence(value: string | undefined, maxLength: number): string {
  const clean = cleanText(value);

  if (clean.length <= maxLength) {
    return clean;
  }

  const clipped = clean.slice(0, maxLength);
  const lastSentenceEnd = Math.max(
    clipped.lastIndexOf('. '),
    clipped.lastIndexOf('! '),
    clipped.lastIndexOf('? '),
  );

  if (lastSentenceEnd > maxLength * 0.5) {
    return clipped.slice(0, lastSentenceEnd + 1);
  }

  return truncateText(value, maxLength);
}

export function formatSocialDate(value?: string | Date): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Toronto',
  });
}

export function titleFromSlug(slug: string): string {
  return (
    slug
      .split('/')
      .pop()
      ?.replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim() || 'Piyush Mehta'
  );
}
