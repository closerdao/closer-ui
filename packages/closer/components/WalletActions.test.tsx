import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import { WalletDispatch, WalletState } from '../contexts/wallet';
import { defaultWalletState } from '../contexts/wallet/hooks';
import messages from '../locales/base-en.json';
import WalletActions from './WalletActions';

jest.mock('../contexts/auth', () => ({
  useAuth: () => ({ user: { _id: 'member', walletAddress: '0x123' } }),
}));
jest.mock('../utils/metrics', () => ({ logMetric: jest.fn() }));
jest.mock('../utils/blockchainNetwork', () => ({
  getBlockchainNetworkName: () => 'Celo',
}));

function view(state: any, actions: any = {}) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <WalletState.Provider
        value={{
          ...defaultWalletState,
          initializationStatus: 'ready',
          ...state,
        }}
      >
        <WalletDispatch.Provider value={actions}>
          <WalletActions requireBalance />
        </WalletDispatch.Provider>
      </WalletState.Provider>
    </NextIntlClientProvider>
  );
}

test('waiting replaces connect with an explicit stop action; signing cannot be locally cancelled', () => {
  const stop = jest.fn();
  const rendered = render(
    view(
      { connectionStage: 'connecting', isWalletConnecting: true },
      { cancelWalletConnection: stop },
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Stop waiting' }));
  expect(stop).toHaveBeenCalledTimes(1);
  expect(
    screen.queryByRole('button', { name: /connect wallet/i }),
  ).not.toBeInTheDocument();
  rendered.rerender(
    view({ connectionStage: 'linking', isWalletConnecting: true }),
  );
  expect(
    screen.queryByRole('button', { name: 'Stop waiting' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Confirm ownership');
});

test('wrong network has an explicit switch action and never invokes payment', () => {
  const switchNetwork = jest.fn();
  render(
    view(
      { isWalletConnected: true, hasSameConnectedAccount: true },
      { switchNetwork },
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Switch to Celo' }));
  expect(switchNetwork).toHaveBeenCalledTimes(1);
  expect(
    screen.getByText('This action requires the Celo network.'),
  ).toBeInTheDocument();
});

test('unknown and failed balances produce loading/retry, not insufficient funds', () => {
  const ready = {
    isWalletConnected: true,
    hasSameConnectedAccount: true,
    isCorrectNetwork: true,
  };
  const retry = jest.fn();
  const rendered = render(view({ ...ready, balanceStatus: 'loading' }));
  expect(screen.getByRole('status')).toHaveTextContent(
    'Loading wallet balances',
  );
  expect(screen.queryByText(/insufficient/i)).not.toBeInTheDocument();
  rendered.rerender(
    view({ ...ready, balanceStatus: 'error' }, { refreshBalances: retry }),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Retry loading balances' }),
  );
  expect(retry).toHaveBeenCalledTimes(1);
});
