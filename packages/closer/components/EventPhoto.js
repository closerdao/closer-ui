import React from 'react';
import Youtube from 'react-youtube-embed';

import UploadPhoto from './UploadPhoto';

const EventPhoto = ({
  event,
  user,
  photo,
  cdn,
  isAuthenticated,
  setPhoto,
}) => (
  <div className="md:w-1/2 md:mr-4 mb-4 relative bg-gray-50 md:h-80">
    {event && event.recording && isAuthenticated ? (
      <Youtube id={event.recording} />
    ) : photo ? (
      <img
        className="object-cover md:h-full md:w-full"
        src={`${cdn}${photo}-max-lg.jpg`}
        alt={event.name}
      />
    ) : (
      event.visual && (
        <img
          className="object-cover md:h-full md:w-full"
          src={event.visual}
          alt={event.name}
        />
      )
    )}
    {isAuthenticated &&
      (user._id === event.createdBy || user.roles.includes('admin')) && (
      <div className="mt-2">
        <UploadPhoto
          model="event"
          minimal
          id={event._id}
          onSave={(id) => setPhoto(id)}
          label={photo ? 'Change photo' : 'Add photo'}
        />
      </div>
    )}
  </div>
);
export default EventPhoto;
