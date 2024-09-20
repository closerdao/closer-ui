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

// Import MockRouter from next-router-mock
import MockRouter from 'next-router-mock';

// Remove the old mockRouter object

// Update the renderWithProviders function
export const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  setupMockRouter(); // Add this line
  function Wrapper({ children }: { children?: React.ReactNode }) {
    return (
      <RouterContext.Provider value={MockRouter as any}>
        <ConfigProvider config={{ ...config, ...blockchainConfig }}>
          <NextIntlClientProvider
            locale={'en'}
            messages={{ ...messagesBase, ...messagesLocal }}
            timeZone={'Europe/Lisbon'}
          >
            <AuthProvider>
              <PlatformProvider>
                <Web3ReactProvider getLibrary={getLibrary}>
                  <WalletProvider>{children}</WalletProvider>
                </Web3ReactProvider>
              </PlatformProvider>
            </AuthProvider>
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

// Add this function
export function setupMockRouter() {
  MockRouter.push('/'); // Reset to a default route
}
