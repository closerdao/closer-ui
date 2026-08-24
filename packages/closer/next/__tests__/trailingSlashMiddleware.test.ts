import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  sameOriginTrailingSlashTarget,
  trailingSlashMiddleware,
  withoutCredentials,
} from '../trailingSlashMiddleware';

jest.mock('next/server', () => ({
  NextResponse: { next: jest.fn(), redirect: jest.fn() },
}));

it('strips first-party credentials from PostHog ingest requests', () => {
  const headers = withoutCredentials(
    new Headers({
      authorization: 'Bearer secret',
      cookie: 'access_token=secret; harmless=value',
      'x-request-id': 'request-1',
    }),
  );

  expect(headers.get('x-request-id')).toBe('request-1');
  expect(headers.get('cookie')).toBeNull();
  expect(headers.get('authorization')).toBeNull();
});

it('passes stripped headers through Next request-header overrides', () => {
  trailingSlashMiddleware({
    nextUrl: { pathname: '/ingest/e/', search: '' },
    headers: new Headers({
      authorization: 'Bearer secret',
      cookie: 'access_token=secret',
      'x-request-id': 'request-1',
    }),
  } as NextRequest);

  const forwarded = (NextResponse.next as jest.Mock).mock.calls[0][0].request
    .headers as Headers;
  expect(forwarded.get('x-request-id')).toBe('request-1');
  expect(forwarded.get('cookie')).toBeNull();
  expect(forwarded.get('authorization')).toBeNull();
});

it('keeps trailing-slash redirects same-origin and preserves the query', () => {
  const target = sameOriginTrailingSlashTarget(
    new URL('https://village.example//evil.com/?next=%2Fdashboard'),
    '//evil.com/',
    '?next=%2Fdashboard',
  );

  expect(target.toString()).toBe(
    'https://village.example//evil.com?next=%2Fdashboard',
  );
});
