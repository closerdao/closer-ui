import type { ComponentType, ReactNode } from 'react';

import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import { WalletDispatch, WalletState } from '../contexts/wallet';
import StayPaymentPage from '../pages/stay/[slug]/payment';
import type { Stay } from '../types/stay';
import { checkoutStay, getStay } from '../utils/stays.api';
import { renderWithNextIntl } from './utils';

let cachedConfigs: Record<string, unknown> = {};

jest.mock('../utils/cachedConfig.helpers', () => {
  const actual = jest.requireActual('../utils/cachedConfig.helpers');
  return {
    ...actual,
    getCachedConfig: (slug: string) =>
      Object.prototype.hasOwnProperty.call(cachedConfigs, slug)
        ? cachedConfigs[slug]
        : actual.getCachedConfig(slug),
  };
});

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { slug: 'stay_1' },
    isReady: true,
    replace: jest.fn(),
    push: jest.fn(),
    asPath: '/stay/stay_1/payment',
  }),
}));

jest.mock('../hooks/useStayRouteId', () => ({
  useStayRouteId: () => ({
    stayId: 'stay_1',
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

jest.mock('../contexts/auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { _id: 'guest_1', roles: [], email: 'g@local.dev' },
  }),
}));

jest.mock('../utils/stays.api', () => ({
  ...jest.requireActual('../utils/stays.api'),
  getStay: jest.fn(),
  checkoutStay: jest.fn(),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: ReactNode }) => <>{children}</>,
  CardElement: () => <div data-testid="card" />,
  useStripe: () => null,
  useElements: () => null,
}));

jest.mock('../components/WalletPayButton', () => ({
  __esModule: true,
  default: ({ isEnabled }: { isEnabled: boolean }) => (
    <button type="button" disabled={!isEnabled}>
      Wallet pay
    </button>
  ),
}));

jest.mock('../components/booking/stayPaymentTokenCreditControls', () => ({
  StayPaymentTokenCreditControls: () => <div>Stake controls</div>,
}));

const mockedGetStay = getStay as jest.Mock;

// A paid stay with a live extension the guest pays for: 80 by card, plus tokens or credits.
const heldStay = (quote: Record<string, number>, extra = {}): Stay =>
  ({
    _id: 'stay_1',
    status: 'paid',
    createdBy: 'guest_1',
    start: '2027-03-01T15:00:00.000Z',
    end: '2027-03-04T11:00:00.000Z',
    duration: 3,
    adults: 1,
    created: '2027-01-01T00:00:00.000Z',
    updated: '2027-01-01T00:00:00.000Z',
    pendingModification: {
      id: 'hold_1',
      type: 'dates',
      status: 'pending-payment',
      requestedBy: 'guest_1',
      requestedAt: '2027-01-01T00:00:00.000Z',
      expiresAt: '2099-01-01T00:00:00.000Z',
      overrides: { end: '2027-03-06' },
      quote: { fiatDelta: 80, currency: 'EUR', ...quote },
      ...extra,
    },
  }) as unknown as Stay;

const villagePayment = {
  cardPayment: true,
  connectStatus: 'active',
  webhookLive: true,
  connectedAccounts: [{ id: 'acct_test', name: 'Test village' }],
  defaultConnectedAccountId: 'acct_test',
  connectedAccountId: 'acct_test',
};

const walletState = {
  library: null,
  account: null,
  isWalletConnected: false,
  isCorrectNetwork: false,
};

const walletDispatch = {
  connectWallet: async () => null,
  switchNetwork: async () => undefined,
  updateWalletBalance: () => undefined,
};

const renderPage = () => {
  const Page = StayPaymentPage as unknown as ComponentType<
    Record<string, unknown>
  >;
  return renderWithNextIntl(
    <WalletState.Provider value={walletState}>
      <WalletDispatch.Provider value={walletDispatch}>
        <Page bookingSettings={{}} generalConfig={null} />
      </WalletDispatch.Provider>
    </WalletState.Provider>,
  );
};

