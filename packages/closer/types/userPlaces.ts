import { LngLat } from './village';

export type PlacePrivacy = 'citizen' | 'all';

export type PlaceGeoJson = {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: LngLat;
  };
  properties: {
    name: string;
    name_long?: string;
  };
};

export type UserHome = {
  id: string;
  name: string;
  geojson: PlaceGeoJson;
  visibility: PlacePrivacy;
};

export type UpcomingVisit = {
  id: string;
  name: string;
  geojson?: PlaceGeoJson;
  startDate: string;
  endDate?: string;
  visibility: PlacePrivacy;
};
