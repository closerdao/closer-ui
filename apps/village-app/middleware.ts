export { trailingSlashMiddleware as middleware } from 'closer/next/trailingSlashMiddleware';

export const config = {
  matcher: ['/((?!_next/|api/).*)'],
};
