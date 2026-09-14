import {
  canViewPlaceVisibility,
  createPlaceGeoJson,
  filterVisibleHomes,
  filterVisibleUpcomingVisits,
  isCitizenViewer,
  sortUpcomingVisits,
} from '../userPlaces.helpers';
import { UpcomingVisit, UserHome } from '../../types/userPlaces';
import { User } from '../../contexts/auth/types';

const baseHome = (visibility: UserHome['visibility']): UserHome => ({
  id: `home-${visibility}`,
  name: 'Lisbon',
  geojson: createPlaceGeoJson('Lisbon', [-9.14, 38.72], 'Lisbon, Portugal'),
  visibility,
});

const baseVisit = (
  visibility: UpcomingVisit['visibility'],
  startDate: string,
): UpcomingVisit => ({
  id: `visit-${startDate}`,
  name: 'Berlin',
  startDate,
  visibility,
});

const asUser = (roles: string[]): User =>
  ({ _id: 'u1', roles } as User);

describe('userPlaces.helpers', () => {
  it('recognises citizen/member/admin viewers', () => {
    expect(isCitizenViewer(asUser(['citizen']))).toBe(true);
    expect(isCitizenViewer(asUser(['member']))).toBe(true);
    expect(isCitizenViewer(asUser(['admin']))).toBe(true);
    expect(isCitizenViewer(asUser(['guest']))).toBe(false);
    expect(isCitizenViewer(null)).toBe(false);
  });

  it('always shows places to the profile owner', () => {
    expect(canViewPlaceVisibility('citizen', null, true)).toBe(true);
    expect(
      filterVisibleHomes([baseHome('citizen')], null, true),
    ).toHaveLength(1);
  });

  it('hides citizen-only places from non-citizens', () => {
    const homes = [baseHome('all'), baseHome('citizen')];
    expect(filterVisibleHomes(homes, asUser(['guest']), false)).toEqual([
      baseHome('all'),
    ]);
    expect(
      filterVisibleHomes(homes, asUser(['member']), false),
    ).toHaveLength(2);
  });

  it('filters and sorts upcoming visits', () => {
    const visits = [
      baseVisit('all', '2026-10-01'),
      baseVisit('citizen', '2026-09-01'),
      baseVisit('all', '2026-08-01'),
    ];
    expect(
      sortUpcomingVisits(
        filterVisibleUpcomingVisits(visits, asUser(['guest']), false),
      ).map((visit) => visit.startDate),
    ).toEqual(['2026-08-01', '2026-10-01']);
  });
});
