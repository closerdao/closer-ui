import { NextRequest, NextResponse } from 'next/server';

/**
 * Every app's `middleware.ts` repeats these literals in its `config.matcher`
 * (Next requires static literals there, so it cannot import this). The first
 * entry keeps every `/ingest` request — including the SDK/recorder bundles
 * under `/ingest/static/*.js` — in front of the credential stripping; the
 * second skips `_next/` and static assets so the trailing-slash redirect only
 * runs for page and API requests. `middlewareMatcher.test.ts` keeps the
 * copies in sync.
 */
export const MIDDLEWARE_MATCHER = [
  '/ingest/:path*',
  '/((?!_next/|ingest/|.*\\.(?:png|jpe?g|gif|svg|ico|webp|woff2?|ttf|css|js|map|txt|xml)$).*)',
];

/**
 * Drop everything first-party that a browser attaches to a same-origin
 * fetch: session cookies, bearer tokens, and the page `Referer`, which can
 * carry query strings (reset/signup tokens, OAuth code, IBAN) that the SDK
 * masks in event properties but the header would leak verbatim.
 */
export const withoutCredentials = (source: Headers): Headers => {
  const headers = new Headers(source);
  headers.delete('authorization');
  headers.delete('cookie');
  headers.delete('referer');
  return headers;
};

export const sameOriginTrailingSlashTarget = (
  requestUrl: URL,
  pathname: string,
  search: string,
): URL => {
  const target = new URL(requestUrl.toString());
  target.pathname = pathname.replace(/\/+$/, '');
  target.search = search;
  return target;
};

const isIngestPath = (pathname: string): boolean =>
  pathname === '/ingest' || pathname.startsWith('/ingest/');

/** Strip first-party auth/cookie headers before they reach the PostHog proxy. */
function stripIngestCredentials(req: NextRequest) {
  const headers = withoutCredentials(req.headers);
  return NextResponse.next({ request: { headers } });
}

/** Restore Next's usual trailing-slash 308, same-origin only. */
function redirectTrailingSlash(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname !== '/' && pathname.endsWith('/')) {
    const target = sameOriginTrailingSlashTarget(req.nextUrl, pathname, search);
    return NextResponse.redirect(target, 308);
  }
  return NextResponse.next();
}

export function trailingSlashMiddleware(req: NextRequest) {
  if (isIngestPath(req.nextUrl.pathname)) return stripIngestCredentials(req);
  return redirectTrailingSlash(req);
}
