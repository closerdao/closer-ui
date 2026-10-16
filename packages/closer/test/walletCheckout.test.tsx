import React from 'react';

import TicketPaymentStep from '../components/EventTicketModal/TicketPaymentStep';
import { StayPaymentTokenCreditControls } from '../components/booking/stayPaymentTokenCreditControls';

import { fireEvent, screen, waitFor } from '@testing-library/react';

import { WalletDispatch, WalletState } from '../contexts/wallet';
import {
  defaultWalletDispatch,
  defaultWalletState,
} from '../contexts/wallet/hooks';
import { useStayTokenBalance } from '../hooks/useStayTokenBalance';
import { setStayPaymentMethod } from '../utils/stays.api';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: () => ({
    user: { _id: 'member', roles: ['member'], walletAddress: '0x123' },
  }),
}));
jest.mock('../hooks/useBookingSmartContract', () => ({
  useBookingSmartContract: () => ({
    resetStakingProgress: jest.fn(),
    stakingProgress: { completedNights: 0, totalNights: 0, phase: 'idle' },
  }),
}));
jest.mock('../hooks/useStayTokenBalance', () => ({
  useStayTokenBalance: jest.fn(),
}));
jest.mock('../components/booking/stayQuoteFiatDiscountPreview', () => ({
  StayQuoteFiatDiscountPreview: () => null,
}));
jest.mock('../hooks/useStayCreditsEligibility', () => ({
  useStayCreditsEligibility: () => ({
    creditsBalance: 10,
    canApplyCreditsAtStart: true,
  }),
}));
jest.mock('../utils/stays.api', () => ({
  ...jest.requireActual('../utils/stays.api'),
  setStayPaymentMethod: jest.fn(),
}));
jest.mock('../utils/metrics', () => ({ logMetric: jest.fn() }));
jest.mock('@stripe/react-stripe-js', () => ({
  CardElement: () => <div>Card details</div>,
  useStripe: () => null,
  useElements: () => null,
}));
jest.mock('../components/WalletPayButton', () => () => null);

const stay: any = {
  _id: 'stay',
  createdBy: 'member',
  status: 'confirmed',
  start: '2099-01-01',
  end: '2099-01-04',
  duration: 3,
  rentalToken: { val: 2, cur: 'TDF' },
  fiatTarget: { val: 100, cur: 'EUR' },
};
const state = {
  ...defaultWalletState,
  initializationStatus: 'ready',
  isWalletConnected: true,
  isWalletReady: true,
  account: '0x123',
  chainId: 42220,
  isCorrectNetwork: true,
  hasSameConnectedAccount: true,
  balanceAvailable: '10',
  balanceNativeAvailable: '1',
};
const selectedStay = {
  ...stay,
  useTokens: true,
  appliedTokens: { val: 2, cur: 'TDF' },
  tokensTarget: { val: 2, cur: 'TDF' },
  priceLock: {
    total: { val: 20, cur: 'EUR' },
    tokenStakePlan: {
      dates: [[2099, 1]],
      pricePerNightWei: '2000000000000000000',
      totalWei: '2000000000000000000',
      decimals: 18,
    },
  },
};
const profileBalance = {
  walletAddress: '0x123',
  balanceWei: '10000000000000000000',
  isLoading: false,
  error: undefined,
  refresh: jest.fn(),
  retry: jest.fn(),
};
beforeEach(() => {
  jest.clearAllMocks();
  (useStayTokenBalance as jest.Mock).mockReturnValue(profileBalance);
  profileBalance.refresh.mockResolvedValue('10000000000000000000');
  (setStayPaymentMethod as jest.Mock).mockResolvedValue(selectedStay);
});
const wrap = (
  children: React.ReactNode,
  wallet: any,
  actions: any = defaultWalletDispatch,
) => (
  <WalletState.Provider value={wallet}>
    <WalletDispatch.Provider value={actions}>
      {children}
    </WalletDispatch.Provider>
  </WalletState.Provider>
);

test('token checkout waits for balances, keeps credits available, and never auto-applies tokens', () => {
  (useStayTokenBalance as jest.Mock).mockReturnValue({
    ...profileBalance,
    balanceWei: null,
    isLoading: true,
  });
  const content = (
    <StayPaymentTokenCreditControls
      stay={stay}
      onStaySynced={jest.fn()}
      setBannerError={jest.fn()}
    />
  );
  const view = renderWithNextIntl(
    wrap(content, { ...state, balanceStatus: 'loading' }),
  );
  expect(
    screen.getByText('Checking your profile wallet’s token balance…'),
  ).toBeInTheDocument();
  const tokenButton = screen.getByTestId('stay-select-tokens');
  const creditsButton = screen.getByTestId('stay-select-credits');
  expect(tokenButton).toBeDisabled();
  expect(creditsButton).toBeEnabled();
  expect(tokenButton).toHaveAccessibleName();
  expect(creditsButton).toHaveAccessibleName();
  expect(screen.queryByText(/insufficient celo/i)).not.toBeInTheDocument();
  (useStayTokenBalance as jest.Mock).mockReturnValue(profileBalance);
  view.rerender(wrap(content, { ...state, balanceStatus: 'loading' }));
  expect(screen.getByTestId('stay-select-tokens')).toBeEnabled();
  expect(setStayPaymentMethod).not.toHaveBeenCalled();
});

