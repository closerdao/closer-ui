import Link from 'next/link';

import { useEffect, useMemo, ReactNode, useState } from 'react';

import {
  Calendar,
  Hash,
  MapPin,
  MessageSquare,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { Channel, ChannelType } from '../types/channel';
import api from '../utils/api';

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

interface ChannelGroup {
  type: ChannelType;
  label: string;
  icon: ReactNode;
  channels: Channel[];
}

type SubscribeStatus = 'idle' | 'loading' | 'success' | 'pending' | 'error';

interface SubscribeState {
  status: SubscribeStatus;
  message?: string;
  presenceRequired?: number;
  userPresence?: number;
}

export interface ChannelListProps {
  onSelectChannel?: (channel: Channel) => void;
  selectedChannelId?: string | null;
  initialSlug?: string | null;
  channels?: Channel[];
  channelsLoading?: boolean;
  channelsError?: string | null;
  subscribeStates?: Record<string, SubscribeState>;
  onSubscribe?: (channelId: string) => void;
  userPresence?: number;
  unreadCounts?: Record<string, number>;
}

const ChannelListSkeleton = () => (
  <div className="px-3 py-2 space-y-2.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="flex items-center gap-2.5 px-3 py-2.5 animate-pulse rounded-xl"
      >
        <div className="w-8 h-8 bg-neutral rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-2.5 bg-neutral rounded w-2/3 mb-1.5" />
          <div className="h-2 bg-neutral rounded w-11/12" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyChannels = ({ t }: { t: TranslateFn }) => (
  <div className="text-center py-12 px-4">
    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-accent-light/50 flex items-center justify-center">
      <MessageSquare className="w-6 h-6 text-accent" />
    </div>
    <h3 className="text-sm font-semibold text-foreground mb-1">
      {t('channels_empty_title')}
    </h3>
    <p className="text-xs text-gray-500 max-w-xs mx-auto">
      {t('channels_empty_description')}
    </p>
  </div>
);

const channelTypeIcon = (channelType: ChannelType) => {
  switch (channelType) {
    case 'season':
      return <Calendar className="w-4 h-4 text-white" />;
    case 'ground':
      return <MapPin className="w-4 h-4 text-white" />;
    case 'topic':
      return <Hash className="w-4 h-4 text-white" />;
    default:
      return <Hash className="w-4 h-4 text-white" />;
  }
};

const channelTypeColor = (channelType: ChannelType) => {
  switch (channelType) {
    case 'season':
      return 'bg-accent';
    case 'ground':
      return 'bg-green-500';
    case 'topic':
      return 'bg-purple-500';
    default:
      return 'bg-gray-400';
  }
};

interface ChannelRowProps {
  channel: Channel;
  isSelected: boolean;
  onClick?: () => void;
  userId?: string;
  userPresence: number;
  subscribeStates: Record<string, SubscribeState>;
  onSubscribe: (channelId: string) => void;
  unreadCount?: number;
  t: TranslateFn;
}

const ChannelRow = ({
  channel,
  isSelected,
  onClick,
  userId,
  userPresence,
  subscribeStates,
  onSubscribe,
  unreadCount,
  t,
}: ChannelRowProps) => {
  const isGround = channel.channelType === 'ground';
  const isSeason = channel.channelType === 'season';
  const isNotJoined = !channel.visibleBy?.includes(userId || '');
  const state = subscribeStates[channel._id] || { status: 'idle' };
  const isInvitation = channel.joinPolicy === 'invitation';
  const presenceRequired = channel.presenceRequired ?? 0;
  const hasEnoughPresence = presenceRequired <= 0 || userPresence >= presenceRequired;
  const showJoinUi = !isGround && !isSeason;
  const needsMorePresence =
    showJoinUi &&
    isNotJoined &&
    !hasEnoughPresence &&
    (state.status === 'idle' || state.status === 'error');
  const presenceRequiredDays = state.presenceRequired ?? presenceRequired;

  const cdn = process.env.NEXT_PUBLIC_CDN_URL;
  const photoUrl =
    channel.photo &&
    (channel.photo.startsWith('http')
      ? channel.photo
      : cdn
        ? `${cdn}${channel.photo}-post-md.jpg`
        : null);

  const content = (
    <div
      className={`group flex items-center gap-2.5 mx-2 px-3 py-2.5 cursor-pointer transition-all rounded-xl min-h-[42px] ${
        isSelected ? 'bg-neutral-light/60' : 'hover:bg-neutral-light/80'
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {photoUrl ? (
        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-neutral">
          <img
            src={photoUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${channelTypeColor(channel.channelType)}`}
        >
          {channelTypeIcon(channel.channelType)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[13px] truncate ${isSelected ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}
          >
            {channel.name}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {channel.eventName && (
              <span className="text-[10px] text-accent bg-accent/5 px-1.5 py-0.5 rounded-md">
                {channel.eventName}
              </span>
            )}
            {unreadCount && unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-accent rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>
        <p className="text-[11px] text-gray-500/90 truncate mt-0.5">
          {channel.description || '\u00A0'}
        </p>
      </div>

      {needsMorePresence && (
        <span className="text-[10px] text-amber-600 flex-shrink-0">
          {presenceRequiredDays}+ {t('community_presence_days_suffix')}
        </span>
      )}
      {showJoinUi && isNotJoined && state.status === 'loading' && (
        <span className="text-[10px] text-gray-400 flex-shrink-0">...</span>
      )}
      {showJoinUi && isNotJoined && state.status === 'pending' && (
        <span className="text-[10px] text-amber-600 flex-shrink-0">
          {t('channels_pending_approval')}
        </span>
      )}
    </div>
  );

  if (onClick) {
    return content;
  }

  return (
    <Link href={`/channel/${channel.slug}`} className="block">
      {content}
    </Link>
  );
};

interface ChannelGroupSectionProps {
  group: ChannelGroup;
  selectedChannelId?: string | null;
  onSelectChannel?: (channel: Channel) => void;
  userId?: string;
  userPresence: number;
  subscribeStates: Record<string, SubscribeState>;
  onSubscribe: (channelId: string) => void;
  unreadCounts: Record<string, number>;
  t: TranslateFn;
}

const ChannelGroupSection = ({
  group,
  selectedChannelId,
  onSelectChannel,
  userId,
  userPresence,
  subscribeStates,
  onSubscribe,
  unreadCounts,
  t,
}: ChannelGroupSectionProps) => {
  if (group.channels.length === 0) return null;

  return (
    <div className="pb-1">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        {group.icon}
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em]">
          {group.label}
        </span>
      </div>
      <div>
        {group.channels.map((channel) => (
          <ChannelRow
            key={channel._id}
            channel={channel}
            isSelected={selectedChannelId === channel._id}
            onClick={
              onSelectChannel ? () => onSelectChannel(channel) : undefined
            }
            userId={userId}
            userPresence={userPresence}
            subscribeStates={subscribeStates}
            onSubscribe={onSubscribe}
            unreadCount={unreadCounts[channel._id]}
            t={t}
          />
        ))}
      </div>
    </div>
  );
};

const ChannelList = ({
  onSelectChannel,
  selectedChannelId,
  initialSlug,
  channels: controlledChannels,
  channelsLoading: controlledLoading,
  channelsError: controlledError,
  subscribeStates: controlledSubscribeStates,
  onSubscribe: controlledOnSubscribe,
  userPresence: controlledUserPresence,
  unreadCounts: controlledUnreadCounts,
}: ChannelListProps) => {
  const t = useTranslations() as TranslateFn;
  const { user } = useAuth();
  const internalUserPresence =
    (user?.stats?.wallet?.presence ?? user?.presence ?? 0) as number;
  const userPresence = controlledUserPresence ?? internalUserPresence;

  const [internalChannels, setInternalChannels] = useState<Channel[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalSubscribeStates, setInternalSubscribeStates] = useState<
    Record<string, SubscribeState>
  >({});

  const isControlled =
    controlledChannels !== undefined &&
    controlledOnSubscribe !== undefined &&
    controlledSubscribeStates !== undefined;
  const channels = isControlled ? controlledChannels! : internalChannels;
  const isLoading = isControlled ? (controlledLoading ?? false) : internalLoading;
  const error = isControlled ? controlledError ?? null : internalError;
  const subscribeStates = isControlled
    ? controlledSubscribeStates!
    : internalSubscribeStates;
  const handleSubscribe = isControlled
    ? controlledOnSubscribe!
    : async (channelId: string) => {
        const channel = (isControlled ? controlledChannels! : internalChannels).find(
          (c) => c._id === channelId,
        );
        const presenceRequired = channel?.presenceRequired ?? 0;
        if (presenceRequired > 0 && userPresence < presenceRequired) {
          setInternalSubscribeStates((prev) => ({
            ...prev,
            [channelId]: {
              status: 'error',
              presenceRequired,
              userPresence,
            },
          }));
          return;
        }

        setInternalSubscribeStates((prev) => ({
          ...prev,
          [channelId]: { status: 'loading' },
        }));

        try {
          const { data } = await api.post(`/channel/${channelId}/subscribe`);
          const msg = data?.message || '';

          if (msg.includes('Successfully subscribed')) {
            setInternalSubscribeStates((prev) => ({
              ...prev,
              [channelId]: { status: 'success' },
            }));
          } else if (msg.includes('request has been sent')) {
            setInternalSubscribeStates((prev) => ({
              ...prev,
              [channelId]: { status: 'pending' },
            }));
          } else {
            setInternalSubscribeStates((prev) => ({
              ...prev,
              [channelId]: { status: 'success' },
            }));
          }
        } catch (err: any) {
          const responseData = err.response?.data;
          const message = responseData?.message || err.message;
          setInternalSubscribeStates((prev) => ({
            ...prev,
            [channelId]: {
              status: 'error',
              message,
              presenceRequired: responseData?.presenceRequired,
              userPresence: responseData?.userPresence,
            },
          }));
        }
      };

  useEffect(() => {
    if (isControlled) return;

    const loadChannels = async () => {
      setInternalLoading(true);
      setInternalError(null);
      try {
        const { data } = await api.get('/channel', {
          params: { limit: 200, sort_by: 'name' },
        });
        const results = data.results || [];
        setInternalChannels(results);
        if (onSelectChannel && results.length > 0 && !selectedChannelId) {
          const match = initialSlug
            ? results.find((ch: Channel) => ch.slug === initialSlug)
            : null;
          onSelectChannel(match || results[0]);
        }
      } catch (err: any) {
        console.error('Load channels error', err);
        setInternalError(err.message);
      } finally {
        setInternalLoading(false);
      }
    };

    loadChannels();
  }, []);

  const groupedChannels: ChannelGroup[] = useMemo(() => {
    const seasons: Channel[] = [];
    const grounds: Channel[] = [];
    const topics: Channel[] = [];
    const legacy: Channel[] = [];
    const userId = user?._id;

    channels.forEach((ch) => {
      switch (ch.channelType) {
        case 'season':
          seasons.push(ch);
          break;
        case 'ground':
          if (ch.visibleBy?.includes(userId || '')) {
            grounds.push(ch);
          }
          break;
        case 'topic':
          topics.push(ch);
          break;
        default:
          legacy.push(ch);
          break;
      }
    });

    return [
      {
        type: 'season' as ChannelType,
        label: t('channels_group_seasons'),
        icon: <Calendar className="w-3.5 h-3.5 text-accent" />,
        channels: seasons,
      },
      {
        type: 'ground' as ChannelType,
        label: t('channels_group_ground'),
        icon: <MapPin className="w-3.5 h-3.5 text-green-600" />,
        channels: grounds,
      },
      {
        type: 'topic' as ChannelType,
        label: t('channels_group_topics'),
        icon: <Users className="w-3.5 h-3.5 text-purple-600" />,
        channels: topics,
      },
      {
        type: null,
        label: t('channels_group_general'),
        icon: <Hash className="w-3.5 h-3.5 text-gray-500" />,
        channels: legacy,
      },
    ];
  }, [channels, t, user?._id]);

  if (isLoading) {
    return <ChannelListSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (channels.length === 0) {
    return <EmptyChannels t={t} />;
  }

  return (
    <div className="py-2">
      {groupedChannels.map((group) => (
        <ChannelGroupSection
          key={group.type || 'legacy'}
          group={group}
          selectedChannelId={selectedChannelId}
          onSelectChannel={onSelectChannel}
          userId={user?._id}
          userPresence={userPresence}
          subscribeStates={subscribeStates}
          onSubscribe={handleSubscribe}
          unreadCounts={controlledUnreadCounts || {}}
          t={t}
        />
      ))}
    </div>
  );
};

export default ChannelList;
