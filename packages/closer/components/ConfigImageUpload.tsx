import { FC, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslations } from 'next-intl';
import { ImagePlus, X } from 'lucide-react';
import { UPLOAD_FILE_PATH } from '../constants';
import { FileUploadResult } from '../types/api';
import api from '../utils/api';
import { parseMessageFromError } from '../utils/common';
import { Button } from './ui';

interface ConfigImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

const ConfigImageUpload: FC<ConfigImageUploadProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      setError(null);
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', acceptedFiles[0]);
        const { data } = await api.post<{ results: FileUploadResult }>(
          UPLOAD_FILE_PATH,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          },
        );
        const fileResult = data?.results;
        if (fileResult?.url) {
          onChange(fileResult.url);
        }
      } catch (err) {
        setError(parseMessageFromError(err));
      } finally {
        setLoading(false);
      }
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'image/*',
    multiple: false,
    disabled: disabled || loading,
  });

  const hasImage = Boolean(value);

  return (
    <div className="flex flex-col gap-2">
      <div
        {...(disabled || loading ? {} : getRootProps())}
        className={`
          relative flex flex-col items-center justify-center min-h-[120px] w-full max-w-xs rounded-lg border border-gray-200
          ${!disabled && !loading ? 'cursor-pointer hover:border-accent/50 hover:bg-gray-50' : ''}
          ${isDragActive ? 'ring-2 ring-accent ring-offset-2 bg-accent/5' : ''}
          ${hasImage ? 'p-2' : 'border-dashed'}
        `}
      >
        {!disabled && !loading && <input {...getInputProps()} />}
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 rounded-lg">
            <span className="text-sm font-medium text-gray-600">
              {t('upload_photo_loading_message')}
            </span>
          </div>
        )}
        {error && (
          <div className="w-full rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}
        {hasImage && !loading ? (
          <div className="relative flex flex-col items-center gap-2">
            <img
              src={value}
              alt="Logo preview"
              className="max-h-20 w-auto object-contain"
            />
            {!disabled && (
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                {t('config_remove_image')}
              </Button>
            )}
          </div>
        ) : !loading && (
          <div className="flex flex-col items-center gap-2 py-4 text-gray-500">
            <ImagePlus className="w-10 h-10" />
            <span className="text-sm">
              {isDragActive
                ? t('upload_photo_prompt_message')
                : t('upload_photo_add_photo')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigImageUpload;
