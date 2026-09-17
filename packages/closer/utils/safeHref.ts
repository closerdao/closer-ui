import { normalizeExternalHref } from './display.helpers';

const SAFE_ABSOLUTE_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Labels of letters, digits and hyphens with at least one dot: what a public
 * website or deck lives on. Non-ASCII hosts arrive punycoded from the URL
 * parser, so they pass too.
 */
const PUBLIC_HOSTNAME = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

/**
 * A link somebody typed into a form, as it should be stored: "riverbank.pt" or
 * a deck URL without a scheme becomes an absolute http(s) URL, anything that
 * cannot become one is null. Stored values are later rendered as hrefs, so
 * they leave the form absolute or not at all.
 *
 * The URL parser alone is not a validator: Chrome accepts "not a link" as the
 * host "not%20a%20link", where Node throws. The hostname check is what makes
 * the answer mean the same thing in every browser.
 */
export function normalizeLinkAnswer(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const href = getSafeHref(normalizeExternalHref(trimmed));
  if (!href) return null;
  try {
    return PUBLIC_HOSTNAME.test(new URL(href).hostname) ? href : null;
  } catch {
    return null;
  }
}

export function getSafeHref(
  raw?: string | null,
  fallback: string | null = null,
): string | null {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) {
    return fallback;
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (SAFE_ABSOLUTE_PROTOCOLS.has(url.protocol)) {
      return url.href;
    }
  } catch {
    return fallback;
  }

  return fallback;
}
