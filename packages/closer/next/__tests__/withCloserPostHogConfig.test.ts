/**
 * @jest-environment node
 */
import { withPostHogConfig } from '@posthog/nextjs-config';

import { withCloserPostHogConfig } from '../withCloserPostHogConfig';

jest.mock('@posthog/nextjs-config', () => ({
  withPostHogConfig: jest.fn(() => 'wrapped'),
}));

const nextConfig = { reactStrictMode: false };
const originalEnv = process.env;

const setEnv = (env: Record<string, string | undefined>) => {
  process.env = { ...originalEnv, ...env } as NodeJS.ProcessEnv;
};

afterEach(() => {
  process.env = originalEnv;
  jest.clearAllMocks();
});

const productionWithKeys = {
  NODE_ENV: 'production',
  POSTHOG_API_KEY: 'phx_test',
  POSTHOG_PROJECT_ID: '123',
};

it('passes the config through when the PostHog keys are missing', () => {
  setEnv({
    NODE_ENV: 'production',
    POSTHOG_API_KEY: undefined,
    POSTHOG_PROJECT_ID: undefined,
  });
  expect(withCloserPostHogConfig(nextConfig)).toBe(nextConfig);
  expect(withPostHogConfig).not.toHaveBeenCalled();
});

it('passes the config through outside production builds', () => {
  setEnv({ ...productionWithKeys, NODE_ENV: 'development' });
  expect(withCloserPostHogConfig(nextConfig)).toBe(nextConfig);
  expect(withPostHogConfig).not.toHaveBeenCalled();
});

it('uploads and deletes source maps, released per app and commit', () => {
  setEnv({
    ...productionWithKeys,
    NEXT_PUBLIC_POSTHOG_HOST: undefined,
    NEXT_PUBLIC_APP_NAME: 'tdf',
    VERCEL_GIT_COMMIT_SHA: 'abc123',
  });
  expect(withCloserPostHogConfig(nextConfig)).toBe('wrapped');
  expect(withPostHogConfig).toHaveBeenCalledWith(nextConfig, {
    personalApiKey: 'phx_test',
    projectId: '123',
    host: 'https://eu.i.posthog.com',
    sourcemaps: {
      enabled: true,
      releaseName: 'tdf',
      releaseVersion: 'abc123',
      deleteAfterUpload: true,
    },
  });
});
