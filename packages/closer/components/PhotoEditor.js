import { useState } from 'react';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Heading from './ui/Heading';
import Photo from './Photo';
import UploadPhoto from './UploadPhoto/UploadPhoto';

const PhotoEditor = ({ value, onChange, label = 'Photo' }) => {
  const t = useTranslations();
  const [photo, setPhoto] = useState(value);

  const addPhoto = (photoId) => {
    setPhoto(photoId);
    onChange && onChange(photoId);
  };

  const deletePhoto = () => {
    setPhoto(null);
    onChange && onChange(null);
  };

  return (
    <div className="photo-group">
      <Heading level={5} className="mb-4">
        {label}
      </Heading>
      
      <div className="grid grid-cols-8 gap-4 mb-4">
        {photo ? (
          <div className="relative">
            <Photo id={photo} />
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (confirm(t('photos_editor_confirm_delete'))) {
                  deletePhoto();
                }
              }}
              className="absolute flex top-0 right-0 z-10 p-1"
            >
              <X className="text-red-500 drop-shadow w-8 h-8 shadow-md" />
            </a>
          </div>
        ) : (
          <div className="w-full py-4">
            <p className="italic">{t('photos_editor_no_photos')}</p>
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

PhotoEditor.defaultProps = {
  onChange: null,
  value: null,
  label: 'Photo',
};

export default PhotoEditor;
