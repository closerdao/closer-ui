import React from 'react';

// setup env variables globally
process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = 'true';
process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'true';
process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS = 'true';
process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.example.com';
process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';

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

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

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
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  const formatSearch = (where: unknown) =>
    typeof where !== 'undefined' ? encodeURIComponent(JSON.stringify(where)) : '';
  const cdn = process.env.NEXT_PUBLIC_CDN_URL || '';
  return {
    __esModule: true,
    default: mockApi,
    formatSearch,
    cdn,
  };
});

