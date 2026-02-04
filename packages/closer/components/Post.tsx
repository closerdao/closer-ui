import Link from 'next/link';

import { useEffect, useState } from 'react';

import { ChevronDown, ChevronUp, MessageCircle, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import api, { cdn, formatSearch } from '../utils/api';
import CreatePost from './CreatePost';
import ProfilePhoto from './ProfilePhoto';
import TimeSince from './TimeSince';

type TranslateFn = (key: string) => string;

interface PostAttachment {
  url: string;
  image?: string;
  title?: string;
  description?: string;
}

interface PostData {
  _id: string;
  content: string;
  photo?: string;
  photos?: string[];
  attachment?: PostAttachment;
  channel: string | null;
  tags?: string[];
  createdBy: string;
  created: string;
  replyCount?: number;
}

interface User {
  _id: string;
  screenname: string;
  slug: string;
  photo?: string;
}

interface Channel {
  _id: string;
  name: string;
  slug: string;
}

interface Props extends PostData {
  showChannel?: boolean;
  usersById: Record<string, User>;
  setUsersById?: (users: Record<string, User>) => void;
  channelsById?: Record<string, Channel>;
}

const Post = ({
  _id,
  attachment,
  channel,
  tags,
  createdBy,
  created,
  content,
  photo,
  photos,
  replyCount = 0,
  showChannel,
  usersById,
  setUsersById,
  channelsById = {},
}: Props) => {
  const t = useTranslations() as TranslateFn;

  const [replies, setReplies] = useState<PostData[]>([]);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [localReplyCount, setLocalReplyCount] = useState(replyCount);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null,
  );
  const { user, isAuthenticated } = useAuth();

  const allPhotos = photos?.length ? photos : photo ? [photo] : [];

  const deletePost = async () => {
    if (confirm(t('post_delete_confirm'))) {
      try {
        await api.delete(`/post/${_id}`);
        setDeleted(true);
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  useEffect(() => {
    const loadReplies = async () => {
      try {
        const usersMap = { ...usersById };

        const where = {
          channel,
          parentType: 'post',
          parentId: _id,
        };
        const params = {
          params: {
            where: formatSearch(where),
            sort_by: '-created',
            limit: 100,
          },
        };
        const {
          data: { results: loadedReplies },
        } = await api.get('/post', params);
        setReplies(loadedReplies);

        if (loadedReplies?.length > 0) {
          const usersToLoad = loadedReplies
            .map((post: PostData) => post.createdBy)
            .filter((u: string) => !usersById[u]);
          if (usersToLoad.length > 0) {
            const userParams = {
              where: formatSearch({ _id: { $in: usersToLoad } }),
            };
            const {
              data: { results: users },
            } = await api.get('/user', { params: userParams });
            if (setUsersById && users) {
              users.forEach((u: User) => {
                usersMap[u._id] = u;
              });
              setUsersById(usersMap);
            }
          }
        }
      } catch (err: any) {
        console.error('Load replies error', err);
        setError(err.message);
      }
    };
    loadReplies();
  }, [_id, channel, setUsersById, usersById]);

  if (deleted) {
    return (
      <div className="bg-neutral-light rounded-lg p-6 text-center text-gray-500">
        {t('post_delete_message')}
      </div>
    );
  }

  const author = usersById[createdBy];
  const isOwner = user?._id === createdBy;

  return (
    <article className="bg-white rounded-lg border border-line/20 overflow-hidden hover:border-line/40 transition-colors">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {author && (
            <Link
              href={`/members/${author.slug}`}
              className="flex-shrink-0"
            >
              <ProfilePhoto size="12" user={author} stack={false} />
            </Link>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {author && (
                <Link
                  href={`/members/${author.slug}`}
                  className="font-semibold text-foreground hover:text-accent transition-colors"
                >
                  {author.screenname}
                </Link>
              )}
              <span className="text-gray-400 text-sm">·</span>
              <TimeSince time={created} />
              {showChannel && channel && channelsById[channel] && (
                <>
                  <span className="text-gray-400 text-sm">·</span>
                  <Link
                    href={`/channel/${channelsById[channel].slug}`}
                    className="text-sm text-accent hover:underline"
                  >
                    #{channelsById[channel].name}
                  </Link>
                </>
              )}
            </div>

            {content && (
              <div
                className="mt-2 text-foreground whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{
                  __html: content,
                }}
              />
            )}

            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/search/${tag}`}
                    className="text-sm text-accent hover:underline"
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
      </div>

      {allPhotos.length > 0 && (
        <div
          className={`grid gap-0.5 ${
            allPhotos.length === 1
              ? 'grid-cols-1'
              : allPhotos.length === 2
              ? 'grid-cols-2'
              : allPhotos.length === 3
              ? 'grid-cols-2'
              : 'grid-cols-2'
          }`}
        >
          {allPhotos.map((photoId, index) => (
            <button
              key={photoId}
              type="button"
              onClick={() => setSelectedPhotoIndex(index)}
              className={`relative overflow-hidden bg-neutral cursor-pointer ${
                allPhotos.length === 3 && index === 0
                  ? 'row-span-2 aspect-square'
                  : 'aspect-video'
              } ${allPhotos.length === 1 ? 'aspect-video max-h-[400px]' : ''}`}
            >
              <img
                src={`${cdn}${photoId}-max-lg.jpg`}
                alt=""
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {attachment && (
        <div className="mx-4 mb-4 border border-line/30 rounded-lg overflow-hidden">
          {attachment.image && (
            <a
              href={attachment.url}
              target="_blank"
              rel="nofollow noreferrer"
              className="block"
            >
              <img
                src={attachment.image}
                alt={`${attachment.url} preview`}
                className="w-full max-h-48 object-cover"
              />
            </a>
          )}
          {(attachment.title || attachment.description) && (
            <div className="p-3 bg-neutral-light">
              {attachment.title && (
                <h4 className="font-medium text-sm">
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="nofollow noreferrer"
                    className="hover:text-accent"
                  >
                    {attachment.title}
                  </a>
                </h4>
              )}
              {attachment.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {attachment.description}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {isAuthenticated && (
        <div className="px-4 py-3 border-t border-line/10 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setRepliesOpen(!repliesOpen)}
            className={`flex items-center gap-2 text-sm transition-colors ${
              repliesOpen
                ? 'text-accent'
                : 'text-gray-500 hover:text-accent'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>
              {localReplyCount} {t('post_replies')}
            </span>
            {repliesOpen ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={deletePost}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('post_delete')}</span>
            </button>
          )}
        </div>
      )}

      {isAuthenticated && repliesOpen && (
        <div className="px-4 pb-4 bg-neutral-light/50">
          <CreatePost
            isReply
            channel={channel}
            parentType="post"
            parentId={_id}
            addPost={(newReply: PostData) => {
              setReplies([newReply, ...replies]);
              setLocalReplyCount(localReplyCount + 1);
            }}
          />

          {replies.length > 0 && (
            <div className="mt-4 space-y-3">
              {replies.map((reply) => {
                const replyAuthor = usersById[reply.createdBy];
                if (!replyAuthor) return null;

                return (
                  <div
                    key={reply._id}
                    className="flex gap-3 p-3 bg-white rounded-lg"
                  >
                    <Link
                      href={`/members/${replyAuthor.slug}`}
                      className="flex-shrink-0"
                    >
                      <ProfilePhoto size="8" user={replyAuthor} stack={false} />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/members/${replyAuthor.slug}`}
                          className="font-semibold text-sm hover:text-accent"
                        >
                          {replyAuthor.screenname}
                        </Link>
                        <TimeSince time={reply.created} />
                      </div>
                      {reply.photo && (
                        <img
                          src={`${cdn}${reply.photo}-max-lg.jpg`}
                          alt=""
                          className="mt-2 rounded-lg max-h-48 object-cover"
                          loading="lazy"
                        />
                      )}
                      <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            ×
          </button>
          <img
            src={`${cdn}${allPhotos[selectedPhotoIndex]}-max-lg.jpg`}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {allPhotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {allPhotos.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhotoIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === selectedPhotoIndex
                      ? 'bg-white'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default Post;
