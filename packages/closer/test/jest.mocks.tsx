import React from 'react';

// setup env variables globally
process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = 'true';
process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'true';
process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS = 'true';
process.env.NEXT_PUBLIC_CDN_URL =
  process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.example.com';
process.env.NEXT_PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com';

// Suites that opt into `@jest-environment node` have no window.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // jsdom has no IntersectionObserver. Without one, next/link's prefetch
  // hook (useIntersection) falls back to a requestIdleCallback that flips
  // `visible` state outside of any test's act() — a bare `IntersectionObserver`
  // constructor is enough to take that fallback path away; it never has to
  // fire, since nothing here depends on scroll-triggered prefetch.
  class NoopIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  window.IntersectionObserver =
    NoopIntersectionObserver as unknown as typeof IntersectionObserver;
}

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // `fill` and `priority` are next/image's own props, not img attributes.
    const { fill, priority, ...imgProps } = props;
    return <img {...imgProps} />;
  },
}));

// The real interaction session POSTs to the API with raw axios, so it escapes
// the mocked `utils/api` and resolves api.example.com for real in every suite
// that renders a form. Keep the pure helpers, stub the network.
jest.mock('../utils/interactionSession', () => {
  const actual = jest.requireActual('../utils/interactionSession');
  return {
    ...actual,
    ensureInteractionSession: jest.fn(async () => undefined),
    refreshInteractionSession: jest.fn(async () => undefined),
  };
});

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    query: {},
    pathname: '/',
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
  }),
}));

jest.mock('../utils/api', () => {
  const mockApi = {
    get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    defaults: { headers: {} },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    refreshTokensProactively: jest.fn(() => Promise.resolve(null)),
    setOnSessionInvalid: jest.fn(),
  };
  const formatSearch = (where: unknown) =>
    typeof where !== 'undefined'
      ? encodeURIComponent(JSON.stringify(where))
      : '';
  const cdn = process.env.NEXT_PUBLIC_CDN_URL || '';
  return {
    __esModule: true,
    default: mockApi,
    formatSearch,
    cdn,
    refreshTokensProactively: mockApi.refreshTokensProactively,
    setOnSessionInvalid: mockApi.setOnSessionInvalid,
    invalidateGetCache: jest.fn(),
  };
});
