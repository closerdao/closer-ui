import type { AccountingEntitiesConfig, PaymentConfig } from '../../types/api';
import {
  resolveStripeAccountForCharge,
  stripeAccountSelectValue,
} from '../stripeAccounts';

const payment: Partial<PaymentConfig> = {
  connectedAccounts: [
    { id: 'acct_a', name: 'Alpha' },
    { id: 'acct_b', name: 'Beta' },
  ],
  defaultConnectedAccountId: 'acct_a',
};

const accounting: AccountingEntitiesConfig = {
  enabled: true,
  elements: [
    {
      legalName: 'Stay SL',
      products: ['accommodations'],
      stripeAccount: 'default',
    },
    { legalName: 'Event SL', products: ['events'], stripeAccount: 'acct_b' },
    { legalName: 'Gift SL', products: ['donations'], stripeAccount: 'none' },
  ],
};

describe('resolveStripeAccountForCharge', () => {
  it('uses the default account for default or empty entity values', () => {
    expect(
      resolveStripeAccountForCharge(payment, accounting, {
        productKeys: 'accommodations',
      }),
    ).toEqual({ accountId: 'acct_a', disabled: false });
    expect(
      resolveStripeAccountForCharge(
        payment,
        {
          enabled: true,
          elements: [{ legalName: 'Open', products: ['products'] }],
        },
        { productKeys: 'products' },
      ),
    ).toEqual({ accountId: 'acct_a', disabled: false });
  });

  it('shows an empty Stripe field as the default account, and none as none', () => {
    expect(stripeAccountSelectValue(null, 'acct_a')).toBe('default');
    expect(stripeAccountSelectValue(undefined, 'acct_a')).toBe('default');
    expect(stripeAccountSelectValue('', 'acct_a')).toBe('default');
    expect(stripeAccountSelectValue('default', 'acct_a')).toBe('default');
    expect(stripeAccountSelectValue('acct_a', 'acct_a')).toBe('default');
    expect(stripeAccountSelectValue('none', 'acct_a')).toBe('none');
    expect(stripeAccountSelectValue('acct_b', 'acct_a')).toBe('acct_b');
  });

  it('routes to a named connected account', () => {
    expect(
      resolveStripeAccountForCharge(payment, accounting, {
        productKeys: 'events',
      }),
    ).toEqual({ accountId: 'acct_b', disabled: false });
  });

  it('disables cards for none and for unknown acct ids', () => {
    expect(
      resolveStripeAccountForCharge(payment, accounting, {
        productKeys: 'donations',
      }),
    ).toEqual({ accountId: null, disabled: true });
    expect(
      resolveStripeAccountForCharge(
        payment,
        {
          enabled: true,
          elements: [
            {
              legalName: 'X',
              products: ['products'],
              stripeAccount: 'acct_missing',
            },
          ],
        },
        { productKeys: 'products' },
      ),
    ).toEqual({ accountId: null, disabled: true });
  });
});
