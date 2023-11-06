import React, { FC, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { FaUser } from '@react-icons/all-files/fa/FaUser';

import { useAuth } from '../contexts/auth';
import api from '../utils/api';
import { parseMessageFromError } from '../utils/common';
import { __ } from '../utils/helpers';
import Button from './ui/Button';

interface Props {
  model?: string;
  id?: string;
  onSave?: (photoId: string) => void;
  label?: string;
  isMinimal?: boolean;
  className?: string;
  isPrompt?: boolean;
}

interface UploadPhotoButtonProps {
  isMinimal?: boolean;
  isPrompt?: boolean;
  label?: string;
  getInputProps: any;
}

const UploadPhotoButton = ({
  isMinimal,
  isPrompt,
  label,
  getInputProps,
}: UploadPhotoButtonProps) => {
  return (
    <div
      className={`absolute md:top-0 md:left-0 w-full h-full items-center ${
        isMinimal
          ? 'h-[30px] w-[120px] visible'
          : 'invisible md:group-hover:visible flex items-center justify-center'
      }`}
    >
      <Button
        onClick={(e) => {
          e.preventDefault();
        }}
        size="small"
        className="opacity-75 "
      >
        {isPrompt ? '+' : label}
      </Button>
      <input {...getInputProps()} className="w-full h-full" />
    </div>
  );
};

const UploadPhoto: FC<Props> = ({
  model,
  id,
  onSave,
  label,
  isMinimal = false,
  className,
  isPrompt = false,
}) => {
  const { isAuthenticated, user, refetchUser } = useAuth();
  const [error, setErrors] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cdn = process.env.NEXT_PUBLIC_CDN_URL;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const upload = async (file: File) => {
        setErrors(null);
        setLoading(true);
        try {
          const formData = new FormData();
          formData.append('file', file);
          const {
            data: { results: photo },
          } = await api.post('/upload/photo', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          if (model && id) {
            await api.patch(`/${model}/${id}`, {
              photo: photo._id,
            });
          }
          setLoading(false);
          if (onSave) {
            onSave(photo._id);
          }
          refetchUser();
        } catch (err) {
          const errorMessage = parseMessageFromError(err);
          setErrors(errorMessage);
        }
      };
      acceptedFiles.forEach(upload);
    },
    [id, model, onSave],
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  if (!isAuthenticated) {
    return null;
  }

  const isUserPhoto = model === 'user' && id === user?._id;

  return (
    <>
      <div {...getRootProps()} className={`${isMinimal ? 'w-[120px]': 'w-fit '} relative ${className}`}>
        {isUserPhoto && user?.photo ? (
          <img
            src={`${cdn}${user.photo}-profile-lg.jpg`}
            loading="lazy"
            alt={user.screenname}
            className="group w-32 md:w-44 rounded-full peer"
          />
        ) : model === 'event' || model === 'volunteer' ? (
          <Button size="small" className="group ">
            {__('upload_image_button')}{' '}
          </Button>
        ) : (
          <div className="relative group">
            {!isMinimal && (
              <FaUser
                className={` ${
                  isPrompt ? 'text-3xl text-gray-400' : 'text-gray-200 text-8xl'
                } `}
              />
            )}
            <UploadPhotoButton
              isMinimal={isMinimal}
              isPrompt={isPrompt}
              label={label}
              getInputProps={getInputProps}
            />
          </div>
        )}

        <UploadPhotoButton
          isMinimal={isMinimal}
          isPrompt={isPrompt}
          label={label}
          getInputProps={getInputProps}
        />

        {error && <p className="text-red-500 mt-2">{error}</p>}
        {loading && <p className='absolute top-[40px]'>{__('upload_photo_loading_message')}</p>}
        {isDragActive && <p>{__('upload_photo_prompt_message')}</p>}
      </div>
    </>
  );
};

export default UploadPhoto;
