// create a helper for rendering components with providers
import React from 'react';

import { render as rtlRender } from '@testing-library/react';
import { Web3ReactProvider } from '@web3-react/core';

import { closerConfig } from '../config';
import { blockchainConfig } from '../config_blockchain';
import { AuthProvider } from '../contexts/auth';
import { ConfigProvider } from '../contexts/config';
import { PlatformProvider } from '../contexts/platform';
import { WalletProvider } from '../contexts/wallet';
import getLibrary from '../pages/_app';
import { NextIntlClientProvider } from 'next-intl';
import messagesLocal from '../locales/tdf/en.json';
import messagesBase from '../locales/base-en.json';

export const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  function Wrapper({ children }: { children?: React.ReactNode }) {
    return (
      <ConfigProvider config={{ ...closerConfig, ...blockchainConfig }}>
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
      <ConfigProvider config={{ ...closerConfig, ...blockchainConfig }}>
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
      <ConfigProvider config={{ ...closerConfig, ...blockchainConfig }}>
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
