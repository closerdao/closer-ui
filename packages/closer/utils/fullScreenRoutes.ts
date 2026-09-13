/**
 * Routes that own the whole viewport.
 *
 * Every branded app wraps its pages in a Layout that adds the site navigation,
 * a footer and a top offset. A guided flow with its own header, progress rail
 * and sticky footer does not want any of that: two navigations stacked above
 * each other tell somebody halfway through setup to go somewhere else, which is
 * the opposite of what the flow is for.
 *
 * The apps each own a different Layout, so the predicate lives here and they
 * all ask the same question rather than drifting apart.
 */
const FULL_SCREEN_ROUTES = ['/first-steps'];

export const isFullScreenRoute = (pathname: string | undefined): boolean =>
  !!pathname && FULL_SCREEN_ROUTES.includes(pathname);
