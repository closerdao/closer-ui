// Routes where the floating newsletter prompt must not appear. Auth pages are
// in the list because asking someone to subscribe while they are filling in a
// signup or login form competes with the thing they came to do — and the
// prompt also drives the footer newsletter's visibility, so a page that is
// missing here gets the footer form back even after asking to hide it.
const ROUTES_WITHOUT_FLOATING_PROMPT = [
  '/signup',
  '/login',
  '/login/forgot-password',
  '/login/set-password',
  '/subscriptions',
  // These carry their own fixed bottom CTA.
  '/events/[slug]',
  '/stay/[slug]',
];

export const shouldHideFloatingPrompt = (pathname: string | undefined) =>
  !!pathname && ROUTES_WITHOUT_FLOATING_PROMPT.includes(pathname);
