import {
  firstQueryValue,
  resolveStripeConnectReturnTo,
  stripeConnectQueryFromConnectStatus,
  withStripeConnectQuery,
} from '../stripeConnectReturnTo';

describe('resolveStripeConnectReturnTo', () => {
  it('allows payment settings and the future onboarding path', () => {
    expect(resolveStripeConnectReturnTo('/admin/config')).toBe('/admin/config');
    expect(resolveStripeConnectReturnTo('/village/onboarding')).toBe(
      '/village/onboarding',
    );
    expect(resolveStripeConnectReturnTo('/admin/config?config=payment')).toBe(
      '/admin/config',
    );
  });

  it('rejects absolute URLs, protocol-relative URLs, and unknown paths', () => {
    expect(resolveStripeConnectReturnTo('https://evil.example/phish')).toBe(
      '/admin/config',
    );
    expect(resolveStripeConnectReturnTo('//evil.example/phish')).toBe(
      '/admin/config',
    );
    expect(resolveStripeConnectReturnTo('/admin/users')).toBe('/admin/config');
    expect(resolveStripeConnectReturnTo(undefined)).toBe('/admin/config');
  });
});

describe('firstQueryValue', () => {
  it('returns the first string from Next query values', () => {
    expect(firstQueryValue('a')).toBe('a');
    expect(firstQueryValue(['a', 'b'])).toBe('a');
    expect(firstQueryValue(undefined)).toBeUndefined();
  });
});

describe('withStripeConnectQuery', () => {
  it('appends stripeConnect without dropping config=payment on admin config', () => {
    expect(withStripeConnectQuery('/admin/config', 'pending')).toBe(
      '/admin/config?config=payment&stripeConnect=pending',
    );
    expect(withStripeConnectQuery('/village/onboarding', 'failed')).toBe(
      '/village/onboarding?stripeConnect=failed',
    );
  });

  it('maps connectStatus to the callback query', () => {
    expect(stripeConnectQueryFromConnectStatus('active')).toBe('success');
    expect(stripeConnectQueryFromConnectStatus('pending')).toBe('pending');
    expect(stripeConnectQueryFromConnectStatus(undefined)).toBe('pending');
  });
});
