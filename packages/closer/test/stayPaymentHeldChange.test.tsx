import type { ComponentType, ReactNode } from 'react';

import { screen } from '@testing-library/react';

import StayPaymentPage from '../pages/stay/[slug]/payment';
import type { Stay } from '../types/stay';
import { getStay } from '../utils/stays.api';
import { renderWithNextIntl } from './utils';

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

jest.mock('../contexts/auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { _id: 'guest_1', roles: [], email: 'g@local.dev' },
  }),
}));

jest.mock('../utils/stays.api', () => ({
  ...jest.requireActual('../utils/stays.api'),
  getStay: jest.fn(),
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

const renderPage = () => {
  const Page = StayPaymentPage as unknown as ComponentType<
    Record<string, unknown>
  >;
  return renderWithNextIntl(<Page bookingSettings={{}} generalConfig={null} />);
};

describe('/stay/[slug]/payment with a held change', () => {
  const featureBooking = process.env.NEXT_PUBLIC_FEATURE_BOOKING;
  beforeAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
  });
  afterAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = featureBooking;
  });

  it('holds the card and wallet until the tokens for the change are staked', async () => {
    mockedGetStay.mockResolvedValue(heldStay({ tokensDelta: 2 }));
    renderPage();

    expect(
      await screen.findByText(/Stake the tokens for your new nights first/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pay now' })).toBeDisabled();
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
      await screen.findByRole('button', { name: 'Pay now' }),
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
    expect(screen.getByRole('button', { name: 'Pay now' })).toBeEnabled();
  });
});
