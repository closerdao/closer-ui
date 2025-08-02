// create a helper for rendering components with providers
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
import { NewsletterProvider } from 'closer/contexts/newsletter';
import messagesBase from 'closer/locales/base-en.json';
import messagesLocal from 'closer/locales/tdf/en.json';
import { NextIntlClientProvider } from 'next-intl';

import { getLibrary } from '../pages/_app';

export const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  function Wrapper({ children }: { children?: React.ReactNode }) {
    return (
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
          <AuthProvider>
            <NewsletterProvider>{children}</NewsletterProvider>
          </AuthProvider>
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
