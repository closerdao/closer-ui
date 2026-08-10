import React, { useState } from 'react';
import Youtube from 'react-youtube-embed';
import { toPhotoId } from '../../utils/events.helpers';

const EventPhoto = ({
  event,
  photo,
  cdn,
  isAuthenticated,
  user: _user,
  setPhoto: _setPhoto,
}: {
  event: any;
  photo: unknown;
  cdn: string | undefined;
  isAuthenticated: boolean;
  user: any;
  setPhoto: (id: string | null) => void;
}) => {
  const [imgError, setImgError] = useState(false);
  const photoId = toPhotoId(photo);
  const imageUrl = photoId && cdn ? `${cdn}${photoId}-max-lg.jpg` : null;

  return (
    <div className="relative bg-gray-50">
      {event && event.recording && isAuthenticated ? (
        <Youtube id={event.recording} />
      ) : photoId && imageUrl && !imgError ? (
        <div className="h-[400px] w-full bg-accent-light rounded-lg overflow-hidden">
          <img
            className="object-cover h-full w-full"
            src={imageUrl}
            alt={event?.name ?? 'Event'}
            onError={() => setImgError(true)}
          />
        </div>
      ) : photoId && imgError ? (
        <div className="h-[400px] w-full bg-neutral-light rounded-lg flex items-center justify-center text-foreground/60">
          <span className="text-sm">Image unavailable</span>
        </div>
      ) : event?.visual ? (
        <div className="h-[200px]">
          <img
            className="object-cover h-full w-full"
            src={event.visual}
            alt={event?.name ?? 'Event'}
          />
        </div>
      ) : null}
    </div>
  );
};

export default EventPhoto;
