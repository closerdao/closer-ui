import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import {
  ArrowLeft,
  Check,
  MessageSquare,
  Plus,
  Settings,
  Users,
  X,
  XCircle,
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

const getChannelMemberIds = (channel: Channel): string[] =>
  Array.from(
    new Set([channel.createdBy, ...(channel.visibleBy || [])].filter(Boolean)),
  );

const ChannelHeader = ({
  channel,
  members,
  onBack,
  isAdmin,
  isEditing,
  onToggleEdit,
  t,
}: {
  channel: Channel;
  members: ChannelMember[];
  onBack: () => void;
  isAdmin: boolean;
  isEditing?: boolean;
  onToggleEdit?: () => void;
  t: TranslateFn;
}) => {
  const cdn = process.env.NEXT_PUBLIC_CDN_URL;
  return (
  <div className="sticky top-0 z-10 border-b border-line/10 bg-white/95 backdrop-blur px-4 py-3 flex items-center gap-3">
    <button
      type="button"
      onClick={onBack}
      className="lg:hidden min-h-[40px] min-w-[40px] p-2 -ml-2 rounded-lg hover:bg-neutral-light transition-colors flex items-center justify-center"
    >
      <ArrowLeft className="w-4 h-4 text-gray-600" />
    </button>

    {channel.photo && cdn ? (
      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-light">
        <img
          src={`${cdn}${channel.photo}-post-md.jpg`}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
    ) : null}

    <div className="flex-1 min-w-0">
      <h2 className="text-[13px] font-semibold text-foreground truncate">
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
            <span className="text-[11px] text-gray-500 ml-1">
              {members.length} {t('community_channel_members_count')}
            </span>
          </div>
        )}
      </div>
    </div>

    {isAdmin && onToggleEdit && (
      <button
        type="button"
        onClick={onToggleEdit}
        className={`p-2 rounded-lg transition-colors ${
          isEditing
            ? 'bg-accent/[0.08] text-accent'
            : 'text-gray-400 hover:text-accent hover:bg-neutral-light/80'
        }`}
        title={t('edit_channel_title')}
      >
        <Settings className="w-4 h-4" />
      </button>
    )}
  </div>
  );
};

type ChannelTab = 'posts' | 'members';
type SocialTab = ChannelTab | 'edit';

