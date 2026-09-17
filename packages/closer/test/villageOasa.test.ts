import type { Village } from '../types/village';
import { isOasaVillage, villageToMapItem } from '../utils/village.utils';

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

describe('OASA villages', () => {
  it('carries the fund cohort onto the map item, so the map can highlight it', () => {
    const item = villageToMapItem(
      village({ oasa: { fundCohort: 'cohort-1' } }),
    );
    expect(item?.oasaFundCohort).toBe('cohort-1');
    expect(villageToMapItem(village())?.oasaFundCohort).toBeNull();
  });

  it('reads the tie off either shape', () => {
    expect(isOasaVillage(village({ oasa: { fundCohort: 'cohort-1' } }))).toBe(
      true,
    );
    expect(isOasaVillage(village({ oasa: { fundCohort: null } }))).toBe(false);
    expect(isOasaVillage(village())).toBe(false);
    expect(isOasaVillage({ oasaFundCohort: 'cohort-1' })).toBe(true);
    expect(isOasaVillage({ oasaFundCohort: null })).toBe(false);
    expect(isOasaVillage(null)).toBe(false);
  });
});
