import { Village, VillageMapItem } from '../../types/village';
import {
  isVillageDeployed,
  pickFeaturedVillages,
  villageToMapItem,
} from '../village.utils';

const item = (
  name: string,
  extra: Partial<VillageMapItem> = {},
): VillageMapItem => ({
  name,
  description: '',
  tags: [],
  country: 'Portugal',
  coords: [38, -8],
  ...extra,
});

describe('isVillageDeployed', () => {
  it('counts a village the deploy pipeline has taken live', () => {
    expect(isVillageDeployed(item('a', { onboardingStatus: 'live' }))).toBe(
      true,
    );
  });

  it('does not count villages that are only on the map or mid-deploy', () => {
    expect(isVillageDeployed(item('a'))).toBe(false);
    expect(isVillageDeployed(item('b', { onboardingStatus: 'deploying' }))).toBe(
      false,
    );
    expect(
      isVillageDeployed(item('c', { onboardingStatus: 'deploy_requested' })),
    ).toBe(false);
  });

  it('does not count a deployment that is no longer serving', () => {
    expect(isVillageDeployed(item('a', { onboardingStatus: 'failed' }))).toBe(
      false,
    );
    expect(
      isVillageDeployed(item('b', { onboardingStatus: 'suspended' })),
    ).toBe(false);
  });

  /**
   * The legacy flag is procurement's, written next to the status; a record
   * carrying it without a live status is one whose flag went stale, and the
   * map must not advertise it as a running deployment.
   */
  it('ignores the deprecated closer flag', () => {
    const stale = { closer: true, onboardingStatus: 'map_only' } as const;
    expect(isVillageDeployed(item('a', stale))).toBe(false);
  });
});

describe('villageToMapItem', () => {
  it('carries the deploy status and drops the deprecated flag', () => {
    const village = {
      _id: 'v1',
      name: 'Live one',
      closer: false,
      description: '',
      tags: [],
      country: 'Portugal',
      coords: [-8, 38],
      status: 'active',
      onboardingStatus: 'live',
    } as unknown as Village;

    const mapItem = villageToMapItem(village);
    expect(mapItem?.onboardingStatus).toBe('live');
    expect(mapItem).not.toHaveProperty('closer');
    expect(isVillageDeployed(mapItem as VillageMapItem)).toBe(true);
  });
});

describe('pickFeaturedVillages', () => {
  const villages = [
    item('map-only-1'),
    item('live-1', { onboardingStatus: 'live' }),
    item('map-only-2'),
    item('live-2', { onboardingStatus: 'live' }),
    item('map-only-3'),
  ];

  it('puts deployed villages first and keeps each group in order', () => {
    expect(pickFeaturedVillages(villages, 10).map((v) => v.name)).toEqual([
      'live-1',
      'live-2',
      'map-only-1',
      'map-only-2',
      'map-only-3',
    ]);
  });

  it('caps the list and defaults to six', () => {
    expect(pickFeaturedVillages(villages, 3).map((v) => v.name)).toEqual([
      'live-1',
      'live-2',
      'map-only-1',
    ]);
    const many = Array.from({ length: 9 }, (_, i) => item(`v${i}`));
    expect(pickFeaturedVillages(many)).toHaveLength(6);
    expect(pickFeaturedVillages(many, 0)).toEqual([]);
  });
});