describe('/stay/[slug]/payment with a held change', () => {
  const featureBooking = process.env.NEXT_PUBLIC_FEATURE_BOOKING;
  beforeAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
  });
  afterAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = featureBooking;
  });
  beforeEach(() => {
    cachedConfigs = {
      payment: villagePayment,
      'accounting-entities': { enabled: true, elements: [] },
    };
  });

  it('holds the card and wallet until the tokens for the change are staked', async () => {
    mockedGetStay.mockResolvedValue(heldStay({ tokensDelta: 2 }));
    renderPage();

    expect(
      await screen.findByText(/Stake the tokens for your new nights first/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pay .*80/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Wallet pay' })).toBeDisabled();
  });

  it('lets the card pay once the stake is verified', async () => {
    mockedGetStay.mockResolvedValue(
      heldStay(
        { tokensDelta: 2 },
        {
          stake: { lockedStakeVal: 5, verifiedAt: '2027-01-01T00:00:00.000Z' },
        },
      ),
    );
    renderPage();

    expect(
      await screen.findByRole('button', { name: /Pay .*80/ }),
    ).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Wallet pay' })).toBeEnabled();
    expect(
      screen.queryByText(/Stake the tokens for your new nights first/),
    ).not.toBeInTheDocument();
  });

  it('says the card payment also spends the credits the change owes', async () => {
    mockedGetStay.mockResolvedValue(heldStay({ creditsDelta: 2 }));
    renderPage();

    expect(
      await screen.findByText(
        'Paying also spends 2 credits from your balance for this change.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pay .*80/ })).toBeEnabled();
  });

  it('places the payment recipient once, below the payment action', async () => {
    cachedConfigs['accounting-entities'] = {
      enabled: true,
      elements: [
        { legalName: 'Enseada Sonhadora', products: ['accommodations'] },
      ],
    };
    mockedGetStay.mockResolvedValue(heldStay({ creditsDelta: 2 }));
    renderPage();
    const pay = await screen.findByRole('button', { name: /Pay .*80/ });
    const recipients = screen.getAllByText(
      'Payment recipient: Enseada Sonhadora',
    );
    expect(recipients).toHaveLength(1);
    expect(
      pay.compareDocumentPosition(recipients[0]) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows only card controls once the incident stake is complete, with history below the summary', async () => {
    mockedGetStay.mockResolvedValue({
      ...heldStay({}),
      status: 'confirmed',
      pendingModification: null,
      fiatTarget: { val: 237.72, cur: 'EUR' },
      fiatPaid: { val: 187.15, cur: 'EUR' },
      tokensTarget: { val: 8.669192, cur: 'TDF' },
      tokensStaked: { val: 8.669192, cur: 'TDF' },
    });
    renderPage();
    const pay = await screen.findByRole('button', { name: /Pay .*50[.,]57/ });
    expect(pay).toBeEnabled();
    expect(screen.queryByText('Stake controls')).not.toBeInTheDocument();
    expect(screen.queryByText('Credits & tokens')).not.toBeInTheDocument();
    expect(screen.getByText(/8[.,]67 TDF staked/)).toBeInTheDocument();
    const history = screen.getByRole('region', { name: 'Payment history' });
    expect(
      screen.getByTestId('stay-payment-summary').parentElement,
    ).toContainElement(history);
    expect(screen.getByText('No payments recorded yet.')).toBeVisible();
    expect(
      screen.getByText('Amount due').compareDocumentPosition(history) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      history.compareDocumentPosition(pay) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('keeps tiny outstanding stakes actionable without showing a zero-value card form', async () => {
    const web3 = process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING;
    process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = 'true';
    try {
      mockedGetStay.mockResolvedValue({
        ...heldStay({}),
        status: 'confirmed',
        pendingModification: null,
        fiatTarget: { val: 187.15, cur: 'EUR' },
        fiatPaid: { val: 187.15, cur: 'EUR' },
        tokensTarget: { val: 8.669192, cur: 'TDF' },
        tokensStaked: { val: 8.669191, cur: 'TDF' },
      });
      renderPage();
      expect(await screen.findByText('Stake controls')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Complete TDF staking' }),
      ).toBeInTheDocument();
      expect(screen.queryByText('Optional')).not.toBeInTheDocument();
      expect(
        screen.getByText(/0[.,]000001 TDF still to stake/),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('card')).not.toBeInTheDocument();
    } finally {
      process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = web3;
    }
  });
});

describe('credit-only completion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
    cachedConfigs = {
      payment: { cardPayment: false },
      'accounting-entities': { enabled: true, elements: [] },
    };
  });
  it('completes selected credits without Stripe.js and prevents double submission', async () => {
    const creditsStay = {
      ...heldStay({}),
      status: 'confirmed',
      pendingModification: null,
      fiatTarget: { val: 0, cur: 'EUR' },
      creditsTarget: { val: 4, cur: 'credits' },
      creditsPaid: { val: 0, cur: 'credits' },
    } as Stay;
    mockedGetStay.mockResolvedValue(creditsStay);
    let finish!: (result: any) => void;
    (checkoutStay as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderPage();
    const button = await screen.findByRole('button', {
      name: 'Complete payment',
    });
    expect(screen.queryByText('Stake controls')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Use .* or credits/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('card')).not.toBeInTheDocument();
    fireEvent.click(button);
    fireEvent.click(button);
    expect(checkoutStay).toHaveBeenCalledTimes(1);
    expect(checkoutStay).toHaveBeenCalledWith('stay_1', '');
    mockedGetStay.mockResolvedValue({
      ...creditsStay,
      status: 'paid',
      creditsPaid: { val: 4, cur: 'credits' },
    });
    await act(async () =>
      finish({
        paymentIntent: null,
        settled: true,
        needsTokenStake: false,
        creditsSpent: 4,
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Complete payment' }),
      ).not.toBeInTheDocument(),
    );
  });
  it('keeps an uncertain credit checkout in recovery instead of inviting another payment', async () => {
    mockedGetStay.mockResolvedValue({
      ...heldStay({}),
      status: 'confirmed',
      pendingModification: null,
      fiatTarget: { val: 0, cur: 'EUR' },
      creditsTarget: { val: 4, cur: 'credits' },
    });
    (checkoutStay as jest.Mock).mockRejectedValue(
      new Error('Network reply lost'),
    );
    renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Complete payment' }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Complete payment' }),
      ).not.toBeInTheDocument(),
    );
    expect(checkoutStay).toHaveBeenCalledTimes(1);
  });
  it('keeps payment-method changes and the edit link hidden from an invited payer', async () => {
    mockedGetStay.mockResolvedValue({
      ...heldStay({}),
      createdBy: 'owner',
      status: 'confirmed',
      pendingModification: null,
      fiatTarget: { val: 20, cur: 'EUR' },
      tokensTarget: { val: 2, cur: 'TDF' },
    });
    renderPage();
    await screen.findByText(/Payment history/);
    expect(screen.queryByText('Stake controls')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Edit booking details' }),
    ).not.toBeInTheDocument();
  });
});
