import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Users,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import models from '../models';
import { Channel, ChannelType } from '../types/channel';
import api, { formatSearch } from '../utils/api';

const channelManagedNoteKey = (channelType: ChannelType): string => {
  switch (channelType) {
    case 'season':
      return 'community_channels_managed_note_season';
    case 'ground':
      return 'community_channels_managed_note_ground';
    case 'topic':
      return 'community_channels_managed_note_topic';
    default:
      return 'community_channels_managed_note_general';
  }
};
import ChannelList from './ChannelList';
import EditModel from './EditModel';
import OnGroundUsers from './OnGroundUsers';
import PostList from './PostList';
import ProfilePhoto from './ProfilePhoto';

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

interface BookingConfig {
  enabled?: boolean;
}

interface MemberHomeProps {
  initialChannelSlug?: string | null;
  bookingConfig?: BookingConfig | null;
}

interface ChannelMember {
  _id: string;
  screenname: string;
  slug: string;
  photo?: string;
}

const ChannelHeader = ({
  channel,
  members,
  onBack,
  isAdmin,
  t,
}: {
  channel: Channel;
  members: ChannelMember[];
  onBack: () => void;
  isAdmin: boolean;
  t: TranslateFn;
}) => (
  <div className="sticky top-0 z-10 border-b border-line/20 bg-white px-4 py-3 flex items-center gap-3">
    <button
      type="button"
      onClick={onBack}
      className="lg:hidden min-h-[44px] min-w-[44px] p-2 -ml-2 rounded-lg hover:bg-neutral-light transition-colors flex items-center justify-center"
    >
      <ArrowLeft className="w-5 h-5 text-gray-600" />
    </button>

    <div className="flex-1 min-w-0">
      <h2 className="text-sm font-bold text-foreground truncate">
        {channel.name}
      </h2>
      <div className="flex items-center gap-2 mt-0.5">
        {members.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1.5">
              {members.slice(0, 5).map((m) => (
                <div
                  key={m._id}
                  className="w-5 h-5 rounded-full overflow-hidden border border-white"
                >
                  <ProfilePhoto user={m} size="5" stack={false} />
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">
              {members.length} {t('community_channel_members_count')}
            </span>
          </div>
        )}
      </div>
    </div>

    {isAdmin && (
      <Link
        href={`/edit-channel/${channel.slug}`}
        className="text-sm text-gray-500 hover:text-accent transition-colors"
      >
        {t('edit_channel_title')}
      </Link>
    )}
  </div>
);

const ChannelContentArea = ({
  channel,
  onBack,
  noteDismissed,
  onDismissNote,
  t,
}: {
  channel: Channel;
  onBack: () => void;
  noteDismissed: boolean;
  onDismissNote: () => void;
  t: TranslateFn;
}) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<ChannelMember[]>([]);

  const isAdmin =
    user?.roles?.includes('admin') || channel.createdBy === user?._id;

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const { data } = await api.get('/user', {
          params: {
            where: formatSearch({ viewChannels: channel._id }),
            sort_by: '-created',
            limit: 20,
          },
        });
        setMembers(data.results || []);
      } catch (err) {
        console.error('Load members error', err);
      }
    };

    loadMembers();
  }, [channel._id]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ChannelHeader
        channel={channel}
        members={members}
        onBack={onBack}
        isAdmin={!!isAdmin}
        t={t}
      />

      {!noteDismissed && (
        <div className="px-4 py-2 border-b border-line/10 flex items-start gap-2">
          <p className="text-xs text-gray-500 flex-1">{t(channelManagedNoteKey(channel.channelType))}</p>
          <button
            type="button"
            onClick={onDismissNote}
            className="p-1 rounded hover:bg-neutral-light text-gray-500 shrink-0"
            aria-label={t('community_channels_note_dismiss')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {channel.description && (
        <div className="px-4 py-2 bg-neutral-light/50 border-b border-line/10">
          <p className="text-xs text-gray-500">{channel.description}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <PostList
          allowCreate
          parentType="channel"
          channel={channel._id}
          channelVisibleBy={channel.visibleBy}
        />
      </div>
    </div>
  );
};

const EmptyContentArea = ({ t }: { t: TranslateFn }) => (
  <div className="flex-1 flex items-center justify-center bg-neutral-light/30">
    <div className="text-center px-6">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/5 flex items-center justify-center">
        <MessageSquare className="w-8 h-8 text-accent/40" />
      </div>
      <h3 className="text-base font-semibold text-gray-400 mb-1">
        {t('community_select_channel')}
      </h3>
      <p className="text-sm text-gray-400">
        {t('community_select_channel_description')}
      </p>
    </div>
  </div>
);

export interface ChannelSubscribeState {
  status: 'idle' | 'loading' | 'success' | 'pending' | 'error';
  message?: string;
  presenceRequired?: number;
  userPresence?: number;
}

const ChannelPreviewJoin = ({
  channel,
  onBack,
  onSubscribe,
  subscribeState,
  noteDismissed,
  onDismissNote,
  t,
}: {
  channel: Channel;
  onBack: () => void;
  onSubscribe: (channelId: string) => void;
  subscribeState: ChannelSubscribeState;
  noteDismissed: boolean;
  onDismissNote: () => void;
  t: TranslateFn;
}) => {
  const [members, setMembers] = useState<ChannelMember[]>([]);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const { data } = await api.get('/user', {
          params: {
            where: formatSearch({ viewChannels: channel._id }),
            sort_by: '-created',
            limit: 20,
          },
        });
        setMembers(data.results || []);
      } catch (err) {
        console.error('Load members error', err);
      }
    };

    loadMembers();
  }, [channel._id]);

  const isGround = channel.channelType === 'ground';
  const isSeason = channel.channelType === 'season';
  const isAutoManaged = isGround || isSeason;
  const isInvitation = channel.joinPolicy === 'invitation';
  const presenceRequired = channel.presenceRequired ?? 0;
  const { user } = useAuth();
  const userPresence =
    (user?.stats?.wallet?.presence ?? user?.presence ?? 0) as number;
  const hasEnoughPresence = presenceRequired <= 0 || userPresence >= presenceRequired;
  const showPresenceHint =
    !isAutoManaged &&
    !hasEnoughPresence &&
    (subscribeState.status === 'idle' || subscribeState.status === 'error');
  const presenceHintDays = subscribeState.presenceRequired ?? presenceRequired;
  const presenceHintUserDays = subscribeState.userPresence ?? userPresence;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ChannelHeader
        channel={channel}
        members={members}
        onBack={onBack}
        isAdmin={false}
        t={t}
      />

      {!noteDismissed && (
        <div className="px-4 py-2 border-b border-line/10 flex items-start gap-2">
          <p className="text-xs text-gray-500 flex-1">{t(channelManagedNoteKey(channel.channelType))}</p>
          <button
            type="button"
            onClick={onDismissNote}
            className="p-1 rounded hover:bg-neutral-light text-gray-500 shrink-0"
            aria-label={t('community_channels_note_dismiss')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {channel.description && (
        <div className="px-4 py-2 bg-neutral-light/50 border-b border-line/10">
          <p className="text-xs text-gray-500">{channel.description}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {isAutoManaged ? (
          <p className="text-sm text-gray-600">
            {isGround ? t('community_channel_ground_managed') : t('community_channel_season_managed')}
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              {t('community_channel_preview_join_to_see')}
            </p>
            {showPresenceHint && (
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm font-semibold text-amber-900">
                  {t('channels_presence_required', { days: presenceHintDays })}
                </p>
                <p className="text-sm text-amber-800">
                  {t('channels_your_presence', { days: presenceHintUserDays })}
                </p>
                <p className="text-sm text-amber-800">
                  {t('channels_book_more_stays_hint')}
                </p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={!hasEnoughPresence || subscribeState.status === 'loading'}
                onClick={() => onSubscribe(channel._id)}
                className="w-full min-h-[44px] px-4 py-2 rounded-lg font-medium text-white bg-accent hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {subscribeState.status === 'loading'
                  ? '...'
                  : isInvitation
                    ? t('channels_request_join')
                    : t('channels_join_channel')}
              </button>
              {subscribeState.status === 'pending' && (
                <span className="text-xs text-amber-600">
                  {t('channels_pending_approval')}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const CreateChannelModal = ({
  isOpen,
  onClose,
  onCreated,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (channel: Channel) => void;
  t: TranslateFn;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line/20">
          <h2 className="text-lg font-bold text-foreground">
            {t('channel_create_title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-light transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <EditModel
            endpoint="/channel"
            fields={models.channel}
            onSave={(channel) => {
              onCreated(channel);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};

const MemberHome = ({
  initialChannelSlug,
  bookingConfig,
}: MemberHomeProps) => {
  const t = useTranslations() as TranslateFn;
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [mobileShowContent, setMobileShowContent] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [channelListKey, setChannelListKey] = useState(0);
  const [subscribeStates, setSubscribeStates] = useState<
    Record<string, ChannelSubscribeState>
  >({});
  const [channelManagementNoteDismissed, setChannelManagementNoteDismissed] = useState(false);

  const currentSlug =
    (router.query.channel as string) || initialChannelSlug || null;
  const userPresence =
    (user?.stats?.wallet?.presence ?? user?.presence ?? 0) as number;

  useEffect(() => {
    const loadChannels = async () => {
      setChannelsLoading(true);
      setChannelsError(null);
      try {
        const { data } = await api.get('/channel', {
          params: { limit: 200, sort_by: 'name' },
        });
        const results = data.results || [];
        setChannels(results);
        if (results.length > 0 && !selectedChannel) {
          const displayable = results.filter(
            (ch: Channel) =>
              ch.channelType !== 'ground' ||
              ch.visibleBy?.includes(user?._id || ''),
          );
          const match = currentSlug
            ? displayable.find((ch: Channel) => ch.slug === currentSlug)
            : null;
          const toSelect = currentSlug ? (match || displayable[0]) : null;
          setSelectedChannel(toSelect);
          setMobileShowContent(!!toSelect);
        }
      } catch (err: any) {
        console.error('Load channels error', err);
        setChannelsError(err.message);
      } finally {
        setChannelsLoading(false);
      }
    };

    loadChannels();
  }, [channelListKey, user?._id]);

  const handleSubscribe = async (channelId: string) => {
    const channel = channels.find((c) => c._id === channelId);
    const presenceRequired = channel?.presenceRequired ?? 0;
    if (presenceRequired > 0 && userPresence < presenceRequired) {
      setSubscribeStates((prev) => ({
        ...prev,
        [channelId]: {
          status: 'error',
          presenceRequired,
          userPresence,
        },
      }));
      return;
    }

    setSubscribeStates((prev) => ({
      ...prev,
      [channelId]: { status: 'loading' },
    }));

    try {
      const { data } = await api.post(`/channel/${channelId}/subscribe`);
      const msg = data?.message || '';

      if (msg.includes('Successfully subscribed')) {
        setSubscribeStates((prev) => ({
          ...prev,
          [channelId]: { status: 'success' },
        }));
        if (selectedChannel?._id === channelId && user?._id) {
          setSelectedChannel((prev) =>
            prev
              ? {
                  ...prev,
                  visibleBy: [...(prev.visibleBy || []), user._id],
                }
              : null,
          );
        }
        setChannelListKey((k) => k + 1);
      } else if (msg.includes('request has been sent')) {
        setSubscribeStates((prev) => ({
          ...prev,
          [channelId]: { status: 'pending' },
        }));
      } else {
        setSubscribeStates((prev) => ({
          ...prev,
          [channelId]: { status: 'success' },
        }));
        if (selectedChannel?._id === channelId && user?._id) {
          setSelectedChannel((prev) =>
            prev
              ? {
                  ...prev,
                  visibleBy: [...(prev.visibleBy || []), user._id],
                }
              : null,
          );
        }
        setChannelListKey((k) => k + 1);
      }
    } catch (err: any) {
      const responseData = err.response?.data;
      setSubscribeStates((prev) => ({
        ...prev,
        [channelId]: {
          status: 'error',
          presenceRequired: responseData?.presenceRequired,
          userPresence: responseData?.userPresence,
        },
      }));
    }
  };

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setMobileShowContent(true);
    router.push(
      { pathname: '/social', query: { channel: channel.slug } },
      undefined,
      { shallow: true },
    );
  };

  const handleBack = () => {
    setMobileShowContent(false);
    router.push('/social', undefined, { shallow: true });
  };

  const handleChannelCreated = (channel: Channel) => {
    setChannelListKey((k) => k + 1);
    handleSelectChannel(channel);
  };

  if (isLoading || !user) {
    return (
      <main className="main-content w-full">
        <div className="flex h-[calc(100vh-64px)]">
          <div className="w-80 border-r border-line/20 bg-white animate-pulse">
            <div className="p-4 border-b border-line/20">
              <div className="h-6 bg-neutral rounded w-1/2" />
            </div>
            <div className="p-3 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="w-10 h-10 bg-neutral rounded-full" />
                  <div className="flex-1">
                    <div className="h-3.5 bg-neutral rounded w-2/3 mb-1.5" />
                    <div className="h-3 bg-neutral rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-neutral-light/30" />
        </div>
      </main>
    );
  }

  return (
    <main className="main-content w-full pb-16 lg:pb-0">
      <div className="flex h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)]">
        <div
          className={`w-full lg:w-80 lg:flex-shrink-0 border-r border-line/20 bg-white flex flex-col ${
            mobileShowContent ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="sticky top-0 z-10 px-4 py-3 border-b border-line/20 bg-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              <h1 className="text-base font-bold text-foreground">
                {t('community_title')}
              </h1>
            </div>
            {user.roles?.includes('admin') && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-neutral-light transition-colors flex items-center justify-center"
                title={t('member_home_add_channel')}
              >
                <Plus className="w-5 h-5 text-accent" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <ChannelList
              key={channelListKey}
              channels={channels}
              channelsLoading={channelsLoading}
              channelsError={channelsError}
              onSelectChannel={handleSelectChannel}
              selectedChannelId={selectedChannel?._id}
              initialSlug={currentSlug}
              subscribeStates={subscribeStates}
              onSubscribe={handleSubscribe}
              userPresence={userPresence}
            />
          </div>

          <OnGroundUsers bookingConfig={bookingConfig} />

          <div className="border-t border-line/20 p-3 flex-shrink-0">
            <Link
              href="/members"
              className="flex items-center gap-2 min-h-[44px] px-3 py-3 rounded-lg hover:bg-neutral-light transition-colors text-sm text-gray-600"
            >
              <Users className="w-4 h-4" />
              <span>{t('community_browse_members')}</span>
            </Link>
          </div>
        </div>

        <div
          className={`flex-1 flex flex-col bg-white min-w-0 min-h-0 ${
            mobileShowContent ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {selectedChannel ? (
            selectedChannel.visibleBy?.includes(user?._id || '') ? (
              <ChannelContentArea
                channel={selectedChannel}
                onBack={handleBack}
                noteDismissed={channelManagementNoteDismissed}
                onDismissNote={() => setChannelManagementNoteDismissed(true)}
                t={t}
              />
            ) : (
              <ChannelPreviewJoin
                channel={selectedChannel}
                onBack={handleBack}
                onSubscribe={handleSubscribe}
                subscribeState={
                  subscribeStates[selectedChannel._id] || { status: 'idle' }
                }
                noteDismissed={channelManagementNoteDismissed}
                onDismissNote={() => setChannelManagementNoteDismissed(true)}
                t={t}
              />
            )
          ) : (
            <EmptyContentArea t={t} />
          )}
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-line/20 bg-white flex z-20 pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={() => setMobileShowContent(false)}
          className={`flex-1 flex items-center justify-center gap-2 min-h-[48px] py-3 text-sm transition-colors ${
            !mobileShowContent
              ? 'text-accent font-medium'
              : 'text-gray-500'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          {t('community_title')}
        </button>
        <Link
          href="/members"
          className={`flex-1 flex items-center justify-center gap-2 min-h-[48px] py-3 text-sm transition-colors ${
            'text-gray-500'
          }`}
        >
          <Users className="w-4 h-4" />
          {t('community_browse_members')}
        </Link>
      </div>

      <CreateChannelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleChannelCreated}
        t={t}
      />
    </main>
  );
};

export default MemberHome;
