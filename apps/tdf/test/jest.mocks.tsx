import React from 'react';

process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = 'true';
process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'true';
process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS = 'true';
process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.example.com';
process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY =
  process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY || 'pk_test_mock';

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
