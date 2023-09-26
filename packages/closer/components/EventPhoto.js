import React from 'react';
import Youtube from 'react-youtube-embed';

const EventPhoto = ({ event, user, photo, cdn, isAuthenticated, setPhoto }) => (
  <div className="relative bg-gray-50 ">
    {event && event.recording && isAuthenticated ? (
      <Youtube id={event.recording} />
    ) : photo ? (
      <div className='h-[350px] w-full bg-accent-light'>
        <img
          className="object-cover h-full w-full rounded-lg"
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
