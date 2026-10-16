import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import { WalletDispatch, WalletState } from '../contexts/wallet';
import {
  defaultWalletDispatch,
  defaultWalletState,
} from '../contexts/wallet/hooks';
import messages from '../locales/base-en.json';
import Wallet from './Wallet';

const profileAddress = '0x1111111111111111111111111111111111111234';
const connectedAddress = '0x2222222222222222222222222222222222225678';

jest.mock('../contexts/auth', () => ({
  useAuth: () => ({ user: { _id: 'member', walletAddress: profileAddress } }),
}));
jest.mock('../hooks/useConfig', () => ({ useConfig: () => ({}) }));
jest.mock('../hooks/useSweatToken', () => ({
  useSweatToken: () => ({ sweatBalance: 0 }),
}));
jest.mock('../utils/metrics', () => ({ logMetric: jest.fn() }));

function view(state = {}, actions = {}) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <WalletState.Provider
        value={{
          ...defaultWalletState,
          initializationStatus: 'ready',
          isWalletConnected: true,
          isCorrectNetwork: true,
          account: connectedAddress,
          ...state,
        }}
      >
        <WalletDispatch.Provider
          value={{ ...defaultWalletDispatch, ...actions }}
        >
          <Wallet />
        </WalletDispatch.Provider>
      </WalletState.Provider>
    </NextIntlClientProvider>
  );
}

test('the wallet keeps its header and connected address above a single mismatch notice', () => {
  render(view());

  expect(screen.getAllByText(/doesn’t match your profile/)).toHaveLength(1);
  expect(
    screen.queryByText(messages.wallet_different_saved_address_title),
  ).not.toBeInTheDocument();
  expect(screen.getByText('Wallet Balance')).toBeInTheDocument();
  expect(screen.getAllByRole('button')).toHaveLength(1);
  expect(screen.getAllByTitle(connectedAddress)).toHaveLength(2);
  expect(screen.getAllByText('0x2222…5678')).toHaveLength(2);
  expect(screen.getByTitle(profileAddress)).toHaveTextContent('0x1111…1234');
});

test('choosing the profile wallet clears the mismatch and restores balances', () => {
  const selectWallet = jest.fn();
  const rendered = render(view({}, { selectWallet }));

  fireEvent.click(screen.getByRole('button', { name: 'Switch wallet' }));
  expect(selectWallet).toHaveBeenCalledTimes(1);

  rendered.rerender(
    view({
      account: profileAddress,
      hasSameConnectedAccount: true,
      isWalletReady: true,
      balanceStatus: 'ready',
      balanceTotal: 20,
      balanceAvailable: 15,
      balanceCeurAvailable: 5,
      balanceCeloAvailable: 1,
      proofOfPresence: 2,
    }),
  );

  expect(
    screen.queryByText(/doesn’t match your profile/),
  ).not.toBeInTheDocument();
  expect(screen.queryByText('Profile wallet')).not.toBeInTheDocument();
  expect(screen.getByText('Wallet Balance')).toBeInTheDocument();
  expect(screen.getByText('0x1111…1234')).toBeInTheDocument();
  expect(screen.getByText('20.00')).toBeInTheDocument();
});

test('the mismatch stays actionable when the network is also wrong', () => {
  render(view({ isCorrectNetwork: false }));

  expect(screen.getAllByText(/doesn’t match your profile/)).toHaveLength(1);
  expect(
    screen.getByRole('button', { name: 'Switch wallet' }),
  ).toBeInTheDocument();
});

test.each([
  { isWalletConnected: false, account: null },
  { initializationStatus: 'loading' },
  { isWalletConnecting: true, connectionStage: 'connecting' },
])('does not show a premature mismatch for %o', (state) => {
  render(view(state));

  expect(
    screen.queryByText(/doesn’t match your profile/),
  ).not.toBeInTheDocument();
  expect(screen.queryByText('Profile wallet')).not.toBeInTheDocument();
});
