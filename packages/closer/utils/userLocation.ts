export type UserLocation = {
  type: 'Point';
  coordinates: [number, number];
  timezone: string;
  source: string;
  iso_code: string;
  name: string;
  name_long: string;
};

export const hasUserLocation = (
  location?: { coordinates?: number[] | null } | null,
): boolean => {
  const coordinates = location?.coordinates;
  return (
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    coordinates.every((value) => typeof value === 'number')
  );
};

const readBrowserPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not available'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 5 * 60 * 1000,
    });
  });

const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<{ name: string; name_long: string; iso_code: string }> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error('Reverse geocode failed');
    }
    const data = await response.json();
    const address = data?.address || {};
    const name =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      data?.name ||
      '';
    const country = address.country || '';
    const name_long = [name, country].filter(Boolean).join(', ');
    return {
      name: name || name_long || 'Shared location',
      name_long: name_long || name || 'Shared location',
      iso_code: address.country_code?.toUpperCase?.() || '',
    };
  } catch {
    return {
      name: 'Shared location',
      name_long: 'Shared location',
      iso_code: '',
    };
  }
};

export const captureBrowserUserLocation = async (): Promise<UserLocation> => {
  const position = await readBrowserPosition();
  const { latitude, longitude } = position.coords;
  const place = await reverseGeocode(latitude, longitude);
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  return {
    type: 'Point',
    coordinates: [longitude, latitude],
    timezone,
    source: 'browser',
    iso_code: place.iso_code,
    name: place.name,
    name_long: place.name_long,
  };
};
