/**
 * @jest-environment node
 */
import { unstable_doesMiddlewareMatch as doesMiddlewareMatch } from 'next/experimental/testing/server';

import fs from 'fs';
import path from 'path';

import { MIDDLEWARE_MATCHER } from '../trailingSlashMiddleware';

jest.mock('next/server', () => ({
  NextResponse: { next: jest.fn(), redirect: jest.fn() },
}));

const appsDir = path.resolve(__dirname, '../../../../apps');
const appsWithMiddleware = fs
  .readdirSync(appsDir)
  .filter((app) => fs.existsSync(path.join(appsDir, app, 'middleware.ts')));

const matches = (url: string) =>
  doesMiddlewareMatch({
    config: { matcher: MIDDLEWARE_MATCHER },
    url: `https://village.example${url}`,
  });

it('covers every app that ships a middleware.ts', () => {
  expect(appsWithMiddleware.sort()).toEqual([
    'closer',
    'earthbound',
    'lios',
    'moos',
    'per-auset',
    'tdf',
    'village-app',
  ]);
});

it.each(appsWithMiddleware)(
  '%s/middleware.ts uses the shared matcher literal',
  (app) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { config } = require(path.join(appsDir, app, 'middleware.ts'));
    expect(config.matcher).toEqual(MIDDLEWARE_MATCHER);
  },
);

it('runs for pages, API routes and the PostHog ingest proxy', () => {
  expect(matches('/')).toBe(true);
  expect(matches('/stay/')).toBe(true);
  expect(matches('/pt/stay/')).toBe(true);
  expect(matches('/api/foo/')).toBe(true);
  expect(matches('/ingest/e/')).toBe(true);
});

it('never lets an /ingest request skip credential stripping by extension', () => {
  expect(matches('/ingest')).toBe(true);
  expect(matches('/ingest/static/array.js')).toBe(true);
  expect(matches('/ingest/static/recorder.js')).toBe(true);
  expect(matches('/ingest/static/array.js.map')).toBe(true);
});

it('skips Next internals and static assets', () => {
  expect(matches('/_next/static/chunks/main.js')).toBe(false);
  expect(matches('/static/app.js')).toBe(false);
  expect(matches('/_next/image?url=%2Flogo.png')).toBe(false);
  expect(matches('/logo.png')).toBe(false);
  expect(matches('/images/hero.jpeg')).toBe(false);
  expect(matches('/fonts/inter.woff2')).toBe(false);
  expect(matches('/favicon.ico')).toBe(false);
  expect(matches('/robots.txt')).toBe(false);
  expect(matches('/sitemap.xml')).toBe(false);
});
