import { User } from '../contexts/auth/types';
import {
  PlaceGeoJson,
  PlacePrivacy,
  UpcomingVisit,
  UserHome,
} from '../types/userPlaces';
import { LngLat } from '../types/village';

export const PLACE_PRIVACY_OPTIONS: PlacePrivacy[] = ['all', 'citizen'];

export const createPlaceId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `place-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const createPlaceGeoJson = (
  name: string,
  coordinates: LngLat,
  nameLong?: string,
): PlaceGeoJson => ({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates,
  },
  properties: {
    name,
    ...(nameLong ? { name_long: nameLong } : {}),
  },
});

export const isCitizenViewer = (viewer: User | null | undefined): boolean => {
  if (!viewer?.roles?.length) return false;
  return (
    viewer.roles.includes('citizen') ||
    viewer.roles.includes('member') ||
    viewer.roles.includes('admin')
  );
};

export const canViewPlaceVisibility = (
  visibility: PlacePrivacy,
  viewer: User | null | undefined,
  isOwnProfile: boolean,
): boolean => {
  if (isOwnProfile) return true;
  if (visibility === 'all') return true;
  return isCitizenViewer(viewer);
};

export const filterVisibleHomes = (
  homes: UserHome[] | undefined,
  viewer: User | null | undefined,
  isOwnProfile: boolean,
): UserHome[] =>
  (homes || []).filter((home) =>
    canViewPlaceVisibility(home.visibility, viewer, isOwnProfile),
  );

export const filterVisibleUpcomingVisits = (
  visits: UpcomingVisit[] | undefined,
  viewer: User | null | undefined,
  isOwnProfile: boolean,
): UpcomingVisit[] =>
  (visits || []).filter((visit) =>
    canViewPlaceVisibility(visit.visibility, viewer, isOwnProfile),
  );

export const sortUpcomingVisits = (visits: UpcomingVisit[]): UpcomingVisit[] =>
  [...visits].sort((a, b) => a.startDate.localeCompare(b.startDate));
