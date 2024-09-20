import React from 'react';

import config from '@/__tests__/mocks/config';

import { render as rtlRender } from '@testing-library/react';
import { Web3ReactProvider } from '@web3-react/core';
import {
  AuthProvider,
  ConfigProvider,
  PlatformProvider,
  WalletProvider,
  blockchainConfig,
} from 'closer';
import messagesBase from 'closer/locales/base-en.json';
import messagesLocal from 'closer/locales/tdf/en.json';
import { NextIntlClientProvider } from 'next-intl';

import { getLibrary } from '../pages/_app';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';
import { useRouter } from 'next/router';

// Update the mockRouter object
const mockRouter = {
  basePath: '',
  pathname: '/',
  route: '/',
  asPath: '/',
  query: {},
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
  // Add these new properties
  locale: 'en',
  locales: ['en'],
  defaultLocale: 'en',
};

// Create a custom hook to use the mock router
function useTestRouter() {
  return mockRouter;
}

export const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  function Wrapper({ children }: { children?: React.ReactNode }) {
    return (
      <RouterContext.Provider value={mockRouter as any}>
        <ConfigProvider config={{ ...config, ...blockchainConfig }}>
          <NextIntlClientProvider
            locale={'en'}
            messages={{ ...messagesBase, ...messagesLocal }}
            timeZone={'Europe/Lisbon'}
          >
            {/* Rest of the providers */}
            {children}
            {/* Rest of the providers */}
          </NextIntlClientProvider>
        </ConfigProvider>
      </RouterContext.Provider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...options });
};

export const renderWithAuth = (ui: React.ReactElement, options = {}) => {
  function Wrapper({ children }: { children?: React.ReactNode }) {
    return (
      <ConfigProvider config={{ ...config, ...blockchainConfig }}>
        <NextIntlClientProvider
          locale={'en'}
          messages={{ ...messagesBase, ...messagesLocal }}
          timeZone={'Europe/Lisbon'}
        >
          <AuthProvider>{children}</AuthProvider>
        </NextIntlClientProvider>
      </ConfigProvider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...options });
};

export const renderWithNextIntl = (ui: React.ReactElement, options = {}) => {
  function Wrapper({ children }: { children?: React.ReactNode }) {
    return (
      <ConfigProvider config={{ ...config, ...blockchainConfig }}>
        <NextIntlClientProvider
          locale={'en'}
          messages={{ ...messagesBase, ...messagesLocal }}
          timeZone={'Europe/Lisbon'}
        >
          {children}
        </NextIntlClientProvider>
      </ConfigProvider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...options });
};
