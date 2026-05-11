import React from 'react';

process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = 'true';
process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'false';
process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS = 'true';
process.env.NEXT_PUBLIC_FEATURE_VOLUNTEERING = 'true';
process.env.NEXT_PUBLIC_APP_NAME = 'tdf';
process.env.NEXT_PUBLIC_CDN_URL =
  process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.example.com';
process.env.NEXT_PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com';
process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY =
  process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY || 'pk_test_mock';

jest.mock('closer/utils/cachedConfig.helpers', () => {
  const { bookingConfig } = require('../__tests__/mocks/bookingConfig');
  const { generalConfig } = require('../__tests__/mocks/generalConfig');
  const { paymentConfig } = require('../__tests__/mocks');
  const { subscriptionsConfig } = require('../__tests__/mocks/subscriptions');

  const mockConfigBySlug: Record<string, Record<string, unknown>> = {
    booking: bookingConfig,
    general: generalConfig,
    payment: paymentConfig,
    subscriptions: subscriptionsConfig,
    volunteering: { enabled: true },
  };

  return {
    getCachedConfig: (slug: string) => mockConfigBySlug[slug] ?? null,
  };
});

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
    const { priority, fill, ...imgProps } = props;
    return <img {...imgProps} />;
  },
}));
