import {
  getFaviconCdnBase,
  getFaviconLinks,
  getFaviconPreviewUrl,
  isEndpointMissingStatus,
} from '../favicon';

const CDN = 'https://cdn.oasa.co/photo/';

describe('getFaviconCdnBase', () => {
  it('swaps the photo prefix for the favicon prefix', () => {
    expect(getFaviconCdnBase(CDN)).toBe('https://cdn.oasa.co/favicon/');
  });

  it('tolerates a missing trailing slash', () => {
    expect(getFaviconCdnBase('https://cdn.oasa.co/photo')).toBe(
      'https://cdn.oasa.co/favicon/',
    );
  });

  it('appends the prefix when the CDN url is a bare host', () => {
    expect(getFaviconCdnBase('https://cdn.example.com')).toBe(
      'https://cdn.example.com/favicon/',
    );
  });

  it('returns an empty string when no CDN is configured', () => {
    expect(getFaviconCdnBase(undefined)).toBe('');
  });
});

describe('getFaviconLinks', () => {
  it('returns null when nothing is configured', () => {
    expect(getFaviconLinks('', CDN)).toBeNull();
    expect(getFaviconLinks(undefined, CDN)).toBeNull();
    expect(getFaviconLinks('   ', CDN)).toBeNull();
  });

  it('treats an absolute url as a single uploaded file', () => {
    expect(getFaviconLinks('https://files.example.com/x.png', CDN)).toEqual({
      kind: 'file',
      png: 'https://files.example.com/x.png',
    });
  });

  it('treats a root-relative path as a single uploaded file', () => {
    expect(getFaviconLinks('/images/logo.png', CDN)).toEqual({
      kind: 'file',
      png: '/images/logo.png',
    });
  });

  it('derives the generated size set from an id', () => {
    expect(getFaviconLinks('6a1f', CDN)).toEqual({
      kind: 'id',
      png32: 'https://cdn.oasa.co/favicon/6a1f-32.png',
      png180: 'https://cdn.oasa.co/favicon/6a1f-180.png',
      png192: 'https://cdn.oasa.co/favicon/6a1f-192.png',
      ico: 'https://cdn.oasa.co/favicon/6a1f.ico',
    });
  });

  it('returns null for an id when no CDN is configured, rather than a broken url', () => {
    expect(getFaviconLinks('6a1f', undefined)).toBeNull();
  });
});

describe('getFaviconPreviewUrl', () => {
  it('previews the smallest rendition of an id', () => {
    expect(getFaviconPreviewUrl('6a1f', CDN)).toBe(
      'https://cdn.oasa.co/favicon/6a1f-32.png',
    );
  });

  it('previews an uploaded file directly', () => {
    expect(getFaviconPreviewUrl('https://files.example.com/x.png', CDN)).toBe(
      'https://files.example.com/x.png',
    );
  });
});

describe('isEndpointMissingStatus', () => {
  it('only treats a missing endpoint as the fallback signal', () => {
    expect(isEndpointMissingStatus(404)).toBe(true);
    expect(isEndpointMissingStatus(405)).toBe(true);
    expect(isEndpointMissingStatus(501)).toBe(true);
    expect(isEndpointMissingStatus(400)).toBe(false);
    expect(isEndpointMissingStatus(413)).toBe(false);
    expect(isEndpointMissingStatus(500)).toBe(false);
    expect(isEndpointMissingStatus(undefined)).toBe(false);
  });
});
