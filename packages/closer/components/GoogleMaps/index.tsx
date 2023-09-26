import { useMemo } from 'react';

import { GoogleMap, useLoadScript } from '@react-google-maps/api';

interface Props {
  location: { lat: number; lng: number };
  height?: number;
}

const GoogleMaps = ({ location, height = 450 }: Props) => {
  const libraries = useMemo(() => ['places'], []);
  const mapCenter = useMemo(() => location, []);

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: false,
      clickableIcons: true,
      scrollwheel: true,
    }),
    [],
  );

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string,
    libraries: libraries as any,
  });

  if (!isLoaded) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <GoogleMap
        options={mapOptions}
        zoom={14}
        center={mapCenter}
        mapContainerStyle={{ width: '100%', height: `${height}px` }}
      />
    </div>
  );
};

export default GoogleMaps;
