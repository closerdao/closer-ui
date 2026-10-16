import { useRouter } from 'next/router';

import React from 'react';

import { StayPaymentTokenCreditControls } from '../components/booking/stayPaymentTokenCreditControls';

import { jest as timerJest } from '@jest/globals';
import { act, fireEvent, screen } from '@testing-library/react';

import { WalletDispatch, WalletState } from '../contexts/wallet';
import {
  defaultWalletDispatch,
  defaultWalletState,
} from '../contexts/wallet/hooks';
import { useBookingSmartContract } from '../hooks/useBookingSmartContract';
import { useLivePaymentConfig } from '../hooks/useLivePaymentConfig';
import { useStayTokenBalance } from '../hooks/useStayTokenBalance';
import StayPaymentPage from '../pages/stay/[slug]/payment';
import {
  readPendingStayTokenVerification,
  writePendingStayTokenStake,
  writePendingStayTokenVerification,
} from '../utils/stayTokenStakePendingStorage';
import {
  buildStayTokenStakePlan,
  formatStayMoney,
  getStay,
  quoteStay,
  setStayPaymentMethod,
  stakeStayTokens,
} from '../utils/stays.api';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { _id: 'member', roles: ['member'], walletAddress: '0x123' },
  }),
}));
jest.mock('../hooks/useStayRouteId', () => ({
  useStayRouteId: () => ({
    stayId: 'stay',
    isNotFound: false,
    isResolving: false,
  }),
}));
jest.mock('../hooks/useBookingLinkedCharges', () => ({
  useBookingLinkedCharges: () => ({
    linkedCharges: [],
    refetchCharges: jest.fn(),
  }),
}));
jest.mock('../contexts/platform', () => ({
  usePlatform: () => ({ platform: {} }),
}));
jest.mock('../hooks/useBookingSmartContract', () => ({
  useBookingSmartContract: jest.fn(),
}));
jest.mock('../hooks/useStayTokenBalance', () => ({
  useStayTokenBalance: jest.fn(),
}));
jest.mock('../hooks/useLivePaymentConfig', () => ({
  useLivePaymentConfig: jest.fn(),
}));
jest.mock('../hooks/useStayCreditsEligibility', () => ({
  useStayCreditsEligibility: () => ({
    creditsBalance: 10,
    canApplyCreditsAtStart: true,
  }),
}));
jest.mock('../utils/stays.api', () => ({
  ...jest.requireActual('../utils/stays.api'),
  getStay: jest.fn(),
  stakeStayTokens: jest.fn(),
  setStayPaymentMethod: jest.fn(),
  quoteStay: jest.fn(),
}));
jest.mock('../utils/metrics', () => ({
  logMetric: jest.fn(),
  linkedMetricFields: jest.fn(),
}));
jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => children,
  CardElement: () => <div>Card details</div>,
  useStripe: () => null,
  useElements: () => null,
}));
jest.mock('@stripe/stripe-js', () => ({ loadStripe: jest.fn() }));
jest.mock('../components/WalletPayButton', () => () => null);
jest.mock('../configCached', () => ({ __esModule: true, default: {} }));

