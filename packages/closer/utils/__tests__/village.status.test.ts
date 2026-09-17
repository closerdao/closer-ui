import type { User } from '../../contexts/auth/types';
import type { Village } from '../../types/village';
import { getVillageOwnerId, resolveVillageStatus } from '../village.utils';

const village = (overrides: Partial<Village> = {}): Village => ({
  _id: 'v-1',
  slug: 'riverbank',
  name: 'Riverbank',
  description: 'On the Douro.',
  tags: [],
  country: 'Portugal',
  coords: [-8.6, 41.1],
  status: 'active',
  ...overrides,
});

const DAY = 24 * 60 * 60 * 1000;

const owner = (
  subscription: Partial<User['subscription']> = {},
): Pick<User, 'subscription'> => ({
  subscription: subscription as User['subscription'],
});

const paying = owner({
  plan: 'village',
  priceId: 'price_123',
  validUntil: new Date(Date.now() + 30 * DAY),
});
const lapsed = owner({
  plan: 'village',
  priceId: 'price_123',
  validUntil: new Date(Date.now() - DAY),
});
const free = owner({ plan: 'explorer', priceId: 'free' });

describe('getVillageOwnerId', () => {
  it('is the creator of a village nobody else filed', () => {
    expect(getVillageOwnerId(village({ createdBy: 'u-owner' }))).toBe(
      'u-owner',
    );
  });

  it('is nobody while the record still belongs to its ambassador', () => {
    expect(
      getVillageOwnerId(village({ createdBy: 'u-amb', referredBy: 'u-amb' })),
    ).toBeNull();
    expect(
      getVillageOwnerId(village({ createdBy: 'u-amb', managedBy: ['u-amb'] })),
    ).toBeNull();
    expect(getVillageOwnerId(village())).toBeNull();
  });

  it('prefers the claim on the project manager card', () => {
    expect(
      getVillageOwnerId(
        village({
          createdBy: 'u-amb',
          referredBy: 'u-amb',
          projectManager: { user: 'u-owner', email: 'owner@example.com' },
        }),
      ),
    ).toBe('u-owner');
  });
});

describe('resolveVillageStatus', () => {
  it('reads subscribed off the owner, whatever was stored', () => {
    expect(
      resolveVillageStatus(
        village({ onboardingStatus: 'intro_scheduled' }),
        paying,
      ),
    ).toBe('subscribed');
    expect(resolveVillageStatus(village(), paying)).toBe('subscribed');
  });

  it('steps a stored subscribed back when the owner is not paying', () => {
    const stored = village({ onboardingStatus: 'subscribed' });
    expect(resolveVillageStatus(stored, lapsed)).toBe('intro_scheduled');
    expect(resolveVillageStatus(stored, free)).toBe('intro_scheduled');
  });

  it('leaves the earlier stages alone for a non-paying owner', () => {
    expect(
      resolveVillageStatus(village({ onboardingStatus: 'pre_assessed' }), free),
    ).toBe('pre_assessed');
  });

  it.each([
    'deploy_requested',
    'deploying',
    'failed',
    'live',
    'suspended',
    'retired',
  ] as const)('leaves %s to the pipeline', (onboardingStatus) => {
    expect(resolveVillageStatus(village({ onboardingStatus }), lapsed)).toBe(
      onboardingStatus,
    );
    expect(resolveVillageStatus(village({ onboardingStatus }), paying)).toBe(
      onboardingStatus,
    );
  });

  it('keeps the stored status when the owner is unknown', () => {
    const stored = village({ onboardingStatus: 'subscribed' });
    expect(resolveVillageStatus(stored)).toBe('subscribed');
    expect(resolveVillageStatus(stored, null)).toBe('subscribed');
    expect(resolveVillageStatus(null)).toBe('map_only');
  });
});
