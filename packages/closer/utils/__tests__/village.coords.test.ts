import { LatLng, LngLat } from '../../types/village';
import { toApiCoords, toLeafletCoords } from '../village.utils';

// Real rows from the village API, which stores GeoJSON [lng, lat].
const PER_AUSET: LngLat = [32.8859219, 24.0206849]; // Aswan, Egypt
const TDF: LngLat = [-8.559098061601965, 38.00315852735004]; // Alentejo, Portugal
const NEXT_GEN: LngLat = [-122, 38]; // California, USA

describe('toLeafletCoords', () => {
  it('swaps GeoJSON [lng, lat] into Leaflet [lat, lng]', () => {
    expect(toLeafletCoords(PER_AUSET)).toEqual([24.0206849, 32.8859219]);
    expect(toLeafletCoords(NEXT_GEN)).toEqual([38, -122]);
  });

  // The previous magnitude-guessing implementation passed these straight
  // through, because both values are <= 90 so neither order looks impossible.
  // Egypt then rendered at lat 32.9 / lng 24.0 — out in the Mediterranean.
  it('swaps even when both values are within latitude range', () => {
    const [lat, lng] = toLeafletCoords(PER_AUSET) as LatLng;
    expect(lat).toBeCloseTo(24.02, 2);
    expect(lng).toBeCloseTo(32.89, 2);

    const [tdfLat, tdfLng] = toLeafletCoords(TDF) as LatLng;
    expect(tdfLat).toBeCloseTo(38.0, 1); // Portugal, not the Indian Ocean
    expect(tdfLng).toBeCloseTo(-8.56, 2);
  });

  it('rescues legacy rows that were written lat-first', () => {
    // [lat, lng] = [38, -122]. Read as [lng, lat] the latitude would be -122,
    // which is out of range, so the original order has to be the right one.
    expect(toLeafletCoords([38, -122])).toEqual([38, -122]);
  });

  it('rejects unusable input', () => {
    expect(toLeafletCoords(undefined)).toBeNull();
    expect(toLeafletCoords(null)).toBeNull();
    expect(toLeafletCoords([1])).toBeNull();
    expect(toLeafletCoords([NaN, 10])).toBeNull();
    expect(toLeafletCoords(['a', 'b'] as unknown as LngLat)).toBeNull();
    expect(toLeafletCoords([200, 200])).toBeNull();
  });
});

describe('toApiCoords', () => {
  it('swaps Leaflet [lat, lng] back into GeoJSON [lng, lat]', () => {
    expect(toApiCoords([24.0206849, 32.8859219])).toEqual(PER_AUSET);
  });

  it('round-trips through the API order without drift', () => {
    const rows: LngLat[] = [PER_AUSET, TDF, NEXT_GEN];
    rows.forEach((row) => {
      const leaflet = toLeafletCoords(row) as LatLng;
      expect(toApiCoords(leaflet)).toEqual(row);
    });
  });
});
