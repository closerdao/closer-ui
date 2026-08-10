import { FC, useCallback, useEffect, useState } from 'react';
import { FileRejection, useDropzone } from 'react-dropzone';

import { ImagePlus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { parseMessageFromError } from '../utils/common';
import {
  FAVICON_ACCEPTED_TYPES,
  FAVICON_DROPZONE_ACCEPT,
  FAVICON_MAX_UPLOAD_BYTES,
  getFaviconPreviewUrl,
} from '../utils/favicon';
import { normalizeToSquarePng } from '../utils/faviconImage';
import { uploadFaviconImage } from '../utils/faviconUpload';
import { Button } from './ui';

interface FaviconUploadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  platformName?: string;
}

const FaviconUpload: FC<FaviconUploadProps> = ({
  value,
  onChange,
  disabled = false,
  platformName,
}) => {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasPadded, setWasPadded] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const cdn = process.env.NEXT_PUBLIC_CDN_URL;
  const storedPreview = getFaviconPreviewUrl(value, cdn);
  // The freshly uploaded blob renders instantly; the stored URL takes over on
  // the next mount, once the CDN has it.
  const previewUrl = localPreview || storedPreview;

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const clearLocalPreview = useCallback(() => {
    setLocalPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[] = []) => {
      if (!acceptedFiles.length) {
        if (fileRejections.length) {
          const rejected = fileRejections[0]?.file;
          setError(
            rejected && rejected.size > FAVICON_MAX_UPLOAD_BYTES
              ? t('config_favicon_too_large')
              : t('config_favicon_invalid_type'),
          );
        }
        return;
      }

      const source = acceptedFiles[0];

      if (source.size > FAVICON_MAX_UPLOAD_BYTES) {
        setError(t('config_favicon_too_large'));
        return;
      }
      if (!FAVICON_ACCEPTED_TYPES.includes(source.type)) {
        setError(t('config_favicon_invalid_type'));
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const { file, wasPadded: padded } = await normalizeToSquarePng(source);
        const storedValue = await uploadFaviconImage(file);

        if (storedValue) {
          clearLocalPreview();
          setLocalPreview(URL.createObjectURL(file));
          setWasPadded(padded);
          onChange(storedValue);
        }
      } catch (err) {
        setError(
          (err as Error)?.message === 'decode_failed'
            ? t('config_favicon_invalid_type')
            : parseMessageFromError(err),
        );
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t is stable for the lifetime of this handler
    [onChange, clearLocalPreview],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: FAVICON_DROPZONE_ACCEPT,
    maxSize: FAVICON_MAX_UPLOAD_BYTES,
    multiple: false,
    disabled: disabled || loading,
  });

  const handleRemove = () => {
    clearLocalPreview();
    setWasPadded(false);
    setError(null);
    onChange('');
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        {...(disabled || loading ? {} : getRootProps())}
        className={`
          relative flex flex-col items-center justify-center min-h-[120px] w-full max-w-xs rounded-lg border border-gray-200
          ${
            !disabled && !loading
              ? 'cursor-pointer hover:border-accent/50 hover:bg-gray-50'
              : ''
          }
          ${isDragActive ? 'ring-2 ring-accent ring-offset-2 bg-accent/5' : ''}
          ${previewUrl ? 'p-3' : 'border-dashed'}
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
        {previewUrl && !loading ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <span className="text-xs text-gray-500 self-start">
              {t('config_favicon_preview_label')}
            </span>

            <div className="flex items-end gap-3 w-full">
              {/* A tab mock, because 16px is the size the admin is deciding about. */}
              <div className="flex-1 min-w-0 rounded-t-lg border border-b-0 border-gray-200 bg-gray-100 px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <img
                    src={previewUrl}
                    alt=""
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain shrink-0"
                  />
                  <span className="text-[11px] text-gray-700 truncate">
                    {platformName || 'Closer'}
                  </span>
                </div>
              </div>

              <img
                src={previewUrl}
                alt=""
                width={32}
                height={32}
                className="w-8 h-8 object-contain shrink-0"
              />
            </div>

            {!disabled && (
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="flex items-center gap-1 self-start"
              >
                <X className="w-3 h-3" />
                {t('config_remove_image')}
              </Button>
            )}
          </div>
        ) : (
          !loading && (
            <div className="flex flex-col items-center gap-2 py-4 text-gray-500">
              <ImagePlus className="w-10 h-10" />
              <span className="text-sm">
                {isDragActive
                  ? t('upload_photo_prompt_message')
                  : t('upload_photo_add_photo')}
              </span>
            </div>
          )
        )}
      </div>

      {error && (
        <div className="w-full max-w-xs rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}
      {wasPadded && !error && (
        <p className="max-w-xs text-xs text-gray-500">
          {t('config_favicon_padded_notice')}
        </p>
      )}
      <p className="max-w-xs text-xs text-gray-500">
        {t('config_favicon_hint')}
      </p>
    </div>
  );
};

export default FaviconUpload;
