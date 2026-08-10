import {
  DashboardEnvFlags,
  getDashboardSubscriptionPlans,
  resolveDashboardFeatures,
} from '../dashboardFeatures';

const allEnvOn: DashboardEnvFlags = {
  booking: 'true',
  subscriptions: 'true',
  volunteering: 'true',
  citizenship: 'true',
  tokenSale: 'true',
  web3Wallet: 'true',
  affiliate: 'true',
  courses: 'true',
};

describe('resolveDashboardFeatures', () => {
  it('requires both the platform config and the env flag', () => {
    const config = { booking: { enabled: true } };

    expect(
      resolveDashboardFeatures(config, allEnvOn).isBookingEnabled,
    ).toBe(true);
    expect(
      resolveDashboardFeatures(config, { ...allEnvOn, booking: 'false' })
        .isBookingEnabled,
    ).toBe(false);
    expect(
      resolveDashboardFeatures({ booking: { enabled: false } }, allEnvOn)
        .isBookingEnabled,
    ).toBe(false);
  });

  it('treats a missing config slug as disabled', () => {
    const features = resolveDashboardFeatures({}, allEnvOn);

    expect(features.isBookingEnabled).toBe(false);
    expect(features.isSubscriptionsEnabled).toBe(false);
    expect(features.isEventsEnabled).toBe(false);
    expect(features.isCitizenshipEnabled).toBe(false);
  });

  it('handles a null config without throwing', () => {
    expect(() => resolveDashboardFeatures(null, allEnvOn)).not.toThrow();
    expect(resolveDashboardFeatures(null, allEnvOn).isBookingEnabled).toBe(
      false,
    );
  });

  it('uses the env flag alone for features with no config slug', () => {
    expect(
      resolveDashboardFeatures({}, { ...allEnvOn, web3Wallet: 'true' })
        .isWeb3Enabled,
    ).toBe(true);
    expect(
      resolveDashboardFeatures({}, { ...allEnvOn, tokenSale: undefined })
        .isTokenSaleEnabled,
    ).toBe(false);
  });

  it('uses the config alone for features with no env flag', () => {
    expect(
      resolveDashboardFeatures({ events: { enabled: true } }, {})
        .isEventsEnabled,
    ).toBe(true);
    expect(
      resolveDashboardFeatures({ governance: { enabled: true } }, {})
        .isGovernanceEnabled,
    ).toBe(true);
  });

  it('only accepts a literal true, not a truthy value', () => {
    const features = resolveDashboardFeatures(
      { events: { enabled: 'yes' } },
      allEnvOn,
    );
    expect(features.isEventsEnabled).toBe(false);
  });
});

describe('getDashboardSubscriptionPlans', () => {
  const config = {
    subscriptions: {
      enabled: true,
      elements: [
        { slug: 'free', title: 'Free', priceId: 'free', available: true },
        { slug: 'wanderer', title: 'Wanderer', priceId: 'price_1', available: true },
        { slug: 'pioneer', title: 'Pioneer', priceId: 'price_2', available: false },
        { slug: 'citizen', title: 'Citizen', priceId: 'price_3', available: true },
      ],
    },
  };

  it('returns paid plans in config order, excluding free and citizen', () => {
    expect(getDashboardSubscriptionPlans(config)).toEqual([
      { slug: 'wanderer', title: 'Wanderer' },
      { slug: 'pioneer', title: 'Pioneer' },
    ]);
  });

  it('includes plans that are not currently on sale', () => {
    // Existing subscribers still need counting after a plan is retired.
    expect(
      getDashboardSubscriptionPlans(config).map((plan) => plan.slug),
    ).toContain('pioneer');
  });

  it('returns an empty list when subscriptions are unconfigured', () => {
    expect(getDashboardSubscriptionPlans({})).toEqual([]);
    expect(getDashboardSubscriptionPlans(null)).toEqual([]);
  });
});
