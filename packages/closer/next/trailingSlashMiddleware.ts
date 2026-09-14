import { NextRequest, NextResponse } from 'next/server';

/**
 * Every app's `middleware.ts` repeats this literal in its `config.matcher`
 * (Next requires a static literal there, so it cannot import this). Skips
 * `_next/` and static assets so the middleware only runs for page, API and
 * `/ingest` requests. `middlewareMatcher.test.ts` keeps the copies in sync.
 */
export const MIDDLEWARE_MATCHER =
  '/((?!_next/|.*\\.(?:png|jpe?g|gif|svg|ico|webp|woff2?|ttf|css|js|map|txt|xml)$).*)';

export const withoutCredentials = (source: Headers): Headers => {
  const headers = new Headers(source);
  headers.delete('authorization');
  headers.delete('cookie');
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
