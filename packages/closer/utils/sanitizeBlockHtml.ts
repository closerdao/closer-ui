import sanitizeHtml from 'sanitize-html';

export function sanitizeBlockHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'a',
      'b',
      'strong',
      'em',
      'i',
      'u',
      's',
      'strike',
      'br',
      'span',
      'p',
      'div',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'hr',
      'img',
    ],
    allowedAttributes: {
      '*': ['class'],
      a: ['href', 'name', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https'],
    },
    allowProtocolRelative: false,
  });
}
