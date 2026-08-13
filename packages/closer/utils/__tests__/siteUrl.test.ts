import { getSiteUrl } from '../siteUrl';

describe('getSiteUrl', () => {
  const originalValue = process.env.NEXT_PUBLIC_PLATFORM_URL;

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.NEXT_PUBLIC_PLATFORM_URL;
    } else {
      process.env.NEXT_PUBLIC_PLATFORM_URL = originalValue;
    }
  });

  it('returns the configured platform URL', () => {
    process.env.NEXT_PUBLIC_PLATFORM_URL = 'https://example-village.com';
    expect(getSiteUrl()).toBe('https://example-village.com');
  });

  it('prepends https:// when the configured value has no scheme', () => {
    process.env.NEXT_PUBLIC_PLATFORM_URL = 'example-village.com';
    expect(getSiteUrl()).toBe('https://example-village.com');
  });

  it('keeps an explicit http:// scheme', () => {
    process.env.NEXT_PUBLIC_PLATFORM_URL = 'http://localhost:3000';
    expect(getSiteUrl()).toBe('http://localhost:3000');
  });

  it('strips trailing slashes', () => {
    process.env.NEXT_PUBLIC_PLATFORM_URL = 'https://example-village.com/';
    expect(getSiteUrl()).toBe('https://example-village.com');
  });

  it('returns an empty string when NEXT_PUBLIC_PLATFORM_URL is unset', () => {
    delete process.env.NEXT_PUBLIC_PLATFORM_URL;
    expect(getSiteUrl()).toBe('');
  });

  it('returns an empty string when NEXT_PUBLIC_PLATFORM_URL is empty', () => {
    process.env.NEXT_PUBLIC_PLATFORM_URL = '';
    expect(getSiteUrl()).toBe('');
  });

  it('never falls back to closer.earth', () => {
    delete process.env.NEXT_PUBLIC_PLATFORM_URL;
    expect(getSiteUrl()).not.toContain('closer.earth');
  });
});
