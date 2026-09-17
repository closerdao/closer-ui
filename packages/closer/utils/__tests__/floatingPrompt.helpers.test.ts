import { shouldHideFloatingPrompt } from '../floatingPrompt.helpers';

describe('shouldHideFloatingPrompt', () => {
  it.each([
    '/signup',
    '/login',
    '/login/forgot-password',
    '/login/set-password',
  ])('hides the newsletter prompt on the auth page %s', (pathname) => {
    expect(shouldHideFloatingPrompt(pathname)).toBe(true);
  });

  it.each(['/subscriptions', '/events/[slug]', '/stay/[slug]'])(
    'hides it on %s, which has its own bottom CTA or funnel',
    (pathname) => {
      expect(shouldHideFloatingPrompt(pathname)).toBe(true);
    },
  );

  it.each(['/', '/events', '/stay', '/settings', '/dashboard'])(
    'still shows it on %s',
    (pathname) => {
      expect(shouldHideFloatingPrompt(pathname)).toBe(false);
    },
  );

  it('treats a missing pathname as showable rather than throwing', () => {
    expect(shouldHideFloatingPrompt(undefined)).toBe(false);
  });
});
