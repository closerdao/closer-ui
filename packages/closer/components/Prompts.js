import React, { useState } from 'react';

import { useAuth } from '../contexts/auth';
import { cdn } from '../utils/api';
import UploadPhoto from './UploadPhoto';

const Prompts = () => {
  const { user, isAuthenticated, setUser } = useAuth();
  const [isClosed, setIsClosed] = useState(false);
  const [photo, setPhoto] = useState(null);

  if (!isAuthenticated) {
    return null;
  }

  const image = photo || user.photo;

  if (!user?.photo && !isClosed) {
    return (
      <div>
        <div className="main-content p-3 justify-between flex flex-col relative text-center shadow-sm">
          <div className="p-2">
            {image ? (
              <p>Looking good {user.screenname} ♥️</p>
            ) : (
              <p>
                It&apos;s nice to have you here {user.screenname}. Now
                let&apos;s add a photo to your profile ♥️
              </p>
            )}
          </div>
          <div className="flex flex-row justify-center items-center">
            <div>
              {image && (
                <img
                  src={`${cdn}${image}-max-lg.jpg`}
                  alt={user.screenname}
                  className="w-16 h-16 rounded-full"
                />
              )}
            </div>
            <div className="ml-4">
              <UploadPhoto
                model="user"
                id={user._id}
                onSave={(id) => {
                  setPhoto(id);
                  setTimeout(() => setUser({ ...user, photo: id }), 4000);
                }}
                label={image ? 'Change photo' : 'Add photo'}
              />
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsClosed(true);
              }}
            >
              Close this
            </a>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default Prompts;
