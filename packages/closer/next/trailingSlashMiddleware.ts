import { NextRequest, NextResponse } from 'next/server';

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

/**
 * Restore Next's usual trailing-slash redirect while preserving PostHog's
 * `/ingest/e/` request paths when `skipTrailingSlashRedirect` is enabled.
 */
export function trailingSlashMiddleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === '/ingest' || pathname.startsWith('/ingest/')) {
    const headers = withoutCredentials(req.headers);
    return NextResponse.next({ request: { headers } });
  }
  if (pathname !== '/' && pathname.endsWith('/')) {
    const target = sameOriginTrailingSlashTarget(req.nextUrl, pathname, search);
    return NextResponse.redirect(target, 308);
  }
  return NextResponse.next();
}
