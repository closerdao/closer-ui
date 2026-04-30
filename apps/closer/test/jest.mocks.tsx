import React from 'react';

// Setup env variables globally
process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = 'true';
process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'true';
process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS = 'true';
process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.example.com';
process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock HTMLCanvasElement.getContext for canvas-based components
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  moveTo: jest.fn(),
  quadraticCurveTo: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
  // Don't call cb to avoid infinite loops
  return 0;
});
global.cancelAnimationFrame = jest.fn();

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    return React.createElement('img', props);
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