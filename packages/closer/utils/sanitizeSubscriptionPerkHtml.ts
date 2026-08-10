import sanitizeHtml from 'sanitize-html';

export function sanitizeSubscriptionPerkHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['a', 'b', 'strong', 'em', 'i', 'u', 'br', 'span'],
    allowedAttributes: {
      '*': ['class'],
      a: ['href', 'class', 'target', 'rel', 'title'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
  });
}