const ChannelContentArea = ({
  channel,
  onBack,
  onChannelUpdated,
  noteDismissed,
  onDismissNote,
  initialTab,
  onTabChange,
  t,
}: {
  channel: Channel;
  onBack: () => void;
  onChannelUpdated?: () => void;
  noteDismissed: boolean;
  onDismissNote: () => void;
  initialTab: SocialTab;
  onTabChange?: (tab: SocialTab) => void;
  t: TranslateFn;
}) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [pendingUsers, setPendingUsers] = useState<ChannelMember[]>([]);
  const [isEditing, setIsEditing] = useState(initialTab === 'edit');
  const [activeTab, setActiveTab] = useState<ChannelTab>(
    initialTab === 'members' ? 'members' : 'posts',
  );
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const isOwner = channel.createdBy === user?._id;
  const isAdmin =
    user?.roles?.includes('admin') || isOwner;

  useEffect(() => {
    if (initialTab === 'edit' && isAdmin) {
      setIsEditing(true);
      setActiveTab('posts');
      return;
    }

    setIsEditing(false);
    setActiveTab(initialTab === 'members' ? 'members' : 'posts');
  }, [channel._id, initialTab, isAdmin]);

  useEffect(() => {
    const loadMembers = async () => {
      const memberIds = getChannelMemberIds(channel);
      if (memberIds.length === 0) {
        setMembers([]);
        return;
      }

      try {
        const { data } = await api.get('/user', {
          params: {
            where: formatSearch({ _id: { $in: memberIds } }),
            sort_by: '-created',
            limit: 200,
          },
        });
        const byId = new Map((data.results || []).map((m: ChannelMember) => [m._id, m]));
        setMembers(
          memberIds
            .map((id) => byId.get(id))
            .filter((m): m is ChannelMember => Boolean(m)),
        );
      } catch (err) {
        console.error('Load members error', err);
      }
    };

    loadMembers();
  }, [channel._id, channel.createdBy, channel.visibleBy]);

  // Load pending users if owner and there are pending IDs
  useEffect(() => {
    if (!isOwner || !channel.pendingUserIds?.length) {
      setPendingUsers([]);
      return;
    }

    const loadPendingUsers = async () => {
      try {
        const { data } = await api.get('/user', {
          params: {
            where: formatSearch({ _id: { $in: channel.pendingUserIds } }),
            limit: 100,
          },
        });
        setPendingUsers(data.results || []);
      } catch (err) {
        console.error('Load pending users error', err);
      }
    };

    loadPendingUsers();
  }, [channel._id, channel.pendingUserIds, isOwner]);

  const handleEditSave = () => {
    setIsEditing(false);
    onTabChange?.('posts');
    onChannelUpdated?.();
  };

  const handleApproveUser = async (userId: string) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const newPending = (channel.pendingUserIds || []).filter((id) => id !== userId);
      const newVisible = [...(channel.visibleBy || []), userId];
      await api.patch(`/channel/${channel._id}`, {
        pendingUserIds: newPending,
        visibleBy: newVisible,
      });
      setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
      // Reload members list to include new member
      const memberIds = Array.from(new Set([channel.createdBy, ...newVisible]));
      const { data } = await api.get('/user', {
        params: {
          where: formatSearch({ _id: { $in: memberIds } }),
          sort_by: '-created',
          limit: 200,
        },
      });
      const byId = new Map((data.results || []).map((m: ChannelMember) => [m._id, m]));
      setMembers(
        memberIds
          .map((id) => byId.get(id))
          .filter((m): m is ChannelMember => Boolean(m)),
      );
      onChannelUpdated?.();
    } catch (err) {
      console.error('Approve user error', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleRejectUser = async (userId: string) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const newPending = (channel.pendingUserIds || []).filter((id) => id !== userId);
      await api.patch(`/channel/${channel._id}`, {
        pendingUserIds: newPending,
      });
      setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
      onChannelUpdated?.();
    } catch (err) {
      console.error('Reject user error', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const pendingCount = isOwner ? (channel.pendingUserIds?.length || 0) : 0;

  return (
    <div className="flex flex-col min-h-0 bg-white rounded-none lg:rounded-2xl lg:m-3 lg:shadow-sm lg:border lg:border-line/10 overflow-hidden">
      <ChannelHeader
        channel={channel}
        members={members}
        onBack={onBack}
        isAdmin={!!isAdmin}
        isEditing={isEditing}
        onToggleEdit={() => {
          if (isEditing) {
            setIsEditing(false);
            setActiveTab('posts');
            onTabChange?.('posts');
            return;
          }

          setIsEditing(true);
          onTabChange?.('edit');
        }}
        t={t}
      />

      {isEditing && isAdmin && (
        <div className="border-b border-line/10 bg-neutral-light/20 p-4">
          <EditModel
            id={channel._id}
            endpoint="/channel"
            fields={models.channel}
            onSave={handleEditSave}
            onUpdate={async (name, option, actionType) => {
              if (actionType === 'ADD' && name === 'visibleBy' && option._id) {
                await api.post(`/moderator/channel/${channel._id}/add`, option);
              }
            }}
          />
        </div>
      )}

      {!isEditing && (
        <div className="flex border-b border-line/10 bg-white px-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setActiveTab('posts');
              onTabChange?.('posts');
            }}
            className={`flex-1 py-2 text-sm font-medium transition-colors rounded-lg ${
              activeTab === 'posts'
                ? 'bg-accent/[0.08] text-accent'
                : 'text-gray-500 hover:text-foreground hover:bg-neutral-light/70'
            }`}
          >
            {t('channel_tab_posts')}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setActiveTab('members');
              onTabChange?.('members');
            }}
            className={`flex-1 py-2 text-sm font-medium transition-colors rounded-lg flex items-center justify-center gap-1.5 ${
              activeTab === 'members'
                ? 'bg-accent/[0.08] text-accent'
                : 'text-gray-500 hover:text-foreground hover:bg-neutral-light/70'
            }`}
          >
            {t('channel_tab_members')}
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      )}

      {!isEditing && activeTab === 'posts' && (
        <>
          {!noteDismissed && (
            <div className="mx-3 mt-3 px-3 py-2 border border-line/10 rounded-lg bg-neutral-light/20 flex items-start gap-2">
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
            <div className="mx-3 mt-2 px-3 py-2 bg-neutral-light/30 border border-line/10 rounded-lg">
              <p className="text-xs text-gray-500">{channel.description}</p>
            </div>
          )}

          <div className="p-3 lg:p-4">
            <PostList
              allowCreate
              parentType="channel"
              channel={channel._id}
              channelVisibleBy={channel.visibleBy}
            />
          </div>
        </>
      )}

      {!isEditing && activeTab === 'members' && (
        <div className="p-4 lg:p-5">
          {/* Pending join requests (visible to channel owner only) */}
          {isOwner && pendingUsers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                {t('channel_pending_requests')} ({pendingUsers.length})
              </h3>
              <div className="space-y-2">
                {pendingUsers.map((pendingUser) => (
                  <div
                    key={pendingUser._id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200/70"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                      <ProfilePhoto user={pendingUser} size="9" stack={false} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {pendingUser.screenname}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleApproveUser(pendingUser._id)}
                        disabled={actionLoading[pendingUser._id]}
                        className="min-h-[36px] min-w-[36px] p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50 shadow-sm"
                        title={t('channel_approve_user')}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectUser(pendingUser._id)}
                        disabled={actionLoading[pendingUser._id]}
                        className="min-h-[36px] min-w-[36px] p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 shadow-sm"
                        title={t('channel_reject_user')}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All channel members (owner first, then others) */}
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            {t('channel_members_list')} ({members.length})
          </h3>
          {members.length === 0 ? (
            <p className="text-sm text-gray-500">{t('channel_no_members')}</p>
          ) : (
            <div className="space-y-1.5">
              {[...members]
                .sort((a, b) =>
                  a._id === channel.createdBy ? -1 : b._id === channel.createdBy ? 1 : 0,
                )
                .map((member) => (
                <div
                  key={member._id}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-line/10 hover:bg-neutral-light/40 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                    <ProfilePhoto user={member} size="9" stack={false} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.screenname}
                    </p>
                  </div>
                  {member._id === channel.createdBy && (
                    <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full flex-shrink-0">
                      {t('channel_owner_badge')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const EmptyContentArea = ({ t }: { t: TranslateFn }) => (
  <div className="flex-1 flex items-center justify-center bg-white lg:m-3 lg:rounded-2xl lg:border lg:border-line/10">
    <div className="text-center px-6">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent/5 flex items-center justify-center">
        <MessageSquare className="w-7 h-7 text-accent/40" />
      </div>
      <h3 className="text-sm font-semibold text-gray-500 mb-1">
        {t('community_select_channel')}
      </h3>
      <p className="text-sm text-gray-400 max-w-sm">
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
      const memberIds = getChannelMemberIds(channel).slice(0, 20);
      if (memberIds.length === 0) {
        setMembers([]);
        return;
      }

      try {
        const { data } = await api.get('/user', {
          params: {
            where: formatSearch({ _id: { $in: memberIds } }),
            sort_by: '-created',
            limit: 20,
          },
        });
        const byId = new Map((data.results || []).map((m: ChannelMember) => [m._id, m]));
        setMembers(
          memberIds
            .map((id) => byId.get(id))
            .filter((m): m is ChannelMember => Boolean(m)),
        );
      } catch (err) {
        console.error('Load members error', err);
      }
    };

    loadMembers();
  }, [channel._id, channel.createdBy, channel.visibleBy]);

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
    <div className="flex flex-col min-h-0 bg-white rounded-none lg:rounded-2xl lg:m-3 lg:shadow-sm lg:border lg:border-line/10 overflow-hidden">
      <ChannelHeader
        channel={channel}
        members={members}
        onBack={onBack}
        isAdmin={false}
        t={t}
      />

      {!noteDismissed && (
        <div className="mx-3 mt-3 px-3 py-2 border border-line/10 rounded-lg bg-neutral-light/20 flex items-start gap-2">
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
        <div className="mx-3 mt-2 px-3 py-2 bg-neutral-light/30 border border-line/10 rounded-lg">
          <p className="text-xs text-gray-500">{channel.description}</p>
        </div>
      )}

      <div className="p-4 lg:p-5 flex flex-col gap-5">
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
                className="w-full min-h-[44px] px-4 py-2 rounded-lg font-medium text-white bg-accent hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
  const { user, isLoading, refetchUser } = useAuth();
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
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const currentSlug =
    typeof router.query.channel === 'string'
      ? router.query.channel
      : initialChannelSlug || null;
  const requestedTab =
    router.query.tab === 'members' || router.query.tab === 'edit'
      ? (router.query.tab as SocialTab)
      : 'posts';
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
      } catch (err: any) {
        console.error('Load channels error', err);
        setChannelsError(err.message);
      } finally {
        setChannelsLoading(false);
      }
    };

    loadChannels();
  }, [channelListKey, user?._id]);

  useEffect(() => {
    if (channels.length === 0) {
      setSelectedChannel(null);
      setMobileShowContent(false);
      return;
    }

    const displayable = channels.filter(
      (ch: Channel) =>
        ch.channelType !== 'ground' || ch.visibleBy?.includes(user?._id || ''),
    );

    if (!currentSlug) {
      setSelectedChannel(null);
      setMobileShowContent(false);
      return;
    }

    const match = displayable.find((ch: Channel) => ch.slug === currentSlug);
    const toSelect = match || displayable[0] || null;
    setSelectedChannel(toSelect);
    setMobileShowContent(!!toSelect);
  }, [channels, currentSlug, user?._id]);

  // Fetch unread post counts for all joined channels
  useEffect(() => {
    if (!user || channels.length === 0) return;

    const socialSettings = user.settings?.social || {};
    const joinedChannels = channels.filter((ch) =>
      ch.visibleBy?.includes(user._id),
    );

    if (joinedChannels.length === 0) return;

    const fetchUnreadCounts = async () => {
      const counts: Record<string, number> = {};

      await Promise.all(
        joinedChannels.map(async (ch) => {
          try {
            const entry = socialSettings[ch._id];
            const lastFetched =
              (typeof entry === 'object' && entry !== null && 'lastFetched' in entry
                ? (entry as { lastFetched?: string }).lastFetched
                : null) ?? (typeof socialSettings[ch.slug] === 'string' ? socialSettings[ch.slug] : null);
            const where: Record<string, any> = { channel: ch._id };
            if (lastFetched) {
              where.created = { $gt: lastFetched };
            }
            const { data } = await api.get('/count/post', {
              params: {
                where: formatSearch(where),
              },
            });
            const count = data?.count ?? data?.results ?? 0;
            if (count > 0) {
              counts[ch._id] = count;
            }
          } catch (err) {
            // Silently ignore count errors for individual channels
          }
        }),
      );

      setUnreadCounts(counts);
    };

    fetchUnreadCounts();
  }, [channels, user?._id, channelListKey]);

  const saveLastFetched = async (channel: Channel) => {
    if (!user) return;
    try {
      const now = new Date().toISOString();
      const currentSocial = (user.settings?.social || {}) as Record<
        string,
        { lastFetched?: string } | string
      >;
      const existing = currentSocial[channel._id];
      const existingObj =
        typeof existing === 'object' && existing !== null && !Array.isArray(existing)
          ? existing
          : {};
      await api.patch('/mine/user', {
        settings: {
          ...user.settings,
          social: {
            ...currentSocial,
            [channel._id]: { ...existingObj, lastFetched: now },
          },
        },
      });
      setUnreadCounts((prev) => {
        const next = { ...prev };
        delete next[channel._id];
        return next;
      });
      refetchUser();
    } catch (err) {
      console.error('Failed to save lastFetched', err);
    }
  };

  useEffect(() => {
    if (
      !user ||
      !selectedChannel ||
      (!selectedChannel.visibleBy?.includes(user._id) &&
        selectedChannel.createdBy !== user._id)
    )
      return;
    saveLastFetched(selectedChannel);
  }, [selectedChannel?._id, user?._id]);

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
      {
        pathname: '/social/[channel]',
        query: { channel: channel.slug },
      },
      undefined,
      { shallow: true },
    );
  };

  const handleTabChange = (tab: SocialTab) => {
    if (!selectedChannel?.slug) return;

    router.push(
      {
        pathname: '/social/[channel]',
        query:
          tab === 'posts'
            ? { channel: selectedChannel.slug }
            : { channel: selectedChannel.slug, tab },
      },
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
        <div className="flex h-[calc(100vh-64px)] bg-neutral-light/20">
          <div className="w-80 border-r border-line/10 bg-white animate-pulse">
            <div className="p-4 border-b border-line/10">
              <div className="h-6 bg-neutral rounded w-1/2" />
            </div>
            <div className="p-3 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-2.5 p-2">
                  <div className="w-9 h-9 bg-neutral rounded-full" />
                  <div className="flex-1">
                    <div className="h-3 bg-neutral rounded w-2/3 mb-1" />
                    <div className="h-2.5 bg-neutral rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-neutral-light/10" />
        </div>
      </main>
    );
  }

  return (
    <main className="main-content w-full pt-28 pb-0 lg:pt-0">
      <div className="flex min-h-[calc(100vh-64px)] bg-neutral-light/15">
        <div
          className={`w-full lg:w-80 lg:flex-shrink-0 border-r border-line/10 bg-white lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto flex flex-col ${
            mobileShowContent ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="sticky top-0 z-10 px-4 py-3 border-b border-line/10 bg-white/95 backdrop-blur flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent" />
              <h1 className="text-[15px] font-semibold text-foreground">
                {t('community_title')}
              </h1>
            </div>
            {user.roles?.includes('admin') && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="min-h-[40px] min-w-[40px] p-2 rounded-lg hover:bg-neutral-light transition-colors flex items-center justify-center"
                title={t('member_home_add_channel')}
              >
                <Plus className="w-4 h-4 text-accent" />
              </button>
            )}
          </div>

          <div className="flex-1">
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
              unreadCounts={unreadCounts}
            />
          </div>

          <OnGroundUsers bookingConfig={bookingConfig} />

          <div className="border-t border-line/10 p-3 flex-shrink-0">
            <Link
              href="/members"
              className="flex items-center gap-2 min-h-[40px] px-3 py-2.5 rounded-xl hover:bg-neutral-light transition-colors text-sm text-gray-600"
            >
              <Users className="w-4 h-4" />
              <span>{t('community_browse_members')}</span>
            </Link>
          </div>
        </div>

        <div
          className={`flex-1 flex flex-col bg-neutral-light/10 min-w-0 ${
            mobileShowContent ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {selectedChannel ? (
            selectedChannel.visibleBy?.includes(user?._id || '') ||
            selectedChannel.createdBy === user?._id ? (
              <ChannelContentArea
                channel={selectedChannel}
                onBack={handleBack}
                onChannelUpdated={() => setChannelListKey((k) => k + 1)}
                noteDismissed={channelManagementNoteDismissed}
                onDismissNote={() => setChannelManagementNoteDismissed(true)}
                initialTab={requestedTab}
                onTabChange={handleTabChange}
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

      <div className="lg:hidden fixed top-16 left-0 right-0 border-b border-line/10 bg-white/95 backdrop-blur flex z-20">
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
