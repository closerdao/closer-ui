// create a helper for rendering components with providers
import React from 'react';

import { render as rtlRender } from '@testing-library/react';
import { Web3ReactProvider } from '@web3-react/core';
import {
  AuthProvider,
  ConfigProvider,
  PlatformProvider,
  WalletProvider,
  blockchainConfig,
} from 'closer';

import config from '@/__tests__/mocks/config';
import { getLibrary } from '../pages/_app';

export const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  function Wrapper({ children }: { children?: React.ReactNode }) {
    return (
      <ConfigProvider config={{ ...config, ...blockchainConfig }}>
        <AuthProvider>
          <PlatformProvider>
            <Web3ReactProvider getLibrary={getLibrary}>
              <WalletProvider>{children}</WalletProvider>
            </Web3ReactProvider>
          </PlatformProvider>
        </AuthProvider>
      </ConfigProvider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...options });
};

export const renderWithAuth = (ui: React.ReactElement, options = {}) => {
  function Wrapper({ children }: { children?: React.ReactNode }) {
    return (
      <ConfigProvider config={{ ...config, ...blockchainConfig }}>
        <AuthProvider>{children}</AuthProvider>
      </ConfigProvider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...options });
};
