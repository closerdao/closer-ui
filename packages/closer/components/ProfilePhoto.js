import React from 'react';

import { cdn } from '../utils/api';

const ProfilePhoto = ({ user, size = '12', stack }) => {
  const hasPhoto = Boolean(user?.photo);
  const url = hasPhoto ? `${cdn}${user.photo}-profile-sm.jpg` : null;
  const initials =
    user?.screenname &&
    user.screenname
      .split(' ')
      .map((n) => n.slice(0, 1))
      .join('')
      .toUpperCase();

  return (
    <span
      className={`${
        stack ? 'border-white border-2 ' : ''
      } w-${size} h-${size} inline-flex justify-center items-center text-center rounded-full overflow-hidden bg-neutral${
        hasPhoto ? '' : ' text-muted-foreground'
      }`}
      title={user?.screenname}
    >
      {hasPhoto ? (
        <img
          className="relative  object-cover w-full h-full"
          src={url}
          alt={user?.screenname}
          title={user?.screenname}
        />
      ) : (
        <span className="text-lg font-medium leading-none tracking-tight">
          {initials || '?'}
        </span>
      )}
    </span>
  );
};

export default ProfilePhoto;