const transactionId = `0x${'1'.repeat(64)}`;
const stay: any = {
  _id: 'stay',
  createdBy: 'member',
  status: 'confirmed',
  start: '2027-03-24T14:00:00Z',
  end: '2027-03-31T10:00:00Z',
  duration: 7,
  adults: 1,
  foodOption: 'no_food',
  useTokens: true,
  rentalToken: { val: 49, cur: 'TDF' },
  appliedTokens: { val: 49, cur: 'TDF' },
  tokensTarget: { val: 49, cur: 'TDF' },
  tokensStaked: { val: 0, cur: 'TDF' },
  fiatTarget: { val: 100, cur: 'EUR' },
  priceLock: {
    total: { val: 100, cur: 'EUR' },
    subtotal: { val: 100, cur: 'EUR' },
    appliedCredits: { val: 0, cur: 'credits' },
    appliedTokens: { val: 49, cur: 'TDF' },
    lines: {
      accommodation: { val: 0, cur: 'EUR' },
      utility: { val: 100, cur: 'EUR' },
      food: { val: 0, cur: 'EUR' },
      event: { val: 0, cur: 'EUR' },
    },
    tokenStakePlan: {
      dates: Array.from({ length: 7 }, (_, i) => [2027, 83 + i]),
      pricePerNightWei: '7000000000000000000',
      totalWei: '49000000000000000000',
      decimals: 18,
    },
  },
};
const settled = { ...stay, tokensStaked: { val: 49, cur: 'TDF' } };
const fiatStay = {
  ...stay,
  useTokens: false,
  appliedTokens: { val: 0, cur: 'TDF' },
  tokensTarget: { val: 0, cur: 'TDF' },
  fiatTarget: { val: 350, cur: 'EUR' },
  fiatPaid: { val: 100, cur: 'EUR' },
  priceLock: {
    ...stay.priceLock,
    total: { val: 350, cur: 'EUR' },
    appliedTokens: { val: 0, cur: 'TDF' },
  },
};
const plan = buildStayTokenStakePlan(stay)!;
const pendingError = {
  response: {
    status: 409,
    data: { details: { code: 'TOKEN_STAKE_VERIFICATION_PENDING' } },
  },
};
const wallet = {
  ...defaultWalletState,
  initializationStatus: 'ready',
  isWalletConnected: true,
  isWalletReady: true,
  account: '0x123',
  chainId: 42220,
  isCorrectNetwork: true,
  hasSameConnectedAccount: true,
  balanceStatus: 'ready',
  balanceAvailable: '100',
  balanceAvailableWei: '100000000000000000000',
  balanceNativeAvailable: '1',
};
const stakeTokens = jest.fn();
const contract = {
  stakeTokens,
  countStakedPlanNights: jest.fn(async () => 0),
  resetStakingProgress: jest.fn(),
  isStaking: false,
  stakingProgress: {
    completedNights: 0,
    totalNights: 7,
    requiresMultipleTransactions: false,
    phase: 'idle',
  },
};
const flush = async (ms = 0) => {
  await act(async () => {
    await timerJest.advanceTimersByTimeAsync(ms);
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  (useLivePaymentConfig as jest.Mock).mockReturnValue(null);
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-07T12:00:00Z'));
  sessionStorage.clear();
  (useStayTokenBalance as jest.Mock).mockReturnValue({
    walletAddress: '0x123',
    balanceWei: '100000000000000000000',
    isLoading: false,
    refresh: jest.fn(async () => '100000000000000000000'),
  });
  (useRouter as jest.Mock).mockReturnValue({
    query: { slug: 'stay' },
    isReady: true,
    replace: jest.fn(),
    push: jest.fn(),
    prefetch: jest.fn(),
  });
  (getStay as jest.Mock).mockResolvedValue(stay);
  (setStayPaymentMethod as jest.Mock).mockResolvedValue(stay);
  (quoteStay as jest.Mock).mockResolvedValue({
    priceLock: stay.priceLock,
    delta: { fiat: { val: 0, cur: 'EUR' } },
  });
  (stakeStayTokens as jest.Mock).mockRejectedValue(pendingError);
  (useBookingSmartContract as jest.Mock).mockReturnValue(contract);
  stakeTokens.mockImplementation(async (_price, nights, options) => {
    options.onProgress({ completedNightCount: nights.length, transactionId });
    return { error: null, success: { transactionId } };
  });
});
afterEach(() => {
  jest.useRealTimers();
});

describe('accommodation options and remaining payment', () => {
  const bookingFeature = process.env.NEXT_PUBLIC_FEATURE_BOOKING;
  const web3Feature = process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING;
  beforeEach(() => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
    process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = 'true';
    (useLivePaymentConfig as jest.Mock).mockReturnValue({
      cardPayment: true,
      connectStatus: 'active',
      webhookLive: true,
      connectedAccounts: [{ id: 'acct_test', name: 'Test village' }],
      defaultConnectedAccountId: 'acct_test',
      connectedAccountId: 'acct_test',
    });
  });
  afterEach(() => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = bookingFeature;
    process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = web3Feature;
  });

  const renderPayment = async (booking = stay, connected = true) => {
    (getStay as jest.Mock).mockResolvedValue(booking);
    const view = renderWithNextIntl(
      <WalletState.Provider
        value={
          connected
            ? wallet
            : { ...defaultWalletState, initializationStatus: 'ready' }
        }
      >
        <WalletDispatch.Provider value={defaultWalletDispatch}>
          <StayPaymentPage bookingSettings={{} as any} generalConfig={null} />
        </WalletDispatch.Provider>
      </WalletState.Provider>,
    );
    await flush();
    return view;
  };

  test('offers staking and the remaining card payment together for a mixed booking', async () => {
    await renderPayment();
    expect(
      screen.getByRole('button', { name: 'Complete $TDF stake' }),
    ).toBeEnabled();
    const pay = screen.getByRole('button', { name: /Pay .*100/ });
    expect(pay).toBeEnabled();

    fireEvent.click(screen.getByRole('tab', { name: 'Pay with crypto' }));
    expect(screen.getByText('Card details')).not.toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Complete $TDF stake' }),
    ).toBeEnabled();
    fireEvent.click(screen.getByRole('tab', { name: 'Pay with card' }));
    expect(screen.getByRole('button', { name: /Pay .*100/ })).toBeEnabled();
    expect(setStayPaymentMethod).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('button', { name: 'Complete $TDF stake' }),
    );
    await flush();
    expect(screen.getByRole('button', { name: /Pay .*100/ })).toBeDisabled();
    expect(screen.getByRole('tab', { name: 'Pay with crypto' })).toBeDisabled();
    fireEvent.click(screen.getAllByRole('button', { name: 'Close' }).at(-1)!);
    await flush();
    expect(screen.getByRole('button', { name: /Pay .*100/ })).toBeEnabled();
  });

  test('only reveals wallet setup when TDF is chosen', async () => {
    (useStayTokenBalance as jest.Mock).mockReturnValue({
      walletAddress: null,
      balanceWei: null,
      isLoading: false,
      refresh: jest.fn(async () => null),
    });
    await renderPayment(fiatStay, false);
    expect(
      screen.queryByRole('button', { name: 'Connect Wallet' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pay .*250/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Use credits' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Stake TDF' }));
    expect(
      screen.getByRole('button', { name: 'Connect Wallet' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pay .*250/ })).toBeEnabled();
    expect(setStayPaymentMethod).not.toHaveBeenCalled();
    expect(stakeTokens).not.toHaveBeenCalled();
  });

  test('lets the user inspect and cancel the credits choice before changing payment', async () => {
    await renderPayment(fiatStay, false);
    fireEvent.click(screen.getByRole('button', { name: 'Use credits' }));
    await flush();
    expect(
      screen.getByRole('button', { name: 'Confirm and apply credits' }),
    ).toBeEnabled();
    expect(setStayPaymentMethod).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Pay .*250/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await flush();
    expect(screen.getByRole('button', { name: /Pay .*250/ })).toBeEnabled();
    expect(setStayPaymentMethod).not.toHaveBeenCalled();
  });
});

