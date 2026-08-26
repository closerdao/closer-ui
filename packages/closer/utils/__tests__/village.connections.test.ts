import { Village } from '../../types/village';
import { getVillageConnectionRoles } from '../village.utils';

const village = (overrides: Partial<Village>): Village =>
  ({
    _id: 'v1',
    name: 'Test Village',
    closer: false,
    description: '',
    tags: [],
    country: 'PT',
    coords: [-8.6, 40.6],
    status: 'active',
    ...overrides,
  } as Village);

describe('getVillageConnectionRoles', () => {
  it('names every way the user is tied to the village, strongest first', () => {
    expect(
      getVillageConnectionRoles(
        village({
          ambassadorId: 'u1',
          managedBy: ['u1', 'u2'],
          createdBy: 'u1',
          referredBy: 'u1',
        }),
        'u1',
      ),
    ).toEqual(['ambassador', 'manager', 'creator', 'referrer']);
  });

  it('returns a single role for a plain manager', () => {
    expect(
      getVillageConnectionRoles(village({ managedBy: ['u1'] }), 'u1'),
    ).toEqual(['manager']);
  });

  it('is empty for an unrelated user and for no user at all', () => {
    const connected = village({ ambassadorId: 'u1', managedBy: ['u1'] });
    expect(getVillageConnectionRoles(connected, 'u2')).toEqual([]);
    expect(getVillageConnectionRoles(connected, undefined)).toEqual([]);
  });
});
