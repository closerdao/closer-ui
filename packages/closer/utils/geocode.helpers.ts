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

const NOMINATIM_USER_AGENT =
  'Closer/1.0 (profile-places; https://closer.earth)';

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

const mapNominatimResults = (
  results: NominatimResult[],
): GeocodeResult[] =>
  results
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

export const searchNominatimPlaces = async (
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
        'User-Agent': NOMINATIM_USER_AGENT,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Place search failed (${response.status})`);
  }

  const results = (await response.json()) as NominatimResult[];
  return mapNominatimResults(results);
};

export const searchPlaces = async (
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({ q: trimmed });
  const response = await fetch(`/api/places/search?${params.toString()}`, {
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Place search failed (${response.status})`);
  }

  const payload = (await response.json()) as { results?: GeocodeResult[] };
  return Array.isArray(payload.results) ? payload.results : [];
};
