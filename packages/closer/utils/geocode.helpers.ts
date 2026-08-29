import { LngLat } from '../types/village';

export type GeocodeResult = {
  name: string;
  nameLong: string;
  coordinates: LngLat;
};

type NominatimResult = {
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
  };
};

const shortNameFromResult = (result: NominatimResult): string => {
  const address = result.address;
  return (
    address?.city ||
    address?.town ||
    address?.village ||
    address?.municipality ||
    result.name ||
    result.display_name?.split(',')[0]?.trim() ||
    ''
  );
};

export const searchPlaces = async (
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    format: 'json',
    q: trimmed,
    addressdetails: '1',
    limit: '6',
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      signal,
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Place search failed (${response.status})`);
  }

  const results = (await response.json()) as NominatimResult[];

  return results
    .map((result) => {
      const lat = Number(result.lat);
      const lng = Number(result.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      const name = shortNameFromResult(result);
      if (!name) return null;

      return {
        name,
        nameLong: result.display_name || name,
        coordinates: [lng, lat] as LngLat,
      };
    })
    .filter((result): result is GeocodeResult => Boolean(result));
};
