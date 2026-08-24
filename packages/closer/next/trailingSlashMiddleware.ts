import { NextRequest, NextResponse } from 'next/server';

/**
 * Restore Next's usual trailing-slash redirect while preserving PostHog's
 * `/ingest/e/` request paths when `skipTrailingSlashRedirect` is enabled.
 */
export function trailingSlashMiddleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (
    pathname !== '/' &&
    pathname.endsWith('/') &&
    !pathname.startsWith('/ingest/')
  ) {
    return NextResponse.redirect(
      new URL(pathname.replace(/\/+$/, '') + search, req.url),
      308,
    );
  }
  return NextResponse.next();
}
