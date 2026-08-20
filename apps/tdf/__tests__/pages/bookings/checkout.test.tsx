import { mockAuthContext } from '@/__tests__/mocks/mockAuthContext';
import { renderWithProviders } from '@/test/utils';

import { waitFor } from '@testing-library/react';
import { BookingCheckoutPage } from 'closer';

jest.mock('closer/contexts/auth', () => {
  const actual = jest.requireActual<typeof import('closer/contexts/auth')>(
    'closer/contexts/auth',
  );
  return { ...actual, useAuth: () => mockAuthContext };
});

const getStay = jest.fn();

jest.mock('closer/utils/stays.api', () => {
  const actual = jest.requireActual<typeof import('closer/utils/stays.api')>(
    'closer/utils/stays.api',
  );
  return { ...actual, getStay: (id: string) => getStay(id) };
});

const stay = (overrides: Record<string, unknown> = {}) => ({
  _id: 'stay-1',
  status: 'confirmed',
  fiatTarget: { val: 100, cur: 'EUR' },
  fiatPaid: { val: 0, cur: 'EUR' },
  ...overrides,
});

let replace: jest.Mock;

// next-router-mock cannot resolve a [slug] segment on its own, so the query is
// handed in the same way the real router would have parsed it.
const renderCheckout = (query: Record<string, string> = { slug: 'stay-1' }) =>
  renderWithProviders(<BookingCheckoutPage />, {
    route: '/bookings/stay-1/checkout',
    router: { query, isReady: true, replace },
  });

/**
 * The page is a redirect now — the checkout itself lives under /stay/*. These
 * cases pin the hand-off, not the retired form.
 */
describe('BookingCheckoutPage', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    replace = jest.fn();
    process.env = { ...OLD_ENV, NEXT_PUBLIC_FEATURE_BOOKING: 'true' };
    mockAuthContext.isAuthenticated = true;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('sends a booking that still owes fiat to the stay payment page', async () => {
    getStay.mockResolvedValue(stay());
    renderCheckout();

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/stay/stay-1/payment'),
    );
    expect(getStay).toHaveBeenCalledWith('stay-1');
  });

  it('sends a draft back to the stay checkout', async () => {
    getStay.mockResolvedValue(
      stay({ status: 'open', fiatTarget: { val: 0, cur: 'EUR' } }),
    );
    renderCheckout();

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/stay/create/stay-1'),
    );
  });

  it('sends a booking that owes credits to the stay checkout', async () => {
    getStay.mockResolvedValue(
      stay({
        creditsTarget: { val: 10, cur: 'credits' },
        creditsPaid: { val: 0, cur: 'credits' },
        fiatTarget: { val: 0, cur: 'EUR' },
      }),
    );
    renderCheckout();

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/stay/create/stay-1'),
    );
  });

  it('hands an invited friend to the stay checkout without reading the stay first', async () => {
    renderCheckout({ slug: 'stay-1', isFriend: 'true' });

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/stay/create/stay-1?isFriend=true'),
    );
    expect(getStay).not.toHaveBeenCalled();
  });

  it('asks an anonymous visitor to log in instead of redirecting', async () => {
    mockAuthContext.isAuthenticated = false;
    const { findByRole } = renderCheckout();

    expect(await findByRole('heading')).toBeInTheDocument();
    expect(getStay).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('surfaces a read failure rather than looping', async () => {
    getStay.mockRejectedValue(new Error('Stay not found.'));
    const { findByText } = renderCheckout();

    expect(await findByText(/stay not found/i)).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
