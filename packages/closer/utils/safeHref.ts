const SAFE_ABSOLUTE_PROTOCOLS = new Set(['http:', 'https:']);

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
