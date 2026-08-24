import { NextRequest, NextResponse } from 'next/server';

/**
 * next.config.js sets `skipTrailingSlashRedirect: true` because the PostHog
 * proxy (see packages/closer/next/posthogRewrites.js) must pass
 * `/ingest/e/`-style paths through untouched. That flag disables Next's
 * global `/foo/` -> `/foo` 308, so restore it here for everything else.
 */
export function middleware(req: NextRequest) {
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

export const config = {
  matcher: ['/((?!_next/|api/).*)'],
};
