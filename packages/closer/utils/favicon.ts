export const FAVICON_MASTER_SIZE = 512;

export const FAVICON_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const FAVICON_ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
];

export const FAVICON_DROPZONE_ACCEPT = FAVICON_ACCEPTED_TYPES.join(', ');

/**
 * `NEXT_PUBLIC_CDN_URL` points at the photo prefix (`.../photo/`), because
 * every other consumer builds `${cdn}${photoId}-post-md.jpg`. Favicons live in
 * their own prefix so they never collide with that naming, so swap the last
 * segment rather than asking every deployment for a second env var.
 */
export const getFaviconCdnBase = (cdnUrl?: string): string => {
  if (!cdnUrl) return '';
  const withoutTrailingSlash = cdnUrl.replace(/\/+$/, '');
  if (/\/photo$/.test(withoutTrailingSlash)) {
    return `${withoutTrailingSlash.replace(/\/photo$/, '/favicon')}/`;
  }
  return `${withoutTrailingSlash}/favicon/`;
};

export const isUploadedFileValue = (value: string): boolean =>
  value.startsWith('http') || value.startsWith('/');

export type FaviconLinks =
  | { kind: 'file'; png: string }
  | { kind: 'id'; png32: string; png180: string; png192: string; ico: string };

/**
 * The stored `general.favicon` holds one of two shapes: a plain URL, written by
 * the `/upload/file` fallback, or an id from `/upload/favicon`, from which the
 * generated size set is derived. See docs/tickets/favicon-upload-ui.md.
 */
export const getFaviconLinks = (
  value: string | undefined | null,
  cdnUrl?: string,
): FaviconLinks | null => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return null;

  if (isUploadedFileValue(trimmed)) {
    return { kind: 'file', png: trimmed };
  }

  const base = getFaviconCdnBase(cdnUrl);
  if (!base) return null;

  return {
    kind: 'id',
    png32: `${base}${trimmed}-32.png`,
    png180: `${base}${trimmed}-180.png`,
    png192: `${base}${trimmed}-192.png`,
    ico: `${base}${trimmed}.ico`,
  };
};

/** The smallest rendition available, for admin previews. */
export const getFaviconPreviewUrl = (
  value: string | undefined | null,
  cdnUrl?: string,
): string | null => {
  const links = getFaviconLinks(value, cdnUrl);
  if (!links) return null;
  return links.kind === 'file' ? links.png : links.png32;
};

/**
 * A missing endpoint, not a rejected upload — the signal to fall back to
 * `/upload/file`. Mirrors the convention in `subscriptionActions.ts`.
 */
export const isEndpointMissingStatus = (status?: number): boolean =>
  status === 404 || status === 405 || status === 501;
