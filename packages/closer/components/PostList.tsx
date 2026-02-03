import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import api, { formatSearch } from '../utils/api';
import CreatePost from './CreatePost';
import Post from './Post';

type TranslateFn = (key: string) => string;

interface User {
  _id: string;
  screenname: string;
  slug: string;
  photo?: string;
}

interface PostData {
  _id: string;
  content: string;
  photo?: string;
  photos?: string[];
  attachment?: {
    url: string;
    image?: string;
    title?: string;
    description?: string;
  };
  channel: string | null;
  tags?: string[];
  createdBy: string;
  created: string;
  replyCount?: number;
}

interface Channel {
  _id: string;
  name: string;
  slug: string;
}

interface Props {
  allowCreate?: boolean;
  channel?: string | null;
  parentType?: string;
  parentId?: string;
  visibility?: string;
  showChannels?: boolean;
}

const PostListSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-white rounded-lg border border-line/20 p-4 animate-pulse"
      >
        <div className="flex gap-3">
          <div className="w-12 h-12 bg-neutral rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-neutral rounded w-1/4 mb-2" />
            <div className="h-3 bg-neutral rounded w-1/6 mb-4" />
            <div className="space-y-2">
              <div className="h-3 bg-neutral rounded w-full" />
              <div className="h-3 bg-neutral rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = () => {
  const t = useTranslations() as TranslateFn;

  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-light/50 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-accent"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {t('post_list_empty_title')}
      </h3>
      <p className="text-gray-500 max-w-sm mx-auto">
        {t('post_list_empty_description')}
      </p>
    </div>
  );
};

const PostList = ({
  allowCreate = false,
  channel = null,
  parentType = 'channel',
  parentId,
  visibility,
  showChannels = false,
}: Props) => {
  const t = useTranslations() as TranslateFn;
  const { user, isAuthenticated } = useAuth();
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usersById, setUsersById] = useState<Record<string, User>>({});
  const [channelsById, setChannelsById] = useState<Record<string, Channel>>({});
  const [posts, setPosts] = useState<PostData[]>([]);

  if (user && !usersById[user._id]) {
    setUsersById({ ...usersById, [user._id]: user });
  }

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const usersMap = { ...usersById };
      const channelsMap = { ...channelsById };

      const where: Record<string, any> = {
        parentType,
        parentId,
      };

      if (channel !== undefined) {
        where.channel = channel;
      }

      const params = {
        params: {
          where: formatSearch(where),
          sort_by: '-created',
          limit: 50,
        },
      };

      const {
        data: { results: loadedPosts },
      } = await api.get('/post', params);
      setPosts(loadedPosts);

      if (loadedPosts?.length > 0) {
        const usersToLoad = loadedPosts
          .map((post: PostData) => post.createdBy)
          .filter((u: string) => !usersById[u]);

        if (usersToLoad.length > 0) {
          const userParams = {
            where: formatSearch({ _id: { $in: usersToLoad } }),
          };
          const {
            data: { results },
          } = await api.get('/user', { params: userParams });
          if (results) {
            results.forEach((u: User) => {
              usersMap[u._id] = u;
            });
            setUsersById(usersMap);
          }
        }

        if (showChannels) {
          const channelIds = [
            ...new Set(
              loadedPosts
                .map((post: PostData) => post.channel)
                .filter(Boolean),
            ),
          ] as string[];

          const channelsToLoad = channelIds.filter((c) => !channelsById[c]);

          if (channelsToLoad.length > 0) {
            const channelParams = {
              where: formatSearch({ _id: { $in: channelsToLoad } }),
            };
            const {
              data: { results: channels },
            } = await api.get('/channel', { params: channelParams });
            if (channels) {
              channels.forEach((c: Channel) => {
                channelsMap[c._id] = c;
              });
              setChannelsById(channelsMap);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Load posts error', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [channel, parentType, parentId]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {isAuthenticated && allowCreate && (
        <CreatePost
          channel={channel}
          visibility={visibility}
          parentType={parentType}
          parentId={parentId}
          addPost={(post: PostData) => setPosts([post, ...posts])}
        />
      )}

      {isLoading ? (
        <PostListSkeleton />
      ) : posts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Post
              {...post}
              usersById={usersById}
              setUsersById={setUsersById}
              channelsById={channelsById}
              showChannel={showChannels}
              key={post._id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostList;
