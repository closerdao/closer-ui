import { getSafeHref } from '../safeHref';

describe('getSafeHref', () => {
  it('allows relative same-origin paths', () => {
    expect(getSafeHref('/pdf/report.pdf')).toBe('/pdf/report.pdf');
    expect(getSafeHref('/dataroom/tdf-area-map.kml')).toBe(
      '/dataroom/tdf-area-map.kml',
    );
  });

  it('allows http and https absolute urls', () => {
    expect(getSafeHref('https://example.com/doc.pdf')).toBe(
      'https://example.com/doc.pdf',
    );
    expect(getSafeHref('http://example.com/doc.pdf')).toBe(
      'http://example.com/doc.pdf',
    );
  });

  it('rejects javascript and other unsafe schemes', () => {
    expect(getSafeHref('javascript:alert(1)')).toBeNull();
    expect(getSafeHref('JAVASCRIPT:alert(1)')).toBeNull();
    expect(getSafeHref('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(getSafeHref('vbscript:msgbox(1)')).toBeNull();
  });

  it('rejects protocol-relative urls', () => {
    expect(getSafeHref('//evil.example/phish')).toBeNull();
  });

  it('returns fallback for empty or invalid values', () => {
    expect(getSafeHref('')).toBeNull();
    expect(getSafeHref('   ')).toBeNull();
    expect(getSafeHref(undefined)).toBeNull();
    expect(getSafeHref('not a url', '#')).toBe('#');
    expect(getSafeHref('javascript:void(0)', '#')).toBe('#');
  });
});