test.each([
  ['disconnected', { ...defaultWalletState, initializationStatus: 'ready' }],
  [
    'another wallet',
    {
      ...state,
      isWalletReady: false,
      account: '0x456',
      hasSameConnectedAccount: false,
      balanceStatus: 'ready',
      balanceAvailableWei: '99000000000000000000',
    },
  ],
  [
    'another network',
    {
      ...state,
      isWalletReady: false,
      isCorrectNetwork: false,
      chainId: 1,
      balanceStatus: 'idle',
    },
  ],
])(
  'applies the profile wallet’s exact balance while %s and requires the right wallet only for staking',
  async (_label, wallet) => {
    profileBalance.refresh.mockResolvedValue('1234567890123456789');
    const onStaySynced = jest.fn();
    const content = (
      <StayPaymentTokenCreditControls
        stay={stay}
        onStaySynced={onStaySynced}
        setBannerError={jest.fn()}
      />
    );
    const view = renderWithNextIntl(wrap(content, wallet));
    expect(screen.getByTestId('stay-select-tokens')).toBeEnabled();
    fireEvent.click(screen.getByTestId('stay-select-tokens'));
    await waitFor(() =>
      expect(setStayPaymentMethod).toHaveBeenCalledWith('stay', {
        method: 'partial-tokens',
        requestedTokensWei: '1234567890123456789',
      }),
    );
    expect(profileBalance.refresh).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByTestId('stay-confirm-token-stake')).toBeDisabled(),
    );
    expect(onStaySynced).toHaveBeenCalledWith(selectedStay);
    view.rerender(wrap(content, { ...state, balanceStatus: 'ready' }));
    expect(screen.getByTestId('stay-confirm-token-stake')).toBeEnabled();
  },
);

test.each(['zero', 'error'])(
  'keeps fiat and credits available when the profile balance is %s',
  (reason) => {
    (useStayTokenBalance as jest.Mock).mockReturnValue({
      ...profileBalance,
      balanceWei: reason === 'zero' ? '0' : null,
      error: reason === 'error' ? new Error('RPC unavailable') : undefined,
    });
    renderWithNextIntl(
      wrap(
        <StayPaymentTokenCreditControls
          stay={stay}
          onStaySynced={jest.fn()}
          setBannerError={jest.fn()}
        />,
        defaultWalletState,
      ),
    );
    if (reason === 'error') {
      expect(
        screen.queryByTestId('stay-select-tokens'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('stay-retry-token-balance')).toBeEnabled();
    } else {
      expect(screen.getByTestId('stay-select-tokens')).toBeDisabled();
    }
    expect(screen.getByTestId('stay-select-credits')).toBeEnabled();
    expect(setStayPaymentMethod).not.toHaveBeenCalled();
  },
);

test('does not change the payment preference if the fresh profile balance has become zero', async () => {
  profileBalance.refresh.mockResolvedValue('0');
  const setBannerError = jest.fn();
  renderWithNextIntl(
    wrap(
      <StayPaymentTokenCreditControls
        stay={stay}
        onStaySynced={jest.fn()}
        setBannerError={setBannerError}
      />,
      defaultWalletState,
    ),
  );
  fireEvent.click(screen.getByTestId('stay-select-tokens'));
  await waitFor(() =>
    expect(setBannerError).toHaveBeenLastCalledWith(
      'Insufficient balance to pay with tokens',
    ),
  );
  expect(setStayPaymentMethod).not.toHaveBeenCalled();
});

test('a pending ticket wallet connection leaves the card tab available', () => {
  const connectWallet = jest.fn(() => new Promise(() => {}));
  const actions = { ...defaultWalletDispatch, connectWallet };
  renderWithNextIntl(
    wrap(
      <TicketPaymentStep
        eventId="event"
        ticketOptionName="Entry"
        quantity={1}
        discountCode=""
        fields={[]}
        quote={{ total: { val: 10, cur: 'EUR' } } as any}
        isFree={false}
        onPaid={jest.fn()}
      />,
      { ...defaultWalletState, initializationStatus: 'ready' },
      actions,
    ),
  );
  fireEvent.click(screen.getByRole('tab', { name: /crypto/i }));
  fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
  expect(connectWallet).toHaveBeenCalledTimes(1);
  const cardTab = screen.getByRole('tab', { name: /card/i });
  expect(cardTab).toBeEnabled();
  fireEvent.click(cardTab);
  expect(screen.getByText('Card details')).toBeInTheDocument();
});
