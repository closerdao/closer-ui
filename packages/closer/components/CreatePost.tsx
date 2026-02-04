import Link from 'next/link';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { Image as ImageIcon, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import api, { cdn } from '../utils/api';
import { parseMessageFromError } from '../utils/common';
import { getHashTags, getUrls } from '../utils/helpers';
import Button from './ui/Button';
import ProfilePhoto from './ProfilePhoto';

type TranslateFn = (key: string) => string;

interface NewPost {
  content: string;
  tags: string[];
  attachment: {
    url: string;
    image?: string;
    title?: string;
    description?: string;
  } | null;
  photos: string[];
}

interface Props {
  addPost: (post: any) => void;
  channel: string | null;
  parentType?: string;
  parentId?: string;
  isReply?: boolean;
  visibility?: string;
}

const MAX_CHARS = 2000;
const MAX_PHOTOS = 4;

const filterTags = (tags: string[]) => Array.from(new Set(tags));

const CreatePost = ({
  addPost,
  channel,
  parentType,
  parentId,
  isReply = false,
  visibility = 'private',
}: Props) => {
  const t = useTranslations() as TranslateFn;
  const { user, isAuthenticated } = useAuth();
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const initialPost: NewPost = {
    content: '',
    tags: [],
    attachment: null,
    photos: [],
  };
  
  const [newPost, setNewPost] = useState<NewPost>(initialPost);
  const [exploredUrls, setExploredUrls] = useState<string[]>([]);

  const fetchUrlMeta = async (url: string) => {
    try {
      const {
        data: { results: attachment },
      } = await api.get(`/url-lookup/${encodeURIComponent(url)}`);
      setNewPost((prev) => ({ ...prev, attachment }));
    } catch (err) {
      console.warn('Failed to fetch attached URL', url, err);
    }
  };

  useEffect(() => {
    if (!newPost.attachment) {
      const urls = getUrls(newPost.content);
      for (const url of urls) {
        if (!exploredUrls.includes(url)) {
          fetchUrlMeta(url);
          setExploredUrls([...exploredUrls, url]);
          return;
        }
      }
    }
  }, [newPost.content, newPost.attachment, exploredUrls]);

  const updateContent = (content: string) => {
    if (content.length <= MAX_CHARS) {
      const postTags = getHashTags(content) || [];
      setNewPost({
        ...newPost,
        content,
        tags: filterTags(postTags),
      });
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (newPost.photos.length + acceptedFiles.length > MAX_PHOTOS) {
        setError(t('create_post_max_photos_error'));
        return;
      }

      setError(null);
      setUploadingPhotos(true);

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
        setNewPost((prev) => ({
          ...prev,
          photos: [...prev.photos, ...photoIds],
        }));
      } catch (err) {
        const errorMessage = parseMessageFromError(err);
        setError(errorMessage);
      } finally {
        setUploadingPhotos(false);
      }
    },
    [newPost.photos.length, t],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: 'image/jpeg, image/png, image/gif, image/webp',
    multiple: true,
    noClick: true,
    noKeyboard: true,
    maxFiles: MAX_PHOTOS - newPost.photos.length,
  });

  const removePhoto = (photoId: string) => {
    setNewPost((prev) => ({
      ...prev,
      photos: prev.photos.filter((id) => id !== photoId),
    }));
  };

  const postToChannel = async () => {
    if (!newPost.content.trim() && newPost.photos.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { results: post },
      } = await api.post('/post', {
        content: newPost.content,
        tags: newPost.tags,
        attachment: newPost.attachment,
        photo: newPost.photos[0] || null,
        photos: newPost.photos,
        channel,
        parentType,
        parentId,
        visibility,
      });
      addPost(post);
      setNewPost(initialPost);
      setIsFocused(false);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const charCount = newPost.content.length;
  const charPercentage = (charCount / MAX_CHARS) * 100;
  const isNearLimit = charPercentage > 80;
  const isAtLimit = charPercentage >= 100;
  const canSubmit =
    (newPost.content.trim().length > 0 || newPost.photos.length > 0) &&
    !isSubmitting &&
    !uploadingPhotos;

  if (isReply) {
    return (
      <form
        className="flex items-center gap-3 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          postToChannel();
        }}
      >
        <ProfilePhoto user={user} size="8" stack={false} />
        <input
          type="text"
          value={newPost.content}
          placeholder={t('create_post_reply_placeholder')}
          className="flex-1 bg-neutral-light rounded-full px-4 py-2 text-sm border border-line/30 focus:border-accent focus:outline-none transition-colors"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              postToChannel();
            }
          }}
          onChange={(e) => updateContent(e.target.value)}
        />
        <Button
          type="submit"
          size="small"
          isEnabled={canSubmit}
          isLoading={isSubmitting}
          isFullWidth={false}
        >
          {t('create_post_reply_button')}
        </Button>
      </form>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`bg-white rounded-lg border transition-all duration-200 ${
        isDragActive
          ? 'border-accent border-dashed bg-accent-light/20'
          : isFocused
          ? 'border-accent shadow-md'
          : 'border-line/30'
      }`}
    >
      <input {...getInputProps()} />
      
      <div className="p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <ProfilePhoto user={user} size="12" stack={false} />
          </div>
          
          <div className="flex-1 min-w-0">
            <textarea
              value={newPost.content}
              placeholder={t('create_post_placeholder')}
              className="w-full resize-none border-0 bg-transparent text-base placeholder:text-gray-400 focus:outline-none focus:ring-0 min-h-[80px]"
              onFocus={() => setIsFocused(true)}
              onChange={(e) => updateContent(e.target.value)}
              rows={isFocused ? 4 : 2}
            />
            
            {newPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {newPost.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/search/${tag}`}
                    className="text-accent text-sm hover:underline"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}

        {newPost.photos.length > 0 && (
          <div className="mt-4">
            <div
              className={`grid gap-2 ${
                newPost.photos.length === 1
                  ? 'grid-cols-1'
                  : newPost.photos.length === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-2'
              }`}
            >
              {newPost.photos.map((photoId, index) => (
                <div
                  key={photoId}
                  className={`relative group rounded-lg overflow-hidden bg-neutral ${
                    newPost.photos.length === 3 && index === 0
                      ? 'row-span-2'
                      : ''
                  }`}
                >
                  <img
                    src={`${cdn}${photoId}-post-md.jpg`}
                    alt=""
                    className="w-full h-full object-cover aspect-video"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photoId)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={t('create_post_remove_photo')}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {newPost.attachment && (
          <div className="mt-4 border border-line/30 rounded-lg overflow-hidden">
            {newPost.attachment.image && (
              <a
                href={newPost.attachment.url}
                target="_blank"
                rel="noreferrer nofollow"
                className="block"
              >
                <img
                  src={newPost.attachment.image}
                  alt=""
                  className="w-full max-h-48 object-cover"
                />
              </a>
            )}
            <div className="p-3">
              {newPost.attachment.title && (
                <h4 className="font-medium text-sm mb-1">
                  <a
                    href={newPost.attachment.url}
                    target="_blank"
                    rel="noreferrer nofollow"
                    className="hover:text-accent"
                  >
                    {newPost.attachment.title}
                  </a>
                </h4>
              )}
              {newPost.attachment.description && (
                <p className="text-xs text-gray-500 line-clamp-2">
                  {newPost.attachment.description}
                </p>
              )}
              <button
                type="button"
                onClick={() => setNewPost({ ...newPost, attachment: null })}
                className="text-xs text-red-500 hover:underline mt-2"
              >
                {t('create_post_remove')}
              </button>
            </div>
          </div>
        )}

        {isDragActive && (
          <div className="mt-4 p-8 border-2 border-dashed border-accent rounded-lg text-center text-accent">
            {t('create_post_drop_photos')}
          </div>
        )}
      </div>

      {(isFocused || newPost.content || newPost.photos.length > 0) && (
        <div className="px-4 py-3 border-t border-line/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={open}
              disabled={uploadingPhotos || newPost.photos.length >= MAX_PHOTOS}
              className={`p-2 rounded-full transition-colors ${
                uploadingPhotos || newPost.photos.length >= MAX_PHOTOS
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:text-accent hover:bg-accent-light/30'
              }`}
              title={t('create_post_add_photo')}
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            
            {uploadingPhotos && (
              <span className="text-sm text-gray-500">
                {t('create_post_uploading')}
              </span>
            )}
            
            {newPost.photos.length > 0 && !uploadingPhotos && (
              <span className="text-xs text-gray-400">
                {newPost.photos.length}/{MAX_PHOTOS} {t('create_post_photos')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`text-xs ${
                  isAtLimit
                    ? 'text-red-500'
                    : isNearLimit
                    ? 'text-yellow-600'
                    : 'text-gray-400'
                }`}
              >
                {charCount}/{MAX_CHARS}
              </div>
              <div className="w-8 h-8 relative">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="#e5e5e5"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke={
                      isAtLimit
                        ? '#ef4444'
                        : isNearLimit
                        ? '#ca8a04'
                        : '#FE4FB7'
                    }
                    strokeWidth="3"
                    strokeDasharray={`${charPercentage}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <Button
              type="submit"
              size="small"
              isEnabled={canSubmit}
              isLoading={isSubmitting}
              isFullWidth={false}
              onClick={(e) => {
                e.preventDefault();
                postToChannel();
              }}
            >
              {t('create_post_submit_button')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;
