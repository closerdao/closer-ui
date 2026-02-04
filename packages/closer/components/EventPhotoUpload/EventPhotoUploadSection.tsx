import { FC, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslations } from 'next-intl';
import { ImagePlus } from 'lucide-react';
import EventPhoto from '../EventPhoto';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';

function toPhotoId(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    return typeof first === 'string' ? first : (first as { _id?: string })?._id ?? null;
  }
  if (typeof value === 'object' && value !== null && '_id' in value) {
    const id = (value as { _id: unknown })._id;
    return typeof id === 'string' ? id : (id as any)?.toString?.() ?? null;
  }
  return null;
}

interface EventPhotoUploadSectionProps {
  event: any;
  photo: unknown;
  setPhoto: (id: string | null) => void;
  cdn: string | undefined;
  canEditEvent: boolean;
  isAuthenticated: boolean;
  user: any;
}

const EventPhotoUploadSection: FC<EventPhotoUploadSectionProps> = ({
  event,
  photo,
  setPhoto,
  cdn,
  canEditEvent,
  isAuthenticated,
  user,
}) => {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length || !event?._id) return;
      setError(null);
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', acceptedFiles[0]);
        const { data } = await api.post('/upload/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const rawId = data?.results?._id;
        const photoId = typeof rawId === 'string' ? rawId : rawId?.toString?.() ?? String(rawId);
        await api.patch(`/event/${event._id}`, { photo: [photoId] });
        setPhoto(photoId);
      } catch (err) {
        setError(parseMessageFromError(err));
      } finally {
        setLoading(false);
      }
    },
    [event?._id, setPhoto],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'image/*',
    multiple: false,
    disabled: !canEditEvent || loading,
  });

  const photoId = toPhotoId(photo);
  const showDropzone = canEditEvent && isAuthenticated;
  const isEmpty = !photoId && !event?.recording && !event?.visual;

  return (
    <div
      {...(showDropzone ? getRootProps() : {})}
      className={`
        group relative w-full rounded-lg overflow-hidden
        ${showDropzone ? 'min-h-[400px] cursor-pointer' : ''}
        ${isDragActive ? 'ring-2 ring-accent ring-offset-2 bg-accent-light/50' : ''}
        ${isEmpty && showDropzone ? 'border-2 border-dashed border-neutral-dark/40 bg-neutral-light' : 'bg-accent-light'}
      `}
    >
      {showDropzone && <input {...getInputProps()} />}
      {loading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/50 rounded-lg"
          aria-busy
        >
          <span className="text-dominant font-medium text-lg">
            {t('upload_photo_loading_message')}
          </span>
        </div>
      )}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 z-10 rounded-lg bg-error/90 text-white px-3 py-2 text-sm">
          {error}
        </div>
      )}
      <EventPhoto
        event={event}
        photo={photoId}
        cdn={cdn}
        isAuthenticated={isAuthenticated}
        user={user}
        setPhoto={setPhoto}
      />
      {showDropzone && !loading && isEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-foreground/60 pointer-events-none">
          <ImagePlus className="w-12 h-12" />
          <span className="text-sm font-medium">
            {isDragActive ? t('upload_photo_prompt_message') : (t('upload_photo_add_photo') || 'Add photo')}
          </span>
        </div>
      )}
      {showDropzone && !loading && !isEmpty && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg"
          aria-hidden
        >
          <ImagePlus className="w-12 h-12 text-dominant" />
          <span className="text-sm font-medium text-dominant drop-shadow-sm">
            {t('upload_photo_change_photo') || 'Click or drop to upload new photo'}
          </span>
        </div>
      )}
    </div>
  );
};

export default EventPhotoUploadSection;
