import React, { FC, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import UserAvatarPlaceholder from '../UserAvatarPlaceholder';
import UploadPhotoButton from './UploadPhotoButton';

interface Props {
  model?: string;
  id?: string;
  onSave?: (photoIds: string[] | string) => void;
  onDelete?: () => void;
  label?: string;
  isMinimal?: boolean;
  className?: string;
  isPrompt?: boolean;
  allowDelete?: boolean;
}

const UploadPhoto: FC<Props> = ({
  model,
  id,
  onSave,
  onDelete,
  label,
  isMinimal = false,
  className,
  isPrompt = false,
  allowDelete = false,
}) => {
  const t = useTranslations();
  const { isAuthenticated, user, refetchUser } = useAuth();
  const [error, setErrors] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isUserPhoto = model === 'user' && id === user?._id;
  const isEditor = model !== 'event' && model !== 'volunteer' && !isUserPhoto;
  const cdn = process.env.NEXT_PUBLIC_CDN_URL;

  const handleDeletePhoto = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!model || !id) return;

    setErrors(null);
    setIsDeleting(true);

    try {
      await api.patch(`/${model}/${id}`, { photo: null });
      refetchUser();
      if (onDelete) onDelete();
    } catch (err) {
      const errorMessage = parseMessageFromError(err);
      setErrors(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

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
            photo: photoIds, // Single or multiple photo handling
          });
        }

        if (onSave) {
          // For single-photo case (like user photos), pass the first ID string
          // For multi-photo case, pass the whole array
          if (isUserPhoto || photoIds.length === 1) {
            onSave(photoIds[0]);
          } else {
            onSave(photoIds);
          }
        }

        refetchUser();
      } catch (err) {
        const errorMessage = parseMessageFromError(err);
        setErrors(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [id, model, onSave, isUserPhoto, refetchUser],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: isUserPhoto ? false : true,
  });

  if (!isAuthenticated) {
    return null;
  }

  const showDeleteButton = allowDelete && !isPrompt && isUserPhoto && user?.photo;

  return (
    <div className={`${isMinimal ? 'w-[120px]' : 'w-fit'} ${className}`}>
      <div
        {...getRootProps()}
        className="relative"
      >
        {isUserPhoto && user?.photo && (
          <div className="group">
            <img
              src={`${cdn}${user.photo}-profile-lg.jpg`}
              loading="lazy"
              alt={user.screenname}
              className={`rounded-full peer ${isPrompt ? 'w-10 h-10' : 'w-32 md:w-44'}`}
            />
            <UploadPhotoButton
              isMinimal={isMinimal}
              isPrompt={isPrompt}
              label={label}
              getInputProps={getInputProps}
            />
          </div>
        )}

      {isUserPhoto && !user?.photo && !isPrompt && (
        <div className="group">
          <UserAvatarPlaceholder size="3xl" />
          <UploadPhotoButton
            isMinimal={isMinimal}
            isPrompt={isPrompt}
            label={label}
            getInputProps={getInputProps}
          />
        </div>
      )}

        {(model === 'event' || model === 'volunteer') && (
          <UploadPhotoButton
            isMinimal={isMinimal}
            isPrompt={isPrompt}
            label={label}
            getInputProps={getInputProps}
          />
        )}

        {isEditor && (
          <UploadPhotoButton
            isMinimal={isMinimal}
            isPrompt={isPrompt}
            label={label}
            getInputProps={getInputProps}
          />
        )}

      {isPrompt && !(isUserPhoto && user?.photo) && (
        <div className="group">
          <UserAvatarPlaceholder size="md" />
          <UploadPhotoButton
            isMinimal={isMinimal}
            isPrompt={isPrompt}
            label={label}
            getInputProps={getInputProps}
          />
        </div>
      )}

        {error && <p className="text-red-500 mt-2">{error}</p>}
        {loading && (
          <p className="absolute top-[40px]">
            {t('upload_photo_loading_message')}
          </p>
        )}
        {isDragActive && <p>{t('upload_photo_prompt_message')}</p>}
      </div>

      {showDeleteButton && (
        <button
          type="button"
          onClick={handleDeletePhoto}
          disabled={isDeleting}
          className="mt-2 flex items-center gap-1 text-sm text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {isDeleting
            ? t('upload_photo_loading_message')
            : t('settings_delete_photo')}
        </button>
      )}
    </div>
  );
};

export default UploadPhoto;
