// create a helper for rendering components with providers
import type { NextRouter } from 'next/router';

import React from 'react';

import config from '@/__tests__/mocks/config';

import type { RenderOptions } from '@testing-library/react';
import { render as rtlRender } from '@testing-library/react';
import {
  ExternalProvider,
  JsonRpcFetchFunc,
  Web3Provider,
} from '@ethersproject/providers';
import { Web3ReactProvider } from '@web3-react/core';
import { ConfigProvider, PlatformProvider } from 'closer';
import { AuthProvider } from 'closer/contexts/auth';
import { WalletProvider } from 'closer/contexts/wallet';
import { blockchainConfig } from 'closer/config_blockchain';
import { NewsletterProvider } from 'closer/contexts/newsletter';
import messagesBase from 'closer/locales/base-en.json';
import messagesLocal from 'closer/locales/tdf/en.json';
import { NextIntlClientProvider } from 'next-intl';
import Router from 'next-router-mock';

function getLibrary(provider: ExternalProvider | JsonRpcFetchFunc) {
  return new Web3Provider(provider);
}

const RouterContext = React.createContext<NextRouter>(Router as NextRouter);

interface RenderWithRouterOptions extends RenderOptions {
  route?: string;
  router?: Partial<NextRouter>;
}

const applyRouterState = (
  route?: string,
  routerOverrides?: Partial<NextRouter>,
) => {
  Router.setCurrentUrl(route ?? '/');

  if (routerOverrides) {
    Object.assign(Router, routerOverrides);
  }
};

export const renderWithProviders = (
  ui: React.ReactElement,
  options: RenderWithRouterOptions = {},
) => {
  const { route, router: routerOverrides, ...renderOptions } = options;
  applyRouterState(route, routerOverrides);

  function Wrapper({ children }: { children?: React.ReactNode }) {
    return (
      <RouterContext.Provider value={Router}>
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
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
};

export const renderWithAuth = (
  ui: React.ReactElement,
  options: RenderWithRouterOptions = {},
) => {
  const { route, router: routerOverrides, ...renderOptions } = options;
  applyRouterState(route, routerOverrides);

  function Wrapper({ children }: { children?: React.ReactNode }) {
    return (
      <RouterContext.Provider value={Router}>
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
      </RouterContext.Provider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
};

export const renderWithNextIntl = (
  ui: React.ReactElement,
  options: RenderWithRouterOptions = {},
) => {
  const { route, router: routerOverrides, ...renderOptions } = options;
  applyRouterState(route, routerOverrides);

  function Wrapper({ children }: { children?: React.ReactNode }) {
    return (
      <RouterContext.Provider value={Router}>
        <ConfigProvider config={{ ...config, ...blockchainConfig }}>
          <NextIntlClientProvider
            locale={'en'}
            messages={{ ...messagesBase, ...messagesLocal }}
            timeZone={'Europe/Lisbon'}
          >
            {children}
          </NextIntlClientProvider>
        </ConfigProvider>
      </RouterContext.Provider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
};
