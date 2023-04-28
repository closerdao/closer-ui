import { useState } from 'react';

import { TiDelete } from '@react-icons/all-files/ti/TiDelete';

import { __ } from '../utils/helpers';
import Photo from './Photo';
import UploadPhoto from './UploadPhoto';

const PhotosEditor = ({ value, onChange }) => {
  const hasMultiplePhotos = Array.isArray(value);
  const [photos, setPhotos] = useState(hasMultiplePhotos ? value : [value]);

  const addPhoto = (photo) => {
    const update = (photos || []).concat(photo);
    setPhotos(update);
    onChange && onChange(update);
  };

  const deletePhoto = (photo) => {
    const update = (photos || []).filter((id) => id !== photo);
    setPhotos(update);
    onChange && onChange(update);
  };

  return (
    <div className="photo-group">
      <div className="grid grid-cols-8 gap-4 mb-4">
        {photos && photos.length > 0 ? (
          photos?.map((photo) => (
            <div key={photo} className="relative">
              <Photo id={photo} />
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (confirm(__('photos_editor_confirm_delete'))) {
                    deletePhoto(photo);
                  }
                }}
                className="absolute top-0 right-0 z-10 p-1"
              >
                <TiDelete className="text-white drop-shadow text-3xl hover:text-black" />
              </a>
            </div>
          ))
        ) : (
          <div className="w-full py-4">
            <p className="italic">{__('photos_editor_no_photos')}</p>
          </div>
        )}
      </div>
      <div className="actions">
        <UploadPhoto
          isMinimal
          onSave={(id) => addPhoto(id)}
          label="Add photo"
        />
      </div>
    </div>
  );
};

PhotosEditor.defaultProps = {
  onChange: null,
  value: [],
};

export default PhotosEditor;
