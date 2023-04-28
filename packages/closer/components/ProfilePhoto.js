import React from 'react';

import { cdn } from '../utils/api';

const ProfilePhoto = ({ user, size, stack }) => {
  const placeholder = '/images/profile-placeholder.png';
  const url = user?.photo
    ? `${cdn}${user.photo}-profile-sm.jpg`
    : placeholder;

  return (
    <span
      className={`${
        stack ? 'border-white border-2 ' : ''
      }w-${size} h-${size} inline-flex justify-center items-center text-center rounded-full overflow-hidden bg-primary`}
      title={user?.screenname}
    >
      {user?.photo ? (
        <img
          className="relative z-30 object-cover w-full h-full"
          src={url}
          alt={user?.screenname}
          title={user?.screenname}
        />
      ) : (
        <span className="text-lg text-white">
          {user?.screenname
            .split(' ')
            .map((n) => n.slice(0, 1))
            .join('')
            .toUpperCase()}
        </span>
      )}
    </span>
  );
};

ProfilePhoto.defaultProps = {
  size: '12',
};

export default ProfilePhoto;
