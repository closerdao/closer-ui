import { render } from '@testing-library/react';

import { PostHogProvider } from '../posthog';

jest.mock('posthog-js/react', () => ({
  PostHogProvider: ({ children }: any) => <>{children}</>,
}));

const identifyUser = jest.fn();
const resetUser = jest.fn();
const initPostHog = jest.fn();
jest.mock('../../utils/posthog', () => ({
  identifyUser: (...a: any[]) => identifyUser(...a),
  resetUser: (...a: any[]) => resetUser(...a),
  initPostHog: (...a: any[]) => initPostHog(...a),
  trackEvent: jest.fn(),
  AnalyticsEvents: {},
  posthog: {},
}));

let mockUser: any = null;
let mockIsLoading = false;
jest.mock('../auth', () => ({
  useAuth: () => ({ user: mockUser, isLoading: mockIsLoading }),
}));

beforeEach(() => {
  mockUser = null;
  mockIsLoading = false;
  identifyUser.mockClear();
  resetUser.mockClear();
  initPostHog.mockClear();
});

it('initialises on mount and clears a persisted identity after auth resolves anonymous', () => {
  render(
    <PostHogProvider>
      <div />
    </PostHogProvider>,
  );
  expect(initPostHog).toHaveBeenCalledTimes(1);
  expect(identifyUser).not.toHaveBeenCalled();
  expect(resetUser).toHaveBeenCalledTimes(1);
});

it('waits for auth hydration before clearing a persisted identity', () => {
  mockIsLoading = true;
  const { rerender } = render(
    <PostHogProvider>
      <div />
    </PostHogProvider>,
  );
  expect(resetUser).not.toHaveBeenCalled();
  mockIsLoading = false;
  rerender(
    <PostHogProvider>
      <div />
    </PostHogProvider>,
  );
  expect(resetUser).toHaveBeenCalledTimes(1);
});

it('identifies on login (id + roles only) and resets on logout', () => {
  const { rerender } = render(
    <PostHogProvider>
      <div />
    </PostHogProvider>,
  );
  mockUser = { _id: 'u1', email: 'a@b.c', roles: ['member'] };
  rerender(
    <PostHogProvider>
      <div />
    </PostHogProvider>,
  );
  expect(identifyUser).toHaveBeenCalledTimes(1);
  expect(identifyUser).toHaveBeenCalledWith('u1', { roles: ['member'] });
  expect(identifyUser.mock.calls[0][1]).not.toHaveProperty('email');

  rerender(
    <PostHogProvider>
      <div />
    </PostHogProvider>,
  );
  expect(identifyUser).toHaveBeenCalledTimes(1);

  mockUser = { _id: 'u1', roles: ['member', 'citizen'] };
  rerender(
    <PostHogProvider>
      <div />
    </PostHogProvider>,
  );
  expect(identifyUser).toHaveBeenCalledTimes(2);
  expect(identifyUser).toHaveBeenLastCalledWith('u1', {
    roles: ['member', 'citizen'],
  });

  mockUser = null;
  rerender(
    <PostHogProvider>
      <div />
    </PostHogProvider>,
  );
  expect(resetUser).toHaveBeenCalledTimes(2);
});
