import { VillageMapItem } from '../../types/village';
import { isVillageDeployed, pickFeaturedVillages } from '../village.utils';

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
  it('counts the closer flag and the live funnel status', () => {
    expect(isVillageDeployed(item('a', { closer: true }))).toBe(true);
    expect(isVillageDeployed(item('b', { onboardingStatus: 'live' }))).toBe(
      true,
    );
  });

  it('does not count villages that are only on the map or mid-deploy', () => {
    expect(isVillageDeployed(item('a'))).toBe(false);
    expect(isVillageDeployed(item('b', { onboardingStatus: 'deploying' }))).toBe(
      false,
    );
    expect(isVillageDeployed(item('c', { closer: false }))).toBe(false);
  });
});

describe('pickFeaturedVillages', () => {
  const villages = [
    item('map-only-1'),
    item('live-1', { onboardingStatus: 'live' }),
    item('map-only-2'),
    item('closer-1', { closer: true }),
    item('map-only-3'),
  ];

  it('puts deployed villages first and keeps each group in order', () => {
    expect(pickFeaturedVillages(villages, 10).map((v) => v.name)).toEqual([
      'live-1',
      'closer-1',
      'map-only-1',
      'map-only-2',
      'map-only-3',
    ]);
  });

  it('caps the list and defaults to six', () => {
    expect(pickFeaturedVillages(villages, 3).map((v) => v.name)).toEqual([
      'live-1',
      'closer-1',
      'map-only-1',
    ]);
    const many = Array.from({ length: 9 }, (_, i) => item(`v${i}`));
    expect(pickFeaturedVillages(many)).toHaveLength(6);
    expect(pickFeaturedVillages(many, 0)).toEqual([]);
  });
});
