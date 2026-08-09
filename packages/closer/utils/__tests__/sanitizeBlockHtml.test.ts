import { sanitizeBlockHtml } from '../sanitizeBlockHtml';

describe('sanitizeBlockHtml', () => {
  it('preserves safe rich-text markup', () => {
    const html =
      '<p class="ql-align-center">Hello <strong>world</strong> <a href="https://example.com">link</a></p>';
    expect(sanitizeBlockHtml(html)).toBe(html);
  });

  it('strips script tags and event handlers', () => {
    const html =
      '<p onclick="alert(1)">Safe</p><script>alert(2)</script><img src=x onerror="alert(3)">';
    const sanitized = sanitizeBlockHtml(html);
    expect(sanitized).not.toMatch(/script/i);
    expect(sanitized).not.toMatch(/onclick/i);
    expect(sanitized).not.toMatch(/onerror/i);
    expect(sanitized).toContain('<p>Safe</p>');
  });

  it('strips javascript: URLs', () => {
    const sanitized = sanitizeBlockHtml(
      '<a href="javascript:alert(1)">click</a>',
    );
    expect(sanitized).not.toMatch(/javascript:/i);
    expect(sanitized).toContain('<a>click</a>');
  });
});
