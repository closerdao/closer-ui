import React from 'react';

process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = 'true';
process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'true';
process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS = 'true';

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
