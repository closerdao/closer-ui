import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { useAuth } from '../contexts/auth';
import api from '../utils/api';
import { __ } from '../utils/helpers';

const UploadPhoto = ({ model, id, onSave, label, minimal }) => {
  const { isAuthenticated } = useAuth();
  const [error, setErrors] = useState(false);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles) => {
      const upload = async (file) => {
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
        } catch (err) {
          console.log(err);
          setErrors(err.message);
        }
      };
      acceptedFiles.forEach((file) => upload(file));
    },
    [id, model, onSave],
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      {...getRootProps()}
      className={`upload-photo cursor-pointer ${
        minimal ? '' : 'mt-2 w-full h-full flex items-center justify-center'
      }`}
    >
      {error && <p className="text-red-500">{error}</p>}
      <input {...getInputProps()} />
      {loading ? (
        <p>{__('upload_photo_loading_message')}</p>
      ) : isDragActive ? (
        <p>{__('upload_photo_prompt_message')}</p>
      ) : (
        <p className="btn-primary">{label}</p>
      )}
    </div>
  );
};
UploadPhoto.defaultProps = {
  minimal: false,
};

export default UploadPhoto;
