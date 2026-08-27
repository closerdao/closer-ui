import { PropsWithChildren } from 'react';

import { render } from '@testing-library/react';

import type { User } from '../auth/types';
import type { Properties } from 'posthog-js';
import { PostHogProvider } from '../posthog';

jest.mock('posthog-js/react', () => ({
  PostHogProvider: ({ children }: PropsWithChildren) => <>{children}</>,
}));

const identifyUser = jest.fn<void, [string, Properties?]>();
const resetUser = jest.fn<void, []>();
const initPostHog = jest.fn<boolean, []>();
jest.mock('../../utils/posthog', () => ({
  identifyUser: (...a: [string, Properties?]) => identifyUser(...a),
  resetUser: (...a: []) => resetUser(...a),
  initPostHog: (...a: []) => initPostHog(...a),
  posthog: {},
}));

let mockUser:
  | (Pick<User, '_id' | 'roles'> & Partial<Pick<User, 'email'>>)
  | null = null;
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
