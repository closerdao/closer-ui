import React from 'react';

import { cdn } from '../utils/api';

/*
  Photo sizes:
    profile-sm
    profile-lg
    post-md
    place-lg
    max-lg
    max-xl
*/

const Photo = ({
  id,
  className,
  size,
  title,
  cover,
  rounded,
  width,
  height,
  photoUrl,
}) => {
  const placeholder = '/images/profile-placeholder.png';
  const url = photoUrl
    ? photoUrl
    : id
      ? `${cdn}${id}-profile-${size}.jpg`
      : placeholder;

  return (
    <span
      className={`${className} inline-flex justify-center items-center text-center ${
        rounded ? 'rounded-full overflow-hidden' : ''
      }`}
      title={title}
    >
      {url && (
        <img
          className={cover ? 'relative z-10 object-contain w-full h-full' : ''}
          src={url}
          alt={title}
          title={title}
        />
      )}
    </span>
  );
};

Photo.defaultProps = {
  size: 'sm',
  cover: true,
  className: '',
};

export default Photo;
