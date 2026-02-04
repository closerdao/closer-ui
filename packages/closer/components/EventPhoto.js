import React from 'react';
import Youtube from 'react-youtube-embed';

const EventPhoto = ({ event, photo, cdn, isAuthenticated, user: _user, setPhoto: _setPhoto }) => (
  <div className="relative bg-gray-50 ">
    {event && event.recording && isAuthenticated ? (
      <Youtube id={event.recording} />
    ) : photo ? (
      <div className='h-[400px] w-full bg-accent-light rounded-lg overflow-hidden'>
        <img
          className="object-cover h-full w-full "
          src={`${cdn}${photo}-max-lg.jpg`}
          alt={event && event.name}
        />
      </div>
    ) : (
      event && event.visual && (
        <div className='h-[200px]'>
          <img
            className="object-cover h-full w-full"
            src={event && event.visual}
            alt={event && event.name}
          />
        </div>
      )
    )}
  </div>
);
export default EventPhoto;