test('complete-stake control disappears after verified coverage is applied to props', async () => {
  const controls = (verified: boolean) => (
    <WalletState.Provider value={wallet as any}>
      <WalletDispatch.Provider value={defaultWalletDispatch}>
        <StayPaymentTokenCreditControls
          stay={{
            ...stay,
            tokensTarget: { val: 8.669191, cur: 'TDF' },
            tokensStaked: { val: verified ? 8.669192 : 0, cur: 'TDF' },
          }}
          onStaySynced={jest.fn()}
          setBannerError={jest.fn()}
        />
      </WalletDispatch.Provider>
    </WalletState.Provider>
  );
  const view = renderWithNextIntl(controls(false));
  await flush();
  expect(
    screen.getByRole('button', { name: 'Complete $TDF stake' }),
  ).toBeInTheDocument();
  view.rerender(controls(true));
  await flush();
  expect(
    screen.queryByRole('button', { name: 'Complete $TDF stake' }),
  ).not.toBeInTheDocument();
});

describe('switching a TDF preference back to fiat', () => {
  const onStaySynced = jest.fn();
  const setBannerError = jest.fn();
  const onBusyChange = jest.fn();
  const controls = (booking = stay, disabled = false) => (
    <WalletState.Provider value={wallet as any}>
      <WalletDispatch.Provider value={defaultWalletDispatch}>
        <StayPaymentTokenCreditControls
          stay={booking}
          disabled={disabled}
          onStaySynced={onStaySynced}
          setBannerError={setBannerError}
          onBusyChange={onBusyChange}
        />
      </WalletDispatch.Provider>
    </WalletState.Provider>
  );
  const switchButton = () =>
    screen.getByRole('button', {
      name: 'Pay entirely in EUR instead',
    });
  const openStake = async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Complete $TDF stake' }),
    );
    await flush();
  };
  const closeStake = async () => {
    fireEvent.click(screen.getAllByRole('button', { name: 'Close' }).at(-1)!);
    await flush();
  };

  test('switches without a wallet, refreshes totals and preserves already paid fiat', async () => {
    (getStay as jest.Mock).mockResolvedValue(stay);
    (setStayPaymentMethod as jest.Mock).mockResolvedValue(fiatStay);
    renderWithNextIntl(
      <WalletState.Provider value={defaultWalletState as any}>
        <WalletDispatch.Provider value={defaultWalletDispatch}>
          <StayPaymentPage bookingSettings={{} as any} generalConfig={null} />
        </WalletDispatch.Provider>
      </WalletState.Provider>,
    );
    await flush();
    fireEvent.click(switchButton());
    await flush();
    expect(setStayPaymentMethod).toHaveBeenCalledWith('stay', {
      method: 'fiat',
    });
    expect(
      screen.queryByRole('button', { name: 'Complete $TDF stake' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        `TDF removed. Your remaining payment is ${formatStayMoney({ val: 250, cur: 'EUR' })}.`,
      ),
    ).toBeInTheDocument();
    expect(stakeTokens).not.toHaveBeenCalled();
    expect((useRouter as jest.Mock)().replace).not.toHaveBeenCalled();
  });

  test('closing the popup preserves the preference and leaves the switch available', async () => {
    renderWithNextIntl(controls());
    await openStake();
    expect(
      screen.queryByRole('button', { name: 'Cancel' }),
    ).not.toBeInTheDocument();
    await closeStake();
    expect(switchButton()).toBeEnabled();
    expect(setStayPaymentMethod).not.toHaveBeenCalled();
  });

  test('blocks other payments and repeated clicks until the switch finishes', async () => {
    let resolveSwitch!: (booking: any) => void;
    (setStayPaymentMethod as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSwitch = resolve;
        }),
    );
    renderWithNextIntl(controls());
    fireEvent.click(switchButton());
    fireEvent.click(screen.getByRole('button', { name: 'Updating…' }));
    expect(onBusyChange).toHaveBeenLastCalledWith(true);
    expect(
      screen.getByRole('button', { name: 'Complete $TDF stake' }),
    ).toBeDisabled();
    expect(setStayPaymentMethod).toHaveBeenCalledTimes(1);
    await act(async () => resolveSwitch(fiatStay));
    expect(onStaySynced).toHaveBeenCalledWith(fiatStay);
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
  });

  test('keeps the preference and shows an error when the switch fails', async () => {
    (setStayPaymentMethod as jest.Mock).mockRejectedValue(
      new Error('Could not update payment'),
    );
    renderWithNextIntl(controls());
    fireEvent.click(switchButton());
    await flush();
    expect(setBannerError).toHaveBeenLastCalledWith('Could not update payment');
    expect(onStaySynced).not.toHaveBeenCalled();
    expect(switchButton()).toBeEnabled();
    expect(screen.queryByText(/TDF removed/)).not.toBeInTheDocument();
  });

  test('uses the booking currency in the action', () => {
    renderWithNextIntl(
      controls({
        ...stay,
        priceLock: { ...stay.priceLock, total: { val: 100, cur: 'GBP' } },
      }),
    );
    expect(
      screen.getByRole('button', { name: 'Pay entirely in GBP instead' }),
    ).toBeEnabled();
  });

  test('still allows removing a preference when web3 booking is disabled', () => {
    const original = process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING;
    process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = 'false';
    try {
      renderWithNextIntl(controls());
      expect(switchButton()).toBeEnabled();
      expect(
        screen.queryByRole('button', { name: 'Complete $TDF stake' }),
      ).not.toBeInTheDocument();
    } finally {
      process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = original;
    }
  });

  test('blocks switching while a card or crypto payment is in progress', () => {
    renderWithNextIntl(controls(stay, true));
    expect(switchButton()).toBeDisabled();
    fireEvent.click(switchButton());
    expect(setStayPaymentMethod).not.toHaveBeenCalled();
  });

  test.each([1, 49])(
    'blocks switching with %s tokens already staked',
    (amount) => {
      renderWithNextIntl(
        controls({ ...stay, tokensStaked: { val: amount, cur: 'TDF' } }),
      );
      expect(
        screen.queryByRole('button', { name: /Pay entirely/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(/TDF already staked for this booking/),
      ).toBeInTheDocument();
    },
  );

  test.each([
    { residencyAgreementId: 'agreement' },
    { creditsPaid: { val: 1, cur: 'credits' } },
    { status: 'paid' },
    { status: 'cancelled' },
    { status: 'rejected' },
    { status: 'pending' },
    { pendingModification: { id: 'hold', status: 'pending-payment' } },
    { pendingModification: { id: 'hold', status: 'settling' } },
  ])('does not offer switching for restricted bookings: %j', (overrides) => {
    renderWithNextIntl(controls({ ...stay, ...overrides }));
    expect(
      screen.queryByRole('button', { name: /Pay entirely/ }),
    ).not.toBeInTheDocument();
  });

  test.each(['verification', 'partial batch', 'submitted transaction'])(
    'blocks switching after reload with an unrecorded %s',
    (phase) => {
      if (phase === 'verification')
        writePendingStayTokenVerification('stay', transactionId, plan);
      else
        writePendingStayTokenStake(
          'stay',
          transactionId,
          JSON.stringify(plan.bookingNights),
          phase === 'partial batch' ? 2 : 0,
        );
      renderWithNextIntl(controls());
      expect(
        screen.queryByRole('button', { name: /Pay entirely/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(/Waiting for your staking transaction/),
      ).toBeInTheDocument();
    },
  );

  test('allows switching after a wallet rejection with no transaction submitted', async () => {
    stakeTokens.mockResolvedValue({
      error: new Error('User rejected'),
      success: null,
    });
    renderWithNextIntl(controls());
    await openStake();
    fireEvent.click(
      screen.getByRole('button', { name: 'Stake and finalize token payment' }),
    );
    await flush();
    await closeStake();
    expect(switchButton()).toBeEnabled();
  });

  test('allows switching when the sole submitted transaction definitively reverted', async () => {
    stakeTokens.mockImplementation(async (_price, _nights, options) => {
      options.onProgress({ completedNightCount: 0, transactionId });
      return {
        error: Object.assign(new Error('Transaction reverted'), {
          receipt: { status: 0, transactionHash: transactionId },
        }),
        success: null,
      };
    });
    renderWithNextIntl(controls());
    await openStake();
    fireEvent.click(
      screen.getByRole('button', { name: 'Stake and finalize token payment' }),
    );
    await flush();
    await closeStake();
    expect(switchButton()).toBeEnabled();
  });

  test('blocks switching and closing while the initial on-chain check is still running', async () => {
    let resolveCheck!: (nights: number) => void;
    (useBookingSmartContract as jest.Mock).mockReturnValue({
      ...contract,
      countStakedPlanNights: jest.fn(
        () =>
          new Promise((resolve) => {
            resolveCheck = resolve;
          }),
      ),
    });
    renderWithNextIntl(controls());
    await openStake();
    fireEvent.click(
      screen.getByRole('button', { name: 'Stake and finalize token payment' }),
    );
    await flush();
    expect(
      screen.queryByRole('button', { name: /Pay entirely/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Close' }).at(-1),
    ).toBeDisabled();
    stakeTokens.mockResolvedValue({
      error: new Error('User rejected'),
      success: null,
    });
    await act(async () => resolveCheck(0));
    await closeStake();
    expect(switchButton()).toBeEnabled();
  });

  test('blocks switching after a partial batch fails and the popup is closed', async () => {
    stakeTokens.mockImplementation(async (_price, _nights, options) => {
      options.onProgress({ completedNightCount: 2, transactionId });
      return { error: new Error('User rejected next batch'), success: null };
    });
    renderWithNextIntl(controls());
    await openStake();
    fireEvent.click(
      screen.getByRole('button', { name: 'Stake and finalize token payment' }),
    );
    await flush();
    await closeStake();
    expect(
      screen.queryByRole('button', { name: /Pay entirely/ }),
    ).not.toBeInTheDocument();
  });
});

describe.each(['payment controls', 'payment page'])(
  '%s staking verification',
  (page) => {
    const renderPage = async (connected = true) => {
      const view = renderWithNextIntl(
        <WalletState.Provider
          value={(connected ? wallet : defaultWalletState) as any}
        >
          <WalletDispatch.Provider
            value={{ ...defaultWalletDispatch, refreshBalances: jest.fn() }}
          >
            {page === 'payment controls' ? (
              <StayPaymentTokenCreditControls
                stay={stay}
                onStaySynced={jest.fn(async () => undefined)}
                setBannerError={jest.fn()}
              />
            ) : (
              <StayPaymentPage
                bookingSettings={{} as any}
                generalConfig={null}
              />
            )}
          </WalletDispatch.Provider>
        </WalletState.Provider>,
      );
      await flush();
      return view;
    };
    const startStake = async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Complete $TDF stake',
        }),
      );
      await flush();
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Stake and finalize token payment',
        }),
      );
      await flush();
    };
    const retry = async () => {
      fireEvent.click(
        screen
          .getAllByRole('button', { name: 'Retry booking verification' })
          .at(-1)!,
      );
      await flush();
    };

    test('refreshes the profile balance before asking the wallet to stake', async () => {
      await renderPage();
      await startStake();
      const refresh = (useStayTokenBalance as jest.Mock).mock.results.at(-1)!
        .value.refresh;
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(refresh.mock.invocationCallOrder[0]).toBeLessThan(
        stakeTokens.mock.invocationCallOrder[0],
      );
    });

    test('does not submit a wallet transaction when the fresh profile balance cannot be read', async () => {
      const refresh = (useStayTokenBalance as jest.Mock)().refresh;
      refresh.mockRejectedValue(new Error('Could not refresh profile balance'));
      await renderPage();
      await startStake();
      expect(stakeTokens).not.toHaveBeenCalled();
      expect(
        screen.getByText('Could not refresh profile balance'),
      ).toBeInTheDocument();
    });

    test('keeps the modal open during RPC lag, then completes without a second wallet transaction', async () => {
      (stakeStayTokens as jest.Mock)
        .mockRejectedValueOnce(pendingError)
        .mockResolvedValue({ booking: settled, verified: true });
      await renderPage();
      await startStake();
      expect(
        screen.getByText('Transaction confirmed. Updating your booking…'),
      ).toBeInTheDocument();
      fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]);
      expect(
        screen.getByText('Transaction confirmed. Updating your booking…'),
      ).toBeInTheDocument();
      await flush(2000);
      expect(
        screen.queryByText('Transaction confirmed. Updating your booking…'),
      ).not.toBeInTheDocument();
      expect(stakeTokens).toHaveBeenCalledTimes(1);
      expect(stakeStayTokens).toHaveBeenCalledTimes(2);
      expect(stakeStayTokens).toHaveBeenLastCalledWith(
        'stay',
        transactionId,
        expect.anything(),
      );
      expect(readPendingStayTokenVerification('stay', plan)).toBeNull();
    });

    test('after 120 seconds shows manual recovery and retries only the backend', async () => {
      await renderPage();
      await startStake();
      await flush(120_000);
      expect(
        screen.getByText(
          'Your transaction is confirmed, but your booking has not been updated yet.',
        ),
      ).toBeInTheDocument();
      expect(
        readPendingStayTokenVerification('stay', plan)?.transactionId,
      ).toBe(transactionId);
      (stakeStayTokens as jest.Mock).mockResolvedValue({
        booking: settled,
        verified: true,
      });
      await retry();
      expect(stakeTokens).toHaveBeenCalledTimes(1);
      expect(readPendingStayTokenVerification('stay', plan)).toBeNull();
    });

    test('restores verification after reload without requiring a wallet and accepts a settled booking', async () => {
      writePendingStayTokenVerification('stay', transactionId, plan);
      await renderPage(false);
      await retry(); // Open the modal.
      (getStay as jest.Mock).mockResolvedValue(settled);
      (stakeStayTokens as jest.Mock).mockResolvedValue({
        booking: settled,
        verified: true,
      });
      await retry(); // Refresh the booking before trying the verification endpoint.
      expect(stakeTokens).not.toHaveBeenCalled();
      expect(
        (useStayTokenBalance as jest.Mock).mock.results.at(-1)!.value.refresh,
      ).not.toHaveBeenCalled();
      expect(stakeStayTokens).toHaveBeenCalledWith(
        'stay',
        transactionId,
        expect.objectContaining({
          syncBookingAlreadyOnChain: true,
          transactionIds: [transactionId],
        }),
      );
      expect(readPendingStayTokenVerification('stay', plan)).toBeNull();
    });

    test('does not automatically retry a genuine coverage mismatch', async () => {
      (stakeStayTokens as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Missing payments for 24/3-30/3' },
        },
      });
      await renderPage();
      await startStake();
      expect(
        screen.getByText('Missing payments for 24/3-30/3'),
      ).toBeInTheDocument();
      await flush(120_000);
      expect(stakeStayTokens).toHaveBeenCalledTimes(1);
      expect(readPendingStayTokenVerification('stay', plan)).not.toBeNull();
    });

    test('unmount stops polling and preserves the confirmed transaction', async () => {
      const view = await renderPage();
      await startStake();
      view.unmount();
      await flush(120_000);
      expect(stakeStayTokens).toHaveBeenCalledTimes(1);
      expect(readPendingStayTokenVerification('stay', plan)).not.toBeNull();
    });

    test('unfinished wallet batches still offer Resume TDF staking', async () => {
      (useBookingSmartContract as jest.Mock).mockReturnValue({
        ...contract,
        stakingProgress: { ...contract.stakingProgress, completedNights: 2 },
      });
      stakeTokens.mockResolvedValue({
        error: new Error('User rejected'),
        success: null,
      });
      await renderPage();
      await startStake();
      expect(
        screen.getByRole('button', { name: 'Resume TDF staking' }),
      ).toBeEnabled();
      expect(
        screen.queryByRole('button', { name: 'Retry booking verification' }),
      ).not.toBeInTheDocument();
      expect(stakeStayTokens).not.toHaveBeenCalled();
      expect(readPendingStayTokenVerification('stay', plan)).toBeNull();
    });
  },
);
