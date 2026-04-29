import DOMPurify from 'isomorphic-dompurify';

export function sanitizeSubscriptionPerkHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['a', 'b', 'strong', 'em', 'i', 'u', 'br', 'span'],
    ALLOWED_ATTR: ['href', 'class', 'target', 'rel', 'title'],
    ALLOW_DATA_ATTR: false,
  });
}
