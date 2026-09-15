export { trailingSlashMiddleware as middleware } from 'closer/next/trailingSlashMiddleware';

export const config = {
  // Keep identical to MIDDLEWARE_MATCHER in closer/next/trailingSlashMiddleware:
  // Next needs static literals here, so it cannot be imported.
  matcher: [
    '/ingest/:path*',
    '/((?!_next/|ingest/|.*\\.(?:png|jpe?g|gif|svg|ico|webp|woff2?|ttf|css|js|map|txt|xml)$).*)',
  ],
};
