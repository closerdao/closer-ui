import { FC, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import UploadPhotoButton from './UploadPhotoButton';

interface Props {
  model?: string;
  id?: string;
  onSave?: (photoIds: string[]) => void;
  label?: string;
  isMinimal?: boolean;
  className?: string;
  isPrompt?: boolean;
  isMultiple?: boolean;
}

const UploadPhoto: FC<Props> = ({
  model,
  id,
  onSave,
  label,
  isMinimal = false,
  className,
  isPrompt = false,
  isMultiple = false,
}) => {
  const t = useTranslations();
  const { isAuthenticated, user, refetchUser } = useAuth();
  const [error, setErrors] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isUserPhoto = model === 'user' && id === user?._id;
  const isEditor = model !== 'event' && model !== 'volunteer' && !isUserPhoto;
  const cdn = process.env.NEXT_PUBLIC_CDN_URL;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setErrors(null);
      setLoading(true);

      try {
        const uploadPromises = acceptedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);

          const { data } = await api.post('/upload/photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          return data.results._id;
        });

        const photoIds = await Promise.all(uploadPromises);

        if (model && id) {
          await api.patch(`/${model}/${id}`, {
            photo: isMultiple ? photoIds : photoIds[0], // Single or multiple photo handling
          });
        }

        if (onSave) {
          onSave(photoIds);
        }

        refetchUser();
      } catch (err) {
        const errorMessage = parseMessageFromError(err);
        setErrors(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [id, model, onSave, isMultiple]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: isMultiple,
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div {...getRootProps()} className={`${isMinimal ? 'w-[120px]' : 'w-fit'} relative ${className}`}>
      {/* User photo display */}
      {isUserPhoto && user?.photo && (
        <div>
          <img
            src={`${cdn}${user.photo}-profile-lg.jpg`}
            loading="lazy"
            alt={user.screenname}
            className="group w-32 md:w-44 rounded-full peer"
          />
          <UploadPhotoButton isMinimal={isMinimal} isPrompt={isPrompt} label={label} getInputProps={getInputProps} />
        </div>
      )}

      {/* Placeholder when no user photo */}
      {isUserPhoto && !user?.photo && !isPrompt && (
        <div className="group">
          <FaUser className={`${isPrompt ? 'text-3xl text-gray-400' : 'text-gray-200 text-8xl'}`} />
          <UploadPhotoButton isMinimal={isMinimal} isPrompt={isPrompt} label={label} getInputProps={getInputProps} />
        </div>
      )}

      {/* Upload button for event/volunteer */}
      {(model === 'event' || model === 'volunteer') && (
        <UploadPhotoButton isMinimal={isMinimal} isPrompt={isPrompt} label={label} getInputProps={getInputProps} />
      )}

      {/* Upload button for editor (excluding events/volunteers) */}
      {isEditor && (
        <UploadPhotoButton isMinimal={isMinimal} isPrompt={isPrompt} label={label} getInputProps={getInputProps} />
      )}

      {/* Upload button in prompt mode */}
      {isPrompt && (
        <div className="group">
          <FaUser className="text-3xl text-gray-400" />
          <UploadPhotoButton isMinimal={isMinimal} isPrompt={isPrompt} label={label} getInputProps={getInputProps} />
        </div>
      )}

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {loading && <p className="absolute top-[40px]">{t('upload_photo_loading_message')}</p>}
      {isDragActive && <p>{t('upload_photo_prompt_message')}</p>}
    </div>
  );
};

export default UploadPhoto;
