import { trackEvent } from '../posthog';
import {
  getTokenPurchaseMethod,
  trackTokenPurchaseOnce,
} from '../tokenPurchaseAnalytics';

jest.mock('../posthog', () => ({
  AnalyticsEvents: { TOKEN_PURCHASED: 'token_purchased' },
  trackEvent: jest.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

it('tracks a paid token sale once across reloads with its actual method', () => {
  const sale = {
    _id: 'sale-1',
    product_type: 'token',
    status: 'paid',
    quantity: 12,
    paymentMethod: 'crypto',
  } as const;

  expect(trackTokenPurchaseOnce(sale)).toBe(true);
  expect(trackTokenPurchaseOnce(sale)).toBe(false);
  expect(trackEvent).toHaveBeenCalledTimes(1);
  expect(trackEvent).toHaveBeenCalledWith('token_purchased', {
    quantity: 12,
    saleId: 'sale-1',
    method: 'crypto',
    $insert_id: 'token-purchased-sale-1',
  });
});

it('does not treat a pending or invalid sale as a purchase', () => {
  expect(
    trackTokenPurchaseOnce({
      _id: 'sale-2',
      product_type: 'token',
      status: 'pending-payment',
      quantity: 12,
      paymentMethod: 'bank',
    }),
  ).toBe(false);
  expect(trackEvent).not.toHaveBeenCalled();
});

it('maps non-crypto payment methods to fiat', () => {
  expect(getTokenPurchaseMethod('crypto')).toBe('crypto');
  expect(getTokenPurchaseMethod('card')).toBe('fiat');
  expect(getTokenPurchaseMethod('bank')).toBe('fiat');
});
