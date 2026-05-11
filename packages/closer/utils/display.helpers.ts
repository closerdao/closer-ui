export function truncateHexAddress(
  address: string,
  head = 6,
  tail = 4,
): string {
  const trimmed = address?.trim();
  if (!trimmed) {
    return '';
  }
  if (trimmed.length <= head + tail) {
    return trimmed;
  }
  return `${trimmed.slice(0, head)}…${trimmed.slice(-tail)}`;
}

export function isHexAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export function normalizeExternalHref(raw: string): string {
  const t = raw.trim();
  if (!t) {
    return '';
  }
  if (/^mailto:/i.test(t)) {
    return t;
  }
  if (/^\/(?!\/)/.test(t)) {
    return t;
  }
  if (/^https?:\/\//i.test(t)) {
    return t;
  }
  if (/^\/\//.test(t)) {
    return `https:${t}`;
  }
  return `https://${t}`;
}

export function getUrlDisplayString(raw: string, maxLen = 40): string {
  const t = raw.trim();
  if (!t) {
    return '';
  }
  try {
    const u = new URL(normalizeExternalHref(t));
    const host = u.hostname.replace(/^www\./, '');
    const path = u.pathname === '/' ? '' : u.pathname;
    const query = u.search;
    const core = `${host}${path}${query}` || host;
    if (core.length <= maxLen) {
      return core;
    }
    const take = Math.max(4, Math.floor((maxLen - 1) / 2));
    return `${core.slice(0, take)}…${core.slice(-take)}`;
  } catch {
    if (t.length <= maxLen) {
      return t;
    }
    const take = Math.max(4, Math.floor((maxLen - 1) / 2));
    return `${t.slice(0, take)}…${t.slice(-take)}`;
  }
}

export type InlineSegment =
  | { type: 'text'; value: string }
  | { type: 'wallet'; value: string }
  | { type: 'email'; value: string }
  | { type: 'url'; value: string };

const INLINE_SOURCE =
  '(0x[a-fA-F0-9]{40})|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})|(https?:\\/\\/[^\\s<]+)';

export function looksLikePlainSocialPost(content: string): boolean {
  const t = content.trim();
  if (!t) {
    return true;
  }
  return !/<[a-z][\s/.!?*=]*>/i.test(t);
}

export function parseInlineSegments(text: string): InlineSegment[] {
  if (!text) {
    return [];
  }
  const segments: InlineSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(INLINE_SOURCE, 'g');
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      segments.push({ type: 'text', value: text.slice(last, m.index) });
    }
    if (m[1]) {
      segments.push({ type: 'wallet', value: m[1] });
    } else if (m[2]) {
      segments.push({ type: 'email', value: m[2] });
    } else if (m[3]) {
      const url = m[3].replace(/[),.;:!?]+$/g, '');
      segments.push({ type: 'url', value: url });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    segments.push({ type: 'text', value: text.slice(last) });
  }
  return segments;
}
